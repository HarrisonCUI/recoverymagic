import * as THREE from "three";
import { loadJsonAsset } from "./assetLoader.js";
export function touchPhase(seconds, step, side) {
  const t = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const part = t % 6;
  const approach = part < 1.5 ? 1 - part / 1.5 : part < 4 ? 0 : (part - 4) / 2;
  return {
    side:
      step === 2 && Math.floor(t / 6) % 2 === 1
        ? side === "left"
          ? "right"
          : "left"
        : side,
    hover: step === 0 ? 1 : approach,
    phase:
      step === 0
        ? "找到这片区域"
        : part < 1.5
          ? "指腹慢慢靠近"
          : part < 4
            ? "轻触停留，不用加力"
            : "抬起手指，放松",
    contact: step > 0 && part >= 1.5 && part < 4,
  };
}
let handAsset;
function loadHand() {
  if (!handAsset)
    handAsset = loadJsonAsset("hand", "/models/hand.json")
      .catch((error) => {
        handAsset = null;
        throw error;
      });
  return handAsset;
}
export function createTouchHand(scene) {
  const hand = new THREE.Group();
  hand.name = "Atlas anatomical teaching hand";
  hand.visible = false;
  scene.add(hand);
  hand.userData.ready = loadHand().then((asset) => {
    if (hand.userData.disposed) return;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(asset.positions, 3),
    );
    geometry.setAttribute(
      "normal",
      new THREE.Float32BufferAttribute(asset.normals, 3),
    );
    geometry.setIndex(asset.indices);
    // Smoothly curl the original continuous surface for a cupped hand; no
    // primitive fingers. This is an educational pose, not force simulation.
    const curled = asset.positions.slice();
    for (let i = 0; i < curled.length; i += 3) {
      const x = asset.positions[i], y = asset.positions[i + 1], z = asset.positions[i + 2];
      const length = Math.max(0, y + 0.085);
      const angle = Math.min(1, length / 0.08) * 1.3;
      curled[i + 1] = -0.085 + Math.cos(angle) * length + Math.sin(angle) * (z - 0.019);
      curled[i + 2] = 0.019 - Math.sin(angle) * length + Math.cos(angle) * (z - 0.019);
      if (y < -0.085) { curled[i + 1] = y; curled[i + 2] = z; }
    }
    geometry.morphAttributes.position = [new THREE.Float32BufferAttribute(curled, 3)];
    const curledGeometry = new THREE.BufferGeometry();
    curledGeometry.setAttribute("position", new THREE.Float32BufferAttribute(curled, 3));
    curledGeometry.setIndex(asset.indices);
    curledGeometry.computeVertexNormals();
    geometry.morphAttributes.normal = [curledGeometry.attributes.normal.clone()];
    curledGeometry.dispose();
    geometry.computeBoundingSphere();
    const material = new THREE.MeshStandardMaterial({
      color: 0x9aabae,
      metalness: 0.22,
      roughness: 0.52,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = "BodyParts3D continuous hand surface";
    hand.add(mesh);
    hand.userData.setCurl = (value) => { mesh.morphTargetInfluences[0] = THREE.MathUtils.clamp(value, 0, 1); };
  });
  return hand;
}
