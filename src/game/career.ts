import { CLUBS, getClub, type Club } from "@/game/clubs";
import type { CupState } from "@/game/tournament";
import type { Prospect, ScoutMission } from "@/game/scouting";

export type Position = "POR" | "DEF" | "MED" | "DEL";

export interface SquadPlayer {
  id: string;
  name: string;
  pos: Position;
  ovr: number;
  value: number;
  starter: boolean;
}

export type NegotiationSide = "buy" | "sell";

export interface OfferData {
  side: NegotiationSide;
  /** Club rival involucrado en la operación */
  clubId: string;
  playerId: string;
  playerName: string;
  pos: Position;
  ovr: number;
  value: number;
  /** Monto propuesto inicialmente por el club rival */
  amount: number;
}

export type MailKind = "offer" | "job" | "report";

export interface Mail {
  id: string;
  kind: MailKind;
  sender: string;
  subject: string;
  body: string;
  time: string;
  read: boolean;
  archived: boolean;
  resolved?: "accepted" | "rejected";
  offer?: OfferData;
  jobClubId?: string;
}

export interface CareerState {
  version: 4;
  managerName: string;
  clubId: string;
  budget: number;
  squad: SquadPlayer[];
  mails: Mail[];
  wins: number;
  trophies: number;
  /** Copa por eliminación directa en curso */
  cup: CupState | null;
  /** Ojeadores en misión */
  scouts: ScoutMission[];
  /** Juveniles detectados listos para fichar */
  prospects: Prospect[];
}

const KEY = "tacticafc.career.v4";

const FIRST = [
  "Lucas", "Mateo", "Bruno", "Iker", "Diego", "Nahuel", "Tomás", "Andrés",
  "Julián", "Emilio", "Rafa", "Santi", "Facundo", "Marco", "Dylan", "Óscar",
];
const LAST = [
  "Ferreyra", "Bianchi", "Almada", "Rossi", "Moretti", "Vidal", "Cardoso",
  "Sanabria", "Quintero", "Ibáñez", "Duarte", "Lindström", "Okafor", "Petit",
];

function rng(seed: number) {
  let s = seed || 1;
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

function hash(text: string) {
  let h = 7;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 1000000007;
  return h;
}

export function playerValue(ovr: number, budget: number) {
  const base = Math.pow(Math.max(1, ovr - 55) / 10, 2.1) * 900_000 + 250_000;
  const scale = 0.6 + Math.min(1.4, budget / 40_000_000);
  return Math.round((base * scale) / 50_000) * 50_000;
}

export function buildSquad(club: Club): SquadPlayer[] {
  const r = rng(hash(club.id));
  const layout: Position[] = [
    "POR", "DEF", "DEF", "DEF", "MED", "MED", "MED", "DEL", "DEL", "DEL", "POR", "DEF", "MED", "DEL",
  ];
  const tier = 62 + Math.round((club.budget / 60_000_000) * 22);
  return layout.map((pos, i) => {
    const ovr = Math.max(58, Math.min(92, tier + Math.round((r() - 0.45) * 12) - (i > 9 ? 6 : 0)));
    const name = `${FIRST[Math.floor(r() * FIRST.length)]} ${LAST[Math.floor(r() * LAST.length)]}`;
    return {
      id: `${club.id}-p${i}`,
      name,
      pos,
      ovr,
      value: playerValue(ovr, club.budget),
      starter: i < 10,
    };
  });
}

export function formatCoins(n: number) {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  return `$${Math.round(n / 1000)}K`;
}

let mailSeq = 0;
function mailId() {
  mailSeq += 1;
  return `m${Date.now().toString(36)}${mailSeq}`;
}

export function makeSellOfferMail(club: Club, squad: SquadPlayer[], seedShift = 0): Mail {
  const r = rng(hash(club.id) + squad.length + seedShift + Math.floor(Math.random() * 9999));
  const target = squad[Math.floor(r() * Math.min(squad.length, 10))]!;
  const buyer = CLUBS.filter((c) => c.id !== club.id)[Math.floor(r() * (CLUBS.length - 1))]!;
  const amount = Math.round((target.value * (0.72 + r() * 0.45)) / 50_000) * 50_000;
  return {
    id: mailId(),
    kind: "offer",
    sender: `Dirección Deportiva · ${buyer.name}`,
    subject: `Oferta por ${target.name} (${formatCoins(amount)})`,
    body: `Estimado mánager: presentamos una propuesta formal de ${formatCoins(amount)} por ${target.name} (${target.pos}, ${target.ovr} OVR). Su valor de mercado estimado es ${formatCoins(target.value)}. Podemos cerrarlo por correo o sentarnos a negociar cara a cara.`,
    time: "Hace 5 min",
    read: false,
    archived: false,
    offer: {
      side: "sell",
      clubId: buyer.id,
      playerId: target.id,
      playerName: target.name,
      pos: target.pos,
      ovr: target.ovr,
      value: target.value,
      amount,
    },
  };
}

export function makeBuyOfferMail(club: Club, seedShift = 0): Mail {
  const r = rng(hash(club.id) * 3 + seedShift + Math.floor(Math.random() * 9999));
  const seller = CLUBS.filter((c) => c.id !== club.id)[Math.floor(r() * (CLUBS.length - 1))]!;
  const ovr = 70 + Math.floor(r() * 18);
  const pos: Position = (["DEF", "MED", "DEL"] as Position[])[Math.floor(r() * 3)]!;
  const name = `${FIRST[Math.floor(r() * FIRST.length)]} ${LAST[Math.floor(r() * LAST.length)]}`;
  const value = playerValue(ovr, seller.budget);
  return {
    id: mailId(),
    kind: "offer",
    sender: `Agencia de Representación · ${seller.name}`,
    subject: `${name} está disponible (${formatCoins(value)})`,
    body: `${seller.name} escucha ofertas por ${name} (${pos}, ${ovr} OVR). Valor estimado: ${formatCoins(value)}. Si te interesa, agendá una reunión con su director técnico.`,
    time: "Hace 22 min",
    read: false,
    archived: false,
    offer: {
      side: "buy",
      clubId: seller.id,
      playerId: `${seller.id}-t${Math.floor(r() * 99)}`,
      playerName: name,
      pos,
      ovr,
      value,
      amount: value,
    },
  };
}

export function makeJobOfferMail(currentClub: Club): Mail {
  const better = CLUBS.filter((c) => c.budget > currentClub.budget);
  const target = (better.length ? better : CLUBS.filter((c) => c.id !== currentClub.id))[
    Math.floor(Math.random() * (better.length || CLUBS.length - 1))
  ]!;
  return {
    id: mailId(),
    kind: "job",
    sender: `Presidencia · ${target.name}`,
    subject: `Propuesta para dirigir a ${target.name}`,
    body: `Seguimos tu campaña con mucha atención. Te ofrecemos el banquillo de ${target.name} (${target.league}) con un presupuesto de fichajes de ${formatCoins(target.budget)}. Si aceptás, asumís de inmediato con nueva plantilla, escudo y camisetas.`,
    time: "Hace 1 hora",
    read: false,
    archived: false,
    jobClubId: target.id,
  };
}

export function makeReportMail(club: Club, budget: number, wins: number): Mail {
  return {
    id: mailId(),
    kind: "report",
    sender: "Departamento Financiero",
    subject: "Informe financiero y de estado",
    body: `Saldo disponible: ${formatCoins(budget)}. Victorias en la temporada: ${wins}. Premios por rendimiento acreditados. Aviso: 2 contratos de la plantilla de ${club.name} expiran al final de la temporada.`,
    time: "Hoy",
    read: false,
    archived: false,
  };
}

export function initialCareer(managerName: string, clubId: string): CareerState {
  const club = getClub(clubId);
  const squad = buildSquad(club);
  return {
    version: 4,
    managerName,
    clubId,
    budget: club.budget,
    squad,
    wins: 0,
    trophies: 0,
    cup: null,
    scouts: [],
    prospects: [],
    mails: [
      {
        id: mailId(),
        kind: "report",
        sender: "Presidente del Club",
        subject: "¡Bienvenido Mánager!",
        body: `El vestuario de ${club.name} te espera. Tenés ${formatCoins(club.budget)} para armar el proyecto. Revisá las ofertas que lleguen a esta bandeja.`,
        time: "Hace 1 día",
        read: false,
        archived: false,
      },
      makeReportMail(club, club.budget, 0),
      makeSellOfferMail(club, squad, 1),
      makeBuyOfferMail(club, 2),
    ],
  };
}

export function loadCareer(): CareerState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CareerState;
    if (parsed?.version !== 4) return null;
    return {
      ...parsed,
      cup: parsed.cup ?? null,
      scouts: parsed.scouts ?? [],
      prospects: parsed.prospects ?? [],
    };
  } catch {
    return null;
  }
}

export function saveCareer(state: CareerState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* almacenamiento no disponible */
  }
}

export function clearCareer() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}
