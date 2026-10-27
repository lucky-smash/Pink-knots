// Procedural Pink Knots gift box: a plum rigid box tied with satin bands and, on top, the logo's
// infinity ribbon. `setProgress(0..1)` drives the whole sequence, so the scene is a pure function of
// scroll position — no timers, no hidden state. The ribbon starts as the logo (seen flat on, in the
// mark's own colours) and grows into a sculpted satin ribbon (logoRibbon.ts); then the lid lifts
// away with it and the camera dives into the box.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { CARD_PRINT, HANDOFF, drawCard, finalCardFraction } from "./heroCard";
import { LogoRibbon } from "./logoRibbon";

// Logo magenta (#B2209A), pre-darkened so it lands on that colour after lighting and ACES tone mapping
const KNOT_LIT = 0x7d0c6b;
// The bands: the logo's violet (#58167D, where its magenta turns to indigo), pre-darkened the same way
const BAND_LIT = 0x2c0a45;
// A deep plum board, a shade off the wordmark's aubergine (#210F31) so the key light can model it
const INK = 0x24112f;
const TISSUE = 0xf7f1f6;

// Box dimensions (world units). Base sits on y = 0.
const W = 2.4;
const H = 1.45;
const WALL = 0.07;
const LID_H = 0.42;
const LID_OVER = 0.05; // lid overhang on each side
const RIBBON = 0.24;
const KNOT_W = 1.75; // the logo ribbon on the lid, end to end
const TAIL_SPREAD = 0.95; // the bow tails, radians either side of the box front
const CARD_W = 1.2;
// End of the dive: camera just under the rim, looking down at the card on the liner floor
const CARD_FLOOR = WALL + 0.012;
const INSIDE_Y = H - 0.15;
const INSIDE_FOV = 42;

/** Hero progress over which the logo becomes the 3D ribbon; it then holds until the lid lifts. */
export const MORPH_END = 0.3;
const LID_START = 0.4;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** Remaps v from [a,b] to [0,1], clamped. */
const span = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function wordmarkTexture() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, c.width, c.height);
  // Pale lilac foil, quiet next to the ribbon: the box carries the name, the ribbon carries the brand
  g.fillStyle = "rgba(228, 214, 234, 0.7)";
  g.font = "500 58px 'Bricolage Grotesque', 'Helvetica Neue', Arial, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  // Wide tracking reads as a foil-stamped mark
  const text = "PINK KNOTS".split("").join(String.fromCharCode(8202, 8202));
  g.fillText(text, c.width / 2, c.height / 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** A fine, even board grain as a bump map: wrapped paper over rigid board, not a pattern. */
function grainTexture() {
  const s = 256;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const g = c.getContext("2d")!;
  const img = g.createImageData(s, s);
  // A small fixed LCG, so the grain is the same on every load (and in the reload snapshot)
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < s * s; i++) {
    const v = 128 + (rand() - 0.5) * 70;
    img.data.set([v, v, v, 255], i * 4);
  }
  g.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 5);
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

/** World units one tile of the satin weave spans along a ribbon. Across, it spans the full width. */
const SATIN_TILE = 0.12;

/**
 * Double-face satin ribbon, as a tint map and a bump map. Long floats run along the ribbon with a
 * staggered satin interlacing; a woven selvedge line sits just in from each edge, which rolls over.
 */
function satinTextures() {
  const w = 48;
  const h = 256;
  const tint = document.createElement("canvas");
  const bump = document.createElement("canvas");
  tint.width = bump.width = w;
  tint.height = bump.height = h;
  const ti = tint.getContext("2d")!.createImageData(w, h);
  const bi = bump.getContext("2d")!.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    const v = (y + 0.5) / h;
    const edge = Math.min(v, 1 - v); // 0 at either edge, 0.5 down the middle
    const selvedge = Math.abs(edge - 0.045) < 0.01;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      // Satin weave: one interlacing point every 8 floats, offset 3 per row
      const interlace = (x + y * 3) % 8 === 0;
      let t = selvedge ? 0.8 : edge < 0.018 ? 0.9 : 1;
      if (interlace) t -= 0.04;
      let b = 0.55 + (y % 2 ? 0.04 : 0); // the floats, one per row
      if (interlace) b -= 0.16;
      if (selvedge) b = 0.8;
      if (edge < 0.025) b *= 0.4 + (edge / 0.025) * 0.6; // rolled edge
      ti.data[i] = ti.data[i + 1] = ti.data[i + 2] = Math.round(t * 255);
      bi.data[i] = bi.data[i + 1] = bi.data[i + 2] = Math.round(b * 255);
      ti.data[i + 3] = bi.data[i + 3] = 255;
    }
  }
  tint.getContext("2d")!.putImageData(ti, 0, 0);
  bump.getContext("2d")!.putImageData(bi, 0, 0);
  const make = (c: HTMLCanvasElement, srgb: boolean) => {
    const tex = new THREE.CanvasTexture(c);
    if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.anisotropy = 8;
    return tex;
  };
  return { map: make(tint, true), bumpMap: make(bump, false) };
}

/**
 * A flat ribbon laid along a centre line: `centre[i]` with `across[i]` (unit) spanning its width.
 * Three columns, so a tail can be cut in a dovetail: `notch` pulls the middle column back from
 * the end by that many world units. UVs: u in satin tiles along the length, v 0 → 1 across.
 */
function ribbonStripGeometry(centre: THREE.Vector3[], across: THREE.Vector3[], width: number, notch = 0) {
  const lengths = [0];
  for (let i = 1; i < centre.length; i++) lengths.push(lengths[i - 1] + centre[i].distanceTo(centre[i - 1]));
  const total = lengths[lengths.length - 1];
  const lastMiddle = lengths.findLastIndex((l) => l <= total - notch);
  const positions: number[] = [];
  const uvs: number[] = [];
  const index: number[] = [];
  for (let i = 0; i < centre.length; i++) {
    const half = across[i].clone().multiplyScalar(width / 2);
    const m = Math.min(i, lastMiddle);
    positions.push(...centre[i].clone().sub(half).toArray(), ...centre[m].toArray(), ...centre[i].clone().add(half).toArray());
    const u = lengths[i] / SATIN_TILE;
    uvs.push(u, 0, lengths[m] / SATIN_TILE, 0.5, u, 1);
    if (i > 0) {
      const a = (i - 1) * 3;
      const b = i * 3;
      index.push(a, b, a + 1, a + 1, b, b + 1, a + 1, b + 1, a + 2, a + 2, b + 1, b + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

/**
 * The centre line of a ribbon wrapped round the lid in the XY plane: tucked under the bottom edge,
 * up the side, round the rounded top edge, across and down the other side. Hugs the lid's corner
 * radius `r` at `lift` off the board.
 */
function lidWrapPath(lidW: number, lidH: number, r: number, lift: number) {
  const pts: THREE.Vector3[] = [];
  const x0 = lidW / 2;
  const R = r + lift;
  const arc = (cx: number, cy: number, from: number, to: number) => {
    for (let i = 0; i <= 8; i++) {
      const a = from + ((to - from) * i) / 8;
      pts.push(new THREE.Vector3(cx + Math.cos(a) * R, cy + Math.sin(a) * R, 0));
    }
  };
  pts.push(new THREE.Vector3(-x0 + r + 0.05, -lift, 0)); // tucked under the lid
  arc(-x0 + r, r, -Math.PI / 2, -Math.PI);
  arc(-x0 + r, lidH - r, Math.PI, Math.PI / 2);
  for (let i = 1; i < 24; i++) pts.push(new THREE.Vector3(lerp(-x0 + r, x0 - r, i / 24), lidH + lift, 0));
  arc(x0 - r, lidH - r, Math.PI / 2, 0);
  arc(x0 - r, r, 0, -Math.PI / 2);
  pts.push(new THREE.Vector3(x0 - r - 0.05, -lift, 0));
  return pts;
}

/** A soft radial contact shadow — cheaper and softer than a shadow map on the floor. */
function contactShadowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(128, 128, 10, 128, 128, 128);
  grad.addColorStop(0, "rgba(40,24,40,0.45)");
  grad.addColorStop(0.45, "rgba(40,24,40,0.18)");
  grad.addColorStop(1, "rgba(40,24,40,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

// The ribbon's pose on the lid once it's finished: turned partway toward the hero camera (the box
// stands turned away from it) and leaning back a touch, so the light models its loops
const KNOT_REST = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.03, 0.12, 0, "YXZ"));

export class GiftBoxScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(30, 1, 0.05, 60);
  private root = new THREE.Group();
  private lid = new THREE.Group();
  private bow = new THREE.Group();
  private ribbon: LogoRibbon;
  private knotTilt = new THREE.Group();
  private rim: THREE.DirectionalLight;
  private flaps: THREE.Group[] = [];
  private card: THREE.Mesh;
  private shadow: THREE.Mesh;
  private disposables: { dispose: () => void }[] = [];
  private progress = 0;
  private width = 1;
  private height = 1;
  // Scratch for the ribbon's pose
  private face = new THREE.Quaternion();
  private parentQ = new THREE.Quaternion();
  private knotPos = new THREE.Vector3();
  private look = new THREE.Matrix4();

  /** `morph`: hold the ribbon at this shape instead of following the scroll (reduced motion). */
  constructor(canvas: HTMLCanvasElement, private opts: { morph?: number } = {}) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance", preserveDrawingBuffer: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap; // r186 dropped PCFSoft; shadow.radius softens this one

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = envTex;
    this.scene.environmentIntensity = 0.45;
    pmrem.dispose();
    this.disposables.push(envTex);

    // Studio lights: neutral key from upper right (so the logo colours read true), soft warm fill,
    // and a rim from behind that comes up as the ribbon gains depth, to trace its edges
    const key = new THREE.DirectionalLight(0xfffaf5, 2.4);
    key.position.set(4.5, 8, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = key.shadow.camera.bottom = -4;
    key.shadow.camera.right = key.shadow.camera.top = 4;
    key.shadow.bias = -0.0008;
    key.shadow.normalBias = 0.02;
    key.shadow.radius = 6;
    this.scene.add(key);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xe2d6d2, 0.9));
    this.rim = new THREE.DirectionalLight(0xf3e6f4, 0.5);
    this.rim.position.set(-5, 3, -4);
    this.scene.add(this.rim);

    // Materials
    const grain = grainTexture();
    this.disposables.push(grain);
    const inkMat = new THREE.MeshPhysicalMaterial({
      color: INK,
      roughness: 0.62,
      clearcoat: 0.15,
      clearcoatRoughness: 0.55,
      sheen: 0.45,
      sheenColor: new THREE.Color(0x7a6684),
      bumpMap: grain,
      bumpScale: 0.25,
    });
    inkMat.envMapIntensity = 0.6;
    const linerMat = new THREE.MeshStandardMaterial({ color: KNOT_LIT, roughness: 0.85, side: THREE.DoubleSide });
    // Satin: the floats give a long highlight that runs across the ribbon as it bends, with a
    // little sheen in its own colour rather than a pale wash
    const satin = satinTextures();
    this.disposables.push(satin.map, satin.bumpMap);
    const satinFinish = {
      ...satin,
      bumpScale: 0.35,
      roughness: 0.36,
      anisotropy: 0.75,
      anisotropyRotation: Math.PI / 2,
      sheen: 0.35,
      sheenRoughness: 0.45,
      side: THREE.DoubleSide,
    };
    const tissueMat = new THREE.MeshStandardMaterial({ color: TISSUE, roughness: 0.95, side: THREE.DoubleSide });
    this.disposables.push(inkMat, linerMat, tissueMat);

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
    // Magenta liner on the inside faces
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
    const markMat = new THREE.MeshStandardMaterial({ map: markTex, transparent: true, roughness: 0.4, metalness: 0.25 });
    this.disposables.push(markMat);
    const mark = new THREE.Mesh(track(new THREE.PlaneGeometry(1.5, 0.375)), markMat);
    mark.position.set(0, H * 0.42, W / 2 + 0.002);
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
    const cardMat = new THREE.MeshStandardMaterial({ map: cardTex, roughness: 0.7 });
    this.disposables.push(cardMat);
    this.card = new THREE.Mesh(track(new THREE.BoxGeometry(CARD_W, 0.012, CARD_W / 1.6)), [
      tissueMat, tissueMat, cardMat, tissueMat, tissueMat, tissueMat,
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

    // Satin bands wrap round the lid's rounded edges and tuck under it, so the ribbon on top is
    // tied to something and leaves with the lid. They lie flat on the lid, which the camera sees at a
    // low angle; there a glossy band mirrors the white room as a white line, so their gloss comes
    // from sheen instead of specular, the way satin catches light at a low angle
    const bandMat = new THREE.MeshPhysicalMaterial({ ...satinFinish, color: BAND_LIT, roughness: 0.5, specularIntensity: 0.15, sheen: 0.6, sheenColor: new THREE.Color(0x8a4fb0) });
    bandMat.envMapIntensity = 0.25;
    this.disposables.push(bandMat);
    const makeBand = (lift: number) => {
      const path: THREE.Vector3[] = [];
      for (const pt of lidWrapPath(LW, LID_H, 0.035, lift)) {
        const prev = path[path.length - 1];
        const n = prev ? Math.ceil(prev.distanceTo(pt) / 0.02) : 1;
        for (let i = 1; i <= n; i++) path.push(prev ? prev.clone().lerp(pt, i / n) : pt);
      }
      return mesh(ribbonStripGeometry(path, path.map(() => new THREE.Vector3(0, 0, 1)), RIBBON), bandMat);
    };
    const bands = new THREE.Group();
    bands.add(makeBand(0.003));
    const bz = new THREE.Group();
    bz.rotation.y = Math.PI / 2;
    bz.add(makeBand(0.006)); // lies over the first band where they cross
    bands.add(bz);
    this.lid.add(bands);

    // Two short dovetailed tails in the band's satin come out from under the ribbon's knot point,
    // arch a little and settle on the board, so the ribbon reads as tied on where the bands cross
    const tailMat = bandMat.clone();
    tailMat.anisotropy = 0.3;
    this.disposables.push(tailMat);
    const TAIL = 0.7;
    for (const side of [-1, 1]) {
      const centre: THREE.Vector3[] = [];
      const across: THREE.Vector3[] = [];
      for (let i = 0; i <= 40; i++) {
        const s = (i / 40) * TAIL;
        const k = s / TAIL;
        const rise = 0.018 * Math.sin(Math.PI * Math.min(k / 0.7, 1));
        const settle = lerp(0, -0.01, easeInOut(span(k, 0.5, 1)));
        centre.push(new THREE.Vector3(side * 0.04 * Math.sin(Math.PI * 2 * k), settle + rise, s));
        const twist = side * 0.18 * Math.sin(Math.PI * k);
        across.push(new THREE.Vector3(-Math.cos(twist), -Math.sin(twist), 0)); // same winding as the bands
      }
      const tail = mesh(ribbonStripGeometry(centre, across, RIBBON * 0.8, 0.07), tailMat);
      tail.rotation.y = side * TAIL_SPREAD;
      this.bow.add(tail);
    }

    // The logo ribbon itself, standing on the band crossing with its lowest point on the board.
    // Softer anisotropy and weave than the bands: where the ribbon turns edge-on, full-strength
    // satin glares white and swallows the logo's indigo.
    this.ribbon = new LogoRibbon(KNOT_W);
    const logoRibbonMat = this.ribbon.dress(
      new THREE.MeshPhysicalMaterial({
        ...satinFinish,
        roughness: 0.4,
        anisotropy: 0.4,
        bumpScale: 0.12,
        specularIntensity: 0.5,
        // No sheen: one sheen colour can't suit both strands, and a lilac one greys the green
        sheen: 0,
      }),
    );
    logoRibbonMat.envMapIntensity = 0.4;
    this.disposables.push(logoRibbonMat);
    const knot = mesh(this.ribbon.geometry, logoRibbonMat);
    this.knotTilt.add(knot);
    this.bow.add(this.knotTilt);
    this.bow.position.y = LID_H + 0.008;
    this.lid.add(this.bow);

    this.lid.position.y = H - LID_H * 0.72; // lid sits down over the base rim
    this.root.add(this.lid);

    // Floor contact shadow + a shadow-catcher for the key light
    const shadowTex = contactShadowTexture();
    this.disposables.push(shadowTex);
    const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false });
    this.shadow = new THREE.Mesh(track(new THREE.PlaneGeometry(5.2, 5.2)), shadowMat);
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.001;
    this.scene.add(this.shadow);
    const catcherMat = new THREE.ShadowMaterial({ opacity: 0.13 });
    const catcher = new THREE.Mesh(track(new THREE.PlaneGeometry(14, 14)), catcherMat);
    catcher.rotation.x = -Math.PI / 2;
    catcher.receiveShadow = true;
    this.scene.add(catcher);
    this.disposables.push(shadowMat, catcherMat);

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

  /** Renders one frame at the current progress. */
  render() {
    this.apply();
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * The resting first frame (progress 0) as an image URL. GiftHero shows it on the next load while
   * the scene boots, so the box that appears first is this box. Restores the current frame in the
   * same task, so nothing flashes.
   */
  snapshot() {
    const { progress } = this;
    this.progress = 0;
    this.render();
    const url = this.renderer.domElement.toDataURL("image/webp", 0.9);
    this.progress = progress;
    this.render();
    return url;
  }

  private apply() {
    const p = this.progress;
    const aspect = this.width / this.height;
    // Keep in step with the hero copy layout (GiftHero: @container min-aspect-ratio 9/10)
    const portrait = aspect < 0.9;

    // 1 · The ribbon (0 → MORPH_END): the flat logo grows into the sculpted satin ribbon, then
    // holds. Scroll back and it retraces exactly; at the top it's the logo again.
    const m = this.opts.morph ?? span(p, 0, MORPH_END);
    this.ribbon.setMorph(m);
    const shape = easeInOut(m);
    this.rim.intensity = lerp(0.5, 1.3, shape);

    // 2 · Lift the lid, with the ribbon still tied on: straight up, then tip back and away
    const lift = easeInOut(span(p, LID_START, 0.55));
    const away = easeInOut(span(p, 0.5, 0.67));
    this.lid.position.set(0, H - LID_H * 0.72 + lift * 1.1 + away * 3.2, -away * 2.6);
    this.lid.rotation.x = -lift * 0.18 - away * 0.9;
    this.lid.rotation.z = away * 0.12;

    // 3 · Tissue opens and the card rises
    const tissue = easeOut(span(p, 0.58, 0.75));
    // Leaves stand just past vertical against the walls, like tissue folded back
    this.flaps.forEach((f, i) => (f.rotation.z = (i ? -1 : 1) * tissue * 1.78));
    const cardRise = easeOut(span(p, 0.63, 0.8));
    // As the camera dives, the card settles flat on the floor under the lens, shrinking to the
    // size the DOM card takes over at (so it never looms up at the camera)
    const settle = easeInOut(span(p, 0.73, HANDOFF - 0.02));
    const floorView = 2 * (INSIDE_Y - CARD_FLOOR) * Math.tan(THREE.MathUtils.degToRad(INSIDE_FOV / 2)) * aspect;
    this.card.scale.setScalar(lerp(1, (finalCardFraction(aspect) * floorView) / CARD_W, settle));
    this.card.position.set(0, lerp(H * 0.55 + cardRise * 0.5, CARD_FLOOR, settle), lerp(0.1, -0.02, settle));
    this.card.rotation.set(lerp(-cardRise * 0.35, 0, settle), lerp(-0.12, 0, settle), 0);
    this.card.visible = p < HANDOFF;

    // The box turns a touch toward the camera as the ribbon finishes, then squares up for the descent
    this.root.rotation.y = lerp(lerp(-0.62, -0.5, shape), 0, easeInOut(span(p, MORPH_END + 0.04, 0.62)));

    // 4 · Camera: product view → over the open box → down into it
    // Portrait: pull back and lift the box into the top third, above the stacked copy
    // Landscape: pull back as the stage narrows, so the box never takes more than ~38% of the width
    const fit = portrait ? 1.9 : Math.max(1, 1.75 / aspect);
    // …and keep it centred ~68% across, clear of the headline column. The visible half-width at
    // the start distance is ≈ 2.6 · aspect · fit world units, so this offset scales with both.
    const offsetX = portrait ? 0 : -0.95 * aspect * fit;
    // While it's the logo the camera sits a little lower and closer, so the mark reads big and
    // square on; it rises to the product view as the ribbon takes shape. (Portrait stays as far
    // back as it ends: closer, the box would crowd the copy stacked under it.)
    const near = portrait ? 0 : 1;
    const start = new THREE.Vector3(offsetX, lerp(2.5 - 0.5 * near, 2.5, shape) * fit, lerp(9.6 - near, 9.6, shape) * fit);
    const over = new THREE.Vector3(offsetX * 0.75, 6.2 * fit, 3.2 * fit);
    // Just below the rim: every wall in view is magenta, with the card centred on the floor
    // (nearly straight down, so the card lands flat on screen like the DOM copy that replaces it)
    const inside = new THREE.Vector3(0, INSIDE_Y, 0.0);
    const lookStart = new THREE.Vector3(offsetX, portrait ? lerp(-0.9, -1.2, shape) : lerp(1.1, 0.75, shape), 0);
    const lookOver = new THREE.Vector3(offsetX * 0.75, portrait ? -1.4 : 0.6, 0);
    const lookInside = new THREE.Vector3(0, CARD_FLOOR, -0.02);

    const toOver = easeInOut(span(p, LID_START, 0.71));
    // Lands by HANDOFF, so the DOM card replaces this one on a still frame
    const toInside = easeInOut(span(p, 0.73, HANDOFF));
    const camPos = start.clone().lerp(over, toOver).lerp(inside, toInside);
    const look = lookStart.clone().lerp(lookOver, toOver).lerp(lookInside, toInside);
    this.camera.position.copy(camPos);
    this.camera.lookAt(look);
    this.camera.fov = lerp(30, INSIDE_FOV, toInside);
    this.camera.updateProjectionMatrix();

    // The ribbon's pose: at the start it faces the camera square on, so its outline is the logo's;
    // it eases into its resting pose on the lid as it takes shape
    this.root.updateMatrixWorld(true);
    this.bow.getWorldQuaternion(this.parentQ);
    this.knotTilt.getWorldPosition(this.knotPos);
    this.look.lookAt(this.camera.position, this.knotPos, THREE.Object3D.DEFAULT_UP);
    this.face.setFromRotationMatrix(this.look).premultiply(this.parentQ.invert());
    this.knotTilt.quaternion.slerpQuaternions(this.face, KNOT_REST, shape);

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
