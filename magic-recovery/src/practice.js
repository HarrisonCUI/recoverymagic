// An introductory lesson structure, not a condition-specific therapeutic dose.
export const PRACTICE_COUNT = "1 轮 · 1–3 次";
export const PRACTICE_PLAN = "先试 1 次，舒适再做 2 次；随后停下，感受变化。";
export const PRACTICE_LIMIT = "1–3 次是本页入门试做的节奏，不是经验证的治疗剂量，也不是每日疗程。先试一次，舒适且没有新增不适才继续；完成这一轮先休息和感受，不因没有缓解就追加次数或加力。次数与动画循环、所选放松计时互相独立，不必做满计时。";
export function repetitionUnit(method) {
  return method === "massage" ? "轻放 → 慢滑 → 抬手 = 1 次" : "做出动作 → 回到起点 = 1 次";
}
