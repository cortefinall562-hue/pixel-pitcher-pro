import { useEffect, useState } from "react";
import { Copy, Globe, Lock, Shuffle, Trophy, X } from "lucide-react";
import { CLUBS, type Club } from "@/game/clubs";
import { divisionFor, makeRoomCode, type OnlineState } from "@/game/online";

export interface OnlineStart {
  mode: "random" | "private";
  code: string;
  isHost: boolean;
  rivalName: string;
}

export default function OnlineLobby({
  club,
  online,
  onClose,
  onStart,
}: {
  club: Club;
  online: OnlineState;
  onClose: () => void;
  onStart: (start: OnlineStart) => void;
}) {
  const [tab, setTab] = useState<"random" | "private">("random");
  const [searching, setSearching] = useState(false);
  const [dots, setDots] = useState(0);
  const [hostCode, setHostCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const rivals = CLUBS.filter((c) => c.id !== club.id);
  const randomRival = () => rivals[Math.floor(Math.random() * rivals.length)]!.name;

  useEffect(() => {
    if (!searching) return;
    const tick = window.setInterval(() => setDots((d) => (d + 1) % 4), 350);
    const found = window.setTimeout(() => {
      onStart({ mode: "random", code: makeRoomCode(), isHost: true, rivalName: randomRival() });
    }, 2200);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(found);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searching]);

  const division = divisionFor(online.points);

  return (
    <div className="fixed inset-0 z-50 grid animate-fade-in place-items-center bg-black/75 p-4 sm:p-6">
      <div className="panel w-full max-w-2xl animate-scale-in p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div>
            <p className="field-label">Modo online cara a cara</p>
            <h2 className="mt-1 font-display text-2xl text-foreground">
              1<span className="text-turf">v</span>1 EN TIEMPO REAL
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="ml-auto rounded-xl border border-border p-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>

        {/* PUNTOS DE LIGA */}
        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-turf/40 bg-turf/10 p-4">
            <p className="field-label">Puntos de liga</p>
            <p className="mt-1 font-display text-3xl text-turf">{online.points}</p>
          </div>
          <div className="rounded-xl border border-border bg-secondary/50 p-4">
            <p className="field-label">División</p>
            <p className="mt-1 flex items-center gap-2 font-display text-sm text-foreground">
              <Trophy size={15} className="text-[#f5c53d]" /> {division}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-secondary/50 p-4">
            <p className="field-label">Récord</p>
            <p className="mt-1 font-display text-sm text-foreground">
              {online.wins}V · {online.draws}E · {online.losses}D
            </p>
          </div>
          <div className="rounded-xl border border-border bg-secondary/50 p-4">
            <p className="field-label">Premios</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              +3 pts y $1M · Empate +1 pt y $300K · Derrota -1 pt
            </p>
          </div>
        </div>

        {/* TABS */}
        <div className="mt-6 flex gap-2">
          {(
            [
              ["random", "🎲 PARTIDA ALEATORIA"],
              ["private", "🔒 SALA PRIVADA"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => {
                setTab(id);
                setSearching(false);
                setError(null);
              }}
              className={`flex-1 rounded-xl border px-4 py-2.5 font-display text-xs tracking-widest transition-colors ${
                tab === id
                  ? "border-turf/60 bg-turf/15 text-turf"
                  : "border-border bg-secondary/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "random" && (
          <div className="mt-5 rounded-xl border border-border bg-secondary/40 p-6 text-center">
            {searching ? (
              <>
                <Globe
                  size={34}
                  className="mx-auto animate-spin text-turf"
                  style={{ animationDuration: "3s" }}
                />
                <p className="mt-4 font-display text-lg text-foreground">
                  BUSCANDO RIVAL{".".repeat(dots)}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Emparejando por GRL de plantilla similar…
                </p>
                <button className="btn-ghost mt-6 w-full" onClick={() => setSearching(false)}>
                  CANCELAR
                </button>
              </>
            ) : (
              <>
                <Shuffle size={30} className="mx-auto text-turf" />
                <p className="mt-3 text-sm text-muted-foreground">
                  Matchmaking automático contra un mánager de nivel parecido.
                </p>
                <button className="btn-play mt-5 w-full" onClick={() => setSearching(true)}>
                  BUSCAR PARTIDA
                </button>
              </>
            )}
          </div>
        )}

        {tab === "private" && (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-secondary/40 p-5">
              <p className="field-label">Crear sala</p>
              {hostCode ? (
                <>
                  <p className="mt-3 font-display text-4xl tracking-[0.25em] text-turf">{hostCode}</p>
                  <button
                    onClick={() => void navigator.clipboard?.writeText(hostCode)}
                    className="mt-3 flex items-center gap-2 text-xs tracking-widest text-muted-foreground hover:text-foreground"
                  >
                    <Copy size={13} /> COPIAR CÓDIGO
                  </button>
                  <button
                    className="btn-play mt-4 w-full"
                    onClick={() =>
                      onStart({
                        mode: "private",
                        code: hostCode,
                        isHost: true,
                        rivalName: randomRival(),
                      })
                    }
                  >
                    ENTRAR A LA SALA
                  </button>
                </>
              ) : (
                <>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Genera un código de 5 dígitos y compartilo con tu amigo.
                  </p>
                  <button
                    className="btn-play mt-5 w-full"
                    onClick={() => setHostCode(makeRoomCode())}
                  >
                    CREAR SALA
                  </button>
                </>
              )}
            </div>

            <div className="rounded-xl border border-border bg-secondary/40 p-5">
              <p className="field-label">Unirse a sala</p>
              <label htmlFor="room-code" className="sr-only">
                Código de sala
              </label>
              <input
                id="room-code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 5))}
                placeholder="A9X21"
                className="mt-3 w-full rounded-xl border border-border bg-secondary px-4 py-3 text-center font-display text-2xl tracking-[0.25em] text-foreground placeholder:text-muted-foreground focus:border-turf focus:outline-none"
              />
              {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
              <button
                className="btn-play mt-4 flex w-full items-center justify-center gap-2"
                onClick={() => {
                  if (joinCode.length !== 5) {
                    setError("El código debe tener 5 caracteres.");
                    return;
                  }
                  onStart({
                    mode: "private",
                    code: joinCode,
                    isHost: false,
                    rivalName: randomRival(),
                  });
                }}
              >
                <Lock size={16} /> UNIRSE
              </button>
            </div>
          </div>
        )}

        <p className="mt-5 text-[11px] leading-relaxed text-muted-foreground">
          Si el rival se desconecta, la victoria (+3 puntos) es automática para quien se quede en la
          sala. El relator narra el partido en español con estilo Mariano Closs.
        </p>
      </div>
    </div>
  );
}
