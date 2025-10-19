import { useMemo, useState, type ChangeEvent } from "react";
import KilterBoard, {
  ROLE_CYCLE,
  type HoldData,
  type KilterBoardSnapshot,
} from "../components/KilterBoard";
import ConnectKilter from "../components/ConnectKilter";
import { sendLedConfig } from "../components/sendLedConfig";
import { parsePromptToGuidance } from "../lib/promptParser";
import { generateHoldSelection } from "../lib/gemini";
import { getPositionCodeFromHoldId } from "../modules/kilterboardPositions";
import circlesData from "../../public/circles.json";

const DEFAULT_PACKET = "01 00 00 02 03";

const Boared = () => {
  const [snapshot, setSnapshot] = useState<KilterBoardSnapshot | null>(null);
  const [aiInstructions, setAiInstructions] = useState("");
  const [status, setStatus] = useState("");
  const [generatedName, setGeneratedName] = useState("");
  const [aiSummary, setAiSummary] = useState("");
  const [presetHolds, setPresetHolds] = useState<HoldData[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const activeHoldSummary = useMemo(() => {
    if (!snapshot || snapshot.activeHolds.length === 0) return "—";
    return snapshot.activeHolds
      .map((hold) => `${hold.displayColor}:${hold.position}`)
      .join("  |  ");
  }, [snapshot]);

  const finalPacket = snapshot ? snapshot.encodedPayload : DEFAULT_PACKET;

  function toLedConfig() {
    if (!snapshot) return [];
    return snapshot.activeHolds.map((h) => ({
      position: getPositionCodeFromHoldId(h.position) ?? Number(h.position),
      role_id: ROLE_CYCLE[h.roleIndex]?.id ?? 0,
    }));
  }

  const resolveRoleIndex = (colorHex: string): number => {
    const normalized = colorHex.trim().replace(/^#/, '').toUpperCase()
    const byDisplay = ROLE_CYCLE.findIndex(
      (role) => role.display.replace(/^#/, '').toUpperCase() === normalized,
    )
    if (byDisplay !== -1) return byDisplay

    const byLed = ROLE_CYCLE.findIndex(
      (role) => role.led.toUpperCase() === normalized,
    )
    return byLed !== -1 ? byLed : 1
  }

  const handleAiInstructionsChange = (
    event: ChangeEvent<HTMLTextAreaElement>,
  ) => setAiInstructions(event.target.value);

  async function handleGenerateAi() {
    const promptParts: string[] = [];
    if (aiInstructions.trim()) {
      promptParts.push(aiInstructions.trim());
    }

    const prompt = promptParts.join(". ");

    if (!prompt) {
      setStatus("Provide route details before generating.");
      return;
    }

    setIsGenerating(true);
    setStatus("Generating AI route with Gemini…");

    try {
      const parsed = parsePromptToGuidance(prompt);

      const response = await generateHoldSelection({
        boardJson: JSON.stringify(circlesData),
        selectionGuidance: parsed.selectionGuidance,
        setterNotes: aiInstructions,
      });

      const newHolds: HoldData[] = response.holds
        .map((hold: any, index: number) => {
          const colorHex = typeof hold.color === 'string' ? hold.color : '#00FF00'
          const positionSource = hold.id ?? hold.position ?? index
          if (positionSource === undefined || positionSource === null) return null

          const position = String(positionSource)
          const roleIndex = resolveRoleIndex(colorHex)
          const role = ROLE_CYCLE[roleIndex] ?? ROLE_CYCLE[1]

          return {
            position,
            roleIndex,
            displayColor: role.display,
          }
        })
        .filter((hold): hold is HoldData => hold !== null)

      if (newHolds.length === 0) {
        throw new Error("Gemini did not return any holds.");
      }

      setPresetHolds(newHolds);
      setGeneratedName(response.name ?? "");
      setAiSummary(response.summary ?? "");
      setStatus(`Gemini generated ${newHolds.length} holds.`);
    } catch (error: any) {
      const message = error?.message ?? String(error ?? "Unknown error");
      setStatus(`AI generation error: ${message}`);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSend() {
    try {
      const cfg = toLedConfig();
      if (cfg.length === 0) {
        setStatus("No active holds to send.");
        return;
      }
      const payload = await sendLedConfig(cfg);
      setStatus(
        `Sent ${cfg.length} holds. Payload: ${
          payload ? JSON.stringify(payload) : "undefined"
        }`,
      );
    } catch (error: any) {
      setStatus(`Send error: ${error?.message ?? String(error)}`);
    }
  }

  return (
    <div className="boared-layout">
      <div className="boared-board-column">
        <KilterBoard
          onStateChange={setSnapshot}
          presetHolds={presetHolds ?? undefined}
          locked={isGenerating}
        />
      </div>

      <aside className="boared-info-panel">
        <h2 className="boared-info-heading">BetaBot</h2>

        <form className="boared-form" aria-label="Route metadata">
          <div className="boared-field">
            <span className="boared-field-label">Bluetooth</span>
            <ConnectKilter />
          </div>

          {generatedName && (
            <div className="boared-field">
              <span className="boared-field-label">Route name</span>
              <div className="boared-generated-name">{generatedName}</div>
            </div>
          )}

          <label className="boared-field">
            <span className="boared-field-label">AI instructions</span>
            <textarea
              value={aiInstructions}
              onChange={handleAiInstructionsChange}
              placeholder="Describe the style, grade, or movement theme."
              className="boared-textarea"
              rows={3}
            />
          </label>

          <div className="boared-field boared-field--actions">
            <span className="boared-field-label">Actions</span>
            <div className="boared-action-row">
              <button
                type="button"
                className="boared-button"
                onClick={handleGenerateAi}
                disabled={isGenerating}
              >
                {isGenerating ? "Generating…" : "Generate with Gemini"}
              </button>
              <button
                type="button"
                className="boared-button boared-button--ghost"
                onClick={handleSend}
                disabled={isGenerating}
              >
                Send to Board
              </button>
            </div>
            <span className="boared-helper boared-helper--status">{status}</span>
          </div>
        </form>

        {aiSummary && (
          <div className="boared-info-block">
            <span className="boared-info-label">AI summary</span>
            <code className="boared-info-value">{aiSummary}</code>
          </div>
        )}

        {/*
        <div className="boared-info-block">
          <span className="boared-info-label">Active holds</span>
          <code className="boared-info-value">{activeHoldSummary}</code>
        </div>
        <div className="boared-info-block">
          <span className="boared-info-label">Final packet</span>
          <code className="boared-info-value">{finalPacket}</code>
        </div>
``        */}
        
        {snapshot && snapshot.debug.length > 0 && false && (
          <div className="boared-debug">
            <span className="boared-info-label">Debug breakdown</span>
            <div className="boared-debug-grid">
              {snapshot.debug.map((entry) => (
                <div key={entry.holdId} className="boared-debug-row">
                  <span className="boared-debug-hold">Hold {entry.holdId}</span>
                  <span>
                    pos={entry.position} ({entry.positionBytes[0]}, {entry.positionBytes[1]})
                  </span>
                  <span>
                    color={entry.color} ({entry.colorHex})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};

export default Boared;
