#!/usr/bin/env node
import 'dotenv/config'
import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.VITE_GEMINI_API_KEY

if (!apiKey || apiKey === 'your_key_here') {
  console.error('Set VITE_GEMINI_API_KEY in your .env file before running this script.')
  process.exit(1)
}

const MODEL_NAME = 'gemini-2.5-flash'

const boardDescription = {
  board: {
    name: 'Standard 7x12 Kilter Board',
    angle: 40,
    rows: 12,
    columns: 7,
  },
  holds: [
    { id: 'A1', coordinates: { x: 1, y: 1 }, color: 'green', type: 'jug' },
    { id: 'B4', coordinates: { x: 3, y: 5 }, color: 'yellow', type: 'crimp' },
    { id: 'C7', coordinates: { x: 5, y: 9 }, color: 'blue', type: 'pinch' },
    { id: 'D6', coordinates: { x: 4, y: 8 }, color: 'orange', type: 'sloper' },
  ],
}

const holdGuidance =
  'Prioritize tensiony movement with in-cut edges, a deadpoint crux, and a balanced finish.'

const setterNotes =
  'Grade V5 target, left-hand start, avoid large spans, make top sequence compression focused.'

function buildPrompt() {
  const template = JSON.stringify(
    {
      holds: [
        {
          id: 'string // hold identifier from the board JSON',
          usage: 'start|intermediate|finish',
          coordinates: { x: 0, y: 0 },
          orientation: 'clockwise_degrees',
          difficultyAdjustment: 'optional notes on grading impact',
          notes: 'optional additional comments',
        },
      ],
      summary: 'Optional summary of the selection.',
    },
    null,
    2,
  )

  return [
    'You are an experienced Kilter Board route setter.',
    'Using the board description JSON and provided guidance, choose a list of holds.',
    'Respond with strictly valid JSON matching this template:',
    template,
    'Board description JSON:',
    JSON.stringify(boardDescription, null, 2),
    'Hold selection guidance:',
    holdGuidance,
    'Setter notes from the user:',
    setterNotes,
    'Respond only with JSON.',
  ].join('\n\n')
}

function extractJson(text) {
  const jsonBlock = text.match(/```json\s*([\s\S]*?)```/i)?.[1] ?? text
  return JSON.parse(jsonBlock)
}

async function main() {
  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: {
        temperature: 0.7,
        responseMimeType: 'application/json',
      },
    })

    const prompt = buildPrompt()
    const response = await model.generateContent(prompt)
    const text = response.response.text()

    if (!text) {
      throw new Error('Gemini returned an empty response.')
    }

    const parsed = extractJson(text)
    console.log('Gemini hold selection:')
    console.log(JSON.stringify(parsed, null, 2))
  } catch (error) {
    console.error('Failed to run Gemini example:')
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  }
}

await main()
