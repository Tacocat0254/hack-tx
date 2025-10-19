// components/ConnectKilterButton.tsx
"use client";
import React from "react";
import { KilterBoard } from "@hangtime/grip-connect";

export default function ConnectKilterButton() {
  const kbRef = React.useRef<KilterBoard | null>(null);
  const [status, setStatus] = React.useState<"idle"|"connecting"|"connected"|"error">("idle");
  const [message, setMessage] = React.useState<string>("");

  // one KilterBoard instance
  React.useEffect(() => {
    kbRef.current = new KilterBoard();
    return () => { kbRef.current = null; };
  }, []);

  async function connect() {
    if (!kbRef.current) return;
    setStatus("connecting");
    setMessage("");

    try {
      // Some builds use .connect(); others expose .open()/.requestDevice()
      const kb = kbRef.current as any;
      if (typeof kb.connect === "function") {
        await kb.connect();
      } else if (typeof kb.open === "function") {
        await kb.open();
      } else if (typeof kb.requestDevice === "function") {
        await kb.requestDevice();
      } else {
        throw new Error("No connect/open method found on KilterBoard instance.");
      }

      setStatus("connected");
      setMessage("Connected to Kilter Board ✅");
    } catch (err: any) {
      setStatus("error");
      setMessage(err?.message ?? String(err));
    }
  }

  async function disconnect() {
    const kb = kbRef.current as any;
    try {
      if (kb && typeof kb.disconnect === "function") {
        await kb.disconnect();
      }
    } finally {
      setStatus("idle");
      setMessage("Disconnected.");
    }
  }

  const isBusy = status === "connecting";
  const isConnected = status === "connected";

  return (
    <div style={{ display: "inline-flex", gap: 12, alignItems: "center" }}>
      <button
        onClick={connect}
        disabled={isBusy || isConnected}
        style={{ padding: "0.5rem 0.9rem" }}
      >
        {isBusy ? "Connecting…" : isConnected ? "Connected" : "Connect Bluetooth"}
      </button>

      <button
        onClick={disconnect}
        disabled={!isConnected}
        style={{ padding: "0.5rem 0.9rem" }}
      >
        Disconnect
      </button>

      <span style={{ fontSize: 12, opacity: 0.8 }}>
        {message}
      </span>
    </div>
  );
}
