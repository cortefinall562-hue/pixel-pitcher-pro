import { useState } from "react";
import { Globe, Heart, Mail, X, Zap } from "lucide-react";

const CREST_COLORS: Record<string, [string, string]> = {
  "FC Barcelona": ["#a50044", "#004d98"],
  "Real Madrid": ["#f0f0f0", "#00529f"],
  "Atlético de Madrid": ["#cb3524", "#262e62"],
  "Sevilla FC": ["#d8262f", "#f4f4f4"],
  "Valencia CF": ["#f5a11d", "#111111"],
  "Athletic Club": ["#ee2523", "#ffffff"],
};

function Crest({ team, size = 64 }: { team: string; size?: number }) {
  const [a, b] = CREST_COLORS[team] ?? ["#3ddc84", "#1f2937"];
  const initials = team
    .split(" ")
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
  return (
    <div
      className="grid place-items-center rounded-2xl shadow-[0_8px_24px_rgb(0_0_0/0.45)]"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${a} 0% 50%, ${b} 50% 100%)`,
      }}
      aria-hidden="true"
    >
      <span
        className="font-display text-black/70"
        style={{ fontSize: size * 0.3, mixBlendMode: "overlay" }}
      >
        {initials}
      </span>
    </div>
  );
}

const FIXTURES = [
  { round: "Jornada 1", home: "FC Barcelona", away: "Real Madrid", date: "Sáb 21:00" },
  { round: "Jornada 2", home: "Sevilla FC", away: "FC Barcelona", date: "Mié 19:30" },
  { round: "Jornada 3", home: "FC Barcelona", away: "Valencia CF", date: "Dom 17:00" },
  { round: "Jornada 4", home: "Athletic Club", away: "FC Barcelona", date: "Sáb 16:15" },
];

const EMAILS = [
  {
    subject: "¡Bienvenido Mánager!",
    sender: "Presidente del Club",
    preview: "El vestuario te espera. Confiamos en tu proyecto para esta temporada...",
    unread: true,
  },
  {
    subject: "Informe médico de la plantilla",
    sender: "Preparador Físico",
    preview: "Dos jugadores arrastran molestias musculares. Detalle adjunto...",
    unread: false,
  },
];

const NEWS = [
  {
    outlet: "Fabrizio Romano",
    handle: "@FabrizioRomano",
    initials: "FR",
    accent: "linear-gradient(160deg,#0f766e,#0b1120)",
    headline: "¡BOMBAZO! El nuevo DT promete revolucionar la liga",
    body: "Here we go: el club confirma plenos poderes deportivos para el nuevo entrenador.",
    time: "Hace 2 min",
    likes: 4821,
  },
  {
    outlet: "ESPN FC",
    handle: "@ESPNFC",
    initials: "ES",
    accent: "linear-gradient(160deg,#b91c1c,#111827)",
    headline: "Fichajes: el club busca un delantero de renombre",
    body: "La dirección deportiva ya negocia con dos delanteros de la Premier League.",
    time: "Hace 1 hora",
    likes: 2140,
  },
  {
    outlet: "MARCA",
    handle: "@marca",
    initials: "MA",
    accent: "linear-gradient(160deg,#1d4ed8,#0b1120)",
    headline: "El clásico abrirá la temporada en el Camp Nou",
    body: "Entradas agotadas en 12 minutos para el debut del nuevo proyecto.",
    time: "Hace 3 horas",
    likes: 8760,
  },
];

function NewsCard({ item }: { item: (typeof NEWS)[number] }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(item.likes);

  return (
    <article
      className="relative flex h-full snap-start flex-col justify-end overflow-hidden rounded-2xl p-5"
      style={{ background: item.accent }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-25 [background:repeating-linear-gradient(135deg,rgb(255_255_255/0.35)_0_2px,transparent_2px_14px)]" />
      <div className="relative flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-black/45 font-display text-xs text-foreground">
          {item.initials}
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold text-foreground">{item.outlet}</p>
          <p className="text-xs text-foreground/60">{item.handle}</p>
        </div>
      </div>
      <h3 className="relative mt-4 font-display text-xl leading-tight text-foreground drop-shadow-[0_2px_6px_rgb(0_0_0/0.6)]">
        {item.headline}
      </h3>
      <p className="relative mt-2 text-sm text-foreground/75">{item.body}</p>
      <div className="relative mt-4 flex items-center justify-between border-t border-white/15 pt-3">
        <span className="text-xs uppercase tracking-widest text-foreground/60">{item.time}</span>
        <button
          onClick={() => {
            setLiked(!liked);
            setLikes(likes + (liked ? -1 : 1));
          }}
          aria-pressed={liked}
          className="flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 text-sm text-foreground transition-transform hover:scale-105"
        >
          <Heart
            size={16}
            className={liked ? "text-destructive" : "text-foreground/70"}
            fill={liked ? "currentColor" : "none"}
          />
          {likes.toLocaleString("es-ES")}
        </button>
      </div>
    </article>
  );
}

export default function SeasonHub({ managerName }: { managerName: string }) {
  const [showOnline, setShowOnline] = useState(false);
  const club = "FC Barcelona";
  const next = FIXTURES[0]!;

  return (
    <div className="min-h-screen bg-pitch-night pb-10">
      {/* NAVBAR */}
      <header className="sticky top-0 z-30 border-b border-border bg-pitch-night/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3">
          <span className="font-display text-xl text-foreground">
            TÁCTICA <span className="text-turf">FC</span>
          </span>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div>
              <p className="field-label">Director Técnico</p>
              <p className="text-sm font-semibold text-foreground">{managerName}</p>
            </div>
            <div>
              <p className="field-label">Club</p>
              <p className="text-sm font-semibold text-foreground">{club}</p>
            </div>
            <div>
              <p className="field-label">Presupuesto</p>
              <p className="text-sm font-semibold text-turf">$20,000,000</p>
            </div>
          </div>
          <button
            onClick={() => setShowOnline(true)}
            className="ml-auto flex items-center gap-2 rounded-xl border border-turf/40 bg-turf/15 px-4 py-2 font-display text-xs tracking-widest text-turf transition-shadow hover:shadow-[0_0_24px_color-mix(in_oklab,var(--color-turf)_55%,transparent)]"
          >
            <Globe size={16} /> MODO ONLINE
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[1fr_360px]">
        {/* IZQUIERDA */}
        <div className="space-y-6">
          <section className="panel relative overflow-hidden p-6">
            <div className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(circle_at_50%_0%,color-mix(in_oklab,var(--color-turf)_25%,transparent),transparent_60%)]" />
            <div className="relative">
              <p className="field-label">Siguiente partido · {next.round}</p>
              <div className="mt-5 flex items-center justify-center gap-6 sm:gap-12">
                <div className="text-center">
                  <Crest team={next.home} size={84} />
                  <p className="mt-3 text-sm font-bold text-foreground">{next.home}</p>
                </div>
                <div className="text-center">
                  <p className="font-display text-3xl text-turf">VS</p>
                  <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                    {next.date}
                  </p>
                </div>
                <div className="text-center">
                  <Crest team={next.away} size={84} />
                  <p className="mt-3 text-sm font-bold text-foreground">{next.away}</p>
                </div>
              </div>
              <button className="btn-play mt-7 flex w-full items-center justify-center gap-3">
                <Zap size={22} /> JUGAR PARTIDO
              </button>
            </div>
          </section>

          <section className="panel p-5">
            <p className="field-label">Calendario</p>
            <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
              {FIXTURES.map((f) => (
                <div
                  key={f.round}
                  className="min-w-[150px] flex-1 rounded-xl border border-border bg-secondary/60 p-3 text-center transition-colors hover:border-turf/60"
                >
                  <p className="font-display text-xs tracking-widest text-turf">{f.round}</p>
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <Crest team={f.home} size={34} />
                    <span className="text-xs text-muted-foreground">vs</span>
                    <Crest team={f.away} size={34} />
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">{f.date}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="panel p-5">
            <div className="flex items-center gap-2">
              <p className="field-label">Bandeja de Entrada</p>
              <Mail size={14} className="text-turf" />
            </div>
            <ul className="mt-4 space-y-3">
              {EMAILS.map((e) => (
                <li key={e.subject}>
                  <button className="flex w-full items-start gap-4 rounded-xl border border-border bg-secondary/40 p-4 text-left transition-colors hover:bg-secondary hover:border-turf/50">
                    <span
                      className={`mt-1.5 h-2.5 w-2.5 flex-none rounded-full ${
                        e.unread ? "bg-turf" : "bg-muted-foreground/40"
                      }`}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-foreground">{e.subject}</span>
                      <span className="block text-xs text-turf">{e.sender}</span>
                      <span className="mt-1 block truncate text-xs text-muted-foreground">
                        {e.preview}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* DERECHA: FEED 9:16 */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="field-label mb-3">Feed de noticias</p>
          <div className="panel aspect-[9/16] w-full overflow-hidden p-2">
            <div className="h-full snap-y snap-mandatory space-y-2 overflow-y-auto">
              {NEWS.map((n) => (
                <div key={n.outlet} className="h-full">
                  <NewsCard item={n} />
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* MODAL ONLINE */}
      {showOnline && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-6 animate-fade-in">
          <div className="panel w-full max-w-md animate-scale-in p-8 text-center">
            <Globe size={36} className="mx-auto animate-spin text-turf" style={{ animationDuration: "4s" }} />
            <h2 className="mt-4 font-display text-xl text-foreground">BUSCANDO SERVIDORES...</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Modo Online en desarrollo (Próximamente conexión de salas)
            </p>
            <button className="btn-ghost mt-7 w-full" onClick={() => setShowOnline(false)}>
              <span className="flex items-center justify-center gap-2">
                <X size={16} /> CERRAR
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
