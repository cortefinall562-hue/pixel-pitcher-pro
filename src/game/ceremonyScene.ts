import * as THREE from "three";

export interface CeremonyConfig {
  clubName: string;
  managerName: string;
  rivalName: string;
  score: string;
  shirt: number;
  shorts: number;
  crest: [string, string];
}

const SKIN = 0xf0b98a;
const GOLD = 0xf6c94a;
const NAVY = 0x101827;

function material(color: number, metalness = 0, roughness = 0.8) {
  return new THREE.MeshStandardMaterial({ color, metalness, roughness, flatShading: true });
}

function box(w: number, h: number, d: number, color: number) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material(color));
}

interface CeremonyPlayer {
  root: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
}

function makePlayer(shirt: number, shorts: number): CeremonyPlayer {
  const root = new THREE.Group();
  const torso = box(0.9, 0.95, 0.5, shirt);
  torso.position.y = 1.35;
  const head = box(0.68, 0.68, 0.62, SKIN);
  head.position.y = 2.2;
  const hair = box(0.71, 0.16, 0.64, 0x201b20);
  hair.position.y = 2.53;
  root.add(torso, head, hair);

  const limb = (side: number, arm: boolean) => {
    const joint = new THREE.Group();
    joint.position.set(side * (arm ? 0.58 : 0.24), arm ? 1.72 : 0.9, 0);
    const part = box(arm ? 0.22 : 0.3, arm ? 0.78 : 0.85, arm ? 0.22 : 0.34, arm ? shirt : shorts);
    part.position.y = arm ? -0.36 : -0.42;
    joint.add(part);
    return joint;
  };
  const armL = limb(-1, true);
  const armR = limb(1, true);
  root.add(armL, armR, limb(-1, false), limb(1, false));
  return { root, armL, armR };
}

function makeTrophy() {
  const trophy = new THREE.Group();
  const gold = material(GOLD, 0.85, 0.18);
  const cup = new THREE.Mesh(
    new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.35, 0),
        new THREE.Vector2(0.7, 0.18),
        new THREE.Vector2(0.78, 0.8),
        new THREE.Vector2(0.52, 1.25),
        new THREE.Vector2(0.9, 1.55),
        new THREE.Vector2(1.05, 2.15),
        new THREE.Vector2(0.92, 2.45),
      ],
      12,
    ),
    gold,
  );
  cup.position.y = 0.35;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.9, 0.35, 8), material(0x1c2230, 0.35, 0.35));
  base.position.y = 0.18;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.3, 0.65, 8), gold);
  stem.position.y = 0.65;
  for (const side of [-1, 1]) {
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.12, 6, 12, Math.PI), gold);
    handle.position.set(side * 0.78, 2, 0);
    handle.rotation.set(Math.PI / 2, 0, side > 0 ? Math.PI / 2 : -Math.PI / 2);
    trophy.add(handle);
  }
  trophy.add(base, stem, cup);
  return trophy;
}

function fitCanvas(canvas: HTMLCanvasElement) {
  const dpr = Math.min(window.devicePixelRatio, 2);
  const width = Math.max(1, canvas.clientWidth);
  const height = Math.max(1, canvas.clientHeight);
  const pixelWidth = Math.round(width * dpr);
  const pixelHeight = Math.round(height * dpr);
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  return { width, height, dpr };
}

function drawBroadcast(
  canvas: HTMLCanvasElement,
  config: CeremonyConfig,
  elapsed: number,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { width, height, dpr } = fitCanvas(canvas);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const vignette = ctx.createRadialGradient(width / 2, height / 2, height * 0.18, width / 2, height / 2, height * 0.78);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(3,8,18,0.58)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(9,15,27,0.9)";
  ctx.fillRect(0, 0, width, 7);
  ctx.fillStyle = config.crest[0];
  ctx.fillRect(0, 0, Math.min(width, elapsed * width * 0.08), 7);

  const phase = elapsed < 3.8 ? "CEREMONIA DE CAMPEONES" : elapsed < 7.5 ? "ENTREGA DEL TROFEO" : "CAMPEONES";
  const panelW = Math.min(560, width - 32);
  const x = 16;
  const y = height - 104;
  ctx.fillStyle = "rgba(7,12,22,0.9)";
  ctx.fillRect(x, y, panelW, 78);
  ctx.fillStyle = config.crest[0];
  ctx.fillRect(x, y, 7, 78);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "700 11px Outfit, sans-serif";
  ctx.fillText("TÁCTICA SPORTS · EN VIVO", x + 23, y + 22);
  ctx.fillStyle = "#ffffff";
  ctx.font = `${width < 640 ? 20 : 26}px Bungee, sans-serif`;
  ctx.fillText(phase, x + 23, y + 51);
  ctx.fillStyle = "rgba(255,255,255,0.68)";
  ctx.font = "600 12px Outfit, sans-serif";
  ctx.fillText(`${config.clubName.toUpperCase()}  ·  ${config.score}  ·  ${config.rivalName.toUpperCase()}`, x + 23, y + 69);

  if (elapsed > 5.2) {
    const alpha = Math.min(1, (elapsed - 5.2) * 1.8);
    ctx.globalAlpha = alpha;
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = `${width < 640 ? 25 : 38}px Bungee, sans-serif`;
    ctx.fillText(config.clubName.toUpperCase(), width / 2, 76);
    ctx.fillStyle = config.crest[0];
    ctx.font = "700 13px Outfit, sans-serif";
    ctx.fillText(`CAMPEÓN · DT ${config.managerName.toUpperCase()}`, width / 2, 101);
    ctx.textAlign = "start";
    ctx.globalAlpha = 1;
  }

  if (elapsed > 7.6 && elapsed < 8.15) {
    const flash = 1 - Math.abs(elapsed - 7.85) / 0.3;
    ctx.fillStyle = `rgba(255,246,205,${Math.max(0, flash) * 0.55})`;
    ctx.fillRect(0, 0, width, height);
  }
}

export function createCeremonyScene(
  canvas3d: HTMLCanvasElement,
  canvas2d: HTMLCanvasElement,
  config: CeremonyConfig,
  onReady: () => void,
) {
  const renderer = new THREE.WebGLRenderer({ canvas: canvas3d, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111827);
  scene.fog = new THREE.Fog(0x111827, 28, 75);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 160);
  scene.add(new THREE.HemisphereLight(0xb9d8ff, 0x172033, 1.6));
  const key = new THREE.DirectionalLight(0xfff2c2, 3.2);
  key.position.set(-8, 16, 10);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);
  for (const x of [-12, 12]) {
    const spot = new THREE.SpotLight(0xe7f1ff, 180, 48, Math.PI / 8, 0.45);
    spot.position.set(x, 18, 4);
    spot.target.position.set(0, 2, 0);
    scene.add(spot, spot.target);
  }

  const pitch = box(52, 0.35, 34, 0x2f8b51);
  pitch.position.y = -0.2;
  pitch.receiveShadow = true;
  scene.add(pitch);
  for (let i = -5; i <= 5; i++) {
    const stripe = box(4.7, 0.04, 34, i % 2 === 0 ? 0x3c9b5c : 0x358f54);
    stripe.position.set(i * 4.7, 0, 0);
    scene.add(stripe);
  }

  const stage = new THREE.Group();
  const podium = box(13, 1.3, 5, NAVY);
  podium.position.y = 0.65;
  const trim = box(13.2, 0.18, 5.2, GOLD);
  trim.position.y = 1.34;
  stage.add(podium, trim);
  stage.position.z = -1;
  scene.add(stage);

  const arch = new THREE.Group();
  const top = box(14, 0.7, 0.7, GOLD);
  top.position.y = 8;
  const left = box(0.7, 8, 0.7, GOLD);
  left.position.set(-6.65, 4, 0);
  const right = left.clone();
  right.position.x = 6.65;
  arch.add(top, left, right);
  arch.position.z = -2.3;
  scene.add(arch);

  const players: CeremonyPlayer[] = [];
  for (let i = 0; i < 7; i++) {
    const player = makePlayer(config.shirt, config.shorts);
    player.root.position.set((i - 3) * 1.65, 1.35, -0.6 + Math.abs(i - 3) * 0.18);
    player.root.rotation.y = Math.PI;
    player.root.castShadow = true;
    players.push(player);
    scene.add(player.root);
  }
  const captain = players[3]!;
  const trophy = makeTrophy();
  trophy.position.set(0, 3.6, -0.1);
  trophy.scale.setScalar(0.82);
  scene.add(trophy);

  const crowdCount = 420;
  const crowd = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.6, 0.85, 0.6),
    new THREE.MeshLambertMaterial({ vertexColors: true }),
    crowdCount,
  );
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  const crowdBase = new Float32Array(crowdCount * 3);
  for (let i = 0; i < crowdCount; i++) {
    const row = Math.floor(i / 42);
    const col = i % 42;
    const side = i < crowdCount / 2 ? -1 : 1;
    const x = (col - 20.5) * 1.25;
    const y = 2.2 + row * 0.7;
    const z = side * (13.5 + row * 0.8);
    crowdBase.set([x, y, z], i * 3);
    dummy.position.set(x, y, z);
    dummy.updateMatrix();
    crowd.setMatrixAt(i, dummy.matrix);
    crowd.setColorAt(i, color.set(i % 4 === 0 ? config.crest[0] : i % 4 === 1 ? config.crest[1] : "#dfe7ef"));
  }
  crowd.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(crowd);

  const confettiCount = 420;
  const confettiPositions = new Float32Array(confettiCount * 3);
  const confettiVelocity = new Float32Array(confettiCount * 3);
  const confettiColors = new Float32Array(confettiCount * 3);
  for (let i = 0; i < confettiCount; i++) {
    confettiPositions.set([(Math.random() - 0.5) * 20, 9 + Math.random() * 10, (Math.random() - 0.5) * 10], i * 3);
    confettiVelocity.set([(Math.random() - 0.5) * 1.2, -1.2 - Math.random() * 2.2, (Math.random() - 0.5) * 0.8], i * 3);
    color.set(i % 3 === 0 ? config.crest[0] : i % 3 === 1 ? config.crest[1] : "#f6c94a");
    confettiColors.set([color.r, color.g, color.b], i * 3);
  }
  const confettiGeo = new THREE.BufferGeometry();
  confettiGeo.setAttribute("position", new THREE.BufferAttribute(confettiPositions, 3));
  confettiGeo.setAttribute("color", new THREE.BufferAttribute(confettiColors, 3));
  const confetti = new THREE.Points(
    confettiGeo,
    new THREE.PointsMaterial({ size: 0.22, vertexColors: true, transparent: true, opacity: 0.95 }),
  );
  confetti.visible = false;
  scene.add(confetti);

  const clock = new THREE.Clock();
  let raf = 0;
  let readySent = false;
  const look = new THREE.Vector3(0, 3, 0);

  function resize() {
    const width = canvas3d.clientWidth || 1;
    const height = canvas3d.clientHeight || 1;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    fitCanvas(canvas2d);
  }

  function frame() {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.elapsedTime;
    const lift = THREE.MathUtils.smoothstep(elapsed, 4.3, 7.3);

    trophy.position.y = 3.6 + lift * 3.15;
    trophy.rotation.y += dt * (lift > 0.95 ? 1.2 : 0.18);
    captain.armL.rotation.z = lift * 2.55;
    captain.armR.rotation.z = -lift * 2.55;
    captain.armL.rotation.x = -lift * 0.3;
    captain.armR.rotation.x = -lift * 0.3;
    for (let i = 0; i < players.length; i++) {
      const p = players[i]!;
      const jump = elapsed > 6 ? Math.max(0, Math.sin(elapsed * 8 + i)) * 0.22 : 0;
      p.root.position.y = 1.35 + jump;
      if (i !== 3) {
        p.armL.rotation.z = 1.15 + Math.sin(elapsed * 4 + i) * 0.35;
        p.armR.rotation.z = -1.15 - Math.sin(elapsed * 4 + i) * 0.35;
      }
    }

    for (let i = 0; i < crowdCount; i++) {
      const hop = Math.max(0, Math.sin(elapsed * 4.5 + i * 0.37)) * 0.45;
      dummy.position.set(crowdBase[i * 3]!, crowdBase[i * 3 + 1]! + hop, crowdBase[i * 3 + 2]!);
      dummy.updateMatrix();
      crowd.setMatrixAt(i, dummy.matrix);
    }
    crowd.instanceMatrix.needsUpdate = true;

    if (elapsed > 6.4) {
      confetti.visible = true;
      for (let i = 0; i < confettiCount; i++) {
        const idx = i * 3;
        confettiPositions[idx] = confettiPositions[idx]! + confettiVelocity[idx]! * dt;
        confettiPositions[idx + 1] = confettiPositions[idx + 1]! + confettiVelocity[idx + 1]! * dt;
        confettiPositions[idx + 2] = confettiPositions[idx + 2]! + confettiVelocity[idx + 2]! * dt;
        if (confettiPositions[idx + 1]! < 0.3) confettiPositions[idx + 1] = 14 + Math.random() * 6;
      }
      confettiGeo.attributes.position!.needsUpdate = true;
    }

    const cameraTarget = elapsed < 3.8
      ? new THREE.Vector3(-10 + elapsed * 2.4, 5.6, 15)
      : elapsed < 7.5
        ? new THREE.Vector3(7.5, 5.1, 11.5)
        : new THREE.Vector3(Math.sin(elapsed * 0.28) * 7, 6.8, 13);
    camera.position.lerp(cameraTarget, 1 - Math.exp(-2.2 * dt));
    look.lerp(new THREE.Vector3(0, elapsed > 6 ? 4.2 : 3, -0.5), 1 - Math.exp(-3.5 * dt));
    camera.lookAt(look);

    drawBroadcast(canvas2d, config, elapsed);
    renderer.render(scene, camera);
    if (elapsed > 9 && !readySent) {
      readySent = true;
      onReady();
    }
  }

  camera.position.set(-12, 5.8, 17);
  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(canvas3d);
  frame();

  return {
    dispose() {
      cancelAnimationFrame(raf);
      observer.disconnect();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          object.geometry.dispose();
          const objectMaterial = object.material;
          if (Array.isArray(objectMaterial)) objectMaterial.forEach((entry) => entry.dispose());
          else objectMaterial.dispose();
        }
      });
      renderer.dispose();
    },
  };
}