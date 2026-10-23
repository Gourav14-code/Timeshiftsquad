/**
 * ============================================================================
 * TIME SHIFT SQUAD - Visual Design Prototype
 * File: design-preview.js
 * ============================================================================
 * Visual preview demonstrating:
 * 1. Seamlessly connected Y-junction with both Left and Right routes fully visible
 * 2. Sci-fi low-poly runner aesthetic with glowing neon curbs & energy gates
 * 3. Player character + 11 squad followers in an orderly 3-column formation (Squad: 12)
 * 4. Interactive Left/Right steering across lanes and route branches
 * 5. Elevated cinematic chase camera + switchable panoramic drone camera
 * 6. Futuristic trackside decorations, holographic arches, and energy pylons
 */

import * as THREE from 'three';

// ----------------------------------------------------------------------------
// 1. Scene, Renderer & Fog Setup
// ----------------------------------------------------------------------------
const scene = new THREE.Scene();

// Deep sci-fi atmosphere with subtle horizon fog
const BG_COLOR = 0x070b14;
scene.background = new THREE.Color(BG_COLOR);
scene.fog = new THREE.FogExp2(BG_COLOR, 0.013);

const container = document.getElementById('game-container');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

container.appendChild(renderer.domElement);

// ----------------------------------------------------------------------------
// 2. Camera Setup (Chase View & Drone Overview)
// ----------------------------------------------------------------------------
const camera = new THREE.PerspectiveCamera(
  56,
  window.innerWidth / window.innerHeight,
  0.1,
  600
);

// Camera modes: 'chase' (runner perspective) or 'drone' (elevated overview)
let currentCamMode = 'chase';

// Current smoothed camera positions
const camState = {
  pos: new THREE.Vector3(0, 6.2, 12.0),
  lookAt: new THREE.Vector3(0, 1.2, -18.0),
};

camera.position.copy(camState.pos);
camera.lookAt(camState.lookAt);

// ----------------------------------------------------------------------------
// 3. Lighting Setup
// ----------------------------------------------------------------------------
// Soft ambient illumination for dark sci-fi contrast
const ambientLight = new THREE.AmbientLight(0x38bdf8, 0.45);
scene.add(ambientLight);

// Primary directional sunlight casting crisp shadows
const sunLight = new THREE.DirectionalLight(0xffffff, 1.3);
sunLight.position.set(25, 45, 20);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 1.0;
sunLight.shadow.camera.far = 160;
sunLight.shadow.camera.left = -35;
sunLight.shadow.camera.right = 35;
sunLight.shadow.camera.top = 35;
sunLight.shadow.camera.bottom = -35;
sunLight.shadow.bias = -0.0005;
scene.add(sunLight);

// Subtle upward cyan bounce light from neon track strips
const bounceLight = new THREE.DirectionalLight(0x00f0ff, 0.4);
bounceLight.position.set(-20, -15, -30);
scene.add(bounceLight);

// ----------------------------------------------------------------------------
// 4. Track Materials & Theme Colors
// ----------------------------------------------------------------------------
const THEME = {
  road: 0x0f172a,          // Dark carbon slate roadbed
  roadRoughness: 0.5,
  neonCyan: 0x00f0ff,      // Primary runner neon
  neonBlue: 0x0284c7,      // Deep electric blue
  neonPurple: 0x9333ea,    // Secondary route neon
  neonAmber: 0xf59e0b,     // Collectible / accent
  curbMetal: 0x1e293b,     // Curb structural metal
  barrierCyan: 0x0ea5e9,   // Hologram positive
  barrierRed: 0xef4444,    // Hologram negative
};

const roadMat = new THREE.MeshStandardMaterial({
  color: THEME.road,
  roughness: THEME.roadRoughness,
  metalness: 0.25,
});

const curbMat = new THREE.MeshStandardMaterial({
  color: THEME.curbMetal,
  roughness: 0.4,
  metalness: 0.8,
});

const neonCyanMat = new THREE.MeshBasicMaterial({
  color: THEME.neonCyan,
});

const neonPurpleMat = new THREE.MeshBasicMaterial({
  color: THEME.neonPurple,
});

const stripeMat = new THREE.MeshBasicMaterial({
  color: 0x38bdf8,
});

// Ground grid plane extending to the horizon
const groundGeo = new THREE.PlaneGeometry(600, 600);
const groundMat = new THREE.MeshStandardMaterial({
  color: 0x050811,
  roughness: 0.95,
  metalness: 0.1,
});
const groundMesh = new THREE.Mesh(groundGeo, groundMat);
groundMesh.rotation.x = -Math.PI / 2;
groundMesh.position.y = -0.05;
groundMesh.receiveShadow = true;
scene.add(groundMesh);

// Glowing digital grid overlay
const gridHelper = new THREE.GridHelper(500, 100, 0x0284c7, 0x0d2137);
gridHelper.position.y = 0.01;
scene.add(gridHelper);

// ----------------------------------------------------------------------------
// 5. Track Geometry: Connected Y-Junction Architecture
// ----------------------------------------------------------------------------
/**
 * Track Layout:
 * 1. Approach Straight: z = +30 down to z = -25 (width = 6.0)
 * 2. Y-Junction Fork: z = -25 down to z = -75
 *    - Left Branch diverges smoothly at -24° heading (curves into -X)
 *    - Right Branch diverges smoothly at +24° heading (curves into +X)
 *    - Central divider island with chevron wedge begins at z = -35
 * 3. Left & Right Continuations: z = -75 down to z = -170
 */
const TRACK_WIDTH = 6.0;
const BRANCH_WIDTH = 5.2;
const TRACK_THICKNESS = 0.12;

// Path center evaluation function
function getRouteCenter(z, branchChoice = 'left') {
  if (z >= -25) {
    // Initial Straight
    return { x: 0, heading: 0, width: TRACK_WIDTH };
  } else if (z >= -75) {
    // Fork Zone (z between -25 and -75, length = 50)
    const t = (-25 - z) / 50.0;
    // Smooth cubic easing: 3t^2 - 2t^3
    const smoothT = t * t * (3 - 2 * t);
    const maxOffset = 7.2;

    const angle = 0.42; // ~24 degrees in radians
    const heading = branchChoice === 'left' ? (smoothT * angle) : (-smoothT * angle);
    const sign = branchChoice === 'left' ? -1 : 1;
    const x = sign * (smoothT * maxOffset);

    return { x, heading, width: BRANCH_WIDTH };
  } else {
    // Branch Continuation (z < -75)
    const distPastFork = -75 - z;
    const angle = 0.42; // ~24 degrees
    const heading = branchChoice === 'left' ? angle : -angle;
    const sign = branchChoice === 'left' ? -1 : 1;
    const x = sign * (7.2 + distPastFork * Math.tan(angle));

    return { x, heading, width: BRANCH_WIDTH };
  }
}

// Track construction container
const trackGroup = new THREE.Group();
scene.add(trackGroup);

// A) Approach Straight Track (z = +30 to -25, length = 55)
const approachLen = 55;
const approachGeo = new THREE.BoxGeometry(TRACK_WIDTH, TRACK_THICKNESS, approachLen);
const approachMesh = new THREE.Mesh(approachGeo, roadMat);
approachMesh.position.set(0, TRACK_THICKNESS / 2, 2.5); // Centers box from +30 to -25
approachMesh.receiveShadow = true;
trackGroup.add(approachMesh);

// Outer Curbs on Approach (with glowing neon strips)
function createCurbWithNeon(xPos, zCenter, length, heading = 0, neonColor = THEME.neonCyan) {
  const curbGroup = new THREE.Group();
  curbGroup.position.set(xPos, 0, zCenter);
  curbGroup.rotation.y = heading;

  // Metal Curb Base
  const baseGeo = new THREE.BoxGeometry(0.24, 0.22, length);
  const baseMesh = new THREE.Mesh(baseGeo, curbMat);
  baseMesh.position.y = 0.11;
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  curbGroup.add(baseMesh);

  // Glowing Neon Light Strip on Top of Curb
  const neonMat = (neonColor === THEME.neonPurple) ? neonPurpleMat : neonCyanMat;
  const stripGeo = new THREE.BoxGeometry(0.12, 0.06, length);
  const stripMesh = new THREE.Mesh(stripGeo, neonMat);
  stripMesh.position.y = 0.23;
  curbGroup.add(stripMesh);

  return curbGroup;
}

trackGroup.add(createCurbWithNeon(-TRACK_WIDTH / 2 - 0.12, 2.5, approachLen));
trackGroup.add(createCurbWithNeon(TRACK_WIDTH / 2 + 0.12, 2.5, approachLen));

// Center dashed road markings on Approach
const dashGeo = new THREE.BoxGeometry(0.16, 0.02, 3.2);
for (let z = 24; z > -22; z -= 7) {
  const dash = new THREE.Mesh(dashGeo, stripeMat);
  dash.position.set(0, TRACK_THICKNESS + 0.01, z);
  trackGroup.add(dash);
}

// B) Connected Y-Junction Curved Ribbon Geometry
function createBranchRibbonMesh(branchChoice) {
  const segments = 24;
  const zStart = -25;
  const zEnd = -75;
  const dz = (zEnd - zStart) / segments;

  const vertices = [];
  const indices = [];
  const uvs = [];

  for (let i = 0; i <= segments; i++) {
    const z = zStart + i * dz;
    const { x, heading } = getRouteCenter(z, branchChoice);
    const halfW = BRANCH_WIDTH / 2;

    const cosH = Math.cos(heading);
    const sinH = Math.sin(heading);

    // Left and right vertices of this road segment slice
    const lx = x - halfW * cosH;
    const lz = z + halfW * sinH;
    const rx = x + halfW * cosH;
    const rz = z - halfW * sinH;

    vertices.push(lx, TRACK_THICKNESS, lz);
    vertices.push(rx, TRACK_THICKNESS, rz);

    const v = i / segments;
    uvs.push(0, v, 1, v);

    if (i < segments) {
      const row1 = i * 2;
      const row2 = (i + 1) * 2;
      indices.push(row1, row2, row1 + 1);
      indices.push(row1 + 1, row2, row2 + 1);
    }
  }

  const ribbonGeo = new THREE.BufferGeometry();
  ribbonGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  ribbonGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  ribbonGeo.setIndex(indices);
  ribbonGeo.computeVertexNormals();

  const mesh = new THREE.Mesh(ribbonGeo, roadMat);
  mesh.receiveShadow = true;
  return mesh;
}

const leftForkMesh = createBranchRibbonMesh('left');
const rightForkMesh = createBranchRibbonMesh('right');
trackGroup.add(leftForkMesh);
trackGroup.add(rightForkMesh);

// Center Island Wedge (Seamless triangular splitter between the two branches)
function createCenterDividerIsland() {
  const islandGroup = new THREE.Group();
  const segments = 16;
  const zStart = -35;
  const zEnd = -75;
  const dz = (zEnd - zStart) / segments;

  const vertices = [];
  const indices = [];

  for (let i = 0; i <= segments; i++) {
    const z = zStart + i * dz;
    const leftCenter = getRouteCenter(z, 'left');
    const rightCenter = getRouteCenter(z, 'right');

    const halfW = BRANCH_WIDTH / 2;
    // Inner edge of left branch and inner edge of right branch
    const lx = leftCenter.x + halfW * Math.cos(leftCenter.heading);
    const rx = rightCenter.x - halfW * Math.cos(rightCenter.heading);

    vertices.push(lx, TRACK_THICKNESS + 0.02, z);
    vertices.push(rx, TRACK_THICKNESS + 0.02, z);

    if (i < segments) {
      const row1 = i * 2;
      const row2 = (i + 1) * 2;
      indices.push(row1, row2, row1 + 1);
      indices.push(row1 + 1, row2, row2 + 1);
    }
  }

  const islandGeo = new THREE.BufferGeometry();
  islandGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  islandGeo.setIndex(indices);
  islandGeo.computeVertexNormals();

  const islandMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.35,
    metalness: 0.7,
  });

  const islandMesh = new THREE.Mesh(islandGeo, islandMat);
  islandMesh.receiveShadow = true;
  islandGroup.add(islandMesh);

  // Glowing Chevron Wedge on the nose of the island (z = -35)
  const chevronGeo = new THREE.ConeGeometry(0.7, 2.2, 3);
  const chevronMat = new THREE.MeshBasicMaterial({ color: THEME.neonCyan });
  const chevron = new THREE.Mesh(chevronGeo, chevronMat);
  chevron.rotation.x = Math.PI / 2;
  chevron.rotation.z = Math.PI;
  chevron.position.set(0, TRACK_THICKNESS + 0.1, -36.5);
  islandGroup.add(chevron);

  return islandGroup;
}
trackGroup.add(createCenterDividerIsland());

// C) Branch Curbs & Outer Neon Strips for Y-Junction
function createCurvedBranchCurbs(branchChoice) {
  const group = new THREE.Group();
  const numSteps = 10;
  const zStart = -25;
  const zEnd = -75;
  const dz = (zEnd - zStart) / numSteps;
  const segLen = Math.hypot(dz, dz * 0.45) + 0.3;

  for (let i = 0; i < numSteps; i++) {
    const zMid = zStart + (i + 0.5) * dz;
    const { x, heading } = getRouteCenter(zMid, branchChoice);
    const halfW = BRANCH_WIDTH / 2;

    const cosH = Math.cos(heading);
    const sinH = Math.sin(heading);

    // Outer curb
    const outerSign = branchChoice === 'left' ? -1 : 1;
    const outerX = x + outerSign * (halfW + 0.12) * cosH;
    const outerZ = zMid - outerSign * (halfW + 0.12) * sinH;
    const neonCol = branchChoice === 'left' ? THEME.neonCyan : THEME.neonPurple;

    const outerCurb = createCurbWithNeon(outerX, outerZ, segLen, heading, neonCol);
    group.add(outerCurb);
  }
  return group;
}
trackGroup.add(createCurvedBranchCurbs('left'));
trackGroup.add(createCurvedBranchCurbs('right'));

// D) Branch Continuations (z = -75 down to -170)
function createBranchContinuation(branchChoice) {
  const group = new THREE.Group();
  const length = 95;
  const zCenter = -75 - length / 2;
  const angle = 0.42;
  const heading = branchChoice === 'left' ? angle : -angle;
  const sign = branchChoice === 'left' ? -1 : 1;
  const xCenter = sign * (7.2 + (length / 2) * Math.tan(angle));

  // Road Mesh
  const contGeo = new THREE.BoxGeometry(BRANCH_WIDTH, TRACK_THICKNESS, length);
  const contMesh = new THREE.Mesh(contGeo, roadMat);
  contMesh.position.set(xCenter, TRACK_THICKNESS / 2, zCenter);
  contMesh.rotation.y = heading;
  contMesh.receiveShadow = true;
  group.add(contMesh);

  // Outer & Inner Curbs
  const neonCol = branchChoice === 'left' ? THEME.neonCyan : THEME.neonPurple;
  const outerX = xCenter + sign * (BRANCH_WIDTH / 2 + 0.12) * Math.cos(heading);
  const outerZ = zCenter - sign * (BRANCH_WIDTH / 2 + 0.12) * Math.sin(heading);
  group.add(createCurbWithNeon(outerX, outerZ, length, heading, neonCol));

  const innerX = xCenter - sign * (BRANCH_WIDTH / 2 + 0.12) * Math.cos(heading);
  const innerZ = zCenter + sign * (BRANCH_WIDTH / 2 + 0.12) * Math.sin(heading);
  group.add(createCurbWithNeon(innerX, innerZ, length, heading, neonCol));

  // Continuation lane stripes
  for (let d = -length / 2 + 5; d < length / 2 - 5; d += 8) {
    const dash = new THREE.Mesh(dashGeo, stripeMat);
    dash.position.set(
      xCenter - d * Math.sin(heading),
      TRACK_THICKNESS + 0.01,
      zCenter + d * Math.cos(heading)
    );
    dash.rotation.y = heading;
    group.add(dash);
  }

  return group;
}
trackGroup.add(createBranchContinuation('left'));
trackGroup.add(createBranchContinuation('right'));

// ----------------------------------------------------------------------------
// 6. Futuristic Trackside Decorations & Holographic Signage
// ----------------------------------------------------------------------------
// A) Overhead Holographic Route Archway (Before Junction at z = -24)
function createHolographicArch() {
  const archGroup = new THREE.Group();
  archGroup.position.set(0, 0, -24);

  const archMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.3,
    metalness: 0.85,
  });

  // Top Crossbar Truss
  const barGeo = new THREE.BoxGeometry(TRACK_WIDTH + 2.4, 0.25, 0.25);
  const barMesh = new THREE.Mesh(barGeo, archMat);
  barMesh.position.y = 3.6;
  archGroup.add(barMesh);

  // Side Support Columns
  const postGeo = new THREE.BoxGeometry(0.3, 3.6, 0.3);
  const leftPost = new THREE.Mesh(postGeo, archMat);
  leftPost.position.set(-TRACK_WIDTH / 2 - 1.0, 1.8, 0);
  archGroup.add(leftPost);

  const rightPost = new THREE.Mesh(postGeo, archMat);
  rightPost.position.set(TRACK_WIDTH / 2 + 1.0, 1.8, 0);
  archGroup.add(rightPost);

  // Holographic Route Signs
  function makeHoloSign(text, isLeft) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = isLeft ? 'rgba(2, 132, 199, 0.35)' : 'rgba(147, 51, 234, 0.35)';
    ctx.roundRect(8, 8, 496, 164, 24);
    ctx.fill();

    ctx.lineWidth = 8;
    ctx.strokeStyle = isLeft ? '#00f0ff' : '#c084fc';
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 52px "Segoe UI", Arial, sans-serif';
    ctx.shadowColor = isLeft ? '#00f0ff' : '#c084fc';
    ctx.shadowBlur = 18;
    ctx.fillText(text, 256, 90);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const signGeo = new THREE.PlaneGeometry(2.8, 1.0);
    const signMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
    });
    return new THREE.Mesh(signGeo, signMat);
  }

  const leftSign = makeHoloSign('◄ ALPHA ROUTE', true);
  leftSign.position.set(-1.8, 3.6, 0.05);
  archGroup.add(leftSign);

  const rightSign = makeHoloSign('BETA ROUTE ►', false);
  rightSign.position.set(1.8, 3.6, 0.05);
  archGroup.add(rightSign);

  return archGroup;
}
scene.add(createHolographicArch());

// B) Sci-Fi Energy Pylons & Floating Monoliths
const decorGroup = new THREE.Group();
scene.add(decorGroup);

const pylonGeo = new THREE.CylinderGeometry(0.12, 0.16, 4.2, 8);
const pylonRingGeo = new THREE.TorusGeometry(0.35, 0.05, 8, 24);
const pylonMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 });
const pylonGlowMat = new THREE.MeshBasicMaterial({ color: THEME.neonCyan });

function addEnergyPylon(x, z, ringColor = THEME.neonCyan) {
  const pylon = new THREE.Group();
  pylon.position.set(x, 2.1, z);

  const body = new THREE.Mesh(pylonGeo, pylonMat);
  pylon.add(body);

  const ringMat = ringColor === THEME.neonPurple ? neonPurpleMat : neonCyanMat;
  const ring1 = new THREE.Mesh(pylonRingGeo, ringMat);
  ring1.rotation.x = Math.PI / 2;
  ring1.position.y = 0.6;
  pylon.add(ring1);

  const ring2 = new THREE.Mesh(pylonRingGeo, ringMat);
  ring2.rotation.x = Math.PI / 2;
  ring2.position.y = 1.6;
  pylon.add(ring2);

  decorGroup.add(pylon);
}

// Trackside pylons along approach & continuations
addEnergyPylon(-4.8, 15, THEME.neonCyan);
addEnergyPylon(4.8, 15, THEME.neonCyan);
addEnergyPylon(-4.8, -5, THEME.neonCyan);
addEnergyPylon(4.8, -5, THEME.neonCyan);

addEnergyPylon(-18, -90, THEME.neonCyan);
addEnergyPylon(-10, -115, THEME.neonCyan);

addEnergyPylon(18, -90, THEME.neonPurple);
addEnergyPylon(10, -115, THEME.neonPurple);

// Floating Low-Poly Crystals / Monoliths in the Horizon
const crystalGeo = new THREE.OctahedronGeometry(1.8, 0);
const crystalMat = new THREE.MeshStandardMaterial({
  color: 0x0ea5e9,
  roughness: 0.15,
  metalness: 0.85,
  wireframe: false,
});

const floatingCrystals = [];
const crystalPositions = [
  { x: -32, y: 12, z: -50, rotSpeed: 0.4 },
  { x: 34, y: 15, z: -60, rotSpeed: -0.35 },
  { x: -45, y: 18, z: -110, rotSpeed: 0.5 },
  { x: 42, y: 20, z: -120, rotSpeed: -0.45 },
  { x: 0, y: 24, z: -140, rotSpeed: 0.3 },
];

crystalPositions.forEach((cp) => {
  const crystal = new THREE.Mesh(crystalGeo, crystalMat);
  crystal.position.set(cp.x, cp.y, cp.z);
  crystal.castShadow = true;
  scene.add(crystal);
  floatingCrystals.push({ mesh: crystal, speed: cp.rotSpeed, baseScale: 1.0 });
});

// ----------------------------------------------------------------------------
// 7. Holographic Squad Gates
// ----------------------------------------------------------------------------
function createGateTexture(text, isPositive) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const bg = ctx.createLinearGradient(0, 0, 0, 256);
  if (isPositive) {
    bg.addColorStop(0, 'rgba(14, 165, 233, 0.45)');
    bg.addColorStop(1, 'rgba(2, 132, 199, 0.25)');
  } else {
    bg.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
    bg.addColorStop(1, 'rgba(185, 28, 28, 0.25)');
  }
  ctx.fillStyle = bg;
  ctx.roundRect(14, 14, 484, 228, 28);
  ctx.fill();

  ctx.lineWidth = 10;
  ctx.strokeStyle = isPositive ? '#38bdf8' : '#f87171';
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 76px "Segoe UI", Arial, sans-serif';
  ctx.shadowColor = isPositive ? '#00f0ff' : '#ef4444';
  ctx.shadowBlur = 18;
  ctx.fillText(text, 256, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createHoloGate(label, isPositive, width = 2.7, height = 2.4) {
  const group = new THREE.Group();

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.3,
    metalness: 0.85,
  });

  // Frame posts
  const postGeo = new THREE.BoxGeometry(0.12, height, 0.12);
  const leftPost = new THREE.Mesh(postGeo, frameMat);
  leftPost.position.set(-width / 2, height / 2, 0);
  group.add(leftPost);

  const rightPost = new THREE.Mesh(postGeo, frameMat);
  rightPost.position.set(width / 2, height / 2, 0);
  group.add(rightPost);

  const topGeo = new THREE.BoxGeometry(width + 0.12, 0.14, 0.14);
  const topBar = new THREE.Mesh(topGeo, frameMat);
  topBar.position.set(0, height + 0.07, 0);
  group.add(topBar);

  // Glowing energy barrier
  const barrierMat = new THREE.MeshStandardMaterial({
    color: isPositive ? THEME.barrierCyan : THEME.barrierRed,
    transparent: true,
    opacity: 0.6,
    roughness: 0.1,
    metalness: 0.2,
    side: THREE.DoubleSide,
  });
  const barrierGeo = new THREE.PlaneGeometry(width - 0.08, height - 0.08);
  const barrier = new THREE.Mesh(barrierGeo, barrierMat);
  barrier.position.set(0, height / 2, 0);
  group.add(barrier);

  // Floating hologram text label
  const labelTex = createGateTexture(label, isPositive);
  const labelMat = new THREE.MeshBasicMaterial({
    map: labelTex,
    transparent: true,
    side: THREE.DoubleSide,
  });
  const labelGeo = new THREE.PlaneGeometry(2.35, 1.15);
  const labelMesh = new THREE.Mesh(labelGeo, labelMat);
  labelMesh.position.set(0, height / 2, 0.03);
  group.add(labelMesh);

  return group;
}

// Gate Pair 1 (On Approach at z = -10)
const gate1Group = new THREE.Group();
gate1Group.position.set(0, 0, -10);

const gate1Left = createHoloGate('+5 SQUAD', true);
gate1Left.position.x = -1.45;
gate1Group.add(gate1Left);

const gate1Right = createHoloGate('x2 SQUAD', true);
gate1Right.position.x = 1.45;
gate1Group.add(gate1Right);
scene.add(gate1Group);

// Gate Pair 2 (On Branch Continuations at z = -105)
// Left Branch Gate: +10 SQUAD
const leftBranchGate = createHoloGate('+10 SQUAD', true, 2.6, 2.4);
const leftTF = getRouteCenter(-105, 'left');
leftBranchGate.position.set(leftTF.x, 0, -105);
leftBranchGate.rotation.y = leftTF.heading;
scene.add(leftBranchGate);

// Right Branch Gate: -3 SQUAD
const rightBranchGate = createHoloGate('-3 SQUAD', false, 2.6, 2.4);
const rightTF = getRouteCenter(-105, 'right');
rightBranchGate.position.set(rightTF.x, 0, -105);
rightBranchGate.rotation.y = rightTF.heading;
scene.add(rightBranchGate);

// ----------------------------------------------------------------------------
// 8. Player & Squad Followers Formation
// ----------------------------------------------------------------------------
const PLAYER_RADIUS = 0.26;
const PLAYER_LENGTH = 0.52;
const playerGeo = new THREE.CapsuleGeometry(PLAYER_RADIUS, PLAYER_LENGTH, 8, 32);

// Squad Leader Material: Sleek Cyan Chrome
const leaderMat = new THREE.MeshStandardMaterial({
  color: 0x00d2ff,
  roughness: 0.15,
  metalness: 0.5,
});

// Follower Material: Uniform Electric Blue
const followerMat = new THREE.MeshStandardMaterial({
  color: 0x0284c7,
  roughness: 0.25,
  metalness: 0.35,
});

// Main Player (Squad Leader)
const player = new THREE.Mesh(playerGeo, leaderMat);
player.castShadow = true;

// Visor on Squad Leader
const visorGeo = new THREE.BoxGeometry(0.32, 0.12, 0.2);
const visorMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
const visor = new THREE.Mesh(visorGeo, visorMat);
visor.position.set(0, 0.18, -0.2);
player.add(visor);

// Backpack Booster
const boosterGeo = new THREE.BoxGeometry(0.24, 0.32, 0.16);
const boosterMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 });
const booster = new THREE.Mesh(boosterGeo, boosterMat);
booster.position.set(0, 0.05, 0.2);
player.add(booster);

const basePlayerY = TRACK_THICKNESS + (PLAYER_LENGTH / 2 + PLAYER_RADIUS); // 0.64
player.position.set(0, basePlayerY, 14);
scene.add(player);

// Squad Followers (11 Followers arranged in 3-column multi-row grid)
const SQUAD_TOTAL = 12; // 1 Leader + 11 Followers
const squadMembers = [];

const FOLLOWER_RADIUS = 0.22;
const FOLLOWER_LENGTH = 0.44;
const followerGeo = new THREE.CapsuleGeometry(FOLLOWER_RADIUS, FOLLOWER_LENGTH, 8, 24);
const baseFollowerY = TRACK_THICKNESS + (FOLLOWER_LENGTH / 2 + FOLLOWER_RADIUS); // 0.56

const FORMATION_SPACING_X = 0.75;
const FORMATION_SPACING_Z = 1.05;
const FORMATION_COLS = [0.0, -FORMATION_SPACING_X, FORMATION_SPACING_X];

for (let i = 0; i < SQUAD_TOTAL - 1; i++) {
  const mesh = new THREE.Mesh(followerGeo, followerMat);
  mesh.castShadow = true;

  const row = Math.floor(i / 3);
  const colIndex = i % 3;
  const offsetX = FORMATION_COLS[colIndex];
  const offsetZ = 1.15 + row * FORMATION_SPACING_Z;

  mesh.position.set(offsetX, baseFollowerY, 14 + offsetZ);
  scene.add(mesh);

  squadMembers.push({
    mesh,
    offsetX,
    offsetZ,
    phase: i * 0.45,
    currentLateralX: offsetX,
  });
}

// ----------------------------------------------------------------------------
// 9. Interactive Controls & Steering
// ----------------------------------------------------------------------------
const keys = {
  left: false,
  right: false,
};

let isRunning = true;
let playerProgressZ = 18.0; // Starts running forward toward z = -140
let lateralOffset = 0.0;     // Lane position across track
const RUN_SPEED = 14.0;
const STEER_SPEED = 10.0;
const MAX_LATERAL = 2.45;

window.addEventListener('keydown', (e) => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
    keys.left = true;
  }
  if (e.code === 'ArrowRight' || e.code === 'KeyD') {
    keys.right = true;
  }
  if (e.code === 'Space') {
    isRunning = !isRunning;
  }
  if (e.code === 'KeyC') {
    toggleCameraMode();
  }
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
    e.preventDefault();
  }
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
    keys.left = false;
  }
  if (e.code === 'ArrowRight' || e.code === 'KeyD') {
    keys.right = false;
  }
});

// Camera Switcher
const camBtn = document.getElementById('cam-toggle-btn');
const camModeLabel = document.getElementById('cam-mode-label');
const branchStateLabel = document.getElementById('hud-branch-state');

function toggleCameraMode() {
  currentCamMode = currentCamMode === 'chase' ? 'drone' : 'chase';
  if (camModeLabel) {
    camModeLabel.textContent = currentCamMode === 'chase' ? 'CHASE CAM' : 'DRONE OVERVIEW';
  }
}
if (camBtn) {
  camBtn.addEventListener('click', toggleCameraMode);
}

// Window Resizing
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize);

// ----------------------------------------------------------------------------
// 10. Main Animation & Render Loop
// ----------------------------------------------------------------------------
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.1);
  const elapsedTime = clock.getElapsedTime();

  // 1. Forward Running & Loop Reset for Continuous Preview
  if (isRunning) {
    playerProgressZ -= RUN_SPEED * delta;
    if (playerProgressZ < -135) {
      playerProgressZ = 22.0; // Loop back for seamless endless preview
    }
  }

  // 2. Lateral Steering Across Track
  let steerDir = 0;
  if (keys.left) steerDir -= 1;
  if (keys.right) steerDir += 1;

  if (steerDir !== 0) {
    lateralOffset += steerDir * STEER_SPEED * delta;
  }
  lateralOffset = THREE.MathUtils.clamp(lateralOffset, -MAX_LATERAL, MAX_LATERAL);

  // Branch Decision: Steering Left takes Alpha Route; steering Right takes Beta Route
  const chosenBranch = lateralOffset < 0 ? 'left' : 'right';

  // Update HUD Branch Status
  if (branchStateLabel) {
    if (playerProgressZ > -25) {
      branchStateLabel.textContent = 'APPROACHING FORK';
      branchStateLabel.style.color = '#38bdf8';
    } else if (playerProgressZ > -75) {
      branchStateLabel.textContent = chosenBranch === 'left' ? 'ENTERING ALPHA ROUTE' : 'ENTERING BETA ROUTE';
      branchStateLabel.style.color = chosenBranch === 'left' ? '#00f0ff' : '#c084fc';
    } else {
      branchStateLabel.textContent = chosenBranch === 'left' ? 'ALPHA CONTINUATION' : 'BETA CONTINUATION';
      branchStateLabel.style.color = chosenBranch === 'left' ? '#00f0ff' : '#c084fc';
    }
  }

  // 3. Player Position & Banking on Active Track Section
  const route = getRouteCenter(playerProgressZ, chosenBranch);
  const cosH = Math.cos(route.heading);
  const sinH = Math.sin(route.heading);

  const playerWorldX = route.x + lateralOffset * cosH;
  const playerWorldZ = playerProgressZ - lateralOffset * sinH;

  const runBob = Math.sin(elapsedTime * 14.0) * 0.05;
  player.position.set(playerWorldX, basePlayerY + Math.abs(runBob), playerWorldZ);
  player.rotation.y = route.heading;
  player.rotation.z = -steerDir * 0.22; // Dynamic banking into turns
  player.rotation.x = 0.06;

  // 4. Squad Followers Formation Tracking
  const lerpSpeed = 1 - Math.exp(-12 * delta);
  for (let i = 0; i < squadMembers.length; i++) {
    const member = squadMembers[i];

    // Smooth lateral following behind leader
    const targetX = lateralOffset + member.offsetX;
    member.currentLateralX += (targetX - member.currentLateralX) * lerpSpeed;

    const followerZ = playerProgressZ + member.offsetZ;
    const fRoute = getRouteCenter(followerZ, chosenBranch);
    const fCos = Math.cos(fRoute.heading);
    const fSin = Math.sin(fRoute.heading);

    const fX = fRoute.x + member.currentLateralX * fCos;
    const fZ = followerZ - member.currentLateralX * fSin;

    const fBob = Math.sin(elapsedTime * 14.0 + member.phase) * 0.04;
    member.mesh.position.set(fX, baseFollowerY + Math.abs(fBob), fZ);
    member.mesh.rotation.y = fRoute.heading;
    member.mesh.rotation.z = player.rotation.z;
    member.mesh.rotation.x = 0.06;
  }

  // 5. Ambient Sci-Fi Prop Animations
  floatingCrystals.forEach((fc) => {
    fc.mesh.rotation.y += delta * fc.speed;
    fc.mesh.rotation.x += delta * 0.2;
    fc.mesh.position.y += Math.sin(elapsedTime * 2.0 + fc.mesh.position.x) * 0.01;
  });

  // 6. Camera Transitions (Smooth Lerp)
  if (currentCamMode === 'chase') {
    // Cinematic elevated chase view framing squad, fork, and both branches ahead
    const targetCamX = playerWorldX * 0.45;
    const targetCamY = 6.4;
    const targetCamZ = playerWorldZ + 11.5;

    camState.pos.lerp(new THREE.Vector3(targetCamX, targetCamY, targetCamZ), 1 - Math.exp(-6 * delta));
    camState.lookAt.lerp(new THREE.Vector3(playerWorldX * 0.7, 1.4, playerWorldZ - 18.0), 1 - Math.exp(-7 * delta));
  } else {
    // Panoramic elevated drone view looking down at full Y-junction
    const droneCamPos = new THREE.Vector3(0, 24.0, -10.0);
    const droneLookAt = new THREE.Vector3(0, 0, -60.0);

    camState.pos.lerp(droneCamPos, 1 - Math.exp(-5 * delta));
    camState.lookAt.lerp(droneLookAt, 1 - Math.exp(-5 * delta));
  }

  camera.position.copy(camState.pos);
  camera.lookAt(camState.lookAt);

  // Sunlight follows the player's general area
  sunLight.position.set(playerWorldX + 25, 45, playerWorldZ + 20);
  sunLight.target.position.set(playerWorldX, 0, playerWorldZ);
  sunLight.target.updateMatrixWorld();

  // 7. Render Scene
  renderer.render(scene, camera);
}

// Start loop
animate();

