// ── Section background presets ──

export interface SectionBgPreset {
  id: string;
  name: string;
  backgroundColor: string | undefined;
  backgroundImage: string | undefined;
  backgroundSize?: string;
  dark: boolean;
}

export const SECTION_BG_PRESETS: SectionBgPreset[] = [
  // ── Solid fills ──
  { id: 'none',       name: 'None',       backgroundColor: 'transparent', backgroundImage: undefined, dark: false },
  { id: 'light-gray', name: 'Light',      backgroundColor: '#f8fafc',     backgroundImage: undefined, dark: false },
  { id: 'dark-slate', name: 'Dark',       backgroundColor: '#1e293b',     backgroundImage: undefined, dark: true  },
  { id: 'brand-tint', name: 'Brand',      backgroundColor: 'var(--brand-primary)', backgroundImage: undefined, dark: false },

  // ── Patterns ──
  {
    id: 'dots',
    name: 'Dots',
    backgroundColor: '#ffffff',
    backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
    backgroundSize: '24px 24px',
    dark: false,
  },
  {
    id: 'grid',
    name: 'Grid',
    backgroundColor: '#ffffff',
    backgroundImage: 'linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)',
    backgroundSize: '48px 48px',
    dark: false,
  },
  {
    id: 'diagonal',
    name: 'Diagonal',
    backgroundColor: '#ffffff',
    backgroundImage: 'repeating-linear-gradient(45deg, #94a3b8 0px, #94a3b8 1px, transparent 1px, transparent 28px)',
    backgroundSize: '28px 28px',
    dark: false,
  },
  {
    id: 'crosshatch',
    name: 'Hatch',
    backgroundColor: '#ffffff',
    backgroundImage: 'repeating-linear-gradient(45deg, #94a3b8 0px, #94a3b8 1px, transparent 1px, transparent 24px), repeating-linear-gradient(-45deg, #94a3b8 0px, #94a3b8 1px, transparent 1px, transparent 24px)',
    backgroundSize: '24px 24px',
    dark: false,
  },
  {
    id: 'grain',
    name: 'Grain',
    backgroundColor: '#f8fafc',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
    backgroundSize: '200px 200px',
    dark: false,
  },
  {
    id: 'graph',
    name: 'Graph',
    backgroundColor: '#ffffff',
    backgroundImage: 'linear-gradient(to right, #94a3b8 1px, transparent 1px), linear-gradient(to bottom, #94a3b8 1px, transparent 1px), linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)',
    backgroundSize: '96px 96px, 96px 96px, 24px 24px, 24px 24px',
    dark: false,
  },
];

export const getSectionBgPreset = (id: string): SectionBgPreset | undefined =>
  SECTION_BG_PRESETS.find((p) => p.id === id);
