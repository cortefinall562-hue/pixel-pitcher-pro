import * as THREE from "three";

export type NegotiationMood = "idle" | "propose" | "think" | "nod" | "refuse" | "handshake";
export type NegotiationShot = "wide" | "otsHome" | "otsRival";

export interface NegotiationOptions {
  homeShirt: number;
  homeShorts: number;
  rivalShirt: number;
  rivalShorts: number;
  homeHair?: number;
  rivalHair?: number;
}

const SKIN = 0xd79a68;
const SKIN_DARK = 0xb87a4c;

function mat(color: number) {
  return new THREE.MeshLambertMaterial({ color });
}

function box(w: number, h: number, d: number, color: number) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
}

function cyl(r: number, h: number, color: number) {
  return new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 8), mat(color));
}

interface Character {
  root: THREE.Group;
  head: THREE.Group;
  torso: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  mouth: THREE.Mesh;
  browL: THREE.Mesh;
  browR: THREE.Mesh;
  mood: NegotiationMood;
  moodTime: number;
}

/** DT sentado, estilo bloques Mini Soccer Star (cabeza cúbica, gorra, cejas y boca planas). */
function createSeatedCoach(shirt: number, shorts: number, hairColor: number): Character {
  const root = new THREE.Group();

  const torso = new THREE.Group();
  root.add(torso);

  const chest = box(1.05, 1.0, 0.6, shirt);
  chest.position.y = 1.55;
  torso.add(chest);

  const collar = box(0.42, 0.16, 0.62, 0xf4f5f7);
  collar.position.y = 2.02;
  torso.add(collar);

  const stripeL = box(0.07, 0.9, 0.06, 0xf4f5f7);
  stripeL.position.set(-0.44, 1.55, 0.31);
  const stripeR = stripeL.clone();
  stripeR.position.x = 0.44;
  torso.add(stripeL, stripeR);

  // ---- Cabeza cúbica ----
  const head = new THREE.Group();
  head.position.y = 2.6;
  torso.add(head);

  const skull = box(0.86, 0.8, 0.8, SKIN);
  head.add(skull);

  const cap = box(0.92, 0.3, 0.86, hairColor);
  cap.position.y = 0.5;
  const capBack = box(0.94, 0.2, 0.3, hairColor);
  capBack.position.set(0, 0.3, -0.3);
  head.add(cap, capBack);

  const eyeL = box(0.11, 0.16, 0.05, 0x24262c);
  eyeL.position.set(-0.19, 0.07, 0.41);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.19;
  head.add(eyeL, eyeR);

  const browL = box(0.19, 0.06, 0.05, 0x24262c);
  browL.position.set(-0.19, 0.25, 0.41);
  const browR = browL.clone();
  browR.position.x = 0.19;
  head.add(browL, browR);

  const nose = box(0.1, 0.16, 0.08, SKIN_DARK);
  nose.position.set(0, -0.05, 0.43);
  head.add(nose);

  const mouth = box(0.24, 0.06, 0.05, 0x7b3f34);
  mouth.position.set(0, -0.24, 0.41);
  head.add(mouth);

  const ear = box(0.06, 0.16, 0.16, SKIN_DARK);
  ear.position.set(-0.45, 0.02, 0);
  const ear2 = ear.clone();
  ear2.position.x = 0.45;
  head.add(ear, ear2);

  // ---- Brazos ----
  function arm(side: number) {
    const g = new THREE.Group();
    g.position.set(side * 0.62, 1.92, 0);
    const sleeve = cyl(0.14, 0.62, shirt);
    sleeve.position.y = -0.32;
    const forearm = cyl(0.12, 0.55, SKIN);
    forearm.position.y = -0.86;
    const hand = box(0.26, 0.24, 0.26, SKIN);
    hand.position.y = -1.2;
    g.add(sleeve, forearm, hand);
    g.rotation.x = -0.25;
    return g;
  }
  const armL = arm(-1);
  const armR = arm(1);
  torso.add(armL, armR);

  // ---- Piernas sentadas ----
  function leg(side: number) {
    const g = new THREE.Group();
    g.position.set(side * 0.28, 1.05, 0);
    const thigh = cyl(0.17, 0.8, shorts);
    thigh.rotation.x = Math.PI / 2;
    thigh.position.z = 0.36;
    const shin = cyl(0.15, 0.85, 0x2b2f38);
    shin.position.set(0, -0.42, 0.72);
    const shoe = box(0.32, 0.18, 0.5, 0x1b1d22);
    shoe.position.set(0, -0.82, 0.82);
    g.add(thigh, shin, shoe);
    return g;
  }
  torso.add(leg(-1), leg(1));

  return { root, head, torso, armL, armR, mouth, browL, browR, mood: "idle", moodTime: 0 };
}

export function createNegotiationScene(canvas: HTMLCanvasElement, opts: NegotiationOptions) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a2030);

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x4b5563, 0.9));
  const key = new THREE.DirectionalLight(0xfff1d0, 0.9);
  key.position.set(4, 8, 6);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x9ecfff, 0.4);
  fill.position.set(-6, 4, -4);
  scene.add(fill);

  // ---- Oficina ----
  const floor = box(18, 0.4, 16, 0x6b4a2f);
  floor.position.set(0, -0.2, 0);
  scene.add(floor);
  for (let i = -4; i <= 4; i++) {
    const plank = box(1.6, 0.06, 16, i % 2 === 0 ? 0x7c563a : 0x69452c);
    plank.position.set(i * 1.75, 0.02, 0);
    scene.add(plank);
  }
  const rug = box(7, 0.06, 6, 0x2f3b52);
  rug.position.set(0, 0.06, 0);
  scene.add(rug);

  const backWall = box(18, 8, 0.4, 0x39445c);
  backWall.position.set(0, 4, -8);
  scene.add(backWall);
  const sideWall = box(0.4, 8, 16, 0x323c52);
  sideWall.position.set(-9, 4, 0);
  const sideWall2 = sideWall.clone();
  sideWall2.position.x = 9;
  scene.add(sideWall, sideWall2);

  // ventanal hacia el estadio
  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(11, 5, 0.12),
    new THREE.MeshLambertMaterial({ color: 0x8fd8f7, transparent: true, opacity: 0.55 }),
  );
  glass.position.set(0, 4.2, -7.7);
  scene.add(glass);
  for (const x of [-3.7, 0, 3.7]) {
    const mullion = box(0.22, 5.1, 0.2, 0x22293a);
    mullion.position.set(x, 4.2, -7.62);
    scene.add(mullion);
  }
  // estadio detrás del vidrio
  const stadium = new THREE.Group();
  const pitchOut = box(13, 0.3, 9, 0x4fbf5f);
  pitchOut.position.set(0, 2.0, -15);
  stadium.add(pitchOut);
  const lineOut = box(0.2, 0.1, 9, 0xffffff);
  lineOut.position.set(0, 2.2, -15);
  stadium.add(lineOut);
  for (const s of [-1, 1]) {
    const stand = box(14, 2.2, 2.4, 0x5a6472);
    stand.position.set(0, 2.6, -15 + s * 6);
    stadium.add(stand);
    for (let i = 0; i < 20; i++) {
      const fan = box(0.5, 0.5, 0.5, [0xff4d4d, 0xffd93d, 0x4dd2ff, 0xffffff][i % 4]!);
      fan.position.set(-6.5 + i * 0.7, 3.9, -15 + s * 6);
      stadium.add(fan);
    }
  }
  scene.add(stadium);

  // ---- Escritorio de madera ----
  const desk = new THREE.Group();
  const top = box(5.2, 0.24, 2.4, 0x8a5a34);
  top.position.y = 1.32;
  desk.add(top);
  const edge = box(5.3, 0.1, 2.5, 0x6f4526);
  edge.position.y = 1.2;
  desk.add(edge);
  for (const sx of [-2.2, 2.2]) {
    const legBox = box(0.4, 1.2, 2.0, 0x6f4526);
    legBox.position.set(sx, 0.6, 0);
    desk.add(legBox);
  }
  const papers = box(0.8, 0.05, 0.6, 0xf5f5f5);
  papers.position.set(-1.3, 1.47, 0.2);
  const pen = box(0.06, 0.06, 0.4, 0x22262e);
  pen.position.set(-0.7, 1.48, 0.2);
  const lampBase = cyl(0.22, 0.1, 0x2b303c);
  lampBase.position.set(1.8, 1.49, -0.5);
  const lampArm = cyl(0.05, 0.7, 0x2b303c);
  lampArm.position.set(1.8, 1.8, -0.5);
  const lampHead = box(0.4, 0.3, 0.4, 0xfdf14a);
  lampHead.position.set(1.8, 2.2, -0.5);
  desk.add(papers, pen, lampBase, lampArm, lampHead);
  scene.add(desk);

  // ---- Sillas ----
  function chair(z: number, facing: number) {
    const g = new THREE.Group();
    const seat = box(1.1, 0.16, 1.1, 0x2b3244);
    seat.position.y = 0.95;
    const back = box(1.1, 1.2, 0.16, 0x323a4e);
    back.position.set(0, 1.6, facing * 0.5);
    for (const [dx, dz] of [
      [-0.45, -0.45],
      [0.45, -0.45],
      [-0.45, 0.45],
      [0.45, 0.45],
    ] as const) {
      const l = cyl(0.06, 0.95, 0x1e2432);
      l.position.set(dx, 0.48, dz);
      g.add(l);
    }
    g.add(seat, back);
    g.position.set(0, 0, z);
    return g;
  }
  scene.add(chair(2.6, 1), chair(-2.6, -1));

  // ---- DTs ----
  const home = createSeatedCoach(opts.homeShirt, opts.homeShorts, opts.homeHair ?? 0x241f21);
  home.root.position.set(0, 0, 2.4);
  home.root.rotation.y = Math.PI;
  scene.add(home.root);

  const rival = createSeatedCoach(opts.rivalShirt, opts.rivalShorts, opts.rivalHair ?? 0x3a2a1c);
  rival.root.position.set(0, 0, -2.4);
  scene.add(rival.root);

  // contrato firmado que aparece en el escritorio
  const contract = new THREE.Group();
  const sheet = box(1.0, 0.04, 0.72, 0xfdfdfd);
  const ink = box(0.55, 0.02, 0.06, 0x2b62d4);
  ink.position.set(0, 0.04, -0.2);
  const sign = box(0.4, 0.02, 0.05, 0x1b1d22);
  sign.position.set(-0.15, 0.04, 0.2);
  contract.add(sheet, ink, sign);
  contract.position.set(0, 1.5, 0.1);
  contract.rotation.y = 0.12;
  contract.visible = false;
  scene.add(contract);

  // ---- Cámara ----
  const shots: Record<NegotiationShot, { pos: THREE.Vector3; look: THREE.Vector3 }> = {
    wide: { pos: new THREE.Vector3(5.6, 3.6, 6.4), look: new THREE.Vector3(0, 2.1, 0) },
    otsHome: { pos: new THREE.Vector3(-1.1, 3.0, 4.9), look: new THREE.Vector3(0.2, 2.5, -2.4) },
    otsRival: { pos: new THREE.Vector3(1.1, 3.0, -4.9), look: new THREE.Vector3(-0.2, 2.5, 2.4) },
  };
  let shot: NegotiationShot = "wide";
  camera.position.copy(shots.wide.pos);
  const camLook = shots.wide.look.clone();

  function setShot(next: NegotiationShot) {
    shot = next;
  }

  function setMood(who: "home" | "rival", mood: NegotiationMood) {
    const c = who === "home" ? home : rival;
    c.mood = mood;
    c.moodTime = 0;
    if (mood !== "handshake") contract.visible = false;
  }

  function showContract(visible: boolean) {
    contract.visible = visible;
  }

  function animateCharacter(c: Character, t: number, dt: number) {
    c.moodTime += dt;
    const breathe = Math.sin(t * 1.9);
    c.torso.position.y = breathe * 0.035;
    c.torso.rotation.x = 0;
    c.torso.rotation.z = 0;
    c.head.rotation.set(0, 0, 0);
    c.armL.rotation.set(-0.25, 0, 0.05 + breathe * 0.03);
    c.armR.rotation.set(-0.25, 0, -0.05 - breathe * 0.03);
    c.armL.position.set(-0.62, 1.92, 0);
    c.armR.position.set(0.62, 1.92, 0);
    c.mouth.scale.set(1, 1, 1);
    c.mouth.position.y = -0.24;
    c.browL.rotation.z = 0;
    c.browR.rotation.z = 0;
    c.browL.position.y = 0.25;
    c.browR.position.y = 0.25;

    const m = c.moodTime;
    switch (c.mood) {
      case "propose":
        c.torso.rotation.x = -0.16;
        c.head.rotation.z = Math.sin(m * 2) * 0.16;
        c.armR.rotation.x = -0.9 + Math.sin(m * 4) * 0.22;
        c.mouth.scale.x = 1 + Math.abs(Math.sin(m * 9)) * 0.5;
        break;
      case "think":
        c.head.rotation.x = -0.12;
        c.head.rotation.y = Math.sin(m * 1.1) * 0.3;
        c.armR.rotation.x = -1.5;
        c.armR.rotation.z = -0.5;
        c.browL.position.y = 0.29;
        c.browR.position.y = 0.29;
        break;
      case "nod":
        c.head.rotation.x = Math.sin(m * 7) * 0.22;
        c.mouth.scale.set(1.3, 1.6, 1);
        c.mouth.position.y = -0.26;
        break;
      case "refuse":
        // brazos cruzados + negación con la cabeza
        c.armL.rotation.set(-1.55, 0, -1.0);
        c.armR.rotation.set(-1.55, 0, 1.0);
        c.armL.position.set(-0.3, 1.85, 0.2);
        c.armR.position.set(0.3, 1.9, 0.3);
        c.head.rotation.y = Math.sin(m * 8) * 0.3;
        c.browL.rotation.z = -0.5;
        c.browR.rotation.z = 0.5;
        c.browL.position.y = 0.2;
        c.browR.position.y = 0.2;
        c.mouth.scale.set(0.7, 1, 1);
        break;
      case "handshake": {
        const shake = Math.sin(m * 10) * 0.12;
        c.torso.rotation.x = -0.28;
        c.armR.rotation.set(-1.45 + shake, 0, -0.35);
        c.armL.rotation.set(-0.2, 0, -0.05);
        c.head.rotation.x = 0.1;
        c.mouth.scale.set(1.5, 1.8, 1);
        c.mouth.position.y = -0.27;
        break;
      }
      default:
        c.head.rotation.y = Math.sin(t * 0.6 + (c === rival ? 1.4 : 0)) * 0.12;
        break;
    }
  }

  const clock = new THREE.Clock();
  let raf = 0;

  function frame() {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, clock.getDelta());
    const t = clock.elapsedTime;

    animateCharacter(home, t, dt);
    animateCharacter(rival, t, dt);

    const target = shots[shot];
    const sway = new THREE.Vector3(Math.sin(t * 0.4) * 0.18, Math.sin(t * 0.7) * 0.08, 0);
    camera.position.lerp(target.pos.clone().add(sway), Math.min(1, dt * 2.6));
    camLook.lerp(target.look, Math.min(1, dt * 3));
    camera.lookAt(camLook);

    if (contract.visible) contract.position.y = 1.5 + Math.sin(t * 3) * 0.03;

    renderer.render(scene, camera);
  }
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
    renderer.dispose();
  }

  return { setShot, setMood, showContract, dispose };
}
