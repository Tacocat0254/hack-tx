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
  // Parse board data to get statistics
  const boardData = JSON.parse(boardJson)
  const holdIds = Object.keys(boardData)
  const cyValues = holdIds.map(id => boardData[id].cy).sort((a, b) => a - b)
  const minCy = cyValues[0]
  const maxCy = cyValues[cyValues.length - 1]
  
  // Find example holds at different heights
  const topHolds = holdIds.filter(id => boardData[id].cy <= minCy + 50).slice(0, 3)
  const middleHolds = holdIds.filter(id => boardData[id].cy >= (minCy + maxCy) / 2 - 50 && boardData[id].cy <= (minCy + maxCy) / 2 + 50).slice(0, 3)
  const bottomHolds = holdIds.filter(id => boardData[id].cy >= maxCy - 50).slice(0, 3)

  return [
    'You are an experienced Kilter Board route setter.',
    'Use the board description JSON and guidance notes to choose specific holds.',
    
    '## IMPORTANT: Board Coordinate System',
    'The board uses SVG coordinates where:',
    '- cy (vertical): 30 is the TOP of the board, 1140 is the BOTTOM',
    '- Climbing routes start at the BOTTOM (high cy values) and finish at the TOP (low cy values)',
    '- Lower cy values = higher on the wall, Higher cy values = lower on the wall',
    
    '## Hold Placement Guidelines',
    '- START holds: cy range 900-1100 (bottom third, avoid extreme bottom 1130-1140)',
    '- INTERMEDIATE holds: cy range 400-900 (middle section, progressing upward)',
    '- FINISH holds: cy range 30-400 (top third)',
    '- FOOTHOLDS (yellow): cy range 950-1140 (lower section for initial foot placement)',
    '- Route should show clear UPWARD progression: decreasing cy values from start to finish',
    
    '## Board Statistics',
    `- Total holds: ${holdIds.length}`,
    `- Vertical range: cy ${minCy} (top) to cy ${maxCy} (bottom)`,
    `- Example top holds (cy ~${minCy}): ${topHolds.join(', ')}`,
    `- Example middle holds (cy ~${Math.round((minCy + maxCy) / 2)}): ${middleHolds.join(', ')}`,
    `- Example bottom holds (cy ~${maxCy}): ${bottomHolds.join(', ')}`,
    

    '- Each route must have 2 start holds (color #00FF00), 1-2 finish holds (#FF00FF), and 5-10 move holds (#0000FF).',
    '- Each move must decrease in cy value by at least 50 but not more than 300.',
    '- At least one foothold (#FFFF00) should be available below each start and move hold (cy + 100 to +250 range).',
    '- Lateral distance between consecutive handholds should not exceed 300 in |cx|.',
    '- No two holds may occupy the same coordinate.',
    '- There should be 1-3 footholds total, where up to 5 may be used.',
    '- Footholds must not overlap with handhold IDs.',

    'Before selecting holds, internally plan the route as a sequence of zones:',
    '- Stage 1: Identify 2 balanced start holds (cy 950-1100) roughly shoulder-width apart.',
    '- Stage 2: Choose 2-4 intermediate handholds forming a smooth upward path (cy decreases gradually).',
    '- Stage 3: Choose 1-2 finish holds at least 300 cy above the previous hold, centered or slightly offset.',
    '- Stage 4: For each handhold (except finish), choose at least one nearby foothold with cy +120-220 and |cx| < 150.',
    '- Think step-by-step about reachability, flow, and body balance before outputting your JSON.',


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
