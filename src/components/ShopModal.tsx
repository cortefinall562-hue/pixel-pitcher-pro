import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { PACKS, type PackDef } from "@/game/packs";
import { formatCoins } from "@/game/career";

export default function ShopModal({
  budget,
  onClose,
  onBuy,
}: {
  budget: number;
  onClose: () => void;
  onBuy: (pack: PackDef) => void;
}) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 2600);
    return () => clearTimeout(t);
  }, [error]);

  const buy = (pack: PackDef) => {
    if (budget < pack.price) {
      setError(
        `Monedas insuficientes para ${pack.name}. Necesitás ${formatCoins(pack.price - budget)} más.`,
      );
      return;
    }
    onBuy(pack);
  };

  return (
    <div className="fixed inset-0 z-50 grid animate-fade-in place-items-center bg-black/75 p-4">
      <div className="panel w-full max-w-4xl animate-scale-in overflow-hidden">
        <header className="flex items-center gap-3 border-b border-border px-6 py-4">
          <h2 className="font-display text-xl text-foreground">🛍️ TIENDA DE SOBRES</h2>
          <span className="ml-auto rounded-xl bg-secondary px-4 py-2 font-display text-sm text-turf">
            {formatCoins(budget)}
          </span>
          <button
            onClick={onClose}
            aria-label="Cerrar tienda"
            className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X size={16} />
          </button>
        </header>

        {error && (
          <p className="mx-6 mt-4 rounded-xl border border-destructive/50 bg-destructive/15 px-4 py-3 text-sm text-foreground">
            {error}
          </p>
        )}

        <div className="grid gap-4 p-6 md:grid-cols-3">
          {PACKS.map((pack) => {
            const affordable = budget >= pack.price;
            return (
              <article
                key={pack.tier}
                className="relative flex flex-col overflow-hidden rounded-2xl border border-border p-5"
                style={{
                  background: `linear-gradient(160deg, ${pack.accent[0]}33, ${pack.accent[1]}55)`,
                }}
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-20 [background:repeating-linear-gradient(135deg,rgb(255_255_255/0.5)_0_2px,transparent_2px_16px)]"
                  aria-hidden="true"
                />
                <div
                  className="relative mx-auto grid h-24 w-20 place-items-center rounded-xl text-4xl shadow-[0_10px_28px_rgb(0_0_0/0.5)]"
                  style={{
                    background: `linear-gradient(150deg, ${pack.accent[0]}, ${pack.accent[1]})`,
                  }}
                >
                  {pack.emoji}
                </div>
                <h3 className="relative mt-4 text-center font-display text-sm leading-tight text-foreground">
                  {pack.name}
                </h3>
                <p className="relative mt-1 text-center text-xs uppercase tracking-widest text-foreground/60">
                  {pack.subtitle}
                </p>
                <div className="relative mt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between rounded-lg bg-black/35 px-3 py-2">
                    <span className="text-foreground/70">Precio</span>
                    <span className="font-display text-turf">{formatCoins(pack.price)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-black/35 px-3 py-2">
                    <span className="text-foreground/70">Cartas</span>
                    <span className="font-semibold text-foreground">{pack.range}</span>
                  </div>
                </div>
                <button
                  onClick={() => buy(pack)}
                  className={`relative mt-5 w-full rounded-xl px-4 py-3 font-display text-xs tracking-widest transition-transform ${
                    affordable
                      ? "bg-turf text-pitch-night hover:scale-[1.03]"
                      : "cursor-not-allowed bg-secondary text-muted-foreground"
                  }`}
                >
                  {affordable ? "ABRIR SOBRE" : "SIN MONEDAS"}
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
