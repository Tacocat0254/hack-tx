import { useEffect, useState } from "react";
import {
  connectIfNeeded,
  disconnectIfPossible,
  detectConnected,
  getKilter,
} from "../lib/KilterClient";

type ConnectionState = "idle" | "connecting" | "connected" | "error";

export default function ConnectKilter() {
  const [state, setState] = useState<ConnectionState>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (detectConnected()) {
      setState("connected");
      setMessage("Connected to Kilter Board ✅");
    }
  }, []);

  async function handleConnect() {
    if (state === "connecting") return;

    if (state === "connected") {
      await handleDisconnect();
      return;
    }

    setState("connecting");
    setMessage("Requesting Bluetooth device…");

    try {
      await connectIfNeeded();

      if (!detectConnected(getKilter())) {
        throw new Error("Device did not confirm the connection.");
      }

      setState("connected");
      setMessage("Connected to Kilter Board ✅");
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : String(error ?? "Unknown error");
      setState("error");
      setMessage(msg);
    }
  }

  async function handleDisconnect() {
    try {
      await disconnectIfPossible();
      setState("idle");
      setMessage("Disconnected.");
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : String(error ?? "Unknown error");
      setState("error");
      setMessage(msg);
    }
  }

  const isBusy = state === "connecting";
  const isConnected = state === "connected";

  const buttonLabel = isConnected
    ? "Disconnect"
    : isBusy
      ? "Connecting…"
      : "Connect Bluetooth";
  const buttonClassName = isConnected
    ? "boared-button boared-button--ghost"
    : "boared-button";

  return (
    <div className="boared-connect">
      <button
        type="button"
        className={buttonClassName}
        onClick={handleConnect}
        disabled={isBusy}
      >
        {buttonLabel}
      </button>

      <span className={`boared-helper boared-status boared-status--${state}`}>
        {message}
      </span>
    </div>
  );
}
