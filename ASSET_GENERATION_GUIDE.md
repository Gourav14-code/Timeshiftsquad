# TIME SHIFT SQUAD — 3D ASSET GENERATION & INTEGRATION GUIDE

---

## 1. EXECUTIVE SUMMARY & TOOL CHAIN CLARIFICATION

### The 2D vs. 3D Reality Check
> [!IMPORTANT]
> **Gemini App** produces text, prompts, and **2D concept images (PNG/JPEG)**. It **cannot directly output binary `.glb` or `.gltf` 3D files**.
> A 2D concept render cannot be dragged into Three.js as a 3D mesh.
> 
> To get real, interactive 3D assets into *Time Shift Squad*, we use a simple, industry-standard 2-step pipeline:
> 1. **Step 1 (Gemini App)**: Generate crisp, clean, neutral-lit **Orthographic Character Concept Sheets** (front view + 3/4 view on clean solid/transparent backgrounds) using the exact prompts below.
> 2. **Step 2 (3D Model & Rigging Tools)**:
>    - **3D Mesh Generation**: Feed the Gemini-generated image into **Meshy.ai**, **Tripo3D**, or **Rodin (Hyper3D)** to generate the low-poly `.glb` mesh.
>    - **Skeletal Rigging & Animations**: Upload the unrigged `.glb`/`.fbx` to **Mixamo (Adobe - 100% Free)** to automatically auto-rig the skeleton and download the 5 required animation clips (**Idle, Run, Attack Slash, Hit Reaction, Death**).

---

## 2. ASSET PIPELINE & MASTER SPECIFICATIONS

Every asset in this pipeline is tuned for real-time WebGL performance in Three.js on both desktop and mobile devices.

| Specification | Character Models | Static Props & Gates | Environment Vista |
| :--- | :--- | :--- | :--- |
| **File Format** | Binary `.glb` (self-contained with textures) | Binary `.glb` | Binary `.glb` or Three.js procedural |
| **Polygon Budget** | 1,500 – 3,500 triangles per character | 600 – 1,800 triangles per gate/prop | 2,000 – 5,000 triangles total |
| **Scale & Dimensions** | Height: 1.6m – 1.9m (1.6 – 1.9 Three.js units) | Width: 2.8m, Height: 2.6m | Length: modular 20m tiles |
| **Origin / Pivot Point** | **Bottom Center between feet `(0, 0, 0)`** | Bottom center of base frame `(0, 0, 0)` | Base centered at `(0, 0, 0)` |
| **Forward Orientation** | **Faces along $-Z$ (or $+Z$)** | Faces along $+Z$ | Along road $Z$-axis |
| **Texture Atlas** | Single 1024×1024 diffuse/color palette | Single 512×512 or 1024×1024 | PBR or stylized color palette |
| **Material Type** | `MeshStandardMaterial` (Roughness: 0.4, Metalness: 0.3) | `MeshStandardMaterial` + Emissive glow | `MeshStandardMaterial` |
| **Skeleton Rig** | Standard Humanoid (hips, spine, neck, head, limbs) | None | None |

---

## 3. ASSET DIRECTORY STRUCTURE

Create this folder structure in the root of `c:\TimeShiftSquad` to keep files organized:

```
c:\TimeShiftSquad\
└── assets/
    ├── models/
    │   ├── characters/
    │   │   ├── hero_leader.glb          <-- (Asset 1: Proof of Concept)
    │   │   ├── hero_soldier.glb         <-- (Asset 2)
    │   │   ├── enemy_grunt.glb          <-- (Asset 3)
    │   │   └── enemy_captain.glb        <-- (Asset 4)
    │   ├── gates/
    │   │   ├── gate_frame.glb           <-- (Asset 5: Modular Gate Frame)
    │   │   └── dial_gauge.glb           <-- (Asset 5: Top Clockwork Dial)
    │   ├── props/
    │   │   ├── sword_hero.glb
    │   │   ├── sword_enemy.glb
    │   │   └── exit_portal.glb          <-- (Asset 7)
    │   └── environment/
    │       ├── bridge_segment.glb       <-- (Asset 6: 10m boardwalk tile)
    │       ├── fence_railing.glb        <-- (Asset 6: Timber railing module)
    │       ├── pine_tree_stylized.glb   <-- (Asset 6: 3-tier low-poly tree)
    │       └── mountain_backdrop.glb    <-- (Asset 6: Alpine mountain peak)
    ├── textures/
    │   ├── character_palette.png
    │   └── ui_icons/
    └── effects/
        ├── slash_trail.png
        └── spark_particle.png
```

---

## 4. MASTER ASSET PRIORITY CHECKLIST & FORMAT REQUIREMENTS

| Priority | Asset Name | Required Delivery Format | Required Animation Clips | Role in Game |
| :---: | :--- | :--- | :--- | :--- |
| **1 (POC)** | **Hero Leader** | Rigged `.glb` (1.8m height) | `Idle`, `Run`, `Attack`, `Hit`, `Death` | Main controllable player character |
| **2** | **Friendly Squad Soldier** | Rigged `.glb` (1.6m height) | `Idle`, `Run`, `Attack`, `Hit`, `Death` | Recruited allies following in formation |
| **3** | **Enemy Grunt Warrior** | Rigged `.glb` (1.6m height) | `Idle`, `Run`, `Attack`, `Hit`, `Death` | Foot soldiers in final battle arena |
| **4** | **Enemy Warlord Captain** | Rigged `.glb` (2.0m height) | `Idle`, `Run`, `Attack`, `Hit`, `Death` | Army commander blocking exit arena |
| **5** | **Temporal Math Gates** | Static `.glb` + Three.js shader | None | Paired `+` and `-` gate structures with energy curtain |
| **6** | **Modular Bridge & Environment** | Static `.glb` meshes | None | Boardwalk roadway, railings, pine trees, mountain cones |
| **7** | **Exit Time Portal** | Static `.glb` + procedural spin | Three.js continuous rotation | Post-battle victory progression gateway |
| **8** | **Combat Sparks & VFX** | Three.js procedural sprites / particles | WebGL particle life tween | Sword swing trails, hit sparks, gate pop |

---

## 5. READY-TO-COPY PROMPTS FOR EVERY ASSET

### Asset 1: Hero Squad Leader (PROOF OF CONCEPT FIRST!)
*Start here! This is your primary player character.*

#### Step 1A: Prompt for Gemini App (Generates Reference Orthographic Sheet)
```text
Act as a senior 3D character concept artist for mobile action games.
Create a high-resolution, full-body 3D character concept sheet for the "Hero Squad Leader" of a stylized low-poly fantasy game called Time Shift Squad.

Visual Specifications:
- Character: Heroic chibi warrior leader with stylized proportions (large head, distinct broad shoulders, capsule limbs).
- Skin Tone: Warm golden-amber tone (#f59e0b).
- Helmet & Head: Ancient hoplite-style helmet with a tall, vibrant scarlet-red brush crest/plume (#ef4444) running down the center. Gilded cheek guards.
- Armor: Polished gold and gunmetal steel chestplate cuirass (#fbbf24 and #475569), leather warrior battle skirt with bronze studs, sturdy brown leather boots with gold knee guards.
- Weapon: Wielding a broad-bladed steel sword with an ornate golden crossguard and pommel.
- Poses on Sheet: Two views on one image:
  1. Front orthographic T-pose or A-pose (arms 45 degrees down, palms down, feet flat on ground).
  2. Dynamic 3/4 perspective action pose holding the sword.
- Art Style: Stylized low-poly 3D game asset, Nintendo/Supercell aesthetic, clean flat-shaded polygon facets, sharp silhouettes, bright ambient occlusion.
- Background: Pure solid neutral gray (#808080) background with NO shadows or background scenery, perfectly isolated for 3D model reconstruction.
```

#### Step 1B: Prompt for 3D Generator (Meshy.ai / Tripo3D / Rodin)
```text
3D stylized low-poly game character model of a heroic warrior leader, golden skin, hoplite helmet with scarlet plume, gold breastplate, leather war skirt, brown boots, holding broadsword. Chibi proportions, clean faceted geometry under 3,500 triangles. T-pose or A-pose with feet flat on the ground plane (Y=0), pivot at bottom center. Export as clean binary GLB with embedded PBR materials.
```

#### Step 1C: Mixamo Animation Checklist (Free Auto-Rigging)
Upload the `.glb` (or converted `.fbx`) to Mixamo:
1. Place standard chin, wrists, elbows, knees, and groin markers.
2. Download these 5 standard animation clips as **FBX with Skin (or without skin for clips 2-5)** at 30 FPS:
   - **`Idle`**: Search `"Sword And Shield Idle"` or `"Warrior Idle"`.
   - **`Run`**: Search `"Warrior Running"` or `"Sword Run"`. Ensure `In Place` checkbox is **CHECKED**.
   - **`Attack`**: Search `"Sword Slash"` or `"Melee Attack 360"`.
   - **`Hit`**: Search `"Impact Recoil"` or `"Hit Reaction"`.
   - **`Death`**: Search `"Fall Backward Death"` or `"Warrior Death"`.

---

### Asset 2: Friendly Squad Soldier (Follower)

#### Prompt for Gemini App (Reference Sheet)
```text
3D character concept design sheet for a "Friendly Squad Soldier" follower in the stylized low-poly mobile game Time Shift Squad.
- Character: Young recruit warrior, stylized chibi proportions, slightly smaller than the squad leader (1.6m tall).
- Skin Tone: Warm golden-amber (#f59e0b) matching the squad leader.
- Outfit: Simple tan leather tunic with a dark brown diagonal shoulder baldric strap, dark brown leather bracers, simple leather travel boots. Rounded spherical head with short tidy brown hair.
- Weapon: Holding a double-edged iron shortsword in right hand.
- Sheet Layout: Left side shows full-body front A-pose (arms at 45 degrees, feet planted on ground plane); Right side shows 3/4 hero ready stance.
- Art Style: Stylized low-poly 3D game asset, clean polygonal facets, sharp edges, flat shading, Supercell mobile game quality.
- Background: Solid neutral medium gray (#808080), zero background objects, clean silhouette for 3D conversion.
```

#### Prompt for 3D Generator (Meshy.ai / Tripo3D)
```text
3D stylized low-poly model of a friendly squad soldier recruit, golden skin, tan leather tunic, shoulder strap, iron shortsword. Chibi athletic proportions, under 2,200 polygons. A-pose with feet grounded on origin plane (Y=0), pivot at bottom center. Export as binary GLB with embedded textures.
```

---

### Asset 3: Enemy Grunt Foot Soldier

#### Prompt for Gemini App (Reference Sheet)
```text
3D character concept design sheet for an "Enemy Grunt Foot Soldier" in Time Shift Squad.
- Character: Aggressive dark warrior footman with stylized chibi proportions (1.6m tall).
- Skin Tone: Deep crimson red (#dc2626).
- Helmet & Armor: Dark blackened-iron conical helmet with narrow eye slit, studded dark leather chest harness over black tunic, iron arm bands, dark boots.
- Weapon: Holding a heavy jagged curved iron scimitar or cleaver in right hand.
- Sheet Layout: Left side shows front A-pose (arms 45 degrees, palms facing inward, feet flat on ground plane); Right side shows aggressive forward combat stance.
- Art Style: Stylized low-poly 3D game asset, bold silhouettes, clean faceted polygonal surfaces, vibrant contrasting red skin and dark iron armor.
- Background: Solid neutral medium gray (#808080), isolated character, no floor clutter.
```

#### Prompt for 3D Generator (Meshy.ai / Tripo3D)
```text
3D stylized low-poly model of an enemy grunt soldier, crimson red skin, black iron helmet, studded dark armor, curved iron cleaver. Aggressive chibi proportions, under 2,200 polygons. A-pose with feet grounded on origin (0,0,0). Export as binary GLB.
```

---

### Asset 4: Enemy Warlord Captain (Boss)

#### Prompt for Gemini App (Reference Sheet)
```text
3D character concept design sheet for the "Enemy Warlord Captain" boss in Time Shift Squad.
- Character: Imposing, muscular warlord leader (2.0m tall, 35% larger than grunts).
- Skin Tone: Deep crimson red (#dc2626).
- Helmet & Armor: Horned black obsidian helmet with glowing orange eye slits, heavy spiked iron shoulder pauldrons, blackened steel breastplate with crimson skull crest, studded leather kilt, heavy iron greaves.
- Weapon: Carrying a massive two-handed executioner broadsword with jagged serrated edge.
- Sheet Layout: Front orthographic A-pose on left; Intimidating 3/4 roar combat pose on right.
- Art Style: Stylized low-poly 3D villain, clean polygonal facets, sharp specular highlights, high mobile game visual quality.
- Background: Solid neutral gray (#808080), completely isolated.
```

#### Prompt for 3D Generator (Meshy.ai / Tripo3D)
```text
3D stylized low-poly character model of an enemy boss warlord, crimson red skin, horned obsidian helmet, spiked pauldrons, heavy executioner blade. Imposing broad chibi proportions, under 3,500 polygons. A-pose with feet grounded at Y=0. Export as binary GLB.
```

---

### Asset 5: Temporal Math Gates (+ Positive Blue / - Negative Red)

#### Prompt for Gemini App (Prop Concept)
```text
3D game prop concept sheet for a pair of twin "Sci-Fi Time Shift Math Gates" set on a wooden bridge platform.
- Architecture:
  1. Left Gate (Positive): Twin heavy dark-slate industrial support pillars (2.6m tall) supporting a top metallic crossbeam with a prominent mechanical analog clock dial gauge in the center. An energetic electric-blue glowing holographic barrier (#0ea5e9) stretches between the posts with a bold 3D '+5' hovering in the center.
  2. Right Gate (Negative): Same pillar frame with yellow-and-black hazard warning chevrons on posts, crackling red energy forcefield (#ef4444) with a bold 3D '-3' hovering in the center.
- Dimensions: Overall width 2.8m, height 2.6m per gate.
- Perspective: Front orthographic view on top; 3/4 isometric perspective on bottom.
- Style: Stylized low-poly 3D prop, chunky bevels, clean mechanical details, mobile arcade runner aesthetic.
- Background: Solid clean white background (#FFFFFF).
```

#### Prompt for 3D Generator (Meshy.ai / Tripo3D)
```text
3D stylized low-poly sci-fi archway gate with top analog clock dial, industrial frame posts, width 2.8m, height 2.6m, hollow center opening for energy barrier. Under 1,200 polygons. Grounded at Y=0. Export as binary GLB.
```

---

### Asset 6: Modular Boardwalk Path, Railings & Alpine Vista

#### Prompt for Gemini App (Environment Concept Sheet)
```text
Modular 3D environment kit concept sheet for an elevated alpine boardwalk bridge and surrounding nature.
- Assets displayed side-by-side on one sheet:
  1. Boardwalk Tile: Straight 10m long x 6.2m wide elevated road section featuring light-gray center stone paving planks flanked by rich warm cedar wood planks.
  2. Fence Module: 2.4m long rustic timber fence section with two horizontal wooden rails and cylindrical vertical posts.
  3. Stylized Pine Tree: Conical evergreen tree with 3 stacked faceted cone tiers of vibrant green foliage and a chunky brown trunk.
  4. Alpine Mountain: Low-poly conical mountain peak with white snow-covered summit and slate-gray rock base.
- Style: Stylized low-poly PBR 3D game environment kit, Nintendo/Supercell visual feel, bright daylight, clean geometry.
- Background: Clean white studio isolation (#FFFFFF).
```

---

### Asset 7: Exit Chrono-Portal (Victory Gateway)

#### Prompt for Gemini App (Prop Concept)
```text
3D game asset concept for a "Temporal Chrono-Portal" gate used as the level victory exit.
- Features: An ancient weathered stone circular gateway ring (4m outer diameter) with carved futuristic glowing glyphs. Inner ring made of brushed brass clockwork gears. In the portal center is a swirling turquoise and cyan temporal vortex particle field (#38bdf8).
- View: Front elevation view and 3/4 perspective view.
- Style: Stylized low-poly fantasy sci-fi asset, clean faceted polygons, vibrant emissive glow.
- Background: Solid neutral background (#808080).
```

---

## 6. SKELETAL ANIMATIONS & TOOL CAPABILITY MATRIX

To ensure realistic expectations, here is what automated 3D tools provide versus what requires Three.js script handling:

| Clip Name | Mixamo Auto-Rig Support | Required Playback Logic in Game | Fallback if Clip is Missing |
| :--- | :---: | :--- | :--- |
| **`Idle`** | **100% Native** | Loop when velocity is 0 (outside battle) or awaiting target | Procedural gentle breathing bob |
| **`Run`** | **100% Native** | Loop with speed proportional to velocity vector | Current procedural leg swing |
| **`Attack`** | **100% Native** | Play once on melee interval (0.45s) when target $\le 1.6\text{m}$ | Current procedural sword slash |
| **`Hit`** | **100% Native** | Play once on taking damage, blend with hit flash | Red material color flash |
| **`Death`** | **100% Native** | Play once, stop on final frame, disable collision | Current $90^\circ$ backward fall |

---

## 7. NON-BREAKING CODE INTEGRATION BLUEPRINT

When your GLB files are ready, here is how each one connects into [`main.js`](file:///c:/TimeShiftSquad/main.js) without altering existing game systems:

### 1. Zero Changes to Core Systems
- **Player Controller**: Keybindings (WASD/Joystick), dodge-rolls, speed ($13.5\text{m/s}$), and acceleration remain untouched.
- **Math Logic**: Gates (+5, +4, -3) and squad array mutations (`squadMembers.push/pop`) operate identically.
- **Formation Algorithm**: `idealRowCenter`, $Z$-offset trailing, and hard fence boundary clamping ($[-2.55, +2.55]$) remain unchanged.
- **Combat Resolution**: Health pools (150 Leader, 100 Followers, 140 Captain, 45 Grunts), damage values, and ghost-attack prevention logic remain 100% identical.

### 2. Mesh Swapping via the Character Rig Function
In [`main.js:324`](file:///c:/TimeShiftSquad/main.js#L324), `buildHumanoidCharacter` currently constructs primitive spheres and capsules attached to `character.root`.
With a GLB model:
```javascript
// Example: Seamless GLB Attachment
loader.load('assets/models/characters/hero_leader.glb', (gltf) => {
  const model = gltf.scene;
  model.scale.set(1.0, 1.0, 1.0);
  model.position.set(0, 0, 0); // Aligned to character.root origin
  character.root.add(model);

  // Setup AnimationMixer
  character.mixer = new THREE.AnimationMixer(model);
  character.actions = {
    idle: character.mixer.clipAction(gltf.animations.find(c => c.name.includes('Idle'))),
    run: character.mixer.clipAction(gltf.animations.find(c => c.name.includes('Run'))),
    attack: character.mixer.clipAction(gltf.animations.find(c => c.name.includes('Attack'))),
  };
  character.actions.idle.play();
});
```

---

## 8. STEP-BY-STEP ACTION: WHAT TO DO FIRST

Follow this exact single step to produce your first proof-of-concept asset:

1. **Open Gemini App** in your browser.
2. Copy the exact prompt from **Section 5, Asset 1, Step 1A (Hero Squad Leader)**:

```text
Act as a senior 3D character concept artist for mobile action games.
Create a high-resolution, full-body 3D character concept sheet for the "Hero Squad Leader" of a stylized low-poly fantasy game called Time Shift Squad.

Visual Specifications:
- Character: Heroic chibi warrior leader with stylized proportions (large head, distinct broad shoulders, capsule limbs).
- Skin Tone: Warm golden-amber tone (#f59e0b).
- Helmet & Head: Ancient hoplite-style helmet with a tall, vibrant scarlet-red brush crest/plume (#ef4444) running down the center. Gilded cheek guards.
- Armor: Polished gold and gunmetal steel chestplate cuirass (#fbbf24 and #475569), leather warrior battle skirt with bronze studs, sturdy brown leather boots with gold knee guards.
- Weapon: Wielding a broad-bladed steel sword with an ornate golden crossguard and pommel.
- Poses on Sheet: Two views on one image:
  1. Front orthographic T-pose or A-pose (arms 45 degrees down, palms down, feet flat on ground).
  2. Dynamic 3/4 perspective action pose holding the sword.
- Art Style: Stylized low-poly 3D game asset, Nintendo/Supercell aesthetic, clean flat-shaded polygon facets, sharp silhouettes, bright ambient occlusion.
- Background: Pure solid neutral gray (#808080) background with NO shadows or background scenery, perfectly isolated for 3D model reconstruction.
```

3. Paste it into Gemini App and save the resulting high-res image.
4. Upload that image into **Meshy.ai** (Image to 3D) or **Tripo3D** to generate your first `hero_leader.glb` file.
5. Once downloaded, place it in `assets/models/characters/hero_leader.glb`.

