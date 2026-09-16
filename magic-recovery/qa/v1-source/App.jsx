import { useState, useEffect, useRef } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  HandPalm,
  Play,
  Pause,
  Fingerprint,
  Trash,
  Pulse,
  ShieldCheck,
  X,
  Info,
  BookOpen,
  ClockCounterClockwise,
  PersonSimpleRun,
  PersonSimpleBike,
  Barbell,
  Mountains,
  Download,
  WarningCircle,
  CheckCircle,
  ArrowCounterClockwise,
} from "@phosphor-icons/react";
import LegScene from "./LegScene";
import { muscles, symptoms, redFlags, assess, sources } from "./data";
import "./styles.css";
const steps = ["定位不适", "轻触感知", "记录感受", "舒缓跟练"];
const sports = [
  ["跑步", PersonSimpleRun],
  ["骑行", PersonSimpleBike],
  ["力量", Barbell],
  ["徒步", Mountains],
];
function loadHistory() {
  try {
    const h = JSON.parse(localStorage.getItem("magic-recovery-v1") || "[]");
    return Array.isArray(h)
      ? h
          .filter(
            (x) =>
              x &&
              typeof x.id === "string" &&
              typeof x.region === "string" &&
              (x.pain === null || typeof x.pain === "number"),
          )
          .slice(0, 100)
      : [];
  } catch {
    return [];
  }
}
function Modal({ title, onClose, children }) {
  const ref = useRef();
  useEffect(() => {
    const old = document.activeElement;
    ref.current.showModal();
    return () => old?.focus?.();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal-heading">
        <h2>{title}</h2>
        <button className="icon-button" aria-label="关闭弹窗" onClick={onClose}>
          <X size={22} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function App() {
  const [selected, setSelected] = useState("quads"),
    [side, setSide] = useState("right"),
    [view, setView] = useState("front"),
    [xray, setXray] = useState(false),
    [sport, setSport] = useState("跑步");
  const [step, setStep] = useState(0),
    [flags, setFlags] = useState([]),
    [safeNone, setSafeNone] = useState(false),
    [pain, setPain] = useState(3),
    [symptom, setSymptom] = useState(""),
    [onset, setOnset] = useState("");
  const [playing, setPlaying] = useState(false),
    [seconds, setSeconds] = useState(60),
    [after, setAfter] = useState(2),
    [history, setHistory] = useState(loadHistory),
    [modal, setModal] = useState(null),
    [toast, setToast] = useState(""),
    [saved, setSaved] = useState(false);
  useEffect(() => {
    if (modal) setPlaying(false);
  }, [modal]);
  useEffect(() => {
    const pause = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener("visibilitychange", pause);
    return () => document.removeEventListener("visibilitychange", pause);
  }, []);
  useEffect(() => {
    if (step > 0 && window.matchMedia("(max-width: 600px)").matches) {
      const id = requestAnimationFrame(() =>
        window.scrollTo({
          top:
            document.querySelector(".guide").getBoundingClientRect().top +
            window.scrollY -
            290,
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "instant"
            : "smooth",
        }),
      );
      return () => cancelAnimationFrame(id);
    }
  }, [step]);
  const muscle = muscles.find((m) => m.id === selected),
    result = assess({ flags, pain, symptom, onset }),
    flowIndex =
      (step === 4 && flags.length && !symptom) || step <= 1
        ? 0
        : step === 2
          ? 1
          : step <= 4
            ? 2
            : 3;
  useEffect(() => {
    if (!playing || step !== 5) return;
    const t = setInterval(
      () =>
        setSeconds((s) => {
          if (s <= 1) {
            setPlaying(false);
            return 0;
          }
          return s - 1;
        }),
      1000,
    );
    return () => clearInterval(t);
  }, [playing, step]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(t);
  }, [toast]);
  const reset = () => {
    setStep(0);
    setPlaying(false);
    setSeconds(60);
    setFlags([]);
    setSafeNone(false);
    setSymptom("");
    setOnset("");
    setPain(3);
    setSaved(false);
  };
  const choose = (id, newSide) => {
    if (step > 0) {
      setToast("已更换部位，请重新完成本次自查。");
      reset();
    }
    setSelected(id);
    if (newSide) setSide(newSide);
    setView(muscles.find((m) => m.id === id).view);
  };
  const save = (completed = false) => {
    if (saved) return;
    const item = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      region: muscle.name,
      anatomy: muscle.anatomy,
      side,
      sport,
      pain: symptom ? pain : null,
      symptom,
      onset,
      flags: [...flags],
      result: result.title,
      after: completed ? after : null,
      seconds: completed ? 60 - seconds : 0,
    };
    const next = [item, ...history].slice(0, 100);
    setHistory(next);
    try {
      localStorage.setItem("magic-recovery-v1", JSON.stringify(next));
      setToast("记录已保存在这台设备上。");
    } catch {
      setToast("浏览器无法保存；本次记录暂留在当前页面。");
    }
    setSaved(true);
  };
  const enter = () => {
    document
      .getElementById("studio")
      .scrollIntoView({ behavior: "smooth", block: "start" });
    if (step === 0) setStep(1);
  };
  const exportHistory = () => {
    const b = new Blob([JSON.stringify(history, null, 2)], {
        type: "application/json",
      }),
      u = URL.createObjectURL(b),
      a = document.createElement("a");
    a.href = u;
    a.download = "magic-recovery-history.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 500);
  };
  return (
    <>
      <header>
        <a className="brand" href="#" aria-label="Magic Recovery 首页">
          <Fingerprint size={30} weight="bold" />
          <span>
            magic<span className="brand-period">.</span>
          </span>
          <span className="brand-sub">RECOVERY</span>
        </a>
        <nav aria-label="主导航">
          <button
            className="nav-active"
            onClick={() =>
              document
                .getElementById("studio")
                .scrollIntoView({ behavior: "smooth" })
            }
          >
            身体探索
          </button>
          <button onClick={() => setModal("library")}>舒缓动作</button>
          <button onClick={() => setModal("history")}>
            我的记录
            {history.length > 0 && (
              <span className="count">{history.length}</span>
            )}
          </button>
        </nav>
        <button className="header-info" onClick={() => setModal("about")}>
          <span className="live-dot" /> 为下一次热爱做好准备{" "}
          <ArrowUpRight size={15} />
        </button>
      </header>
      <main>
        <section className="hero">
          <div>
            <div className="eyebrow">
              <span /> YOUR BODY. YOUR PACE.
            </div>
            <h1>
              尽兴运动。
              <br />
              <span>也懂得好好恢复。</span>
            </h1>
          </div>
          <div className="hero-aside">
            <p>
              听懂身体的小信号。
              <br />
              从一处不适，找到适合自己的舒缓节奏。
            </p>
            <div className="hero-meta">
              <span>
                <Clock size={15} /> 约 3 分钟自查
              </span>
              <span>
                <ShieldCheck size={15} /> 轻触，不硬扛
              </span>
            </div>
          </div>
        </section>
        <section
          className={`workspace ${step > 0 ? "in-progress" : ""}`}
          id="studio"
        >
          <div className="workspace-heading">
            <div>
              <span className="eyebrow">BODY EXPLORER</span>
              <h2>今天，哪里需要多一点关照？</h2>
            </div>
            <div className="sport-tabs" aria-label="运动类型">
              {sports.map(([name, Icon]) => (
                <button
                  key={name}
                  aria-pressed={sport === name}
                  className={sport === name ? "active" : ""}
                  onClick={() => setSport(name)}
                >
                  <Icon size={17} />
                  {name}
                </button>
              ))}
            </div>
          </div>
          <div className="studio">
            <aside className="regions">
              <div className="region-label">
                选择不适区域 <span>05</span>
              </div>
              <div className="side-toggle" aria-label="选择左右腿">
                {[
                  ["right", "右腿"],
                  ["left", "左腿"],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    aria-pressed={side === id}
                    className={side === id ? "active" : ""}
                    onClick={() => choose(selected, id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="region-list">
                {muscles.map((m, i) => (
                  <button
                    key={m.id}
                    onClick={() => choose(m.id)}
                    className={
                      "region " + (selected === m.id ? "selected" : "")
                    }
                    aria-pressed={selected === m.id}
                  >
                    <span className="region-index">0{i + 1}</span>
                    <span>
                      <strong>{m.name}</strong>
                      <small>{m.anatomy}</small>
                    </span>
                    <ArrowUpRight size={16} />
                  </button>
                ))}
              </div>
              <div className="layer-control">
                <span>
                  <Pulse size={16} /> 深层观察
                </span>
                <button
                  className={"switch " + (xray ? "on" : "")}
                  role="switch"
                  aria-checked={xray}
                  aria-label="深层观察"
                  onClick={() => setXray(!xray)}
                >
                  <span />
                </button>
              </div>
              <p className="region-hint">
                不用记住肌肉名称。
                <br />
                跟着身体的感受选就好。
              </p>
            </aside>
            <div className="model-panel">
              <div className="model-topline">
                <span>
                  <span className="live-dot" /> LIVE 3D
                </span>
                <span>LOWER BODY / 01</span>
              </div>
              <div className="model-watermark">
                MOVE
                <br />
                BETTER.
              </div>
              <LegScene
                selected={selected}
                side={side}
                onSelect={choose}
                view={view}
                setView={setView}
                mode={
                  step === 2 ? "touch" : step === 5 ? "recovery" : "explore"
                }
                playing={playing}
                xray={xray}
              />
              <div className="model-bottomline">
                <span>真实解剖结构 · 示意定位</span>
                <button
                  onClick={() => setModal("about")}
                  aria-label="查看三维模型说明"
                >
                  <Info size={15} />
                </button>
              </div>
            </div>
            <aside className="guide">
              <div className="guide-progress">
                {steps.map((s, i) => (
                  <div
                    key={s}
                    className={
                      i === flowIndex ? "current" : i < flowIndex ? "done" : ""
                    }
                  >
                    <span>
                      {i < flowIndex ? (
                        <Check size={11} />
                      ) : (
                        String(i + 1).padStart(2, "0")
                      )}
                    </span>
                    <small>{s}</small>
                  </div>
                ))}
              </div>
              <div className="guide-content" key={step}>
                {step === 0 && (
                  <>
                    <div className="section-kicker">01 / 认识这片肌肉</div>
                    <h2>{muscle.name}</h2>
                    <p className="anatomy-en">{muscle.en}</p>
                    <p className="intro-copy">
                      每一次出发，它都在出力。
                      <br />
                      现在，花一点时间听听它的感受。
                    </p>
                    <div className="guide-card">
                      <HandPalm size={26} className="accent" />
                      <div>
                        <strong>用手感知，让 3D 带路</strong>
                        <p>找到位置，轻轻触摸，再记录酸胀、紧绷或其他感受。</p>
                      </div>
                    </div>
                    <div className="mini-label">常见运动场景</div>
                    <p className="sports-caption">{muscle.tag}</p>
                    <button className="primary" onClick={() => setStep(1)}>
                      开始这一区域自查 <ArrowRight size={19} />
                    </button>
                    <div className="gentle-note">
                      <ShieldCheck size={16} /> 不追求“按开”，只了解身体。
                    </div>
                  </>
                )}
                {step === 1 && (
                  <>
                    <div className="section-kicker">开始前 / 10 秒确认</div>
                    <h2>先确认，适合轻触。</h2>
                    <p className="muted">现在有以下任何情况吗？</p>
                    <div className="safety-list">
                      {redFlags.map((f) => (
                        <label key={f.id}>
                          <input
                            type="checkbox"
                            checked={flags.includes(f.id)}
                            onChange={() => {
                              setSafeNone(false);
                              setFlags(
                                flags.includes(f.id)
                                  ? flags.filter((x) => x !== f.id)
                                  : [...flags, f.id],
                              );
                            }}
                          />
                          <span>{f.label}</span>
                        </label>
                      ))}
                      <label className="none-choice">
                        <input
                          type="checkbox"
                          checked={safeNone}
                          onChange={() => {
                            setSafeNone(!safeNone);
                            setFlags([]);
                          }}
                        />
                        <span>以上情况都没有</span>
                      </label>
                    </div>
                    <button
                      className="primary"
                      disabled={!safeNone && !flags.length}
                      onClick={() => setStep(flags.length ? 4 : 2)}
                    >
                      {flags.length ? "查看下一步建议" : "开始轻触指引"}
                      <ArrowRight size={19} />
                    </button>
                    <button className="text-button" onClick={() => setStep(0)}>
                      返回部位选择
                    </button>
                  </>
                )}
                {step === 2 && (
                  <>
                    <div className="section-kicker">
                      02 / 跟着光点，轻轻感知
                    </div>
                    <h2>
                      轻一点，
                      <br />
                      感受会更清楚。
                    </h2>
                    <div className="touch-chip">
                      <HandPalm size={17} /> 指腹轻触 · 约 10 秒
                    </div>
                    <p className="instruction">{muscle.touch}</p>
                    <div className="tip">
                      <Info size={18} />
                      <p>{muscle.avoid}</p>
                    </div>
                    <p className="tiny">
                      橙色光点提示大致区域，不代表痛点或按压力度。不要为了寻找疼痛而反复按压。
                    </p>
                    <button className="primary" onClick={() => setStep(3)}>
                      我已了解，记录感受 <ArrowRight size={19} />
                    </button>
                    <button
                      className="text-button"
                      onClick={() => {
                        setFlags(["weight"]);
                        setStep(4);
                      }}
                    >
                      触摸时出现明显疼痛或麻木
                    </button>
                  </>
                )}
                {step === 3 && (
                  <>
                    <div className="section-kicker">
                      03 / 只有你最了解的感受
                    </div>
                    <h2>它在告诉你什么？</h2>
                    <label className="field-label">最明显的感觉</label>
                    <div className="chip-grid">
                      {symptoms.map((s) => (
                        <button
                          key={s}
                          aria-pressed={symptom === s}
                          className={symptom === s ? "active" : ""}
                          onClick={() => setSymptom(s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    <div className="pain-heading">
                      <label htmlFor="pain">不适强度</label>
                      <span>
                        <b>{pain}</b> / 10
                      </span>
                    </div>
                    <input
                      id="pain"
                      className="range"
                      type="range"
                      min="0"
                      max="10"
                      value={pain}
                      onChange={(e) => setPain(+e.target.value)}
                    />
                    <div className="range-labels">
                      <span>没有不适</span>
                      <span>难以忍受</span>
                    </div>
                    <label className="field-label" htmlFor="onset">
                      什么时候开始的？
                    </label>
                    <select
                      id="onset"
                      value={onset}
                      onChange={(e) => setOnset(e.target.value)}
                    >
                      <option value="" disabled>
                        选择出现时间
                      </option>
                      {[
                        "运动时突然出现",
                        "运动后逐渐出现",
                        "第二天开始明显",
                        "持续数天或反复出现",
                      ].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                    <button
                      className="primary"
                      disabled={!symptom || !onset}
                      onClick={() => setStep(4)}
                    >
                      看看下一步 <ArrowRight size={19} />
                    </button>
                    <button className="text-button" onClick={() => setStep(2)}>
                      重新看触摸指引
                    </button>
                  </>
                )}
                {step === 4 && (
                  <>
                    <div
                      className={
                        "result-icon " + (!result.allow ? "warning" : "")
                      }
                    >
                      {result.allow ? (
                        <CheckCircle size={32} />
                      ) : (
                        <WarningCircle size={32} />
                      )}
                    </div>
                    <div className="section-kicker">你的下一步</div>
                    <h2>{result.title}</h2>
                    <p className="instruction">{result.body}</p>
                    {result.allow && (
                      <>
                        <div className="summary">
                          <span>
                            {side === "right" ? "右" : "左"} · {muscle.name}
                          </span>
                          <strong>
                            {symptom} {pain}/10
                          </strong>
                        </div>
                        <div className="guide-card">
                          <Play size={25} className="accent" />
                          <div>
                            <strong>60 秒轻柔活动</strong>
                            <p>{muscle.move}。让身体慢慢回到舒适节奏。</p>
                          </div>
                        </div>
                        {onset === "持续数天或反复出现" && (
                          <div className="tip">
                            <Info size={20} />
                            <p>
                              若持续不改善、反复出现或影响日常活动，预约医生或物理治疗师。
                            </p>
                          </div>
                        )}
                        <button
                          className="primary"
                          onClick={() => {
                            setStep(5);
                            setSeconds(60);
                            setPlaying(false);
                            setSaved(false);
                          }}
                        >
                          进入 3D 跟练 <Play size={17} weight="fill" />
                        </button>
                      </>
                    )}
                    {!result.allow && (
                      <div className="tip">
                        <ShieldCheck size={22} />
                        <p>
                          本次不提供按摩或跟练。手触无法排除损伤或其他原因。
                        </p>
                      </div>
                    )}
                    <button
                      className={result.allow ? "text-button" : "primary"}
                      disabled={saved}
                      onClick={() => save(false)}
                    >
                      {saved ? "记录已保存" : "保存这次自查记录"}
                      {!result.allow && <Check size={18} />}
                    </button>
                    <button className="text-button" onClick={reset}>
                      重新自查
                    </button>
                  </>
                )}
                {step === 5 && (
                  <>
                    <div className="section-kicker">04 / 跟上自己的节奏</div>
                    <h2>{muscle.move}</h2>
                    <p className="instruction">{muscle.cue}</p>
                    <div className="timer">
                      <span>
                        {String(Math.floor(seconds / 60)).padStart(2, "0")}
                        <i>:</i>
                        {String(seconds % 60).padStart(2, "0")}
                      </span>
                      <small>
                        {seconds === 0
                          ? "本段活动已结束"
                          : playing
                            ? "轻柔活动中 · 自然呼吸"
                            : "准备好后，点击播放"}
                      </small>
                    </div>
                    <div className="timer-track">
                      <span
                        style={{ width: `${((60 - seconds) / 60) * 100}%` }}
                      />
                    </div>
                    <p className="tiny">
                      动画为关节活动示意。以文字中的支撑姿势和个人舒适范围为准，不追求模型的幅度。
                    </p>
                    <div className="play-controls">
                      <button
                        className="primary"
                        disabled={!seconds}
                        onClick={() => setPlaying(!playing)}
                      >
                        {playing ? (
                          <Pause weight="fill" />
                        ) : (
                          <Play weight="fill" />
                        )}
                        {playing ? "暂停跟练" : "开始跟练"}
                      </button>
                      <button
                        className="icon-button"
                        aria-label="重置计时"
                        onClick={() => {
                          setSeconds(60);
                          setPlaying(false);
                        }}
                      >
                        <ArrowCounterClockwise size={21} />
                      </button>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => {
                        setPlaying(false);
                        setAfter(pain);
                        setStep(6);
                      }}
                    >
                      {seconds === 0 ? "完成，记录现在的感受" : "结束本次练习"}
                    </button>
                    <button
                      className="stop-button"
                      onClick={() => {
                        setPlaying(false);
                        setSymptom("刺痛");
                        setStep(4);
                      }}
                    >
                      不适增加，立即停止
                    </button>
                  </>
                )}
                {step === 6 && (
                  <>
                    <div className="result-icon">
                      <CheckCircle size={34} />
                    </div>
                    <div className="section-kicker">留下一次身体笔记</div>
                    <h2>此刻，感觉怎么样？</h2>
                    <p className="muted">
                      不需要立刻变好。诚实记录，
                      <br />
                      就是下一次调整训练的起点。
                    </p>
                    <div className="pain-heading">
                      <label htmlFor="after">现在的不适强度</label>
                      <span>
                        <b>{after}</b> / 10
                      </span>
                    </div>
                    <input
                      id="after"
                      className="range"
                      type="range"
                      min="0"
                      max="10"
                      value={after}
                      onChange={(e) => setAfter(+e.target.value)}
                    />
                    <div className="range-labels">
                      <span>没有不适</span>
                      <span>难以忍受</span>
                    </div>
                    {after > pain && (
                      <div className="tip">
                        <WarningCircle size={20} />
                        <p>
                          不适有所增加，请暂停本次活动。持续或加重时寻求专业评估。
                        </p>
                      </div>
                    )}
                    <div className="summary">
                      <span>本次实际跟练</span>
                      <strong>{60 - seconds} 秒</strong>
                    </div>
                    <button
                      className="primary"
                      disabled={saved}
                      onClick={() => save(true)}
                    >
                      {saved ? "已保存到我的记录" : "保存身体笔记"}{" "}
                      <Check size={19} />
                    </button>
                    <button className="text-button" onClick={reset}>
                      关照另一个部位 <ArrowRight size={15} />
                    </button>
                  </>
                )}
              </div>
              <div className="guide-footer">
                <ShieldCheck size={14} /> 帮助理解感受，不提供医学诊断
              </div>
            </aside>
          </div>
        </section>
        <section className="principles">
          <div className="principle">
            <span className="principle-number">01</span>
            <div>
              <h3>感知，比硬扛重要。</h3>
              <p>轻触对比，留意身体给你的信号。</p>
            </div>
            <HandPalm size={30} />
          </div>
          <div className="principle">
            <span className="principle-number">02</span>
            <div>
              <h3>少一点用力，多一点耐心。</h3>
              <p>跟着 3D 示意，在舒适范围内活动。</p>
            </div>
            <Pulse size={30} />
          </div>
          <button className="principle" onClick={() => setModal("history")}>
            <span className="principle-number">03</span>
            <div>
              <h3>恢复，也值得被记录。</h3>
              <p>把今天的感受，留给下一次训练参考。</p>
            </div>
            <ArrowUpRight size={28} />
          </button>
        </section>
        <section className="closing">
          <div>
            <div className="eyebrow">RECOVERY IS PART OF THE GAME.</div>
            <h2>
              下一次尽兴，<span>从这一次关照开始。</span>
            </h2>
          </div>
          <button onClick={enter}>
            听听身体的声音 <ArrowUpRight size={21} />
          </button>
        </section>
      </main>
      <footer>
        <a className="footer-brand" href="#">
          magic. <span>让热爱，保持状态。</span>
        </a>
        <div>
          <button onClick={() => setModal("about")}>使用说明与内容来源</button>
          <span>BODY DATA BY HUMAN ATLAS / BODYPARTS3D</span>
        </div>
      </footer>
      {modal === "history" && (
        <Modal title="我的身体笔记" onClose={() => setModal(null)}>
          <p className="muted">仅保存在这台设备的浏览器内，最多保留 100 条。</p>
          {!history.length ? (
            <div className="empty">
              <ClockCounterClockwise size={44} />
              <h3>第一条记录，从今天开始。</h3>
              <p>完成一次自查，就能在这里回看自己的感受。</p>
              <button
                className="primary"
                onClick={() => {
                  setModal(null);
                  enter();
                }}
              >
                开始一次自查 <ArrowRight />
              </button>
            </div>
          ) : (
            <>
              <div className="history-list">
                {history.map((h) => (
                  <article key={h.id}>
                    <div>
                      <time>
                        {new Date(h.date).toLocaleString("zh-CN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                      <span>{h.sport}</span>
                    </div>
                    <h3>
                      {h.side === "right" ? "右腿" : "左腿"} · {h.region}
                    </h3>
                    <p>
                      {h.symptom || "安全确认"} · 自查{" "}
                      {h.pain === null ? "未评分" : `${h.pain}/10`}
                      {h.after !== null && ` → 活动后 ${h.after}/10`}
                    </p>
                    <small>
                      {h.result}
                      {h.seconds > 0 && ` · 轻柔活动 ${h.seconds} 秒`}
                    </small>
                    <button
                      className="delete-record"
                      aria-label="删除这条记录"
                      onClick={() => {
                        const next = history.filter((x) => x.id !== h.id);
                        try {
                          localStorage.setItem(
                            "magic-recovery-v1",
                            JSON.stringify(next),
                          );
                          setHistory(next);
                          setToast("这条记录已删除。");
                        } catch {
                          setToast("无法删除本地记录，请检查浏览器存储设置。");
                        }
                      }}
                    >
                      <Trash size={14} />
                      删除
                    </button>
                  </article>
                ))}
              </div>
              <button className="secondary" onClick={exportHistory}>
                <Download size={18} /> 导出我的记录
              </button>
            </>
          )}
        </Modal>
      )}
      {modal === "library" && (
        <Modal title="从轻柔活动开始" onClose={() => setModal(null)}>
          <p className="muted">
            选择区域，完成安全确认后进入 3D 跟练。
            <br />
            每次只在舒适范围内活动。
          </p>
          <div className="library-list">
            {muscles.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  reset();
                  setSelected(m.id);
                  setView(m.view);
                  setModal(null);
                  setStep(1);
                  document
                    .getElementById("studio")
                    .scrollIntoView({ behavior: "smooth" });
                }}
              >
                <div className="library-icon">
                  <Play size={22} />
                </div>
                <span>
                  <strong>{m.move}</strong>
                  <small>{m.name} · 无器械 · 60 秒</small>
                </span>
                <ArrowUpRight size={20} />
              </button>
            ))}
          </div>
        </Modal>
      )}
      {modal === "about" && (
        <Modal title="了解 Magic Recovery" onClose={() => setModal(null)}>
          <div className="about">
            <h3>给经常运动的你，一份身体使用笔记。</h3>
            <p>
              通过 3D
              定位、轻触指引和主观记录，帮助你了解腿部的不适感。本工具不能诊断拉伤、筋膜问题或排除血栓等疾病，也不替代专业检查。
            </p>
            <h3>什么时候停下来？</h3>
            <p>
              突然或严重疼痛、不能负重、明显红肿热、麻木或无力时，不继续按压和跟练。胸痛或呼吸困难时立即寻求急救。若不适持续、加重或反复影响训练，请咨询医生或物理治疗师。
            </p>
            <h3>3D 模型与动作</h3>
            <p>
              模型来自 Human Atlas 使用的 BodyParts3D
              成年男性参考解剖数据，不代表每个人的体型。橙色区域表示所选肌群，不表示已检测到损伤。深层结构只能用于理解位置，不应用手寻找或深压。动画为近似关节运动，不是生物力学模拟。
            </p>
            <a
              href="https://github.com/ashemag/human-atlas"
              target="_blank"
              rel="noreferrer"
            >
              Human Atlas 开源项目 <ArrowUpRight />
            </a>
            <a href="/ATTRIBUTION.md" target="_blank" rel="noreferrer">
              BodyParts3D · CC BY 4.0 完整署名 <ArrowUpRight />
            </a>
            <h3>内容参考</h3>
            {sources.map(([label, url]) => (
              <a key={url} href={url} target="_blank" rel="noreferrer">
                {label}
                <ArrowUpRight />
              </a>
            ))}
            <p className="tiny">
              中文文案为面向运动后自我观察的教育性改写。分流规则是产品提示规则，未经临床验证；正式面向公众发布前需要专业内容审阅。
            </p>
          </div>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle size={20} />
          {toast}
        </div>
      )}
    </>
  );
}
