import { useCallback, useEffect, useRef, useState } from "react";
import { LogOut } from "lucide-react";
import { createMatchScene } from "@/game/matchScene";
import type { Club } from "@/game/clubs";

export interface MatchResult {
  team: number;
  rival: number;
  rivalName: string;
}

export default function MatchScreen({
  club,
  rival,
  onExit,
}: {
  club: Club;
  rival: Club;
  onExit: (result: MatchResult) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState({ team: 0, rival: 0 });
  const [minute, setMinute] = useState(0);
  const [over, setOver] = useState(false);
  const [goalSide, setGoalSide] = useState<"team" | "rival" | null>(null);
  const scoreRef = useRef(score);
  scoreRef.current = score;

  useEffect(() => {
    if (!canvasRef.current) return;
    const api = createMatchScene(canvasRef.current, {
      teamShirt: club.shirt,
      teamShorts: club.shorts,
      rivalShirt: rival.shirt,
      rivalShorts: rival.shorts,
      onScore: (side) =>
        setScore((s) => ({ ...s, [side]: s[side] + 1 })),
      onGoal: (side) => setGoalSide(side),
      onClock: setMinute,
      onEnd: () => setOver(true),
    });
    return () => api.dispose();
  }, [club, rival]);

  useEffect(() => {
    if (!goalSide) return;
    const t = setTimeout(() => setGoalSide(null), 3000);
    return () => clearTimeout(t);
  }, [goalSide]);


  const exit = useCallback(() => {
    onExit({ ...scoreRef.current, rivalName: rival.name });
  }, [onExit, rival.name]);

  return (
    <div className="fixed inset-0 z-50 bg-sky">
      <canvas ref={canvasRef} className="block h-full w-full" aria-label="Partido de fútbol en 3D" />

      {/* HUD MARCADOR */}
      <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2">
        <div className="flex items-center gap-4 rounded-2xl border border-white/15 bg-pitch-night/85 px-6 py-3 backdrop-blur">
          <span className="font-display text-sm text-foreground">{club.name}</span>
          <span className="font-display text-3xl text-turf">
            {score.team} - {score.rival}
          </span>
          <span className="font-display text-sm text-foreground">{rival.name}</span>
          <span className="ml-2 rounded-lg bg-turf/20 px-3 py-1 font-display text-sm text-turf">
            {minute}'
          </span>
        </div>
      </div>

      <button
        onClick={exit}
        className="absolute right-4 top-4 flex items-center gap-2 rounded-xl border border-destructive/50 bg-pitch-night/85 px-4 py-2 font-display text-xs tracking-widest text-foreground backdrop-blur transition-colors hover:bg-destructive/30"
      >
        <LogOut size={16} /> RETIRARSE / TERMINAR
      </button>

      <div className="pointer-events-none absolute bottom-5 left-1/2 flex max-w-[92vw] flex-wrap justify-center gap-x-4 gap-y-1 -translate-x-1/2 rounded-xl bg-pitch-night/75 px-5 py-2 text-[11px] tracking-widest text-foreground backdrop-blur">
        <span>WASD / FLECHAS: MOVER</span>
        <span className="text-turf">E: TIRO</span>
        <span className="text-turf">F: TURBO</span>
        <span className="text-turf">Q: AMAGUE</span>
        <span className="text-turf">ESPACIO: PASE</span>
      </div>

      {goalSide && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="animate-scale-in text-center">
            <p className="font-display text-6xl text-turf drop-shadow-[0_8px_0_rgba(0,0,0,0.45)] sm:text-8xl">
              ¡GOOOL!
            </p>
            <p className="mt-2 font-display text-lg tracking-[0.35em] text-foreground">
              {goalSide === "team" ? club.name.toUpperCase() : rival.name.toUpperCase()}
            </p>
          </div>
        </div>
      )}


      {over && (
        <div className="absolute inset-0 grid animate-fade-in place-items-center bg-black/70 p-6">
          <div className="panel w-full max-w-md animate-scale-in p-8 text-center">
            <p className="field-label">Final del partido</p>
            <p className="mt-3 font-display text-5xl text-turf">
              {score.team} - {score.rival}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              {club.name} vs {rival.name}
            </p>
            <button className="btn-play mt-7 w-full" onClick={exit}>
              VOLVER AL PANEL
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
