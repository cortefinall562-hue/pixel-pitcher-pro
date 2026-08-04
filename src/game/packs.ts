import { CLUBS } from "@/game/clubs";
import type { Position } from "@/game/career";

export type PackTier = "bronze" | "silver" | "gold";

export interface PackDef {
  tier: PackTier;
  name: string;
  subtitle: string;
  price: number;
  min: number;
  max: number;
  accent: [string, string];
  emoji: string;
  range: string;
}

export const PACKS: PackDef[] = [
  {
    tier: "bronze",
    name: "SOBRE BRONCE",
    subtitle: "Básico",
    price: 5_000_000,
    min: 75,
    max: 83,
    accent: ["#b46a2b", "#6b3a13"],
    emoji: "🥉",
    range: "75 - 83 GRL",
  },
  {
    tier: "silver",
    name: "SOBRE PLATA",
    subtitle: "Intermedio",
    price: 15_000_000,
    min: 83,
    max: 87,
    accent: ["#c9d3dd", "#61707f"],
    emoji: "🥈",
    range: "83 - 87 GRL",
  },
  {
    tier: "gold",
    name: "SOBRE ORO · ULTIMATE TOTY",
    subtitle: "Máximo",
    price: 45_000_000,
    min: 90,
    max: 95,
    accent: ["#f5c53d", "#8d6108"],
    emoji: "🏆",
    range: "90+ GRL garantizado",
  },
];

export function getPack(tier: PackTier): PackDef {
  return PACKS.find((p) => p.tier === tier) ?? PACKS[0]!;
}

export interface Nationality {
  name: string;
  colors: [string, string, string];
}

const NATIONS: Nationality[] = [
  { name: "Argentina", colors: ["#74acdf", "#ffffff", "#74acdf"] },
  { name: "Brasil", colors: ["#009b3a", "#ffdf00", "#002776"] },
  { name: "Francia", colors: ["#0055a4", "#ffffff", "#ef4135"] },
  { name: "España", colors: ["#aa151b", "#f1bf00", "#aa151b"] },
  { name: "Portugal", colors: ["#046a38", "#046a38", "#da291c"] },
  { name: "Inglaterra", colors: ["#ffffff", "#ce1124", "#ffffff"] },
  { name: "Italia", colors: ["#008c45", "#f4f5f0", "#cd212a"] },
  { name: "Uruguay", colors: ["#7ba6dc", "#ffffff", "#7ba6dc"] },
  { name: "Países Bajos", colors: ["#ae1c28", "#ffffff", "#21468b"] },
  { name: "Noruega", colors: ["#ba0c2f", "#ffffff", "#00205b"] },
];

const FIRST = [
  "Lucas", "Mateo", "Bruno", "Iker", "Diego", "Nahuel", "Tomás", "Andrés",
  "Julián", "Emilio", "Rafa", "Santi", "Facundo", "Marco", "Dylan", "Óscar",
];
const LAST = [
  "Ferreyra", "Bianchi", "Almada", "Rossi", "Moretti", "Vidal", "Cardoso",
  "Sanabria", "Quintero", "Ibáñez", "Duarte", "Lindström", "Okafor", "Petit",
];
const STAR_FIRST = ["Kylian", "Vinicius", "Erling", "Jude", "Lamine", "Rodrigo", "Federico", "Alexis"];
const STAR_LAST = ["Mbeppé", "Jr. Santos", "Halland", "Bellingher", "Yamalí", "De Paulo", "Valverdi", "Mac Alister"];

export const POSITIONS: Position[] = ["POR", "DEF", "MED", "DEL"];

export interface CardStat {
  label: string;
  value: number;
}

export interface PlayerCard {
  id: string;
  name: string;
  pos: Position;
  ovr: number;
  value: number;
  tier: PackTier;
  nationality: Nationality;
  clubName: string;
  crest: [string, string];
  stats: CardStat[];
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function jitter(base: number, spread: number) {
  return Math.max(40, Math.min(99, base + Math.round((Math.random() - 0.5) * spread)));
}

export function cardValue(ovr: number, tier: PackTier) {
  const mult = tier === "gold" ? 1_900_000 : tier === "silver" ? 900_000 : 450_000;
  return Math.round((Math.pow(Math.max(1, ovr - 60) / 8, 2) * mult) / 50_000) * 50_000;
}

export function rollCard(tier: PackTier): PlayerCard {
  const pack = getPack(tier);
  const ovr = pack.min + Math.floor(Math.random() * (pack.max - pack.min + 1));
  const club = pick(CLUBS);
  const gold = tier === "gold";
  const name = gold
    ? `${pick(STAR_FIRST)} ${pick(STAR_LAST)}`
    : `${pick(FIRST)} ${pick(LAST)}`;
  const pos = pick(gold ? (["MED", "DEL", "DEF"] as Position[]) : POSITIONS);
  return {
    id: `card-${Date.now().toString(36)}-${Math.floor(Math.random() * 9999)}`,
    name,
    pos,
    ovr,
    value: cardValue(ovr, tier),
    tier,
    nationality: pick(NATIONS),
    clubName: club.name,
    crest: club.crest,
    stats: [
      { label: "RIT", value: jitter(ovr, 10) },
      { label: "TIR", value: jitter(ovr, 12) },
      { label: "PAS", value: jitter(ovr, 10) },
      { label: "REG", value: jitter(ovr, 10) },
      { label: "DEF", value: jitter(ovr - 6, 16) },
      { label: "FÍS", value: jitter(ovr, 12) },
    ],
  };
}

/** Duración total (en segundos) de la cinemática según el sobre. */
export function cinematicLength(tier: PackTier) {
  return tier === "gold" ? 8 : tier === "silver" ? 4.6 : 2.6;
}
