import { useEffect, useRef, useState } from "react";
import { ChevronRight, Trophy } from "lucide-react";
import type { Club } from "@/game/clubs";
import { createCeremonyScene } from "@/game/ceremonyScene";

export interface CeremonyResult {
  club: Club;
  managerName: string;
  rivalName: string;
  teamGoals: number;
  rivalGoals: number;
}

export default function CeremonyScreen({
  result,
  onContinue,
}: {
  result: CeremonyResult;
  onContinue: () => void;
}) {
  const canvas3d = useRef<HTMLCanvasElement>(null);
  const canvas2d = useRef<HTMLCanvasElement>(null);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (!canvas3d.current || !canvas2d.current) return;
    const scene = createCeremonyScene(
      canvas3d.current,
      canvas2d.current,
      {
        clubName: result.club.name,
        managerName: result.managerName,
        rivalName: result.rivalName,
        score: `${result.teamGoals} - ${result.rivalGoals}`,
        shirt: result.club.shirt,
        shorts: result.club.shorts,
        crest: result.club.crest,
      },
      () => setComplete(true),
    );
    return () => scene.dispose();
  }, [result]);

  return (
    <main className="fixed inset-0 z-50 overflow-hidden bg-pitch-night">
      <canvas ref={canvas3d} className="block h-full w-full" aria-label={`Ceremonia 3D de ${result.club.name} campeón`} />
      <canvas ref={canvas2d} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />

      <div className="absolute right-4 top-4">
        <button
          type="button"
          onClick={onContinue}
          className="flex items-center gap-2 rounded-lg border border-border bg-pitch-night/85 px-4 py-2 font-display text-xs text-foreground backdrop-blur transition-colors hover:border-turf"
        >
          {complete ? <Trophy size={16} className="text-turf" /> : null}
          {complete ? "CONTINUAR" : "SALTAR"}
          <ChevronRight size={16} />
        </button>
      </div>
    </main>
  );
}