export type League =
  | "LaLiga"
  | "Premier League"
  | "Serie A"
  | "Liga Argentina"
  | "Resto del Mundo";

export interface Club {
  id: string;
  name: string;
  league: League;
  budget: number;
  shirt: number;
  shorts: number;
  crest: [string, string];
}

export const LEAGUE_ORDER: League[] = [
  "LaLiga",
  "Premier League",
  "Serie A",
  "Liga Argentina",
  "Resto del Mundo",
];

export const CLUBS: Club[] = [
  // ---- LaLiga ----
  { id: "rma", name: "Real Madrid", league: "LaLiga", budget: 50_000_000, shirt: 0xf2f4f8, shorts: 0xe8eaef, crest: ["#f0f0f0", "#00529f"] },
  { id: "fcb", name: "FC Barcelona", league: "LaLiga", budget: 40_000_000, shirt: 0xa50044, shorts: 0x004d98, crest: ["#a50044", "#004d98"] },
  { id: "atm", name: "Atlético Madrid", league: "LaLiga", budget: 25_000_000, shirt: 0xce3524, shorts: 0x1c2c5b, crest: ["#ce3524", "#1c2c5b"] },
  { id: "bet", name: "Real Betis", league: "LaLiga", budget: 12_000_000, shirt: 0x00954c, shorts: 0xf2f4f8, crest: ["#00954c", "#ffffff"] },
  { id: "sev", name: "Sevilla FC", league: "LaLiga", budget: 10_000_000, shirt: 0xf2f4f8, shorts: 0xd81920, crest: ["#ffffff", "#d81920"] },

  // ---- Premier League ----
  { id: "mcy", name: "Man City", league: "Premier League", budget: 60_000_000, shirt: 0x6cabdd, shorts: 0xf2f4f8, crest: ["#6cabdd", "#1c2c5b"] },
  { id: "ars", name: "Arsenal", league: "Premier League", budget: 45_000_000, shirt: 0xef0107, shorts: 0xf2f4f8, crest: ["#ef0107", "#063672"] },
  { id: "liv", name: "Liverpool", league: "Premier League", budget: 45_000_000, shirt: 0xc8102e, shorts: 0xc8102e, crest: ["#c8102e", "#00b2a9"] },
  { id: "che", name: "Chelsea", league: "Premier League", budget: 35_000_000, shirt: 0x034694, shorts: 0x034694, crest: ["#034694", "#dba111"] },
  { id: "mun", name: "Man United", league: "Premier League", budget: 30_000_000, shirt: 0xda291c, shorts: 0xf2f4f8, crest: ["#da291c", "#fbe122"] },

  // ---- Serie A ----
  { id: "juv", name: "Juventus", league: "Serie A", budget: 20_000_000, shirt: 0xf2f4f8, shorts: 0x1b1b1b, crest: ["#ffffff", "#1b1b1b"] },
  { id: "int", name: "Inter Milan", league: "Serie A", budget: 25_000_000, shirt: 0x0068a8, shorts: 0x1b1b1b, crest: ["#0068a8", "#111111"] },
  { id: "mil", name: "AC Milan", league: "Serie A", budget: 22_000_000, shirt: 0xfb090b, shorts: 0x1b1b1b, crest: ["#fb090b", "#111111"] },
  { id: "rom", name: "AS Roma", league: "Serie A", budget: 15_000_000, shirt: 0x8e1f2f, shorts: 0xf2c14a, crest: ["#8e1f2f", "#f2c14a"] },
  { id: "nap", name: "Napoli", league: "Serie A", budget: 15_000_000, shirt: 0x12a0d7, shorts: 0xf2f4f8, crest: ["#12a0d7", "#ffffff"] },

  // ---- Liga Argentina ----
  { id: "boc", name: "Boca Juniors", league: "Liga Argentina", budget: 8_000_000, shirt: 0x00348e, shorts: 0x0b1b3f, crest: ["#00348e", "#f2c14a"] },
  { id: "riv", name: "River Plate", league: "Liga Argentina", budget: 9_000_000, shirt: 0xf2f4f8, shorts: 0x1b1b1b, crest: ["#ffffff", "#e2001a"] },
  { id: "rac", name: "Racing Club", league: "Liga Argentina", budget: 4_000_000, shirt: 0x6cabdd, shorts: 0xf2f4f8, crest: ["#6cabdd", "#ffffff"] },
  { id: "ind", name: "Independiente", league: "Liga Argentina", budget: 3_000_000, shirt: 0xd42027, shorts: 0xf2f4f8, crest: ["#d42027", "#ffffff"] },
  { id: "sla", name: "San Lorenzo", league: "Liga Argentina", budget: 3_000_000, shirt: 0x123a72, shorts: 0x123a72, crest: ["#123a72", "#c8102e"] },

  // ---- Resto del Mundo ----
  { id: "psg", name: "PSG", league: "Resto del Mundo", budget: 55_000_000, shirt: 0x004170, shorts: 0xf2f4f8, crest: ["#004170", "#da291c"] },
  { id: "bay", name: "Bayern Munich", league: "Resto del Mundo", budget: 40_000_000, shirt: 0xdc052d, shorts: 0xf2f4f8, crest: ["#dc052d", "#0066b2"] },
  { id: "bvb", name: "Borussia Dortmund", league: "Resto del Mundo", budget: 25_000_000, shirt: 0xfde100, shorts: 0x1b1b1b, crest: ["#fde100", "#111111"] },
  { id: "mia", name: "Inter Miami", league: "Resto del Mundo", budget: 15_000_000, shirt: 0xf7b5cd, shorts: 0x1b1b1b, crest: ["#f7b5cd", "#231f20"] },
  { id: "nas", name: "Al-Nassr", league: "Resto del Mundo", budget: 20_000_000, shirt: 0xf2f4f8, shorts: 0xf2c14a, crest: ["#ffffff", "#f2c14a"] },
];

export const DEFAULT_CLUB_ID = "fcb";

export function getClub(id: string): Club {
  return CLUBS.find((c) => c.id === id) ?? CLUBS[1]!;
}

export function clubsByLeague(): { league: League; clubs: Club[] }[] {
  return LEAGUE_ORDER.map((league) => ({
    league,
    clubs: CLUBS.filter((c) => c.league === league),
  }));
}

export function formatBudget(n: number): string {
  return `$${n.toLocaleString("en-US")}`;
}
