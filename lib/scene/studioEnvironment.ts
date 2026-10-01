import {
  BackSide,
  BoxGeometry,
  Color,
  Mesh,
  MeshBasicMaterial,
  PMREMGenerator,
  PlaneGeometry,
  RingGeometry,
  Scene,
  type Texture,
  type WebGLRenderer,
} from "three";

type Light = {
  geometry: PlaneGeometry | RingGeometry;
  intensity: number;
  color?: string;
  position: [number, number, number];
  scale: [number, number, number];
};

/** Softbox layout: one large top light, two tall rim strips for the glass edges, a warm front fill and a ring for a round highlight. */
const lights: Light[] = [
  { geometry: new PlaneGeometry(), intensity: 2.6, position: [0, 4, 1], scale: [6, 4, 1] },
  { geometry: new PlaneGeometry(), intensity: 3, position: [-3, 1, 1], scale: [0.6, 5, 1] },
  { geometry: new PlaneGeometry(), intensity: 3, position: [3, 1, 1], scale: [0.6, 5, 1] },
  { geometry: new PlaneGeometry(), intensity: 0.8, color: "#FFE9D2", position: [0, 1, 4], scale: [8, 3, 1] },
  { geometry: new RingGeometry(0.5, 1, 48), intensity: 1.2, position: [1.5, 2, 3], scale: [1.2, 1.2, 1.2] },
];

/**
 * Studio lighting baked into an environment map on the GPU once: zero network requests and none of the HDR/EXR/gain-map loaders
 * that a generic <Environment> component bundles.
 */
export function createStudioEnvironment(renderer: WebGLRenderer): Texture {
  const scene = new Scene();
  const room = new Mesh(new BoxGeometry(12, 12, 12), new MeshBasicMaterial({ color: "#5E5850", side: BackSide }));
  scene.add(room);
  for (const l of lights) {
    const material = new MeshBasicMaterial({ color: new Color(l.color ?? "#FFFFFF").multiplyScalar(l.intensity), side: 2 });
    const mesh = new Mesh(l.geometry, material);
    mesh.position.set(...l.position);
    mesh.scale.set(...l.scale);
    mesh.lookAt(0, 0, 0);
    scene.add(mesh);
  }
  const pmrem = new PMREMGenerator(renderer);
  const texture = pmrem.fromScene(scene, 0.02).texture;
  pmrem.dispose();
  scene.traverse((o) => {
    if (o instanceof Mesh) {
      o.geometry.dispose();
      o.material.dispose();
    }
  });
  return texture;
}
