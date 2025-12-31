export type PastelColor = {
  hex: string;
  oklch: string;
  pastelColor: string;
};

export const PASTEL_COLORS: readonly PastelColor[] = [
  { hex: '#a855f7', oklch: 'oklch(0.65 0.20 305)', pastelColor: '#a855f7' },
  { hex: '#3b82f6', oklch: 'oklch(0.60 0.20 255)', pastelColor: '#3b82f6' },
  { hex: '#06b6d4', oklch: 'oklch(0.70 0.18 190)', pastelColor: '#06b6d4' },
  { hex: '#14b8a6', oklch: 'oklch(0.65 0.18 180)', pastelColor: '#14b8a6' },
  { hex: '#22c55e', oklch: 'oklch(0.70 0.22 140)', pastelColor: '#22c55e' },
  { hex: '#84cc16', oklch: 'oklch(0.75 0.22 105)', pastelColor: '#84cc16' },
  { hex: '#eab308', oklch: 'oklch(0.80 0.18 85)', pastelColor: '#eab308' },
  { hex: '#f97316', oklch: 'oklch(0.70 0.24 45)', pastelColor: '#f97316' },
  { hex: '#ef4444', oklch: 'oklch(0.65 0.22 25)', pastelColor: '#ef4444' },
  { hex: '#ec4899', oklch: 'oklch(0.65 0.20 330)', pastelColor: '#ec4899' },
  { hex: '#8b5cf6', oklch: 'oklch(0.68 0.20 280)', pastelColor: '#8b5cf6' },
  { hex: '#6366f1', oklch: 'oklch(0.62 0.18 265)', pastelColor: '#6366f1' },
] as const;

function getPastelColorByIndex(index: number): PastelColor {
  return PASTEL_COLORS[Math.abs(index) % PASTEL_COLORS.length];
}

export { getPastelColorByIndex };
