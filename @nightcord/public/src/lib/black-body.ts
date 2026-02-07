// Function to map a value in [-1, 1] to an RGB color based on black-body radiation
// Credit: Claude Opus 4.5

export function toCssString(color: { r: number; g: number; b: number }): string {
  return `rgb(${color.r} ${color.g} ${color.b} / 25%)`
}

export function blackbodyColor(t: number): { r: number; g: number; b: number } {
  // t in [-1, 1] → temperature in Kelvin
  const tempK = 1000 + ((t + 1) / 2) * 11000 // maps to [1000, 12000]
  return tempToRGB(tempK)
}

function tempToRGB(kelvin: number): { r: number; g: number; b: number } {
  // Tanner Helland's approximation (attempt to match CIE 1964 data)
  const temp = kelvin / 100
  let r, g, b

  // Red
  if (temp <= 66) {
    r = 255
  } else {
    r = 329.698727446 * Math.pow(temp - 60, -0.1332047592)
  }

  // Green
  if (temp <= 66) {
    g = 99.4708025861 * Math.log(temp) - 161.1195681661
  } else {
    g = 288.1221695283 * Math.pow(temp - 60, -0.0755148492)
  }

  // Blue
  if (temp >= 66) {
    b = 255
  } else if (temp <= 19) {
    b = 0
  } else {
    b = 138.5177312231 * Math.log(temp - 10) - 305.0447927307
  }

  return {
    r: Math.round(clamp(r, 0, 255)),
    g: Math.round(clamp(g, 0, 255)),
    b: Math.round(clamp(b, 0, 255)),
  }
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val))
}
