import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import type { BrowStyle, CoachConfig, HairColor, HairStyle, Outfit } from "@/game/coachScene";
import { CLUBS, DEFAULT_CLUB_ID, clubsByLeague, formatBudget, getClub } from "@/game/clubs";
import type { MatchResult } from "@/components/MatchScreen";
import type { CeremonyResult } from "@/components/CeremonyScreen";
import type { NegotiationOutcome } from "@/components/NegotiationScreen";
import {
  buildSquad,
  formatCoins,
  initialCareer,
  loadCareer,
  makeJobOfferMail,
  makeSellOfferMail,
  playerValue,
  saveCareer,
  type CareerState,
  type Mail,
  type OfferData,
} from "@/game/career";
import { rollCard, type PackDef, type PlayerCard } from "@/game/packs";
import {
  applyOutcome,
  loadOnline,
  openRoom,
  saveOnline,
  emptyOnline,
  REWARDS,
  divisionFor,
  type OnlineState,
  type RoomLink,
} from "@/game/online";
import type { OnlineStart } from "@/components/OnlineLobby";
import {
  applyPlayerResult,
  createCup,
  CUP_PRIZES,
  playerMatch,
  ROUND_NAMES,
} from "@/game/tournament";
import {
  generateProspects,
  getRegion,
  startMission,
  tickMissions,
  type Prospect,
} from "@/game/scouting";
import type { OnlineSession } from "@/components/MatchScreen";

const CoachCanvas = lazy(() => import("@/components/CoachCanvas"));
const SeasonHub = lazy(() => import("@/components/SeasonHub"));
const MatchScreen = lazy(() => import("@/components/MatchScreen"));
const NegotiationScreen = lazy(() => import("@/components/NegotiationScreen"));
const PackOpeningScreen = lazy(() => import("@/components/PackOpeningScreen"));
const CeremonyScreen = lazy(() => import("@/components/CeremonyScreen"));

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

type Screen =
  | "menu"
  | "settings"
  | "editor"
  | "season"
  | "match"
  | "negotiation"
  | "pack"
  | "ceremony";

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
  const [career, setCareer] = useState<CareerState | null>(null);
  const [pendingOffer, setPendingOffer] = useState<{ mailId: string; offer: OfferData } | null>(null);
  const [pendingPack, setPendingPack] = useState<{ pack: PackDef; card: PlayerCard } | null>(null);
  const [online, setOnline] = useState<OnlineState>(emptyOnline);
  const [session, setSession] = useState<OnlineSession | null>(null);
  const [cupMatch, setCupMatch] = useState(false);
  const [ceremony, setCeremony] = useState<CeremonyResult | null>(null);

  const editorClub = getClub(clubId);
  const club = getClub(career?.clubId ?? clubId);
  const rival = useMemo(
    () => CLUBS.find((c) => c.name === rivalName) ?? CLUBS.find((c) => c.id !== club.id)!,
    [rivalName, club.id],
  );

  const config = useMemo<CoachConfig>(
    () => ({ hairStyle, hairColor, brows, outfit }),
    [hairStyle, hairColor, brows, outfit],
  );

  const cycle = <T extends number>(v: T, dir: number): T => (((v + dir + 3) % 3) as T);

  const managerName = name.trim() || "Mánager Gallardo";

  // ---- Persistencia en localStorage ----
  useEffect(() => {
    if (career) saveCareer(career);
  }, [career]);

  useEffect(() => {
    setOnline(loadOnline());
  }, []);

  useEffect(() => {
    saveOnline(online);
  }, [online]);

  const [openOnline, setOpenOnline] = useState(false);

  const startCareer = (withOnline = false) => {
    setOpenOnline(withOnline);
    const stored = loadCareer();
    setCareer(
      stored && stored.clubId === clubId
        ? { ...stored, managerName }
        : initialCareer(managerName, clubId),
    );
    setScreen("season");
  };

  const patch = useCallback((fn: (c: CareerState) => CareerState) => {
    setCareer((prev) => (prev ? fn(prev) : prev));
  }, []);

  const resolveMail = (id: string, resolved: "accepted" | "rejected") =>
    patch((c) => ({
      ...c,
      mails: c.mails.map((m) => (m.id === id ? { ...m, resolved, read: true } : m)),
    }));

  const pushMail = (mail: Mail) => patch((c) => ({ ...c, mails: [mail, ...c.mails] }));

  const applyTransfer = (offer: OfferData, amount: number, mailId: string | null) => {
    patch((c) => {
      if (offer.side === "sell") {
        return {
          ...c,
          budget: c.budget + amount,
          squad: c.squad.filter((p) => p.id !== offer.playerId),
          mails: c.mails.map((m) =>
            m.id === mailId ? { ...m, resolved: "accepted" as const, read: true } : m,
          ),
        };
      }
      if (c.budget < amount) return c;
      return {
        ...c,
        budget: c.budget - amount,
        squad: [
          ...c.squad,
          {
            id: `${offer.playerId}-in`,
            name: offer.playerName,
            pos: offer.pos,
            ovr: offer.ovr,
            value: playerValue(offer.ovr, getClub(c.clubId).budget),
            starter: false,
          },
        ],
        mails: c.mails.map((m) =>
          m.id === mailId ? { ...m, resolved: "accepted" as const, read: true } : m,
        ),
      };
    });
  };

  const handleAccept = (mail: Mail) => {
    if (mail.offer) {
      if (mail.offer.side === "buy" && (career?.budget ?? 0) < mail.offer.amount) {
        pushMail({
          id: `${mail.id}-nofunds`,
          kind: "report",
          sender: "Departamento Financiero",
          subject: "Presupuesto insuficiente",
          body: `No podemos cubrir ${formatCoins(mail.offer.amount)} por ${mail.offer.playerName}. Saldo actual: ${formatCoins(career?.budget ?? 0)}.`,
          time: "Ahora",
          read: false,
          archived: false,
        });

        return;
      }
      applyTransfer(mail.offer, mail.offer.amount, mail.id);
      pushMail({
        id: `${mail.id}-done`,
        kind: "report",
        sender: "Secretaría Técnica",
        subject:
          mail.offer.side === "sell"
            ? `Venta cerrada: ${mail.offer.playerName}`
            : `Fichaje cerrado: ${mail.offer.playerName}`,
        body: `Operación registrada por ${formatCoins(mail.offer.amount)}. Plantilla y saldo actualizados.`,
        time: "Ahora",
        read: false,
        archived: false,
      });
      return;
    }
    if (mail.jobClubId) {
      const next = getClub(mail.jobClubId);
      patch((c) => ({
        ...c,
        clubId: next.id,
        budget: next.budget,
        squad: buildSquad(next),
        mails: c.mails.map((m) =>
          m.id === mail.id ? { ...m, resolved: "accepted" as const, read: true } : m,
        ),
      }));
      setLastResult(null);
      pushMail({
        id: `${mail.id}-welcome`,
        kind: "report",
        sender: `Presidencia · ${next.name}`,
        subject: `Bienvenido al banquillo de ${next.name}`,
        body: `Ya dirigís a ${next.name} (${next.league}). Presupuesto disponible: ${formatCoins(next.budget)}.`,
        time: "Ahora",
        read: false,
        archived: false,
      });
      return;
    }
    resolveMail(mail.id, "accepted");
  };

  const handleNegotiate = (mail: Mail) => {
    if (!mail.offer) return;
    setPendingOffer({ mailId: mail.id, offer: mail.offer });
    setScreen("negotiation");
  };

  const finishNegotiation = (outcome: NegotiationOutcome | null) => {
    if (outcome?.accepted && pendingOffer) {
      applyTransfer(outcome.offer, outcome.amount, pendingOffer.mailId);
      pushMail({
        id: `${pendingOffer.mailId}-neg`,
        kind: "report",
        sender: "Secretaría Técnica",
        subject: `Contrato firmado: ${outcome.offer.playerName}`,
        body: `Acuerdo alcanzado por ${formatCoins(outcome.amount)}${outcome.clause ? " con cláusula de rescisión incluida" : ""}.`,
        time: "Ahora",
        read: false,
        archived: false,
      });
    }
    setPendingOffer(null);
    setScreen("season");
  };

  // ---- Tienda de sobres ----
  const handleBuyPack = (pack: PackDef) => {
    if ((career?.budget ?? 0) < pack.price) return;
    patch((c) => ({ ...c, budget: c.budget - pack.price }));
    setPendingPack({ pack, card: rollCard(pack.tier) });
    setScreen("pack");
  };

  const handleClaimCard = (card: PlayerCard) => {
    patch((c) => ({
      ...c,
      squad: [
        ...c.squad,
        {
          id: card.id,
          name: card.name,
          pos: card.pos,
          ovr: card.ovr,
          value: card.value,
          starter: false,
        },
      ],
      mails: [
        {
          id: `pack-${card.id}`,
          kind: "report" as const,
          sender: "Secretaría Técnica",
          subject: `Nueva carta: ${card.name} (${card.ovr} GRL)`,
          body: `${card.name} — ${card.pos}, ${card.ovr} GRL, ${card.nationality.name}. Obtenido en ${pendingPack?.pack.name ?? "un sobre"}. Valor estimado: ${formatCoins(card.value)}. Ya está disponible en tu plantilla.`,
          time: "Ahora",
          read: false,
          archived: false,
        },
        ...c.mails,
      ],
    }));
    setPendingPack(null);
    setScreen("season");
  };

  // ---- Copa por eliminación directa ----
  const handleCreateCup = () => {
    patch((c) => ({ ...c, cup: createCup(c.clubId, (c.cup?.season ?? 0) + 1) }));
  };

  const handlePlayCup = (rivalName: string) => {
    setRivalName(rivalName);
    setCupMatch(true);
    setSession(null);
    setScreen("match");
  };

  // ---- Ojeadores y juveniles ----
  const handleSendScout = (regionId: string, focus: Prospect["pos"] | "any") => {
    const region = getRegion(regionId);
    patch((c) => {
      if (c.budget < region.cost) return c;
      return {
        ...c,
        budget: c.budget - region.cost,
        scouts: [...c.scouts, startMission(regionId, focus)],
        mails: [
          {
            id: `scout-${Date.now()}`,
            kind: "report" as const,
            sender: "Dirección de Cantera",
            subject: `Ojeador enviado a ${region.name}`,
            body: `Misión abierta en ${region.name} buscando ${focus === "any" ? "cualquier puesto" : focus}. Coste: ${formatCoins(region.cost)}. El informe llegará en ${region.matches} partidos.`,
            time: "Ahora",
            read: false,
            archived: false,
          },
          ...c.mails,
        ],
      };
    });
  };

  const handleSignProspect = (p: Prospect) => {
    patch((c) => {
      if (c.budget < p.value) return c;
      return {
        ...c,
        budget: c.budget - p.value,
        prospects: c.prospects.filter((x) => x.id !== p.id),
        squad: [
          ...c.squad,
          {
            id: p.id,
            name: p.name,
            pos: p.pos,
            ovr: p.ovr,
            value: p.value,
            starter: false,
          },
        ],
        mails: [
          {
            id: `youth-${p.id}`,
            kind: "report" as const,
            sender: "Dirección de Cantera",
            subject: `Juvenil fichado: ${p.name} (${p.ovr}/${p.potential})`,
            body: `${p.name}, ${p.age} años, ${p.pos}. Potencial ${p.potential}. ${p.trait}. Coste: ${formatCoins(p.value)}. Ya entrena con el primer equipo.`,
            time: "Ahora",
            read: false,
            archived: false,
          },
          ...c.mails,
        ],
      };
    });
  };

  const handleDiscardProspect = (id: string) =>
    patch((c) => ({ ...c, prospects: c.prospects.filter((p) => p.id !== id) }));

  /** Avanza las misiones de ojeo tras cada partido. */
  const advanceScouting = (c: CareerState): CareerState => {
    if (c.scouts.length === 0) return c;
    const { missions, finished } = tickMissions(c.scouts);
    if (finished.length === 0) return { ...c, scouts: missions };
    const found = finished.flatMap((m) => generateProspects(m));
    return {
      ...c,
      scouts: missions,
      prospects: [...found, ...c.prospects],
      mails: [
        {
          id: `report-${Date.now()}`,
          kind: "report" as const,
          sender: "Dirección de Cantera",
          subject: `Informe de ojeo: ${found.length} promesa${found.length > 1 ? "s" : ""}`,
          body: found
            .map(
              (p) =>
                `${p.name} — ${p.pos}, ${p.age} años, ${p.ovr} GRL (potencial ${p.potential}). ${p.trait}. Pide ${formatCoins(p.value)}.`,
            )
            .join(" · "),
          time: "Ahora",
          read: false,
          archived: false,
        },
        ...c.mails,
      ],
    };
  };

  const startOnlineMatch = (start: OnlineStart) => {
    const link: RoomLink = openRoom(start.code, start.isHost);
    setRivalName(start.rivalName);
    setSession({
      link,
      points: online.points,
      division: divisionFor(online.points),
      mode: start.mode,
    });
    setScreen("match");
  };

  const handleMatchExit = (result: MatchResult) => {
    if (result.online) {
      const final = result.walkover ? { ...result, team: 3, rival: 0 } : result;
      const outcome: "win" | "draw" | "loss" = result.walkover
        ? "win"
        : final.team > final.rival
          ? "win"
          : final.team === final.rival
            ? "draw"
            : "loss";
      const reward = REWARDS[outcome];
      setOnline((o) => applyOutcome(o, outcome));
      setSession(null);
      setLastResult(final);
      patch((c) => ({
        ...c,
        budget: c.budget + reward.coins,
        mails: [
          {
            id: `online-${Date.now()}`,
            kind: "report" as const,
            sender: "Liga Online · Táctica FC",
            subject: `Partido online: ${outcome === "win" ? "victoria" : outcome === "draw" ? "empate" : "derrota"} ${final.team}-${final.rival}`,
            body: `${getClub(c.clubId).name} ${final.team} - ${final.rival} ${final.rivalName}${result.walkover ? " (abandono del rival)" : ""}. Puntos de liga: ${reward.points > 0 ? "+" : ""}${reward.points}. Bono: ${formatCoins(reward.coins)}.`,
            time: "Ahora",
            read: false,
            archived: false,
          },
          ...c.mails,
        ],
      }));
      setScreen("season");
      return;
    }

    setLastResult(result);
    const won = result.team > result.rival;

    if (cupMatch) {
      setCupMatch(false);
      let ceremonyData: CeremonyResult | null = null;
      patch((c) => {
        if (!c.cup) return c;
        const before = c.cup;
        const round = before.roundIndex;
        const cup = applyPlayerResult(before, c.clubId, result.team, result.rival);
        const stillIn =
          cup.champion === c.clubId || !!playerMatch(cup, c.clubId);
        const prize = stillIn ? CUP_PRIZES[Math.min(round, CUP_PRIZES.length - 1)]! : 400_000;
        const champion = cup.champion === c.clubId;
        return advanceScouting({
          ...c,
          cup,
          wins: c.wins + (won ? 1 : 0),
          trophies: c.trophies + (champion ? 1 : 0),
          budget: c.budget + prize + (champion ? 12_000_000 : 0),
          mails: [
            {
              id: `cup-${Date.now()}`,
              kind: "report" as const,
              sender: "Comité de la Copa Continental",
              subject: champion
                ? `¡CAMPEONES DE LA COPA CONTINENTAL!`
                : stillIn
                  ? `Clasificados: ${ROUND_NAMES[Math.min(round + 1, ROUND_NAMES.length - 1)]}`
                  : `Eliminados en ${ROUND_NAMES[Math.min(round, ROUND_NAMES.length - 1)]}`,
              body: champion
                ? `Levantaron el trofeo tras ganar ${result.team}-${result.rival} a ${result.rivalName}. Premio total acreditado: ${formatCoins(prize + 12_000_000)}.`
                : `Resultado ${getClub(c.clubId).name} ${result.team} - ${result.rival} ${result.rivalName}. Ingresos por la participación: ${formatCoins(prize)}.`,
              time: "Ahora",
              read: false,
              archived: false,
            },
            ...c.mails,
          ],
        });
      });
      setScreen("season");
      return;
    }

    patch((c) => {
      const current = getClub(c.clubId);
      const prize = won ? 1_500_000 : result.team === result.rival ? 600_000 : 200_000;
      const extra: Mail[] = [makeSellOfferMail(current, c.squad, c.mails.length)];
      if (won && (c.wins + 1) % 2 === 0) extra.push(makeJobOfferMail(current));
      return advanceScouting({
        ...c,
        wins: c.wins + (won ? 1 : 0),
        budget: c.budget + prize,
        mails: [
          {
            id: `res-${Date.now()}`,
            kind: "report",
            sender: "Departamento Financiero",
            subject: `Premio por ${won ? "victoria" : result.team === result.rival ? "empate" : "derrota"}: ${formatCoins(prize)}`,
            body: `Resultado ${current.name} ${result.team} - ${result.rival} ${result.rivalName}. Saldo acreditado: ${formatCoins(prize)}.`,
            time: "Ahora",
            read: false,
            archived: false,
          },
          ...extra,
          ...c.mails,
        ],
      });
    });
    setScreen("season");
  };

  if (screen === "negotiation" && pendingOffer && career) {
    return (
      <ClientOnly fallback={<div className="min-h-screen bg-pitch-night" />}>
        <Suspense fallback={<div className="min-h-screen bg-pitch-night" />}>
          <NegotiationScreen
            club={club}
            budget={career.budget}
            offer={pendingOffer.offer}
            onFinish={finishNegotiation}
          />
        </Suspense>
      </ClientOnly>
    );
  }

  if (screen === "pack" && pendingPack && career) {
    return (
      <ClientOnly fallback={<div className="min-h-screen bg-black" />}>
        <Suspense fallback={<div className="min-h-screen bg-black" />}>
          <PackOpeningScreen
            tier={pendingPack.pack.tier}
            card={pendingPack.card}
            club={club}
            onClaim={handleClaimCard}
          />
        </Suspense>
      </ClientOnly>
    );
  }

  if (screen === "match") {
    return (
      <ClientOnly fallback={<div className="min-h-screen bg-sky" />}>
        <Suspense fallback={<div className="min-h-screen bg-sky" />}>
          <MatchScreen
            club={club}
            rival={rival}
            {...(session ? { online: session } : {})}
            onExit={handleMatchExit}
          />
        </Suspense>
      </ClientOnly>
    );
  }

  if (screen === "season" && career) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-pitch-night" />}>
        <div className="animate-fade-in">
          <SeasonHub
            managerName={career.managerName}
            club={club}
            budget={career.budget}
            mails={career.mails}
            squadSize={career.squad.length}
            lastResult={lastResult}
            onPlayMatch={(r) => {
              setRivalName(r);
              setCupMatch(false);
              setSession(null);
              setScreen("match");
            }}
            onOpenMail={(id) =>
              patch((c) => ({
                ...c,
                mails: c.mails.map((m) => (m.id === id ? { ...m, read: true } : m)),
              }))
            }
            onAcceptMail={handleAccept}
            onRejectMail={(m) => resolveMail(m.id, "rejected")}
            onNegotiateMail={handleNegotiate}
            onBuyPack={handleBuyPack}
            online={online}
            onStartOnline={startOnlineMatch}
            openOnline={openOnline}
            cup={career.cup}
            trophies={career.trophies}
            onCreateCup={handleCreateCup}
            onPlayCup={handlePlayCup}
            scouts={career.scouts}
            prospects={career.prospects}
            onSendScout={handleSendScout}
            onSignProspect={handleSignProspect}
            onDiscardProspect={handleDiscardProspect}
            onSpendCoins={(amount) => patch((c) => ({ ...c, budget: c.budget - amount }))}
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
              <button
                className="btn-ghost w-full"
                onClick={() => startCareer(true)}
              >
                🌐 MODO ONLINE CARA A CARA
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
                {clubsByLeague().map((group) => (
                  <optgroup key={group.league} label={group.league}>
                    {group.clubs.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} — {formatBudget(c.budget)}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <div className="flex items-center justify-between rounded-xl bg-secondary/50 px-4 py-2.5 text-sm">
                <span className="text-muted-foreground">{editorClub.league}</span>
                <span className="font-display text-turf">{formatBudget(editorClub.budget)}</span>
              </div>
            </div>

            <button className="btn-play w-full" onClick={() => startCareer()}>
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
