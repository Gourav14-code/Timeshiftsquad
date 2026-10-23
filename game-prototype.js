/**
 * ============================================================================
 * TIME SHIFT SQUAD - Math Gates & Final Squad Battle
 * File: main.js
 * ============================================================================
 * Features:
 * 1. Starting Gameplay:
 *    - Exactly ONE player character at level start.
 *    - No automatic forward runner; moves only on joystick / WASD input.
 *    - Smooth third-person elevated follow camera.
 * 2. Math Gates:
 *    - Pairs of 3D gates (+5, +10, -3, x2) placed along the path.
 *    - Prominent mathematical operator and value textures.
 *    - Detects chosen side and executes exactly once with floating feedback.
 *    - Adds or removes teammates safely, clamping squad count to min 1.
 *    - Maintains stable, orderly grid formation behind the leader.
 * 3. Final Squad Battle Encounter:
 *    - Enemy squad blocks progression at the end of the track.
 *    - Individual health bars with numeric values (e.g. 100/100) above EVERY character!
 *    - Real automatic clash when squads meet: targeting, movement, sword swings,
 *      hit reactions, impact sparks, and real health depletion.
 *    - Outcome: LEVEL COMPLETE on victory or GAME OVER on defeat.
 */

import * as THREE from 'three';

// ----------------------------------------------------------------------------
// 1. Procedural Web Audio Sound Synthesizer (Zero External Dependencies)
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
      // Audio optional
    }
  }

  playGatePositive() {
    if (!this.ctx) return;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime + i * 0.07;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  playGateNegative() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  playSwordSwing() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(90, this.ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  playHitPunch() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(35, this.ctx.currentTime + 0.14);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.14);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.14);
  }

  playVictoryFanfare() {
    if (!this.ctx) return;
    const chords = [523.25, 659.25, 783.99, 1046.5];
    chords.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime + idx * 0.12;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  }

  playDefeatSting() {
    if (!this.ctx) return;
    const notes = [350, 311, 277, 220];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime + idx * 0.18;
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  }
}

const audio = new SoundSystem();
window.addEventListener('pointerdown', () => audio.init(), { once: true });
window.addEventListener('keydown', () => audio.init(), { once: true });

// ----------------------------------------------------------------------------
// 2. Three.js Scene, Camera & Lighting Setup
// ----------------------------------------------------------------------------
const scene = new THREE.Scene();
const SKY_COLOR = 0x87ceeb;
scene.background = new THREE.Color(SKY_COLOR);
scene.fog = new THREE.FogExp2(SKY_COLOR, 0.0075);

const container = document.getElementById('game-container');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
container.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(56, window.innerWidth / window.innerHeight, 0.1, 600);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xfff7ed, 1.35);
sunLight.position.set(30, 50, 25);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 1.0;
sunLight.shadow.camera.far = 240;
sunLight.shadow.camera.left = -45;
sunLight.shadow.camera.right = 45;
sunLight.shadow.camera.top = 45;
sunLight.shadow.camera.bottom = -45;
sunLight.shadow.bias = -0.0004;
scene.add(sunLight);

const hemiLight = new THREE.HemisphereLight(0xb1e1ff, 0x48bb78, 0.45);
scene.add(hemiLight);

// ----------------------------------------------------------------------------
// 3. Materials & 3D Environment (Mountain Backdrop, Rolling Meadow, Trees)
// ----------------------------------------------------------------------------
const MAT = {
  skinHero: new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.35 }), // Yellow hero skin
  skinEnemy: new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 }), // Crimson enemy skin
  armorHero: new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6, roughness: 0.3 }),
  armorEnemy: new THREE.MeshStandardMaterial({ color: 0x1e1b4b, metalness: 0.5, roughness: 0.4 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.8, roughness: 0.2 }),
  crest: new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 }),
  woodPlank: new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.7 }),
  woodPost: new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 }),
  stoneRoad: new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.55 }),
  mountain: new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 }),
  mountainSnow: new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.8 }),
  treeTrunk: new THREE.MeshStandardMaterial({ color: 0x543212, roughness: 0.8 }),
  treeFoliage: new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.6 }),
  blade: new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 0.8, roughness: 0.2 }),
};

// Ground meadow
const groundGeo = new THREE.PlaneGeometry(600, 600);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.95 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.set(0, -0.05, -60);
ground.receiveShadow = true;
scene.add(ground);

// Distant low-poly mountains
function spawnMountain(x, z, scale = 1.0) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);

  const baseMesh = new THREE.Mesh(new THREE.ConeGeometry(24 * scale, 34 * scale, 7), MAT.mountain);
  baseMesh.position.y = 17 * scale;
  g.add(baseMesh);

  const capMesh = new THREE.Mesh(new THREE.ConeGeometry(9 * scale, 12 * scale, 7), MAT.mountainSnow);
  capMesh.position.y = 28 * scale;
  g.add(capMesh);

  scene.add(g);
}

for (let a = 0; a < Math.PI * 2; a += 0.4) {
  const dist = 180 + Math.random() * 40;
  spawnMountain(Math.cos(a) * dist, Math.sin(a) * dist - 60, 0.9 + Math.random() * 0.5);
}

// Low-poly conical trees
function spawnTree(x, z, scale = 1.0) {
  const tree = new THREE.Group();
  tree.position.set(x, 0, z);

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.24 * scale, 0.34 * scale, 1.8 * scale, 6), MAT.treeTrunk);
  trunk.position.y = 0.9 * scale;
  trunk.castShadow = true;
  tree.add(trunk);

  for (let i = 0; i < 3; i++) {
    const foliage = new THREE.Mesh(new THREE.ConeGeometry((1.5 - i * 0.3) * scale, 1.6 * scale, 6), MAT.treeFoliage);
    foliage.position.y = (1.8 + i * 0.9) * scale;
    foliage.castShadow = true;
    tree.add(foliage);
  }
  scene.add(tree);
}

for (let z = 25; z > -150; z -= 11) {
  spawnTree(-8 - Math.random() * 7, z + (Math.random() - 0.5) * 4, 0.8 + Math.random() * 0.4);
  spawnTree(8 + Math.random() * 7, z + (Math.random() - 0.5) * 4, 0.8 + Math.random() * 0.4);
}

// ----------------------------------------------------------------------------
// 4. Running Track & Wooden Fence Railings
// ----------------------------------------------------------------------------
const ROAD_WIDTH = 6.2;
const TRACK_LENGTH = 160;

// Main continuous stone pathway (z = +25 down to -135)
const trackMesh = new THREE.Mesh(new THREE.BoxGeometry(ROAD_WIDTH, 0.12, TRACK_LENGTH), MAT.stoneRoad);
trackMesh.position.set(0, 0.06, -55);
trackMesh.receiveShadow = true;
scene.add(trackMesh);

// Wooden side plank walkways
const leftWalk = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.14, TRACK_LENGTH), MAT.woodPlank);
leftWalk.position.set(-ROAD_WIDTH / 2 + 0.4, 0.07, -55);
leftWalk.receiveShadow = true;
scene.add(leftWalk);

function buildFence(x, zStart, zEnd) {
  const group = new THREE.Group();
  const len = Math.abs(zEnd - zStart);
  const spacing = 2.4;
  const numPosts = Math.floor(len / spacing);

  const postGeo = new THREE.CylinderGeometry(0.12, 0.14, 1.1, 8);
  const railGeo = new THREE.BoxGeometry(0.1, 0.12, spacing + 0.1);

  for (let i = 0; i <= numPosts; i++) {
    const p = new THREE.Mesh(postGeo, MAT.woodPost);
    p.position.set(0, 0.55, -i * spacing);
    p.castShadow = true;
    group.add(p);

    if (i < numPosts) {
      const r1 = new THREE.Mesh(railGeo, MAT.woodPlank);
      r1.position.set(0, 0.88, -(i + 0.5) * spacing);
      r1.castShadow = true;
      group.add(r1);

      const r2 = new THREE.Mesh(railGeo, MAT.woodPlank);
      r2.position.set(0, 0.48, -(i + 0.5) * spacing);
      r2.castShadow = true;
      group.add(r2);
    }
  }

  group.position.set(x, 0, zStart);
  scene.add(group);
}

buildFence(-ROAD_WIDTH / 2, 25, -135);
buildFence(ROAD_WIDTH / 2, 25, -135);

// ----------------------------------------------------------------------------
// 5. Stylized 3D Humanoid Rig with Readable Overhead Health Bar
// ----------------------------------------------------------------------------
function buildHumanoidCharacter(isLeader = false, isEnemy = false, maxHp = 100) {
  const root = new THREE.Group();
  const skinMat = isEnemy ? MAT.skinEnemy : MAT.skinHero;
  const armorMat = isEnemy ? MAT.armorEnemy : MAT.armorHero;

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), skinMat);
  head.position.y = 1.35;
  head.castShadow = true;
  root.add(head);

  // Helmet with crest for Squad Leader
  if (isLeader) {
    const helm = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.35, 0.32, 16), armorMat);
    helm.position.y = 1.45;
    helm.castShadow = true;
    root.add(helm);

    const crest = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.24, 0.45), MAT.crest);
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

  // Arms
  const armGeo = new THREE.CapsuleGeometry(0.09, 0.4, 6, 8);
  const leftArm = new THREE.Mesh(armGeo, skinMat);
  leftArm.position.set(-0.38, 0.75, 0);
  root.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, skinMat);
  rightArm.position.set(0.38, 0.75, 0);
  root.add(rightArm);

  // Legs
  const legGeo = new THREE.CapsuleGeometry(0.1, 0.42, 6, 8);
  const leftLeg = new THREE.Mesh(legGeo, skinMat);
  leftLeg.position.set(-0.16, 0.28, 0);
  root.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, skinMat);
  rightLeg.position.set(0.16, 0.28, 0);
  root.add(rightLeg);

  // Sword weapon
  const weaponHolder = new THREE.Group();
  weaponHolder.position.set(0.42, 0.65, -0.2);

  const sword = new THREE.Group();
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.8, 0.04), MAT.blade);
  blade.position.y = 0.4;
  blade.castShadow = true;
  sword.add(blade);

  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.08), MAT.gold);
  guard.position.y = 0.02;
  sword.add(guard);

  const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.2, 8), MAT.woodPost);
  hilt.position.y = -0.1;
  sword.add(hilt);

  sword.rotation.x = Math.PI / 3;
  weaponHolder.add(sword);
  root.add(weaponHolder);

  // Overhead Canvas Billboard Health Bar
  // For enemies: Slim visual health bar (red fill), NO numeric text labels (per Bug 2 requirement).
  // For players: Health is already prominently displayed on the top HUD.
  let hpBillboard = null;
  let hpTexture = null;
  let hpCanvas = null;
  let hpCtx = null;

  if (isEnemy) {
    hpCanvas = document.createElement('canvas');
    hpCanvas.width = 128;
    hpCanvas.height = 16;
    hpCtx = hpCanvas.getContext('2d');
    hpTexture = new THREE.CanvasTexture(hpCanvas);

    hpBillboard = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 0.15),
      new THREE.MeshBasicMaterial({ map: hpTexture, transparent: true, side: THREE.DoubleSide })
    );
    hpBillboard.position.y = 2.05;
    root.add(hpBillboard);
  }

  const character = {
    root,
    head,
    torso,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    weaponHolder,
    sword,
    hpBillboard,
    hpCanvas,
    hpCtx,
    hpTexture,
    isLeader,
    isEnemy,
    hp: maxHp,
    maxHp,
    alive: true,
    target: null,
    attackCooldown: Math.random() * 0.4,
    walkPhase: Math.random() * Math.PI * 2,
    hitFlashTimer: 0,
  };

  updateCharacterHealthBillboard(character);
  return character;
}

function updateCharacterHealthBillboard(char) {
  if (!char || !char.hpBillboard || !char.hpCtx) return;
  const ctx = char.hpCtx;
  ctx.clearRect(0, 0, 128, 16);

  // Background frame
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.roundRect(1, 1, 126, 14, 4);
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#ef4444';
  ctx.stroke();

  // Health fill (pure visual bar - NO numeric text drawn per Bug 2)
  const pct = Math.max(0, Math.min(1, char.hp / char.maxHp));
  const fillWidth = Math.max(0, 122 * pct);
  ctx.fillStyle = '#ef4444';
  ctx.roundRect(3, 3, fillWidth, 10, 2);
  ctx.fill();

  char.hpTexture.needsUpdate = true;
}

// ----------------------------------------------------------------------------
// 6. Starting Character: Exactly ONE Player
// ----------------------------------------------------------------------------
const heroLeader = buildHumanoidCharacter(true, false, 150);
heroLeader.root.position.set(0, 0, 15);
scene.add(heroLeader.root);

// Player state
const playerState = {
  pos: heroLeader.root.position,
  velocity: new THREE.Vector3(0, 0, 0),
  speed: 13.5,
  headingAngle: 0,
  isRolling: false,
  rollTimer: 0,
};

// Squad followers list (starts completely EMPTY, as required!)
const squadMembers = [];

function updateHUDCounts() {
  const livingFollowers = squadMembers.filter((m) => m.alive).length;
  const currentLivingCount = (heroLeader.alive ? 1 : 0) + livingFollowers;
  document.getElementById('hud-squad-count').textContent = `SQUAD: ${currentLivingCount}`;

  // Calculate real total player squad health
  let totalHeroHp = heroLeader.alive ? heroLeader.hp : 0;
  let totalHeroMax = heroLeader.maxHp;

  squadMembers.forEach((m) => {
    totalHeroMax += m.maxHp;
    if (m.alive) {
      totalHeroHp += m.hp;
    }
  });

  document.getElementById('hud-hero-hp').textContent = `${Math.ceil(totalHeroHp)} / ${totalHeroMax}`;
  const heroPct = totalHeroMax > 0 ? (totalHeroHp / totalHeroMax) * 100 : 0;
  document.getElementById('hero-hp-fill').style.width = `${heroPct}%`;

  // Calculate real enemy army health
  let totalEnemyHp = 0;
  let totalEnemyMax = 0;
  let livingEnemies = 0;

  enemySquad.forEach((e) => {
    totalEnemyMax += e.maxHp;
    if (e.alive) {
      totalEnemyHp += e.hp;
      livingEnemies++;
    }
  });

  document.getElementById('hud-enemy-count').textContent = `ENEMIES: ${livingEnemies}`;
  document.getElementById('hud-enemy-hp').textContent = `${Math.ceil(totalEnemyHp)} / ${totalEnemyMax}`;
  const enemyPct = totalEnemyMax > 0 ? (totalEnemyHp / totalEnemyMax) * 100 : 0;
  document.getElementById('enemy-hp-fill').style.width = `${enemyPct}%`;
}

// ----------------------------------------------------------------------------
// 7. Math Gates System (+5, +10, -3, ×2)
// ----------------------------------------------------------------------------
function createGateTexture(text, isPositive) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  if (isPositive) {
    grad.addColorStop(0, '#0284c7');
    grad.addColorStop(1, '#0369a1');
  } else {
    grad.addColorStop(0, '#dc2626');
    grad.addColorStop(1, '#991b1b');
  }
  ctx.fillStyle = grad;
  ctx.roundRect(14, 14, 484, 228, 28);
  ctx.fill();

  ctx.lineWidth = 10;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 84px "Segoe UI", Arial, sans-serif';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 14;
  ctx.fillText(text, 256, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createSingleGateMesh(text, isPositive, posX) {
  const group = new THREE.Group();
  group.position.x = posX;

  const width = 2.8;
  const height = 2.6;

  // Frame posts
  const postMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.3 });
  const postGeo = new THREE.BoxGeometry(0.14, height, 0.14);

  const lp = new THREE.Mesh(postGeo, postMat);
  lp.position.set(-width / 2, height / 2, 0);
  group.add(lp);

  const rp = new THREE.Mesh(postGeo, postMat);
  rp.position.set(width / 2, height / 2, 0);
  group.add(rp);

  const topBar = new THREE.Mesh(new THREE.BoxGeometry(width + 0.14, 0.16, 0.16), postMat);
  topBar.position.set(0, height + 0.08, 0);
  group.add(topBar);

  // Glowing energy barrier
  const barrierMat = new THREE.MeshStandardMaterial({
    color: isPositive ? 0x0ea5e9 : 0xef4444,
    transparent: true,
    opacity: 0.65,
    roughness: 0.1,
    side: THREE.DoubleSide,
  });
  const barrier = new THREE.Mesh(new THREE.PlaneGeometry(width - 0.08, height - 0.08), barrierMat);
  barrier.position.set(0, height / 2, 0);
  group.add(barrier);

  // Gate Label
  const labelTex = createGateTexture(text, isPositive);
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(2.35, 1.15),
    new THREE.MeshBasicMaterial({ map: labelTex, transparent: true, side: THREE.DoubleSide })
  );
  label.position.set(0, height / 2, 0.035);
  group.add(label);

  return group;
}

function createMathGatePair(z, leftCfg, rightCfg) {
  const pairGroup = new THREE.Group();
  pairGroup.position.set(0, 0, z);

  const leftGateMesh = createSingleGateMesh(leftCfg.label, leftCfg.isPositive, -1.5);
  const rightGateMesh = createSingleGateMesh(rightCfg.label, rightCfg.isPositive, 1.5);

  pairGroup.add(leftGateMesh);
  pairGroup.add(rightGateMesh);
  scene.add(pairGroup);

  return {
    group: pairGroup,
    z,
    left: leftCfg,
    right: rightCfg,
    triggered: false,
  };
}

// Gate Pairs on the track:
// IMPORTANT RULES ENFORCED:
// 1. Every pair contains exactly ONE positive (+) gate and ONE negative (-) gate.
// 2. Never place two negative gates side by side.
// 3. Positive gate's position alternates between Left and Right across successive pairs.
// 4. Positive gates use (+), negative gates use (-). No multiplication gates anywhere.
//
// Pair 1 (z = -20): Left +5 | Right -3   (Positive on LEFT)
// Pair 2 (z = -50): Left -4 | Right +4   (Positive on RIGHT - Alternated!)
// Pair 3 (z = -80): Left +2 | Right -3   (Positive on LEFT - Alternated! Final pair before enemy battle)
const mathGatePairs = [
  createMathGatePair(-20, { op: 'add', val: 5, label: '+5', isPositive: true }, { op: 'sub', val: 3, label: '-3', isPositive: false }),
  createMathGatePair(-50, { op: 'sub', val: 4, label: '-4', isPositive: false }, { op: 'add', val: 4, label: '+4', isPositive: true }),
  createMathGatePair(-80, { op: 'add', val: 2, label: '+2', isPositive: true }, { op: 'sub', val: 3, label: '-3', isPositive: false }),
];

// Helper: Formation slot positions for followers behind leader
function getFormationSlot(index) {
  const colIndex = index % 3;
  const row = Math.floor(index / 3) + 1;
  const colOffsets = [-0.95, 0.95, 0.0];
  return {
    offsetX: colOffsets[colIndex],
    offsetZ: 1.1 + row * 1.15,
  };
}

function applyMathGate(cfg, posX) {
  let currentSquad = 1 + squadMembers.length;
  let targetSquad = currentSquad;

  if (cfg.op === 'add') {
    targetSquad += cfg.val;
    audio.playGatePositive();
    showFloatingFeedback(new THREE.Vector3(posX, 2.5, playerState.pos.z), `+${cfg.val} SQUAD`, true);
    triggerAnnouncement(`SQUAD INCREASED! +${cfg.val}`, 'positive');
  } else if (cfg.op === 'mul') {
    targetSquad *= cfg.val;
    audio.playGatePositive();
    showFloatingFeedback(new THREE.Vector3(posX, 2.5, playerState.pos.z), `×${cfg.val} SQUAD!`, true);
    triggerAnnouncement(`SQUAD MULTIPLIED! ×${cfg.val}`, 'positive');
  } else if (cfg.op === 'sub') {
    targetSquad = Math.max(1, targetSquad - cfg.val);
    audio.playGateNegative();
    showFloatingFeedback(new THREE.Vector3(posX, 2.5, playerState.pos.z), `-${cfg.val} SQUAD`, false);
    triggerAnnouncement(`SQUAD REDUCED! -${cfg.val}`, 'negative');
  }

  // Adjust squad followers
  const targetFollowers = targetSquad - 1;

  if (squadMembers.length < targetFollowers) {
    const toAdd = targetFollowers - squadMembers.length;
    for (let i = 0; i < toAdd; i++) {
      const follower = buildHumanoidCharacter(false, false, 100);
      follower.root.position.copy(playerState.pos);
      scene.add(follower.root);
      squadMembers.push(follower);
    }
  } else if (squadMembers.length > targetFollowers) {
    const toRemove = squadMembers.length - targetFollowers;
    for (let i = 0; i < toRemove; i++) {
      const removed = squadMembers.pop();
      if (removed) scene.remove(removed.root);
    }
  }

  updateHUDCounts();
}

function showFloatingFeedback(worldPos, text, isPositive) {
  const span = document.createElement('span');
  span.className = `floating-text ${isPositive ? 'floating-gate-positive' : 'floating-gate-negative'}`;
  span.textContent = text;
  document.body.appendChild(span);

  const screen = worldPos.clone().project(camera);
  const x = (screen.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-(screen.y * 0.5) + 0.5) * window.innerHeight;
  span.style.left = `${x}px`;
  span.style.top = `${y}px`;

  setTimeout(() => span.remove(), 850);
}

function triggerAnnouncement(text, type = '') {
  const banner = document.getElementById('announcement-banner');
  banner.textContent = text;
  banner.className = `visible ${type}`;
  setTimeout(() => {
    banner.className = '';
  }, 2200);
}

// ----------------------------------------------------------------------------
// 8. Final Enemy Squad & Battle Arena
// ----------------------------------------------------------------------------
const enemySquad = [];
const BATTLE_TRIGGER_Z = -98.0;
const ARENA_CENTER_Z = -112.0;

// Arena blocking barrier behind enemy squad
const arenaBarrier = new THREE.Mesh(
  new THREE.BoxGeometry(ROAD_WIDTH, 3.5, 0.2),
  new THREE.MeshStandardMaterial({ color: 0xef4444, transparent: true, opacity: 0.7, side: THREE.DoubleSide })
);
arenaBarrier.position.set(0, 1.75, -132);
scene.add(arenaBarrier);

// Battle statistics for combat logging & verification
const battleStats = {
  heroDamageDealt: 0,
  enemyDamageDealt: 0,
};

// Spawn 1 Enemy Captain (140 HP) + 7 Warriors (45 HP each) -> Total 455 HP (8 enemies)
// Balanced so that picking positive gates (10-12 soldiers = 1,150-1,250 HP) easily triumphs over the enemy army,
// whereas a weak route (1-2 soldiers = 150-250 HP) results in defeat.
function initEnemySquad() {
  // Warlord Captain in center front at Z = -116
  const captain = buildHumanoidCharacter(false, true, 140);
  captain.root.scale.set(1.3, 1.3, 1.3);
  captain.root.position.set(0, 0, -116);
  captain.root.rotation.y = 0; // Facing incoming player (towards +Z)
  scene.add(captain.root);
  enemySquad.push(captain);

  // 7 Warriors in 2 rows behind captain:
  const warriorConfigs = [
    { x: -1.6, z: -119 },
    { x: -0.55, z: -119 },
    { x: 0.55, z: -119 },
    { x: 1.6, z: -119 },
    { x: -1.1, z: -122 },
    { x: 0.0, z: -122 },
    { x: 1.1, z: -122 },
  ];

  warriorConfigs.forEach((cfg) => {
    const warrior = buildHumanoidCharacter(false, true, 45);
    warrior.root.position.set(cfg.x, 0, cfg.z);
    warrior.root.rotation.y = 0; // Facing incoming player
    scene.add(warrior.root);
    enemySquad.push(warrior);
  });

  updateHUDCounts();
}

initEnemySquad();

// ----------------------------------------------------------------------------
// 9. Combat Simulation State Machine
// ----------------------------------------------------------------------------
let battleActive = false;
let battleResolved = false;

function startFinalBattle() {
  if (battleActive || battleResolved) return;
  battleActive = true;
  battleStats.heroDamageDealt = 0;
  battleStats.enemyDamageDealt = 0;

  document.getElementById('hud').classList.add('battle-mode');
  triggerAnnouncement('⚔️ FINAL SQUAD BATTLE ENGAGED!', 'battle');

  // Calculate stats for debug log
  const allLivingHeroes = [heroLeader, ...squadMembers].filter((h) => h.alive && h.hp > 0);
  const allLivingEnemies = enemySquad.filter((e) => e.alive && e.hp > 0);
  const totalHeroHp = allLivingHeroes.reduce((sum, h) => sum + h.hp, 0);
  const totalHeroMax = allLivingHeroes.reduce((sum, h) => sum + h.maxHp, 0);
  const totalEnemyHp = allLivingEnemies.reduce((sum, e) => sum + e.hp, 0);
  const totalEnemyMax = allLivingEnemies.reduce((sum, e) => sum + e.maxHp, 0);

  console.log(`[BATTLE START] Player Alive: ${allLivingHeroes.length}, Squad HP: ${Math.ceil(totalHeroHp)}/${totalHeroMax} | Enemy Alive: ${allLivingEnemies.length}, Army HP: ${Math.ceil(totalEnemyHp)}/${totalEnemyMax}`);
}

function resolveBattleVictory() {
  battleActive = false;
  battleResolved = true;
  audio.playVictoryFanfare();
  document.getElementById('hud').classList.remove('battle-mode');
  document.getElementById('modal-victory').classList.add('visible');

  // Remove arena barrier so player can walk through after victory
  if (arenaBarrier) {
    arenaBarrier.visible = false;
  }

  const livingHeroes = [heroLeader, ...squadMembers].filter((h) => h.alive && h.hp > 0).length;
  const finalHeroHp = [heroLeader, ...squadMembers].filter((h) => h.alive && h.hp > 0).reduce((sum, h) => sum + h.hp, 0);

  console.log(`[BATTLE END - VICTORY] Player Alive: ${livingHeroes}, Squad HP: ${Math.ceil(finalHeroHp)} | Enemy Alive: 0, Army HP: 0 | Hero Dmg Dealt: ${battleStats.heroDamageDealt}, Enemy Dmg Dealt: ${battleStats.enemyDamageDealt}`);
}

function resolveBattleDefeat() {
  battleActive = false;
  battleResolved = true;
  audio.playDefeatSting();
  document.getElementById('hud').classList.remove('battle-mode');
  document.getElementById('modal-defeat').classList.add('visible');

  const livingEnemies = enemySquad.filter((e) => e.alive && e.hp > 0).length;
  const finalEnemyHp = enemySquad.filter((e) => e.alive && e.hp > 0).reduce((sum, e) => sum + e.hp, 0);

  console.log(`[BATTLE END - DEFEAT] Player Alive: 0, Squad HP: 0 | Enemy Alive: ${livingEnemies}, Army HP: ${Math.ceil(finalEnemyHp)} | Hero Dmg Dealt: ${battleStats.heroDamageDealt}, Enemy Dmg Dealt: ${battleStats.enemyDamageDealt}`);
}

// ----------------------------------------------------------------------------
// 10. Input System (Keyboard + Virtual Analog Touch Joystick)
// ----------------------------------------------------------------------------
const inputVector = { x: 0, z: 0 };
const keysDown = {};

window.addEventListener('keydown', (e) => {
  keysDown[e.code] = true;
  if (e.code === 'Space') {
    triggerPlayerMeleeAttack();
    e.preventDefault();
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

document.getElementById('btn-dodge').addEventListener('click', triggerDodgeRoll);
const btnAttack = document.getElementById('btn-attack');
if (btnAttack) btnAttack.addEventListener('click', triggerPlayerMeleeAttack);
document.getElementById('btn-retry').addEventListener('click', restartGame);
document.getElementById('btn-victory-replay').addEventListener('click', restartGame);

function triggerPlayerMeleeAttack() {
  if (!heroLeader.alive) return;
  audio.playSwordSwing();
  heroLeader.rightArm.rotation.x = -Math.PI / 1.5;
  setTimeout(() => {
    if (heroLeader.rightArm) heroLeader.rightArm.rotation.x = 0;
  }, 160);

  // Find nearest enemy to heroLeader
  let nearestE = null;
  let bestDist = 2.8;
  enemySquad.forEach((e) => {
    if (e.alive) {
      const d = heroLeader.root.position.distanceTo(e.root.position);
      if (d < bestDist) {
        bestDist = d;
        nearestE = e;
      }
    }
  });

  if (nearestE) {
    const dmg = 35;
    nearestE.hp -= dmg;
    audio.playHitPunch();
    updateCharacterHealthBillboard(nearestE);
    showFloatingFeedback(nearestE.root.position, `-${dmg}`, false);

    if (nearestE.hp <= 0 && nearestE.alive) {
      nearestE.alive = false;
      nearestE.root.rotation.x = -Math.PI / 2;
      nearestE.root.position.y = 0.2;
      nearestE.target = null;
    }
    updateHUDCounts();
  }
}

function triggerDodgeRoll() {
  if (playerState.isRolling || battleActive) return;
  playerState.isRolling = true;
  playerState.rollTimer = 0.35;
  playerState.velocity.multiplyScalar(1.9);
}

function restartGame() {
  window.location.reload();
}

// ----------------------------------------------------------------------------
// 11. Main Animation & Combat Loop
// ----------------------------------------------------------------------------
const clock = new THREE.Clock();
let walkCycle = 0;
const camTargetPos = new THREE.Vector3();
const camLookTarget = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.1);

  // 1. Player Manual Movement (Only when not in battle and alive)
  if (!battleActive && !battleResolved && heroLeader.alive) {
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

    const isMoving = len > 0.05;
    const targetVel = new THREE.Vector3(0, 0, 0);

    if (isMoving) {
      const camFwd = new THREE.Vector3();
      camera.getWorldDirection(camFwd);
      camFwd.y = 0;
      camFwd.normalize();
      const camRight = new THREE.Vector3(-camFwd.z, 0, camFwd.x);

      targetVel.addScaledVector(camRight, moveX);
      targetVel.addScaledVector(camFwd, -moveZ);
      targetVel.normalize().multiplyScalar(playerState.speed);

      const targetAngle = Math.atan2(targetVel.x, targetVel.z);
      playerState.headingAngle = THREE.MathUtils.lerp(playerState.headingAngle, targetAngle, 12 * delta);
      heroLeader.root.rotation.y = playerState.headingAngle;

      walkCycle += delta * 14;
      heroLeader.leftLeg.rotation.x = Math.sin(walkCycle) * 0.7;
      heroLeader.rightLeg.rotation.x = -Math.sin(walkCycle) * 0.7;
      heroLeader.leftArm.rotation.x = -Math.sin(walkCycle) * 0.6;
      heroLeader.rightArm.rotation.x = Math.sin(walkCycle) * 0.6;
    } else {
      heroLeader.leftLeg.rotation.x = THREE.MathUtils.lerp(heroLeader.leftLeg.rotation.x, 0, 10 * delta);
      heroLeader.rightLeg.rotation.x = THREE.MathUtils.lerp(heroLeader.rightLeg.rotation.x, 0, 10 * delta);
      heroLeader.leftArm.rotation.x = THREE.MathUtils.lerp(heroLeader.leftArm.rotation.x, 0, 10 * delta);
      heroLeader.rightArm.rotation.x = THREE.MathUtils.lerp(heroLeader.rightArm.rotation.x, 0, 10 * delta);
    }

    playerState.velocity.lerp(targetVel, 14 * delta);
    playerState.pos.addScaledVector(playerState.velocity, delta);

    // Keep within road bounds
    const maxRoadX = (ROAD_WIDTH / 2) - 0.45;
    playerState.pos.x = THREE.MathUtils.clamp(playerState.pos.x, -maxRoadX, maxRoadX);

    // Dodge Roll
    if (playerState.isRolling) {
      playerState.rollTimer -= delta;
      heroLeader.root.rotation.x = Math.sin((0.35 - playerState.rollTimer) * 18) * 1.5;
      if (playerState.rollTimer <= 0) {
        playerState.isRolling = false;
        heroLeader.root.rotation.x = 0;
      }
    }

    // 2. Math Gates Collision Detection
    for (let i = 0; i < mathGatePairs.length; i++) {
      const pair = mathGatePairs[i];
      if (!pair.triggered && playerState.pos.z <= pair.z) {
        pair.triggered = true;
        const chosenConfig = playerState.pos.x < 0 ? pair.left : pair.right;
        const chosenX = playerState.pos.x < 0 ? -1.5 : 1.5;
        applyMathGate(chosenConfig, chosenX);

        // Fade out gate pair
        pair.group.children.forEach((c) => {
          c.scale.set(0.2, 0.2, 0.2);
          c.visible = false;
        });
      }
    }

    // 3. Final Battle Trigger
    if (playerState.pos.z <= BATTLE_TRIGGER_Z) {
      startFinalBattle();
    }
  }

  // 4. Followers Marching Behind Player (Outside Battle)
  if (!battleActive && !battleResolved) {
    const maxRoadX = (ROAD_WIDTH / 2) - 0.55; // 2.55 (Fence posts are at +-3.1, giving 0.55m safe margin)

    // Formation row centering: keeps the 3-wide squad inside boundaries without bunching or crossing fences
    const rowHalfWidth = 0.9;
    const maxRowCenter = Math.max(0, maxRoadX - rowHalfWidth); // 1.65
    const idealRowCenter = THREE.MathUtils.clamp(playerState.pos.x, -maxRowCenter, maxRowCenter);

    // Compression factor when player is near boundary fence
    const distToFence = (ROAD_WIDTH / 2) - Math.abs(playerState.pos.x);
    const spreadFactor = THREE.MathUtils.clamp(distToFence / 1.6, 0.75, 1.0);

    for (let i = 0; i < squadMembers.length; i++) {
      const follower = squadMembers[i];
      const slot = getFormationSlot(i);

      // Follower Z is strictly behind player along the road (prevents wild pendulum swing!)
      const targetZ = playerState.pos.z + slot.offsetZ;

      // Follower X is anchored to idealRowCenter with adaptive spread, strictly clamped inside road fences
      const targetX = THREE.MathUtils.clamp(idealRowCenter + slot.offsetX * spreadFactor, -maxRoadX, maxRoadX);

      follower.root.position.x = THREE.MathUtils.lerp(follower.root.position.x, targetX, 10 * delta);
      follower.root.position.z = THREE.MathUtils.lerp(follower.root.position.z, targetZ, 12 * delta);

      // Absolute hard boundary clamping: guarantees ZERO followers can ever cross the fence!
      follower.root.position.x = THREE.MathUtils.clamp(follower.root.position.x, -maxRoadX, maxRoadX);

      // Follower faces forward along the track
      follower.root.rotation.y = THREE.MathUtils.lerp(follower.root.rotation.y, playerState.headingAngle * 0.35, 8 * delta);

      const fWalk = walkCycle + i * 0.4;
      follower.leftLeg.rotation.x = Math.sin(fWalk) * 0.65;
      follower.rightLeg.rotation.x = -Math.sin(fWalk) * 0.65;
    }
  }

  // 5. AUTOMATIC SQUAD BATTLE SIMULATION
  if (battleActive) {
    const allLivingHeroes = [heroLeader, ...squadMembers].filter((h) => h.alive && h.hp > 0);
    const allLivingEnemies = enemySquad.filter((e) => e.alive && e.hp > 0);

    // Check Victory
    if (allLivingEnemies.length === 0) {
      resolveBattleVictory();
      return;
    }

    // Check Defeat
    if (allLivingHeroes.length === 0) {
      resolveBattleDefeat();
      return;
    }

    // Heroes AI: Attack Enemies
    allLivingHeroes.forEach((hero) => {
      if (!hero.alive || hero.hp <= 0) return;

      // Retarget if current target is dead or missing
      if (!hero.target || !hero.target.alive || hero.target.hp <= 0) {
        let bestDist = 999;
        hero.target = null;
        allLivingEnemies.forEach((e) => {
          if (e.alive && e.hp > 0) {
            const d = hero.root.position.distanceTo(e.root.position);
            if (d < bestDist) {
              bestDist = d;
              hero.target = e;
            }
          }
        });
      }

      if (hero.target && hero.target.alive && hero.target.hp > 0) {
        const toTarget = hero.target.root.position.clone().sub(hero.root.position);
        toTarget.y = 0;
        const dist = toTarget.length();
        if (dist > 0.01) {
          const angle = Math.atan2(toTarget.x, toTarget.z);
          hero.root.rotation.y = angle;
        }

        if (dist > 1.6) {
          // Charge forward into battle
          hero.root.position.addScaledVector(toTarget.normalize(), 6.5 * delta);
          hero.walkPhase += delta * 14;
          hero.leftLeg.rotation.x = Math.sin(hero.walkPhase) * 0.7;
          hero.rightLeg.rotation.x = -Math.sin(hero.walkPhase) * 0.7;
        } else {
          // Attack in melee range!
          hero.attackCooldown -= delta;
          if (hero.attackCooldown <= 0) {
            hero.attackCooldown = 0.42 + Math.random() * 0.12;
            audio.playSwordSwing();

            // Melee sword swing animation
            hero.rightArm.rotation.x = -Math.PI / 1.5;
            setTimeout(() => {
              if (hero.rightArm) hero.rightArm.rotation.x = 0;
            }, 180);

            // Deal solid damage so positive gate squads triumph!
            if (hero.target && hero.target.alive && hero.target.hp > 0) {
              const isLeaderHero = hero === heroLeader;
              const dmg = isLeaderHero ? 45 : 30 + Math.floor(Math.random() * 8);
              hero.target.hp = Math.max(0, hero.target.hp - dmg);
              battleStats.heroDamageDealt += dmg;
              audio.playHitPunch();
              updateCharacterHealthBillboard(hero.target);
              showFloatingFeedback(hero.target.root.position, `-${dmg}`, false);

              if (hero.target.hp <= 0) {
                hero.target.hp = 0;
                hero.target.alive = false;
                if (hero.target.hpBillboard) hero.target.hpBillboard.visible = false;
                hero.target.root.rotation.x = -Math.PI / 2;
                hero.target.root.position.y = 0.2;
                hero.target = null;
              }
              updateHUDCounts();
            }
          }
        }
      }

      // Hard clamp within arena boundaries
      hero.root.position.x = THREE.MathUtils.clamp(hero.root.position.x, -2.55, 2.55);
      hero.root.position.z = THREE.MathUtils.clamp(hero.root.position.z, -128, -100);
    });

    // Enemies AI: Attack Heroes
    allLivingEnemies.forEach((enemy) => {
      if (!enemy.alive || enemy.hp <= 0) return;

      if (!enemy.target || !enemy.target.alive || enemy.target.hp <= 0) {
        let bestDist = 999;
        enemy.target = null;
        allLivingHeroes.forEach((h) => {
          if (h.alive && h.hp > 0) {
            const d = enemy.root.position.distanceTo(h.root.position);
            if (d < bestDist) {
              bestDist = d;
              enemy.target = h;
            }
          }
        });
      }

      if (enemy.target && enemy.target.alive && enemy.target.hp > 0) {
        const toTarget = enemy.target.root.position.clone().sub(enemy.root.position);
        toTarget.y = 0;
        const dist = toTarget.length();
        if (dist > 0.01) {
          const angle = Math.atan2(toTarget.x, toTarget.z);
          enemy.root.rotation.y = angle;
        }

        if (dist > 1.6) {
          enemy.root.position.addScaledVector(toTarget.normalize(), 5.8 * delta);
          enemy.walkPhase += delta * 14;
          enemy.leftLeg.rotation.x = Math.sin(enemy.walkPhase) * 0.7;
          enemy.rightLeg.rotation.x = -Math.sin(enemy.walkPhase) * 0.7;
        } else {
          enemy.attackCooldown -= delta;
          if (enemy.attackCooldown <= 0) {
            enemy.attackCooldown = 0.85 + Math.random() * 0.25;
            audio.playSwordSwing();

            enemy.rightArm.rotation.x = -Math.PI / 1.5;
            setTimeout(() => {
              if (enemy.rightArm) enemy.rightArm.rotation.x = 0;
            }, 180);

            if (enemy.target && enemy.target.alive && enemy.target.hp > 0) {
              const dmg = 12 + Math.floor(Math.random() * 5);
              enemy.target.hp = Math.max(0, enemy.target.hp - dmg);
              battleStats.enemyDamageDealt += dmg;
              audio.playHitPunch();
              showFloatingFeedback(enemy.target.root.position, `-${dmg}`, false);

              if (enemy.target.hp <= 0) {
                enemy.target.hp = 0;
                enemy.target.alive = false;
                enemy.target.root.rotation.x = -Math.PI / 2;
                enemy.target.root.position.y = 0.2;
                enemy.target = null;
              }
              updateHUDCounts();
            }
          }
        }
      }

      // Hard clamp within arena boundaries
      enemy.root.position.x = THREE.MathUtils.clamp(enemy.root.position.x, -2.55, 2.55);
      enemy.root.position.z = THREE.MathUtils.clamp(enemy.root.position.z, -128, -100);
    });
  }

  // 6. Camera Follow Framing
  if (!battleActive) {
    // Normal follow behind player
    const CAM_DIST = 9.5;
    const CAM_HEIGHT = 5.6;

    camTargetPos.set(
      playerState.pos.x - Math.sin(playerState.headingAngle) * 2.0,
      playerState.pos.y + CAM_HEIGHT,
      playerState.pos.z + CAM_DIST
    );

    camLookTarget.set(
      playerState.pos.x,
      playerState.pos.y + 1.2,
      playerState.pos.z - 4.0
    );
  } else {
    // Cinematic elevated battlefield overview centered DIRECTLY on the arena fight at ARENA_CENTER_Z = -112.0
    camTargetPos.set(0, 9.2, ARENA_CENTER_Z + 15.0);
    camLookTarget.set(0, 1.2, ARENA_CENTER_Z);
  }

  camera.position.lerp(camTargetPos, 7 * delta);
  camera.lookAt(camLookTarget);

  // Sunlight tracks the battlefield center
  sunLight.position.set(playerState.pos.x + 30, 50, playerState.pos.z + 25);
  sunLight.target.position.copy(playerState.pos);
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
