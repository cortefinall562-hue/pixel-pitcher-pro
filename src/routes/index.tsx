import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useMemo, useState } from "react";
import type { BrowStyle, CoachConfig, HairColor, HairStyle, Outfit } from "@/game/coachScene";
import { CLUBS, DEFAULT_CLUB_ID, formatBudget, getClub } from "@/game/clubs";
import type { MatchResult } from "@/components/MatchScreen";

const CoachCanvas = lazy(() => import("@/components/CoachCanvas"));
const SeasonHub = lazy(() => import("@/components/SeasonHub"));
const MatchScreen = lazy(() => import("@/components/MatchScreen"));


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Táctica FC — Editor del Director Técnico 3D" },
      {
        name: "description",
        content:
          "Crea tu director técnico low-poly en 3D y comienza tu carrera como mánager de fútbol en Táctica FC.",
      },
      { property: "og:title", content: "Táctica FC — Editor del Director Técnico 3D" },
      {
        property: "og:description",
        content: "Personaliza peinado, cejas y atuendo de tu DT en un editor 3D estilo low-poly.",
      },
    ],
  }),
  component: Index,
});

type Screen = "menu" | "settings" | "editor" | "season" | "match";

const HAIR_LABELS = ["Pelado", "Pelo corto de bloques", "Flequillo de bloques"];
const BROW_LABELS = ["Normales", "Enojadas", "Gruesas"];
const OUTFIT_LABELS = ["Traje elegante", "Camisa y corbata", "Ropa deportiva"];
const HAIR_COLORS: { id: HairColor; label: string; swatch: string }[] = [
  { id: "black", label: "Negro", swatch: "#241f21" },
  { id: "blonde", label: "Rubio", swatch: "#f2c14a" },
  { id: "brown", label: "Marrón", swatch: "#7b4a24" },
];

function Index() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [name, setName] = useState("");
  const [hairStyle, setHairStyle] = useState<HairStyle>(1);
  const [hairColor, setHairColor] = useState<HairColor>("black");
  const [brows, setBrows] = useState<BrowStyle>(0);
  const [outfit, setOutfit] = useState<Outfit>(0);
  const [clubId, setClubId] = useState<string>(DEFAULT_CLUB_ID);
  const [rivalName, setRivalName] = useState<string>("");
  const [lastResult, setLastResult] = useState<MatchResult | null>(null);

  const club = getClub(clubId);
  const rival = useMemo(
    () => CLUBS.find((c) => c.name === rivalName) ?? CLUBS.find((c) => c.id !== club.id)!,
    [rivalName, club.id],
  );

  const config = useMemo<CoachConfig>(
    () => ({ hairStyle, hairColor, brows, outfit }),
    [hairStyle, hairColor, brows, outfit],
  );

  const cycle = <T extends number>(v: T, dir: number): T =>
    (((v + dir + 3) % 3) as T);

  const managerName = name.trim() || "Mánager Gallardo";

  if (screen === "match") {
    return (
      <ClientOnly fallback={<div className="min-h-screen bg-sky" />}>
        <Suspense fallback={<div className="min-h-screen bg-sky" />}>
          <MatchScreen
            club={club}
            rival={rival}
            onExit={(result) => {
              setLastResult(result);
              setScreen("season");
            }}
          />
        </Suspense>
      </ClientOnly>
    );
  }

  if (screen === "season") {
    return (
      <Suspense fallback={<div className="min-h-screen bg-pitch-night" />}>
        <div className="animate-fade-in">
          <SeasonHub
            managerName={managerName}
            club={club}
            lastResult={lastResult}
            onPlayMatch={(r) => {
              setRivalName(r);
              setScreen("match");
            }}
          />
        </div>
      </Suspense>
    );
  }


  return (
    <main className="flex min-h-screen flex-col bg-pitch-night lg:h-screen lg:flex-row lg:overflow-hidden">
      {/* ---------- LADO IZQUIERDO ---------- */}
      <section className="relative flex w-full flex-col justify-center p-6 lg:w-1/2 lg:p-12">
        <div className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(circle_at_20%_15%,color-mix(in_oklab,var(--color-turf)_28%,transparent),transparent_55%)]" />

        {screen === "menu" && (
          <div className="relative animate-fade-in space-y-10">
            <header>
              <p className="font-display text-sm tracking-[0.5em] text-turf">TEMPORADA 2026</p>
              <h1 className="mt-3 font-display text-6xl leading-[0.9] text-foreground drop-shadow-[0_6px_0_color-mix(in_oklab,var(--color-turf)_45%,transparent)] lg:text-7xl">
                TÁCTICA <span className="text-turf">FC</span>
              </h1>
              <p className="mt-4 max-w-sm text-sm text-muted-foreground">
                Dirige, ficha y gana. Todo empieza creando al hombre del banquillo.
              </p>
            </header>

            <div className="max-w-sm space-y-4">
              <button className="btn-play w-full" onClick={() => setScreen("editor")}>
                JUGAR
              </button>
              <button className="btn-ghost w-full" onClick={() => setScreen("settings")}>
                CONFIGURACIÓN
              </button>
            </div>
          </div>
        )}

        {screen === "settings" && (
          <div className="relative flex animate-scale-in items-center justify-center">
            <div className="panel w-full max-w-md p-8 text-center">
              <h2 className="font-display text-2xl text-foreground">CONTROLES</h2>
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">Controles Predeterminados:</span> Clic
                Izquierdo para interactuar en los menús tácticos. Teclas de dirección para navegar por
                la plantilla.
              </p>
              <button className="btn-ghost mt-8 w-full" onClick={() => setScreen("menu")}>
                VOLVER
              </button>
            </div>
          </div>
        )}

        {screen === "editor" && (
          <div className="relative animate-fade-in space-y-6 lg:max-h-full lg:overflow-y-auto lg:pr-2">
            <header className="flex items-baseline justify-between gap-4">
              <h2 className="font-display text-3xl text-foreground">
                EDITOR DEL <span className="text-turf">DT</span>
              </h2>
              <button
                className="text-xs tracking-widest text-muted-foreground hover:text-foreground"
                onClick={() => setScreen("menu")}
              >
                ← MENÚ
              </button>
            </header>

            <div className="panel p-5">
              <label htmlFor="dt-name" className="field-label">
                Nombre del DT
              </label>
              <input
                id="dt-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mánager Gallardo"
                className="mt-2 w-full rounded-xl border border-border bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-turf focus:outline-none"
              />
            </div>

            <div className="panel space-y-4 p-5">
              <span className="field-label">Peinado</span>
              <div className="flex items-center gap-3">
                <button className="btn-step" onClick={() => setHairStyle(cycle(hairStyle, -1))}>
                  {"<-"}
                </button>
                <div className="flex-1 rounded-xl bg-secondary px-4 py-2.5 text-center text-sm font-semibold text-foreground">
                  {HAIR_LABELS[hairStyle]}
                </div>
                <button className="btn-step" onClick={() => setHairStyle(cycle(hairStyle, 1))}>
                  {"->"}
                </button>
              </div>
              <div className="flex gap-3">
                {HAIR_COLORS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setHairColor(c.id)}
                    aria-label={c.label}
                    style={{ backgroundColor: c.swatch }}
                    className={`h-10 flex-1 rounded-xl border-2 transition-transform hover:scale-105 ${
                      hairColor === c.id ? "border-turf" : "border-border"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="panel space-y-3 p-5">
              <span className="field-label">Cejas</span>
              <div className="grid grid-cols-3 gap-2">
                {BROW_LABELS.map((label, i) => (
                  <button
                    key={label}
                    onClick={() => setBrows(i as BrowStyle)}
                    className={brows === i ? "chip chip-active" : "chip"}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="panel space-y-3 p-5">
              <span className="field-label">Atuendo</span>
              <div className="grid grid-cols-3 gap-2">
                {OUTFIT_LABELS.map((label, i) => (
                  <button
                    key={label}
                    onClick={() => setOutfit(i as Outfit)}
                    className={outfit === i ? "chip chip-active" : "chip"}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="panel space-y-3 p-5">
              <label htmlFor="club-select" className="field-label">
                Elegir Club de Inicio
              </label>
              <select
                id="club-select"
                value={clubId}
                onChange={(e) => setClubId(e.target.value)}
                className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm font-semibold text-foreground focus:border-turf focus:outline-none"
              >
                {CLUBS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — Presupuesto: {formatBudget(c.budget)}
                  </option>
                ))}
              </select>
              <div className="flex items-center justify-between rounded-xl bg-secondary/50 px-4 py-2.5 text-sm">
                <span className="text-muted-foreground">Presupuesto inicial</span>
                <span className="font-display text-turf">{formatBudget(club.budget)}</span>
              </div>
            </div>


            <button className="btn-play w-full" onClick={() => setScreen("season")}>
              GUARDAR Y CONTINUAR
            </button>
          </div>
        )}
      </section>

      {/* ---------- LADO DERECHO: CANVAS 3D ---------- */}
      <section className="relative h-[60vh] w-full lg:h-full lg:w-1/2">
        <ClientOnly fallback={<div className="h-full w-full bg-sky" />}>
          <Suspense fallback={<div className="h-full w-full bg-sky" />}>
            <CoachCanvas config={config} />
          </Suspense>
        </ClientOnly>
        {screen === "editor" && name.trim() !== "" && (
          <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 animate-fade-in rounded-full bg-pitch-night/80 px-6 py-2 font-display text-lg tracking-wide text-foreground backdrop-blur">
            {name}
          </div>
        )}
      </section>
    </main>
  );
}
