/**
 * Utility functions for color operations
 */

/**
 * Converts a hex color to RGB values
 * @param hex - Hex color string (e.g., '#FF0000')
 * @returns Object with r, g, b values (0-255)
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Converts RGB values to hex color string
 * @param r - Red value (0-255)
 * @param g - Green value (0-255)
 * @param b - Blue value (0-255)
 * @returns Hex color string
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => {
    const hex = Math.round(c).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Calculates the average color from multiple hex colors
 * @param hexColors - Array of hex color strings
 * @returns Average hex color string
 */
export function calculateAverageColor(hexColors: string[]): string {
  if (hexColors.length === 0) {
    throw new Error('At least one color is required');
  }

  if (hexColors.length === 1) {
    return hexColors[0];
  }

  // Convert all colors to RGB
  const rgbColors = hexColors.map(hexToRgb);

  // Calculate average RGB values
  const avgR =
    rgbColors.reduce((sum, color) => sum + color.r, 0) / rgbColors.length;
  const avgG =
    rgbColors.reduce((sum, color) => sum + color.g, 0) / rgbColors.length;
  const avgB =
    rgbColors.reduce((sum, color) => sum + color.b, 0) / rgbColors.length;

  // Convert back to hex
  return rgbToHex(avgR, avgG, avgB);
}
