# TIME SHIFT SQUAD — GAME DESIGN & VISUAL ASSET BIBLE

---

## 1. GAME CONCEPT

### Genre & High Concept
*Time Shift Squad* is a **Third-Person 3D Squad-Building Action Arcade Game** built in WebGL/Three.js. It merges the strategic decision-making of lane/math-gate runners with the tactile control, directional freedom, spatial navigation, and encounter-based combat of an action-adventure game.

### Core Premise
The player controls a lone temporal warrior stranded in a chronologically fractured realm. As the warrior traverses paths suspended high above rolling meadows and alpine peaks, they encounter **Temporal Gates (+ / -)** and **Time-Dial Upgrade Stations**. Passing through the correct chronological frequencies multiplies and empowers their squad with loyal temporal soldiers. At the climax of each route, an enemy barricade and opposing warband block forward passage, requiring the accumulated squad to engage in an automatic, high-stakes melee battle to secure the timeline.

### Player Objective
1. **Pilot** the leader character with 360° directional precision (WASD / analog joystick).
2. **Calculate & Choose** optimal gate routes under real-time movement pressure to build maximum squad numbers and combined team health.
3. **Keep the Squad Formed & Intact** within the boundaries of the bridge without shedding followers.
4. **Overwhelm & Crush** the enemy army in the central arena clash through superior numbers, tactical accumulation, and accumulated health advantage.
5. **Unlock & Pass** through the liberated temporal portal into the next era.

### What Makes the Gameplay Fun
- **Direct Kinetic Agency**: The player is never pushed forward on an automated conveyor. Every step, turn, dodge-roll, and lane swap is purely driven by player input.
- **Immediate Math Gratification**: Hitting a `+5` gate immediately materializes 5 distinct armored allies who fall into formation with a satisfying chime and visual burst.
- **Spatial Squad Orchestration**: Leading a large squad of 10–15 characters requires navigating turns without bumping into fences, creating a tactile "squad-steering" sensation.
- **Dramatic Clash of Armies**: Transitioning smoothly from route navigation to an arena clash where two distinct color-coded armies charge each other, clash swords in the center, and chip away at health bars in real time delivers high spectator satisfaction.

---

## 2. VISUAL STYLE

### Art Direction: Stylized Low-Poly Action
Inspired directly by the reference visual direction, the game adopts a **vibrant, stylized low-poly aesthetic** with clean faceted surfaces, sharp silhouettes, warm high-saturation lighting, and rich ambient depth.

### Key Visual Pillars
- **Depth & Immersion (Anti-Tabletop)**:
  - Deep perspective field of view ($56^\circ$) looking forward into an infinite scenic horizon.
  - Atmospheric depth cues: subtle sky-blue exponential fog (`#87ceeb`), distant snow-dusted low-poly mountain peaks, rolling green meadows far below, and conical pine tree clusters.
  - No flat tabletop boxes; the world feels like an elevated roadway carving through an expansive high-altitude alpine landscape.
- **Character Proportions & Silhouette**:
  - Stylized "heroic chibis": spherical heads, expressive helmets/crests, cylindrical torso armor, capsule limbs, and distinct broad-bladed swords.
  - Hero faction: Warm golden skin (`#f59e0b`), steel and gilded chest armor (`#fbbf24`), red plumes/crests (`#ef4444`).
  - Enemy faction: Deep crimson skin (`#dc2626`), blackened obsidian/iron armor (`#1e1b4b`), spiked horns/crests, aggressive broadswords.
  - Distinct leader silhouettes: 30% larger scale, ornate winged/crested helmets, gilded chestplates.
- **Materials & Shading**:
  - PBR standard materials with soft roughness ($0.35$–$0.6$) and selective metallic highlights ($0.6$–$0.8$) on armor plates, helmet crests, and sword edges.
  - Stylized light response: bright specular rims on character heads and shoulders against the blue sky backdrop.
- **Lighting & Shadows**:
  - High-angle directional sunlight (`#fff7ed`, intensity 1.35) casting sharp, filtered PCF soft shadows diagonally across the boardwalk floor.
  - Dual-tone ambient balance: cool sky light (`#b1e1ff`) from above and warm meadow bounce light (`#4ade80`) from below.
- **Camera Presentation**:
  - Smooth third-person chase camera positioned slightly elevated behind the squad leader ($9.5\text{m}$ back, $5.6\text{m}$ up).
  - Interpolated damping that smoothly tracks heading changes without disorienting snaps.
  - Seamless cinematic transition into an elevated overview when entering combat.

---

## 3. PLAYER AND SQUAD

### Initial State: Solo Leader
The level initiates with **exactly one controllable player unit**—the Squad Leader. No squad members exist at spawn.

### Collection & Math Gate Progression
- As the player maneuvers along the path, they encounter pairs of **Temporal Math Gates**.
- Crossing a positive gate (`+N`) recruits $N$ additional followers into the squad.
- Crossing a negative gate (`-N`) reduces the squad by $N$ followers, down to a guaranteed minimum of $1$ (the leader).
- Real health is cumulative:
  $$\text{Squad Total HP} = \text{Leader HP (150)} + \sum_{i=1}^{k} \text{Follower}_i \text{ HP (100)}$$
- Total health scales dynamically with squad size, verified in real-time on the top HUD.

### Formation Dynamics & Spatial Rules
- **Follower Slot Allocation**: Followers arrange in an organized 3-column grid directly behind the leader:
  $$\text{Col Offset} \in \{-0.9\text{m}, 0.0\text{m}, +0.9\text{m}\}, \quad \text{Row Offset} = 1.1\text{m} + \text{row} \times 1.15\text{m}$$
- **Anti-Pendulum Trailing**: Follower offsets are calculated strictly along the world $Z$-track rather than swinging with momentary rotational turns, completely eliminating the pendulum swing effect that previously threw squad members outside the bridge.
- **Adaptive Lane Squeezing**: When the leader steers toward either railing, the formation's lateral spread automatically compresses inward ($\text{spreadFactor} \in [0.75, 1.0]$), and row centers dynamically shift (`idealRowCenter`) so no follower ever intersects or clips through boundary fences.

---

## 4. CORE LEVEL SEQUENCE

### Detailed Sequence Rules
1. **Solo Start**: Level begins at $Z = +15.0$ with 1 controllable character.
2. **Strict Gate Pairing**:
   - Every pair contains **exactly one positive (+)** and **one negative (-)** gate.
   - Positive/negative positions alternate (Pair 1: Left +, Pair 2: Right +, Pair 3: Left +).
   - **No multiplication gates** prior to the final battle.
   - Operations apply immediately and mutate real unit counts and team HP pools.
3. **Encounter Transition**:
   - At $Z = -98.0$, forward exploratory movement locks.
   - Both friendly and enemy units charge into the arena center at $Z = -112.0$.
4. **Cinematic Arena Clash**:
   - The camera repositions to an elevated overhead view looking at the exact center.
   - Virtual joysticks and desktop control hints smoothly fade away to clear the viewport.
5. **Post-Battle Resumption**:
   - The red arena boundary barrier vanishes on victory, allowing the player to resume forward movement into the exit portal.

---

## 5. COMBAT DESIGN

### Combatants & Balancing Model
| Unit Type | Team | Count | Base HP | Attack Damage | Attack Interval | Total DPS | Total HP |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Hero Leader** | Friendly | 1 | 150 | 45 | 0.45s | 100.0 | 150 |
| **Squad Soldier** | Friendly | 0–11 | 100 ea | 30–38 | 0.45s | ~71.0 ea | 0–1,100 |
| **Enemy Captain** | Hostile | 1 | 140 | 16 | 0.75s | 21.3 | 140 |
| **Enemy Warrior** | Hostile | 7 | 45 ea | 10–14 | 0.85s | ~12.0 ea | 315 |

### Battle Mechanics & AI Loop
1. **Target Acquisition**: Every living friendly selects the nearest living enemy; every living enemy selects the nearest living friendly.
2. **Dynamic Retargeting**: The instant a target's HP reaches 0, the attacking unit immediately drops the target reference and acquires the next closest living opponent.
3. **Melee Range Check**: Units advance at run speed until within $1.6\text{m}$ melee proximity.
4. **Attack Animation & Sound**:
   - Swords raise and slash downward (`rightArm.rotation.x = -Math.PI / 1.5`).
   - Web Audio synthesizer triggers crisp whoosh swings and impact thuds.
   - Red damage numbers float upward from the impacted unit (`-35`, `-12`).
5. **Strict Ghost-Attack Prevention**:
   - Every attack loop strictly checks `if (!unit.alive || unit.hp <= 0) return;` for both attacker and target prior to calculating or applying damage.
6. **Decisive Route Outcomes**:
   - **Strong Route (+5, +4, +2 $\rightarrow$ 12 units, 1,250 HP, ~880 DPS)**: Completely demolishes the 455 HP enemy army in $\sim 1.5\text{–}2.0\text{ seconds}$ with over 1,000 squad HP remaining.
   - **Weak Route (-3, -4, -3 $\rightarrow$ 1 unit, 150 HP, 100 DPS)**: Single hero is surrounded and killed in under $2\text{ seconds}$ by the combined 105 DPS of the 8 enemies.

---

## 6. CAMERA AND ENVIRONMENT

### Third-Person Dynamic Camera
- **Normal Traversal**:
  - Distance: $9.5\text{m}$ behind player.
  - Height: $5.6\text{m}$ above road level.
  - Look Target: $4.0\text{m}$ ahead of the leader at $Y = 1.2\text{m}$.
  - Responsiveness: Lerp factor $7 \times \Delta t$ provides smooth cinematic follow with zero jarring snap-turns.
- **Battle Overview**:
  - Position: $(0.0, 9.2, -97.0)$.
  - Look Target: $(0.0, 1.2, -112.0)$ (exact arena center).
  - Downward Pitch: $28.5^\circ$ downward viewing angle.
  - Framing: Fully frames all 20 potential combatants with wide lateral margins and complete clearance from screen edges.

### Environmental Composition
- **Elevated Boardwalk Path**:
  - Central stone paver lane (Width: $6.2\text{m}$) flanked by rich wooden plank borders (`#9a3412`).
  - Sturdy timber guard railings and vertical cylindrical posts (`#78350f`) along both flanks.
  - Safe inner walking zone: $X \in [-2.55\text{m}, +2.55\text{m}]$ ensuring characters never penetrate the wooden fence line.
- **Surrounding Vista**:
  - Endless green alpine valley floor ($Y = -0.05\text{m}$) stretching $600\text{m}$ across.
  - Staggered conical evergreen trees with multi-tier low-poly foliage along the left and right drops.
  - Ring of 36 low-poly mountain peaks with snow caps encircling the distant horizon.

---

## 7. HUD AND FEEDBACK

### HUD Requirements
1. **Player Squad Card (Top-Left)**:
   - Cyan/Sky-blue glassmorphic theme (`#0284c7`, `#38bdf8`).
   - Living squad count badge (`SQUAD: X`).
   - Smooth animated green health gauge (`#22c55e`).
   - Real-time numeric health readout (`TEAM HP: X / Y`).
2. **Enemy Army Card (Top-Right)**:
   - Crimson glassmorphic theme (`#dc2626`, `#ef4444`).
   - Living enemy count badge (`ENEMIES: X`).
   - Smooth animated red health gauge.
   - Real-time numeric health readout (`ARMY HP: X / Y`).
3. **Overhead Health Bars**:
   - **Enemies**: Slim, clean horizontal health gauge floating above head (red fill on dark slate container). **Zero numeric text labels** to prevent visual clutter.
   - **Heroes**: Kept clean with no floating numbers (team health is monitored on the top HUD).
4. **Floating Feedback Effects**:
   - Positive gate hit: Rising cyan text (`+5 SQUAD`, `+4 SQUAD`).
   - Negative gate hit: Rising red text (`-3 SQUAD`).
   - Combat hit: Rising bright crimson damage numbers (`-45`, `-30`, `-12`).
5. **Event Banners**:
   - Center banner triggered on gate passage, encounter alert, and battle resolution.
6. **End-of-Run Modals**:
   - **Level Complete / Victory**: Celebratory green modal with golden border, fanfare chord progression, and "NEXT LEVEL" / "PLAY AGAIN" call-to-action.
   - **Game Over / Defeat**: Dramatic red modal with defeat sting sound and "RETRY LEVEL" button.

---

## 8. VISUAL ASSET LIST

### Character Assets
1. **Hero Leader**:
   - *Appearance*: Distinct golden skin, ornate winged/crested hoplite-style helmet with scarlet plume, gold breastplate, leather war skirt, brown boots, capsule limbs, carrying a gleaming steel broadsword with gold crossguard.
   - *Proportions*: Stylized low-poly chibi, slightly enlarged head and shoulders, 30% larger than grunts.
2. **Hero Squad Member**:
   - *Appearance*: Golden skin, leather tunic with diagonal chest strap, arm wraps, clean spherical head with short brown hair or simple skull cap, holding a short iron broadsword.
   - *Proportions*: Standard stylized low-poly chibi, cohesive unified silhouette.
3. **Enemy Warlord Captain**:
   - *Appearance*: Crimson red skin, menacing horned blackened-iron helmet, obsidian plate armor with jagged pauldrons, glowing amber eyes, carrying an oversized jagged executioner blade.
   - *Proportions*: Broad, imposing, 35% larger than enemy grunts.
4. **Enemy Grunt**:
   - *Appearance*: Crimson red skin, black iron conical helmet, dark studded leather vest, wielding an iron curved cleaver sword.
   - *Proportions*: Agile, aggressive low-poly chibi warrior.

### Environment & World Geometry Assets
5. **Elevated Modular Boardwalk Highway**:
   - Pale gray flagstone center path flanked by rich cedar planks and sturdy post-and-beam guardrails.
6. **Alpine Terrain & Flora**:
   - Three-tiered faceted pine/fir trees with natural green tone variations; sharp snow-dusted distant mountain peaks.
7. **Time-Dial Upgrade Gate (Positive)**:
   - Heavy industrial archway with twin support pillars, a top mechanical dial gauge with ticking needle, glowing blue chronal portal field, and bold 3D `+5` typography.
8. **Time-Dial Upgrade Gate (Negative)**:
   - Identical industrial archway with warning hazard stripes, crackling red energy field, and bold 3D `-3` typography.
9. **Exit Chrono-Portal**:
   - Circular stone ring gateway with rotating concentric rings, glowing teal/cyan particle vortex inside.

### Combat, UI & Particle Assets
10. **Impact Sparks & Slash VFX**:
    - Arc-shaped white/yellow slash trails, orange-red hit sparks.
11. **UI Badges & Icons**:
    - Glassmorphic rounded icons for Squad, Army HP, Dodge-roll boot with motion streaks, Crossed swords.

---

## 9. IMAGE GENERATION PROMPTS

### Prompt 1: Hero Squad Leader (Character Sheet / Transparent Background)
```text
3D stylized low-poly game character asset, Hero Squad Leader, full body front 3/4 view. Golden amber skin tone, polished gold and steel cuirass armor, heroic ancient hoplite helmet with a vibrant scarlet red brush crest, leather war skirt with brass studs, sturdy leather boots. Holding a gleaming steel broadsword with a golden hilt. Stylized proportions, oversized head and expressive chibi features, heroic stance. Studio lighting with warm key light and cool cyan rim light, clean sharp shadows, isolated on a pure transparent white background, octane render, 8k resolution, clean edges, game ready asset sheet.
```

### Prompt 2: Hero Squad Soldier (Follower / Transparent Background)
```text
3D stylized low-poly game character asset, Friendly Squad Soldier, full body front 3/4 view. Golden amber skin tone matching leader, simple tan leather tunic with diagonal shoulder strap, leather bracers, dark brown boots, rounded spherical head with clean minimal features. Holding a double-edged iron shortsword in right hand. Athletic ready stance, stylized chibi proportions slightly smaller than leader. High quality ambient occlusion, warm sunlight, crisp faceted polygons, isolated on a pure transparent white background, 8k render, game asset sprite.
```

### Prompt 3: Enemy Warlord Captain (Transparent Background)
```text
3D stylized low-poly game character asset, Boss Enemy Warlord Captain, full body front 3/4 view. Deep crimson red skin, imposing black obsidian plate armor with jagged spiky pauldrons, menacing horned dark iron helmet with glowing fiery orange eye slits. Holding a heavy jagged dark steel cleaver blade. Broad, hulking chibi proportions, intimidating combat stance. High contrast dramatic underlighting with red rim light, sharp faceted polygon edges, isolated on a pure transparent white background, 8k resolution, mobile action game boss asset.
```

### Prompt 4: Enemy Grunt Warrior (Transparent Background)
```text
3D stylized low-poly game character asset, Enemy Foot Soldier, full body front 3/4 view. Crimson red skin tone matching warlord, black iron conical helmet, dark studded leather vest, wielding an iron curved cleaver sword. Aggressive ready stance, stylized low-poly chibi warrior proportions, clean polygonal facets, sharp directional sun lighting with crimson bounce light, isolated on a pure transparent white background, 8k resolution, mobile action game asset.
```

### Prompt 5: Temporal Math Gate Pair (+5 Blue & -3 Red) (Transparent Background)
```text
3D game prop asset, pair of twin futuristic stylized low-poly temporal sci-fi gates side-by-side on a wooden platform. Left gate has heavy dark metallic arch pillars, an analog clock dial gauge on top, a semi-transparent glowing electric blue energy forcefield with a giant bold 3D '+5' floating in center. Right gate has dark hazard striped pillars, a clock dial on top, a crackling semi-transparent crimson red energy forcefield with a bold 3D '-3' floating in center. Isometric 3/4 angle view, vibrant neon glow, volumetric light, clean faceted geometry, isolated on a pure transparent white background, 8k render.
```

### Prompt 6: Complete Environment & Boardwalk Concept Art
```text
3D video game environment concept art, high-altitude third-person perspective. A wide wooden boardwalk pathway with gray stone center pavers and timber railings stretches from the foreground into the distance. Flanked on both sides by steep drop-offs revealing rolling vibrant green alpine valleys far below. Distant horizon ringed with sharp low-poly snow-peaked mountains under a bright pastel blue sky with soft volumetric clouds. Stylized multi-tiered low-poly pine trees along the valley floor. High sun casting crisp diagonal shadows across the bridge, warm saturated color palette, whimsical action game atmosphere, octane render, 8k resolution, panoramic widescreen.
```

### Prompt 7: Final Arena Clash Scene (Key Art)
```text
Dynamic 3D video game key art, overhead third-person combat arena perspective. In the center of an elevated wooden bridge arena, a squad of 10 stylized golden-armored heroes with swords clashes face-to-face against 8 crimson-skinned dark obsidian armored enemy warriors. Sword slashes, vibrant orange spark particles, dynamic dust clouds. Elevated camera angle framing the central battle between wooden fences, glowing red laser barrier in the background. Bright sun lighting, vivid colors, stylized low-poly 3D action game aesthetic, cinematic composition, 8k resolution.
```

---

## 10. CURRENT IMPLEMENTATION GAPS

| Feature / Subsystem | Current Status in Codebase | Verification & Gap Analysis |
| :--- | :---: | :--- |
| **Solo Player Start** | **Working** | Player spawns with 1 character (`heroLeader`, 150 HP). Squad list is initialized as `[]`. Verified in `main.js:472`. |
| **Manual Directional Movement** | **Working** | No automated forward runner. Character moves only when WASD, arrow keys, or touch analog joystick are active. Verified in `main.js:935`. |
| **Fence Clamping & Squad Boundary** | **Working** | Player and followers use `idealRowCenter` and hard-clamping to $[-2.55, +2.55]$. Followers no longer swing outside rails on sharp turns. Verified in `main.js:1072`. |
| **Math Gates (+ / - Pairing)** | **Working** | Three gate pairs placed at $Z = -20, -50, -80$. Exactly one positive and one negative per pair. Alternating positions. No multiplication gates before final fight. Verified in `main.js:643`. |
| **Battle Center & Camera Framing** | **Working** | Battle triggers at $Z = -98.0$, squads converge to $Z = -112.0$ (center). Camera elevates to $(0, 9.2, -97.0)$ looking at $(0, 1.2, -112.0)$. Controls fade out. Verified in `main.js:1200`. |
| **Combat Outcome & Ghost Damage** | **Working** | Dead units are barred from attacking via `if (!unit.alive) return;`. Enemies rebalanced to 455 HP (8 units); positive gate squads (12 units, 1,250 HP) win decisively. Logs `[BATTLE START]` and `[BATTLE END]`. Verified in `main.js:1105`. |
| **Overhead Health Bars** | **Working** | Enemies feature a clean visual health bar fill with **no floating numbers**. Players display health on top HUD. Verified in `main.js:453`. |
| **Visual Mesh Fidelity** | **Needs Upgrade** | Characters are currently composed of Three.js programmatic geometric primitives (spheres, capsules, boxes). They require imported stylized low-poly meshes or custom texture maps generated from the visual bible prompts. |
| **Curved & Branching Roads** | **Needs Upgrade** | The track is currently a single linear straightaway ($Z = +25$ to $-135$). Connected curved segments and branching Y-junctions from `design-preview.js` need to be integrated into the primary gameplay loop. |
| **Overworld Collectibles** | **Needs Upgrade** | Squad recruits currently materialize directly when crossing a math gate. Standalone friendly characters stationed on the road awaiting rescue/recruitment are not yet implemented. |
| **Skeletal Rigging & Combat Combos** | **Needs Upgrade** | Walking and attacking currently rely on basic rotation lerps (`rotation.x = -Math.PI / 1.5`). They function correctly, but skinned mesh animations (run cycles, 3-hit slash combos, stagger reactions) will dramatically elevate visual feel. |
