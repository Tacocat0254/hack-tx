// src/lib/KilterClient.ts
import { KilterBoard } from "@hangtime/grip-connect";

let kb: KilterBoard | null = null;

export function getKilter(): KilterBoard {
  if (!kb) kb = new KilterBoard();
  return kb;
}

export function detectConnected(device?: any): boolean {
  const d = device ?? kb;
  return !!(
    d &&
    (d.connected === true ||
     d.isConnected === true ||
     d.device?.gatt?.connected === true)
  );
}

/** Optionally handy if you want a single call elsewhere */
export async function connectIfNeeded(): Promise<void> {
  const dev: any = getKilter();
  if (detectConnected(dev)) return;

  if (typeof dev.connect === "function")      await dev.connect();
  else if (typeof dev.open === "function")    await dev.open();
  else if (typeof dev.requestDevice === "function") await dev.requestDevice();
  else throw new Error("No connect method on KilterBoard");

  if (!detectConnected(dev)) {
    throw new Error("No device selected or connection failed.");
  }
}

export async function disconnectIfPossible(): Promise<void> {
  const dev: any = getKilter();
  if (typeof dev.disconnect === "function") {
    await dev.disconnect();
  }
}
