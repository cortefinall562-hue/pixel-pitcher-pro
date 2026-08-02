import * as THREE from "three";

export interface MatchOptions {
  teamShirt: number;
  teamShorts: number;
  rivalShirt: number;
  rivalShorts: number;
  onScore: (side: "team" | "rival") => void;
  onGoal?: (side: "team" | "rival") => void;
  onClock: (minute: number) => void;
  onEnd: () => void;
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

interface Player {
  root: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  vel: THREE.Vector3;
  phase: number;
}

function createPlayer(shirt: number, shorts: number): Player {
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

  return { root, legL, legR, armL, armR, vel: new THREE.Vector3(), phase: Math.random() * 6 };
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
  const seatRows: { x: number; z: number; y: number }[] = [];

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
        seatRows.push({ x: px, z: pz, y: y + 0.45 });
      }
    }
  }
  buildStand("x", -1);
  buildStand("x", 1);
  buildStand("z", -1);
  buildStand("z", 1);

  // ---- Hinchada (InstancedMesh optimizado) ----
  const FAN_COLORS = [
    0xff4d4d, 0xffd93d, 0x4dd2ff, 0xffffff, 0x8affc1, 0xff8ae0, 0xffa64d, 0x9b8aff,
  ];
  const fanCount = seatRows.length;
  const crowd = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.55, 0.75, 0.55),
    new THREE.MeshLambertMaterial(),
    fanCount,
  );
  crowd.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const fanPhase = new Float32Array(fanCount);
  const fanBase = new Float32Array(fanCount * 3);
  const tmpMat = new THREE.Matrix4();
  const tmpColor = new THREE.Color();
  for (let i = 0; i < fanCount; i++) {
    const s = seatRows[i]!;
    fanBase[i * 3] = s.x;
    fanBase[i * 3 + 1] = s.y;
    fanBase[i * 3 + 2] = s.z;
    fanPhase[i] = Math.random() * Math.PI * 2;
    tmpMat.makeTranslation(s.x, s.y, s.z);
    crowd.setMatrixAt(i, tmpMat);
    crowd.setColorAt(i, tmpColor.setHex(FAN_COLORS[i % FAN_COLORS.length]!));
  }
  crowd.instanceMatrix.needsUpdate = true;
  if (crowd.instanceColor) crowd.instanceColor.needsUpdate = true;
  scene.add(crowd);

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

  // ---- Jugadores ----
  const hero = createPlayer(opts.teamShirt, opts.teamShorts);
  hero.root.position.set(-4, 0, 2);
  const mate = createPlayer(opts.teamShirt, opts.teamShorts);
  mate.root.position.set(-9, 0, -5);
  const rival1 = createPlayer(opts.rivalShirt, opts.rivalShorts);
  rival1.root.position.set(5, 0, -3);
  const rival2 = createPlayer(opts.rivalShirt, opts.rivalShorts);
  rival2.root.position.set(9, 0, 4);
  for (const p of [hero, mate, rival1, rival2]) scene.add(p.root);

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
      tmpColor.setHex(FAN_COLORS[i % FAN_COLORS.length]!);
      confCol[i * 3] = tmpColor.r;
      confCol[i * 3 + 1] = tmpColor.g;
      confCol[i * 3 + 2] = tmpColor.b;
    }
    confGeo.attributes['position']!.needsUpdate = true;
    confGeo.attributes['color']!.needsUpdate = true;
    confetti.visible = true;
  }

  // ---- Controles ----
  const keys = new Set<string>();
  const MOVE_KEYS = ["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"];
  const ACTION_KEYS = ["e", "f", "q", " "];
  let wantShoot = false;
  let wantPass = false;
  let wantDodge = false;

  const onKeyDown = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (MOVE_KEYS.includes(k) || ACTION_KEYS.includes(k)) e.preventDefault();
    if (e.repeat) {
      if (MOVE_KEYS.includes(k) || k === "f") keys.add(k);
      return;
    }
    if (MOVE_KEYS.includes(k) || ACTION_KEYS.includes(k)) keys.add(k);
    if (k === "e") wantShoot = true;
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
    p.phase += dt * (2.5 + speed * 4);
    const amp = Math.min(0.9, 0.12 + speed * 0.85);
    const s = Math.sin(p.phase * 2);
    p.legL.rotation.x = s * amp;
    p.legR.rotation.x = -s * amp;
    p.armL.rotation.x = -s * amp * 0.8;
    p.armR.rotation.x = s * amp * 0.8;
  }

  function celebrate(p: Player, t: number) {
    p.root.position.y = Math.abs(Math.sin(t * 7)) * 0.9;
    p.root.rotation.y += 0.09;
    p.armL.rotation.x = 0;
    p.armR.rotation.x = 0;
    p.armL.rotation.z = 2.5;
    p.armR.rotation.z = -2.5;
    p.legL.rotation.x = 0.3;
    p.legR.rotation.x = -0.3;
  }

  function resetPose(p: Player) {
    p.root.position.y = 0;
    p.armL.rotation.z = 0;
    p.armR.rotation.z = 0;
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

  function kick(from: THREE.Vector3, dir: THREE.Vector3, power: number) {
    const d = dir.lengthSq() > 0.001 ? dir.clone().normalize() : new THREE.Vector3(1, 0, 0);
    d.y = 0;
    ballVel.copy(d).multiplyScalar(power);
    ball.position.x = from.x + d.x * (ballR + 0.45);
    ball.position.z = from.z + d.z * (ballR + 0.45);
  }

  function resetKickoff() {
    ball.position.set(0, ballR, 0);
    ballVel.set(0, 0, 0);
    hero.root.position.set(-4, 0, 2);
    mate.root.position.set(-9, 0, -5);
    rival1.root.position.set(5, 0, -3);
    rival2.root.position.set(9, 0, 4);
    for (const p of [hero, mate, rival1, rival2]) {
      p.vel.set(0, 0, 0);
      resetPose(p);
    }
  }

  // ---- Reloj / estado ----
  let minute = 0;
  let lastReported = -1;
  let finished = false;
  let celebrating = 0;
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
    ballVel.set(0, 0, 0);
    burstConfetti(hero.root.position);
  }

  function frame() {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, clock.getDelta());
    const t = clock.elapsedTime;

    // hinchada saltando
    for (let i = 0; i < fanCount; i++) {
      const ph = fanPhase[i]!;
      const hop = Math.max(0, Math.sin(t * 3 + ph)) * (celebrating > 0 ? 0.75 : 0.35);
      tmpMat.makeTranslation(fanBase[i * 3]!, fanBase[i * 3 + 1]! + hop, fanBase[i * 3 + 2]!);
      crowd.setMatrixAt(i, tmpMat);
    }
    crowd.instanceMatrix.needsUpdate = true;

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

    const turbo = keys.has("f");
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

    hero.vel.lerp(dir.multiplyScalar(baseSpeed), Math.min(1, dt * 8));
    hero.root.position.addScaledVector(hero.vel, dt);
    clamp(hero.root.position);
    if (dodgeTimer <= 0) faceMove(hero, dt);
    animateLimbs(hero, hero.vel.length() / 9, dt);
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

    // ---- IA ----
    const chase = (p: Player, speed: number, goalX: number) => {
      const toBall = new THREE.Vector3().subVectors(ball.position, p.root.position);
      toBall.y = 0;
      const d = toBall.length();
      if (d > 0.1) toBall.divideScalar(d);
      p.vel.lerp(toBall.multiplyScalar(speed), Math.min(1, dt * 3));
      p.root.position.addScaledVector(p.vel, dt);
      clamp(p.root.position);
      faceMove(p, dt);
      animateLimbs(p, p.vel.length() / 9, dt);
      if (d < ballR + 0.7) {
        const aim = new THREE.Vector3(goalX - ball.position.x, 0, -ball.position.z * 0.35);
        kick(p.root.position, aim, 9);
      }
    };
    chase(rival1, 4.4, -FIELD_X);
    chase(rival2, 3.6, -FIELD_X);
    chase(mate, 3.4, FIELD_X);

    // ---- acciones sobre la pelota ----
    const hb = new THREE.Vector3().subVectors(ball.position, hero.root.position);
    hb.y = 0;
    const ballDist = hb.length();
    const nearBall = ballDist < 2.6;

    if (wantShoot) {
      wantShoot = false;
      if (nearBall) {
        const aim = new THREE.Vector3(FIELD_X - ball.position.x, 0, -ball.position.z * 0.5);
        kick(hero.root.position, aim, 26);
      }
    }
    if (wantPass) {
      wantPass = false;
      if (nearBall) {
        const aim = new THREE.Vector3().subVectors(mate.root.position, ball.position);
        kick(hero.root.position, aim, 14);
      }
    }

    // conducción simple
    if (ballDist < ballR + 0.75 && ballVel.length() < 20) {
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
        ball.position.x = Math.sign(ball.position.x) * FIELD_X;
        ballVel.x *= -0.6;
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
