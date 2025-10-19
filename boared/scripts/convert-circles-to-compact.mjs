#!/usr/bin/env node

/**
 * One-time conversion script to transform circles.json into compact format
 * Reduces file size by ~70% and token count for Gemini API calls
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const circlesPath = join(__dirname, '../public/circles.json');
const compactPath = join(__dirname, '../public/circles-compact.txt');

console.log('🔄 Converting circles.json to compact format...\n');

try {
  // Read circles.json
  const circlesData = JSON.parse(readFileSync(circlesPath, 'utf8'));
  const holdIds = Object.keys(circlesData);
  
  console.log(`📊 Input: ${holdIds.length} holds in circles.json`);
  
  // Convert to compact format: id:cx,cy|id:cx,cy|...
  const compactEntries = holdIds.map(id => {
    const { cx, cy } = circlesData[id];
    return `${id}:${cx},${cy}`;
  });
  
  const compactString = compactEntries.join('|');
  
  // Write compact file
  writeFileSync(compactPath, compactString, 'utf8');
  
  // Calculate size reduction
  const originalSize = readFileSync(circlesPath, 'utf8').length;
  const compactSize = compactString.length;
  const reductionPercent = Math.round((1 - compactSize / originalSize) * 100);
  
  console.log(`✅ Conversion complete!`);
  console.log(`📁 Original size: ${originalSize} bytes`);
  console.log(`📁 Compact size: ${compactSize} bytes`);
  console.log(`📈 Size reduction: ${reductionPercent}%`);
  console.log(`📄 Output file: ${compactPath}`);
  
  // Show sample of compact format
  console.log(`\n📝 Sample format:`);
  console.log(compactString.substring(0, 100) + '...');
  
} catch (error) {
  console.error('❌ Conversion failed:', error.message);
  process.exit(1);
}
