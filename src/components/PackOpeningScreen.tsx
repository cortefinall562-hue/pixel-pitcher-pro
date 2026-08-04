import { useEffect, useRef, useState } from "react";
import { createPackScene, type PackPhase } from "@/game/packScene";
import { getPack, type PlayerCard } from "@/game/packs";
import { formatCoins } from "@/game/career";
import type { Club } from "@/game/clubs";

/** Efecto de sonido sintético ascendente (tensión) con WebAudio. */
function playRiser(duration: number) {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return () => {};
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(90, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + duration);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + duration * 0.8);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration + 0.05);
    return () => {
      try {
        osc.stop();
        void ctx.close();
      } catch {
        /* noop */
      }
    };
  } catch {
    return () => {};
  }
}

const PHASE_LABEL: Record<PackPhase, string> = {
  tunnel: "TÚNEL DEL ESTADIO",
  walkout: "WALKOUT",
  card: "REVELACIÓN",
};

export default function PackOpeningScreen({
  tier,
  card,
  club,
  onClaim,
}: {
  tier: PlayerCard["tier"];
  card: PlayerCard;
  club: Club;
  onClaim: (card: PlayerCard) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<PackPhase>(tier === "bronze" ? "card" : "tunnel");
  const [done, setDone] = useState(false);
  const pack = getPack(tier);

  useEffect(() => {
    if (!canvasRef.current) return;
    const api = createPackScene(canvasRef.current, {
      tier,
      card,
      shirt: club.shirt,
      shorts: club.shorts,
      onPhase: setPhase,
      onDone: () => setDone(true),
    });
    const stopAudio = playRiser(tier === "gold" ? 3 : tier === "silver" ? 1.6 : 0.9);
    return () => {
      stopAudio();
      api.dispose();
    };
  }, [tier, card, club]);

  const gold = tier === "gold";

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        aria-label={`Apertura de ${pack.name} en 3D`}
      />

      <div className="pointer-events-none absolute left-1/2 top-5 -translate-x-1/2 rounded-2xl border border-white/15 bg-black/60 px-6 py-2 backdrop-blur">
        <p className="font-display text-xs tracking-[0.35em] text-turf">{pack.name}</p>
        <p className="text-center text-[11px] uppercase tracking-widest text-white/60">
          {PHASE_LABEL[phase]}
        </p>
      </div>

      {gold && phase !== "card" && (
        <p className="pointer-events-none absolute bottom-24 left-1/2 -translate-x-1/2 animate-fade-in font-display text-3xl tracking-[0.3em] text-[#ffd76a] drop-shadow-[0_6px_0_rgba(0,0,0,0.6)] sm:text-5xl">
          ULTIMATE TOTY
        </p>
      )}

      {done && (
        <div className="absolute inset-x-0 bottom-0 animate-fade-in p-5">
          <div className="mx-auto w-full max-w-2xl rounded-2xl border border-white/15 bg-black/75 p-5 backdrop-blur">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <div>
                <p className="field-label">Jugador</p>
                <p className="font-display text-lg text-foreground">{card.name}</p>
              </div>
              <div>
                <p className="field-label">GRL</p>
                <p className="font-display text-lg text-turf">
                  {card.ovr} · {card.pos}
                </p>
              </div>
              <div>
                <p className="field-label">Nacionalidad</p>
                <p className="text-sm font-semibold text-foreground">{card.nationality.name}</p>
              </div>
              <div>
                <p className="field-label">Valor</p>
                <p className="text-sm font-semibold text-foreground">{formatCoins(card.value)}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {card.stats.map((s) => (
                <div key={s.label} className="rounded-lg bg-white/10 px-2 py-2 text-center">
                  <p className="text-[10px] tracking-widest text-white/60">{s.label}</p>
                  <p className="font-display text-sm text-foreground">{s.value}</p>
                </div>
              ))}
            </div>
            <button className="btn-play mt-5 w-full" onClick={() => onClaim(card)}>
              RECLAMAR AL INVENTARIO
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
