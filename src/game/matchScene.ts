import * as THREE from "three";
import { selectedCelebration } from "./celebrations";

export type MatchEvent = "kickoff" | "shot" | "danger" | "nearmiss";

/** Estado sincronizado por red (posiciones normalizadas del rival y la pelota). */
export interface NetState {
  hx: number;
  hz: number;
  bx: number;
  bz: number;
}

export interface NetLink {
  /** true si este cliente es autoridad de la pelota */
  isHost: boolean;
  send: (s: NetState) => void;
  latest: () => NetState | null;
}

export interface MatchOptions {
  teamShirt: number;
  teamShorts: number;
  rivalShirt: number;
  rivalShorts: number;
  onScore: (side: "team" | "rival") => void;
  onGoal?: (side: "team" | "rival") => void;
  onClock: (minute: number) => void;
  onEnd: () => void;
  onEvent?: (event: MatchEvent) => void;
  net?: NetLink;
}


const SKIN = 0xf0b98a;
const FIELD_X = 20;
const FIELD_Z = 13;
const GOAL_HALF = 3.4;
const CELEBRATION_TIME = 3;

function mat(color: number) {
  return new THREE.MeshLambertMaterial({ color });
}

function box(w: number, h: number, d: number, color: number) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
}

function cyl(r: number, h: number, color: number) {
  return new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 8), mat(color));
}

type Role = "gk" | "def" | "mid" | "fwd";
type KickKind = "pass" | "power" | "finesse";

interface Player {
  root: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  vel: THREE.Vector3;
  phase: number;
  /** tiempo restante de la animación de patada */
  kickT: number;
  kickDur: number;
  kickKind: KickKind;
  /** enfriamiento antes de volver a tocar la pelota */
  cooldown: number;
  role: Role;
  home: THREE.Vector3;
  /** 1 = ataca hacia +X, -1 = ataca hacia -X */
  side: number;
}

function createPlayer(
  shirt: number,
  shorts: number,
  role: Role = "mid",
  home: THREE.Vector3 = new THREE.Vector3(),
  side = 1,
): Player {
  const root = new THREE.Group();

  const torso = box(0.8, 0.85, 0.45, shirt);
  torso.position.y = 1.25;
  root.add(torso);

  const head = box(0.68, 0.64, 0.62, SKIN);
  head.position.y = 1.98;
  root.add(head);

  const hair = box(0.7, 0.16, 0.64, 0x2a2124);
  hair.position.y = 2.29;
  root.add(hair);

  const eyeL = box(0.1, 0.11, 0.05, 0x2b2b33);
  eyeL.position.set(-0.15, 2.02, 0.32);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.15;
  root.add(eyeL, eyeR);

  function limb(side: number, isArm: boolean) {
    const g = new THREE.Group();
    if (isArm) {
      g.position.set(side * 0.52, 1.6, 0);
      const sleeve = cyl(0.11, 0.6, shirt);
      sleeve.position.y = -0.3;
      const hand = box(0.2, 0.2, 0.2, SKIN);
      hand.position.y = -0.68;
      g.add(sleeve, hand);
    } else {
      g.position.set(side * 0.22, 0.85, 0);
      const short = box(0.3, 0.3, 0.32, shorts);
      short.position.y = -0.14;
      const leg = cyl(0.13, 0.55, SKIN);
      leg.position.y = -0.55;
      const shoe = box(0.3, 0.18, 0.42, 0x1b1d22);
      shoe.position.set(0, -0.88, 0.07);
      g.add(short, leg, shoe);
    }
    return g;
  }

  const armL = limb(-1, true);
  const armR = limb(1, true);
  const legL = limb(-1, false);
  const legR = limb(1, false);
  root.add(armL, armR, legL, legR);

  root.position.copy(home);
  return {
    root,
    legL,
    legR,
    armL,
    armR,
    vel: new THREE.Vector3(),
    phase: Math.random() * 6,
    kickT: 0,
    kickDur: 0.3,
    kickKind: "pass",
    cooldown: 0,
    role,
    home: home.clone(),
    side,
  };
}

export function createMatchScene(canvas: HTMLCanvasElement, opts: MatchOptions) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x8fd8f7);
  scene.fog = new THREE.Fog(0x8fd8f7, 60, 110);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 250);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x77aa66, 1.05));
  const sun = new THREE.DirectionalLight(0xfff3d6, 0.8);
  sun.position.set(10, 18, 8);
  scene.add(sun);

  // ---- Cancha ----
  const pitch = new THREE.Group();
  scene.add(pitch);
  const stripeGeo = new THREE.BoxGeometry(4, 0.4, FIELD_Z * 2 + 4);
  for (let i = 0; i < 11; i++) {
    const m = new THREE.Mesh(stripeGeo, mat(i % 2 === 0 ? 0x4fbf5f : 0x45b055));
    m.position.set(-20 + i * 4 + 2, -0.2, 0);
    pitch.add(m);
  }
  const border = box((FIELD_X + 6) * 2, 0.36, (FIELD_Z + 6) * 2, 0x3a9a4c);
  border.position.y = -0.22;
  pitch.add(border);

  // líneas
  const lineY = 0.02;
  const addLine = (w: number, d: number, x: number, z: number) => {
    const l = box(w, 0.06, d, 0xffffff);
    l.position.set(x, lineY, z);
    pitch.add(l);
  };
  addLine(FIELD_X * 2, 0.22, 0, -FIELD_Z);
  addLine(FIELD_X * 2, 0.22, 0, FIELD_Z);
  addLine(0.22, FIELD_Z * 2, -FIELD_X, 0);
  addLine(0.22, FIELD_Z * 2, FIELD_X, 0);
  addLine(0.22, FIELD_Z * 2, 0, 0);
  const circle = new THREE.Mesh(new THREE.TorusGeometry(4, 0.11, 6, 40), mat(0xffffff));
  circle.rotation.x = Math.PI / 2;
  circle.position.y = lineY;
  pitch.add(circle);
  for (const s of [-1, 1]) {
    addLine(0.22, 10, s * (FIELD_X - 5), 0);
    addLine(5, 0.22, s * (FIELD_X - 2.5), -5);
    addLine(5, 0.22, s * (FIELD_X - 2.5), 5);
  }

  // arcos de cilindros blancos + red simple
  function goal(side: number) {
    const g = new THREE.Group();
    const postL = cyl(0.16, 2.6, 0xffffff);
    postL.position.set(0, 1.3, -GOAL_HALF);
    const postR = postL.clone();
    postR.position.z = GOAL_HALF;
    const bar = cyl(0.16, GOAL_HALF * 2, 0xffffff);
    bar.rotation.x = Math.PI / 2;
    bar.position.y = 2.6;
    const net = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 2.6, GOAL_HALF * 2),
      new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.22 }),
    );
    net.position.set(side * 1.4, 1.3, 0);
    g.add(postL, postR, bar, net);
    g.position.x = side * FIELD_X;
    pitch.add(g);
  }
  goal(-1);
  goal(1);

  // ---- Estadio: gradas ----
  const stands = new THREE.Group();
  scene.add(stands);
  const standMatA = mat(0x5a6472);
  const standMatB = mat(0x394456);
  const STAND_STEPS = 5;
  interface FanSeat {
    x: number;
    z: number;
    y: number;
    yaw: number;
    support: "team" | "rival";
  }
  const seatRows: FanSeat[] = [];

  function buildStand(axis: "x" | "z", sign: number) {
    const long = axis === "x" ? (FIELD_Z + 8) * 2 : (FIELD_X + 8) * 2;
    for (let s = 0; s < STAND_STEPS; s++) {
      const y = 0.6 + s * 1.05;
      const off = (axis === "x" ? FIELD_X + 8 : FIELD_Z + 8) + s * 2.1;
      const step = new THREE.Mesh(
        axis === "x" ? new THREE.BoxGeometry(2.1, y * 2, long) : new THREE.BoxGeometry(long, y * 2, 2.1),
        s % 2 === 0 ? standMatA : standMatB,
      );
      if (axis === "x") step.position.set(sign * off, 0, 0);
      else step.position.set(0, 0, sign * off);
      stands.add(step);

      // filas de asientos (posiciones para la hinchada)
      const count = Math.floor(long / 1.35);
      for (let i = 0; i < count; i++) {
        const t = -long / 2 + 0.7 + i * 1.35;
        const px = axis === "x" ? sign * off : t;
        const pz = axis === "x" ? t : sign * off;
        const yaw = Math.atan2(-px, -pz);
        seatRows.push({
          x: px,
          z: pz,
          y: y + 0.45,
          yaw,
          support: px <= 0 ? "team" : "rival",
        });
      }
    }
  }
  buildStand("x", -1);
  buildStand("x", 1);
  buildStand("z", -1);
  buildStand("z", 1);

  // túneles, barandas y torres de iluminación
  const railMat = mat(0xdce8ed);
  for (const z of [-FIELD_Z - 5.8, FIELD_Z + 5.8]) {
    const rail = box((FIELD_X + 6) * 2, 0.18, 0.18, 0xdce8ed);
    rail.position.set(0, 1.15, z);
    stands.add(rail);
  }
  for (const x of [-FIELD_X - 5.8, FIELD_X + 5.8]) {
    const rail = box(0.18, 0.18, (FIELD_Z + 6) * 2, 0xdce8ed);
    rail.position.set(x, 1.15, 0);
    stands.add(rail);
  }
  const tunnel = box(4.2, 2.4, 3, 0x252d39);
  tunnel.position.set(0, 1.2, FIELD_Z + 7.2);
  stands.add(tunnel);
  for (const x of [-FIELD_X - 7, FIELD_X + 7]) {
    for (const z of [-FIELD_Z - 7, FIELD_Z + 7]) {
      const mast = cyl(0.18, 15, 0x66737f);
      mast.position.set(x, 7.5, z);
      const lights = box(4.2, 1.3, 0.5, 0xf4f7d4);
      lights.position.set(x, 14.5, z);
      stands.add(mast, lights);
    }
  }
  void railMat;

  // ---- Hinchada proporcionada (InstancedMesh optimizado) ----
  const FAN_ACCENTS = [0xffffff, 0xffd84a, 0x49b7ff, 0xff684f];
  const SKIN_TONES = [0xf6c79e, 0xd99a6c, 0xa96543, 0x75432f];
  const fanCount = seatRows.length;
  const makeCrowdPart = (geometry: THREE.BufferGeometry, material = new THREE.MeshLambertMaterial()) => {
    const mesh = new THREE.InstancedMesh(geometry, material, fanCount);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(mesh);
    return mesh;
  };
  const crowdBody = makeCrowdPart(new THREE.BoxGeometry(0.62, 0.72, 0.38));
  const crowdLegs = makeCrowdPart(new THREE.BoxGeometry(0.5, 0.38, 0.34));
  const crowdHeads = makeCrowdPart(new THREE.BoxGeometry(0.42, 0.42, 0.4));
  const crowdArmsL = makeCrowdPart(new THREE.BoxGeometry(0.16, 0.58, 0.18));
  const crowdArmsR = makeCrowdPart(new THREE.BoxGeometry(0.16, 0.58, 0.18));
  const crowdEyes = makeCrowdPart(
    new THREE.BoxGeometry(0.25, 0.055, 0.035),
    new THREE.MeshLambertMaterial({ color: 0x20242a }),
  );
  const crowdMouths = makeCrowdPart(
    new THREE.BoxGeometry(0.15, 0.045, 0.038),
    new THREE.MeshLambertMaterial({ color: 0x713b3b }),
  );
  const crowdParts = [crowdBody, crowdLegs, crowdHeads, crowdArmsL, crowdArmsR, crowdEyes, crowdMouths];
  const fanPhase = new Float32Array(fanCount);
  const fanBase = new Float32Array(fanCount * 3);
  const fanScale = new Float32Array(fanCount);
  const fanSupport = new Int8Array(fanCount);
  const fanYaw = new Float32Array(fanCount);
  const tmpFan = new THREE.Object3D();
  const tmpColor = new THREE.Color();
  const fanOffset = new THREE.Vector3();

  function placeFanPart(
    mesh: THREE.InstancedMesh,
    index: number,
    baseX: number,
    baseY: number,
    baseZ: number,
    yaw: number,
    localX: number,
    localY: number,
    localZ: number,
    scaleX: number,
    scaleY: number,
    scaleZ: number,
    rotX = 0,
    rotZ = 0,
  ) {
    fanOffset.set(localX, localY, localZ).applyAxisAngle(THREE.Object3D.DEFAULT_UP, yaw);
    tmpFan.position.set(baseX + fanOffset.x, baseY + fanOffset.y, baseZ + fanOffset.z);
    tmpFan.rotation.set(rotX, yaw, rotZ);
    tmpFan.scale.set(scaleX, scaleY, scaleZ);
    tmpFan.updateMatrix();
    mesh.setMatrixAt(index, tmpFan.matrix);
  }

  function poseFan(index: number, hop: number, cheer: number, time: number) {
    const x = fanBase[index * 3]!;
    const y = fanBase[index * 3 + 1]! + hop;
    const z = fanBase[index * 3 + 2]!;
    const yaw = fanYaw[index]!;
    const size = fanScale[index]!;
    const sway = Math.sin(time * 9 + fanPhase[index]!) * cheer * 0.2;
    const armLift = cheer * (1.7 + Math.sin(time * 13 + fanPhase[index]!) * 0.3);
    placeFanPart(crowdLegs, index, x, y, z, yaw, 0, -0.2, 0, size, size, size);
    placeFanPart(crowdBody, index, x, y, z, yaw, 0, 0.25, 0, size, size, size, 0, sway);
    placeFanPart(crowdHeads, index, x, y, z, yaw, 0, 0.85, 0, size, size, size, 0, -sway * 0.5);
    placeFanPart(crowdEyes, index, x, y, z, yaw, 0, 0.91, 0.215, size, size, size);
    placeFanPart(crowdMouths, index, x, y, z, yaw, 0, 0.76, 0.22, size, size * (1 + cheer * 2), size);
    placeFanPart(crowdArmsL, index, x, y, z, yaw, -0.4, 0.25 + cheer * 0.2, 0, size, size, size, armLift, -0.15 - cheer * 0.45);
    placeFanPart(crowdArmsR, index, x, y, z, yaw, 0.4, 0.25 + cheer * 0.2, 0, size, size, size, armLift, 0.15 + cheer * 0.45);
  }

  for (let i = 0; i < fanCount; i++) {
    const s = seatRows[i]!;
    fanBase[i * 3] = s.x;
    fanBase[i * 3 + 1] = s.y;
    fanBase[i * 3 + 2] = s.z;
    fanPhase[i] = Math.random() * Math.PI * 2;
    fanScale[i] = 0.86 + Math.random() * 0.22;
    fanSupport[i] = s.support === "team" ? 1 : -1;
    fanYaw[i] = s.yaw;
    const shirt = s.support === "team" ? opts.teamShirt : opts.rivalShirt;
    crowdBody.setColorAt(i, tmpColor.setHex(i % 5 === 0 ? FAN_ACCENTS[i % FAN_ACCENTS.length]! : shirt));
    crowdLegs.setColorAt(i, tmpColor.setHex(i % 3 === 0 ? 0x263344 : 0x35475b));
    crowdHeads.setColorAt(i, tmpColor.setHex(SKIN_TONES[i % SKIN_TONES.length]!));
    crowdArmsL.setColorAt(i, tmpColor.setHex(SKIN_TONES[i % SKIN_TONES.length]!));
    crowdArmsR.setColorAt(i, tmpColor.setHex(SKIN_TONES[i % SKIN_TONES.length]!));
    poseFan(i, 0, 0, 0);
  }
  for (const part of crowdParts) {
    part.instanceMatrix.needsUpdate = true;
    if (part.instanceColor) part.instanceColor.needsUpdate = true;
  }

  // ---- Banderas de ambas parcialidades ----
  const flags: { root: THREE.Group; cloth: THREE.Mesh; phase: number; support: "team" | "rival" }[] = [];
  const flagSpots = [
    [-24, 5.8, -11], [-24, 7.8, -5], [-24, 6.8, 4], [-24, 8.7, 10],
    [24, 5.8, -11], [24, 7.8, -5], [24, 6.8, 4], [24, 8.7, 10],
    [-12, 7.6, -19], [-5, 5.7, -19], [6, 7.2, 19], [13, 6.2, 19],
  ] as const;
  for (let i = 0; i < flagSpots.length; i++) {
    const [x, y, z] = flagSpots[i]!;
    const support = x <= 0 ? "team" : "rival";
    const root = new THREE.Group();
    const pole = cyl(0.07, 3.1, 0xe6edf0);
    pole.position.y = 1.3;
    const cloth = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 1.25, 3, 1),
      new THREE.MeshLambertMaterial({
        color: support === "team" ? opts.teamShirt : opts.rivalShirt,
        side: THREE.DoubleSide,
      }),
    );
    cloth.position.set(1.2, 2.15, 0);
    root.add(pole, cloth);
    root.position.set(x, y, z);
    root.rotation.y = Math.atan2(-x, -z);
    flags.push({ root, cloth, phase: i * 0.73, support });
    scene.add(root);
  }

  // nubes
  const clouds = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const c = new THREE.Group();
    for (let j = 0; j < 3; j++) {
      const b = box(3 - j * 0.4, 1.4, 2, 0xffffff);
      b.position.set(j * 1.8 - 1.8, j === 1 ? 0.5 : 0, 0);
      c.add(b);
    }
    c.position.set(-24 + i * 9, 20 + (i % 3) * 2, -40 - (i % 2) * 6);
    clouds.add(c);
  }
  scene.add(clouds);

  // ---- Pelota ----
  const ball = new THREE.Group();
  const ballR = 0.42;
  const shell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(ballR, 1),
    new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true }),
  );
  ball.add(shell);
  const patchGeo = new THREE.IcosahedronGeometry(ballR * 0.42, 0);
  const patchMat = new THREE.MeshLambertMaterial({ color: 0x22252c, flatShading: true });
  for (let i = 0; i < 8; i++) {
    const p = new THREE.Mesh(patchGeo, patchMat);
    const a = i * 2.4;
    const y = -0.85 + (i / 7) * 1.7;
    const r = Math.sqrt(Math.max(0.02, 1 - y * y));
    p.position.set(Math.cos(a) * r * ballR, y * ballR, Math.sin(a) * r * ballR);
    ball.add(p);
  }
  ball.position.set(0, ballR, 0);
  scene.add(ball);
  const ballVel = new THREE.Vector3();

  // ---- Jugadores (equipo ataca hacia +X, rival hacia -X) ----
  const teamP = (role: Role, x: number, z: number) =>
    createPlayer(opts.teamShirt, opts.teamShorts, role, new THREE.Vector3(x, 0, z), 1);
  const rivalP = (role: Role, x: number, z: number) =>
    createPlayer(opts.rivalShirt, opts.rivalShorts, role, new THREE.Vector3(x, 0, z), -1);

  const hero = teamP("mid", -4, 2);
  const mate = teamP("fwd", 6, -5);
  const mate2 = teamP("mid", -8, 5);
  const back = teamP("def", -14, 0);
  const keeper = teamP("gk", -FIELD_X + 1.1, 0);

  const rival1 = rivalP("fwd", 5, -3);
  const rival2 = rivalP("mid", 9, 4);
  const rival3 = rivalP("def", 14, -1);
  const rivalKeeper = rivalP("gk", FIELD_X - 1.1, 0);
  rival1.root.rotation.y = Math.PI;
  rival2.root.rotation.y = Math.PI;
  rival3.root.rotation.y = Math.PI;
  rivalKeeper.root.rotation.y = Math.PI;

  const teamMates = [mate, mate2, back, keeper];
  const rivals = [rival1, rival2, rival3, rivalKeeper];
  const everyone = [hero, ...teamMates, ...rivals];
  for (const p of everyone) scene.add(p.root);

  const marker = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.09, 6, 24), mat(0xfdf14a));
  marker.rotation.x = Math.PI / 2;
  scene.add(marker);

  // ---- Estela de turbo (pool reutilizable) ----
  const TRAIL = 14;
  const trailMat = new THREE.MeshBasicMaterial({ color: 0x9ef0ff, transparent: true, opacity: 0.6 });
  const trail: THREE.Mesh[] = [];
  const trailLife = new Float32Array(TRAIL);
  const trailGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
  for (let i = 0; i < TRAIL; i++) {
    const m = new THREE.Mesh(trailGeo, trailMat.clone());
    m.visible = false;
    trail.push(m);
    scene.add(m);
  }
  let trailIdx = 0;
  let trailTimer = 0;

  // ---- Confeti (Points) ----
  const CONFETTI = 220;
  const confPos = new Float32Array(CONFETTI * 3);
  const confVel = new Float32Array(CONFETTI * 3);
  const confCol = new Float32Array(CONFETTI * 3);
  const confGeo = new THREE.BufferGeometry();
  confGeo.setAttribute("position", new THREE.BufferAttribute(confPos, 3));
  confGeo.setAttribute("color", new THREE.BufferAttribute(confCol, 3));
  const confetti = new THREE.Points(
    confGeo,
    new THREE.PointsMaterial({ size: 0.3, vertexColors: true, transparent: true }),
  );
  confetti.visible = false;
  scene.add(confetti);

  function burstConfetti(at: THREE.Vector3) {
    for (let i = 0; i < CONFETTI; i++) {
      confPos[i * 3] = at.x + (Math.random() - 0.5) * 6;
      confPos[i * 3 + 1] = at.y + 5 + Math.random() * 6;
      confPos[i * 3 + 2] = at.z + (Math.random() - 0.5) * 6;
      confVel[i * 3] = (Math.random() - 0.5) * 1.6;
      confVel[i * 3 + 1] = -1.5 - Math.random() * 2;
      confVel[i * 3 + 2] = (Math.random() - 0.5) * 1.6;
      const confettiColors = [opts.teamShirt, opts.rivalShirt, ...FAN_ACCENTS];
      tmpColor.setHex(confettiColors[i % confettiColors.length]!);
      confCol[i * 3] = tmpColor.r;
      confCol[i * 3 + 1] = tmpColor.g;
      confCol[i * 3 + 2] = tmpColor.b;
    }
    confGeo.attributes['position']!.needsUpdate = true;
    confGeo.attributes['color']!.needsUpdate = true;
    confetti.visible = true;
  }

  // ---- Festejo elegido por el jugador ----
  const celebration = selectedCelebration();

  // ---- Controles ----
  const keys = new Set<string>();
  const MOVE_KEYS = ["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"];
  const ACTION_KEYS = ["e", "f", "q", " ", "shift"];
  let wantPower = false;
  let wantFinesse = false;
  let wantPass = false;
  let wantDodge = false;

  const onKeyDown = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (MOVE_KEYS.includes(k) || ACTION_KEYS.includes(k)) e.preventDefault();
    if (e.repeat) {
      if (MOVE_KEYS.includes(k) || k === "shift") keys.add(k);
      return;
    }
    if (MOVE_KEYS.includes(k) || ACTION_KEYS.includes(k)) keys.add(k);
    if (k === "e") wantPower = true;
    if (k === "f") wantFinesse = true;
    if (k === " ") wantPass = true;
    if (k === "q") wantDodge = true;
  };
  const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  const clamp = (p: THREE.Vector3) => {
    p.x = THREE.MathUtils.clamp(p.x, -FIELD_X - 1.5, FIELD_X + 1.5);
    p.z = THREE.MathUtils.clamp(p.z, -FIELD_Z - 1, FIELD_Z + 1);
  };

  function animateLimbs(p: Player, speed: number, dt: number) {
    if (p.kickT > 0) return;
    p.phase += dt * (2.5 + speed * 4);
    const amp = Math.min(0.9, 0.12 + speed * 0.85);
    const s = Math.sin(p.phase * 2);
    p.legL.rotation.x = s * amp;
    p.legR.rotation.x = -s * amp;
    p.armL.rotation.x = -s * amp * 0.8;
    p.armR.rotation.x = s * amp * 0.8;
    p.root.rotation.z = 0;
    p.armL.rotation.z = 0;
    p.armR.rotation.z = 0;
  }

  const KICK_DUR: Record<KickKind, number> = { pass: 0.26, power: 0.46, finesse: 0.34 };

  /** Arranca la animación de golpeo; devuelve el retardo hasta el impacto. */
  function startKick(p: Player, kind: KickKind) {
    p.kickKind = kind;
    p.kickDur = KICK_DUR[kind];
    p.kickT = p.kickDur;
    p.cooldown = kind === "pass" ? 0.3 : 0.5;
  }

  /** Pose de golpeo: amague de pierna, impacto y acompañamiento. */
  function animateKickPose(p: Player, dt: number) {
    if (p.kickT <= 0) return false;
    p.kickT = Math.max(0, p.kickT - dt);
    const u = 1 - p.kickT / p.kickDur;
    const kind = p.kickKind;
    const windup = kind === "power" ? 0.42 : kind === "finesse" ? 0.36 : 0.3;
    const back = kind === "power" ? 1.35 : kind === "finesse" ? 0.85 : 0.6;
    const through = kind === "power" ? -1.9 : kind === "finesse" ? -1.15 : -0.85;

    if (u < windup) {
      const w = u / windup;
      p.legR.rotation.x = back * w;
      p.root.rotation.z = (kind === "power" ? 0.16 : 0.06) * w;
      p.armL.rotation.z = (kind === "power" ? -0.7 : -0.35) * w;
      p.armR.rotation.z = (kind === "power" ? 0.5 : 0.25) * w;
    } else {
      const w = (u - windup) / (1 - windup);
      p.legR.rotation.x = back + (through - back) * Math.min(1, w * 1.7);
      p.root.rotation.z = (kind === "power" ? 0.16 : 0.06) * (1 - w);
      p.root.rotation.x = kind === "power" ? -0.22 * (1 - w) : -0.08 * (1 - w);
      p.armL.rotation.z = (kind === "power" ? -0.7 : -0.35) * (1 - w) - 0.4 * w;
      p.armR.rotation.z = (kind === "power" ? 0.5 : 0.25) * (1 - w) + 0.4 * w;
    }
    // pierna de apoyo semiflexionada
    p.legL.rotation.x = -0.22 - (kind === "power" ? 0.18 : 0.05);
    p.armL.rotation.x = -0.5;
    p.armR.rotation.x = 0.35;

    if (p.kickT === 0) {
      p.root.rotation.x = 0;
      p.root.rotation.z = 0;
    }
    return true;
  }

  function celebrate(p: Player, t: number) {
    celebration.play(p, t);
  }

  function resetPose(p: Player) {
    p.root.position.y = 0;
    p.root.rotation.x = 0;
    p.root.rotation.z = 0;
    p.armL.rotation.set(0, 0, 0);
    p.armR.rotation.set(0, 0, 0);
    p.legL.rotation.set(0, 0, 0);
    p.legR.rotation.set(0, 0, 0);
    p.kickT = 0;
  }

  function faceMove(p: Player, dt: number) {
    if (p.vel.lengthSq() > 0.0004) {
      const target = Math.atan2(p.vel.x, p.vel.z);
      let diff = target - p.root.rotation.y;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      p.root.rotation.y += diff * Math.min(1, dt * 10);
    }
  }

  function faceTo(p: Player, target: THREE.Vector3, dt: number) {
    const a = Math.atan2(target.x - p.root.position.x, target.z - p.root.position.z);
    let diff = a - p.root.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    p.root.rotation.y += diff * Math.min(1, dt * 12);
  }

  function kick(from: THREE.Vector3, dir: THREE.Vector3, power: number, lift = 0) {
    const d = dir.lengthSq() > 0.001 ? dir.clone().normalize() : new THREE.Vector3(1, 0, 0);
    d.y = 0;
    ballVel.copy(d).multiplyScalar(power);
    ballVel.y = lift;
    ball.position.x = from.x + d.x * (ballR + 0.5);
    ball.position.z = from.z + d.z * (ballR + 0.5);
  }

  function resetKickoff() {
    ball.position.set(0, ballR, 0);
    ballVel.set(0, 0, 0);
    for (const p of everyone) {
      p.root.position.copy(p.home);
      p.vel.set(0, 0, 0);
      p.cooldown = 0.4;
      resetPose(p);
      p.root.rotation.y = p.side > 0 ? 0 : Math.PI;
    }
  }

  // ---- Reloj / estado ----
  let minute = 0;
  let lastReported = -1;
  let finished = false;
  let celebrating = 0;
  let celebratingSide: "team" | "rival" | null = null;
  let dodgeTimer = 0;
  const dodgeDir = new THREE.Vector3();

  const clock = new THREE.Clock();
  let raf = 0;
  const camLook = new THREE.Vector3(0, 1, 0);

  function scoreGoal(side: "team" | "rival") {
    if (finished) return;
    opts.onScore(side);
    opts.onGoal?.(side);
    celebrating = CELEBRATION_TIME;
    celebratingSide = side;
    ballVel.set(0, 0, 0);
    burstConfetti(hero.root.position);
  }

  function frame() {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, clock.getDelta());
    const t = clock.elapsedTime;

    // hinchada: ambiente durante el juego y locura por sectores después de un gol
    for (let i = 0; i < fanCount; i++) {
      const ph = fanPhase[i]!;
      const supportedSide = fanSupport[i] === 1 ? "team" : "rival";
      const scoredForThem = celebratingSide === supportedSide;
      const cheer = celebrating > 0 ? (scoredForThem ? 1 : 0.16) : 0;
      const tempo = celebrating > 0 ? (scoredForThem ? 11 : 4) : 2.2;
      const hop = Math.max(0, Math.sin(t * tempo + ph)) * (0.05 + cheer * 1.15);
      poseFan(i, hop, cheer, t);
    }
    for (const part of crowdParts) part.instanceMatrix.needsUpdate = true;

    for (const flag of flags) {
      const backsScorer = celebratingSide === flag.support;
      const frenzy = celebrating > 0 ? (backsScorer ? 1 : 0.25) : 0;
      const speed = 2.5 + frenzy * 8;
      flag.root.rotation.z = Math.sin(t * speed + flag.phase) * (0.035 + frenzy * 0.14);
      flag.cloth.rotation.y = Math.sin(t * speed * 1.3 + flag.phase) * (0.12 + frenzy * 0.38);
      flag.cloth.rotation.z = Math.sin(t * speed + flag.phase) * (0.04 + frenzy * 0.12);
    }

    // confeti
    if (confetti.visible) {
      let alive = false;
      for (let i = 0; i < CONFETTI; i++) {
        confPos[i * 3] = confPos[i * 3]! + confVel[i * 3]! * dt;
        confPos[i * 3 + 1] = confPos[i * 3 + 1]! + confVel[i * 3 + 1]! * dt;
        confPos[i * 3 + 2] = confPos[i * 3 + 2]! + confVel[i * 3 + 2]! * dt;
        if (confPos[i * 3 + 1]! > 0.2) alive = true;
      }
      confGeo.attributes['position']!.needsUpdate = true;
      if (!alive || celebrating <= 0) confetti.visible = false;
    }

    // ---- Cinemática de gol ----
    if (celebrating > 0) {
      celebrating -= dt;
      celebrate(hero, t);
      animateLimbs(mate, 0, dt);
      const closeCam = new THREE.Vector3(
        hero.root.position.x + Math.sin(t * 0.5) * 3,
        3.4,
        hero.root.position.z + 6,
      );
      camera.position.lerp(closeCam, Math.min(1, dt * 4));
      camLook.lerp(new THREE.Vector3(hero.root.position.x, 1.6, hero.root.position.z), Math.min(1, dt * 5));
      camera.lookAt(camLook);
      marker.position.set(hero.root.position.x, 0.06, hero.root.position.z);
      renderer.render(scene, camera);
      if (celebrating <= 0) {
        celebratingSide = null;
        resetPose(hero);
        hero.root.rotation.y = 0;
        resetKickoff();
      }
      return;
    }

    // reloj: ~1s real = 3 minutos de partido
    if (!finished) {
      minute += dt * 3;
      if (Math.floor(minute) !== lastReported) {
        lastReported = Math.floor(minute);
        opts.onClock(Math.min(90, lastReported));
      }
      if (minute >= 90) {
        finished = true;
        opts.onEnd();
      }
    }

    // ---- héroe ----
    const dir = new THREE.Vector3();
    if (keys.has("arrowup") || keys.has("w")) dir.z -= 1;
    if (keys.has("arrowdown") || keys.has("s")) dir.z += 1;
    if (keys.has("arrowleft") || keys.has("a")) dir.x -= 1;
    if (keys.has("arrowright") || keys.has("d")) dir.x += 1;
    if (dir.lengthSq() > 0) dir.normalize();

    const turbo = keys.has("shift");
    const baseSpeed = turbo ? 13.5 : 9;

    // AMAGUE (Q): desplazamiento lateral rápido
    if (wantDodge) {
      wantDodge = false;
      const base = hero.vel.lengthSq() > 0.5 ? hero.vel.clone().normalize() : new THREE.Vector3(1, 0, 0);
      dodgeDir.set(-base.z, 0, base.x).multiplyScalar(Math.random() > 0.5 ? 1 : -1);
      dodgeTimer = 0.28;
    }
    if (dodgeTimer > 0) {
      dodgeTimer -= dt;
      hero.root.position.addScaledVector(dodgeDir, 20 * dt);
      hero.root.rotation.y += dt * 18;
    }

    hero.vel.lerp(dir.multiplyScalar(hero.kickT > 0 ? baseSpeed * 0.3 : baseSpeed), Math.min(1, dt * 8));
    hero.root.position.addScaledVector(hero.vel, dt);
    clamp(hero.root.position);
    if (dodgeTimer <= 0 && hero.kickT <= 0) faceMove(hero, dt);
    if (!animateKickPose(hero, dt)) animateLimbs(hero, hero.vel.length() / 9, dt);
    hero.cooldown = Math.max(0, hero.cooldown - dt);
    marker.position.set(hero.root.position.x, 0.06, hero.root.position.z);

    // estela de turbo
    trailTimer -= dt;
    if (turbo && hero.vel.lengthSq() > 4 && trailTimer <= 0) {
      trailTimer = 0.05;
      const m = trail[trailIdx]!;
      m.position.set(hero.root.position.x, 0.9, hero.root.position.z);
      m.visible = true;
      trailLife[trailIdx] = 0.45;
      trailIdx = (trailIdx + 1) % TRAIL;
    }
    for (let i = 0; i < TRAIL; i++) {
      if (trailLife[i]! > 0) {
        trailLife[i] = Math.max(0, trailLife[i]! - dt);
        const m = trail[i]!;
        const l = trailLife[i]!;
        (m.material as THREE.MeshBasicMaterial).opacity = l * 1.3;
        m.scale.setScalar(0.4 + l);
        if (l === 0) m.visible = false;
      }
    }

    // ---- IA por rol ----
    /** Objetivo táctico según rol: presiona la pelota o cubre su zona. */
    const aiTarget = (p: Player, out: THREE.Vector3) => {
      const attackX = p.side * FIELD_X;
      const ownX = -p.side * FIELD_X;
      const d = p.root.position.distanceTo(ball.position);
      if (p.role === "gk") {
        out.set(
          ownX + p.side * 1.2,
          0,
          THREE.MathUtils.clamp(ball.position.z * 0.55, -GOAL_HALF, GOAL_HALF),
        );
        // sale a cortar si la pelota entra al área
        if (Math.abs(ball.position.x - ownX) < 5 && Math.abs(ball.position.z) < GOAL_HALF + 1.5) {
          out.copy(ball.position);
        }
        return;
      }
      const ballInOwnHalf = (ball.position.x - 0) * p.side < 0;
      const pressing = d < 7 || (p.role === "def" && ballInOwnHalf) || (p.role !== "def" && !ballInOwnHalf);
      if (pressing) {
        out.copy(ball.position);
        // se anticipa a la trayectoria del balón
        out.addScaledVector(ballVel, 0.18);
      } else {
        out.set(
          THREE.MathUtils.lerp(p.home.x, ball.position.x * 0.6, p.role === "fwd" ? 0.75 : 0.4),
          0,
          THREE.MathUtils.lerp(p.home.z, ball.position.z, 0.35),
        );
      }
      // los delanteros abren la cancha buscando espacio
      if (p.role === "fwd" && !pressing) out.x += p.side * 3;
      out.x = THREE.MathUtils.clamp(out.x, -FIELD_X + 1, FIELD_X - 1);
      void attackX;
    };

    const SPEED: Record<Role, number> = { gk: 5.5, def: 6.4, mid: 7, fwd: 7.4 };
    const aiTmp = new THREE.Vector3();

    /** Mueve, anima y resuelve el toque de un jugador controlado por la IA. */
    const runAI = (p: Player) => {
      p.cooldown = Math.max(0, p.cooldown - dt);
      if (animateKickPose(p, dt)) {
        p.vel.multiplyScalar(1 - Math.min(1, dt * 6));
        p.root.position.addScaledVector(p.vel, dt);
        return;
      }
      aiTarget(p, aiTmp);
      const toTarget = aiTmp.sub(p.root.position);
      toTarget.y = 0;
      const dist = toTarget.length();
      const speed = dist < 0.6 ? 0 : SPEED[p.role];
      if (dist > 0.001) toTarget.divideScalar(dist);
      p.vel.lerp(toTarget.multiplyScalar(speed), Math.min(1, dt * 4));
      p.root.position.addScaledVector(p.vel, dt);
      clamp(p.root.position);
      faceMove(p, dt);
      animateLimbs(p, p.vel.length() / 9, dt);

      const dBall = p.root.position.distanceTo(ball.position);
      if (dBall < ballR + 0.9 && p.cooldown <= 0) {
        const goalX = p.side * FIELD_X;
        const close = Math.abs(goalX - ball.position.x) < 9;
        const teammates = (p.side > 0 ? teamMates : rivals).filter((q) => q !== p && q.role !== "gk");
        if (p.role === "gk") {
          // despeje del arquero
          const aim = new THREE.Vector3(p.side * 8, 0, (Math.random() - 0.5) * 10);
          startKick(p, "power");
          faceTo(p, ball.position, 1);
          kick(p.root.position, aim, 24, 2);
        } else if (close && p.role !== "def") {
          const aim = new THREE.Vector3(goalX - ball.position.x, 0, -ball.position.z * 0.5);
          startKick(p, Math.random() > 0.5 ? "power" : "finesse");
          faceTo(p, ball.position, 1);
          kick(p.root.position, aim, 22 + Math.random() * 6, 1.4);
          if (p.side < 0) opts.onEvent?.("danger");
        } else {
          const mateT = teammates.sort(
            (a, b) => (b.root.position.x - a.root.position.x) * p.side,
          )[0];
          const aim = mateT
            ? new THREE.Vector3().subVectors(mateT.root.position, ball.position)
            : new THREE.Vector3(goalX - ball.position.x, 0, 0);
          startKick(p, "pass");
          faceTo(p, ball.position, 1);
          kick(p.root.position, aim, Math.min(20, 9 + aim.length() * 0.7));
        }
      }
    };

    const remote = opts.net?.latest() ?? null;
    for (const p of teamMates) runAI(p);
    for (const p of rivals) {
      if (remote && p === rival1) {
        // El rival principal lo controla el otro jugador (eje espejado)
        p.root.position.set(-remote.hx, 0, -remote.hz);
        p.root.rotation.y = Math.PI;
        animateLimbs(p, 0.7, dt);
        continue;
      }
      runAI(p);
    }


    // ---- acciones sobre la pelota ----
    const hb = new THREE.Vector3().subVectors(ball.position, hero.root.position);
    hb.y = 0;
    const ballDist = hb.length();
    const nearBall = ballDist < 2.6;

    // TIRO POTENTE (E)
    if (wantPower) {
      wantPower = false;
      if (nearBall && hero.kickT <= 0) {
        startKick(hero, "power");
        faceTo(hero, new THREE.Vector3(FIELD_X, 0, ball.position.z * 0.4), 1);
        const aim = new THREE.Vector3(FIELD_X - ball.position.x, 0, -ball.position.z * 0.45);
        kick(hero.root.position, aim, 30, 2.2);
        opts.onEvent?.("shot");
      }
    }

    // TIRO COLOCADO (F cerca de la pelota): más lento, busca el palo lejano
    if (wantFinesse) {
      wantFinesse = false;
      if (nearBall && hero.kickT <= 0) {
        startKick(hero, "finesse");
        const post = ball.position.z >= 0 ? -GOAL_HALF * 0.7 : GOAL_HALF * 0.7;
        const aim = new THREE.Vector3(FIELD_X - ball.position.x, 0, post - ball.position.z);
        kick(hero.root.position, aim, 20, 1.1);
        opts.onEvent?.("shot");
      }
    }

    // PASE (Espacio): al compañero mejor ubicado
    if (wantPass) {
      wantPass = false;
      if (nearBall && hero.kickT <= 0) {
        const target = [mate, mate2, back].reduce((best, p) => {
          const scoreOf = (q: Player) =>
            q.root.position.x - q.root.position.distanceTo(hero.root.position) * 0.35;
          return scoreOf(p) > scoreOf(best) ? p : best;
        }, mate);
        startKick(hero, "pass");
        const aim = new THREE.Vector3().subVectors(target.root.position, ball.position);
        kick(hero.root.position, aim, Math.min(22, 8 + aim.length() * 0.8));
      }
    }

    // conducción simple
    if (hero.kickT <= 0 && ballDist < ballR + 0.85 && ballVel.length() < 20) {
      const heroSpeed = hero.vel.length();
      const kickDir = heroSpeed > 0.4 ? hero.vel.clone() : hb;
      kick(hero.root.position, kickDir, Math.max(6, heroSpeed * 2.2));
    }

    // ---- pelota ----
    ball.position.addScaledVector(ballVel, dt);
    if (ballVel.lengthSq() > 0.0001) {
      const axis = new THREE.Vector3(-ballVel.z, 0, ballVel.x).normalize();
      ball.rotateOnWorldAxis(axis, (ballVel.length() * dt) / ballR);
    }
    ballVel.multiplyScalar(1 - Math.min(0.9, dt * 1.6));
    ball.position.y = ballR;
    if (Math.abs(ball.position.z) > FIELD_Z) {
      ball.position.z = Math.sign(ball.position.z) * FIELD_Z;
      ballVel.z *= -0.6;
    }
    // trigger de gol
    if (Math.abs(ball.position.x) > FIELD_X) {
      if (Math.abs(ball.position.z) < GOAL_HALF) {
        scoreGoal(ball.position.x > 0 ? "team" : "rival");
        if (celebrating <= 0) resetKickoff();
      } else {
        if (Math.abs(ball.position.z) < GOAL_HALF + 2) opts.onEvent?.("nearmiss");
        ball.position.x = Math.sign(ball.position.x) * FIELD_X;
        ballVel.x *= -0.6;
      }
    }

    // ---- ataque peligroso (relato) ----
    if (ball.position.x > FIELD_X - 7 && ballVel.x > 4) opts.onEvent?.("danger");

    // ---- sincronización de red ----
    if (opts.net) {
      opts.net.send({
        hx: hero.root.position.x,
        hz: hero.root.position.z,
        bx: ball.position.x,
        bz: ball.position.z,
      });
      if (!opts.net.isHost && remote) {
        ball.position.x += (-remote.bx - ball.position.x) * Math.min(1, dt * 8);
        ball.position.z += (-remote.bz - ball.position.z) * Math.min(1, dt * 8);
      }
    }


    // ---- cámara sigue al héroe ----
    const camTarget = new THREE.Vector3(
      hero.root.position.x * 0.6,
      14,
      hero.root.position.z * 0.6 + 21,
    );
    camera.position.lerp(camTarget, Math.min(1, dt * 2.5));
    camLook.lerp(
      new THREE.Vector3(hero.root.position.x * 0.5, 1, hero.root.position.z * 0.5),
      Math.min(1, dt * 4),
    );
    camera.lookAt(camLook);

    clouds.children.forEach((c, i) => {
      c.position.x += dt * (1 + (i % 3) * 0.4);
      if (c.position.x > 40) c.position.x = -40;
    });

    renderer.render(scene, camera);
  }

  camera.position.set(0, 14, 21);
  opts.onEvent?.("kickoff");
  frame();


  function resize() {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);

  function dispose() {
    cancelAnimationFrame(raf);
    observer.disconnect();
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    renderer.dispose();
  }

  return { dispose };
}
