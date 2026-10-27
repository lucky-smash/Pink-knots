// Procedural Pink Knots gift box: a charcoal rigid box with a Knot Red satin
// ribbon and bow. `setProgress(0..1)` drives the whole opening sequence, so the
// scene is a pure function of scroll position — no timers, no hidden state.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { CARD_PRINT, HANDOFF, drawCard, finalCardFraction } from "./heroCard";

// Knot Red (#C82A0F), pre-darkened so it survives ACES tone mapping and the warm key light on screen
const KNOT_LIT = 0xa61f08;
const INK = 0x1f1a17;
const TISSUE = 0xeee3d1;

// Box dimensions (world units). Base sits on y = 0.
const W = 2.4;
const H = 1.45;
const WALL = 0.07;
const LID_H = 0.42;
const LID_OVER = 0.05; // lid overhang on each side
const RIBBON = 0.3;
const CARD_W = 1.2;
// End of the dive: camera just under the rim, looking down at the card on the liner floor
const CARD_FLOOR = WALL + 0.012;
const INSIDE_Y = H - 0.15;
const INSIDE_FOV = 42;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** Remaps v from [a,b] to [0,1], clamped. */
const span = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeIn = (t: number) => t * t * t;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function wordmarkTexture() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, c.width, c.height);
  g.fillStyle = "rgba(231, 220, 201, 0.82)";
  g.font = "600 92px 'Bricolage Grotesque', 'Helvetica Neue', Arial, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  // Wide tracking reads as a foil-stamped mark
  const text = "PINK KNOTS".split("").join(String.fromCharCode(8202));
  g.fillText(text, c.width / 2, c.height / 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function cardTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 320;
  drawCard(c, CARD_PRINT);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/**
 * A satin ribbon loop: a pinched teardrop curve in XY, swept across Z as a thin
 * band. Starts and ends at the origin (the knot) and extends toward +X.
 */
function ribbonLoopGeometry(length: number, height: number, width: number) {
  const segs = 72;
  const positions: number[] = [];
  const uvs: number[] = [];
  const index: number[] = [];
  for (let i = 0; i <= segs; i++) {
    const t = (i / segs) * Math.PI * 2;
    const reach = (1 - Math.cos(t)) / 2; // 0 at the knot, 1 at the loop tip
    const x = length * 2 * reach * (0.9 + 0.1 * reach);
    const y = height * Math.sin(t) * (0.3 + 0.7 * reach);
    // The ribbon narrows where it's gathered into the knot
    const w = (width / 2) * (0.55 + 0.45 * reach);
    positions.push(x, y, -w, x, y, w);
    uvs.push(i / segs, 0, i / segs, 1);
    if (i < segs) {
      const a = i * 2;
      index.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

/** A soft radial contact shadow — cheaper and softer than a shadow map on the floor. */
function contactShadowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(128, 128, 10, 128, 128, 128);
  grad.addColorStop(0, "rgba(26,22,19,0.55)");
  grad.addColorStop(0.45, "rgba(26,22,19,0.22)");
  grad.addColorStop(1, "rgba(26,22,19,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

export class GiftBoxScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(30, 1, 0.05, 60);
  private root = new THREE.Group();
  private lid = new THREE.Group();
  private bow = new THREE.Group();
  private loops: THREE.Mesh[] = [];
  private tails: THREE.Mesh[] = [];
  private bandX: THREE.Group;
  private bandZ: THREE.Group;
  private flaps: THREE.Group[] = [];
  private card: THREE.Mesh;
  private shadow: THREE.Mesh;
  private disposables: { dispose: () => void }[] = [];
  private progress = 0;
  private time = 0;
  private width = 1;
  private height = 1;

  constructor(canvas: HTMLCanvasElement, private opts: { idle: boolean }) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = envTex;
    this.scene.environmentIntensity = 0.45;
    pmrem.dispose();
    this.disposables.push(envTex);

    // Lights: warm key from upper right, cool-neutral fill, warm rim for silhouette.
    const key = new THREE.DirectionalLight(0xfff1e2, 2.4);
    key.position.set(4.5, 8, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = key.shadow.camera.bottom = -4;
    key.shadow.camera.right = key.shadow.camera.top = 4;
    key.shadow.bias = -0.0008;
    key.shadow.normalBias = 0.02;
    key.shadow.radius = 6;
    this.scene.add(key);
    this.scene.add(new THREE.HemisphereLight(0xfffaf2, 0xd9cbb4, 0.9));
    const rim = new THREE.DirectionalLight(0xffd2bf, 1.1);
    rim.position.set(-5, 3, -4);
    this.scene.add(rim);

    // Materials
    const inkMat = new THREE.MeshPhysicalMaterial({ color: INK, roughness: 0.66, clearcoat: 0.12, clearcoatRoughness: 0.6, sheen: 0.4, sheenColor: new THREE.Color(0x5a4e46) });
    inkMat.envMapIntensity = 0.55;
    const linerMat = new THREE.MeshStandardMaterial({ color: KNOT_LIT, roughness: 0.85, side: THREE.DoubleSide });
    const ribbonMat = new THREE.MeshPhysicalMaterial({ color: KNOT_LIT, roughness: 0.32, sheen: 1, sheenRoughness: 0.35, sheenColor: new THREE.Color(0xff9a80), side: THREE.DoubleSide });
    const tissueMat = new THREE.MeshStandardMaterial({ color: TISSUE, roughness: 0.95, side: THREE.DoubleSide });
    this.disposables.push(inkMat, linerMat, ribbonMat, tissueMat);

    const track = <T extends THREE.BufferGeometry>(g: T) => (this.disposables.push(g), g);
    const mesh = (g: THREE.BufferGeometry, m: THREE.Material, cast = true) => {
      const o = new THREE.Mesh(track(g), m);
      o.castShadow = cast;
      o.receiveShadow = true;
      return o;
    };

    // ── Base: an open box built from slabs so the interior is real ──────────
    const base = new THREE.Group();
    const floor = mesh(new RoundedBoxGeometry(W, WALL, W, 2, 0.02), inkMat);
    floor.position.y = WALL / 2;
    base.add(floor);
    const wallGeo = new RoundedBoxGeometry(W, H, WALL, 2, 0.02);
    const sideGeo = new RoundedBoxGeometry(WALL, H, W - WALL * 2, 2, 0.02);
    for (const z of [-1, 1]) {
      const w = mesh(wallGeo, inkMat);
      w.position.set(0, H / 2, z * (W / 2 - WALL / 2));
      base.add(w);
    }
    for (const x of [-1, 1]) {
      const w = mesh(sideGeo, inkMat);
      w.position.set(x * (W / 2 - WALL / 2), H / 2, 0);
      base.add(w);
    }
    // Knot Red liner on the inside faces
    const inner = W - WALL * 2 - 0.004;
    const linerFloor = mesh(new THREE.PlaneGeometry(inner, inner), linerMat, false);
    linerFloor.rotation.x = -Math.PI / 2;
    linerFloor.position.y = WALL + 0.002;
    base.add(linerFloor);
    const linerWall = track(new THREE.PlaneGeometry(inner, H - WALL - 0.01));
    for (let i = 0; i < 4; i++) {
      const pl = new THREE.Mesh(linerWall, linerMat);
      pl.receiveShadow = true;
      const a = (i * Math.PI) / 2;
      pl.position.set(Math.sin(a) * (inner / 2), WALL + (H - WALL) / 2, Math.cos(a) * (inner / 2));
      pl.rotation.y = a + Math.PI;
      base.add(pl);
    }
    // Foil wordmark on the front wall
    const markTex = wordmarkTexture();
    this.disposables.push(markTex);
    const mark = new THREE.Mesh(track(new THREE.PlaneGeometry(1.5, 0.375)), new THREE.MeshStandardMaterial({ map: markTex, transparent: true, roughness: 0.35, metalness: 0.2 }));
    mark.position.set(0, H * 0.4, W / 2 + 0.002);
    base.add(mark);

    // Tissue flaps folded over the contents, hinged on the left and right walls
    const flapW = inner / 2 + 0.04;
    for (const side of [-1, 1]) {
      const hinge = new THREE.Group();
      hinge.position.set(side * (inner / 2), H - 0.06, 0);
      const flapGeo = new THREE.PlaneGeometry(flapW, inner, 6, 1);
      // Gentle crumple so the tissue doesn't look like card
      const pos = flapGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        pos.setZ(i, Math.sin((x + 0.3) * 9) * 0.02 + Math.sin(y * 6 + x * 3) * 0.018 + Math.cos(y * 13) * 0.006);
      }
      flapGeo.computeVertexNormals();
      const flap = mesh(flapGeo, tissueMat, false);
      flap.rotation.x = -Math.PI / 2;
      flap.position.x = -side * (flapW / 2);
      flap.position.y = side * 0.004;
      hinge.add(flap);
      base.add(hinge);
      this.flaps.push(hinge);
    }

    // A small card that rises from inside once the tissue opens
    const cardTex = cardTexture();
    this.disposables.push(cardTex);
    this.card = new THREE.Mesh(track(new THREE.BoxGeometry(CARD_W, 0.012, CARD_W / 1.6)), [
      tissueMat, tissueMat, new THREE.MeshStandardMaterial({ map: cardTex, roughness: 0.7 }), tissueMat, tissueMat, tissueMat,
    ]);
    this.card.castShadow = true;
    this.card.position.set(0, H * 0.55, 0.1);
    this.card.rotation.y = -0.12;
    base.add(this.card);

    this.root.add(base);

    // ── Lid ──────────────────────────────────────────────────────────────
    const LW = W + LID_OVER * 2;
    const lidShell = mesh(new RoundedBoxGeometry(LW, LID_H, LW, 3, 0.035), inkMat);
    lidShell.position.y = LID_H / 2;
    this.lid.add(lidShell);

    // Ribbon bands wrap over the top and down the lid sides. Each band group is
    // anchored at one end so scaling it reads as the ribbon being pulled away.
    const makeBand = () => {
      const g = new THREE.Group();
      const top = mesh(new THREE.BoxGeometry(LW + 0.02, 0.014, RIBBON), ribbonMat);
      top.position.y = LID_H + 0.007;
      const sideGeo = new THREE.BoxGeometry(0.014, LID_H + 0.014, RIBBON);
      const s1 = mesh(sideGeo, ribbonMat);
      const s2 = mesh(sideGeo, ribbonMat);
      s1.position.set(LW / 2 + 0.007, LID_H / 2, 0);
      s2.position.set(-LW / 2 - 0.007, LID_H / 2, 0);
      const inner = new THREE.Group();
      inner.add(top, s1, s2);
      inner.position.x = LW / 2 + 0.02; // shift so the group's origin is at one edge
      g.add(inner);
      g.position.x = -(LW / 2 + 0.02);
      return g;
    };
    this.bandX = makeBand();
    this.bandZ = makeBand();
    const bands = new THREE.Group();
    bands.add(this.bandX);
    const bz = new THREE.Group();
    bz.rotation.y = Math.PI / 2;
    bz.position.y = 0.002; // sits on top of the X band where they cross
    bz.add(this.bandZ);
    bands.add(bz);
    this.lid.add(bands);

    // Bow: two pinched satin loops, two tails and a centre knot
    const loopGeo = track(ribbonLoopGeometry(0.4, 0.21, RIBBON * 0.85));
    for (const side of [-1, 1]) {
      const loop = new THREE.Mesh(loopGeo, ribbonMat);
      loop.castShadow = true;
      loop.position.set(0, 0.12, 0);
      loop.rotation.set(0, side === 1 ? 0 : Math.PI, 0.32);
      const tilt = new THREE.Group(); // leans each loop back, like a tied bow settling
      tilt.rotation.x = -0.38;
      tilt.add(loop);
      this.loops.push(loop);
      this.bow.add(tilt);
    }
    const tailGeo = track(new THREE.BoxGeometry(0.2, 0.012, 0.78));
    tailGeo.translate(0, 0, 0.39);
    for (const side of [-1, 1]) {
      const tail = new THREE.Mesh(tailGeo, ribbonMat);
      tail.castShadow = true;
      tail.position.set(side * 0.08, 0.035, 0.05);
      tail.rotation.set(0.12, side * 0.42, side * 0.08);
      this.tails.push(tail);
      this.bow.add(tail);
    }
    const knot = mesh(new RoundedBoxGeometry(0.32, 0.2, 0.28, 3, 0.07), ribbonMat);
    knot.position.y = 0.12;
    this.bow.add(knot);
    this.bow.position.y = LID_H + 0.014;
    this.lid.add(this.bow);

    this.lid.position.y = H - LID_H * 0.72; // lid sits down over the base rim
    this.root.add(this.lid);

    // Floor contact shadow + a shadow-catcher for the key light
    const shadowTex = contactShadowTexture();
    this.disposables.push(shadowTex);
    this.shadow = new THREE.Mesh(track(new THREE.PlaneGeometry(5.2, 5.2)), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.001;
    this.scene.add(this.shadow);
    const catcher = new THREE.Mesh(track(new THREE.PlaneGeometry(14, 14)), new THREE.ShadowMaterial({ opacity: 0.13 }));
    catcher.rotation.x = -Math.PI / 2;
    catcher.receiveShadow = true;
    this.scene.add(catcher);

    this.scene.add(this.root);
    this.apply();
  }

  setSize(width: number, height: number) {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.renderer.setSize(this.width, this.height, false);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.apply();
  }

  setProgress(p: number) {
    this.progress = clamp01(p);
  }

  /** Advances idle motion and renders one frame. */
  render(dt: number) {
    if (this.opts.idle) this.time += dt;
    this.apply();
    this.renderer.render(this.scene, this.camera);
  }

  private apply() {
    const p = this.progress;
    const aspect = this.width / this.height;
    const portrait = aspect < 0.9;

    // Idle breathing fades out as soon as the visitor starts scrolling.
    const idle = (1 - span(p, 0, 0.06)) * (this.opts.idle ? 1 : 0);
    const bob = Math.sin(this.time * 1.1) * 0.035 * idle;

    // 1 · Untie (0.04 → 0.30): loops collapse, tails slip, bands pull away
    const untie = easeInOut(span(p, 0.04, 0.24));
    this.loops.forEach((l) => {
      // Loops shrink toward the knot while dropping flat, as if pulled through it
      l.scale.setScalar(Math.max(0.001, 1 - untie));
      l.rotation.z = 0.32 - untie * 0.6;
    });
    this.tails.forEach((t, i) => {
      t.scale.z = Math.max(0.001, 1 - untie);
      t.rotation.y = (i ? 1 : -1) * (0.42 + untie * 0.8);
    });
    this.bow.scale.setScalar(Math.max(0.001, 1 - easeIn(span(p, 0.12, 0.26))));
    const pullX = easeInOut(span(p, 0.14, 0.3));
    const pullZ = easeInOut(span(p, 0.18, 0.34));
    this.bandX.scale.x = Math.max(0.001, 1 - pullX);
    this.bandZ.scale.x = Math.max(0.001, 1 - pullZ);
    this.bandX.visible = pullX < 0.999;
    this.bandZ.visible = pullZ < 0.999;

    // 2 · Lift the lid (0.32 → 0.62): straight up, then tip back and away
    const lift = easeInOut(span(p, 0.32, 0.5));
    const away = easeInOut(span(p, 0.46, 0.66));
    this.lid.position.set(0, H - LID_H * 0.72 + lift * 1.1 + away * 3.2, -away * 2.6);
    this.lid.rotation.x = -lift * 0.18 - away * 0.9;
    this.lid.rotation.z = away * 0.12;

    // 3 · Tissue opens and the card rises (0.56 → 0.8)
    const tissue = easeOut(span(p, 0.56, 0.74));
    // Leaves stand just past vertical against the walls, like tissue folded back
    this.flaps.forEach((f, i) => (f.rotation.z = (i ? -1 : 1) * tissue * 1.78));
    const cardRise = easeOut(span(p, 0.62, 0.8));
    // As the camera dives, the card settles flat on the floor under the lens, shrinking to the
    // size the DOM card takes over at (so it never looms up at the camera)
    const settle = easeInOut(span(p, 0.72, HANDOFF - 0.02));
    const floorView = 2 * (INSIDE_Y - CARD_FLOOR) * Math.tan(THREE.MathUtils.degToRad(INSIDE_FOV / 2)) * aspect;
    this.card.scale.setScalar(lerp(1, (finalCardFraction(aspect) * floorView) / CARD_W, settle));
    this.card.position.set(0, lerp(H * 0.55 + cardRise * 0.5, CARD_FLOOR, settle), lerp(0.1, -0.02, settle));
    this.card.rotation.set(lerp(-cardRise * 0.35, 0, settle), lerp(-0.12, 0, settle), 0);
    this.card.visible = p < HANDOFF;

    // Box turns gently through the sequence and squares up for the descent
    this.root.rotation.y = lerp(-0.62, 0.0, easeInOut(span(p, 0, 0.6))) + Math.sin(this.time * 0.35) * 0.05 * idle;
    this.root.position.y = bob;

    // 4 · Camera: three-quarter hero → over the open box → down into it (0 → 1)
    // Portrait: pull back and lift the box into the top third, above the stacked copy
    const fit = portrait ? 1.9 : aspect < 1.3 ? 1.2 : 1;
    // On wide screens the box sits right of centre, clear of the headline column.
    const offsetX = portrait ? 0 : aspect > 1.5 ? -1.45 : -1.1;
    const start = new THREE.Vector3(offsetX, 2.5 * fit, 9.6 * fit);
    const over = new THREE.Vector3(offsetX * 0.75, 6.2 * fit, 3.2 * fit);
    // Just below the rim: every wall in view is Knot Red, with the card centred on the floor
    // (nearly straight down, so the card lands flat on screen like the DOM copy that replaces it)
    const inside = new THREE.Vector3(0, INSIDE_Y, 0.0);
    const lookStart = new THREE.Vector3(offsetX, portrait ? -1.2 : 0.75, 0);
    const lookOver = new THREE.Vector3(offsetX * 0.75, portrait ? -1.4 : 0.6, 0);
    const lookInside = new THREE.Vector3(0, CARD_FLOOR, -0.02);

    const toOver = easeInOut(span(p, 0.36, 0.7));
    // Lands by HANDOFF, so the DOM card replaces this one on a still frame
    const toInside = easeInOut(span(p, 0.72, HANDOFF));
    const camPos = start.clone().lerp(over, toOver).lerp(inside, toInside);
    const look = lookStart.clone().lerp(lookOver, toOver).lerp(lookInside, toInside);
    this.camera.position.copy(camPos);
    this.camera.lookAt(look);
    this.camera.fov = lerp(30, INSIDE_FOV, toInside);
    this.camera.updateProjectionMatrix();

    this.shadow.visible = toInside < 0.9;
  }

  dispose() {
    this.disposables.forEach((d) => d.dispose());
    this.renderer.dispose();
  }
}

export function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return Boolean(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch {
    return false;
  }
}
