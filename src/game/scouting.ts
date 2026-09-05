import type { Position } from "@/game/career";

export interface ScoutRegion {
  id: string;
  name: string;
  flag: string;
  cost: number;
  /** cuántos partidos tarda la misión */
  matches: number;
  /** sesgo de potencial */
  bias: number;
  blurb: string;
}

export const REGIONS: ScoutRegion[] = [
  {
    id: "sudamerica",
    name: "Sudamérica",
    flag: "🌎",
    cost: 1_200_000,
    matches: 2,
    bias: 5,
    blurb: "Canteras de barrio, gambeta y descaro. Máximo potencial bruto.",
  },
  {
    id: "europa",
    name: "Europa Central",
    flag: "🏰",
    cost: 2_000_000,
    matches: 2,
    bias: 3,
    blurb: "Academias con método: juveniles más terminados desde el día uno.",
  },
  {
    id: "africa",
    name: "África Occidental",
    flag: "🌍",
    cost: 900_000,
    matches: 3,
    bias: 6,
    blurb: "Físico y explosión. Ojo barato, paciencia larga.",
  },
  {
    id: "asia",
    name: "Asia-Pacífico",
    flag: "🎏",
    cost: 700_000,
    matches: 3,
    bias: 1,
    blurb: "Mercado emergente: fichas económicas con techo medio.",
  },
];

export const FOCUS: { id: Position | "any"; label: string }[] = [
  { id: "any", label: "Cualquier puesto" },
  { id: "POR", label: "Portero" },
  { id: "DEF", label: "Defensa" },
  { id: "MED", label: "Mediocampo" },
  { id: "DEL", label: "Delantero" },
];

export interface ScoutMission {
  id: string;
  regionId: string;
  focus: Position | "any";
  matchesLeft: number;
  total: number;
}

export interface Prospect {
  id: string;
  name: string;
  pos: Position;
  age: number;
  ovr: number;
  potential: number;
  value: number;
  regionId: string;
  /** 1 a 5 estrellas de potencial */
  stars: number;
  trait: string;
}

const NAMES: Record<string, [string[], string[]]> = {
  sudamerica: [
    ["Thiago", "Benjamín", "Valentín", "Lautaro", "Ezequiel", "Joaquín", "Ciro"],
    ["Zabaleta", "Cardozo", "Villalba", "Bermúdez", "Sosa", "Maidana", "Cabral"],
  ],
  europa: [
    ["Luka", "Mats", "Andrei", "Jonas", "Nico", "Emil", "Tomás"],
    ["Havertz", "Kovacic", "Bergwijn", "Lindqvist", "Marchetti", "Novak", "Dumont"],
  ],
  africa: [
    ["Ibrahim", "Samuel", "Yaya", "Kwame", "Moussa", "Amadou", "Zico"],
    ["Okafor", "Diarra", "Mensah", "Boateng", "Ndiaye", "Traoré", "Osei"],
  ],
  asia: [
    ["Kenji", "Min-Jae", "Hiro", "Arata", "Rei", "Jae-Sung", "Kai"],
    ["Tanaka", "Kim", "Nakamura", "Watanabe", "Park", "Sato", "Chen"],
  ],
};

const TRAITS = [
  "Pierna zurda letal",
  "Cabeceador aéreo",
  "Velocidad explosiva",
  "Visión de juego",
  "Presión incansable",
  "Regate en espacios cortos",
  "Pegada de larga distancia",
  "Liderazgo precoz",
];

let seq = 0;
function uid() {
  seq += 1;
  return `y${Date.now().toString(36)}${seq}`;
}

export function getRegion(id: string) {
  return REGIONS.find((r) => r.id === id) ?? REGIONS[0]!;
}

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export function startMission(regionId: string, focus: Position | "any"): ScoutMission {
  const region = getRegion(regionId);
  return {
    id: uid(),
    regionId,
    focus,
    matchesLeft: region.matches,
    total: region.matches,
  };
}

export function generateProspects(mission: ScoutMission): Prospect[] {
  const region = getRegion(mission.regionId);
  const [first, last] = NAMES[region.id] ?? NAMES["europa"]!;
  const count = 1 + Math.floor(Math.random() * 3);
  const positions: Position[] = ["POR", "DEF", "MED", "DEL"];
  return Array.from({ length: count }, () => {
    const pos = mission.focus === "any" ? pick(positions) : mission.focus;
    const age = 16 + Math.floor(Math.random() * 4);
    const ovr = 56 + Math.floor(Math.random() * 14) + Math.round(region.bias / 2);
    const potential = Math.min(94, ovr + 8 + Math.floor(Math.random() * 14) + region.bias);
    const stars = Math.max(1, Math.min(5, Math.round((potential - 66) / 5)));
    const value = Math.round(((potential - 55) ** 2 * 26_000 + 180_000) / 50_000) * 50_000;
    return {
      id: uid(),
      name: `${pick(first)} ${pick(last)}`,
      pos,
      age,
      ovr,
      potential,
      value,
      regionId: region.id,
      stars,
      trait: pick(TRAITS),
    };
  });
}

/** Descuenta un partido a cada misión y devuelve las que terminaron. */
export function tickMissions(missions: ScoutMission[]) {
  const next: ScoutMission[] = [];
  const finished: ScoutMission[] = [];
  for (const m of missions) {
    const left = m.matchesLeft - 1;
    if (left <= 0) finished.push({ ...m, matchesLeft: 0 });
    else next.push({ ...m, matchesLeft: left });
  }
  return { missions: next, finished };
}
