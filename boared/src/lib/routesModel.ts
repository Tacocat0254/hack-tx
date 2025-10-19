// src/lib/hardcoded.ts
import ROUTE_BANK, { type RawRoute } from "./mockRoutes"; // <- fix path

/** Map incoming names -> your 4 ROLE_CYCLE hexes
 * We collapse source colors to the allowed palette:
 *  - "orange" -> YELLOW (#FFFF00)
 *  - "green"  -> GREEN  (#00FF00)
 *  - "cyan"   -> BLUE   (#0000FF)   (no cyan swatch in ROLE_CYCLE)
 *  - "purple" -> MAGENTA(#FF00FF)
 */
const COLOR_TO_HEX: Record<string, string> = {
  orange: "#FFFF00",
  green:  "#00FF00",
  cyan:   "#0000FF",
  purple: "#FF00FF",
};

type GenerateInput = {
  boardJson?: string;
  selectionGuidance?: string;
  setterNotes?: string;
};

type GenerateOutput = {
  name: string;
  summary: string;
  holds: Array<{ id: number; color: string }>;
};

/* ----- helpers ----- */

function parseDesiredGrade(text: string): string | null {
  if (!text) return null;
  const m = text.toLowerCase().match(/\bv\s?([0-9]|1[0-2])\b/);
  return m ? `v${m[1]}` : null;
}

function parseDesiredAngle(text: string): number | null {
  if (!text) return null;
  const m = text.toLowerCase().match(/\b(0|20|25|30|35|40|45)\s*°?\b/);
  return m ? Number(m[1]) : null;
}

function scoreRoute(r: RawRoute, wantGrade: string | null, wantAngle: number | null): number {
  let s = 0;
  if (wantGrade && r.grade.toLowerCase() === wantGrade.toLowerCase()) s += 2;
  if (wantAngle != null) {
    const diff = Math.abs((r.angle ?? 0) - wantAngle);
    s += diff === 0 ? 2 : diff <= 5 ? 1 : 0;
  }
  return s;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Module-level cursor for round-robin cycling when no strong match */
let cycleCursor = 0;

/** Promise-based sleep so generation isn't instant */
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

/**
 * Convert RawRoute -> output, assigning robust colors from ROLE_CYCLE only:
 * - Finish = top-most (lowest cy)  -> MAGENTA (#FF00FF)
 * - Starts = bottom 1–2 (highest cy)-> YELLOW  (#FFFF00)
 * - Others: use mapped source color; if unknown, alternate GREEN/BLUE
 */
function routeToResponse(r: RawRoute): GenerateOutput {
  const bucket = r.holds?.[0] ?? {};
  const entries = Object.entries(bucket).map(([idStr, info]) => {
    const id = Number(idStr);
    const { cx, cy, color } = info as any;
    return { id, cx, cy, rawColor: (color || "").toString().toLowerCase() };
  });

  // Sort by vertical position
  const byCyAsc = [...entries].sort((a, b) => a.cy - b.cy); // top -> bottom
  const byCyDesc = [...entries].sort((a, b) => b.cy - a.cy); // bottom -> top

  const finishId = byCyAsc[0]?.id;
  const startIds = byCyDesc.slice(0, Math.min(2, byCyDesc.length)).map((h) => h.id);

  let altToggle = 0;

  const holds = entries.map(({ id, rawColor }) => {
    let hex: string | undefined;

    if (finishId === id) {
      hex = "#FF00FF"; // MAGENTA (finish)
    } else if (startIds.includes(id)) {
      hex = "#FFFF00"; // YELLOW (starts)
    } else {
      hex = COLOR_TO_HEX[rawColor]; // map source color to palette
      if (!hex) {
        // Alternate to avoid uniform color if mapping missing
        hex = altToggle++ % 2 === 0 ? "#00FF00" /* GREEN */ : "#0000FF" /* BLUE */;
      }
    }

    return { id, color: hex };
  });

  const name = `${r.grade.toUpperCase()} @ ${r.angle}°`;
  const summary = `Grade ${r.grade.toUpperCase()} • Angle ${r.angle}°. ${holds.length} holds.`;

  return { name, summary, holds };
}

/* ----- public API: drop-in for ../lib/gemini.generateHoldSelection ----- */

export async function generateHoldSelection(input: GenerateInput): Promise<GenerateOutput> {
  // Add a small delay so the UI shows progress and doesn't feel instant
  await sleep(2000); // tweak 300–800ms to taste

  const hay = `${input.selectionGuidance || ""} ${input.setterNotes || ""}`.trim();
  const wantGrade = parseDesiredGrade(hay);
  const wantAngle = parseDesiredAngle(hay);

  const scored = ROUTE_BANK.map((r) => ({ r, s: scoreRoute(r, wantGrade, wantAngle) }));
  const maxScore = Math.max(...scored.map((x) => x.s));

  let chosen: RawRoute;
  if (maxScore > 0) {
    const top = scored.filter((x) => x.s === maxScore).map((x) => x.r);
    chosen = pickRandom(top);
  } else {
    chosen = ROUTE_BANK[cycleCursor % ROUTE_BANK.length];
    cycleCursor++;
  }

  return routeToResponse(chosen);
}

export default generateHoldSelection;
