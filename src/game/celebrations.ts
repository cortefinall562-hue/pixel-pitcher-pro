import * as THREE from "three";

/** Rig mínimo del jugador low-poly usado por los festejos. */
export interface CelebRig {
  root: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
}

export interface Celebration {
  id: string;
  name: string;
  desc: string;
  /** 0 = incluido de fábrica */
  price: number;
  rarity: "básico" | "raro" | "épico" | "icónico";
  play: (r: CelebRig, t: number) => void;
}

/** t = segundos desde el inicio del festejo */
export const CELEBRATIONS: Celebration[] = [
  {
    id: "brazos",
    name: "Brazos al cielo",
    desc: "Salto clásico con los brazos abiertos.",
    price: 0,
    rarity: "básico",
    play: (r, t) => {
      r.root.position.y = Math.abs(Math.sin(t * 7)) * 0.9;
      r.root.rotation.y += 0.05;
      r.armL.rotation.z = 2.5;
      r.armR.rotation.z = -2.5;
      r.legL.rotation.x = 0.3;
      r.legR.rotation.x = -0.3;
    },
  },
  {
    id: "rodillas",
    name: "Rodillazo",
    desc: "Se desliza de rodillas mirando a la tribuna.",
    price: 0,
    rarity: "básico",
    play: (r, t) => {
      const slide = Math.min(1, t * 2);
      r.root.position.y = -0.35 * slide;
      r.root.rotation.x = -0.25 * slide;
      r.legL.rotation.x = -1.5 * slide;
      r.legR.rotation.x = -1.5 * slide;
      r.armL.rotation.z = 1.9 * slide;
      r.armR.rotation.z = -1.9 * slide;
      r.armL.rotation.x = -0.6;
      r.armR.rotation.x = -0.6;
    },
  },
  {
    id: "calma",
    name: "Modo calma",
    desc: "Manos abajo, palmas al piso, cero festejo.",
    price: 2_000_000,
    rarity: "raro",
    play: (r, t) => {
      r.root.position.y = 0;
      r.root.rotation.y += 0.012;
      r.armL.rotation.z = 1.35;
      r.armR.rotation.z = -1.35;
      r.armL.rotation.x = 0.35 + Math.sin(t * 4) * 0.12;
      r.armR.rotation.x = 0.35 + Math.sin(t * 4) * 0.12;
      r.legL.rotation.x = 0;
      r.legR.rotation.x = 0;
    },
  },
  {
    id: "avion",
    name: "El avión",
    desc: "Corre con los brazos en cruz hacia la bandera.",
    price: 4_500_000,
    rarity: "raro",
    play: (r, t) => {
      r.root.position.y = 0.12 + Math.sin(t * 12) * 0.08;
      r.root.rotation.z = Math.sin(t * 3) * 0.22;
      r.armL.rotation.z = 1.55;
      r.armR.rotation.z = -1.55;
      r.legL.rotation.x = Math.sin(t * 12) * 0.8;
      r.legR.rotation.x = -Math.sin(t * 12) * 0.8;
    },
  },
  {
    id: "baile",
    name: "Baile de esquina",
    desc: "Pasos laterales con hombros al ritmo.",
    price: 7_500_000,
    rarity: "épico",
    play: (r, t) => {
      r.root.position.y = Math.abs(Math.sin(t * 9)) * 0.35;
      r.root.rotation.y = Math.sin(t * 4.5) * 0.8;
      r.armL.rotation.z = 1.1 + Math.sin(t * 9) * 0.9;
      r.armR.rotation.z = -1.1 - Math.sin(t * 9 + 1.5) * 0.9;
      r.legL.rotation.x = Math.sin(t * 9) * 0.5;
      r.legR.rotation.x = -Math.sin(t * 9) * 0.5;
    },
  },
  {
    id: "mortero",
    name: "Mortal atrás",
    desc: "Salto acrobático con giro completo.",
    price: 12_000_000,
    rarity: "épico",
    play: (r, t) => {
      const cycle = t % 1.4;
      const jump = Math.sin((cycle / 1.4) * Math.PI);
      r.root.position.y = jump * 2.1;
      r.root.rotation.x = -(cycle / 1.4) * Math.PI * 2;
      r.legL.rotation.x = -1.2 * jump;
      r.legR.rotation.x = -1.2 * jump;
      r.armL.rotation.z = 2.2;
      r.armR.rotation.z = -2.2;
    },
  },
  {
    id: "estatua",
    name: "Estatua icónica",
    desc: "Brazos abiertos, pecho al frente y pausa dramática.",
    price: 20_000_000,
    rarity: "icónico",
    play: (r, t) => {
      const rise = Math.min(1, t * 1.6);
      r.root.position.y = 0.15 * rise;
      r.root.rotation.x = -0.18 * rise;
      r.root.rotation.y += 0.02;
      r.armL.rotation.z = 1.6 * rise;
      r.armR.rotation.z = -1.6 * rise;
      r.armL.rotation.x = -0.25;
      r.armR.rotation.x = -0.25;
      r.legL.rotation.x = 0.15;
      r.legR.rotation.x = -0.15;
    },
  },
];

export function getCelebration(id: string): Celebration {
  return CELEBRATIONS.find((c) => c.id === id) ?? CELEBRATIONS[0]!;
}

export interface CelebStore {
  owned: string[];
  selected: string;
}

const KEY = "tacticafc.celebrations.v1";
const FREE = CELEBRATIONS.filter((c) => c.price === 0).map((c) => c.id);

export function loadCelebs(): CelebStore {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CelebStore;
      const owned = Array.from(new Set([...FREE, ...(parsed.owned ?? [])]));
      return { owned, selected: owned.includes(parsed.selected) ? parsed.selected : FREE[0]! };
    }
  } catch {
    /* almacenamiento no disponible */
  }
  return { owned: [...FREE], selected: FREE[0]! };
}

export function saveCelebs(store: CelebStore) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* noop */
  }
}

/** Festejo elegido por el jugador (usado por la escena del partido). */
export function selectedCelebration(): Celebration {
  return getCelebration(loadCelebs().selected);
}
