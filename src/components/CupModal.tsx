import { Trophy, X, Zap, Sparkles } from "lucide-react";
import { CLUBS, getClub, type Club } from "@/game/clubs";
import {
  CUP_PRIZES,
  currentRound,
  isEliminated,
  playerMatch,
  rivalOf,
  winnerOf,
  type CupMatch,
  type CupState,
} from "@/game/tournament";
import { formatCoins } from "@/game/career";

function crestColors(id: string): [string, string] {
  return CLUBS.find((c) => c.id === id)?.crest ?? ["#3ddc84", "#1f2937"];
}

function Badge({ id, size = 34 }: { id: string; size?: number }) {
  const [a, b] = crestColors(id);
  const name = getClub(id).name;
  const initials = name
    .split(" ")
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
  return (
    <div
      className="grid flex-none place-items-center rounded-lg shadow-[0_4px_14px_rgb(0_0_0/0.5)]"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${a} 0% 50%, ${b} 50% 100%)`,
      }}
      aria-hidden="true"
    >
      <span className="font-display text-black/70" style={{ fontSize: size * 0.32 }}>
        {initials}
      </span>
    </div>
  );
}

function MatchRow({
  match,
  clubId,
  live,
}: {
  match: CupMatch;
  clubId: string;
  live: boolean;
}) {
  const w = winnerOf(match);
  const involved = match.home === clubId || match.away === clubId;
  return (
    <div
      className={`rounded-xl border p-2.5 transition-colors ${
        involved
          ? "border-turf/60 bg-turf/10"
          : "border-white/10 bg-white/[0.03] hover:border-white/25"
      }`}
    >
      {[match.home, match.away].map((side, i) => {
        const goals = i === 0 ? match.homeGoals : match.awayGoals;
        const isW = w === side;
        return (
          <div key={side} className="flex items-center gap-2 py-0.5">
            <Badge id={side} size={22} />
            <span
              className={`min-w-0 flex-1 truncate text-xs ${
                isW ? "font-bold text-foreground" : "text-foreground/65"
              }`}
            >
              {getClub(side).name}
            </span>
            <span
              className={`font-display text-sm ${isW ? "text-turf" : "text-foreground/50"}`}
            >
              {goals ?? "–"}
              {match.pens ? ` (${i === 0 ? match.pens[0] : match.pens[1]})` : ""}
            </span>
          </div>
        );
      })}
      {live && (
        <p className="mt-1 text-center font-display text-[10px] tracking-[0.25em] text-turf">
          TU PARTIDO
        </p>
      )}
    </div>
  );
}

export default function CupModal({
  club,
  cup,
  onCreate,
  onPlay,
  onClose,
}: {
  club: Club;
  cup: CupState | null;
  onCreate: () => void;
  onPlay: (rivalName: string) => void;
  onClose: () => void;
}) {
  const next = cup ? playerMatch(cup, club.id) : null;
  const round = cup ? currentRound(cup) : null;
  const out = cup ? isEliminated(cup, club.id) : false;
  const won = cup?.champion === club.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative flex h-[min(88vh,780px)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#080d16]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-56 opacity-70 [background:radial-gradient(ellipse_at_50%_-20%,rgb(245_197_61/0.35),transparent_65%)]" />

        <header className="relative flex items-center gap-4 border-b border-white/10 px-6 py-4">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#f5c53d]/15 text-[#f5c53d]">
            <Trophy size={22} />
          </div>
          <div>
            <p className="field-label">Competición</p>
            <h2 className="font-display text-2xl leading-none text-foreground">
              {cup?.name ?? "COPA CONTINENTAL TÁCTICA"}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="ml-auto grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-foreground/70 hover:border-white/30 hover:text-foreground"
          >
            <X size={18} />
          </button>
        </header>

        <div className="relative flex-1 overflow-y-auto px-6 py-5">
          {!cup && (
            <div className="grid h-full place-items-center text-center">
              <div className="max-w-md space-y-5">
                <Sparkles size={38} className="mx-auto text-[#f5c53d]" />
                <h3 className="font-display text-3xl text-foreground">
                  8 EQUIPOS. UN SOLO TROFEO.
                </h3>
                <p className="text-sm text-muted-foreground">
                  Eliminación directa a partido único: cuartos, semifinal y final. Jugás tus
                  llaves en 3D y el resto del cuadro se resuelve en simultáneo. Premios:{" "}
                  {CUP_PRIZES.map((p) => formatCoins(p)).join(" · ")}.
                </p>
                <button
                  onClick={onCreate}
                  className="btn-play mx-auto flex items-center justify-center gap-3 px-8"
                >
                  <Trophy size={20} /> INSCRIBIR A {club.name.toUpperCase()}
                </button>
              </div>
            </div>
          )}

          {cup && (
            <div className="space-y-6">
              {won && (
                <div className="rounded-2xl border border-[#f5c53d]/50 bg-[#f5c53d]/10 p-6 text-center">
                  <Trophy size={40} className="mx-auto text-[#f5c53d]" />
                  <h3 className="mt-3 font-display text-3xl text-[#f5c53d]">
                    ¡{club.name.toUpperCase()} CAMPEÓN!
                  </h3>
                  <p className="mt-2 text-sm text-foreground/70">
                    El trofeo ya está en la sala de las copas. Inscribite en una nueva edición
                    cuando quieras.
                  </p>
                  <button
                    onClick={onCreate}
                    className="btn-play mx-auto mt-5 flex items-center gap-3 px-8"
                  >
                    NUEVA EDICIÓN
                  </button>
                </div>
              )}

              {!won && cup.champion && (
                <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-5 text-center">
                  <p className="font-display text-xl text-foreground">
                    Campeón: {getClub(cup.champion).name}
                  </p>
                  <button
                    onClick={onCreate}
                    className="btn-play mx-auto mt-4 flex items-center gap-3 px-8"
                  >
                    NUEVA EDICIÓN
                  </button>
                </div>
              )}

              {!cup.champion && next && (
                <div className="relative overflow-hidden rounded-2xl border border-turf/40 bg-turf/[0.08] p-6">
                  <p className="field-label">{round?.name}</p>
                  <div className="mt-4 flex items-center justify-center gap-8">
                    <div className="text-center">
                      <Badge id={club.id} size={72} />
                      <p className="mt-2 text-sm font-bold text-foreground">{club.name}</p>
                    </div>
                    <p className="font-display text-3xl text-turf">VS</p>
                    <div className="text-center">
                      <Badge id={rivalOf(next, club.id)} size={72} />
                      <p className="mt-2 text-sm font-bold text-foreground">
                        {getClub(rivalOf(next, club.id)).name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onPlay(getClub(rivalOf(next, club.id)).name)}
                    className="btn-play mt-6 flex w-full items-center justify-center gap-3"
                  >
                    <Zap size={20} /> JUGAR {round?.name.toUpperCase()}
                  </button>
                </div>
              )}

              {!cup.champion && !next && out && (
                <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-5 text-center text-sm text-foreground/80">
                  Quedaste eliminado en esta edición. Podés inscribirte de nuevo.
                  <button
                    onClick={onCreate}
                    className="btn-play mx-auto mt-4 flex items-center gap-3 px-8"
                  >
                    NUEVA EDICIÓN
                  </button>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-3">
                {cup.rounds.map((r, i) => (
                  <section key={r.name} className="space-y-3">
                    <p
                      className={`font-display text-xs tracking-[0.25em] ${
                        i === cup.roundIndex ? "text-turf" : "text-foreground/45"
                      }`}
                    >
                      {r.name}
                    </p>
                    {r.matches.map((m) => (
                      <MatchRow
                        key={m.id}
                        match={m}
                        clubId={club.id}
                        live={!!next && m.id === next.id}
                      />
                    ))}
                  </section>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
