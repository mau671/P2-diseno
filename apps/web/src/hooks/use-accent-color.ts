import { useState, useEffect, useCallback } from 'react';

const ACCENT_COLOR_STORAGE_KEY = 'accent-color';

// Convert hex to oklch (simplified conversion)
function hexToOklch(hex: string, isDark: boolean): string {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  // Convert to linear RGB
  const toLinear = (c: number) => {
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  
  const rLinear = toLinear(r);
  const gLinear = toLinear(g);
  const bLinear = toLinear(b);
  
  // Convert to XYZ
  const x = (rLinear * 0.4124564 + gLinear * 0.3575761 + bLinear * 0.1804375) * 100;
  const y = (rLinear * 0.2126729 + gLinear * 0.7151522 + bLinear * 0.0721750) * 100;
  const z = (rLinear * 0.0193339 + gLinear * 0.1191920 + bLinear * 0.9503041) * 100;
  
  // Convert to Lab
  const xn = x / 95.047;
  const yn = y / 100.0;
  const zn = z / 108.883;
  
  const fx = xn > 0.008856 ? Math.pow(xn, 1/3) : (7.787 * xn + 16/116);
  const fy = yn > 0.008856 ? Math.pow(yn, 1/3) : (7.787 * yn + 16/116);
  const fz = zn > 0.008856 ? Math.pow(zn, 1/3) : (7.787 * zn + 16/116);
  
  const L = (116 * fy) - 16;
  const a = 500 * (fx - fy);
  const bLab = 200 * (fy - fz);
  
  // Convert to oklch (simplified)
  // For simplicity, we'll use a basic conversion
  // In production, you might want to use a proper color conversion library
  const lightness = L / 100;
  const chroma = Math.sqrt(a * a + bLab * bLab) / 100;
  const hue = Math.atan2(bLab, a) * (180 / Math.PI);
  
  // Adjust for dark mode
  const adjustedLightness = isDark ? Math.max(0.2, Math.min(0.4, lightness)) : Math.max(0.9, Math.min(0.98, lightness));
  const adjustedChroma = Math.min(0.3, chroma);
  
  return `oklch(${adjustedLightness.toFixed(3)} ${adjustedChroma.toFixed(3)} ${hue.toFixed(1)})`;
}

// Calculate foreground color based on accent color
function calculateForegroundColor(isDark: boolean): string {
  // For light mode, use dark text on light accent
  // For dark mode, use light text on dark accent
  return isDark ? 'oklch(0.985 0 0)' : 'oklch(0.205 0 0)';
}

export function useAccentColor() {
  const [accentColor, setAccentColorState] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACCENT_COLOR_STORAGE_KEY);
  });

  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return document.documentElement.classList.contains('dark');
  });

  // Listen for theme changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  // Apply accent color to CSS variables
  useEffect(() => {
    if (!accentColor) {
      // Reset to default
      document.documentElement.style.removeProperty('--accent');
      document.documentElement.style.removeProperty('--accent-foreground');
      return;
    }

    try {
      const oklchColor = hexToOklch(accentColor, isDark);
      const foregroundColor = calculateForegroundColor(isDark);
      
      document.documentElement.style.setProperty('--accent', oklchColor);
      document.documentElement.style.setProperty('--accent-foreground', foregroundColor);
    } catch (error) {
      console.error('Error applying accent color:', error);
    }
  }, [accentColor, isDark]);

  const setAccentColor = useCallback((color: string | null) => {
    if (color) {
      localStorage.setItem(ACCENT_COLOR_STORAGE_KEY, color);
      setAccentColorState(color);
    } else {
      localStorage.removeItem(ACCENT_COLOR_STORAGE_KEY);
      setAccentColorState(null);
    }
  }, []);

  const resetAccentColor = useCallback(() => {
    localStorage.removeItem(ACCENT_COLOR_STORAGE_KEY);
    setAccentColorState(null);
  }, []);

  return {
    accentColor,
    setAccentColor,
    resetAccentColor,
  };
}

