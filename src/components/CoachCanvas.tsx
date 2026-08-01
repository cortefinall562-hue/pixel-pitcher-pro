import { useEffect, useRef } from "react";
import { createCoachScene, type CoachConfig } from "@/game/coachScene";

export default function CoachCanvas({ config }: { config: CoachConfig }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const apiRef = useRef<ReturnType<typeof createCoachScene> | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const api = createCoachScene(canvasRef.current);
    apiRef.current = api;
    return () => {
      api.dispose();
      apiRef.current = null;
    };
  }, []);

  useEffect(() => {
    apiRef.current?.update(config);
  }, [config]);

  return <canvas ref={canvasRef} className="block h-full w-full" aria-label="Vista 3D del director técnico" />;
}
