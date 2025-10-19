#!/usr/bin/env node
import { parsePromptToGuidance } from '../src/lib/promptParser.ts'

const testPrompts = [
  'make a V6 climb with dynos and slopes',
  'create a powerful V4 route with compression moves',
  'set a technical V8 crimpy problem',
  'build a balanced V3 route avoiding large spans',
  'design a V5 slopey route with heel hooks',
  'make a flowing V7 route with left hand start'
]

console.log('Testing Prompt Parser Utility\n')

for (const prompt of testPrompts) {
  console.log(`Input: "${prompt}"`)
  const result = parsePromptToGuidance(prompt)
  console.log(`Guidance: ${result.selectionGuidance}`)
  console.log(`Notes: ${result.setterNotes}`)
  console.log('---')
}
