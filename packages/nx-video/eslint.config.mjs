import { builtinModules } from 'node:module';
import rootConfig from '../../eslint.config.mjs';
import {
  ENGINE_ZONES,
  ENGINE_ZONE_MESSAGE,
  PIN_LITERAL_ALLOWED_FILES,
} from '../../tools/eslint/engine-zones.mjs';

const sourceExtensions = '*.{ts,tsx,mjs,js}';
const fileGlobs = (zone) => zone.globs.map((glob) => glob.replace(/\*\*$/, `**/${sourceExtensions}`));
const remotionZone = ENGINE_ZONES.find((zone) => zone.id === 'remotion');
const pinSelectors = [
  { selector: 'Literal[value=/hyperframes@|remotion@/]', message: `${ENGINE_ZONE_MESSAGE}; keep engine pins in versions.ts` },
  { selector: 'Literal[value=/@remotion\\/[^@]+@/]', message: `${ENGINE_ZONE_MESSAGE}; keep engine pins in versions.ts` },
];
const effectiveZone = (zone) => (zone.id === 'studio' || zone.id === 'scripts')
  ? { ...zone, forbidden: [...remotionZone.forbidden, ...zone.forbidden] }
  : zone;
const importPatterns = (zone) => [...new Set(zone.forbidden.map((glob) => glob.split('/').at(-2)))]
  .map((segment) => {
    if (segment === 'studio' && zone.exceptions.length > 0) {
      return { regex: 'studio/(?!lib/qrcode\\.mjs$)', message: ENGINE_ZONE_MESSAGE };
    }
    const pattern = `**/${segment}/**`;
    return { group: [pattern], message: ENGINE_ZONE_MESSAGE };
  });
const forbiddenPathRegex = (zone) => zone.forbidden
  .map((glob) => {
    const segment = glob.split('/').at(-2);
    const exception = segment === 'studio' && zone.exceptions.length > 0
      ? '(?!\\/lib\\/qrcode\\.mjs$)'
      : '';
    return `${segment}${exception}`;
  })
  .join('|');

function syntaxRestrictions(zone) {
  const restrictions = [];
  const regex = forbiddenPathRegex(zone);
  if (regex) {
    restrictions.push(
      { selector: `ImportExpression[source.value=/${regex}/]`, message: ENGINE_ZONE_MESSAGE },
      { selector: `CallExpression[callee.name='require'][arguments.0.value=/${regex}/]`, message: ENGINE_ZONE_MESSAGE },
    );
  }
  if (zone.id === 'remotion' || zone.id === 'hyperframes' || zone.id === 'studio' || zone.id === 'scripts') {
    restrictions.push(
      { selector: "ImportExpression:not([source.type='Literal'])", message: ENGINE_ZONE_MESSAGE },
      { selector: "CallExpression[callee.name='require']:not([arguments.0.type='Literal'])", message: ENGINE_ZONE_MESSAGE },
    );
  }
  return restrictions;
}

function packageRestrictions(zone) {
  if (zone.id === 'studio') {
    const builtins = [...new Set(builtinModules.map((name) => name.replace(/^node:/, '')))];
    return {
      patterns: [{ group: ['node:*', '@nx/devkit', '@nx/devkit/*'], message: ENGINE_ZONE_MESSAGE }],
      paths: builtins.map((name) => ({ name, message: ENGINE_ZONE_MESSAGE })),
    };
  }
  if (zone.id === 'capture') {
    return { patterns: [{ group: ['@nx/devkit', '@nx/devkit/*'], message: ENGINE_ZONE_MESSAGE }] };
  }
  if (zone.id === 'shared') {
    return { patterns: [{ group: ['@nx/devkit', '@nx/devkit/*'], message: ENGINE_ZONE_MESSAGE, allowTypeImports: true }] };
  }
  return {};
}

const zoneBlocks = ENGINE_ZONES.map((originalZone) => {
  const zone = effectiveZone(originalZone);
  const restricted = packageRestrictions(zone);
  return {
    name: `nx-video/engine-zone/${zone.id}`,
    files: fileGlobs(zone),
    ignores: ['src/generators/**/files/**'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [...importPatterns(zone), ...(restricted.patterns ?? [])],
        ...(restricted.paths ? { paths: restricted.paths } : {}),
      }],
      'no-restricted-syntax': ['error', ...syntaxRestrictions(zone), ...pinSelectors],
    },
  };
});

export default [
  ...rootConfig,
  {
    name: 'nx-video/zone-policy-consumers',
    files: ['eslint.config.mjs', 'src/engine-isolation.spec.ts', 'src/engine-zones-lint.spec.ts'],
    rules: { '@nx/enforce-module-boundaries': 'off' },
  },
  {
    name: 'nx-video/pin-literals',
    files: [`src/**/${sourceExtensions}`],
    ignores: PIN_LITERAL_ALLOWED_FILES,
    rules: { 'no-restricted-syntax': ['error', ...pinSelectors] },
  },
  ...zoneBlocks,
  ...ENGINE_ZONES.filter((zone) => zone.id === 'remotion' || zone.id === 'hyperframes').map((zone) => ({
    name: `nx-video/pin-literal-exception/${zone.id}`,
    files: [`src/${zone.id}/versions.ts`],
    rules: { 'no-restricted-syntax': ['error', ...syntaxRestrictions(zone)] },
  })),
];
