// Procedural Pink Knots gift box: an aubergine rigid box with a logo-magenta satin
// ribbon, tied off with the logo's infinity knot as a bow. `setProgress(0..1)` drives the whole opening sequence, so the
// scene is a pure function of scroll position — no timers, no hidden state.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { KNOT_CUT, KNOT_OVER, KNOT_UNDER, KNOT_VIEWBOX } from "@/components/knotPaths";
import { CARD_PRINT, HANDOFF, drawCard, finalCardFraction } from "./heroCard";

// Logo magenta (#B2209A), pre-darkened so it lands on that colour after lighting and ACES tone mapping
const KNOT_LIT = 0x7d0c6b;
// The logo wordmark's aubergine (#210F31), which the key light lifts to a visible plum on screen
const INK = 0x1f0f2b;
const TISSUE = 0xf7f1f6;

// Box dimensions (world units). Base sits on y = 0.
const W = 2.4;
const H = 1.45;
const WALL = 0.07;
const LID_H = 0.42;
const LID_OVER = 0.05; // lid overhang on each side
const RIBBON = 0.3;
const KNOT_SIZE = { w: 1.25, h: 0.5 }; // the logo knot on the lid
const TAIL_SPREAD = 0.95; // the bow tails, radians either side of the box front
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
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function wordmarkTexture() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, c.width, c.height);
  g.fillStyle = "rgba(128, 230, 62, 0.92)"; // logo green, foil-stamped
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

// The site's debossed knot lattice (src/app/patterns) pressed into the board: same 132 × 112 tile,
// same half-drop placements, drawn as a height map so the key light catches the recesses.
const DEBOSS = { w: 132, h: 112, knotW: 26 };
const DEBOSS_PLACEMENTS = [
  { x: 33, y: 28, rotate: -14, mirror: false },
  { x: 99, y: 84, rotate: 14, mirror: true },
];
const DEBOSS_DOTS = [
  { x: 99, y: 28 },
  { x: 33, y: 84 },
];
/** World units one tile spans across, so a knot is ~0.13 wide on a 2.4-wide box. */
const DEBOSS_TILE_W = 0.62;
const DEBOSS_TILE_H = (DEBOSS_TILE_W * DEBOSS.h) / DEBOSS.w;

function debossTexture() {
  const px = 4;
  const c = document.createElement("canvas");
  c.width = DEBOSS.w * px;
  c.height = DEBOSS.h * px;
  const g = c.getContext("2d")!;
  g.fillStyle = "#fff";
  g.fillRect(0, 0, c.width, c.height);
  // Soft walls, so the bump reads as a pressed edge rather than a cliff
  g.filter = `blur(${px * 0.45}px)`;
  const [, , VW, VH] = KNOT_VIEWBOX.split(" ").map(Number);
  const s = DEBOSS.knotW / VW;
  const under = new Path2D(KNOT_UNDER);
  const over = new Path2D(KNOT_OVER);
  const cut = new Path2D(KNOT_CUT);
  for (const p of DEBOSS_PLACEMENTS) {
    g.save();
    g.scale(px, px);
    g.translate(p.x, p.y);
    g.rotate((p.rotate * Math.PI) / 180);
    g.scale(p.mirror ? -s : s, s);
    g.translate(-VW / 2, -VH / 2);
    g.fillStyle = "#000";
    g.fill(under);
    // Lift the under strand where the over strand crosses it, then lay the over strand
    g.strokeStyle = g.fillStyle = "#fff";
    g.lineWidth = 14;
    g.lineJoin = "round";
    g.fill(cut);
    g.stroke(cut);
    g.fillStyle = "#000";
    g.fill(over);
    g.restore();
  }
  g.fillStyle = "#000";
  for (const d of DEBOSS_DOTS) {
    g.beginPath();
    g.arc(d.x * px, d.y * px, 1.3 * px, 0, Math.PI * 2);
    g.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

/** Box-projects UVs in world units, so the lattice keeps one size and aspect on every face. */
function debossUv<T extends THREE.BufferGeometry>(geo: T) {
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const nx = Math.abs(nor.getX(i));
    const ny = Math.abs(nor.getY(i));
    const nz = Math.abs(nor.getZ(i));
    const [u, v] = ny >= nx && ny >= nz ? [pos.getX(i), pos.getZ(i)] : nx >= nz ? [pos.getZ(i), pos.getY(i)] : [pos.getX(i), pos.getY(i)];
    uv.setXY(i, u / DEBOSS_TILE_W, v / DEBOSS_TILE_H);
  }
  uv.needsUpdate = true;
  return geo;
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

// The logo's ribbon colours along the knot, from the over strand (f = 1) to the under strand
// (f = 0): magenta through violet to indigo at the loop tips, then green to lime. Pre-darkened
// like KNOT_LIT so they land on the logo colours after lighting and tone mapping.
const LOGO_RIBBON: [number, number][] = [
  [0, 0x9cd83c], // lime highlight
  [0.28, 0x3f9a24], // ribbon green
  [0.44, 0x1a1460], // indigo tips
  [0.56, 0x45105f], // violet
  [0.78, 0x7d0c6b], // magenta
  [1, 0x940f80], // the over strand's bright magenta
];

function logoRibbonColor(f: number, out: THREE.Color) {
  let i = 1;
  while (i < LOGO_RIBBON.length - 1 && LOGO_RIBBON[i][0] < f) i++;
  const [f0, c0] = LOGO_RIBBON[i - 1];
  const [f1, c1] = LOGO_RIBBON[i];
  return out.lerpColors(new THREE.Color(c0), new THREE.Color(c1), clamp01((f - f0) / (f1 - f0)));
}

/**
 * The logo's infinity knot tied as a bow: a satin band round a lemniscate, passing in front of
 * itself at the crossing (the logo's magenta "\" strand over the green one), twisting toward
 * edge-on at the loop tips where the logo ribbon thins. Shaped like bow loops: the crossing sits
 * low in the knot wrap and each loop rises up and out from it, its lower edge resting near the
 * lid. Crossing at the origin, loops along ±X, faces +Z.
 *
 * `writeKnot` re-lays the band for a pull: `left`/`right` (1 → 0) are how far each loop has
 * slipped back through the knot. The band is rebuilt along the smaller loop rather than bent, so
 * it keeps its width, twist and satin at every pose and never tears or folds through itself.
 */
const KNOT_SEGS = 260;

function knotPoint(t: number, width: number, height: number, depth: number, left: number, right: number, out: THREE.Vector3) {
  const s = Math.sin(t);
  const c = Math.cos(t);
  const den = 1 + s * s;
  const x = ((width / 2) * c) / den;
  // y is flipped so the over strand (s = 1) runs top-left to bottom-right, like the logo
  const y0 = (-height * 1.42 * s * c) / den;
  // Lower edges flattened toward the crossing (smoothly, so the loop tips stay round), loops lifted
  const y = y0 * (0.7 + 0.3 * Math.tanh(y0 / 0.05)) + height * 0.3 * Math.abs((2 * x) / width) ** 1.4;
  // Each side shrinks toward the crossing by its own pull, blended across the middle
  const w = clamp01((x + 0.06) / 0.12);
  const k = lerp(left, right, w * w * (3 - 2 * w));
  // Height goes a little slower than width, so a loop rounds up as it's drawn through
  return out.set(x * k, y * Math.pow(k, 0.8), depth * s);
}

function writeKnot(g: THREE.BufferGeometry, left: number, right: number) {
  const { width, height, band, depth } = g.userData as { width: number; height: number; band: number; depth: number };
  const pos = g.attributes.position as THREE.BufferAttribute;
  const uv = g.attributes.uv as THREE.BufferAttribute;
  const p = new THREE.Vector3();
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const z = new THREE.Vector3(0, 0, 1);
  const prev = new THREE.Vector3();
  let length = 0;
  for (let i = 0; i <= KNOT_SEGS; i++) {
    const t = (i / KNOT_SEGS) * Math.PI * 2;
    const s = Math.sin(t);
    knotPoint(t, width, height, depth, left, right, p);
    if (i) length += p.distanceTo(prev);
    prev.copy(p);
    const tangent = knotPoint(t + 0.001, width, height, depth, left, right, a).sub(knotPoint(t - 0.001, width, height, depth, left, right, b)).normalize();
    const normal = new THREE.Vector3(-tangent.y, tangent.x, 0).normalize();
    const twist = 1.05 * Math.cos(t) ** 2;
    const across = normal.multiplyScalar(Math.cos(twist)).addScaledVector(z, Math.sin(twist));
    const half = (band / 2) * (0.82 + 0.18 * s);
    pos.setXYZ(i * 2, p.x - across.x * half, p.y - across.y * half, p.z - across.z * half);
    pos.setXYZ(i * 2 + 1, p.x + across.x * half, p.y + across.y * half, p.z + across.z * half);
    uv.setXY(i * 2, length / SATIN_TILE, 0);
    uv.setXY(i * 2 + 1, length / SATIN_TILE, 1);
  }
  pos.needsUpdate = true;
  uv.needsUpdate = true;
  g.computeVertexNormals();
  g.computeBoundingSphere();
}

function infinityKnotGeometry(width: number, height: number, band: number, depth: number) {
  const n = (KNOT_SEGS + 1) * 2;
  const colors: number[] = [];
  const index: number[] = [];
  const col = new THREE.Color();
  for (let i = 0; i <= KNOT_SEGS; i++) {
    logoRibbonColor((1 + Math.sin((i / KNOT_SEGS) * Math.PI * 2)) / 2, col);
    colors.push(col.r, col.g, col.b, col.r, col.g, col.b);
    if (i < KNOT_SEGS) {
      const a = i * 2;
      index.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(n * 2), 2));
  g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  g.setIndex(index);
  g.userData = { width, height, band, depth };
  writeKnot(g, 1, 1);
  return g;
}

/**
 * The knot wrap: a short length of ribbon bound round the crossing, as in a tied bow. An ellipse
 * round the X axis, sized to enclose both strands (they cross at z = ±depth).
 */
function knotWrapGeometry(width: number, ry: number, rz: number) {
  const centre: THREE.Vector3[] = [];
  const across: THREE.Vector3[] = [];
  // Starts at the back and overlaps itself a little, so unwinding it reads front-last
  for (let i = 0; i <= 52; i++) {
    const a = Math.PI + (i / 48) * Math.PI * 2;
    centre.push(new THREE.Vector3(0, ry * Math.sin(a), rz * Math.cos(a)));
    across.push(new THREE.Vector3(1, 0, 0));
  }
  return ribbonStripGeometry(centre, across, width);
}

/** Shows a ribbon strip drawn out from its start by `t` of its length, a whole segment at a time. */
function drawOut(m: THREE.Mesh, t: number) {
  const total = m.geometry.index!.count;
  const cut = Math.round((t * total) / 12) * 12; // ribbonStripGeometry: 12 indices per segment
  m.geometry.setDrawRange(cut, total - cut);
  m.visible = cut < total;
}

/**
 * A band loosened by `t`: the run across the top lifts off the board in a shallow arch, highest over
 * the knot and easing to nothing at the rounded edges. Kept low and smooth: steeper, or rippled,
 * the satin turns toward the key light and glares white when the camera sees the top edge-on.
 * Band space: x along it.
 */
function loosenBand(g: THREE.BufferGeometry, t: number, rise: number) {
  const rest = g.userData.rest as Float32Array;
  const pos = g.attributes.position as THREE.BufferAttribute;
  const top = LID_H - 0.01;
  const reach = (W + LID_OVER * 2) / 2 - 0.035; // where the top meets the rounded edge
  for (let i = 0; i < pos.count; i++) {
    const [x, y, z] = [rest[i * 3], rest[i * 3 + 1], rest[i * 3 + 2]];
    const u = Math.min(1, Math.abs(x) / reach);
    pos.setXYZ(i, x, y + (y > top ? t * rise * (1 - u * u) ** 2 : 0), z);
  }
  pos.needsUpdate = true;
  g.computeVertexNormals();
}

/** The reverse: the strip's far end drawn back toward its start by `t` of its length. */
function drawIn(m: THREE.Mesh, t: number) {
  const total = m.geometry.index!.count;
  const cut = Math.round((t * total) / 12) * 12;
  m.geometry.setDrawRange(0, total - cut);
  m.visible = cut < total;
}

/** A soft radial contact shadow — cheaper and softer than a shadow map on the floor. */
function contactShadowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(128, 128, 10, 128, 128, 128);
  grad.addColorStop(0, "rgba(33,15,49,0.5)");
  grad.addColorStop(0.45, "rgba(33,15,49,0.2)");
  grad.addColorStop(1, "rgba(33,15,49,0)");
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
  private knot: THREE.Mesh;
  private knotTilt = new THREE.Group();
  private wrap: THREE.Mesh;
  private tails: THREE.Mesh[] = [];
  private knotPull = { left: 1, right: 1 };
  private bandX: THREE.Mesh;
  private bandZ: THREE.Mesh;
  private bandSlack = -1;
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

    // Lights: neutral key from upper right (so the logo colours read true), lilac fill, soft pink rim.
    const key = new THREE.DirectionalLight(0xfffaff, 2.4);
    key.position.set(4.5, 8, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = key.shadow.camera.bottom = -4;
    key.shadow.camera.right = key.shadow.camera.top = 4;
    key.shadow.bias = -0.0008;
    key.shadow.normalBias = 0.02;
    key.shadow.radius = 6;
    this.scene.add(key);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xdccbdc, 0.9));
    const rim = new THREE.DirectionalLight(0xf6d4ee, 1.1);
    rim.position.set(-5, 3, -4);
    this.scene.add(rim);

    // Materials
    const inkMat = new THREE.MeshPhysicalMaterial({ color: INK, roughness: 0.66, clearcoat: 0.12, clearcoatRoughness: 0.6, sheen: 0.4, sheenColor: new THREE.Color(0x6a5878) });
    inkMat.envMapIntensity = 0.55;
    const debossTex = debossTexture();
    this.disposables.push(debossTex);
    inkMat.bumpMap = debossTex;
    inkMat.bumpScale = 1.2;
    const linerMat = new THREE.MeshStandardMaterial({ color: KNOT_LIT, roughness: 0.85, side: THREE.DoubleSide, bumpMap: debossTex, bumpScale: 0.9 });
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
    // Reflections held down so the room light doesn't wash the dyed colour out to lavender
    const ribbonMat = new THREE.MeshPhysicalMaterial({ ...satinFinish, color: KNOT_LIT, sheenColor: new THREE.Color(0xc23aa6), specularIntensity: 0.6 });
    ribbonMat.envMapIntensity = 0.5;
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
    const floor = mesh(debossUv(new RoundedBoxGeometry(W, WALL, W, 2, 0.02)), inkMat);
    floor.position.y = WALL / 2;
    base.add(floor);
    const wallGeo = debossUv(new RoundedBoxGeometry(W, H, WALL, 2, 0.02));
    const sideGeo = debossUv(new RoundedBoxGeometry(WALL, H, W - WALL * 2, 2, 0.02));
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
    const linerFloor = mesh(debossUv(new THREE.PlaneGeometry(inner, inner)), linerMat, false);
    linerFloor.rotation.x = -Math.PI / 2;
    linerFloor.position.y = WALL + 0.002;
    base.add(linerFloor);
    const linerWall = track(debossUv(new THREE.PlaneGeometry(inner, H - WALL - 0.01)));
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
    // A smooth field under the foil (same board, no deboss), so no knot runs into the lettering
    const plainInkMat = inkMat.clone();
    plainInkMat.bumpMap = null;
    this.disposables.push(plainInkMat);
    const field = mesh(new THREE.PlaneGeometry(1.86, 0.4), plainInkMat, false);
    field.position.set(0, H * 0.4, W / 2 + 0.001);
    base.add(field);
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
    const lidShell = mesh(debossUv(new RoundedBoxGeometry(LW, LID_H, LW, 3, 0.035)), inkMat);
    lidShell.position.y = LID_H / 2;
    this.lid.add(lidShell);

    // Ribbon bands wrap round the lid's rounded edges and tuck under it, so once the bow is untied
    // they stay on the lid, go slack (loosenBand) and leave with it.
    // The bands lie flat on the lid, which the camera sees at ~6° once the box squares up. At that
    // angle a glossy band mirrors the white room as a white line, so their gloss comes from the
    // magenta sheen instead of specular, the way satin catches light at a low angle
    const bandMat = ribbonMat.clone();
    bandMat.roughness = 0.55;
    bandMat.specularIntensity = 0.1;
    bandMat.envMapIntensity = 0.2;
    bandMat.sheen = 0.45;
    this.disposables.push(bandMat);
    const makeBand = (lift: number) => {
      const path: THREE.Vector3[] = [];
      for (const pt of lidWrapPath(LW, LID_H, 0.035, lift)) {
        const prev = path[path.length - 1];
        // Even 2 cm steps, so the slack curve is smooth
        const n = prev ? Math.ceil(prev.distanceTo(pt) / 0.02) : 1;
        for (let i = 1; i <= n; i++) path.push(prev ? prev.clone().lerp(pt, i / n) : pt);
      }
      const band = mesh(ribbonStripGeometry(path, path.map(() => new THREE.Vector3(0, 0, 1)), RIBBON), bandMat);
      band.geometry.userData.rest = (band.geometry.attributes.position.array as Float32Array).slice();
      return band;
    };
    this.bandX = makeBand(0.003);
    this.bandZ = makeBand(0.006); // lies over the X band where they cross
    const bands = new THREE.Group();
    bands.add(this.bandX);
    const bz = new THREE.Group();
    bz.rotation.y = Math.PI / 2;
    bz.add(this.bandZ);
    bands.add(bz);
    this.lid.add(bands);

    // Bow: the logo's infinity knot, standing on the ribbon crossing, over two dovetailed tails
    // Softer anisotropy and weave than the bands: where the knot twists edge-on at the loop tips,
    // full-strength satin glares white and swallows the logo's indigo
    const logoRibbonMat = new THREE.MeshPhysicalMaterial({
      ...satinFinish,
      vertexColors: true,
      roughness: 0.42,
      anisotropy: 0.35,
      bumpScale: 0.12,
      specularIntensity: 0.55,
      sheen: 0.2,
      sheenColor: new THREE.Color(0x9a7aa6),
    });
    logoRibbonMat.envMapIntensity = 0.45;
    this.disposables.push(logoRibbonMat);
    // In bow space the lid is at y = -0.014; the tails rise out from under the knot, arch a little
    // and settle on the board, with a slight sway and twist like ribbon that's been handled
    // The tails tilt toward the key light as they arch, so their satin is toned down or it glares white
    const tailMat = ribbonMat.clone();
    tailMat.anisotropy = 0.3;
    tailMat.sheen = 0;
    tailMat.specularIntensity = 0.4;
    this.disposables.push(tailMat);
    const TAIL = 0.85;
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
      this.tails.push(tail);
      this.bow.add(tail);
    }
    this.knot = mesh(infinityKnotGeometry(KNOT_SIZE.w, KNOT_SIZE.h, RIBBON * 0.8, 0.09), logoRibbonMat);
    // The wrap binds the crossing, seated on the ribbon crossing; the loops rise from it along the
    // X band, so the bow lines up with the ribbon it's tied from
    this.wrap = mesh(knotWrapGeometry(0.15, 0.1, 0.135), ribbonMat);
    this.knotTilt.position.y = 0.1; // crossing at the wrap's centre, the wrap resting on the bands
    this.knotTilt.rotation.x = -0.22; // leans back a little, like a tied bow settling
    this.knotTilt.add(this.knot, this.wrap);
    this.bow.add(this.knotTilt);
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
    // Keep in step with the hero copy layout (GiftHero: @container min-aspect-ratio 9/10)
    const portrait = aspect < 0.9;

    // Idle breathing fades out as soon as the visitor starts scrolling.
    const idle = (1 - span(p, 0, 0.06)) * (this.opts.idle ? 1 : 0);
    const bob = Math.sin(this.time * 1.1) * 0.035 * idle;

    // 1 · Untie (0.08 → 0.37, under the "Untie the knot." caption), the way a bow comes undone when
    // its tail is pulled: a tug, the right loop slips back through the knot, then the left; the wrap
    // unwinds, the tails draw in, and the bands go slack on the lid.
    const tug = Math.sin(Math.PI * span(p, 0.08, 0.16));
    const right = 1 - easeInOut(span(p, 0.1, 0.22));
    const left = 1 - easeInOut(span(p, 0.15, 0.27));
    // Drawn right through, a loop is just a fold of band inside the wrap
    const pull = { left: Math.max(0.04, left), right: Math.max(0.04, right) };
    if (pull.left !== this.knotPull.left || pull.right !== this.knotPull.right) {
      writeKnot(this.knot.geometry, pull.left, pull.right);
      this.knotPull = pull;
    }
    // The tug lifts the knot a touch and leans it toward the pulled tail
    this.knotTilt.position.y = 0.1 + tug * 0.03;
    this.knotTilt.rotation.z = -tug * 0.07;
    const unwind = easeInOut(span(p, 0.25, 0.31));
    drawOut(this.wrap, unwind);
    this.knot.visible = unwind < 0.5; // the last fold of the loops goes with the wrap
    // The pulled (right) tail slides out as its loop comes through; once the knot is free both
    // tails go slack and draw back in toward the crossing
    const slackTails = easeInOut(span(p, 0.26, 0.34));
    this.tails[1].position.set(Math.sin(TAIL_SPREAD), 0, Math.cos(TAIL_SPREAD)).multiplyScalar(0.28 * (1 - right) * (1 - slackTails));
    this.tails.forEach((t) => drawIn(t, slackTails));
    // Untied, the bands go slack across the top; they're wrapped round the lid, so they leave with it
    const slackBands = easeInOut(span(p, 0.28, 0.37));
    if (slackBands !== this.bandSlack) {
      loosenBand(this.bandX.geometry, slackBands, 0.01);
      loosenBand(this.bandZ.geometry, slackBands, 0.016); // stays over the X band where they cross
      this.bandSlack = slackBands;
    }

    // 2 · Lift the lid (0.32 → 0.62): straight up, then tip back and away
    const lift = easeInOut(span(p, 0.36, 0.52));
    const away = easeInOut(span(p, 0.48, 0.66));
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
    // Landscape: pull back as the stage narrows, so the box never takes more than ~38% of the width
    const fit = portrait ? 1.9 : Math.max(1, 1.75 / aspect);
    // …and keep it centred ~68% across, clear of the headline column. The visible half-width at
    // the start distance is ≈ 2.6 · aspect · fit world units, so this offset scales with both.
    const offsetX = portrait ? 0 : -0.95 * aspect * fit;
    const start = new THREE.Vector3(offsetX, 2.5 * fit, 9.6 * fit);
    const over = new THREE.Vector3(offsetX * 0.75, 6.2 * fit, 3.2 * fit);
    // Just below the rim: every wall in view is magenta, with the card centred on the floor
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
