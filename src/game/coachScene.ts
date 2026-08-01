import * as THREE from "three";

export type HairStyle = 0 | 1 | 2;
export type HairColor = "black" | "blonde" | "brown";
export type BrowStyle = 0 | 1 | 2;
export type Outfit = 0 | 1 | 2;

export interface CoachConfig {
  hairStyle: HairStyle;
  hairColor: HairColor;
  brows: BrowStyle;
  outfit: Outfit;
}

const HAIR_COLORS: Record<HairColor, number> = {
  black: 0x241f21,
  blonde: 0xf2c14a,
  brown: 0x7b4a24,
};

const OUTFITS = [
  // Traje elegante negro
  { torso: 0x22252c, arms: 0x22252c, legs: 0x1b1d22, detail: 0xffffff, shoes: 0x141518 },
  // Camisa blanca con corbata
  { torso: 0xf6f7fb, arms: 0xf6f7fb, legs: 0x2f3a4c, detail: 0xd8352a, shoes: 0x3a2a1c },
  // Ropa deportiva
  { torso: 0x24c07a, arms: 0x1aa768, legs: 0x1f2937, detail: 0xfdf14a, shoes: 0xf5f5f5 },
];

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

export function createCoachScene(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = false;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x8fd8f7);
  scene.fog = new THREE.Fog(0x8fd8f7, 14, 30);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 2.6, 7.2);
  camera.lookAt(0, 1.7, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x88bb77, 1.05));
  const sun = new THREE.DirectionalLight(0xfff3d6, 0.85);
  sun.position.set(4, 8, 6);
  scene.add(sun);

  // ---- Suelo de césped con bloques ----
  const ground = new THREE.Group();
  const tileGeo = new THREE.BoxGeometry(1, 0.5, 1);
  const greens = [0x4fbf5f, 0x45b055, 0x58c96a];
  for (let x = -9; x <= 9; x++) {
    for (let z = -7; z <= 5; z++) {
      const m = new THREE.Mesh(tileGeo, mat(greens[(x + z + 20) % 3]!));
      m.position.set(x, -0.25 + (Math.abs(x) > 6 ? 0.02 : 0), z);
      ground.add(m);
    }
  }
  // línea blanca del campo
  for (let x = -9; x <= 9; x++) {
    const l = box(1, 0.06, 0.14, 0xffffff);
    l.position.set(x, 0.02, -2);
    ground.add(l);
  }
  scene.add(ground);

  // nubes de bloques
  const clouds = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const c = new THREE.Group();
    for (let j = 0; j < 3; j++) {
      const b = box(1.4 - j * 0.2, 0.7, 1, 0xffffff);
      b.position.set(j * 0.9 - 0.9, j === 1 ? 0.25 : 0, 0);
      c.add(b);
    }
    c.position.set(-8 + i * 4, 5 + (i % 2), -8 - (i % 3));
    clouds.add(c);
  }
  scene.add(clouds);

  // ---- Entrenador ----
  const coach = new THREE.Group();
  coach.position.y = 0;
  scene.add(coach);

  const body = new THREE.Group();
  coach.add(body);

  const torso = box(1.15, 1.15, 0.62, 0xffffff);
  torso.position.y = 1.75;
  body.add(torso);

  const detail = box(0.2, 0.9, 0.08, 0xffffff);
  detail.position.set(0, 1.7, 0.33);
  body.add(detail);

  const head = box(0.95, 0.9, 0.85, SKIN);
  head.position.y = 2.78;
  body.add(head);

  // ojos
  const eyeL = box(0.14, 0.16, 0.06, 0x2b2b33);
  eyeL.position.set(-0.22, 2.82, 0.44);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.22;
  body.add(eyeL, eyeR);

  // boca
  const mouth = box(0.26, 0.06, 0.06, 0x8c4b3c);
  mouth.position.set(0, 2.56, 0.44);
  body.add(mouth);

  // cejas
  const browL = box(0.26, 0.08, 0.07, 0x241f21);
  browL.position.set(-0.22, 3.02, 0.44);
  const browR = browL.clone();
  browR.position.x = 0.22;
  body.add(browL, browR);

  // pelo (grupo intercambiable)
  const hair = new THREE.Group();
  hair.position.copy(head.position);
  body.add(hair);

  // brazos
  function makeArm(side: number) {
    const g = new THREE.Group();
    g.position.set(side * 0.72, 2.2, 0);
    const sleeve = cyl(0.16, 0.85, 0xffffff);
    sleeve.position.y = -0.45;
    const hand = box(0.3, 0.28, 0.3, SKIN);
    hand.position.y = -0.98;
    g.add(sleeve, hand);
    return { g, sleeve };
  }
  const armL = makeArm(-1);
  const armR = makeArm(1);
  body.add(armL.g, armR.g);

  // piernas
  function makeLeg(side: number) {
    const g = new THREE.Group();
    g.position.set(side * 0.3, 1.18, 0);
    const leg = cyl(0.2, 1.0, 0xffffff);
    leg.position.y = -0.5;
    const shoe = box(0.42, 0.24, 0.6, 0xffffff);
    shoe.position.set(0, -1.1, 0.1);
    g.add(leg, shoe);
    return { g, leg, shoe };
  }
  const legL = makeLeg(-1);
  const legR = makeLeg(1);
  body.add(legL.g, legR.g);

  // pelota de bloques al lado
  const ball = box(0.5, 0.5, 0.5, 0xffffff);
  ball.position.set(1.6, 0.3, 0.9);
  ball.rotation.y = 0.4;
  scene.add(ball);
  const ballSpot = box(0.2, 0.2, 0.52, 0x2b2b33);
  ballSpot.position.copy(ball.position);
  ballSpot.rotation.copy(ball.rotation);
  scene.add(ballSpot);

  // ---- Aplicar configuración ----
  function setHair(style: HairStyle, color: HairColor) {
    hair.clear();
    const c = HAIR_COLORS[color];
    if (style === 0) return; // pelado
    if (style === 1) {
      const top = box(1.0, 0.22, 0.9, c);
      top.position.y = 0.5;
      const backSide = box(1.02, 0.4, 0.3, c);
      backSide.position.set(0, 0.28, -0.32);
      hair.add(top, backSide);
    } else {
      const top = box(1.0, 0.26, 0.9, c);
      top.position.y = 0.48;
      const fringe = box(1.0, 0.26, 0.2, c);
      fringe.position.set(0, 0.26, 0.36);
      const sideL = box(0.14, 0.34, 0.86, c);
      sideL.position.set(-0.44, 0.2, 0);
      const sideR = sideL.clone();
      sideR.position.x = 0.44;
      hair.add(top, fringe, sideL, sideR);
    }
  }

  function setBrows(style: BrowStyle) {
    for (const b of [browL, browR]) {
      b.scale.set(1, 1, 1);
      b.rotation.z = 0;
      b.position.y = 3.02;
    }
    if (style === 1) {
      browL.rotation.z = -0.38;
      browR.rotation.z = 0.38;
      browL.position.y = browR.position.y = 2.99;
    } else if (style === 2) {
      browL.scale.set(1.12, 2.1, 1);
      browR.scale.set(1.12, 2.1, 1);
      browL.position.y = browR.position.y = 3.0;
    }
  }

  function setOutfit(index: Outfit) {
    const o = OUTFITS[index]!;
    (torso.material as THREE.MeshLambertMaterial).color.setHex(o.torso);
    (detail.material as THREE.MeshLambertMaterial).color.setHex(o.detail);
    for (const a of [armL, armR])
      (a.sleeve.material as THREE.MeshLambertMaterial).color.setHex(o.arms);
    for (const l of [legL, legR]) {
      (l.leg.material as THREE.MeshLambertMaterial).color.setHex(o.legs);
      (l.shoe.material as THREE.MeshLambertMaterial).color.setHex(o.shoes);
    }
    detail.visible = index !== 2;
  }

  function update(cfg: CoachConfig) {
    setHair(cfg.hairStyle, cfg.hairColor);
    setBrows(cfg.brows);
    setOutfit(cfg.outfit);
  }

  update({ hairStyle: 1, hairColor: "black", brows: 0, outfit: 0 });

  // ---- Loop / animación idle ----
  const clock = new THREE.Clock();
  let raf = 0;
  function render() {
    raf = requestAnimationFrame(render);
    const t = clock.getElapsedTime();
    const breathe = Math.sin(t * 1.9);
    body.position.y = breathe * 0.045;
    torso.scale.y = 1 + breathe * 0.022;
    head.position.y = 2.78 + breathe * 0.02;
    hair.position.y = head.position.y;
    armL.g.rotation.x = Math.sin(t * 1.5) * 0.14;
    armR.g.rotation.x = Math.sin(t * 1.5 + Math.PI) * 0.14;
    armL.g.rotation.z = 0.09 + Math.sin(t * 1.9) * 0.05;
    armR.g.rotation.z = -0.09 - Math.sin(t * 1.9) * 0.05;
    coach.rotation.y = Math.sin(t * 0.5) * 0.18;
    clouds.children.forEach((c, i) => {
      c.position.x += 0.004 * (1 + (i % 3) * 0.3);
      if (c.position.x > 12) c.position.x = -12;
    });
    renderer.render(scene, camera);
  }
  render();

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

  return { update, dispose };
}
