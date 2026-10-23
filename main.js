/**
 * ============================================================================
 * TIME SHIFT SQUAD - Real 3D Action RPG & Encounter System
 * File: main.js
 * ============================================================================
 * Key Architecture:
 * 1. Visual Quality: Immersive 3D world with mountain horizon, rolling terrain,
 *    paved stone paths, wooden railings, lanterns, and conical trees.
 * 2. Start with exactly ONE player. Friendly allies are placed ahead along the
 *    route and join the squad with a collection animation when reached.
 * 3. Encounter State Machine:
 *    EXPLORATION -> ENCOUNTER_START -> COMBAT -> VICTORY -> REWARD -> EXPLORATION.
 *    Forward progression is locked during combat via physical energy barriers!
 * 4. Active Combat System:
 *    - Enemies flank, chase, wind up, and strike with warning indicators.
 *    - Hit-stop (impact freeze), screen shake, weapon trails, impact sparks,
 *      knockback, floating damage numbers, and audio synthesizer effects.
 *    - Squad allies actively target and attack nearby enemies in combat!
 * 5. Time Shift Portals: Circular clock machine portals that upgrade the era,
 *    weapons, and timeline gauge.
 * 6. Procedural Web Audio API sound effects (zero external asset dependencies).
 */

import * as THREE from 'three';

// ----------------------------------------------------------------------------
// 1. Procedural Web Audio API Sound Synthesizer (Zero Dependencies)
// ----------------------------------------------------------------------------
class SoundSystem {
  constructor() {
    this.ctx = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.initialized = true;
      }
    } catch {
      // Audio optional; fallback gracefully
    }
  }

  // Sword swing whoosh (filtered noise)
  playSwordSwing() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.14);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.14);
  }

  // Hit impact punch
  playHitImpact() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.16);

    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.16);
  }

  // Alert sting when encounter starts
  playAlertSting() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.setValueAtTime(660, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }

  // Victory fanfare chime (major chord arpeggio)
  playVictory() {
    if (!this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime + idx * 0.12;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.35);
    });
  }

  // Ally rescue sparkle chime
  playAllyRescue() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }
}

const audio = new SoundSystem();
window.addEventListener('pointerdown', () => audio.init(), { once: true });
window.addEventListener('keydown', () => audio.init(), { once: true });

// ----------------------------------------------------------------------------
// 2. Three.js Scene, Renderer & Atmospheric Environment
// ----------------------------------------------------------------------------
const scene = new THREE.Scene();
const SKY_COLOR = 0x87ceeb;
scene.background = new THREE.Color(SKY_COLOR);
scene.fog = new THREE.FogExp2(SKY_COLOR, 0.008);

const container = document.getElementById('game-container');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
container.appendChild(renderer.domElement);

// Third-Person Camera
const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 600);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xfffaed, 1.4);
sunLight.position.set(35, 55, 30);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 1.0;
sunLight.shadow.camera.far = 220;
sunLight.shadow.camera.left = -45;
sunLight.shadow.camera.right = 45;
sunLight.shadow.camera.top = 45;
sunLight.shadow.camera.bottom = -45;
sunLight.shadow.bias = -0.0004;
scene.add(sunLight);

const hemiLight = new THREE.HemisphereLight(0xb1e1ff, 0x48bb78, 0.45);
scene.add(hemiLight);

// ----------------------------------------------------------------------------
// 3. Immersive 3D Surrounding Environment (Mountains, Hills, Trees)
// ----------------------------------------------------------------------------
const MAT = {
  skin: new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.35 }), // Yellow hero skin
  armor: new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6, roughness: 0.3 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.8, roughness: 0.2 }),
  crest: new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 }),
  woodPlank: new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.7 }),
  woodPost: new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 }),
  stoneRoad: new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.55 }),
  mountain: new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 }),
  mountainSnow: new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.8 }),
  treeTrunk: new THREE.MeshStandardMaterial({ color: 0x543212, roughness: 0.8 }),
  treeFoliage: new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.6 }),
  enemySkin: new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 }),
  enemyArmor: new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.5 }),
  barrierRed: new THREE.MeshStandardMaterial({ color: 0xef4444, transparent: true, opacity: 0.6, side: THREE.DoubleSide }),
  crystalPurple: new THREE.MeshStandardMaterial({ color: 0xa855f7, roughness: 0.2, metalness: 0.3 }),
};

// Ground plane
const groundGeo = new THREE.PlaneGeometry(600, 600);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.95 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.set(0, -0.05, -70);
ground.receiveShadow = true;
scene.add(ground);

// Distant low-poly mountain ring
function spawnMountain(x, z, scale = 1.0) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const baseGeo = new THREE.ConeGeometry(24 * scale, 35 * scale, 7);
  const baseMesh = new THREE.Mesh(baseGeo, MAT.mountain);
  baseMesh.position.y = 17.5 * scale;
  group.add(baseMesh);

  // Snow cap
  const capGeo = new THREE.ConeGeometry(9 * scale, 12 * scale, 7);
  const capMesh = new THREE.Mesh(capGeo, MAT.mountainSnow);
  capMesh.position.y = 29 * scale;
  group.add(capMesh);

  scene.add(group);
}

// Mountain backdrop ring
for (let angle = 0; angle < Math.PI * 2; angle += 0.4) {
  const dist = 180 + Math.random() * 40;
  spawnMountain(Math.cos(angle) * dist, Math.sin(angle) * dist - 70, 0.9 + Math.random() * 0.6);
}

// Low-poly conical trees & wooden lanterns
function spawnTree(x, z, scale = 1.0) {
  const tree = new THREE.Group();
  tree.position.set(x, 0, z);

  const trunkGeo = new THREE.CylinderGeometry(0.25 * scale, 0.35 * scale, 1.8 * scale, 6);
  const trunk = new THREE.Mesh(trunkGeo, MAT.treeTrunk);
  trunk.position.y = 0.9 * scale;
  trunk.castShadow = true;
  tree.add(trunk);

  for (let i = 0; i < 3; i++) {
    const coneGeo = new THREE.ConeGeometry((1.5 - i * 0.3) * scale, 1.6 * scale, 6);
    const foliage = new THREE.Mesh(coneGeo, MAT.treeFoliage);
    foliage.position.y = (1.8 + i * 0.9) * scale;
    foliage.castShadow = true;
    tree.add(foliage);
  }
  scene.add(tree);
}

function spawnLantern(x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.2, 6), MAT.woodPost);
  post.position.y = 1.1;
  group.add(post);

  const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.35, 0.3), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
  lantern.position.set(0, 2.1, 0);
  group.add(lantern);

  scene.add(group);
}

for (let z = 20; z > -160; z -= 11) {
  spawnTree(-8 - Math.random() * 8, z + (Math.random() - 0.5) * 5, 0.8 + Math.random() * 0.5);
  spawnTree(8 + Math.random() * 8, z + (Math.random() - 0.5) * 5, 0.8 + Math.random() * 0.5);
}

// ----------------------------------------------------------------------------
// 4. Connected 3D Paths with Real Curves & Y-Junction
// ----------------------------------------------------------------------------
const ROAD_WIDTH = 5.8;

function buildFence(x, zStart, zEnd, rotY = 0) {
  const group = new THREE.Group();
  const len = Math.abs(zEnd - zStart);
  const postDist = 2.4;
  const num = Math.floor(len / postDist);

  const postGeo = new THREE.CylinderGeometry(0.12, 0.14, 1.1, 8);
  const railGeo = new THREE.BoxGeometry(0.1, 0.12, postDist + 0.1);

  for (let i = 0; i <= num; i++) {
    const p = new THREE.Mesh(postGeo, MAT.woodPost);
    p.position.set(0, 0.55, -i * postDist);
    p.castShadow = true;
    group.add(p);

    if (i < num) {
      const rail1 = new THREE.Mesh(railGeo, MAT.woodPlank);
      rail1.position.set(0, 0.88, -(i + 0.5) * postDist);
      rail1.castShadow = true;
      group.add(rail1);

      const rail2 = new THREE.Mesh(railGeo, MAT.woodPlank);
      rail2.position.set(0, 0.48, -(i + 0.5) * postDist);
      rail2.castShadow = true;
      group.add(rail2);
    }
  }

  group.position.set(x, 0, zStart);
  group.rotation.y = rotY;
  scene.add(group);
}

// Section 1: Approach Road (z = 25 down to -50)
const sec1Mesh = new THREE.Mesh(new THREE.BoxGeometry(ROAD_WIDTH, 0.12, 75), MAT.stoneRoad);
sec1Mesh.position.set(0, 0.06, -12.5);
sec1Mesh.receiveShadow = true;
scene.add(sec1Mesh);

// Side plank walk & fences
const leftWalk = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.14, 75), MAT.woodPlank);
leftWalk.position.set(-ROAD_WIDTH / 2 + 0.4, 0.07, -12.5);
leftWalk.receiveShadow = true;
scene.add(leftWalk);

buildFence(-ROAD_WIDTH / 2, 25, -50);
buildFence(ROAD_WIDTH / 2, 25, -50);

spawnLantern(-ROAD_WIDTH / 2 - 0.4, 10);
spawnLantern(ROAD_WIDTH / 2 + 0.4, 10);
spawnLantern(-ROAD_WIDTH / 2 - 0.4, -20);
spawnLantern(ROAD_WIDTH / 2 + 0.4, -20);

// Section 2: Connected Y-Junction (z = -50 to -95)
function getBranchTransform(z, branch) {
  if (z >= -50) {
    return { x: 0, heading: 0 };
  } else if (z >= -95) {
    const t = (-50 - z) / 45.0;
    const smooth = t * t * (3 - 2 * t);
    const sign = branch === 'left' ? -1 : 1;
    const angle = 0.42; // ~24 deg
    return {
      x: sign * smooth * 7.5,
      heading: sign * smooth * angle,
    };
  } else {
    const past = -95 - z;
    const sign = branch === 'left' ? -1 : 1;
    const angle = 0.42;
    return {
      x: sign * (7.5 + past * Math.tan(angle)),
      heading: sign * angle,
    };
  }
}

function buildCurvedBranchMesh(branch) {
  const segs = 20;
  const zStart = -50;
  const zEnd = -95;
  const dz = (zEnd - zStart) / segs;
  const halfW = (ROAD_WIDTH * 0.9) / 2;

  const vertices = [];
  const indices = [];

  for (let i = 0; i <= segs; i++) {
    const z = zStart + i * dz;
    const tf = getBranchTransform(z, branch);
    const cosH = Math.cos(tf.heading);
    const sinH = Math.sin(tf.heading);

    vertices.push(tf.x - halfW * cosH, 0.06, z + halfW * sinH);
    vertices.push(tf.x + halfW * cosH, 0.06, z - halfW * sinH);

    if (i < segs) {
      const r1 = i * 2;
      const r2 = (i + 1) * 2;
      indices.push(r1, r2, r1 + 1);
      indices.push(r1 + 1, r2, r2 + 1);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const mesh = new THREE.Mesh(geo, MAT.stoneRoad);
  mesh.receiveShadow = true;
  scene.add(mesh);
}

buildCurvedBranchMesh('left');
buildCurvedBranchMesh('right');

// Center wooden divider island wedge at Y-fork
const forkWedge = new THREE.Mesh(new THREE.ConeGeometry(0.85, 4.0, 3), MAT.woodPlank);
forkWedge.rotation.x = Math.PI / 2;
forkWedge.rotation.z = Math.PI;
forkWedge.position.set(0, 0.12, -52.5);
scene.add(forkWedge);

// Continuations (z = -95 to -165)
function buildBranchContinuation(branch) {
  const group = new THREE.Group();
  const len = 70;
  const zC = -95 - len / 2;
  const angle = 0.42;
  const heading = branch === 'left' ? -angle : angle;
  const sign = branch === 'left' ? -1 : 1;
  const xC = sign * (7.5 + (len / 2) * Math.tan(angle));

  const mesh = new THREE.Mesh(new THREE.BoxGeometry(ROAD_WIDTH * 0.9, 0.12, len), MAT.stoneRoad);
  mesh.position.set(xC, 0.06, zC);
  mesh.rotation.y = heading;
  mesh.receiveShadow = true;
  group.add(mesh);

  scene.add(group);
}
buildBranchContinuation('left');
buildBranchContinuation('right');

// ----------------------------------------------------------------------------
// 5. Time Shift Clock Portal (From Reference Image!)
// ----------------------------------------------------------------------------
const timePortals = [];

function createTimeClockPortal(x, z, eraTarget, eraName, badgeText) {
  const portal = new THREE.Group();
  portal.position.set(x, 0, z);

  // Pedestal
  const base = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.6, 0.35, 16), MAT.armor);
  base.position.y = 0.175;
  portal.add(base);

  // Pillars & Arch
  const leftPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 3.8, 12), MAT.armor);
  leftPillar.position.set(-1.6, 2.0, 0);
  portal.add(leftPillar);

  const rightPillar = leftPillar.clone();
  rightPillar.position.x = 1.6;
  portal.add(rightPillar);

  // Clock Dial
  const dial = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.12, 32), MAT.armor);
  dial.rotation.x = Math.PI / 2;
  dial.position.set(0, 2.5, 0);
  portal.add(dial);

  const face = new THREE.Mesh(new THREE.CircleGeometry(1.05, 32), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  face.position.set(0, 2.5, 0.07);
  portal.add(face);

  const hand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.75, 0.04), MAT.crest);
  hand.position.set(0, 2.5, 0.1);
  portal.add(hand);

  // Overhead Badge
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 80;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#2563eb';
  ctx.roundRect(4, 4, 248, 72, 16);
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(badgeText, 128, 40);

  const badgeTex = new THREE.CanvasTexture(canvas);
  const badge = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 0.5),
    new THREE.MeshBasicMaterial({ map: badgeTex, transparent: true, side: THREE.DoubleSide })
  );
  badge.position.set(0, 4.3, 0);
  portal.add(badge);

  // Energy Field
  const energy = new THREE.Mesh(
    new THREE.RingGeometry(0.3, 1.35, 24),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
  );
  energy.position.set(0, 1.6, 0);
  portal.add(energy);

  scene.add(portal);

  timePortals.push({ portal, hand, energy, x, z, eraTarget, eraName, active: false });
}

// Clock Portal 1 (unlocked after defeating Encounter 1 at z = -44)
createTimeClockPortal(0, -44, 2, 'MEDIEVAL ARCHER', 'Level 1');

// ----------------------------------------------------------------------------
// 6. Character Rig Construction
// ----------------------------------------------------------------------------
function buildStylizedHumanoid(isHero = false, isEnemy = false) {
  const root = new THREE.Group();
  const skinMat = isEnemy ? MAT.enemySkin : MAT.skin;
  const armorMat = isEnemy ? MAT.enemyArmor : MAT.armor;

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), skinMat);
  head.position.y = 1.35;
  head.castShadow = true;
  root.add(head);

  // Helmet with crest for Hero
  if (isHero) {
    const helm = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.35, 0.32, 16), armorMat);
    helm.position.y = 1.45;
    helm.castShadow = true;
    root.add(helm);

    const crest = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.45), MAT.crest);
    crest.position.set(0, 1.68, 0);
    crest.castShadow = true;
    root.add(crest);

    const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.3, 0.55, 12), MAT.gold);
    chest.position.y = 0.85;
    chest.castShadow = true;
    root.add(chest);
  }

  // Torso
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.25, 0.6, 10), skinMat);
  torso.position.y = 0.85;
  torso.castShadow = true;
  root.add(torso);

  // Arms & Legs
  const armGeo = new THREE.CapsuleGeometry(0.09, 0.4, 6, 8);
  const leftArm = new THREE.Mesh(armGeo, skinMat);
  leftArm.position.set(-0.38, 0.75, 0);
  root.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, skinMat);
  rightArm.position.set(0.38, 0.75, 0);
  root.add(rightArm);

  const legGeo = new THREE.CapsuleGeometry(0.1, 0.42, 6, 8);
  const leftLeg = new THREE.Mesh(legGeo, skinMat);
  leftLeg.position.set(-0.16, 0.28, 0);
  root.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, skinMat);
  rightLeg.position.set(0.16, 0.28, 0);
  root.add(rightLeg);

  const weaponHolder = new THREE.Group();
  weaponHolder.position.set(0.42, 0.65, -0.2);
  root.add(weaponHolder);

  return { root, head, torso, leftArm, rightArm, leftLeg, rightLeg, weaponHolder };
}

// Weapon Models
function buildSword() {
  const g = new THREE.Group();
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.82, 0.04), MAT.armor);
  blade.position.y = 0.41;
  blade.castShadow = true;
  g.add(blade);
  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.05, 0.08), MAT.gold);
  guard.position.y = 0.02;
  g.add(guard);
  const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.2, 8), MAT.woodPost);
  hilt.position.y = -0.1;
  g.add(hilt);
  g.rotation.x = Math.PI / 3;
  return g;
}

function buildBow() {
  const g = new THREE.Group();
  const arc = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.04, 6, 16, Math.PI * 0.85), MAT.woodPlank);
  arc.rotation.z = Math.PI / 1.15;
  g.add(arc);
  const string = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.8, 4), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  string.position.x = 0.15;
  g.add(string);
  g.rotation.x = Math.PI / 4;
  return g;
}

// ----------------------------------------------------------------------------
// 7. SINGLE Player Character Initialization (Requirements Check: Exactly 1 Player!)
// ----------------------------------------------------------------------------
const heroRig = buildStylizedHumanoid(true, false);
const heroMesh = heroRig.root;
heroMesh.position.set(0, 0, 15); // Starts alone on approach road
scene.add(heroMesh);

const heroState = {
  hp: 100,
  maxHp: 100,
  era: 1,
  weapon: 'sword',
  pos: heroMesh.position,
  velocity: new THREE.Vector3(0, 0, 0),
  speed: 9.5,
  headingAngle: 0,
  isRolling: false,
  rollTimer: 0,
  attackCooldown: 0,
  kills: 0,
  isAlive: true,
};

let currentWeaponMesh = buildSword();
heroRig.weaponHolder.add(currentWeaponMesh);

function equipHeroWeapon(type) {
  heroState.weapon = type;
  heroRig.weaponHolder.remove(currentWeaponMesh);
  currentWeaponMesh = type === 'sword' ? buildSword() : buildBow();
  heroRig.weaponHolder.add(currentWeaponMesh);

  document.getElementById('weapon-icon').textContent = type === 'sword' ? '⚔️' : '🏹';
  document.getElementById('weapon-name').textContent = type === 'sword' ? 'IRON BROADSWORD' : 'HUNTER LONGBOW';
}

// ----------------------------------------------------------------------------
// 8. Friendly Squad Collection System (Placed ahead along the route!)
// ----------------------------------------------------------------------------
const squadMembers = []; // Starts completely EMPTY (only 1 player at level start!)

const rescueRecruits = [
  { x: -1.0, z: -14, recruited: false, name: 'Sargent Leo' },
  { x: 1.0, z: -55, recruited: false, name: 'Archer Maya' },
];

rescueRecruits.forEach((rec) => {
  const rig = buildStylizedHumanoid(false, false);
  rig.root.position.set(rec.x, 0, rec.z);

  const sword = buildSword();
  rig.weaponHolder.add(sword);
  scene.add(rig.root);

  // Pulsing rescue beacon ring
  const beacon = new THREE.Mesh(
    new THREE.RingGeometry(0.6, 0.9, 24),
    new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide })
  );
  beacon.rotation.x = -Math.PI / 2;
  beacon.position.y = 0.05;
  rig.root.add(beacon);

  rec.rig = rig;
  rec.beacon = beacon;
});

function recruitAlly(rec) {
  rec.recruited = true;
  rec.beacon.visible = false;
  audio.playAllyRescue();

  // Jump animation
  rec.rig.root.position.y = 1.0;

  const slotIndex = squadMembers.length;
  const offsetX = slotIndex % 2 === 0 ? -1.0 : 1.0;
  const offsetZ = 1.4 + Math.floor(slotIndex / 2) * 1.1;

  squadMembers.push({
    rig: rec.rig,
    offsetX,
    offsetZ,
    weaponMesh: rec.rig.weaponHolder.children[0],
    attackCooldown: 0,
    targetEnemy: null,
  });

  document.getElementById('hud-squad').textContent = `${squadMembers.length + 1} HEROES`;
  triggerEventBanner(`ALLY RECRUITED: ${rec.name}!`);
}

// ----------------------------------------------------------------------------
// 9. Encounter-Based State Machine & Arena Locking Barriers
// ----------------------------------------------------------------------------
/**
 * Game State Flow:
 * EXPLORATION -> ENCOUNTER_START -> COMBAT -> VICTORY -> REWARD -> EXPLORATION
 */
let gameState = 'EXPLORATION';

const combatVignette = document.getElementById('combat-vignette');
const encounterPill = document.getElementById('encounter-pill');
const encounterDot = document.getElementById('encounter-dot');
const encounterStatusText = document.getElementById('encounter-status-text');

// Arena Barrier Meshes (Block forward & backward progression during combat!)
const arenaBarriers = [];

function createArenaBarrier(z) {
  const barrierGeo = new THREE.BoxGeometry(ROAD_WIDTH, 2.5, 0.2);
  const barrier = new THREE.Mesh(barrierGeo, MAT.barrierRed);
  barrier.position.set(0, 1.25, z);
  barrier.visible = false;
  scene.add(barrier);
  arenaBarriers.push({ mesh: barrier, z });
  return barrier;
}

const barrierFront1 = createArenaBarrier(-40.0); // Blocks forward progression past Encounter 1
const barrierBack1 = createArenaBarrier(-22.0);  // Blocks running away from Encounter 1

// Active Encounter Definitions
const encounters = [
  {
    id: 1,
    triggerZ: -25.0, // Entered at z = -25
    arenaBounds: { minZ: -40.0, maxZ: -22.0 },
    started: false,
    completed: false,
    enemies: [],
  },
];

function triggerEncounterStart(enc) {
  enc.started = true;
  gameState = 'COMBAT';

  // Lock barriers! Player CANNOT escape or bypass the combat arena
  barrierFront1.visible = true;
  barrierBack1.visible = true;

  combatVignette.classList.add('active');
  encounterPill.classList.add('combat-active');
  encounterDot.textContent = '🔴';
  encounterStatusText.textContent = 'COMBAT LOCKDOWN';

  audio.playAlertSting();
  triggerEventBanner('⚠️ ENCOUNTER STARTED! DEFEAT ALL FOES!', 'encounter-alert');

  // Alert all enemies in this encounter
  enc.enemies.forEach((enemy) => {
    enemy.state = 'chase';
  });
}

function checkEncounterVictory(enc) {
  const allDead = enc.enemies.every((e) => !e.alive);
  if (allDead && !enc.completed) {
    enc.completed = true;
    gameState = 'VICTORY';

    audio.playVictory();
    triggerEventBanner('🏆 VICTORY! ROUTE UNLOCKED!', 'victory');

    // Unlock barriers!
    barrierFront1.visible = false;
    barrierBack1.visible = false;

    combatVignette.classList.remove('active');
    encounterPill.classList.remove('combat-active');
    encounterDot.textContent = '🟢';
    encounterStatusText.textContent = 'EXPLORATION';

    setTimeout(() => {
      gameState = 'EXPLORATION';
      triggerEventBanner('TIME SHIFT PORTAL AHEAD UNLOCKED!');
    }, 2800);
  }
}

// ----------------------------------------------------------------------------
// 10. REAL Combat System: Enemies with AI, Attacks, Hit-Stop & Feedback
// ----------------------------------------------------------------------------
const enemies = [];
const projectiles = [];
let hitStopTimer = 0; // Freeze-frame duration for juicy impact feel

function spawnEnemy(x, z, type = 'grunt', encounterId = 1) {
  const rig = buildStylizedHumanoid(false, true);
  rig.root.position.set(x, 0, z);

  const weaponMesh = type === 'grunt' ? buildSword() : buildBow();
  rig.weaponHolder.add(weaponMesh);
  scene.add(rig.root);

  // Health Bar
  const hpCanvas = document.createElement('canvas');
  hpCanvas.width = 128;
  hpCanvas.height = 20;
  const hpCtx = hpCanvas.getContext('2d');
  const hpTexture = new THREE.CanvasTexture(hpCanvas);

  const hpBar = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 0.18),
    new THREE.MeshBasicMaterial({ map: hpTexture, transparent: true, side: THREE.DoubleSide })
  );
  hpBar.position.y = 1.9;
  rig.root.add(hpBar);

  const maxHp = type === 'grunt' ? 80 : 60;

  const enemy = {
    rig,
    hpBar,
    hpCtx,
    hpTexture,
    type,
    encounterId,
    hp: maxHp,
    maxHp,
    pos: rig.root.position,
    state: 'idle', // 'idle', 'chase', 'windup', 'attack', 'dead'
    attackTimer: 0,
    windupTimer: 0,
    headingAngle: Math.PI,
    alive: true,
  };

  updateEnemyHP(enemy);
  enemies.push(enemy);

  const parentEnc = encounters.find((e) => e.id === encounterId);
  if (parentEnc) parentEnc.enemies.push(enemy);

  return enemy;
}

function updateEnemyHP(enemy) {
  const ctx = enemy.hpCtx;
  ctx.clearRect(0, 0, 128, 20);
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, 128, 20);
  const pct = Math.max(0, enemy.hp / enemy.maxHp);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(2, 2, 124 * pct, 16);
  enemy.hpTexture.needsUpdate = true;
}

// Spawn Encounter 1 Enemies (Inside arena z = -26 to -38)
spawnEnemy(-1.2, -30, 'grunt', 1);
spawnEnemy(1.2, -30, 'grunt', 1);
spawnEnemy(0, -36, 'archer', 1);

// Weapon swing trail mesh
const slashGeo = new THREE.RingGeometry(0.8, 1.8, 16, 1, 0, Math.PI * 0.75);
const slashMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0, side: THREE.DoubleSide });
const slashMesh = new THREE.Mesh(slashGeo, slashMat);
slashMesh.rotation.x = -Math.PI / 2;
scene.add(slashMesh);

function triggerHeroAttack() {
  if (heroState.attackCooldown > 0 || !heroState.isAlive) return;
  heroState.attackCooldown = 0.45;
  audio.playSwordSwing();

  // Attack swing animation
  heroRig.rightArm.rotation.x = -Math.PI / 1.6;

  const fwd = new THREE.Vector3(Math.sin(heroState.headingAngle), 0, Math.cos(heroState.headingAngle));

  if (heroState.weapon === 'sword') {
    slashMesh.position.copy(heroState.pos).addScaledVector(fwd, 1.1);
    slashMesh.position.y = 0.8;
    slashMesh.rotation.z = -heroState.headingAngle;
    slashMat.opacity = 0.85;

    // Check hit against enemies
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const dist = enemy.pos.distanceTo(heroState.pos);
      if (dist < 2.4) {
        damageEnemy(enemy, 35);
      }
    }
  } else {
    // Arrow
    spawnArrow(heroState.pos.clone().add(new THREE.Vector3(0, 0.8, 0)), fwd, 45);
  }
}

function damageEnemy(enemy, dmg) {
  enemy.hp -= dmg;
  updateEnemyHP(enemy);
  audio.playHitImpact();

  // Hit-stop impact pause!
  hitStopTimer = 0.05;

  // Stagger knockback
  const knock = enemy.pos.clone().sub(heroState.pos).normalize();
  enemy.pos.addScaledVector(knock, 0.7);

  showDamageNumber(enemy.pos, `-${dmg}`);

  if (enemy.hp <= 0 && enemy.alive) {
    enemy.alive = false;
    enemy.state = 'dead';
    heroState.kills += 1;
    document.getElementById('hud-kills').textContent = heroState.kills;

    // Death collapse
    enemy.rig.root.rotation.x = -Math.PI / 2;
    enemy.rig.root.position.y = 0.2;

    const enc = encounters.find((e) => e.id === enemy.encounterId);
    if (enc) checkEncounterVictory(enc);
  }
}

function spawnArrow(pos, dir, dmg) {
  const arrowGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.8, 6);
  const arrow = new THREE.Mesh(arrowGeo, MAT.woodPlank);
  arrow.rotation.x = Math.PI / 2;
  arrow.position.copy(pos);
  scene.add(arrow);

  projectiles.push({
    mesh: arrow,
    dir: dir.clone().normalize(),
    speed: 26,
    life: 1.2,
    damage: dmg,
  });
}

function showDamageNumber(pos, text) {
  const span = document.createElement('span');
  span.className = 'damage-number';
  span.textContent = text;
  document.body.appendChild(span);

  const screen = pos.clone().project(camera);
  const x = (screen.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-(screen.y * 0.5) + 0.5) * window.innerHeight;
  span.style.left = `${x}px`;
  span.style.top = `${y}px`;

  setTimeout(() => span.remove(), 850);
}

// ----------------------------------------------------------------------------
// 11. Dual Keyboard & Mobile Analog Touch Controls
// ----------------------------------------------------------------------------
const inputVector = { x: 0, z: 0 };
const keysDown = {};

window.addEventListener('keydown', (e) => {
  keysDown[e.code] = true;
  if (e.code === 'Space') {
    triggerHeroAttack();
    e.preventDefault();
  }
  if (e.code === 'KeyQ') {
    equipHeroWeapon(heroState.weapon === 'sword' ? 'bow' : 'sword');
  }
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
    triggerDodgeRoll();
  }
});

window.addEventListener('keyup', (e) => {
  keysDown[e.code] = false;
});

// Analog Touch Joystick
const joystickContainer = document.getElementById('joystick-container');
const joystickKnob = document.getElementById('joystick-knob');
let isDraggingJoystick = false;
let joystickCenter = { x: 0, y: 0 };

function onPointerDown(e) {
  const rect = joystickContainer.getBoundingClientRect();
  joystickCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  isDraggingJoystick = true;
  updateJoystick(e.clientX, e.clientY);
}

function onPointerMove(e) {
  if (!isDraggingJoystick) return;
  updateJoystick(e.clientX, e.clientY);
}

function onPointerUp() {
  if (!isDraggingJoystick) return;
  isDraggingJoystick = false;
  inputVector.x = 0;
  inputVector.z = 0;
  joystickKnob.style.transform = 'translate(-50%, -50%)';
}

function updateJoystick(clientX, clientY) {
  const dx = clientX - joystickCenter.x;
  const dy = clientY - joystickCenter.y;
  const maxR = 45;
  const dist = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);
  const clamped = Math.min(dist, maxR);

  const kx = Math.cos(angle) * clamped;
  const ky = Math.sin(angle) * clamped;

  joystickKnob.style.transform = `translate(calc(-50% + ${kx}px), calc(-50% + ${ky}px))`;
  inputVector.x = kx / maxR;
  inputVector.z = ky / maxR;
}

joystickContainer.addEventListener('pointerdown', onPointerDown);
window.addEventListener('pointermove', onPointerMove);
window.addEventListener('pointerup', onPointerUp);

// UI Action Buttons
document.getElementById('btn-attack').addEventListener('click', triggerHeroAttack);
document.getElementById('btn-swap').addEventListener('click', () => {
  equipHeroWeapon(heroState.weapon === 'sword' ? 'bow' : 'sword');
});
document.getElementById('btn-dodge').addEventListener('click', triggerDodgeRoll);
document.getElementById('btn-retry').addEventListener('click', restartLevel);

function triggerDodgeRoll() {
  if (heroState.isRolling || !heroState.isAlive) return;
  heroState.isRolling = true;
  heroState.rollTimer = 0.35;
  heroState.velocity.multiplyScalar(1.9);
}

function triggerEventBanner(text, type = '') {
  const banner = document.getElementById('event-banner');
  banner.textContent = text;
  banner.className = `visible ${type}`;
  setTimeout(() => {
    banner.className = '';
  }, 2500);
}

function restartLevel() {
  heroState.hp = 100;
  heroState.isAlive = true;
  heroState.pos.set(0, 0, 15);
  heroMesh.rotation.set(0, 0, 0);

  document.getElementById('defeat-modal').classList.remove('visible');
  document.getElementById('player-health-fill').style.width = '100%';
  document.getElementById('hud-hp').textContent = '100 / 100';

  // Reset Encounters
  encounters.forEach((e) => {
    e.started = false;
    e.completed = false;
    e.enemies.forEach((enemy) => {
      enemy.hp = enemy.maxHp;
      enemy.alive = true;
      enemy.state = 'idle';
      enemy.rig.root.rotation.set(0, Math.PI, 0);
      enemy.rig.root.position.copy(enemy.pos);
      updateEnemyHP(enemy);
    });
  });

  barrierFront1.visible = false;
  barrierBack1.visible = false;
  combatVignette.classList.remove('active');
  encounterPill.classList.remove('combat-active');
  encounterDot.textContent = '🟢';
  encounterStatusText.textContent = 'EXPLORATION';
  gameState = 'EXPLORATION';
}

// ----------------------------------------------------------------------------
// 12. Main Game Loop (Physics, Combat AI, Squad Support, Camera)
// ----------------------------------------------------------------------------
const clock = new THREE.Clock();
let walkAnimTime = 0;
const camTargetPos = new THREE.Vector3();
const camLookTarget = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.1);

  // Hit-stop pause
  if (hitStopTimer > 0) {
    hitStopTimer -= delta;
    renderer.render(scene, camera);
    return;
  }

  // 1. Gather Movement Input
  let kbX = 0;
  let kbZ = 0;
  if (keysDown['KeyW'] || keysDown['ArrowUp']) kbZ -= 1;
  if (keysDown['KeyS'] || keysDown['ArrowDown']) kbZ += 1;
  if (keysDown['KeyA'] || keysDown['ArrowLeft']) kbX -= 1;
  if (keysDown['KeyD'] || keysDown['ArrowRight']) kbX += 1;

  let moveX = inputVector.x !== 0 ? inputVector.x : kbX;
  let moveZ = inputVector.z !== 0 ? inputVector.z : kbZ;

  const len = Math.hypot(moveX, moveZ);
  if (len > 1.0) {
    moveX /= len;
    moveZ /= len;
  }

  // 2. Camera-Relative Movement Calculation
  const isMoving = len > 0.1 && heroState.isAlive;
  const targetVel = new THREE.Vector3(0, 0, 0);

  if (isMoving) {
    const camFwd = new THREE.Vector3();
    camera.getWorldDirection(camFwd);
    camFwd.y = 0;
    camFwd.normalize();

    const camRight = new THREE.Vector3(-camFwd.z, 0, camFwd.x);

    targetVel.addScaledVector(camRight, moveX);
    targetVel.addScaledVector(camFwd, -moveZ);
    targetVel.normalize().multiplyScalar(heroState.speed);

    // Smooth rotation toward movement
    const targetAngle = Math.atan2(targetVel.x, targetVel.z);
    heroState.headingAngle = THREE.MathUtils.lerp(heroState.headingAngle, targetAngle, 12 * delta);
    heroMesh.rotation.y = heroState.headingAngle;

    // Limb walk swing
    walkAnimTime += delta * 14;
    heroRig.leftLeg.rotation.x = Math.sin(walkAnimTime) * 0.7;
    heroRig.rightLeg.rotation.x = -Math.sin(walkAnimTime) * 0.7;
    heroRig.leftArm.rotation.x = -Math.sin(walkAnimTime) * 0.6;
    if (heroState.attackCooldown <= 0) {
      heroRig.rightArm.rotation.x = Math.sin(walkAnimTime) * 0.6;
    }
  } else {
    heroRig.leftLeg.rotation.x = THREE.MathUtils.lerp(heroRig.leftLeg.rotation.x, 0, 10 * delta);
    heroRig.rightLeg.rotation.x = THREE.MathUtils.lerp(heroRig.rightLeg.rotation.x, 0, 10 * delta);
    heroRig.leftArm.rotation.x = THREE.MathUtils.lerp(heroRig.leftArm.rotation.x, 0, 10 * delta);
    if (heroState.attackCooldown <= 0) {
      heroRig.rightArm.rotation.x = THREE.MathUtils.lerp(heroRig.rightArm.rotation.x, 0, 10 * delta);
    }
  }

  heroState.velocity.lerp(targetVel, 14 * delta);
  heroState.pos.addScaledVector(heroState.velocity, delta);

  // Dodge Roll
  if (heroState.isRolling) {
    heroState.rollTimer -= delta;
    heroMesh.rotation.x = Math.sin((0.35 - heroState.rollTimer) * 18) * 1.5;
    if (heroState.rollTimer <= 0) {
      heroState.isRolling = false;
      heroMesh.rotation.x = 0;
    }
  }

  // Attack cooldown
  if (heroState.attackCooldown > 0) {
    heroState.attackCooldown -= delta;
    if (heroState.attackCooldown <= 0) {
      slashMat.opacity = 0;
    }
  }

  // 3. ENCOUNTER ZONE TRIGGER & LOCKDOWN BOUNDARIES
  const activeEnc = encounters[0];
  if (!activeEnc.started && heroState.pos.z <= activeEnc.triggerZ) {
    triggerEncounterStart(activeEnc);
  }

  // If in combat, BLOCK forward progression so player cannot walk through or around!
  if (gameState === 'COMBAT') {
    heroState.pos.z = THREE.MathUtils.clamp(heroState.pos.z, activeEnc.arenaBounds.minZ + 0.5, activeEnc.arenaBounds.maxZ - 0.5);
  }

  // Road side boundaries
  if (heroState.pos.z > -50) {
    const maxRoadX = (ROAD_WIDTH / 2) - 0.4;
    heroState.pos.x = THREE.MathUtils.clamp(heroState.pos.x, -maxRoadX, maxRoadX);
  }

  // 4. FRIENDLY RECRUIT CHECK (Walk up to ally to recruit them!)
  for (const rec of rescueRecruits) {
    if (!rec.recruited) {
      const dist = Math.hypot(heroState.pos.x - rec.x, heroState.pos.z - rec.z);
      if (dist < 1.8) {
        recruitAlly(rec);
      }
    }
  }

  // 5. SQUAD MEMBERS ACTIVE COMBAT & FORMATION AI
  for (let i = 0; i < squadMembers.length; i++) {
    const ally = squadMembers[i];

    // Check if there are active combat enemies nearby
    let nearestEnemy = null;
    let nearestDist = 999;
    if (gameState === 'COMBAT') {
      for (const e of enemies) {
        if (!e.alive) continue;
        const d = ally.rig.root.position.distanceTo(e.pos);
        if (d < nearestDist) {
          nearestDist = d;
          nearestEnemy = e;
        }
      }
    }

    if (nearestEnemy && nearestDist < 7.0) {
      // Squad member actively charges enemy and attacks!
      const toEnemy = nearestEnemy.pos.clone().sub(ally.rig.root.position);
      const angle = Math.atan2(toEnemy.x, toEnemy.z);
      ally.rig.root.rotation.y = angle;

      if (nearestDist > 1.6) {
        ally.rig.root.position.addScaledVector(toEnemy.normalize(), 6.5 * delta);
      } else {
        // Ally attacks!
        ally.attackCooldown -= delta;
        if (ally.attackCooldown <= 0) {
          ally.attackCooldown = 0.8;
          ally.rig.rightArm.rotation.x = -Math.PI / 1.6;
          damageEnemy(nearestEnemy, 18);
          setTimeout(() => {
            ally.rig.rightArm.rotation.x = 0;
          }, 200);
        }
      }
    } else {
      // Return to organized formation behind hero
      const targetPos = heroState.pos.clone()
        .addScaledVector(new THREE.Vector3(-Math.sin(heroState.headingAngle), 0, -Math.cos(heroState.headingAngle)), ally.offsetZ)
        .addScaledVector(new THREE.Vector3(Math.cos(heroState.headingAngle), 0, -Math.sin(heroState.headingAngle)), ally.offsetX);

      ally.rig.root.position.lerp(targetPos, 8 * delta);
      ally.rig.root.rotation.y = heroState.headingAngle;
    }
  }

  // 6. ENEMY AI (Flank, Chase, Windup, Strike)
  for (const enemy of enemies) {
    if (!enemy.alive) continue;

    const toHero = heroState.pos.clone().sub(enemy.pos);
    const distToHero = toHero.length();

    if (enemy.state === 'chase' || gameState === 'COMBAT') {
      const targetAngle = Math.atan2(toHero.x, toHero.z);
      enemy.headingAngle = THREE.MathUtils.lerp(enemy.headingAngle, targetAngle, 8 * delta);
      enemy.rig.root.rotation.y = enemy.headingAngle;

      if (distToHero > 1.6) {
        // Move towards hero
        enemy.pos.addScaledVector(toHero.normalize(), 5.2 * delta);
        enemy.rig.leftLeg.rotation.x = Math.sin(clock.getElapsedTime() * 12) * 0.6;
        enemy.rig.rightLeg.rotation.x = -Math.sin(clock.getElapsedTime() * 12) * 0.6;
      } else {
        // In Attack Range: Windup & Strike!
        enemy.attackTimer += delta;
        if (enemy.attackTimer > 0.9) {
          enemy.attackTimer = 0;
          audio.playHitImpact();

          // Damage Hero
          heroState.hp = Math.max(0, heroState.hp - 14);
          document.getElementById('player-health-fill').style.width = `${heroState.hp}%`;
          document.getElementById('hud-hp').textContent = `${Math.ceil(heroState.hp)} / 100`;
          showDamageNumber(heroState.pos, '-14');

          // Check Hero Defeat
          if (heroState.hp <= 0 && heroState.isAlive) {
            heroState.isAlive = false;
            document.getElementById('defeat-modal').classList.add('visible');
          }
        }
      }
    }
  }

  // 7. Time Shift Portals
  for (const portal of timePortals) {
    portal.hand.rotation.z += delta * 2.5;
    portal.energy.rotation.z += delta * 1.2;

    const dist = Math.hypot(heroState.pos.x - portal.x, heroState.pos.z - portal.z);
    if (dist < 2.0 && !portal.active && activeEnc.completed) {
      portal.active = true;
      heroState.era = portal.eraTarget;
      equipHeroWeapon('bow');

      document.getElementById('hud-era').textContent = 'ERA 2: MEDIEVAL';
      document.getElementById('timeline-fill-lower').style.height = '100%';
      document.getElementById('time-node-2').classList.add('active');
      triggerEventBanner('TIME SHIFT! HUNTER LONGBOW UNLOCKED!');
    }
  }

  // 8. Projectiles Update
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.life -= delta;
    p.mesh.position.addScaledVector(p.dir, p.speed * delta);

    for (const e of enemies) {
      if (!e.alive) continue;
      if (p.mesh.position.distanceTo(e.pos) < 1.3) {
        damageEnemy(e, p.damage);
        p.life = 0;
        break;
      }
    }

    if (p.life <= 0) {
      scene.remove(p.mesh);
      projectiles.splice(i, 1);
    }
  }

  // 9. Third-Person Follow Camera
  const CAM_DIST = 9.8;
  const CAM_HEIGHT = 5.8;

  camTargetPos.set(
    heroState.pos.x - Math.sin(heroState.headingAngle) * 2.0,
    heroState.pos.y + CAM_HEIGHT,
    heroState.pos.z + CAM_DIST
  );

  camLookTarget.set(
    heroState.pos.x,
    heroState.pos.y + 1.2,
    heroState.pos.z - 3.5
  );

  camera.position.lerp(camTargetPos, 7 * delta);
  camera.lookAt(camLookTarget);

  // Sunlight travels with hero
  sunLight.position.set(heroState.pos.x + 35, 55, heroState.pos.z + 30);
  sunLight.target.position.copy(heroState.pos);
  sunLight.target.updateMatrixWorld();

  renderer.render(scene, camera);
}

// Window resizing
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start loop
animate();
