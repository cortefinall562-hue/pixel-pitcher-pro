import { useMemo, useState } from "react";
import { Inbox, Mail as MailIcon, Archive, Handshake, X, Briefcase, FileText } from "lucide-react";
import { formatCoins, type Mail } from "@/game/career";

type Folder = "inbox" | "read" | "offers";

const KIND_ICON = {
  offer: Handshake,
  job: Briefcase,
  report: FileText,
} as const;

export default function InboxModal({
  mails,
  onClose,
  onOpenMail,
  onAccept,
  onReject,
  onNegotiate,
}: {
  mails: Mail[];
  onClose: () => void;
  onOpenMail: (id: string) => void;
  onAccept: (mail: Mail) => void;
  onReject: (mail: Mail) => void;
  onNegotiate: (mail: Mail) => void;
}) {
  const [folder, setFolder] = useState<Folder>("inbox");
  const [selectedId, setSelectedId] = useState<string | null>(mails[0]?.id ?? null);

  const list = useMemo(() => {
    if (folder === "read") return mails.filter((m) => m.read);
    if (folder === "offers") return mails.filter((m) => m.kind === "offer" || m.kind === "job");
    return mails.filter((m) => !m.archived);
  }, [folder, mails]);

  const selected = mails.find((m) => m.id === selectedId) ?? list[0] ?? null;
  const unread = mails.filter((m) => !m.read).length;

  const select = (m: Mail) => {
    setSelectedId(m.id);
    if (!m.read) onOpenMail(m.id);
  };

  const folders: { id: Folder; label: string; count: number }[] = [
    { id: "inbox", label: "Recibidos", count: mails.filter((m) => !m.archived).length },
    { id: "read", label: "Leídos", count: mails.filter((m) => m.read).length },
    {
      id: "offers",
      label: "Ofertas",
      count: mails.filter((m) => m.kind === "offer" || m.kind === "job").length,
    },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm">
      <div className="flex h-full max-h-[38rem] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0e1521] shadow-2xl">
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <div className="flex items-center gap-3">
            <Inbox className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-black tracking-wide text-white">Bandeja de entrada</h2>
            {unread > 0 && (
              <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs font-bold text-white">
                {unread} sin leer
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
            aria-label="Cerrar bandeja"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[10rem_18rem_1fr]">
          {/* Sidebar */}
          <nav className="flex gap-2 border-b border-white/10 p-3 md:flex-col md:border-b-0 md:border-r">
            {folders.map((f) => (
              <button
                key={f.id}
                onClick={() => setFolder(f.id)}
                className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  folder === f.id
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "text-white/60 hover:bg-white/5"
                }`}
              >
                {f.label}
                <span className="text-xs text-white/40">{f.count}</span>
              </button>
            ))}
          </nav>

          {/* Lista */}
          <ul className="min-h-0 divide-y divide-white/5 overflow-y-auto border-white/10 md:border-r">
            {list.length === 0 && (
              <li className="p-5 text-sm text-white/40">No hay mensajes en esta carpeta.</li>
            )}
            {list.map((m) => {
              const Icon = KIND_ICON[m.kind];
              return (
                <li key={m.id}>
                  <button
                    onClick={() => select(m)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition ${
                      selected?.id === m.id ? "bg-white/10" : "hover:bg-white/5"
                    }`}
                  >
                    <Icon
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        m.read ? "text-white/30" : "text-emerald-400"
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block truncate text-sm ${
                          m.read ? "text-white/60" : "font-bold text-white"
                        }`}
                      >
                        {m.subject}
                      </span>
                      <span className="block truncate text-xs text-white/40">{m.sender}</span>
                    </span>
                    <span className="shrink-0 text-[10px] text-white/30">{m.time}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Detalle */}
          <section className="min-h-0 overflow-y-auto p-5">
            {!selected ? (
              <p className="text-sm text-white/40">Seleccioná un mensaje.</p>
            ) : (
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-xl font-black text-white">{selected.subject}</h3>
                  <p className="text-sm text-white/50">
                    {selected.sender} · {selected.time}
                  </p>
                </div>
                <p className="text-sm leading-relaxed text-white/75">{selected.body}</p>

                {selected.offer && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
                    <p className="text-white/60">
                      {selected.offer.side === "sell" ? "Venta de" : "Fichaje de"}{" "}
                      <b className="text-white">{selected.offer.playerName}</b> ·{" "}
                      {selected.offer.pos} · {selected.offer.ovr} OVR
                    </p>
                    <p className="mt-1 text-white/60">
                      Valor estimado:{" "}
                      <b className="text-amber-300">{formatCoins(selected.offer.value)}</b> · Monto
                      propuesto:{" "}
                      <b className="text-emerald-300">{formatCoins(selected.offer.amount)}</b>
                    </p>
                  </div>
                )}

                {selected.resolved ? (
                  <p
                    className={`text-sm font-bold ${
                      selected.resolved === "accepted" ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {selected.resolved === "accepted" ? "✔ Operación aceptada" : "✖ Rechazada"}
                  </p>
                ) : (
                  (selected.offer || selected.jobClubId) && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => onAccept(selected)}
                        className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold uppercase tracking-wide text-emerald-950 transition hover:bg-emerald-400"
                      >
                        Aceptar
                      </button>
                      <button
                        onClick={() => onReject(selected)}
                        className="rounded-lg border border-white/15 px-4 py-2 text-sm font-bold uppercase tracking-wide text-white/70 transition hover:bg-white/10"
                      >
                        Rechazar
                      </button>
                      {selected.offer && (
                        <button
                          onClick={() => onNegotiate(selected)}
                          className="flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-bold uppercase tracking-wide text-sky-950 transition hover:bg-sky-400"
                        >
                          <Handshake className="h-4 w-4" /> Ir a Negociar (3D)
                        </button>
                      )}
                    </div>
                  )
                )}

                {!selected.archived && selected.read && (
                  <p className="flex items-center gap-2 text-xs text-white/30">
                    <Archive className="h-3.5 w-3.5" /> Guardado en Leídos
                  </p>
                )}
              </div>
            )}
          </section>
        </div>

        <footer className="flex items-center gap-2 border-t border-white/10 px-5 py-2 text-xs text-white/40">
          <MailIcon className="h-3.5 w-3.5" /> {mails.length} mensajes · sincronizado localmente
        </footer>
      </div>
    </div>
  );
}
