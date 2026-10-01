import { BoxGeometry, CanvasTexture, Group, Mesh, MeshStandardMaterial, SRGBColorSpace, type Material } from "three";
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

export type BoxParts = {
  group: Group;
  lidPivot: Group;
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

  const materials = [kraft, inside, lidTop];
  const dispose = () => {
    meshes.forEach((m) => m.geometry.dispose());
    materials.forEach((m: Material) => m.dispose());
    lidTop.map?.dispose();
  };
  return { group, lidPivot, materials, dispose };
}
