import { PRACTICE_PLAN, PRACTICE_LIMIT, repetitionUnit } from "./practice.js";
import { MOTIONS } from "./motions.js";
// Timings are optional pacing aids. These are gentle demonstrations, not diagnoses or rehabilitation prescriptions.
export function tutorialFor(region) {
  const motion = MOTIONS[region.id];
  const movementRegion = motion.clipRegion || region.id;
  const supported = ["calves", "shins"].includes(movementRegion);
  const equipment = motion.seated
    ? supported
      ? "稳固座椅 · 矮凳 · 软垫"
      : "稳固座椅 · 平坦地面"
    : "稳固椅背 · 平坦地面";
  const prepare = motion.seated
    ? [
        "坐在不会滑动的椅子上，身体直立，放松肩膀。",
        supported
          ? "在稳固矮凳上放软垫，托住所选一侧小腿，让脚踝悬空并能自由活动。"
          : "双脚自然落地，双手轻扶座椅两侧。",
        "先看一遍示范，再试一个很小的动作；以舒适、无痛为限。",
      ]
    : [
        "站在稳固椅背后，双手轻扶椅背，保持身体直立。",
        "双脚自然分开，与髋同宽，重心保持稳定。",
        "先看示范；站不稳时选择休息，不用勉强做动作。",
      ];
  const lessons = {
    quads: [
      ["慢慢抬起小腿", "大腿留在座椅上，缓慢伸膝，让脚向前抬起少许。"],
      ["缓慢放回", "小腿缓慢回到起始位置，脚落稳，不甩腿。"],
    ],
    hamstrings: [
      [
        "脚跟轻轻向后抬",
        "双手扶稳椅背，所选一侧膝盖轻轻弯曲，脚跟向后抬起少许。",
      ],
      ["缓慢放回地面", "身体保持直立，慢慢把脚放回，不用手拉脚踝。"],
    ],
    adductors: [
      [
        "脚跟轻轻向前滑",
        "坐稳，让所选一侧脚跟沿地面向前滑一小段，双腿自然分开。",
      ],
      ["慢慢滑回", "脚跟慢慢回到原位，幅度以舒适为准，不向外强拉大腿。"],
    ],
    calves: [
      ["慢慢勾脚", "小腿放在软垫上，脚尖轻轻朝自己靠近，只活动脚踝。"],
      ["回到自然位置", "脚尖自然放回，小腿保持有支撑，不用力绷到最远。"],
    ],
    shins: [
      [
        "脚踝轻轻画半圈",
        "小腿放在软垫上，脚尖带动脚踝画很小的圆弧，小腿保持稳定。",
      ],
      ["顺势回到起点", "平顺地完成小圈，也可换方向；不追求幅度，不牵拉到痛。"],
    ],
  };
  return {
    title: `${region.name} · 轻松舒缓`,
    motionId: motion.id,
    benefit: motion.benefit,
    equipment,
    prepare,
    steps: [
      ...lessons[movementRegion].map(([title, body]) => ({ title, body })),
      {
        title: "试做 1–3 次",
        body: `${repetitionUnit("movement")}。${PRACTICE_PLAN} ${PRACTICE_LIMIT}`,
      },
    ],
    sensation: "以轻松、无痛为准，不用追求强烈拉扯感。",
    avoid: region.avoid,
    settle: [
      "停止动作，坐稳，让双腿得到支撑。",
      "自然呼吸几次，留意感受的变化，不反复按压验证。",
      "今天减少刺激这片区域的训练，接下来记录感受。",
    ],
  };
}
