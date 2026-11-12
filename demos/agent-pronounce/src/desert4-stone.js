// Stone shading for the desert v4 set: a patch for a Poly Haven PBR MeshStandardMaterial that
//  - maps every texture triplanar in world space (dominant-axis projection), so nothing stretches
//    on ramps, rounded edges or steps and every piece has the same texel density;
//  - breaks the tiling by blending a second, rotated sample at another scale through a noise mask,
//    and by a low-frequency two-colour tint;
//  - adds sand in the joints of upward faces (from the AO channel), a sand drift at the base of
//    walls, and a darker band above the drift where the sand meets the stone.
// Deterministic: value noise on the world position, no clocks or random numbers.
//   stone(material, { scale, tintA, tintB, sand, ground, drift, band, joint, mix2, cover })
import * as THREE from 'three';

const NOISE = /* glsl */ `
float tpHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float tpNoise(vec3 x) {
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(tpHash(i), tpHash(i + vec3(1,0,0)), f.x), mix(tpHash(i + vec3(0,1,0)), tpHash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(tpHash(i + vec3(0,0,1)), tpHash(i + vec3(1,0,1)), f.x), mix(tpHash(i + vec3(0,1,1)), tpHash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float tpFbm(vec3 p) { return 0.55 * tpNoise(p) + 0.3 * tpNoise(p * 2.03 + 11.0) + 0.15 * tpNoise(p * 4.1 + 23.0); }
`;

const chunk = (name) => THREE.ShaderChunk[name];

export function stone(mat, { scale = 2.5, tintA = '#FFFFFF', tintB = '#E6DDD0', sand = '#D9C6A5', ground = 0, drift = 0.35, band = 1.1, bandDark = 0.72, joint = 0.8, mix2 = 1, cover = 0 } = {}) {
  const U = {
    tpScale: { value: scale }, tpTintA: { value: new THREE.Color(tintA) }, tpTintB: { value: new THREE.Color(tintB) },
    tpSand: { value: new THREE.Color(sand) }, tpGround: { value: ground }, tpDrift: { value: drift }, tpBand: { value: band },
    tpBandDark: { value: bandDark }, tpJoint: { value: joint }, tpMix2: { value: mix2 }, tpCover: { value: cover },
  };
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, r) => {
    prev?.call(mat, sh, r);
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace('void main() {', 'varying vec3 vTpPos; varying vec3 vTpNrm;\nvoid main() {')
      .replace('#include <project_vertex>', `#include <project_vertex>
  vec4 tpW = vec4(transformed, 1.0);
  vec3 tpNo = objectNormal;
  #ifdef USE_INSTANCING
  tpW = instanceMatrix * tpW; tpNo = mat3(instanceMatrix) * tpNo;
  #endif
  vTpPos = (modelMatrix * tpW).xyz;
  vTpNrm = normalize(mat3(modelMatrix) * tpNo);`);
    const uvd = (s) => s.replace(/vMapUv|vNormalMapUv|vRoughnessMapUv|vMetalnessMapUv|vAoMapUv/g, 'tpUv');
    sh.fragmentShader = sh.fragmentShader
      .replace('void main() {', `varying vec3 vTpPos; varying vec3 vTpNrm;
uniform float tpScale, tpGround, tpDrift, tpBand, tpBandDark, tpJoint, tpMix2, tpCover;
uniform vec3 tpTintA, tpTintB, tpSand;
${NOISE}
void main() {
  vec3 tpN = normalize(vTpNrm); vec3 tpA = abs(tpN);
  vec2 tpUv = (tpA.y > max(tpA.x, tpA.z) ? vTpPos.xz : (tpA.x > tpA.z ? vTpPos.zy : vTpPos.xy)) / tpScale;`)
      .replace('#include <map_fragment>', `#ifdef USE_MAP
  vec4 tpC1 = texture2D(map, tpUv);
  vec4 tpC2 = texture2D(map, mat2(0.8, -0.6, 0.6, 0.8) * tpUv * 0.43 + vec2(0.31, 0.67));
  float tpM = smoothstep(0.32, 0.68, tpFbm(vTpPos * 0.16 + 3.0)) * tpMix2;
  diffuseColor *= mix(tpC1, tpC2, tpM);
#endif
  {
    diffuseColor.rgb *= mix(tpTintA, tpTintB, smoothstep(0.25, 0.75, tpFbm(vTpPos * 0.045 + 7.0)));
    float tpH = vTpPos.y - tpGround;
    float tpWob = (tpFbm(vTpPos * vec3(0.9, 0.0, 0.9) + 5.0) - 0.5);
    float tpSide = 1.0 - smoothstep(0.55, 0.9, tpA.y);
    diffuseColor.rgb *= mix(tpBandDark, 1.0, smoothstep(0.0, tpBand, tpH + tpWob * 0.4)) * mix(1.0, 1.0, tpSide);
    float tpDr = (1.0 - smoothstep(0.0, tpDrift, tpH + tpWob * tpDrift * 1.4));
    float tpJ = 0.0;
  #ifdef USE_AOMAP
    tpJ = (1.0 - smoothstep(0.3, 0.75, texture2D(aoMap, tpUv).r)) * smoothstep(0.6, 0.92, tpN.y) * tpJoint;
  #endif
    float tpDust = smoothstep(0.75, 0.98, tpN.y) * 0.18;
    // wind-blown sand lying over upward faces in soft-edged patches
    float tpCv = 0.0;
    if (tpCover > 0.0) {
      float tpF = tpFbm(vec3(vTpPos.x * 0.42, 0.0, vTpPos.z * 0.42)) + 0.12 * tpFbm(vTpPos * 3.1);
      tpCv = smoothstep(0.62 - tpCover * 0.32, 0.7 - tpCover * 0.32, tpF) * smoothstep(0.6, 0.9, tpN.y);
    }
    vec3 tpSandC = tpSand * (0.8 + 0.22 * tpNoise(vTpPos * 9.0) + 0.12 * tpNoise(vTpPos * 37.0)) * mix(0.82, 1.0, tpFbm(vTpPos * 0.9));
    diffuseColor.rgb = mix(diffuseColor.rgb, tpSandC, clamp(max(max(max(tpDr * 0.9, tpJ), tpDust), tpCv), 0.0, 1.0));
  }`)
      .replace('#include <roughnessmap_fragment>', uvd(chunk('roughnessmap_fragment')))
      .replace('#include <metalnessmap_fragment>', uvd(chunk('metalnessmap_fragment')))
      .replace('#include <normal_fragment_begin>', uvd(chunk('normal_fragment_begin')))
      .replace('#include <normal_fragment_maps>', uvd(chunk('normal_fragment_maps')))
      .replace('#include <aomap_fragment>', uvd(chunk('aomap_fragment')));
  };
  mat.customProgramCacheKey = () => 'stone1';
  mat.userData.stone = U;
  mat.needsUpdate = true;
  return mat;
}
