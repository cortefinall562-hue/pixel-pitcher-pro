import * as THREE from "three";
import type { PackTier, PlayerCard } from "@/game/packs";

export type PackPhase = "tunnel" | "walkout" | "card";

export interface PackSceneOptions {
  tier: PackTier;
  card: PlayerCard;
  shirt: number;
  shorts: number;
  onPhase: (phase: PackPhase) => void;
  onDone: () => void;
}

const SKIN = 0xf0b98a;

function mat(color: number) {
  return new THREE.MeshLambertMaterial({ color });
}

function box(w: number, h: number, d: number, color: number) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
}

function cyl(r: number, h: number, color: number) {
  return new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 8), mat(color));
}

function glow(color: number) {
  return new THREE.MeshBasicMaterial({ color });
}

// ---------- Texturas dibujadas en canvas 2D ----------
function texture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  draw(ctx);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function flagTexture(card: PlayerCard) {
  return texture(512, 320, (ctx) => {
    const [a, b, c] = card.nationality.colors;
    const bands = [a, b, c];
    bands.forEach((col, i) => {
      ctx.fillStyle = col;
      ctx.fillRect((i * 512) / 3, 0, 512 / 3 + 1, 250);
    });
    ctx.fillStyle = "#06101f";
    ctx.fillRect(0, 250, 512, 70);
    ctx.fillStyle = "#ffd76a";
    ctx.font = "bold 44px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(card.nationality.name.toUpperCase(), 256, 302);
  });
}

function posTexture(card: PlayerCard) {
  return texture(512, 320, (ctx) => {
    ctx.fillStyle = "#06101f";
    ctx.fillRect(0, 0, 512, 320);
    ctx.strokeStyle = "#4bc8ff";
    ctx.lineWidth = 10;
    ctx.strokeRect(14, 14, 484, 292);
    ctx.fillStyle = "#4bc8ff";
    ctx.font = "bold 34px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("POSICIÓN", 256, 96);
    ctx.fillStyle = "#ffd76a";
    ctx.font = "bold 150px sans-serif";
    ctx.fillText(card.pos, 256, 236);
  });
}

function crestTexture(card: PlayerCard) {
  return texture(512, 320, (ctx) => {
    ctx.fillStyle = "#06101f";
    ctx.fillRect(0, 0, 512, 320);
    ctx.fillStyle = card.crest[0];
    ctx.beginPath();
    ctx.moveTo(150, 40);
    ctx.lineTo(362, 40);
    ctx.lineTo(362, 200);
    ctx.lineTo(256, 250);
    ctx.lineTo(150, 200);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = card.crest[1];
    ctx.beginPath();
    ctx.moveTo(256, 40);
    ctx.lineTo(362, 40);
    ctx.lineTo(362, 200);
    ctx.lineTo(256, 250);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(card.clubName.toUpperCase(), 256, 300);
  });
}

function cardTexture(card: PlayerCard) {
  const gold = card.tier === "gold";
  const silver = card.tier === "silver";
  return texture(640, 900, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 640, 900);
    if (gold) {
      g.addColorStop(0, "#0b2a5b");
      g.addColorStop(0.45, "#123f86");
      g.addColorStop(0.5, "#f6cf5c");
      g.addColorStop(1, "#8d6108");
    } else if (silver) {
      g.addColorStop(0, "#2b3440");
      g.addColorStop(1, "#c9d3dd");
    } else {
      g.addColorStop(0, "#3b2412");
      g.addColorStop(1, "#b46a2b");
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 640, 900);

    ctx.strokeStyle = gold ? "#ffe9a3" : "#ffffff";
    ctx.lineWidth = 12;
    ctx.strokeRect(20, 20, 600, 860);

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 150px sans-serif";
    ctx.fillText(String(card.ovr), 160, 200);
    ctx.font = "bold 60px sans-serif";
    ctx.fillText(card.pos, 160, 270);

    if (gold) {
      ctx.fillStyle = "#ffe9a3";
      ctx.font = "bold 34px sans-serif";
      ctx.fillText("TOTY", 490, 130);
    }

    // silueta del jugador
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.beginPath();
    ctx.arc(430, 300, 70, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(360, 370, 140, 180);

    ctx.fillStyle = "#0c1626";
    ctx.fillRect(60, 580, 520, 90);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 46px sans-serif";
    ctx.fillText(card.name.toUpperCase(), 320, 642);

    ctx.font = "bold 34px sans-serif";
    card.stats.forEach((s, i) => {
      const x = 140 + (i % 3) * 190;
      const y = 730 + Math.floor(i / 3) * 70;
      ctx.fillStyle = "#0c1626";
      ctx.fillRect(x - 80, y - 40, 160, 54);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`${s.label} ${s.value}`, x, y);
    });
  });
}

// ---------- Modelo low-poly del jugador ----------
function createStar(shirt: number, shorts: number) {
  const root = new THREE.Group();
  const torso = box(0.8, 0.85, 0.45, shirt);
  torso.position.y = 1.25;
  const head = box(0.68, 0.64, 0.62, SKIN);
  head.position.y = 1.98;
  const hair = box(0.7, 0.16, 0.64, 0x2a2124);
  hair.position.y = 2.29;
  const eyeL = box(0.1, 0.11, 0.05, 0x2b2b33);
  eyeL.position.set(-0.15, 2.02, 0.32);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.15;
  root.add(torso, head, hair, eyeL, eyeR);

  const limb = (side: number, isArm: boolean) => {
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
  };

  const armL = limb(-1, true);
  const armR = limb(1, true);
  const legL = limb(-1, false);
  const legR = limb(1, false);
  root.add(armL, armR, legL, legR);
  return { root, armL, armR, legL, legR, torso };
}

// ---------- Sistema de partículas ----------
function particles(count: number, size: number, colors: number[]) {
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const vel: THREE.Vector3[] = [];
  const c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    c.set(colors[i % colors.length]!);
    col[i * 3] = c.r;
    col[i * 3 + 1] = c.g;
    col[i * 3 + 2] = c.b;
    vel.push(new THREE.Vector3());
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const points = new THREE.Points(
    geo,
    new THREE.PointsMaterial({ size, vertexColors: true, transparent: true, opacity: 0.95 }),
  );
  points.frustumCulled = false;
  return { points, pos, vel, count };
}

interface Timeline {
  tunnelEnd: number;
  walkoutEnd: number;
  cardEnd: number;
  cues: number[];
}

function timelineFor(tier: PackTier): Timeline {
  if (tier === "gold") return { tunnelEnd: 3, walkoutEnd: 6, cardEnd: 8, cues: [0.6, 1.5, 2.3] };
  if (tier === "silver") return { tunnelEnd: 1.6, walkoutEnd: 3, cardEnd: 4.6, cues: [0.25, 0.9] };
  return { tunnelEnd: 0, walkoutEnd: 0, cardEnd: 2.6, cues: [] };
}

export function createPackScene(canvas: HTMLCanvasElement, opts: PackSceneOptions) {
  const { tier, card } = opts;
  const tl = timelineFor(tier);
  const gold = tier === "gold";

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(gold ? 0x03060f : tier === "silver" ? 0x0a1220 : 0x0d1018);
  scene.fog = new THREE.Fog(scene.background.getHex(), 40, 120);

  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 300);
  scene.add(new THREE.HemisphereLight(0xbfd8ff, 0x101828, 0.9));
  const key = new THREE.DirectionalLight(0xfff0c8, 1.1);
  key.position.set(6, 16, 12);
  scene.add(key);
  const neonA = new THREE.PointLight(0xffc93c, 2.2, 30);
  const neonB = new THREE.PointLight(0x3fa9ff, 2.2, 30);
  scene.add(neonA, neonB);

  // ---- Suelo / cancha ----
  const groundGroup = new THREE.Group();
  scene.add(groundGroup);
  for (let i = 0; i < 14; i++) {
    const stripe = box(6, 0.4, 90, i % 2 === 0 ? 0x2f8f45 : 0x2a8040);
    stripe.position.set(-42 + i * 6 + 3, -0.2, 0);
    groundGroup.add(stripe);
  }
  const midLine = box(84, 0.06, 0.3, 0xffffff);
  midLine.position.y = 0.03;
  groundGroup.add(midLine);
  const circle = new THREE.Mesh(new THREE.TorusGeometry(5, 0.12, 6, 40), mat(0xffffff));
  circle.rotation.x = Math.PI / 2;
  circle.position.y = 0.03;
  groundGroup.add(circle);

  // ---- Túnel con paneles neón ----
  const tunnel = new THREE.Group();
  tunnel.visible = tier !== "bronze";
  scene.add(tunnel);
  if (tier !== "bronze") {
    for (const s of [-1, 1]) {
      const wall = box(0.6, 6, 26, 0x0a1424);
      wall.position.set(s * 3.6, 3, -16);
      tunnel.add(wall);
      for (let i = 0; i < 8; i++) {
        const panel = new THREE.Mesh(
          new THREE.BoxGeometry(0.14, 3.4, 1.6),
          glow(i % 2 === 0 ? 0xffc93c : 0x3fa9ff),
        );
        panel.position.set(s * 3.25, 3.1, -27 + i * 3.2);
        tunnel.add(panel);
      }
    }
    const roof = box(8, 0.6, 26, 0x081120);
    roof.position.set(0, 6, -16);
    const floor = box(7.4, 0.4, 26, 0x121a2a);
    floor.position.set(0, 0.05, -16);
    tunnel.add(roof, floor);
  }

  // ---- Pantallas holográficas ----
  const holoTextures = [flagTexture(card), posTexture(card), crestTexture(card)];
  const holos: THREE.Mesh[] = [];
  const holoZ = gold ? [-18, -13, -9.5] : [-16, -11];
  holoZ.forEach((z, i) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(4.4, 2.75),
      new THREE.MeshBasicMaterial({
        map: holoTextures[i]!,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      }),
    );
    m.position.set(0, 3, z);
    m.visible = tier !== "bronze";
    scene.add(m);
    holos.push(m);
  });

  // ---- Gradas e hinchada ----
  const crowdCount = 340;
  const crowd = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.55, 0.7, 0.55),
    mat(0xffffff),
    crowdCount,
  );
  const seedY: number[] = [];
  const baseM = new THREE.Matrix4();
  const colorObj = new THREE.Color();
  let idx = 0;
  const crowdBase: THREE.Vector3[] = [];
  for (const s of [-1, 1]) {
    const stand = box(70, 8, 12, 0x161d2b);
    stand.position.set(0, 3.6, s * 24);
    scene.add(stand);
    for (let row = 0; row < 5 && idx < crowdCount; row++) {
      for (let i = 0; i < 34 && idx < crowdCount; i++) {
        const p = new THREE.Vector3(-33 + i * 2, 7.6 + row * 0.9, s * (19 + row * 1.1));
        crowdBase.push(p);
        seedY.push(Math.random() * 6);
        baseM.makeTranslation(p.x, p.y, p.z);
        crowd.setMatrixAt(idx, baseM);
        crowd.setColorAt(idx, colorObj.setHSL(Math.random(), 0.7, 0.55));
        idx++;
      }
    }
  }
  crowd.instanceMatrix.needsUpdate = true;
  scene.add(crowd);

  // ---- Jugador estrella ----
  const star = createStar(opts.shirt, opts.shorts);
  star.root.position.set(0, 0, tier === "bronze" ? 0 : -6);
  star.root.visible = tier !== "bronze";
  scene.add(star.root);

  // ---- Carta 3D ----
  const cardTex = cardTexture(card);
  const cardMesh = new THREE.Mesh(new THREE.BoxGeometry(3.2, 4.5, 0.16), [
    mat(gold ? 0xf5c53d : 0x8b97a5),
    mat(gold ? 0xf5c53d : 0x8b97a5),
    mat(gold ? 0xffe9a3 : 0xc9d3dd),
    mat(gold ? 0xffe9a3 : 0xc9d3dd),
    new THREE.MeshBasicMaterial({ map: cardTex }),
    mat(gold ? 0x123f86 : 0x2b3440),
  ]);
  cardMesh.position.set(0, 14, 3);
  cardMesh.visible = false;
  scene.add(cardMesh);

  const halo = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 11),
    new THREE.MeshBasicMaterial({
      color: gold ? 0xffd76a : 0x9fd8ff,
      transparent: true,
      opacity: 0.14,
    }),
  );
  halo.visible = false;
  scene.add(halo);

  // ---- Partículas: humo, fuegos y confeti ----
  const smoke = particles(180, 0.8, gold ? [0x9b5cff, 0xffc93c] : [0xdfe7f2, 0xa9c4e0]);
  const smokeLife: number[] = new Array(smoke.count).fill(0);
  scene.add(smoke.points);
  const fire = particles(220, 0.55, [0xffd76a, 0xff7a3d, 0x3fa9ff]);
  const fireLife: number[] = new Array(fire.count).fill(0);
  scene.add(fire.points);
  const confetti = particles(300, 0.4, [0xffd76a, 0x3fa9ff, 0xff5fa2, 0x7cf58d]);
  scene.add(confetti.points);
  confetti.points.visible = false;
  for (let i = 0; i < confetti.count; i++) {
    confetti.pos[i * 3] = (Math.random() - 0.5) * 22;
    confetti.pos[i * 3 + 1] = 8 + Math.random() * 14;
    confetti.pos[i * 3 + 2] = 2 + (Math.random() - 0.5) * 10;
    confetti.vel[i]!.set((Math.random() - 0.5) * 1.2, -2 - Math.random() * 3, (Math.random() - 0.5) * 1.2);
  }

  const spawnSmoke = (x: number) => {
    for (let n = 0; n < 12; n++) {
      const i = Math.floor(Math.random() * smoke.count);
      smoke.pos[i * 3] = x + (Math.random() - 0.5) * 1.4;
      smoke.pos[i * 3 + 1] = 0.4;
      smoke.pos[i * 3 + 2] = -2 + (Math.random() - 0.5) * 4;
      smoke.vel[i]!.set((Math.random() - 0.5) * 0.6, 1.5 + Math.random() * 1.5, (Math.random() - 0.5) * 0.6);
      smokeLife[i] = 2.4;
    }
  };
  const spawnFire = (x: number, y: number, z: number, power: number) => {
    for (let n = 0; n < 26; n++) {
      const i = Math.floor(Math.random() * fire.count);
      fire.pos[i * 3] = x;
      fire.pos[i * 3 + 1] = y;
      fire.pos[i * 3 + 2] = z;
      fire.vel[i]!.set(
        (Math.random() - 0.5) * power,
        Math.random() * power,
        (Math.random() - 0.5) * power,
      );
      fireLife[i] = 1.4;
    }
  };

  // ---- Bucle ----
  let t = 0;
  let phase: PackPhase = tier === "bronze" ? "card" : "tunnel";
  opts.onPhase(phase);
  let doneFired = false;
  let nextFirework = 0;
  let raf = 0;
  const clock = new THREE.Clock();
  const startedAt = performance.now();
  let lastLogged = -1;

  const setPhase = (p: PackPhase) => {
    if (phase !== p) {
      phase = p;
      opts.onPhase(p);
    }
  };

  const resize = () => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  const lookTarget = new THREE.Vector3();

  const frame = () => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    t = (performance.now() - startedAt) / 1000;
    if (Math.floor(t) !== lastLogged) {
      lastLogged = Math.floor(t);
      console.log("[pack] t", lastLogged, phase);
    }

    // hinchada saltando
    for (let i = 0; i < crowdBase.length; i++) {
      const p = crowdBase[i]!;
      const jump = Math.max(0, Math.sin(t * 6 + seedY[i]!)) * 0.5;
      baseM.makeTranslation(p.x, p.y + jump, p.z);
      crowd.setMatrixAt(i, baseM);
    }
    crowd.instanceMatrix.needsUpdate = true;

    neonA.position.set(-3, 4, -20 + Math.sin(t * 2) * 6);
    neonB.position.set(3, 4, -14 + Math.cos(t * 2) * 6);

    // ------- FASE 1: túnel -------
    if (t < tl.tunnelEnd) {
      setPhase("tunnel");
      const k = t / tl.tunnelEnd;
      camera.position.set(Math.sin(t * 1.4) * 0.4, 2.6, -26 + k * 18);
      lookTarget.set(0, 3, camera.position.z + 10);
      camera.lookAt(lookTarget);
      holos.forEach((h, i) => {
        const cue = tl.cues[i];
        const m = h.material as THREE.MeshBasicMaterial;
        if (cue !== undefined && t > cue) {
          m.opacity = Math.min(1, m.opacity + dt * 3);
          h.position.y = 3 + Math.sin(t * 3 + i) * 0.12;
        }
        h.lookAt(camera.position);
      });
    }
    // ------- FASE 2: walkout -------
    else if (t < tl.walkoutEnd) {
      setPhase("walkout");
      const k = (t - tl.tunnelEnd) / (tl.walkoutEnd - tl.tunnelEnd);
      camera.position.set(0, 2.8 + k * 1.4, -8 + k * 17);
      star.root.position.z = -6 + k * 6;
      star.root.rotation.y = Math.PI;
      const swing = Math.sin(t * 9) * 0.7;
      star.legL.rotation.x = swing;
      star.legR.rotation.x = -swing;
      star.armL.rotation.x = -swing * 0.7;
      star.armR.rotation.x = swing * 0.7;
      if (k > 0.7) {
        // festejo
        const c = (k - 0.7) / 0.3;
        star.armL.rotation.x = -2.2 * c;
        star.armR.rotation.x = -2.2 * c;
        star.legL.rotation.x = 0;
        star.legR.rotation.x = 0;
        star.root.position.y = Math.abs(Math.sin(t * 8)) * 0.35 * c;
      }
      lookTarget.copy(star.root.position).add(new THREE.Vector3(0, 1.6, 0));
      camera.lookAt(lookTarget);
      if (Math.random() < dt * 8) spawnSmoke((Math.random() - 0.5) * 16);
      if (t > nextFirework) {
        nextFirework = t + 0.35;
        spawnFire((Math.random() - 0.5) * 30, 8 + Math.random() * 6, -12, 8);
      }
    }
    // ------- FASE 3: carta -------
    else {
      setPhase("card");
      const span = tl.cardEnd - tl.walkoutEnd;
      const k = Math.min(1, (t - tl.walkoutEnd) / span);
      cardMesh.visible = true;
      halo.visible = true;
      confetti.points.visible = true;
      camera.position.set(0, 3.6, 16);
      cardMesh.position.set(0, 14 - 10.6 * Math.min(1, k * 1.25), 3);
      cardMesh.rotation.y = Math.sin(t * 1.6) * 0.35;
      cardMesh.rotation.z = Math.sin(t * 1.1) * 0.05;
      halo.position.copy(cardMesh.position).setZ(cardMesh.position.z - 0.4);
      (halo.material as THREE.MeshBasicMaterial).opacity = 0.1 + Math.abs(Math.sin(t * 3)) * 0.14;
      star.root.rotation.y = Math.PI;
      camera.lookAt(cardMesh.position);
      if (t > nextFirework) {
        nextFirework = t + (gold ? 0.3 : 0.55);
        const side = Math.random() < 0.5 ? -1 : 1;
        spawnFire(side * 5, 1, 2, gold ? 7 : 4);
      }
      if (k >= 1 && !doneFired) {
        doneFired = true;
        console.log("[pack] done", t, k);
        opts.onDone();
      }
    }

    // partículas
    for (let i = 0; i < smoke.count; i++) {
      if (smokeLife[i]! <= 0) continue;
      smokeLife[i]! -= dt;
      const sv = smoke.vel[i]!;
      smoke.pos[i * 3] = (smoke.pos[i * 3] ?? 0) + sv.x * dt;
      smoke.pos[i * 3 + 1] = (smoke.pos[i * 3 + 1] ?? 0) + sv.y * dt;
      smoke.pos[i * 3 + 2] = (smoke.pos[i * 3 + 2] ?? 0) + sv.z * dt;
    }
    smoke.points.geometry.attributes["position"]!.needsUpdate = true;
    for (let i = 0; i < fire.count; i++) {
      if (fireLife[i]! <= 0) continue;
      fireLife[i]! -= dt;
      fire.vel[i]!.y -= 6 * dt;
      const fv = fire.vel[i]!;
      fire.pos[i * 3] = (fire.pos[i * 3] ?? 0) + fv.x * dt;
      fire.pos[i * 3 + 1] = (fire.pos[i * 3 + 1] ?? 0) + fv.y * dt;
      fire.pos[i * 3 + 2] = (fire.pos[i * 3 + 2] ?? 0) + fv.z * dt;
    }
    fire.points.geometry.attributes["position"]!.needsUpdate = true;
    if (confetti.points.visible) {
      for (let i = 0; i < confetti.count; i++) {
        const cv = confetti.vel[i]!;
        confetti.pos[i * 3] = (confetti.pos[i * 3] ?? 0) + cv.x * dt;
        confetti.pos[i * 3 + 1] = (confetti.pos[i * 3 + 1] ?? 0) + cv.y * dt;
        confetti.pos[i * 3 + 2] = (confetti.pos[i * 3 + 2] ?? 0) + cv.z * dt;
        if ((confetti.pos[i * 3 + 1] ?? 0) < -1) confetti.pos[i * 3 + 1] = 10 + Math.random() * 8;
      }
      confetti.points.geometry.attributes["position"]!.needsUpdate = true;
    }

    renderer.render(scene, camera);
  };
  frame();

  return {
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mm = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mm)) mm.forEach((x) => x.dispose());
        else mm?.dispose();
      });
      holoTextures.forEach((x) => x.dispose());
      cardTex.dispose();
      renderer.dispose();
    },
  };
}
