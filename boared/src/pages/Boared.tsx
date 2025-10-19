import { useMemo, useState, type ChangeEvent } from "react";
import KilterBoard, { type KilterBoardSnapshot } from "../components/KilterBoard";
import ConnectKilter from "../components/ConnectKilter";
import { sendLedConfig } from "../components/sendLedConfig";

const DEFAULT_PACKET = "01 00 00 02 03";

// map your UI colors to role_ids the device expects
const ROLE_BY_COLOR: Record<string, number> = { red: 2, green: 1, blue: 3 };

const Boared = () => {
  const [snapshot, setSnapshot] = useState<KilterBoardSnapshot | null>(null);
  const [setterNotes, setSetterNotes] = useState("");
  const [routeName, setRouteName] = useState("");
  const [status, setStatus] = useState("");

  const activeHoldSummary = useMemo(() => {
    if (!snapshot || snapshot.activeHolds.length === 0) return "—";
    return snapshot.activeHolds.map(h => `#${h.color}:${h.position}`).join("  |  ");
  }, [snapshot]);

  const finalPacket = snapshot ? snapshot.encodedPayload : DEFAULT_PACKET;

  function toLedConfig() {
    if (!snapshot) return [];
    return snapshot.activeHolds.map(h => ({
      position: Number(h.position),
      role_id: ROLE_BY_COLOR[h.color] ?? 1,
    }));
  }

  const handleRouteNameChange = (e: ChangeEvent<HTMLInputElement>) => setRouteName(e.target.value);
  const handleSetterNotesChange = (e: ChangeEvent<HTMLTextAreaElement>) => setSetterNotes(e.target.value);

  async function handleSend() {
    try {
      const cfg = toLedConfig();
      if (cfg.length === 0) {
        setStatus("No active holds to send.");
        return;
      }
      const payload = await sendLedConfig(cfg);
      setStatus(`Sent ${cfg.length} holds. Payload: ${payload ? JSON.stringify(payload) : "undefined"}`);
    } catch (e: any) {
      setStatus(`Send error: ${e?.message ?? String(e)}`);
    }
  }

  return (
    <div className="boared-layout">
      <div className="boared-board-column">
        <KilterBoard onStateChange={setSnapshot} />
      </div>

      <aside className="boared-info-panel">
        <h2 className="boared-info-heading">Selection Details</h2>

        <form className="boared-form" aria-label="Route metadata">
          <div className="boared-field">
            <span className="boared-field-label">Bluetooth</span>
            <ConnectKilter />
          </div>

          <label className="boared-field">
            <span className="boared-field-label">Route name</span>
            <input value={routeName} onChange={handleRouteNameChange} placeholder="Enter a project name" className="boared-input" type="text" />
          </label>

          <label className="boared-field">
            <span className="boared-field-label">Setter notes</span>
            <textarea value={setterNotes} onChange={handleSetterNotesChange} placeholder="Add beta, grade ideas, or goals for Gemini." className="boared-textarea" rows={4}/>
            <span className="boared-helper">{setterNotes.length} character{setterNotes.length === 1 ? "" : "s"}</span>
          </label>

          <div className="boared-field boared-field--actions">
            <span className="boared-field-label">Send configuration</span>
            <button onClick={handleSend} type="button" className="boared-button">
              Send to Board
            </button>
            <span className="boared-helper boared-helper--status">{status}</span>
          </div>
        </form>

        <div className="boared-info-block">
          <span className="boared-info-label">Active holds</span>
          <code className="boared-info-value">{activeHoldSummary}</code>
        </div>

        <div className="boared-info-block">
          <span className="boared-info-label">Final packet</span>
          <code className="boared-info-value">{finalPacket}</code>
        </div>

        {snapshot && snapshot.debug.length > 0 && (
          <div className="boared-debug">
            <span className="boared-info-label">Debug breakdown</span>
            <div className="boared-debug-grid">
              {snapshot.debug.map((entry) => (
                <div key={entry.holdId} className="boared-debug-row">
                  <span className="boared-debug-hold">Hold {entry.holdId}</span>
                  <span>pos={entry.position} ({entry.positionBytes[0]},{entry.positionBytes[1]})</span>
                  <span>color={entry.color} ({entry.colorHex})</span>
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
