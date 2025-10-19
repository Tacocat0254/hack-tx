/**
 * Board Data Loader - Utilities for loading and parsing compact board format
 * Handles the optimized circles-compact.txt format for faster Gemini processing
 */

// Dynamic imports for Node.js modules (only loaded when needed)

export interface HoldPosition {
  id: string;
  cx: number;
  cy: number;
}

/**
 * Load compact board data from circles-compact.txt
 * Returns the raw compact string format
 * Works in both browser and Node.js environments
 */
export async function loadCompactBoardData(): Promise<string> {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    try {
      const response = await fetch('/circles-compact.txt');
      if (!response.ok) {
        throw new Error(`Failed to load compact board data: ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      console.error('Error loading compact board data:', error);
      throw error;
    }
  } else {
    // Node.js environment - read file directly
    try {
      const fs = await import('node:fs');
      const { fileURLToPath } = await import('node:url');
      const { dirname, join } = await import('node:path');
      
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const compactPath = join(__dirname, '../../public/circles-compact.txt');
      
      return fs.readFileSync(compactPath, 'utf8');
    } catch (error) {
      console.error('Error loading compact board data:', error);
      throw error;
    }
  }
}

/**
 * Parse compact format string back to array of hold positions
 * Format: "id:cx,cy|id:cx,cy|..."
 */
export function parseCompactToArray(compactString: string): HoldPosition[] {
  return compactString
    .split('|')
    .map(entry => {
      const [id, coords] = entry.split(':');
      const [cx, cy] = coords.split(',').map(Number);
      return { id, cx, cy };
    })
    .filter(hold => hold.id && !isNaN(hold.cx) && !isNaN(hold.cy));
}

/**
 * Parse compact format string back to object format (for compatibility)
 * Returns same format as original circles.json
 */
export function parseCompactToObject(compactString: string): Record<string, { cx: number; cy: number }> {
  const holds = parseCompactToArray(compactString);
  const result: Record<string, { cx: number; cy: number }> = {};
  
  holds.forEach(hold => {
    result[hold.id] = { cx: hold.cx, cy: hold.cy };
  });
  
  return result;
}

/**
 * Filter compact format by cy coordinate ranges (zones)
 * Useful for sending only relevant holds to Gemini based on route zones
 */
export function filterCompactByZones(
  compactString: string, 
  zones: Array<{ min: number; max: number; name: string }>
): string {
  const holds = parseCompactToArray(compactString);
  
  const filteredHolds = holds.filter(hold => 
    zones.some(zone => hold.cy >= zone.min && hold.cy <= zone.max)
  );
  
  return filteredHolds
    .map(hold => `${hold.id}:${hold.cx},${hold.cy}`)
    .join('|');
}

/**
 * Get board statistics from compact format
 * Returns useful metrics for prompt generation
 */
export function getBoardStats(compactString: string) {
  const holds = parseCompactToArray(compactString);
  
  if (holds.length === 0) {
    return { totalHolds: 0, minCy: 0, maxCy: 0, cyRange: 0 };
  }
  
  const cyValues = holds.map(h => h.cy).sort((a, b) => a - b);
  const minCy = cyValues[0];
  const maxCy = cyValues[cyValues.length - 1];
  
  // Find example holds at different heights
  const topHolds = holds
    .filter(h => h.cy <= minCy + 50)
    .slice(0, 3)
    .map(h => h.id);
    
  const middleHolds = holds
    .filter(h => h.cy >= (minCy + maxCy) / 2 - 50 && h.cy <= (minCy + maxCy) / 2 + 50)
    .slice(0, 3)
    .map(h => h.id);
    
  const bottomHolds = holds
    .filter(h => h.cy >= maxCy - 50)
    .slice(0, 3)
    .map(h => h.id);
  
  return {
    totalHolds: holds.length,
    minCy,
    maxCy,
    cyRange: maxCy - minCy,
    topHolds,
    middleHolds,
    bottomHolds,
    middleCy: Math.round((minCy + maxCy) / 2)
  };
}

/**
 * Predefined zones for route generation
 * Based on climbing wall sections
 */
export const ROUTE_ZONES = {
  START: { min: 850, max: 1140, name: 'start' },      // Bottom third
  INTERMEDIATE: { min: 300, max: 850, name: 'intermediate' }, // Middle section  
  FINISH: { min: 30, max: 300, name: 'finish' },     // Top third
  FOOTHOLD: { min: 950, max: 1140, name: 'foothold' } // Lower section for feet
} as const;
