import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Handshake, LogOut, ShieldCheck, Coins } from "lucide-react";
import { createNegotiationScene } from "@/game/negotiationScene";
import { formatCoins, type OfferData } from "@/game/career";
import { getClub, type Club } from "@/game/clubs";

export interface NegotiationOutcome {
  accepted: boolean;
  amount: number;
  clause: boolean;
  offer: OfferData;
}

type Api = ReturnType<typeof createNegotiationScene>;

interface Line {
  who: "home" | "rival";
  text: string;
}

export default function NegotiationScreen({
  club,
  budget,
  offer,
  onFinish,
}: {
  club: Club;
  budget: number;
  offer: OfferData;
  onFinish: (outcome: NegotiationOutcome | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const apiRef = useRef<Api | null>(null);
  const rival = useMemo(() => getClub(offer.clubId), [offer.clubId]);
  const buying = offer.side === "buy";

  const [amount, setAmount] = useState(offer.amount);
  const [clause, setClause] = useState(false);
  const [lines, setLines] = useState<Line[]>([
    {
      who: "rival",
      text: buying
        ? `Bienvenido. Hablemos de ${offer.playerName}. Lo valoramos en ${formatCoins(offer.value)}.`
        : `Queremos a ${offer.playerName}. Nuestra propuesta inicial es ${formatCoins(offer.amount)}.`,
    },
  ]);
  const [status, setStatus] = useState<"open" | "accepted" | "broken">("open");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    const api = createNegotiationScene(canvasRef.current, {
      homeShirt: club.shirt,
      homeShorts: club.shorts,
      rivalShirt: rival.shirt,
      rivalShorts: rival.shorts,
    });
    apiRef.current = api;
    api.setShot("wide");
    const intro = setTimeout(() => {
      api.setShot("otsHome");
      api.setMood("rival", "propose");
    }, 900);
    return () => {
      clearTimeout(intro);
      api.dispose();
      apiRef.current = null;
    };
  }, [club.shirt, club.shorts, rival.shirt, rival.shorts]);

  const say = useCallback((who: "home" | "rival", text: string) => {
    setLines((l) => [...l.slice(-3), { who, text }]);
  }, []);

  const propose = useCallback(() => {
    const api = apiRef.current;
    if (!api || busy || status !== "open") return;
    if (buying && amount > budget) {
      say("home", "Nuestro presupuesto no alcanza para esa cifra.");
      return;
    }
    setBusy(true);
    api.setShot("otsRival");
    api.setMood("home", "propose");
    api.setMood("rival", "idle");
    say(
      "home",
      buying
        ? `Ofrecemos ${formatCoins(amount)}${clause ? " más cláusula de rescisión" : ""} por ${offer.playerName}.`
        : `Pedimos ${formatCoins(amount)}${clause ? " y cláusula de rescisión" : ""} para dejarlo salir.`,
    );

    const leniency = clause ? 0.06 : 0;
    const ratio = amount / offer.value;
    const good = buying ? ratio + leniency >= 1 : ratio - leniency <= 1;
    const angry = buying ? ratio < 0.7 : ratio > 1.35;

    setTimeout(() => {
      api.setShot("otsHome");
      api.setMood("home", "idle");
      api.setMood("rival", "think");
      say("rival", "Déjame revisar los números...");
    }, 1500);

    setTimeout(() => {
      if (angry) {
        api.setMood("rival", "refuse");
        say(
          "rival",
          buying
            ? "¿Esto es una broma? Estás muy lejos del valor real. La negociación termina acá."
            : "Ese precio es un delirio. Nos retiramos de la mesa.",
        );
        setStatus("broken");
        setBusy(false);
        return;
      }
      if (good) {
        api.setShot("wide");
        api.setMood("rival", "handshake");
        api.setMood("home", "handshake");
        api.showContract(true);
        say("rival", "Trato hecho. Firmemos el contrato.");
        setStatus("accepted");
        setBusy(false);
        return;
      }
      const counter = buying
        ? Math.round((offer.value * 1.08) / 50_000) * 50_000
        : Math.round((offer.value * 0.92) / 50_000) * 50_000;
      api.setMood("rival", "propose");
      say(
        "rival",
        buying
          ? `Casi. Cerramos en ${formatCoins(counter)} y el jugador es tuyo.`
          : `Podemos llegar a ${formatCoins(counter)}, no más.`,
      );
      setAmount(counter);
      setBusy(false);
    }, 3000);
  }, [amount, budget, busy, buying, clause, offer.playerName, offer.value, say, status]);

  const confirm = () => onFinish({ accepted: true, amount, clause, offer });

  const step = Math.max(50_000, Math.round(offer.value / 20 / 50_000) * 50_000);

  return (
    <div className="fixed inset-0 z-50 bg-[#0b0f18]">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* Encabezado */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center p-4">
        <div className="pointer-events-auto flex items-center gap-4 rounded-2xl border border-white/10 bg-black/60 px-5 py-3 backdrop-blur">
          <span className="text-xs uppercase tracking-widest text-white/50">Negociación</span>
          <span className="font-bold text-white">{club.name}</span>
          <Handshake className="h-4 w-4 text-emerald-400" />
          <span className="font-bold text-white">{rival.name}</span>
        </div>
      </div>

      <button
        onClick={() => onFinish(null)}
        className="absolute right-4 top-20 flex items-center gap-2 rounded-xl border border-white/15 bg-black/60 px-4 py-2 text-sm font-semibold text-white/80 backdrop-blur transition hover:bg-black/80"
      >
        <LogOut className="h-4 w-4" /> Retirarse
      </button>

      {/* Bocadillos de diálogo */}
      <div className="absolute inset-x-0 bottom-[19rem] mx-auto flex max-w-3xl flex-col gap-2 px-4 md:bottom-56">
        {lines.map((l, i) => (
          <div
            key={`${i}-${l.text}`}
            className={`max-w-[85%] animate-fade-in rounded-2xl px-4 py-2 text-sm shadow-lg ${
              l.who === "home"
                ? "self-end bg-emerald-500 text-emerald-950"
                : "self-start bg-white text-slate-900"
            }`}
          >
            <span className="mr-2 text-[10px] font-black uppercase tracking-wider opacity-60">
              {l.who === "home" ? "TÚ" : `DT ${rival.name}`}
            </span>
            {l.text}
          </div>
        ))}
      </div>

      {/* Panel de negociación */}
      <div className="absolute inset-x-0 bottom-0 border-t border-white/10 bg-black/75 p-4 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-white/40">
                {buying ? "Fichaje" : "Venta"} · {offer.pos} · {offer.ovr} OVR
              </p>
              <p className="text-lg font-black text-white">{offer.playerName}</p>
            </div>
            <div className="flex gap-6">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-white/40">Valor estimado</p>
                <p className="font-bold text-amber-300">{formatCoins(offer.value)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-widest text-white/40">Tu presupuesto</p>
                <p className="flex items-center gap-1 font-bold text-emerald-300">
                  <Coins className="h-4 w-4" /> {formatCoins(budget)}
                </p>
              </div>
            </div>
          </div>

          {status === "open" && (
            <>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={Math.round(offer.value * 0.4)}
                  max={Math.round(offer.value * 1.8)}
                  step={step}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-white/15 accent-emerald-400"
                />
                <span className="min-w-24 text-right text-xl font-black text-white">
                  {formatCoins(amount)}
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={propose}
                  disabled={busy}
                  className="flex-1 rounded-xl bg-emerald-500 px-5 py-3 font-black uppercase tracking-wide text-emerald-950 transition hover:bg-emerald-400 disabled:opacity-50"
                >
                  {buying ? "Ofrecer Monedas" : "Exigir Monedas"}
                </button>
                <button
                  onClick={() => setClause((c) => !c)}
                  className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold uppercase tracking-wide transition ${
                    clause
                      ? "bg-sky-500 text-sky-950"
                      : "border border-white/15 text-white/70 hover:bg-white/10"
                  }`}
                >
                  <ShieldCheck className="h-4 w-4" /> Cláusula de rescisión
                </button>
                <button
                  onClick={() => onFinish(null)}
                  className="rounded-xl border border-white/15 px-5 py-3 text-sm font-bold uppercase tracking-wide text-white/60 transition hover:bg-white/10"
                >
                  Retirarse
                </button>
              </div>
            </>
          )}

          {status === "accepted" && (
            <button
              onClick={confirm}
              className="w-full rounded-xl bg-amber-400 px-5 py-4 text-lg font-black uppercase tracking-wide text-amber-950 transition hover:bg-amber-300"
            >
              ✍️ Firmar contrato por {formatCoins(amount)}
            </button>
          )}

          {status === "broken" && (
            <button
              onClick={() => onFinish(null)}
              className="w-full rounded-xl bg-rose-500/90 px-5 py-4 text-lg font-black uppercase tracking-wide text-white transition hover:bg-rose-500"
            >
              Negociación rota · Volver al panel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
