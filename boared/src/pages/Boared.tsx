import { useMemo, useState, type ChangeEvent } from "react";
import KilterBoard, {
  type KilterBoardSnapshot,
} from "../components/KilterBoard";

const DEFAULT_PACKET = "01 00 00 02 03";

const Boared = () => {
  const [snapshot, setSnapshot] = useState<KilterBoardSnapshot | null>(null);

  const activeHoldSummary = useMemo(() => {
    if (!snapshot || snapshot.activeHolds.length === 0) {
      return "—";
    }

    return snapshot.activeHolds
      .map((hold) => `#${hold.color}:${hold.position}`)
      .join("  |  ");
  }, [snapshot]);

  const finalPacket = snapshot ? snapshot.encodedPayload : DEFAULT_PACKET;
  const [setterNotes, setSetterNotes] = useState("");
  const [routeName, setRouteName] = useState("");

  const handleRouteNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setRouteName(event.target.value);
  };

  const handleSetterNotesChange = (
    event: ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setSetterNotes(event.target.value);
  };

  return (
    <div className="boared-layout">
      <div className="boared-board-column">
        <KilterBoard onStateChange={setSnapshot} />
      </div>

      <aside className="boared-info-panel">
        <h2 className="boared-info-heading">Selection Details</h2>

        <form className="boared-form" aria-label="Route metadata">
          <label className="boared-field">
            <span className="boared-field-label">Route name</span>
            <input
              value={routeName}
              onChange={handleRouteNameChange}
              placeholder="Enter a project name"
              className="boared-input"
              type="text"
            />
          </label>

          <label className="boared-field">
            <span className="boared-field-label">Setter notes</span>
            <textarea
              value={setterNotes}
              onChange={handleSetterNotesChange}
              placeholder="Add beta, grade ideas, or goals for Gemini."
              className="boared-textarea"
              rows={4}
            />
            <span className="boared-helper">
              {setterNotes.length} character{setterNotes.length === 1 ? "" : "s"}
            </span>
          </label>
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
                  <span className="boared-debug-hold">
                    Hold {entry.holdId}
                  </span>
                  <span>
                    pos={entry.position} ({entry.positionBytes[0]},
                    {entry.positionBytes[1]})
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
