/**
 * Relator sintético estilo Mariano Closs usando Web Speech Synthesis API.
 * Tono épico, acelerado y enfático en jugadas de peligro.
 */

export type CommentEvent =
  | "kickoff"
  | "danger"
  | "nearmiss"
  | "goal"
  | "goalRival"
  | "fulltime"
  | "opponentLeft";

interface Line {
  phrases: string[];
  rate: number;
  pitch: number;
  volume: number;
  /** ms mínimos entre repeticiones del mismo disparador */
  cooldown: number;
  priority: number;
}

const LINES: Record<CommentEvent, Line> = {
  kickoff: {
    phrases: [
      "¡Preparen los motores, mueven la pelota y ya estamos viviendo esta gran final!",
    ],
    rate: 1.05,
    pitch: 1,
    volume: 1,
    cooldown: 30000,
    priority: 2,
  },
  danger: {
    phrases: [
      "¡Atención que se viene! ¡Atención que va a tirar!",
      "¡Cuidado, cuidado que llega el peligro!",
      "¡Se abre la cancha, atención que se viene!",
    ],
    rate: 1.35,
    pitch: 1.15,
    volume: 1,
    cooldown: 7000,
    priority: 1,
  },
  nearmiss: {
    phrases: [
      "¡UUUHHH! ¡Pasó raspando el palo, qué cerca estuvo!",
      "¡Uuuh! ¡Se fue apenas afuera, casi el golazo!",
    ],
    rate: 1.3,
    pitch: 1.2,
    volume: 1,
    cooldown: 4000,
    priority: 2,
  },
  goal: {
    phrases: [
      "¡GOOOOOOOL! ¡GOOOOOOLAZO ENORME! ¡Impresionante definición!",
      "¡GOOOOOL! ¡Qué manera de gritarlo, señoras y señores!",
    ],
    rate: 1.15,
    pitch: 1.25,
    volume: 1,
    cooldown: 1500,
    priority: 3,
  },
  goalRival: {
    phrases: [
      "Gol del rival... silencio en el estadio, hay que reaccionar.",
      "Golpe duro: convierte el rival y cambia la historia del partido.",
    ],
    rate: 1,
    pitch: 0.95,
    volume: 1,
    cooldown: 1500,
    priority: 3,
  },
  fulltime: {
    phrases: ["¡Premio para el que más buscó! Fin del partido, señoras y señores."],
    rate: 1.05,
    pitch: 1,
    volume: 1,
    cooldown: 30000,
    priority: 3,
  },
  opponentLeft: {
    phrases: [
      "¡Se fue el rival! Abandonó la sala y los puntos quedan en casa.",
    ],
    rate: 1.1,
    pitch: 1.05,
    volume: 1,
    cooldown: 20000,
    priority: 3,
  },
};

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  return (
    voices.find((v) => v.lang.toLowerCase() === "es-ar") ??
    voices.find((v) => v.lang.toLowerCase().startsWith("es-4") ) ??
    voices.find((v) => v.lang.toLowerCase().startsWith("es-mx")) ??
    voices.find((v) => v.lang.toLowerCase().startsWith("es-es")) ??
    voices.find((v) => v.lang.toLowerCase().startsWith("es")) ??
    null
  );
}

export interface Commentator {
  say: (event: CommentEvent) => void;
  setEnabled: (on: boolean) => void;
  enabled: () => boolean;
  dispose: () => void;
}

export function createCommentator(initialEnabled = true): Commentator {
  const supported =
    typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  let on = initialEnabled;
  let voice: SpeechSynthesisVoice | null = null;
  const lastAt = new Map<CommentEvent, number>();
  let speakingPriority = 0;

  if (supported) {
    voice = pickVoice();
    window.speechSynthesis.addEventListener("voiceschanged", onVoices);
  }

  function onVoices() {
    voice = pickVoice();
  }

  function say(event: CommentEvent) {
    if (!supported || !on) return;
    const line = LINES[event];
    const now = Date.now();
    if (now - (lastAt.get(event) ?? 0) < line.cooldown) return;
    if (window.speechSynthesis.speaking && line.priority <= speakingPriority) return;
    if (window.speechSynthesis.speaking && line.priority > speakingPriority) {
      window.speechSynthesis.cancel();
    }
    lastAt.set(event, now);
    speakingPriority = line.priority;

    const phrase = line.phrases[Math.floor(Math.random() * line.phrases.length)]!;
    const utter = new SpeechSynthesisUtterance(phrase);
    utter.lang = voice?.lang ?? "es-AR";
    if (voice) utter.voice = voice;
    utter.rate = line.rate;
    utter.pitch = line.pitch;
    utter.volume = line.volume;
    utter.onend = () => {
      speakingPriority = 0;
    };
    window.speechSynthesis.speak(utter);
  }

  return {
    say,
    setEnabled: (value: boolean) => {
      on = value;
      if (!value && supported) window.speechSynthesis.cancel();
    },
    enabled: () => on,
    dispose: () => {
      if (!supported) return;
      window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
      window.speechSynthesis.cancel();
    },
  };
}
