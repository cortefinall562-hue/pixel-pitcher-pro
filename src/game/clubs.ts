export interface Club {
  id: string;
  name: string;
  budget: number;
  shirt: number;
  shorts: number;
  crest: [string, string];
}

export const CLUBS: Club[] = [
  {
    id: "rma",
    name: "Real Madrid",
    budget: 25_000_000,
    shirt: 0xf2f4f8,
    shorts: 0xe8eaef,
    crest: ["#f0f0f0", "#00529f"],
  },
  {
    id: "fcb",
    name: "FC Barcelona",
    budget: 20_000_000,
    shirt: 0xa50044,
    shorts: 0x004d98,
    crest: ["#a50044", "#004d98"],
  },
  {
    id: "mcy",
    name: "Manchester City",
    budget: 30_000_000,
    shirt: 0x6cabdd,
    shorts: 0xf2f4f8,
    crest: ["#6cabdd", "#1c2c5b"],
  },
  {
    id: "boc",
    name: "Boca Juniors",
    budget: 5_000_000,
    shirt: 0x00348e,
    shorts: 0x0b1b3f,
    crest: ["#00348e", "#f2c14a"],
  },
];

export const DEFAULT_CLUB_ID = "fcb";

export function getClub(id: string): Club {
  return CLUBS.find((c) => c.id === id) ?? CLUBS[1]!;
}

export function formatBudget(n: number): string {
  return `$${n.toLocaleString("en-US")}`;
}
