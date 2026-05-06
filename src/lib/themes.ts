export type ThemeName = 'auto' | 'blue' | 'rose' | 'sage' | 'amber' | 'slate';

export const THEMES: Record<string, { r: number, g: number, b: number, label: string }> = {
  blue: { r: 37, g: 99, b: 235, label: 'Azul Sereno' }, // blue-600
  rose: { r: 225, g: 29, b: 72, label: 'Rosa Suave' },  // rose-600
  sage: { r: 5, g: 150, b: 105, label: 'Verde Sálvia' }, // emerald-600
  amber: { r: 217, g: 119, b: 6, label: 'Amarelo Caloroso' }, // amber-600
  slate: { r: 51, g: 65, b: 85, label: 'Cinza Minimalista' } // slate-700
};

export const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};
