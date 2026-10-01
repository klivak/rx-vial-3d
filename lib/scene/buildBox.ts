import {
  AdditiveBlending,
  BoxGeometry,
  CanvasTexture,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  type Material,
} from "three";
import { createCapsuleGeometry } from "@/lib/scene/buildCapsules";
import { theme } from "@/lib/theme";

export const BOX = {
  width: 0.07,
  height: 0.05,
  depth: 0.07,
  wall: 0.002,
  position: [0.08, 0, -0.07] as const,
  rotationY: -0.35,
  /** Lid swing when fully open, a little past vertical so it rests against nothing. */
  lidOpenAngle: (110 / 180) * Math.PI,
} as const;

function createLidTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#D8C3A2";
  ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 6;
  ctx.strokeRect(40, 40, 432, 432);
  ctx.fillStyle = theme.accent;
  ctx.font = `600 64px ${getComputedStyle(document.body).fontFamily}`;
  ctx.textAlign = "center";
  ctx.fillText("A U R E L", 256, 275);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** Folded welcome card standing in the box: a brand mark and one line, drawn once. */
function createCardTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext("2d")!;
  const family = getComputedStyle(document.body).fontFamily;
  ctx.fillStyle = "#FBF8F2";
  ctx.fillRect(0, 0, 512, 320);
  ctx.fillStyle = theme.accent;
  ctx.fillRect(0, 0, 512, 10);
  ctx.textAlign = "center";
  ctx.font = `600 34px ${family}`;
  ctx.fillText("A U R E L", 256, 130);
  ctx.fillStyle = theme.muted;
  ctx.font = `400 26px ${family}`;
  ctx.fillText("Made for you, by your clinician.", 256, 195);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** Soft radial falloff used for the light that spills out of the opened box. */
function createGlowTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,226,180,1)");
  g.addColorStop(0.45, "rgba(255,210,150,0.35)");
  g.addColorStop(1, "rgba(255,200,140,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new CanvasTexture(canvas);
}

/** Loose capsules on the table next to the box: [x, z, rotation around y] relative to the box centre. */
const LOOSE: [number, number, number][] = [
  [-0.05, 0.03, 0.4],
  [-0.043, 0.042, 1.9],
  [0.012, 0.052, -0.7],
];

export type BoxParts = {
  group: Group;
  lidPivot: Group;
  /** Rises out of the box as the lid opens. */
  card: Mesh;
  glow: Mesh;
  glowMaterial: MeshBasicMaterial;
  loose: Mesh[];
  materials: MeshStandardMaterial[];
  dispose: () => void;
};

/** Open-top cardboard box made of thin walls, with the lid hinged on its back edge so rotating the pivot opens it like a real box. */
export function buildBox(): BoxParts {
  const { width: w, height: h, depth: d, wall: t } = BOX;
  const kraft = new MeshStandardMaterial({ color: "#D8C3A2", roughness: 0.92 });
  const inside = new MeshStandardMaterial({ color: "#EFE6D6", roughness: 0.95 });
  const lidTop = new MeshStandardMaterial({ map: createLidTexture(), roughness: 0.9 });

  const group = new Group();
  group.name = "Box";
  group.position.set(...BOX.position);
  group.rotation.y = BOX.rotationY;

  const walls: [number, number, number, number, number, number][] = [
    [w, t, d, 0, t / 2, 0],
    [w, h, t, 0, h / 2, d / 2 - t / 2],
    [w, h, t, 0, h / 2, -d / 2 + t / 2],
    [t, h, d, w / 2 - t / 2, h / 2, 0],
    [t, h, d, -w / 2 + t / 2, h / 2, 0],
  ];
  const meshes: Mesh[] = walls.map(([sx, sy, sz, x, y, z]) => {
    // BoxGeometry face groups: +x, -x, +y, -y, +z, -z. Faces looking into the box get the lighter inner board.
    const mesh = new Mesh(new BoxGeometry(sx, sy, sz), [kraft, kraft, inside, kraft, kraft, kraft]);
    mesh.position.set(x, y, z);
    group.add(mesh);
    return mesh;
  });

  const lidPivot = new Group();
  lidPivot.position.set(0, h, -d / 2);
  const lid = new Mesh(new BoxGeometry(w + 0.002, 0.003, d + 0.002), [kraft, kraft, lidTop, inside, kraft, kraft]);
  lid.position.set(0, 0.0015, d / 2);
  lidPivot.add(lid);
  group.add(lidPivot);
  meshes.push(lid);

  const cardMaterial = new MeshStandardMaterial({ map: createCardTexture(), roughness: 0.85 });
  const card = new Mesh(new BoxGeometry(w * 0.72, h * 0.62, 0.0008), cardMaterial);
  card.rotation.x = -0.18;
  group.add(card);
  meshes.push(card);

  // Additive, unlit and depth-tested only against what is in front: a cheap stand-in for light bouncing off the inner board.
  const glowMaterial = new MeshBasicMaterial({ map: createGlowTexture(), transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false });
  const glow = new Mesh(new PlaneGeometry(w * 1.6, w * 1.6), glowMaterial);
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = h + 0.001;
  glow.renderOrder = 5;
  group.add(glow);
  meshes.push(glow);

  const capsuleGeometry = createCapsuleGeometry("low");
  const capsuleMaterial = new MeshStandardMaterial({ vertexColors: true, roughness: 0.28 });
  const loose = LOOSE.map(([x, z, ry]) => {
    const m = new Mesh(capsuleGeometry, capsuleMaterial);
    m.position.set(x, 0.0034, z);
    m.rotation.set(0, ry, Math.PI / 2);
    m.scale.setScalar(0);
    group.add(m);
    return m;
  });

  const materials = [kraft, inside, lidTop, cardMaterial];
  const dispose = () => {
    meshes.forEach((m) => m.geometry.dispose());
    capsuleGeometry.dispose();
    [...materials, glowMaterial, capsuleMaterial].forEach((m: Material) => m.dispose());
    lidTop.map?.dispose();
    cardMaterial.map?.dispose();
    glowMaterial.map?.dispose();
  };
  return { group, lidPivot, card, glow, glowMaterial, loose, materials, dispose };
}
