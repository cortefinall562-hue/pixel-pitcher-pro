import { useState } from "react";
import { Binoculars, Star, X, Radar, Trash2, Check } from "lucide-react";
import { formatCoins, type Position } from "@/game/career";
import {
  FOCUS,
  REGIONS,
  getRegion,
  type Prospect,
  type ScoutMission,
} from "@/game/scouting";

function Stars({ n }: { n: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${n} de 5 estrellas`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={13}
          className={i < n ? "text-[#f5c53d]" : "text-foreground/20"}
          fill={i < n ? "currentColor" : "none"}
        />
      ))}
    </span>
  );
}

export default function ScoutingModal({
  budget,
  scouts,
  prospects,
  onSend,
  onSign,
  onDiscard,
  onClose,
}: {
  budget: number;
  scouts: ScoutMission[];
  prospects: Prospect[];
  onSend: (regionId: string, focus: Position | "any") => void;
  onSign: (p: Prospect) => void;
  onDiscard: (id: string) => void;
  onClose: () => void;
}) {
  const [regionId, setRegionId] = useState(REGIONS[0]!.id);
  const [focus, setFocus] = useState<Position | "any">("any");
  const region = getRegion(regionId);
  const canPay = budget >= region.cost;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative flex h-[min(88vh,800px)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#080d16]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-56 opacity-70 [background:radial-gradient(ellipse_at_50%_-20%,color-mix(in_oklab,var(--color-turf)_35%,transparent),transparent_65%)]" />

        <header className="relative flex items-center gap-4 border-b border-white/10 px-6 py-4">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-turf/15 text-turf">
            <Binoculars size={22} />
          </div>
          <div>
            <p className="field-label">Red de ojeadores</p>
            <h2 className="font-display text-2xl leading-none text-foreground">
              SCOUTS Y JUVENILES
            </h2>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <div className="text-right">
              <p className="field-label">Presupuesto</p>
              <p className="font-display text-lg text-turf">{formatCoins(budget)}</p>
            </div>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-foreground/70 hover:border-white/30 hover:text-foreground"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="relative grid flex-1 gap-6 overflow-y-auto px-6 py-5 lg:grid-cols-[340px_1fr]">
          {/* ENVIAR OJEADOR */}
          <section className="space-y-4">
            <p className="field-label">Enviar ojeador</p>
            <div className="space-y-2">
              {REGIONS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRegionId(r.id)}
                  className={`w-full rounded-xl border p-3 text-left transition-colors ${
                    r.id === regionId
                      ? "border-turf/60 bg-turf/10"
                      : "border-white/10 bg-white/[0.03] hover:border-white/25"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span aria-hidden="true">{r.flag}</span>
                    <span className="text-sm font-bold text-foreground">{r.name}</span>
                    <span className="ml-auto font-display text-xs text-turf">
                      {formatCoins(r.cost)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{r.blurb}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-widest text-foreground/45">
                    {r.matches} partidos de informe
                  </p>
                </button>
              ))}
            </div>

            <div>
              <p className="field-label mb-2">Puesto buscado</p>
              <div className="flex flex-wrap gap-2">
                {FOCUS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFocus(f.id)}
                    className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                      f.id === focus
                        ? "border-turf/60 bg-turf/15 text-turf"
                        : "border-white/10 text-foreground/70 hover:border-white/30"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              disabled={!canPay}
              onClick={() => onSend(regionId, focus)}
              className="btn-play flex w-full items-center justify-center gap-3 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Radar size={18} /> ENVIAR · {formatCoins(region.cost)}
            </button>
            {!canPay && (
              <p className="text-center text-xs text-destructive">
                Presupuesto insuficiente para esta misión.
              </p>
            )}

            {scouts.length > 0 && (
              <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="field-label">Misiones en curso</p>
                {scouts.map((m) => {
                  const r = getRegion(m.regionId);
                  const pct = ((m.total - m.matchesLeft) / m.total) * 100;
                  return (
                    <div key={m.id}>
                      <div className="flex items-center justify-between text-xs text-foreground/75">
                        <span>
                          {r.flag} {r.name} ·{" "}
                          {FOCUS.find((f) => f.id === m.focus)?.label}
                        </span>
                        <span className="text-turf">{m.matchesLeft} partidos</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-turf transition-[width] duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                <p className="text-[11px] text-muted-foreground">
                  Los informes llegan al jugar partidos.
                </p>
              </div>
            )}
          </section>

          {/* PROMESAS */}
          <section className="space-y-3">
            <p className="field-label">Promesas detectadas ({prospects.length})</p>
            {prospects.length === 0 && (
              <div className="grid h-48 place-items-center rounded-2xl border border-dashed border-white/12 text-center text-sm text-muted-foreground">
                Todavía no hay informes. Enviá un ojeador y jugá partidos.
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              {prospects.map((p) => {
                const r = getRegion(p.regionId);
                const affordable = budget >= p.value;
                return (
                  <article
                    key={p.id}
                    className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-transparent p-4"
                  >
                    <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-turf/20 blur-2xl" />
                    <div className="relative flex items-start gap-3">
                      <div className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-black/50 font-display text-lg text-turf">
                        {p.ovr}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-foreground">{p.name}</p>
                        <p className="text-xs text-foreground/60">
                          {p.pos} · {p.age} años · {r.flag} {r.name}
                        </p>
                      </div>
                    </div>
                    <div className="relative mt-3 flex items-center justify-between">
                      <span className="text-xs text-foreground/60">
                        Potencial <span className="font-display text-[#f5c53d]">{p.potential}</span>
                      </span>
                      <Stars n={p.stars} />
                    </div>
                    <p className="relative mt-2 text-xs italic text-turf/80">{p.trait}</p>
                    <div className="relative mt-4 flex items-center gap-2">
                      <button
                        disabled={!affordable}
                        onClick={() => onSign(p)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-turf px-3 py-2 font-display text-xs tracking-widest text-black transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        <Check size={14} /> FICHAR {formatCoins(p.value)}
                      </button>
                      <button
                        onClick={() => onDiscard(p.id)}
                        aria-label={`Descartar ${p.name}`}
                        className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 text-foreground/55 hover:border-destructive/50 hover:text-destructive"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
