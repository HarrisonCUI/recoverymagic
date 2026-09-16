// Adapted from the user's seated/supine guide. Counts are lesson pacing, not a therapeutic dose.
const SOURCE = {
  quads: ["原始教程 · 坐姿全掌扫揉", "https://uk.physitrack.com/home-exercise-video/self-massage-to-quadriceps-sitting"],
  calves: ["原始教程 · 坐姿小腿按摩", "https://au.physitrack.com/home-exercise-video/self-massage-with-trigger-pointing-to-medial-calf"],
  hamstringsSeated: ["原始教程 · 坐姿后大腿扫揉", "https://na.physitrack.com/home-exercise-video/hamstring-self-massage-in-sitting"],
  hamstrings: ["原始教程 · 仰卧托腿屈伸", "https://us.physitrack.com/home-exercise-video/self-massage-hamstring-release"],
};
export const TECHNIQUES = {
  sweep: { name: "全掌推按", contact: "全掌 · 掌根与四指指腹", area: "palm", cue: "掌面贴住肌腹，均匀推过一小段，再抬手回位。", pressure: "宽面轻推，不用体重向下压", unit: "贴掌 → 推过一段 → 放松 = 1 次", phases: ["全掌轻放", "均匀推过肌腹", "抬手回位"] },
  circle: { name: "环形扫揉", contact: "全掌 · 掌根带动掌面", area: "palm", cue: "手掌贴住肌腹，缓慢画小圈；手和皮肤一起轻轻移动。", pressure: "轻柔带动表面，不磨擦到发热疼痛", unit: "贴掌 → 轻揉一圈 → 放松 = 1 次", phases: ["全掌轻放", "掌面缓慢画圈", "放松回位"] },
  knead: { name: "整手轻揉捏", contact: "拇指肉垫与其余四指 · 整手包覆", area: "grip", cue: "整手松松包住小腿肌腹，掌面与手指轻轻收拢，再完全松开；不夹捏皮肤。", pressure: "轻收拢即可，不使劲挤、不拧、不掐", unit: "包住 → 轻收拢 → 完全松开 = 1 次", phases: ["整手松松包住", "轻收拢，不掐皮肤", "完全松开"] },
  thumb: { name: "拇指轻按", contact: "拇指宽指腹 · 其余手指扶稳", area: "thumb", cue: "用拇指宽指腹轻贴小腿肚内侧中段，缓慢给一点压力后松开，不钻压固定痛点。", pressure: "比扫揉更小心，不追求压出酸痛", unit: "轻贴 → 轻按 → 卸力 = 1 次", phases: ["拇指宽指腹轻贴", "轻按肌腹，不找痛点", "慢慢卸力"] },
  pin: { name: "仰卧托腿屈伸", contact: "双手杯状托腿 · 四指指腹轻贴", area: "cup", cue: "仰卧屈髋屈膝，双手托住大腿后侧中段，保持轻贴，膝盖缓慢伸一点再弯回。", pressure: "只轻贴托住，不靠手臂把指尖拉进肌肉", unit: "托稳 → 伸膝一点 → 弯回 = 1 次", phases: ["双手托住肌腹", "小幅伸膝", "缓慢弯回"] },
  light: { name: "指腹轻抚", contact: "食指 · 中指 · 无名指的末节肉垫", area: "pads", cue: "指腹轻贴软组织，慢慢滑一小段，再抬手放松。", pressure: "轻贴着滑动，不向深处压", unit: "轻放 → 慢滑 → 抬手 = 1 次", phases: ["轻放指腹", "缓慢轻抚", "抬手放松"] },
};
export const MASSAGES = {
  quads: { name: "大腿前侧放松", benefit: "用宽面的扫揉和推按，尝试缓和运动后前大腿的轻微紧绷感。", setup: "坐稳，脚掌落地，膝自然弯曲，让大腿有支撑。", cue: "只在前大腿肌腹中段操作，避开髌骨、髌腱与腹股沟。", travel: 0.055, techniques: ["circle", "sweep", "light"], source: SOURCE.quads },
  hamstrings: { name: "大腿后侧放松", benefit: "让后大腿得到支撑并轻柔活动，尝试缓和紧绷和活动僵硬感。", setup: "仰卧在稳固床面或垫上，目标腿屈膝靠近身体，双手托住后大腿中段。", cue: "远离臀腿交界与膝窝，不抓捏肌腱；够不到就调整姿势。", travel: 0.05, techniques: ["pin", "sweep", "light"], source: SOURCE.hamstrings },
  adductors: { name: "大腿内侧放松", benefit: "用宽面轻扫让运动后紧绷的大腿内侧放松一些，不强行拉开。", setup: "坐稳，目标腿自然向外打开，只处理远离腹股沟的中下段。", cue: "只在大腿内侧中下段宽面轻推，不深压内侧上端。", travel: 0.035, techniques: ["sweep", "light"], source: null },
  calves: { name: "小腿后侧放松", benefit: "用整手轻揉和宽面扫按，尝试缓和运动后小腿肚的轻微紧绷感。", setup: "坐稳、屈膝，目标腿自然外打开，用支撑垫托稳，让小腿完全放松。", cue: "只操作小腿中段肌腹，避开膝窝、跟腱、骨面与异常隆起的静脉。", travel: 0.04, techniques: ["knead", "sweep", "thumb", "light"], source: SOURCE.calves },
  shins: { name: "小腿前侧轻抚", benefit: "轻抚软组织以尝试放松，不把骨缘或固定点疼痛当作肌肉紧绷。", setup: "坐稳并支撑小腿，找到胫骨外侧的软组织。", cue: "这一带肌肉较薄，保留轻抚，不做夹捏或沿骨面推压。", travel: 0.025, techniques: ["light"], source: null },
};
MASSAGES.outerthigh = { name: "大腿外侧轻柔放松", benefit: "轻扫大腿前外侧肌腹，尝试缓和运动后的轻微紧绷感。", setup: "坐稳，脚掌落地，腿放松；手掌只贴在前外侧中段的软组织上。", cue: "示范针对股外侧肌区域；髂胫束是筋膜带，不沿外侧硬带深压。", travel: 0.035, techniques: ["sweep", "light"], source: SOURCE.quads };
MASSAGES.outercalf = { name: "小腿外侧轻柔放松", benefit: "轻抚小腿外侧软组织，尝试放松；也可选择小幅脚踝活动。", setup: "坐稳，用软垫托住小腿，脚踝自然放松；只接触外侧中段软组织。", cue: "不压腓骨头、骨面或外踝；有麻电感就松手。", travel: 0.025, techniques: ["light", "sweep"], source: null };
export function techniqueFor(region, id) {
  return TECHNIQUES[MASSAGES[region].techniques.includes(id) ? id : MASSAGES[region].techniques[0]];
}
export function massagePhase(seconds, selected = "quads", side = "right", technique = "light") {
  const t = Math.max(0, Number.isFinite(seconds) ? seconds : 0) % 8;
  const travel = MASSAGES[selected].travel;
  const phase = t < 1.5 ? 0 : t < 6 ? 1 : 2;
  const u = Math.max(0, Math.min(1, (t - 1.5) / 4.5));
  const eased = u * u * (3 - 2 * u);
  const intensity = Math.sin(Math.PI * u) ** 2;
  const returnU = Math.max(0, Math.min(1, (t - 6) / 2));
  const pathProgress = phase === 2 ? 1 - returnU * returnU * (3 - 2 * returnU) : eased;
  const labels = (TECHNIQUES[technique] || TECHNIQUES.light).phases;
  return {
    side, phase: labels[phase], phaseIndex: phase, progress: pathProgress,
    offset: technique === "circle" ? Math.sin(eased * Math.PI * 2) * travel * 0.3 : ["knead", "thumb"].includes(technique) ? 0 : -travel / 2 + travel * eased,
    lateral: technique === "circle" ? (Math.cos(eased * Math.PI * 2) - 1) * travel * 0.23 : 0,
    curl: technique === "knead" ? 0.15 + intensity * 0.65 : technique === "thumb" ? 0.48 : 0,
    roll: technique === "knead" ? Math.sin(u * Math.PI * 2) * 0.08 : 0,
    hover: phase === 0 ? 1 - t / 1.5 : phase === 1 ? 0 : (t - 6) / 2,
    contact: phase === 1,
  };
}
export const MASSAGE_NOTE = "锐痛、麻木或不适加重就停；新伤、肿热变色或破损处不按摩。";
export const MASSAGE_LIMIT = "依据提供的《坐姿和躺姿徒手腿部放松指南 运动专项扩展版》改编，仅用于普通运动后轻度紧绷。宽面扫揉、轻揉捏、拇指轻按与托腿屈伸是不同手法；本页不包含深挖痛点或治疗性深压。3D 展示手形和移动节奏，不测量力度或模拟组织受力。短暂舒服是尝试目标，不代表损伤被修复。";
export const MASSAGE_SOURCES = [["运动后放松指南 · 本地原文", "/guides/leg-relaxation-guide.docx"], ["按摩证据与注意事项 · NCCIH", "https://www.nccih.nih.gov/health/massage-therapy-what-you-need-to-know"]];

export function massageSetup(region, technique) {
  return region === "hamstrings" && technique !== "pin"
    ? "坐在稳固椅子前缘，让目标腿放松、脚掌落地；手掌从侧方伸到后大腿中段，够不到就调整坐姿。"
    : MASSAGES[region].setup;
}
export function massageSource(region, technique) {
  return region === "hamstrings" && technique !== "pin" ? SOURCE.hamstringsSeated : MASSAGES[region].source;
}
