#!/usr/bin/env node

/**
 * Test script for AI Route Generation Integration
 * Tests the prompt parser and Gemini API integration
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the modules we need to test
const { parsePromptToGuidance } = await import('../src/lib/promptParser.ts');
const { generateHoldSelection } = await import('../src/lib/gemini.ts');

// Read circles.json
const circlesPath = join(__dirname, '../public/circles.json');
const circlesData = JSON.parse(readFileSync(circlesPath, 'utf8'));

console.log('🧪 Testing AI Route Generation Integration\n');

// Test 1: Prompt Parser
console.log('1️⃣ Testing Prompt Parser...');
const testPrompts = [
  "v5 crimpy route",
  "easy beginner route with big holds",
  "overhang route with slopers",
  "technical route with small crimps"
];

for (const prompt of testPrompts) {
  try {
    const result = parsePromptToGuidance(prompt);
    console.log(`   ✅ "${prompt}"`);
    console.log(`      Selection Guidance: ${result.selectionGuidance}`);
    console.log(`      Setter Notes: ${result.setterNotes}\n`);
  } catch (error) {
    console.log(`   ❌ "${prompt}" - Error: ${error.message}\n`);
  }
}

// Test 2: Gemini API Integration
console.log('2️⃣ Testing Gemini API Integration...');

const testPrompt = "v5 crimpy route";
console.log(`   Testing with prompt: "${testPrompt}"`);

try {
  // Parse the prompt
  const { selectionGuidance, setterNotes } = parsePromptToGuidance(testPrompt);
  console.log(`   ✅ Prompt parsed successfully`);
  
  // Prepare board data
  const boardJson = JSON.stringify(circlesData);
  console.log(`   ✅ Board data prepared (${Object.keys(circlesData).length} holds)`);
  
  // Test Gemini API call
  console.log(`   🔄 Calling Gemini API...`);
  const response = await generateHoldSelection({
    boardJson,
    selectionGuidance,
    setterNotes
  });
  
  console.log(`   ✅ Gemini API responded successfully`);
  console.log(`   📊 Response summary: ${response.summary || 'No summary provided'}`);
  console.log(`   🎯 Generated ${response.holds.length} holds:`);
  
  // Display the generated holds
  response.holds.forEach((hold, index) => {
    console.log(`      ${index + 1}. ID: ${hold.id}, Color: ${hold.color}`);
  });
  
  // Test mapping to HoldData format
  console.log(`\n   🔄 Testing HoldData mapping...`);
  const mappedHolds = response.holds.map((hold) => ({
    color: hold.color.replace('#', ''), // Remove # from color
    position: hold.id // Use id as position (matches circle IDs)
  }));
  
  console.log(`   ✅ Mapped to HoldData format:`);
  mappedHolds.forEach((hold, index) => {
    console.log(`      ${index + 1}. Position: ${hold.position}, Color: ${hold.color}`);
  });
  
  // Verify hold IDs exist in circles.json
  console.log(`\n   🔍 Verifying hold IDs exist in board...`);
  const invalidHolds = mappedHolds.filter(hold => !circlesData[hold.position]);
  if (invalidHolds.length === 0) {
    console.log(`   ✅ All hold IDs are valid`);
  } else {
    console.log(`   ⚠️  Invalid hold IDs found:`);
    invalidHolds.forEach(hold => {
      console.log(`      - ${hold.position} (not found in circles.json)`);
    });
  }
  
} catch (error) {
  console.log(`   ❌ Error: ${error.message}`);
  console.log(`   Stack: ${error.stack}`);
}

// Test 3: Error Handling
console.log('\n3️⃣ Testing Error Handling...');

try {
  // Test with empty prompt
  const emptyResult = parsePromptToGuidance("");
  console.log(`   ✅ Empty prompt handled gracefully`);
  console.log(`      Selection Guidance: "${emptyResult.selectionGuidance}"`);
  console.log(`      Setter Notes: "${emptyResult.setterNotes}"`);
} catch (error) {
  console.log(`   ❌ Empty prompt error: ${error.message}`);
}

// Test 4: Performance Test
console.log('\n4️⃣ Performance Test...');
const startTime = Date.now();

try {
  const { selectionGuidance, setterNotes } = parsePromptToGuidance("v5 crimpy route");
  const boardJson = JSON.stringify(circlesData);
  const response = await generateHoldSelection({
    boardJson,
    selectionGuidance,
    setterNotes
  });
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  console.log(`   ✅ Full integration test completed in ${duration}ms`);
  console.log(`   📊 Generated ${response.holds.length} holds`);
  
} catch (error) {
  console.log(`   ❌ Performance test failed: ${error.message}`);
}

console.log('\n🎉 Test completed!');
console.log('\n📝 Next steps:');
console.log('   1. Check if VITE_GEMINI_API_KEY is set in your environment');
console.log('   2. Run the React app to see the visual integration');
console.log('   3. Remove the temporary test trigger in KilterBoard.tsx when ready');
