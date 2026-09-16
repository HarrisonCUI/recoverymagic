import { MOTIONS } from "./motions.js";
export const muscles = [
  {
    id: "quads",
    name: "大腿前侧",
    anatomy: "股四头肌",
    en: "QUADRICEPS",
    tag: "跑步 · 深蹲 · 骑行",
    match: /rectus femoris|vastus (?!lateralis)/i,
    view: "front",
    point: [-0.105, 0.66, 0.058],
    touch:
      "坐稳，让膝盖自然弯曲。用两三根手指的指腹，轻触大腿前侧中段，再与另一侧同一位置比较。",
    avoid: "避开膝盖骨、髌腱和腹股沟，不用指尖向深处顶压。",
    move: "扶稳，小幅屈膝",
    cue: "一手扶住稳固椅背，缓慢把脚跟向后抬起少许，再放下。只在舒适范围内活动，不拉扯脚踝。",
  },
  {
    id: "hamstrings",
    name: "大腿后侧",
    anatomy: "腘绳肌群",
    en: "HAMSTRINGS",
    tag: "冲刺 · 爬坡 · 硬拉",
    match: /biceps femoris|semitendinosus|semimembranosus/i,
    view: "back",
    point: [-0.075, 0.66, -0.085],
    touch:
      "坐在椅子边缘，让大腿后侧放松。用指腹轻触大腿后侧中段，感受是否有大片酸胀或局部敏感。",
    avoid: "不按膝后凹陷处，也不深压臀部与大腿交界。",
    move: "扶稳，小幅屈膝",
    cue: "扶住稳固椅背，缓慢屈膝再回到起始位置。幅度小一点，保持自然呼吸，出现牵扯痛就停下。",
  },
  {
    id: "adductors",
    name: "大腿内侧",
    anatomy: "内收肌群",
    en: "ADDUCTORS",
    tag: "球类 · 侧向移动",
    match: /adductor|gracilis|pectineus/i,
    view: "front",
    massageMatch: /adductor (longus|magnus)/i,
    point: [-0.045, 0.63, 0.025],
    touch:
      "坐稳并让双腿自然分开。隔着薄衣，用指腹轻触大腿内侧中段，不追求找到深处的“结节”。",
    avoid: "远离腹股沟与生殖区域；内侧上端不做深压。",
    move: "扶稳，小幅屈膝",
    cue: "扶稳椅背，保持双腿与髋同宽，小幅屈膝后放下脚。先恢复舒适的活动，不强行劈腿或向外拉伸。",
  },
  {
    id: "calves",
    name: "小腿后侧",
    anatomy: "腓肠肌 · 比目鱼肌",
    en: "CALF MUSCLES",
    tag: "跑步 · 跳跃 · 徒步",
    match: /gastrocnemius|soleus/i,
    view: "back",
    point: [-0.07, 0.34, -0.093],
    touch:
      "坐下并支撑小腿，让脚踝放松。用指腹轻触小腿后侧最饱满处，和另一侧比较。轻触即可，不反复揉捏。",
    avoid: "不挤压跟腱或膝后；单侧红、肿、热时停止触摸。",
    move: "慢慢勾脚，再放松",
    cue: "坐稳并支撑小腿，缓慢让脚尖向自己靠近，再自然放松。保持小幅度，不绷到疼痛，不憋气。",
  },
  {
    id: "shins",
    name: "小腿前侧",
    anatomy: "胫骨前肌区域",
    en: "ANTERIOR LOWER LEG",
    tag: "长距离跑 · 下坡",
    match: /tibialis anterior|extensor digitorum longus|extensor hallucis longus/i,
    view: "front",
    point: [-0.11, 0.29, 0.012],
    touch:
      "坐稳，用指腹轻触胫骨外侧的软组织，从小腿中段开始。只比较感受，不沿着骨头来回按压。",
    avoid: "骨面一点特别痛、负重疼痛或麻木时，停止自查并寻求评估。",
    move: "慢慢勾脚，再放松",
    cue: "坐稳并支撑小腿，在舒适范围内轻轻勾脚后放松。不用阻力带，不强行压脚背，疼痛增加就停止。",
  },
  {
    id: "outerthigh", name: "大腿外侧", anatomy: "股外侧肌 · 髂胫束区域", en: "LATERAL THIGH",
    tag: "跑步 · 骑行 · 下坡", match: /vastus lateralis|iliotibial tract/i,
    massageMatch: /vastus lateralis/i, view: "side", point: [-0.115, 0.66, 0.005],
    touch: "坐稳，让腿有支撑，用宽指腹轻触大腿前外侧中段的软组织，和另一侧比较。",
    avoid: "髂胫束是筋膜带，不按成肌肉结节；不沿外侧硬带深压，避开髋外侧骨突和膝外侧。",
  },
  {
    id: "outercalf", name: "小腿外侧", anatomy: "腓骨肌群区域", en: "LATERAL LOWER LEG",
    tag: "球类 · 越野 · 徒步", match: /fibularis|peroneus/i,
    view: "side", point: [-0.10, 0.30, -0.045],
    touch: "坐稳并托住小腿，用宽指腹轻触外侧中段的软组织，避免压在骨头上。",
    avoid: "避开膝外下方的腓骨头、外踝和骨面；出现麻电感立即松手。",
  },
].map((region) => ({ ...region, move: MOTIONS[region.id].name }));
export const symptoms = ["酸胀", "紧绷", "按压敏感", "刺痛", "麻木"];
export const redFlags = [
  { id: "breath", label: "胸痛、呼吸困难，或快要晕倒", level: "emergency" },
  {
    id: "urine",
    label: "运动后尿液呈茶色，或有异常严重肌痛、无力",
    level: "urgent",
  },
  { id: "swelling", label: "一侧腿突然明显肿胀、发红或发热", level: "urgent" },
  {
    id: "injury",
    label: "突然拉扯或听到响声，随后肿胀或淤青",
    level: "injury",
  },
  { id: "weight", label: "无法正常负重，或明显麻木、无力", level: "urgent" },
];
export function assess({
  flags = [],
  pain = 0,
  symptom = "",
  onset = "",
  stopped = false,
}) {
  if (flags.includes("breath"))
    return {
      kind: "emergency",
      title: "现在先寻求紧急帮助",
      body: "停止自查与运动。胸痛、呼吸困难或濒晕需要紧急处理，请拨打当地急救电话；中国大陆可拨 120。",
      allow: false,
    };
  if (flags.includes("urine"))
    return {
      kind: "urgent",
      title: "先处理这次异常不适",
      body: "运动后茶色尿液、异常严重肌痛或明显无力不能通过触摸判断原因。请停止运动和自行舒缓，现在前往急诊，不等待按摩后的变化。",
      allow: false,
    };
  if (flags.some((f) => ["swelling", "weight"].includes(f)))
    return {
      kind: "urgent",
      title: "先让专业人员看一看",
      body: "这些表现不适合继续按压或自行舒缓。请在今天联系医生检查原因；症状严重或迅速恶化时寻求急诊帮助。",
      allow: false,
    };
  if (pain >= 6 || ["刺痛", "麻木"].includes(symptom))
    return {
      kind: "urgent",
      title: "为明显不适，找到下一步",
      body: "较强疼痛、刺痛或麻木需要专业评估。先减少负荷，接下来可以查看等待期间的处理方式和如何描述情况；若无力或症状加重，请尽快联系医生。",
      allow: false,
    };
  if (flags.includes("injury") || onset === "运动时突然出现")
    return {
      kind: "injury",
      title: "突然不适，先这样处理",
      body: "先减少刺激这片区域的活动，找到舒适支撑。接下来会带你了解冷敷是否适用，以及怎样观察变化。突然不适的原因需要结合专业评估判断。",
      allow: false,
    };
  if (stopped)
    return {
      kind: "pause",
      title: "不适增加了，换个方式照顾它",
      body: "先停止本次动作，坐稳休息，不继续按摩或拉伸。若不适持续、加重或影响日常活动，请寻求专业评估；出现明显肿胀、无力或无法负重时，请尽快联系医生。",
      allow: false,
    };
  return {
    kind: "gentle",
    title: pain === 0 ? "从轻松活动开始" : "给这片区域一点恢复时间",
    body: "你记录的是运动后不适。可以先降低训练负荷，尝试舒适范围内的轻柔活动；这份记录不能确认或排除肌肉损伤。",
    allow: true,
  };
}
export const sources = [
  [
    "膝关节轻柔活动参考",
    "https://www.cuh.nhs.uk/patient-information/knee-exercises/",
  ],
  [
    "坐姿滑脚跟参考",
    "https://www.kch.nhs.uk/wp-content/uploads/2024/10/0421-Physiotherapy-after-knee-arthroscopy-v4_FINAL-1.pdf",
  ],
  [
    "脚踝画圈参考",
    "https://www.kingstonandrichmond.nhs.uk/patients-and-families/patient-leaflets/home-exercise-programme-falls-prevention",
  ],
  [
    "扶稳屈膝动作参考",
    "https://www.orthoinfo.org/recovery/knee-conditioning-program/",
  ],
  [
    "坐姿轻柔活动参考",
    "https://www.nhs.uk/live-well/exercise/sitting-exercises/",
  ],
  [
    "运动后轻柔伸展",
    "https://www.nhs.uk/live-well/exercise/how-to-stretch-after-exercising/",
  ],
  ["急性扭伤与拉伤", "https://www.nhs.uk/conditions/sprains-and-strains/"],
  [
    "单侧腿部肿痛的警示信号",
    "https://www.nhs.uk/conditions/deep-vein-thrombosis-dvt/",
  ],
  [
    "运动后横纹肌溶解警示",
    "https://www.cdc.gov/niosh/rhabdo/signs-symptoms/index.html",
  ],
];
