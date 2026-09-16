import { assess } from "./data.js";
const sprains = [
  "处理原则 · NHS",
  "https://www.nhs.uk/conditions/sprains-and-strains/",
];
export function carePlanFor(d) {
  const result = assess(d);
  if (result.allow) return null;
  const flags = d.flags || [];
  if (result.kind === "injury")
    return {
      id: "protect",
      title: "突然不适，现在这样处理",
      reason:
        "突然出现的不适有多种原因，单靠位置和轻触无法确认是否拉伤。先从减少刺激和舒适支撑开始。",
      priority:
        "若疼痛严重或加重、肿胀明显、无法负重，请尽快联系医生；受伤后麻木、变形或皮肤发冷变色时寻求急诊帮助。",
      source: sprains,
      steps: [
        {
          title: "减轻负担，垫好支撑",
          intro: "先让不舒服的部位得到休息。",
          actions: [
            "暂停引起不适的跑跳或负重，坐下或躺在舒适位置。",
            "用柔软枕垫托住腿部；有肿胀时可在舒适范围内抬高。",
            "最初几天避免深揉、热敷和强拉伸，让局部少受刺激。",
          ],
          tip: "支撑以舒服为准，不用硬掰到某个姿势。",
        },
        {
          title: "冷敷是否适合现在？",
          intro:
            "如果是最近 2–3 天的扭拉伤或肿胀，可尝试短时冷敷缓解；不是每种不适都需要冷敷。",
          actions: [
            "用毛巾包住冰袋，轻放在不适区域，避免直接接触皮肤。",
            "每次最多 20 分钟，可按需要间隔 2–3 小时再用，不绑紧、不睡着敷。",
            "皮肤感觉或循环异常、破损处先不要自行冷敷；出现刺痛、麻木或皮肤变色就取下。",
          ],
          tip: "没有冰袋也可以先休息、支撑。冷敷并不能确认原因或替代评估。",
        },
        {
          title: "观察变化，安排下一步",
          intro: "把之后的变化记下来，比反复按压更有用。",
          actions: [
            "留意疼痛、肿胀和日常走路能力的变化，不用反复做深蹲来测试。",
            "症状未改善、反复出现或影响日常活动时，联系医生或物理治疗师。",
            "在疼痛不再妨碍活动时逐渐恢复轻柔活动；回到跑跳和大重量训练应循序渐进，必要时先做专业评估。",
          ],
          tip: "记录好转不等于损伤已经恢复，也不是恢复高强度训练的许可。",
        },
      ],
    };
  if (result.kind === "pause")
    return {
      id: "settle",
      title: "换一种方式，让身体缓下来",
      reason:
        "刚才的动作让不适增加了，可以继续通过休息、观察和记录寻找更适合的下一步。",
      priority: "明显肿胀、麻木、无力或无法负重时请尽快联系医生。",
      source: sprains,
      steps: [
        {
          title: "坐稳，让腿有支撑",
          intro: "先换成不引起不适的姿势。",
          actions: [
            "停下刚才的动作，坐下并用软垫支撑腿部。",
            "放松肩膀、自然呼吸，暂时减少刺激该部位的活动。",
          ],
          tip: "不需要换一个更强的动作，也不用按摩来“补做”。",
        },
        {
          title: "看看休息后的变化",
          intro: "轻松观察，不再反复刺激。",
          actions: [
            "留意休息后是减轻、相近还是更明显。",
            "如果不适加重、持续不改善或影响日常活动，联系专业人员。",
          ],
          tip: "出现胸痛、呼吸困难或濒晕时立即寻求急救。",
        },
        {
          title: "记下触发动作",
          intro: "把信息带到下次复查或咨询中。",
          actions: [
            "记下哪个动作、什么位置让感受加重。",
            "今天减少相同刺激；下次从较轻负荷开始，必要时请专业人员指导。",
          ],
          tip: "现在可以保存记录，稍后从身体笔记继续观察。",
        },
      ],
    };
  const emergency = result.kind === "emergency";
  const urine = flags.includes("urine");
  return {
    id: emergency ? "emergency" : "assessment",
    emergency,
    title: emergency
      ? "现在获得帮助，接下来这样做"
      : "带着清楚的信息，获得帮助",
    reason: result.body,
    priority: emergency
      ? "请立即拨打 120（中国大陆），不要等教程看完。"
      : urine
        ? "请现在前往急诊，不等待在家舒缓的效果。"
        : "请尽快联系医生检查原因；突然或迅速加重、受伤后麻木或皮肤发冷变色时寻求急诊帮助。",
    source: urine
      ? [
          "异常症状与处理 · CDC",
          "https://www.cdc.gov/niosh/rhabdo/signs-symptoms/index.html",
        ]
      : flags.includes("swelling") || emergency
        ? [
            "腿部异常症状 · NHS",
            "https://www.nhs.uk/conditions/deep-vein-thrombosis-dvt/",
          ]
        : sprains,
    steps: [
      {
        title: emergency
          ? "立即联系急救"
          : urine
            ? "现在联系急诊"
            : "请专业人员确认原因",
        intro: "先处理当前症状，再保存记录也来得及。",
        actions: emergency
          ? [
              "拨打 120，说明你的位置、胸痛或呼吸困难等症状。",
              "请身边的人陪同，按照急救人员的指引处理，不自行驾车。",
            ]
          : [
              "联系当地医疗服务，说明运动后出现的异常情况。",
              "难以行走时请人协助；胸痛、呼吸困难或快晕倒时拨打 120。",
            ],
        tip: "下面的记录用于描述情况，不用先完成才能求助。",
      },
      {
        title: "等待时，让身体有支撑",
        intro: "选择舒服、稳妥的位置。",
        actions: [
          "停止运动，让身边的人知道你的情况。",
          "避免通过按摩或强拉伸试探原因，遵循医护人员的实时指导。",
        ],
        tip: "症状加重时及时告知医疗人员或急救接线员。",
      },
      {
        title: "整理给专业人员的信息",
        intro: "这份记录可帮助你把经过说清楚。",
        actions: [
          "说明做了什么运动、什么时候出现、具体位置和最明显的感觉。",
          "补充是否有肿胀、无力、麻木、尿色改变，以及正在使用的药物。",
        ],
        tip: "可直接展示这份记录。保存计划不代表已经获得评估或完成处理。",
      },
    ],
  };
}
