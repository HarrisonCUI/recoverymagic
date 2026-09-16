import * as THREE from "three";

// Supine, supported hamstring demonstration adapted from the supplied guide.
// Small knee motion; no pulling into tissue or measured pressure.
export function supineMassagePose(selected, seconds = 0, side = "right") {
  const pulse = (1 - Math.cos(Math.max(0, seconds) * Math.PI / 3)) / 2;
  const active = side === "left" ? 1 : -1;
  const joints = { pelvis: [0, 0.20, 0], chest: [0, 0.20, -0.33] };
  const feet = {};
  for (const sign of [-1, 1]) {
    const name = sign === 1 ? "left" : "right", x = sign * 0.105;
    joints[name + "Hip"] = [x, 0.20, 0];
    if (sign === active) {
      joints[name + "Knee"] = [x, 0.60, 0.20];
      const angle = 0.42 + 0.25 * pulse;
      joints[name + "Ankle"] = [x, 0.60 - 0.40 * Math.cos(angle), 0.20 + 0.40 * Math.sin(angle)];
      feet[name] = { x: -0.10, z: 0 };
    } else {
      joints[name + "Knee"] = [x, 0.22, 0.43];
      joints[name + "Ankle"] = [x, 0.11, 0.83];
      feet[name] = { x: -1.15, z: 0 };
    }
    joints[name + "Shoulder"] = [sign * 0.205, 0.20, -0.40];
    // Stagger the cupped hands along the back of the thigh. Their palms
    // support adjacent patches instead of putting both finger sets together.
    const shoulder = new THREE.Vector3(...joints[name + "Shoulder"]);
    const wrist = new THREE.Vector3(active * 0.105 + sign * 0.085, 0.37 + sign * 0.055, -0.045 + sign * 0.0275);
    const direction = wrist.clone().sub(shoulder), distance = direction.length();
    direction.normalize();
    const upper = 0.2835, forearm = 0.223;
    const along = (upper * upper - forearm * forearm + distance * distance) / (2 * distance);
    const radius = Math.sqrt(Math.max(0, upper * upper - along * along));
    const pole = new THREE.Vector3(sign * 0.7, 1, 0);
    pole.addScaledVector(direction, -pole.dot(direction)).normalize();
    const elbow = shoulder.clone().addScaledVector(direction, along).addScaledVector(pole, radius);
    joints[name + "Elbow"] = elbow.toArray();
    joints[name + "Hand"] = wrist.toArray();
  }
  return { joints, feet, seated: false, activeSide: side, pulse, supine: true };
}
