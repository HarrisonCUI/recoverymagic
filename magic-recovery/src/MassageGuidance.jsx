import ReferenceNotes from "./ReferenceNotes";
import { MASSAGES, TECHNIQUES, techniqueFor, MASSAGE_LIMIT, MASSAGE_SOURCES, massageSource } from "./massage";

import { PRACTICE_COUNT, PRACTICE_PLAN, PRACTICE_LIMIT, repetitionUnit } from "./practice";

// A schematic palm-side contact key, separate from the unrigged Atlas hand.
export function ContactKey({ area }) {
  return (
    <svg className="contact-key" viewBox="0 0 84 96" role="img" aria-label={`掌面示意：橙色标出${area === "thumb" ? "拇指指腹" : area === "pads" ? "三指指腹" : "掌面与手指的宽接触面"}`}>
      <path d="M27 86 L24 69 L9 49 Q4 40 11 38 Q15 37 19 43 L26 51 L26 21 Q26 11 32 11 Q38 11 38 21 L38 43 L39 12 Q39 3 45 3 Q51 3 51 12 L51 43 L53 20 Q53 12 59 13 Q65 13 64 22 L63 47 L66 36 Q68 28 73 30 Q78 32 76 40 L73 66 Q72 79 65 87 Z" fill="#495458" stroke="#a7b3b6" strokeWidth="1.6" strokeLinejoin="round" />
      {["palm", "grip", "cup"].includes(area) && <path d="M29 46 L62 46 L62 69 Q44 83 30 68 Z" fill="#ff9c60" opacity=".85" />}
      {["thumb", "grip"].includes(area) && <ellipse cx="16" cy="47" rx="4" ry="7" transform="rotate(-35 16 47)" fill="#ff9c60" />}
      <g fill={area === "thumb" ? "#66767b" : "#ff9c60"}>
        <rect x="29" y="17" width="6" height="11" rx="3" />
        <rect x="42" y="9" width="6" height="12" rx="3" />
        <rect x="56" y="19" width="5" height="11" rx="2.5" />
      </g>
      {["palm", "grip", "cup"].includes(area) && <rect x="68" y="35" width="5" height="9" rx="2.5" fill="#ff9c60" />}
      <text x="44" y="72" fill="#f5e7dc" fontSize="10" textAnchor="middle">掌面</text>
    </svg>
  );
}
export default function MassageGuidance({ selected = "calves", technique, previewOnly = false, compact = false }) {
  const current = techniqueFor(selected, technique);
  return (
    <div className={"massage-guidance" + (compact ? " compact-guidance" : "")}>
      <div className="massage-contact"><ContactKey area={current.area} /><div><span className="guidance-label">用哪里 · 橙色接触面</span><strong>{current.contact}</strong><p>3D 青色点是接触范围，不是固定穴位。用肉垫轻贴。</p></div></div>
      <div className="massage-pressure"><span className="guidance-label">多大力 · 舒适为限</span><strong>{current.pressure}</strong><p>不增加疼痛，不用体重压，不追求酸痛感。</p></div>
      {previewOnly ? <p className="lesson-view-only">仅观看教程，不计入实际跟练。</p> : compact ? <p className="compact-repetitions"><strong>先试 1–3 次</strong><span>{current.unit}</span></p> : <TrialRepetitions method="massage" unit={current.unit} />}
    </div>
  );
}
export function TrialRepetitions({ method = "massage", unit }) {
  return <div className="trial-repetitions">
    <div><span className="guidance-label">次数 · 入门试做</span><strong>{PRACTICE_COUNT}</strong></div>
    <p>{PRACTICE_PLAN}</p>
    <small>{unit || repetitionUnit(method)}</small>
  </div>;
}
export function TechniquePicker({ selected, value, onChange }) {
  return <div className="technique-picker" aria-label="选择按摩手法">
    {MASSAGES[selected].techniques.map((id) => <button key={id} aria-pressed={value === id} onClick={() => onChange(id)}>{TECHNIQUES[id].name}</button>)}
  </div>;
}
export function MassageDetails({ selected = "calves", technique, previewOnly = false }) {
  const current = techniqueFor(selected, technique), region = MASSAGES[selected];
  return <>
    <p>{current.name}：{current.cue}</p>
    <p>{current.contact}。{current.pressure}。若需要忍痛、身体绷紧或皮肤被夹住，应松手；锐痛、麻木或无力时停止。</p>
    {!previewOnly && <p>{PRACTICE_LIMIT}</p>}
    <p>{previewOnly ? "这是一般手法知识，不代表适合你当前的不适。" : "指南没有给每种手法规定统一次数或公斤数。本页的 1–3 次用于先学会动作、观察是否舒服，不替代个体化处方。"}</p>
    <p>{MASSAGE_LIMIT}</p><p>模型坐标用于说明肌腹的大致接触范围，不是经过临床验证的按压点。内侧大腿、小腿前外侧及三指轻抚属于指南的轻柔改编；教程时长不是治疗剂量。</p>
    {["outerthigh", "outercalf"].includes(selected) && <p>外侧入口依据指南的宽面轻柔手法做区域适配，不是针对髂胫束、神经或肌腱的治疗动作。只在所示软组织中段轻触，骨突和关节周围不按。</p>}
    {selected === "calves" && <p>原始小腿教程包含寻找压痛点并持续按压；本页按扩展指南的边界改为短暂、轻柔的肌腹按压，不引导寻找或“按开”痛点。</p>}
    {selected === "hamstrings" && technique === "pin" && <p>原始托腿动作含手臂加压，本页只演示轻贴支撑与小幅屈伸；出现牵拉痛、麻痛就松手放下腿。</p>}
    <p>新伤、单侧肿热变色、皮肤破损、异常疼痛的凸起静脉处不按揉。易出血或使用抗凝/抗血小板药物时，先咨询开药医生。按摩后和次日更痛或活动更差，应停止这一处手法并寻求评估。</p>
    <ReferenceNotes entries={[...(massageSource(selected, technique) ? [massageSource(selected, technique)] : []), ...MASSAGE_SOURCES]} />
  </>;
}
