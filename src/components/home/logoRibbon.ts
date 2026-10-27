// The logo's infinity ribbon as a solid satin band, morphed by scroll from the flat mark to a
// sculpted ribbon. Built on the logo's own centre line, widths and colours
// (src/data/logo-ribbon.json, measured by scripts/measure-logo-ribbon.mjs).
//
// The trick that keeps it the logo throughout: at every sample the band's *visible* width, seen
// face-on, stays exactly the logo's width there. As `morph` rises the band's true width grows to a
// constant satin width and turns toward edge-on by acos(logo / true), so where the logo draws the
// ribbon thin it becomes a real twist. Depth (crossing separation, thickness, a gentle cupping of
// the loops) only grows into the axis the face-on view can't see.
import * as THREE from "three";
import logoRibbon from "@/data/logo-ribbon.json";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const span = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));
const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** World units one tile of the satin weave spans along the ribbon. */
const SATIN_TILE = 0.12;
/** Points across each face of the band; the ring adds a rounded edge either side. */
const FACE = 7;
const RING = FACE * 2 + 2;

// Cross-section ring, walking round the band: top face left → right, right edge, bottom face
// right → left, left edge. [u across (-1..1), side (+1 top, -1 bottom, 0 edge), v for the weave]
const PROFILE: [number, number, number][] = [];
for (let k = 0; k < FACE; k++) {
  const u = lerp(-0.96, 0.96, k / (FACE - 1));
  PROFILE.push([u, 1, (u + 1) / 2]);
}
PROFILE.push([1, 0, 1]);
for (let k = FACE - 1; k >= 0; k--) {
  const u = lerp(-0.96, 0.96, k / (FACE - 1));
  PROFILE.push([u, -1, (u + 1) / 2]);
}
PROFILE.push([-1, 0, 0]);

export class LogoRibbon {
  readonly geometry = new THREE.BufferGeometry();
  /** 1 = the logo's flat colours exactly, 0 = fully lit satin. Shared with the material. */
  readonly flat = { value: 1 };
  private morph = -1;
  private centre: THREE.Vector3[];
  private logoW: number[];
  private bandW: number;
  private lengths: number[] = [0];
  private n: number;

  /** `size`: the symbol's width end to end, in world units. */
  constructor(private size: number) {
    const { points, widths, colours } = logoRibbon;
    this.n = points.length;
    this.centre = points.map(([x, y]) => new THREE.Vector3(x * size, y * size, 0));
    this.logoW = widths.map((w) => w * size);
    // The true satin width: the logo's widest stretch (the magenta diagonal, seen flat on)
    this.bandW = Math.max(...this.logoW);
    for (let i = 1; i < this.n; i++) this.lengths.push(this.lengths[i - 1] + this.centre[i].distanceTo(this.centre[i - 1]));

    const verts = this.n * RING + 2; // + a cap centre at each end
    const uv = new Float32Array(verts * 2);
    const logo = new Float32Array(verts * 3); // the logo's sRGB colour, for the flat look
    const lit = new Float32Array(verts * 3); // linear, pre-darkened for the lit satin
    const c = new THREE.Color();
    for (let i = 0; i < this.n; i++) {
      c.set(colours[i]);
      const srgb = c.clone().convertLinearToSRGB();
      // Pre-darkened so the lit, ACES-tone-mapped satin lands near the logo's colour. By luminance:
      // the logo's limes are ~3× brighter than its magenta, and would blow out to a pale wash
      const lum = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
      const dark = c.clone().multiplyScalar(0.42 * Math.min(1, Math.sqrt(0.24 / Math.max(lum, 1e-4))));
      for (let j = 0; j < RING; j++) {
        const k = i * RING + j;
        uv.set([this.lengths[i] / SATIN_TILE, PROFILE[j][2]], k * 2);
        logo.set([srgb.r, srgb.g, srgb.b], k * 3);
        lit.set([dark.r, dark.g, dark.b], k * 3);
      }
    }
    for (const [cap, i] of [[this.n * RING, 0], [this.n * RING + 1, this.n - 1]]) {
      logo.set(logo.subarray(i * RING * 3, i * RING * 3 + 3), cap * 3);
      lit.set(lit.subarray(i * RING * 3, i * RING * 3 + 3), cap * 3);
      uv.set([this.lengths[i] / SATIN_TILE, 0.5], cap * 2);
    }

    const index: number[] = [];
    for (let i = 0; i < this.n - 1; i++) {
      for (let j = 0; j < RING; j++) {
        const a = i * RING + j;
        const b = i * RING + ((j + 1) % RING);
        index.push(a, b, a + RING, b, b + RING, a + RING);
      }
    }
    // Close the tips
    const [c0, c1] = [this.n * RING, this.n * RING + 1];
    const last = (this.n - 1) * RING;
    for (let j = 0; j < RING; j++) {
      index.push(c0, (j + 1) % RING, j);
      index.push(c1, last + j, last + ((j + 1) % RING));
    }

    this.geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(verts * 3), 3));
    this.geometry.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(verts * 3), 3));
    this.geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    this.geometry.setAttribute("color", new THREE.BufferAttribute(lit, 3));
    this.geometry.setAttribute("logoColor", new THREE.BufferAttribute(logo, 3));
    this.geometry.setIndex(index);
    this.setMorph(0);
  }

  /**
   * Shapes the band for `m` (0 = the logo, 1 = the finished ribbon). Continuous in m, so scrolling
   * back retraces it exactly. Lowest point rests on y = 0 at every m.
   */
  setMorph(m: number) {
    m = clamp01(m);
    if (m === this.morph) return;
    this.morph = m;
    const { crossing } = logoRibbon;
    const n = this.n;
    const size = this.size;
    // Width and twist come in first (the face-on view can't see them), then depth and cupping
    const twist = smooth(span(m, 0.04, 0.7));
    const depth = smooth(span(m, 0.1, 0.85));
    const body = smooth(span(m, 0, 0.55));
    const thick = lerp(0.0025, 0.012, body) * (size / 1.45);
    const cup = 0.18 * body; // the band's cross-section curls a little, as satin does
    const part = lerp(0.012, 0.09, depth) * size; // strand separation at the crossing
    const reach = lerp(6, 12, depth);
    const bump = (d: number) => Math.exp(-((d / reach) ** 2));
    const loopCup = 0.16 * depth * size; // the loops' far ends lean toward the viewer

    const pos = this.geometry.attributes.position as THREE.BufferAttribute;
    const z = new THREE.Vector3(0, 0, 1);
    const tangent = new THREE.Vector3();
    const flat = new THREE.Vector3();
    const across = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const p = new THREE.Vector3();
    const centres: THREE.Vector3[] = this.centre.map((c, i) => {
      const x = c.x / size;
      return new THREE.Vector3(c.x, c.y, part * (bump(i - crossing[0]) - bump(i - crossing[1])) + loopCup * (2 * x) ** 2);
    });
    let minY = Infinity;
    for (let i = 0; i < n; i++) {
      tangent.subVectors(centres[Math.min(n - 1, i + 1)], centres[Math.max(0, i - 1)]).normalize();
      flat.set(-tangent.y, tangent.x, 0).normalize();
      // Toward the cut ends the twist eases off (smoothly, so no kink) and the band narrows a
      // little, as the logo's ends do
      const tip = smooth(Math.min(1, i / 10, (n - 1 - i) / 10));
      const seen = this.logoW[i] * (0.65 + 0.35 * tip);
      const trueW = lerp(seen, Math.max(seen, this.bandW), twist * tip);
      const turn = Math.acos(Math.min(1, Math.max(0.17, seen / trueW)));
      across.copy(flat).multiplyScalar(Math.cos(turn)).addScaledVector(z, Math.sin(turn));
      normal.crossVectors(tangent, across).normalize();
      const half = trueW / 2;
      for (let j = 0; j < RING; j++) {
        const [u, side] = PROFILE[j];
        const lift = side === 0 ? 0 : side * thick * 0.5 + cup * half * 0.25 * (1 - u * u);
        p.copy(centres[i]).addScaledVector(across, u * half).addScaledVector(normal, lift);
        pos.setXYZ(i * RING + j, p.x, p.y, p.z);
        minY = Math.min(minY, p.y);
      }
    }
    // Tip caps sit at the middle of each end ring
    for (const [cap, i] of [[n * RING, 0], [n * RING + 1, n - 1]]) {
      p.set(0, 0, 0);
      for (let j = 0; j < RING; j++) p.add(new THREE.Vector3().fromBufferAttribute(pos, i * RING + j));
      p.divideScalar(RING);
      pos.setXYZ(cap, p.x, p.y, p.z);
    }
    for (let k = 0; k < pos.count; k++) pos.setY(k, pos.getY(k) - minY);
    pos.needsUpdate = true;
    this.geometry.computeVertexNormals();
    this.geometry.computeBoundingSphere();
    // Satin lighting fades in over the first half. A fifth of the logo's exact colour stays in the
    // finished ribbon, so the brand colours read true under any light, like a dyed-through satin
    this.flat.value = 1 - 0.8 * smooth(span(m, 0.02, 0.6));
  }

  /**
   * Wires a satin material to this ribbon: lit colours from `color`, blended toward the logo's
   * exact sRGB colours by `flat` after tone mapping, so the first frame shows the mark's own colours.
   */
  dress(mat: THREE.MeshPhysicalMaterial) {
    mat.vertexColors = true;
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uFlat = this.flat;
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nattribute vec3 logoColor;\nvarying vec3 vLogo;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvLogo = logoColor;");
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\nuniform float uFlat;\nvarying vec3 vLogo;")
        .replace("#include <colorspace_fragment>", "#include <colorspace_fragment>\ngl_FragColor.rgb = mix(gl_FragColor.rgb, vLogo, uFlat);");
    };
    mat.customProgramCacheKey = () => "pk-logo-ribbon";
    return mat;
  }
}
