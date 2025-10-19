import { GoogleGenerativeAI } from '@google/generative-ai'

export interface HoldSelectionInput {
  boardJson: string
  selectionGuidance: string
  setterNotes: string
}

export interface HoldSelection {
  name?: string
  holds: Array<Record<string, unknown>>
  summary?: string
}

const MODEL_NAME = 'gemini-2.5-flash'

const fallbackResponse: HoldSelection = {
  name: 'Sample AI Route',
  holds: [
    {
      id: 'A1',
      position: { x: 3, y: 12 },
      type: 'edge',
      usage: 'start',
    },
    {
      id: 'C5',
      position: { x: 9, y: 18 },
      type: 'pinch',
      usage: 'intermediate',
    },
    {
      id: 'E7',
      position: { x: 14, y: 26 },
      type: 'sloper',
      usage: 'finish',
    },
  ],
  summary:
    'Placeholder selection returned because VITE_GEMINI_API_KEY is not configured.',
}

function buildPrompt({
  boardJson,
  selectionGuidance,
  setterNotes,
}: HoldSelectionInput) {

  // Need to turn it into a HoldData and put 
  return [
    'You are an experienced Kilter Board route setter.',
    'Use the board description JSON and guidance notes to choose specific holds.',
    'Only respond with valid JSON matching this shape:',
    JSON.stringify(
      {
        name: 'string // short, human-friendly route name',
        holds: [
          {
            id: 'string // hold identifier from the board JSON',
            color:
              '#HEX // #00FF00 for start, #0000FF for move, #FF00FF for finish, #FFFF00 for feet or support',
            usage: 'optional start|move|finish',
            notes: 'optional extra notes about this hold',
          },
        ],
        summary: 'Optional short explanation of the selection.',
      },
      null,
      2,
    ),
    'Board description JSON:',
    boardJson,
    'Hold selection guidance:',
    selectionGuidance || '(none provided)',
    'Setter notes from the user:',
    setterNotes || '(none provided)',
    'Respond only with JSON.',
  ].join('\n\n')
}

function extractJson(text: string): HoldSelection {
  const jsonBlock = text.match(/```json\s*([\s\S]*?)```/i)?.[1] ?? text

  try {
    return JSON.parse(jsonBlock) as HoldSelection
  } catch (error) {
    throw new Error('Failed to parse Gemini response as JSON.')
  }
}

export async function generateHoldSelection(
  input: HoldSelectionInput,
): Promise<HoldSelection> {
  // Handle both browser (Vite) and Node.js environments
  const apiKey = typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env.VITE_GEMINI_API_KEY as string | undefined
    : (typeof (globalThis as any).process !== 'undefined' ? (globalThis as any).process.env.VITE_GEMINI_API_KEY : undefined) as string | undefined

  if (!apiKey) {
    return fallbackResponse
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      temperature: 0.7,
      responseMimeType: 'application/json',
    },
  })

  const prompt = buildPrompt(input)
  const result = await model.generateContent(prompt)
  const text = result.response.text()

  if (!text) {
    throw new Error('Gemini returned an empty response.')
  }

  return extractJson(text)
}
