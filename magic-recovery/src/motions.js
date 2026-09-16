// Demonstration poses in metres: +Y up, +Z forward, anatomical left is +X.
export const MOTIONS = {
  quads: {
    id: "knee-extension",
    benefit: "通过小幅伸膝活动膝关节，尝试缓和腿部不愿活动的僵硬感。",
    name: "坐稳，轻轻伸膝",
    support: "坐在稳固椅子上",
    cue: ["慢慢抬起小腿", "缓慢放回"],
    seated: true,
  },
  hamstrings: {
    id: "knee-curl",
    benefit: "通过扶稳屈膝让腿部轻柔活动，尝试缓和膝部的僵硬感。",
    name: "扶稳，小幅屈膝",
    support: "双手扶住稳固椅背",
    cue: ["脚跟轻轻向后抬", "缓慢放回地面"],
    seated: false,
  },
  adductors: {
    id: "heel-slide",
    benefit: "用滑脚跟温和活动髋膝，尝试缓和腿部僵硬，不强拉大腿内侧。",
    name: "坐稳，轻滑脚跟",
    support: "坐稳，脚跟贴地小幅移动",
    cue: ["脚跟轻轻向前滑", "慢慢滑回"],
    seated: true,
  },
  calves: {
    id: "ankle-pump",
    benefit: "通过轻轻勾脚活动脚踝，尝试缓和踝部的僵硬感。",
    name: "支撑小腿，轻轻勾脚",
    support: "坐稳，用软垫支撑小腿",
    cue: ["慢慢勾脚", "回到自然位置"],
    seated: true,
  },
  shins: {
    id: "ankle-circle",
    benefit: "通过小幅画圈活动脚踝，尝试缓和踝部活动不顺的僵硬感。",
    name: "支撑小腿，脚踝画小圈",
    support: "小腿有支撑，脚踝自由活动",
    cue: ["脚踝轻轻画半圈", "顺势回到起点"],
    seated: true,
  },
};
// Reuse the same verified joint action for neighbouring regions; no new rig or claim of muscle isolation.
MOTIONS.outerthigh = { ...MOTIONS.quads, clipRegion: "quads" };
MOTIONS.outercalf = { ...MOTIONS.shins, clipRegion: "shins" };
export function movementPose(selected, seconds = 0, side = "right") {
  selected = MOTIONS[selected]?.clipRegion || selected;
  const motion = MOTIONS[selected] || MOTIONS.quads;
  const t = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const pulse = (1 - Math.cos((t * Math.PI) / 3)) / 2;
  const active = side === "left" ? 1 : -1;
  const seated = motion.seated;
  const hipY = seated ? 0.49 : 0.90;
  const hipZ = seated ? -0.08 : 0;
  const j = {
    pelvis: [0, hipY, hipZ],
    chest: [0, hipY + 0.33, hipZ - 0.015],
    neck: [0, hipY + 0.48, hipZ],
    head: [0, hipY + 0.6, hipZ],
  };
  const feet = {};
  for (const sign of [-1, 1]) {
    const key = sign === 1 ? "left" : "right";
    const x = sign * 0.12;
    const hip = [x, hipY, hipZ];
    let knee = [x, seated ? hipY - 0.02 : 0.45, seated ? 0.35 : 0];
    let ankle = [x, 0.085, seated ? 0.35 : 0];
    let footX = 0,
      footZ = 0;
    const selectedSide = sign === active;
    if (!seated && selectedSide) {
      const angle = 0.78 * pulse;
      ankle = [
        x,
        knee[1] - 0.365 * Math.cos(angle),
        knee[2] - 0.365 * Math.sin(angle),
      ];
      footX = angle * 0.65;
    }
    if (seated) {
      // Resting feet meet the ground; selected shin can be elevated or move.
      ankle = [x, knee[1] - 0.365, 0.35];
      if (selectedSide && selected === "quads") {
        const angle = 0.85 * pulse;
        ankle = [
          x,
          knee[1] - 0.365 * Math.cos(angle),
          knee[2] + 0.365 * Math.sin(angle),
        ];
        footX = -0.1 * pulse;
      }
      if (selectedSide && selected === "adductors") {
        ankle = [x, 0.105, 0.35 + 0.17 * pulse];
        const dy = ankle[1] - hip[1],
          dz = ankle[2] - hip[2],
          d = Math.hypot(dy, dz);
        const along = (0.45 ** 2 - 0.365 ** 2 + d ** 2) / (2 * d);
        const h = Math.sqrt(Math.max(0, 0.45 ** 2 - along ** 2));
        knee = [x, hip[1] + (dy / d) * along + (dz / d) * h, hip[2] + (dz / d) * along - (dy / d) * h];
      }
      if (selectedSide && ["calves", "shins"].includes(selected)) {
        const length = Math.hypot(0.12, 0.386);
        ankle = [x, knee[1] - 0.365 * 0.12 / length, knee[2] + 0.365 * 0.386 / length];
        if (selected === "calves") footX = -0.3 * pulse;
        else {
          const angle =
            ((2 * Math.PI * t) / 6) * (Math.floor(t / 30) % 2 ? -1 : 1);
          footX = 0.12 * Math.sin(angle);
          footZ = sign * 0.1 * (Math.cos(angle) - 1);
        }
      }
    }
    j[`${key}Hip`] = hip;
    j[`${key}Knee`] = knee;
    j[`${key}Ankle`] = ankle;
    j[`${key}Shoulder`] = [sign * 0.205, hipY + 0.4, hipZ];
    j[`${key}Elbow`] = seated
      ? [sign * 0.25, hipY + 0.17, hipZ + 0.1]
      : [sign * 0.25, 1.24, 0.19];
    j[`${key}Hand`] = seated
      ? [sign * 0.2, hipY + 0.04, hipZ + 0.19]
      : [sign * 0.21, 1.12, 0.37];
    feet[key] = { x: footX, z: footZ };
  }
  return { joints: j, feet, seated, activeSide: side, pulse };
}
