import { CLUBS, getClub } from "@/game/clubs";

export interface CupMatch {
  id: string;
  home: string;
  away: string;
  homeGoals: number | null;
  awayGoals: number | null;
  /** definido por penales */
  pens?: [number, number];
}

export interface CupRound {
  name: string;
  matches: CupMatch[];
}

export interface CupState {
  name: string;
  season: number;
  clubIds: string[];
  rounds: CupRound[];
  roundIndex: number;
  champion: string | null;
}

export const ROUND_NAMES = ["Cuartos de Final", "Semifinal", "Final"];

export const CUP_PRIZES = [2_000_000, 4_000_000, 9_000_000];

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function pair(ids: string[], roundIndex: number): CupRound {
  const matches: CupMatch[] = [];
  for (let i = 0; i < ids.length; i += 2) {
    matches.push({
      id: `r${roundIndex}m${i / 2}`,
      home: ids[i]!,
      away: ids[i + 1]!,
      homeGoals: null,
      awayGoals: null,
    });
  }
  return { name: ROUND_NAMES[roundIndex] ?? `Ronda ${roundIndex + 1}`, matches };
}

/** Crea una copa de 8 equipos con el club del jugador siempre dentro. */
export function createCup(clubId: string, season = 1): CupState {
  const rivals = shuffle(CLUBS.filter((c) => c.id !== clubId)).slice(0, 7).map((c) => c.id);
  const clubIds = shuffle([clubId, ...rivals]);
  return {
    name: "Copa Continental Táctica",
    season,
    clubIds,
    rounds: [pair(clubIds, 0)],
    roundIndex: 0,
    champion: null,
  };
}

export function currentRound(cup: CupState): CupRound | null {
  return cup.rounds[cup.roundIndex] ?? null;
}

/** Partido pendiente del jugador en la ronda actual. */
export function playerMatch(cup: CupState, clubId: string): CupMatch | null {
  const round = currentRound(cup);
  if (!round || cup.champion) return null;
  return (
    round.matches.find(
      (m) => (m.home === clubId || m.away === clubId) && m.homeGoals === null,
    ) ?? null
  );
}

export function rivalOf(match: CupMatch, clubId: string) {
  return match.home === clubId ? match.away : match.home;
}

function simGoals(strength: number, other: number) {
  const ratio = strength / (strength + other);
  let goals = 0;
  for (let i = 0; i < 5; i++) if (Math.random() < ratio * 0.55) goals++;
  return goals;
}

function decide(match: CupMatch): CupMatch {
  const a = getClub(match.home).budget + 6_000_000;
  const b = getClub(match.away).budget + 6_000_000;
  let hg = simGoals(a, b);
  let ag = simGoals(b, a);
  const out: CupMatch = { ...match, homeGoals: hg, awayGoals: ag };
  if (hg === ag) {
    const pa = 3 + Math.round(Math.random() * 2);
    const pb = Math.random() < a / (a + b) ? pa - 1 : pa + 1;
    out.pens = pa > pb ? [pa, pb] : [pb, pa];
    if (Math.random() < a / (a + b)) out.pens = [Math.max(pa, pb), Math.min(pa, pb)];
    else out.pens = [Math.min(pa, pb), Math.max(pa, pb)];
  }
  return out;
}

export function winnerOf(m: CupMatch): string | null {
  if (m.homeGoals === null || m.awayGoals === null) return null;
  if (m.pens) return m.pens[0] > m.pens[1] ? m.home : m.away;
  return m.homeGoals > m.awayGoals ? m.home : m.away;
}

/**
 * Registra el resultado del jugador, simula el resto de la ronda y avanza
 * el bracket. Devuelve el nuevo estado de la copa.
 */
export function applyPlayerResult(
  cup: CupState,
  clubId: string,
  goalsFor: number,
  goalsAgainst: number,
): CupState {
  const round = currentRound(cup);
  const target = playerMatch(cup, clubId);
  if (!round || !target) return cup;

  const playerIsHome = target.home === clubId;
  let played: CupMatch = {
    ...target,
    homeGoals: playerIsHome ? goalsFor : goalsAgainst,
    awayGoals: playerIsHome ? goalsAgainst : goalsFor,
  };
  if (played.homeGoals === played.awayGoals) {
    // Penales: se resuelven con leve ventaja para el jugador
    const pa = 4;
    const pb = Math.random() < 0.55 ? 3 : 5;
    played = {
      ...played,
      pens: playerIsHome ? [pa, pb] : [pb, pa],
    };
  }

  const matches = round.matches.map((m) =>
    m.id === played.id ? played : m.homeGoals === null ? decide(m) : m,
  );
  const rounds = cup.rounds.map((r, i) => (i === cup.roundIndex ? { ...r, matches } : r));

  const winners = matches.map((m) => winnerOf(m)!).filter(Boolean);
  if (winners.length === 1) {
    return { ...cup, rounds, champion: winners[0]!, roundIndex: cup.roundIndex };
  }
  return {
    ...cup,
    rounds: [...rounds, pair(winners, cup.roundIndex + 1)],
    roundIndex: cup.roundIndex + 1,
  };
}

/** El jugador quedó eliminado en la ronda actual? */
export function isEliminated(cup: CupState, clubId: string) {
  if (cup.champion) return cup.champion !== clubId;
  const round = currentRound(cup);
  if (!round) return false;
  return !round.matches.some((m) => m.home === clubId || m.away === clubId);
}
