export interface EngineZone {
  readonly id: string;
  readonly globs: readonly string[];
  readonly allowed: readonly string[];
  readonly forbidden: readonly string[];
  readonly forbiddenPackages: readonly string[];
  readonly exceptions: readonly string[];
}

export declare const ENGINE_ZONE_MESSAGE: string;
export declare const ENGINE_ZONES: readonly EngineZone[];
export declare const PIN_LITERAL_PATTERNS: readonly string[];
export declare const PIN_LITERAL_ALLOWED_FILES: readonly string[];
export declare const FORBIDDEN_SPAWN_STRINGS: readonly string[];
