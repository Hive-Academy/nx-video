// Lights for both worlds, plus the faint visible cones from the stage lamps.
// Key: warm #FFD9A8 from upper left, PCF-soft shadow-mapped. Rim: cool #7FD3FF from behind.
import * as THREE from 'three';

function keyLight(scene, { color = '#FFD9A8', intensity = 2.6, pos, target, extent = 4.5, mapSize = 2048 }) {
  const key = new THREE.DirectionalLight(color, intensity);
  key.position.copy(pos);
  key.target.position.copy(target);
  key.castShadow = true;
  key.shadow.mapSize.set(mapSize, mapSize);
  const c = key.shadow.camera;
  c.left = -extent; c.right = extent; c.top = extent; c.bottom = -extent;
  c.near = 0.5; c.far = 30;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  scene.add(key, key.target);
  return key;
}

// Additive cone of light: brightest at the lamp, fading along its length and at
// grazing angles. Peak opacity is capped at `opacity` (<= 0.08 by spec).
export function lightCone(from, to, { radius = 1.2, opacity = 0.07, color = '#FFD9A8' } = {}) {
  const length = from.distanceTo(to);
  const geo = new THREE.CylinderGeometry(0.12, radius, length, 48, 12, true);
  geo.translate(0, -length / 2, 0); // apex at origin, opening along -Y
  const mat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uOpacity: { value: Math.min(0.08, opacity) }, uLength: { value: length } },
    vertexShader: `
      varying float vAlong; varying vec3 vNormalW; varying vec3 vPosW;
      uniform float uLength;
      void main(){
        vAlong = clamp(-position.y / uLength, 0.0, 1.0);
        vec4 w = modelMatrix * vec4(position, 1.0);
        vPosW = w.xyz;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: `
      varying float vAlong; varying vec3 vNormalW; varying vec3 vPosW;
      uniform vec3 uColor; uniform float uOpacity;
      void main(){
        vec3 v = normalize(cameraPosition - vPosW);
        float facing = pow(abs(dot(normalize(vNormalW), v)), 1.6);
        float fall = pow(1.0 - vAlong, 1.4) * smoothstep(0.0, 0.06, vAlong);
        // fade out near the lens so a camera inside the cone never sees a hard edge
        float near = smoothstep(0.6, 2.4, distance(cameraPosition, vPosW));
        float a = clamp(uOpacity * facing * fall * near, 0.0, 0.08);
        gl_FragColor = vec4(uColor * a, 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    fog: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(from);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), to.clone().sub(from).normalize());
  mesh.renderOrder = 5;
  mesh.userData.noDepth = true;
  mesh.frustumCulled = false;
  return mesh;
}

// Temple lighting: warm gold key from upper left (the only shadow caster), a faint
// cool rim so the white robots separate from the dark hall, a warm skylight spot on
// the dais, and very little fill: deep shadows like the painting.
export function buildTempleLights(scene) {
  const key = keyLight(scene, { color: '#FFC98A', pos: new THREE.Vector3(-4.2, 7.2, 5.2), target: new THREE.Vector3(0, 0.8, -0.8), intensity: 2.7, extent: 4.6 });
  // steep, so its specular on the glossy floor never points back at the cameras
  const rim = new THREE.DirectionalLight('#7FD3FF', 0.45);
  rim.position.set(2.2, 10, -5.5);
  rim.target.position.set(0, 1, -0.5);
  scene.add(rim, rim.target);
  scene.add(new THREE.HemisphereLight('#FFD9A8', '#140D07', 0.42));
  const fill = new THREE.DirectionalLight('#FFDDB5', 0.3);
  fill.position.set(4, 2.5, 6);
  scene.add(fill);
  const sky = new THREE.SpotLight('#FFE6BC', 38, 15, 0.42, 0.85, 1.4);
  sky.position.set(0.3, 9.5, -1.6);
  sky.target.position.set(0, 0.78, -0.6);
  scene.add(sky, sky.target);
  return { key, rim, sky };
}

export function buildStudioLights(scene, lamps) {
  const key = keyLight(scene, { pos: new THREE.Vector3(-4.2, 7.2, 5.2), target: new THREE.Vector3(0, 0.8, -0.8), intensity: 3.0, extent: 4.6 });
  const rim = new THREE.DirectionalLight('#7FD3FF', 1.7);
  rim.position.set(2.8, 4.2, -6.5);
  rim.target.position.set(0, 1, -0.5);
  scene.add(rim, rim.target);
  scene.add(new THREE.HemisphereLight('#FFF2DE', '#1D4450', 0.8));
  const fill = new THREE.DirectionalLight('#BFD8E6', 0.35);
  fill.position.set(4, 2.5, 6);
  scene.add(fill);
  // practical stage lamps: a pool of warm light each, plus a faint visible cone
  const spots = lamps.map((lamp) => {
    const target = new THREE.Vector3(0, 0.78, -0.3);
    const spot = new THREE.SpotLight('#FFD2A0', 30, 9, 0.36, 0.65, 1.6);
    spot.position.copy(lamp.headWorld);
    spot.target.position.copy(target);
    scene.add(spot, spot.target);
    scene.add(lightCone(lamp.headWorld.clone(), target.clone().add(new THREE.Vector3(0, -0.3, 0)), { radius: 1.05, opacity: 0.075 }));
    return spot;
  });
  return { key, rim, spots };
}

// Booth / punch lighting: soft key from camera right (the side the robot looks to),
// so the robot's shadow falls left, away from the quiet right half of frame.
export function buildBoothLights(scene, { robotPos, wallColor }) {
  const key = keyLight(scene, {
    pos: robotPos.clone().add(new THREE.Vector3(2.4, 2.6, 3.2)),
    target: robotPos.clone().add(new THREE.Vector3(0, 0.4, 0)),
    intensity: 2.4,
    extent: 2.2,
    mapSize: 1024,
  });
  key.shadow.radius = 6;
  const rim = new THREE.DirectionalLight('#7FD3FF', 1.1);
  rim.position.copy(robotPos).add(new THREE.Vector3(-1.5, 2.2, -2.5));
  rim.target.position.copy(robotPos);
  scene.add(rim, rim.target);
  scene.add(new THREE.HemisphereLight('#FFF2DE', new THREE.Color(wallColor).multiplyScalar(0.4), 0.85));
  const fill = new THREE.DirectionalLight('#FFE8D0', 0.45);
  fill.position.copy(robotPos).add(new THREE.Vector3(-3, 0.5, 3));
  scene.add(fill);
  return { key, rim };
}
