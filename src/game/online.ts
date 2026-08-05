/**
 * Modo online 1v1: puntos de liga, matchmaking y salas privadas.
 * La sincronización en tiempo real usa BroadcastChannel (mismo navegador /
 * pestañas) con heartbeat; si no aparece rival se juega contra un oponente
 * simulado con la misma latencia baja.
 */
import type { NetState } from "@/game/matchScene";

export interface OnlineState {
  version: 1;
  points: number;
  wins: number;
  draws: number;
  losses: number;
}

const KEY = "tacticafc.online.v1";

export const emptyOnline: OnlineState = {
  version: 1,
  points: 0,
  wins: 0,
  draws: 0,
  losses: 0,
};

export function loadOnline(): OnlineState {
  if (typeof window === "undefined") return emptyOnline;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyOnline;
    const parsed = JSON.parse(raw) as OnlineState;
    if (parsed?.version !== 1) return emptyOnline;
    return parsed;
  } catch {
    return emptyOnline;
  }
}

export function saveOnline(state: OnlineState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* almacenamiento no disponible */
  }
}

export const DIVISIONS = [
  { name: "Bronce III", min: 0 },
  { name: "Bronce I", min: 6 },
  { name: "Plata III", min: 15 },
  { name: "Plata I", min: 27 },
  { name: "Oro II", min: 42 },
  { name: "Élite Mundial", min: 60 },
] as const;

export function divisionFor(points: number) {
  let current = DIVISIONS[0]!;
  for (const d of DIVISIONS) if (points >= d.min) current = d;
  return current.name;
}

export type OnlineOutcome = "win" | "draw" | "loss";

export const REWARDS: Record<OnlineOutcome, { points: number; coins: number }> = {
  win: { points: 3, coins: 1_000_000 },
  draw: { points: 1, coins: 300_000 },
  loss: { points: -1, coins: 0 },
};

export function applyOutcome(state: OnlineState, outcome: OnlineOutcome): OnlineState {
  const r = REWARDS[outcome];
  return {
    ...state,
    points: Math.max(0, state.points + r.points),
    wins: state.wins + (outcome === "win" ? 1 : 0),
    draws: state.draws + (outcome === "draw" ? 1 : 0),
    losses: state.losses + (outcome === "loss" ? 1 : 0),
  };
}

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function makeRoomCode() {
  let out = "";
  for (let i = 0; i < 5; i++)
    out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]!;
  return out;
}

// ---------- Canal de red ----------

type Packet =
  | { t: "hello"; from: string }
  | { t: "welcome"; from: string }
  | { t: "state"; from: string; s: NetState }
  | { t: "bye"; from: string };

export interface RoomLink {
  code: string;
  isHost: boolean;
  /** true cuando hay un rival humano realmente conectado */
  connected: () => boolean;
  send: (s: NetState) => void;
  latest: () => NetState | null;
  /** el rival se desconectó (abandono) */
  onDropped: (cb: () => void) => void;
  close: () => void;
}

/**
 * Abre una sala. Si en `waitMs` no responde nadie, el rival se simula
 * localmente (partida contra la IA) pero el flujo online se mantiene.
 */
export function openRoom(code: string, isHost: boolean): RoomLink {
  const id = Math.random().toString(36).slice(2);
  const channel =
    typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(`tacticafc-room-${code}`) : null;
  let remote: NetState | null = null;
  let peer: string | null = null;
  let lastPacketAt = 0;
  let dropped = false;
  let onDroppedCb: (() => void) | null = null;

  const post = (p: Packet) => channel?.postMessage(p);

  channel?.addEventListener("message", (event: MessageEvent<Packet>) => {
    const p = event.data;
    if (!p || p.from === id) return;
    lastPacketAt = Date.now();
    if (p.t === "hello") {
      peer = p.from;
      post({ t: "welcome", from: id });
    } else if (p.t === "welcome") {
      peer = p.from;
    } else if (p.t === "state") {
      peer = p.from;
      remote = p.s;
    } else if (p.t === "bye" && peer === p.from) {
      peer = null;
      remote = null;
      dropped = true;
      onDroppedCb?.();
    }
  });

  post({ t: "hello", from: id });

  const watchdog = window.setInterval(() => {
    if (!peer || dropped) return;
    if (Date.now() - lastPacketAt > 4000) {
      peer = null;
      remote = null;
      dropped = true;
      onDroppedCb?.();
    }
  }, 1000);

  return {
    code,
    isHost,
    connected: () => peer !== null,
    send: (s) => post({ t: "state", from: id, s }),
    latest: () => remote,
    onDropped: (cb) => {
      onDroppedCb = cb;
      if (dropped) cb();
    },
    close: () => {
      post({ t: "bye", from: id });
      window.clearInterval(watchdog);
      channel?.close();
    },
  };
}
