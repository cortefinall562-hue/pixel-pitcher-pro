import { useState } from "react";
import { Check, Lock, PartyPopper, X } from "lucide-react";
import { CELEBRATIONS, loadCelebs, saveCelebs, type CelebStore } from "@/game/celebrations";
import { formatCoins } from "@/game/career";

const RARITY: Record<string, string> = {
  "básico": "#8ea0b5",
  raro: "#4dd2ff",
  "épico": "#c084fc",
  "icónico": "#f5c53d",
};

export default function CelebrationsModal({
  budget,
  onBuy,
  onClose,
}: {
  budget: number;
  onBuy: (price: number) => void;
  onClose: () => void;
}) {
  const [store, setStore] = useState<CelebStore>(() => loadCelebs());

  const update = (next: CelebStore) => {
    setStore(next);
    saveCelebs(next);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-[#f5c53d]/25 bg-[#080d16] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <PartyPopper size={18} className="text-[#f5c53d]" />
            <div>
              <p className="font-display text-lg text-foreground">FESTEJOS DE GOL</p>
              <p className="text-xs text-muted-foreground">
                Elegí el festejo de tu jugador o desbloqueá nuevos · Saldo {formatCoins(budget)}
              </p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <div className="grid max-h-[70vh] gap-3 overflow-y-auto p-6 sm:grid-cols-2">
          {CELEBRATIONS.map((c) => {
            const owned = store.owned.includes(c.id);
            const active = store.selected === c.id;
            const canBuy = budget >= c.price;
            return (
              <div
                key={c.id}
                className="rounded-xl border p-4 transition-colors"
                style={{
                  borderColor: active ? RARITY[c.rarity] : "rgba(255,255,255,0.1)",
                  background: active ? "rgba(245,197,61,0.07)" : "rgba(255,255,255,0.02)",
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-display text-base text-foreground">{c.name}</p>
                  <span
                    className="rounded-md px-2 py-0.5 text-[10px] uppercase tracking-widest"
                    style={{ color: RARITY[c.rarity], background: "rgba(255,255,255,0.06)" }}
                  >
                    {c.rarity}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{c.desc}</p>

                {owned ? (
                  <button
                    disabled={active}
                    onClick={() => update({ ...store, selected: c.id })}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-turf/50 bg-turf/15 py-2 font-display text-xs tracking-widest text-turf disabled:opacity-60"
                  >
                    {active ? (
                      <>
                        <Check size={14} /> EN USO
                      </>
                    ) : (
                      "USAR ESTE FESTEJO"
                    )}
                  </button>
                ) : (
                  <button
                    disabled={!canBuy}
                    onClick={() => {
                      onBuy(c.price);
                      update({ owned: [...store.owned, c.id], selected: c.id });
                    }}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-[#f5c53d]/50 bg-[#f5c53d]/15 py-2 font-display text-xs tracking-widest text-[#f5c53d] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Lock size={13} /> COMPRAR · {formatCoins(c.price)}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
