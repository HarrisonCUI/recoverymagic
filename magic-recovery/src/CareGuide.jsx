import ReferenceNotes from "./ReferenceNotes";
import { Info, WarningCircle } from "@phosphor-icons/react";
import { redFlags } from "./data";
export default function CareGuide({ plan, step, draft, region, patch }) {
  const current = plan.steps[step];
  const comfort = ["protect", "settle"].includes(plan.id);
  return (
    <section className="screen-body care-guide">
      <div className="eyebrow">YOUR CARE PLAN · 0{step + 1} / 03</div>
      <div className="micro-progress">
        {[0, 1, 2].map((i) => (
          <span key={i} className={i <= step ? "active" : ""} />
        ))}
      </div>
      <h1>{current.title}</h1>
      <p className="subtitle">{current.intro}</p>
      {!comfort && (
        <div className="care-priority">
          <WarningCircle size={19} />
          <p>{plan.priority}</p>
        </div>
      )}
      <ol className="lesson-steps">
        {current.actions.map((text, i) => (
          <li key={text}>
            <b>{i + 1}</b>
            <p>{text}</p>
          </li>
        ))}
      </ol>
      <div className="comfort-card">
        <strong>小提示</strong>
        <p>{current.tip}</p>
      </div>
      {step === 0 && (
        <details className="lesson-details">
          <summary>为什么给出这份指引？</summary>
          <p>{plan.reason}</p>
        </details>
      )}
      {step === 2 && (
        <>
          {comfort && (
            <div className="care-priority">
              <Info size={19} />
              <p>{plan.priority}</p>
            </div>
          )}
          <div className="care-context">
            <strong>你的描述</strong>
            <p>
              {draft.side === "left" ? "左腿" : "右腿"} · {region.name} ·{" "}
              {draft.sport}
            </p>
            <p>
              {[
                draft.onset,
                draft.symptom && `${draft.symptom} ${draft.pain}/10`,
                ...draft.flags.map(
                  (id) => redFlags.find((f) => f.id === id)?.label,
                ),
              ]
                .filter(Boolean)
                .join("；")}
            </p>
          </div>
          <label className="field-label" htmlFor="care-note">
            补充记录 <small>选填</small>
          </label>
          <textarea
            id="care-note"
            className="care-note"
            maxLength={500}
            rows={3}
            placeholder="例如：冲刺时出现，休息后仍有紧绷……"
            value={draft.careNote || ""}
            onChange={(e) => patch({ careNote: e.target.value })}
          />
          <p className="tiny">
            保存后可在「记录」回看这份计划，或记录之后的变化。
          </p>
        </>
      )}
      <ReferenceNotes entries={[plan.source]} />
    </section>
  );
}
