// ============================================================
//  TLG3D Marketplace — Skill Manifest Types & Validator
//  Every skill in the marketplace MUST conform to this spec.
// ============================================================

export type SkillCategory =
  | 'ai-video'
  | 'ai-audio'
  | 'effects'
  | 'transitions'
  | 'color'
  | 'text-captions'
  | 'social'
  | 'utility'
  | 'messaging'
  | 'analytics'
  | 'export';

export type SkillPricing =
  | { type: 'free' }
  | { type: 'paid';       price: number; currency: 'USD' }
  | { type: 'subscription'; pricePerMonth: number; currency: 'USD' }
  | { type: 'one-time';   price: number; currency: 'USD' };

export type SkillRuntime = 'node' | 'python' | 'rust' | 'wasm';

export type SkillPermission =
  | 'filesystem'
  | 'network'
  | 'gpu'
  | 'camera'
  | 'microphone'
  | 'notifications'
  | 'messaging'
  | 'llm'
  | 'ffmpeg'
  | 'social';

// ── Skill Manifest ────────────────────────────────────────────

export interface SkillManifest {
  // Identity
  id:            string;          // unique slug: 'auto-reframe-9-16'
  name:          string;          // 'Auto Reframe 9:16'
  version:       string;          // semver: '1.2.0'
  description:   string;          // one-line description
  longDescription: string;        // full markdown description
  author:        string;          // 'TLG3D Team' or community handle
  authorUrl?:    string;
  homepage?:     string;
  repository?:   string;

  // Classification
  category:      SkillCategory;
  tags:          string[];        // ['reframe', 'portrait', 'tiktok', 'shorts']
  icon:          string;          // emoji or URL to 32x32 icon
  screenshots:   string[];        // URLs to preview images/videos

  // Pricing
  pricing:       SkillPricing;

  // Technical
  runtime:       SkillRuntime;
  entrypoint:    string;          // relative path: 'src/index.js'
  configSchema:  SkillConfigField[];
  permissions:   SkillPermission[];
  dependencies?: string[];        // other skill IDs this requires

  // Compatibility
  minAppVersion: string;          // '0.1.0'
  platforms:     ('windows' | 'macos' | 'linux' | 'ios' | 'android')[];

  // Stats (populated by server)
  downloads?:    number;
  rating?:       number;          // 0-5
  ratingCount?:  number;
  createdAt?:    string;
  updatedAt?:    string;
  verified?:     boolean;         // TLG3D-verified badge
  featured?:     boolean;
}

export interface SkillConfigField {
  key:           string;
  label:         string;
  type:          'string' | 'number' | 'boolean' | 'select' | 'color' | 'file' | 'range';
  defaultValue?: any;
  options?:      Array<{ label: string; value: any }>;
  min?:          number;
  max?:          number;
  step?:         number;
  required?:     boolean;
  description?:  string;
}

// ── Installed Skill Record ─────────────────────────────────────

export interface InstalledSkill {
  skillId:       string;
  version:       string;
  installedAt:   string;
  enabled:       boolean;
  config:        Record<string, any>;
  localPath:     string;
}

// ── Skill Context (passed to every skill at runtime) ──────────

export interface SkillContext {
  userId:        string;
  projectId:     string;
  projectPath:   string;
  config:        Record<string, any>;
  llmRouter:     any;
  ffmpegPath:    string;
  dataDir:       string;
  emit:          (event: string, payload: any) => void;
  log:           (msg: string) => void;
}

export interface SkillResult {
  success:       boolean;
  outputFiles?:  string[];
  message?:      string;
  data?:         any;
  error?:        string;
}

// ── Manifest Validator ─────────────────────────────────────────

export function validateSkillManifest(manifest: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields
  const required = ['id', 'name', 'version', 'description', 'longDescription',
                    'author', 'category', 'tags', 'icon', 'pricing',
                    'runtime', 'entrypoint', 'configSchema', 'permissions',
                    'minAppVersion', 'platforms'];

  for (const field of required) {
    if (!manifest[field]) errors.push(`Missing required field: ${field}`);
  }

  // ID format: lowercase, hyphens only
  if (manifest.id && !/^[a-z0-9-]+$/.test(manifest.id)) {
    errors.push('id must be lowercase alphanumeric with hyphens only');
  }

  // Semver version
  if (manifest.version && !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
    errors.push('version must be valid semver (e.g. 1.0.0)');
  }

  // Valid category
  const validCategories: SkillCategory[] = [
    'ai-video', 'ai-audio', 'effects', 'transitions', 'color',
    'text-captions', 'social', 'utility', 'messaging', 'analytics', 'export',
  ];
  if (manifest.category && !validCategories.includes(manifest.category)) {
    errors.push(`Invalid category: ${manifest.category}`);
  }

  // Valid runtime
  const validRuntimes: SkillRuntime[] = ['node', 'python', 'rust', 'wasm'];
  if (manifest.runtime && !validRuntimes.includes(manifest.runtime)) {
    errors.push(`Invalid runtime: ${manifest.runtime}`);
  }

  // Pricing structure
  if (manifest.pricing) {
    const { type } = manifest.pricing;
    if (!['free', 'paid', 'subscription', 'one-time'].includes(type)) {
      errors.push(`Invalid pricing type: ${type}`);
    }
    if (type === 'paid' && typeof manifest.pricing.price !== 'number') {
      errors.push('Paid skills must include a numeric price');
    }
  }

  // Config schema fields
  if (Array.isArray(manifest.configSchema)) {
    for (const field of manifest.configSchema) {
      if (!field.key || !field.label || !field.type) {
        errors.push(`Config field missing key/label/type: ${JSON.stringify(field)}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
