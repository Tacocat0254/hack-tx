import { getKilter, detectConnected } from "../lib/KilterClient";

export interface LedConfig { position: number; role_id: number; }

export async function sendLedConfig(config: LedConfig[]) {
  const kb: any = getKilter();
  if (!detectConnected(kb)) throw new Error("Not connected");
  return kb.led(config); // number[] | undefined
}

export async function clearLeds() {
  const kb: any = getKilter();
  if (!detectConnected(kb)) throw new Error("Not connected");
  return kb.led([]); // common "clear" convention
}
