import ReferenceNotes, { ModelAttribution, EmergencyNumber } from "./ReferenceNotes";
import { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
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
  House,
  Footprints,
  CaretRight,
  Flag,
  Repeat,
} from "@phosphor-icons/react";
import LegScene from "./LegScene";
import RecoveryTutorial from "./RecoveryTutorial";
import RecoveryLibrary from "./RecoveryLibrary";
import GuidedRecovery from "./GuidedRecovery";
import NoteShare from "./NoteShare";
import CareRest from "./CareRest";
import { actionFor, actionsFor, recoveryRegions, guidedActionFor, configureGuidedRecovery, sessionDuration, durationLabel, relaxationPhase, tutorialHash } from "./recoveryCatalog";
import { appRoute, publicRoute, tutorialCareContext } from "./recoveryRoutes";
import MassageGuidance, { MassageDetails } from "./MassageGuidance";
import { MASSAGES, MASSAGE_NOTE, techniqueFor } from "./massage";
import {
  PREFERENCE_KEY,
  cleanPreferences,
  loadPreferences,
  rememberChoice,
  frequentRegions,
} from "./preferences";
import { muscles, symptoms, redFlags, assess, sources } from "./data";
import {
  FLOW,
  initialDraft,
  validateDraft,
  canEnter,
  nextScreen,
  previousScreen,
  makeRecord,
  upsertRecord,
} from "./flow";
import { tutorialFor } from "./tutorial";
import { carePlanFor } from "./care";
import "./styles.css";
const STORE = "magic-recovery-v1",
  DRAFT = "magic-recovery-draft-v2";
const sports = [
  ["跑步", PersonSimpleRun, "路跑、间歇或冲刺"],
  ["骑行", PersonSimpleBike, "公路、山地或室内"],
  ["力量", Barbell, "深蹲、硬拉或器械"],
  ["徒步", Mountains, "爬坡、下山或长距离"],
];
const labels = {
  activity: "运动背景",
  location: "找到位置",
  safety: "轻触小提示",
  touch: "轻触感知",
  feeling: "记录感受",
  result: "你的下一步",
  recovery: "舒缓跟练",
  care: "现在怎么做",
  feedback: "练后反馈",
  complete: "本次回顾",
  history: "身体笔记",
  library: "恢复动作",
  tutorial: "恢复教程",
  detail: "记录详情",
  about: "关于 Magic",
};
const stages = ["选部位", "说感受", "选动作"];
const stageOf = {
  activity: 0,
  location: 0,
  safety: 1,
  touch: 1,
  feeling: 1,
  result: 2,
  recovery: 2,
  care: 2,
  feedback: 2,
  complete: 2,
};

function readRecords() {
  try {
    const a = JSON.parse(localStorage.getItem(STORE) || "[]");
    return Array.isArray(a)
      ? a
          .filter(
            (x) =>
              x && typeof x.id === "string" && typeof x.region === "string",
          )
          .slice(0, 100)
      : [];
  } catch {
    return [];
  }
}
function readDraft() {
  try {
    return validateDraft(JSON.parse(sessionStorage.getItem(DRAFT) || "null"));
  } catch {
    return null;
  }
}
const dateLabel = (d) =>
  new Date(d).toLocaleString("zh-CN", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
function Sheet({ title, children, onClose }) {
  const ref = useRef();
  useEffect(() => {
    const previous = document.activeElement;
    ref.current.showModal();
    return () => previous?.focus?.();
  }, []);
  return (
    <dialog
      className="sheet"
      ref={ref}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="sheet-handle" />
      <div className="sheet-title">
        <h2>{title}</h2>
        <button aria-label="关闭弹层" onClick={onClose}>
          <X size={22} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function App() {
  const [page, setPage] = useState("home"),
    [draft, setDraft] = useState(readDraft),
    [records, setRecords] = useState(readRecords),
    [record, setRecord] = useState(null),
    [sheet, setSheet] = useState(null),
    [toast, setToast] = useState(""),
    [view, setView] = useState("front"),
    [playing, setPlaying] = useState(false),
    [animationKey, setAnimationKey] = useState(0),
    [xray, setXray] = useState(false);
  const [preferences, setPreferences] = useState(() =>
    loadPreferences(readRecords()),
  );
  const [lessonRegion, setLessonRegion] = useState("quads");
  const [libraryRegion, setLibraryRegion] = useState(null);
  const [lessonAction, setLessonAction] = useState(null);
  const [lessonDuration, setLessonDuration] = useState(60000);
  const recoveryDuration = sessionDuration(draft?.duration);
  const recoveryPhase = relaxationPhase(recoveryDuration, draft?.remaining ?? recoveryDuration);
  const recoveryAction = guidedActionFor(draft);
  const recoveryMethod = recoveryAction.method;
  const frequent = frequentRegions(preferences);
  const scrollRef = useRef(),
    stateRef = useRef();
  stateRef.current = { page, draft, record };
  const m = muscles.find((m) => m.id === (draft?.selected || "quads")),
    inFlow = FLOW.includes(page) && page !== "complete",
    result = draft ? assess(draft) : null;
  const tutorial = tutorialFor(m);
  const massageTechnique = recoveryAction.technique || MASSAGES[m.id].techniques[0];
  const care = draft ? carePlanFor(draft) : null;
  const lessonCare = page === "tutorial" ? tutorialCareContext(draft, lessonRegion) : null;
  const careStep = draft?.careStep ?? 0;
  const recoveryStep = draft?.recoveryStep ?? 0;
  const activeStage = stageOf[page] ?? 0;
  const recordAdvice = record
    ? assess({ ...record, pain: record.pain ?? 0 })
    : null;
  useEffect(() => {
    const route = appRoute(window.location.hash, draft);
    if (FLOW.includes(route.magicPage)) {
      setDraft(d => ({ ...d, screen: route.magicPage }));
      setView(muscles.find(m => m.id === draft.selected).view);
    }
    if (route.lessonRegion) setLessonRegion(route.lessonRegion);
    setLibraryRegion(route.libraryRegion || null);
    setLessonAction(route.lessonAction || null);
    setLessonDuration(route.lessonDuration || 60000);
    setPage(route.magicPage);
    window.history.replaceState(
      route,
      "",
      route.lessonRegion || route.libraryRegion ? window.location.hash : "#/" + route.magicPage,
    );
    const pop = (e) => {
      setPlaying(false);
      setSheet(null);
      const route = e.state?.magicPage
        ? e.state
        : publicRoute(window.location.hash);
      let target = route.magicPage;
      setLibraryRegion(route.libraryRegion || null);
      setLessonAction(route.lessonAction || null);
      setLessonDuration(route.lessonDuration || 60000);
      const s = stateRef.current;
      if (target === "tutorial")
        setLessonRegion(
          muscles.some((m) => m.id === route.lessonRegion)
            ? route.lessonRegion
            : "quads",
        );
      if (FLOW.includes(target)) {
        if (target === "complete" && s.record) {
          setPage(target);
          return;
        }
        const restored = validateDraft({ ...s.draft, screen: target });
        if (!restored) {
          setPage("home");
          return;
        }
        target = restored.screen;
        setDraft(restored);
      } else if (target === "detail" && !s.record) {
        setPage("history");
        return;
      }
      setPage(target);
    };
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, []);
  useEffect(() => {
    try {
      if (draft) sessionStorage.setItem(DRAFT, JSON.stringify(draft));
      else sessionStorage.removeItem(DRAFT);
    } catch {}
  }, [draft]);
  useEffect(() => {
    try {
      localStorage.setItem(PREFERENCE_KEY, JSON.stringify(preferences));
    } catch {
      setToast("当前浏览器无法保存常用偏好，本次仍可正常使用。");
    }
  }, [preferences]);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
    const title = scrollRef.current?.querySelector("h1");
    if (title) {
      title.setAttribute("tabindex", "-1");
      title.focus({ preventScroll: true });
    }
  }, [page, libraryRegion, draft?.touchStep, recoveryStep, careStep]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    const hide = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener("visibilitychange", hide);
    return () => document.removeEventListener("visibilitychange", hide);
  }, []);
  useEffect(() => {
    if (!playing || page !== "recovery" || recoveryStep !== 1) return;
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now(),
        elapsed = now - last;
      last = now;
      setDraft((d) => ({
        ...d,
        remaining: Math.max(0, d.remaining - elapsed),
        practiceMs: (d.practiceMs ?? (sessionDuration(d.duration) - d.remaining)) + Math.min(elapsed, d.remaining, Math.max(0, 30000 - (sessionDuration(d.duration) - d.remaining))),
      }));
    }, 100);
    return () => clearInterval(id);
  }, [playing, page, recoveryStep]);
  useEffect(() => {
    if (draft?.remaining === 0 && playing) setPlaying(false);
  }, [draft?.remaining, playing]);
  useEffect(() => {
    if (sheet) setPlaying(false);
  }, [sheet]);
  function go(target, { replace = false, patch = {} } = {}) {
    if (target === "library") setLibraryRegion(null);
    if (target === "activity") target = "location";
    if (["feeling", "safety"].includes(target)) target = "touch";
    if (target === "result")
      target = assess({ ...draft, ...patch }).allow ? "recovery" : "care";
    if (target === "recovery") patch = { ...patch, recoveryStep: 1 };
    if (target === "touch") patch = { ...patch, touchStep: 1 };
    setPlaying(false);
    setSheet(null);
    if (FLOW.includes(target) && target !== "complete")
      setDraft((d) => ({ ...d, ...patch, screen: target }));
    setPage(target);
    window.history[replace ? "replaceState" : "pushState"](
      { magicPage: target },
      "",
      "#/" + target,
    );
  }
  function patch(values) {
    setDraft((d) => ({ ...d, ...values }));
  }
  function start(seed = {}) {
    setRecord(null);
    const d = initialDraft({ ...preferences.last, ...seed });
    setDraft(d);
    setView(muscles.find((m) => m.id === d.selected).view);
    setXray(false);
    setAnimationKey((k) => k + 1);
    go("activity", { patch: d });
  }
  function resume() {
    if (draft) {
      setView(muscles.find((m) => m.id === draft.selected).view);
      go(draft.screen === "complete" ? "feedback" : draft.screen);
    }
  }
  function back() {
    if (page === "library" && libraryRegion) { go("library"); return; }
    if (page === "tutorial" && !lessonCare) { openLibrary(lessonRegion); return; }
    if (inFlow) {
      const target = previousScreen({ ...draft, screen: page });
      if (target) go(target);
      else setSheet("exit");
    } else
      go(
        page === "detail"
          ? "history"
          : page === "tutorial"
            ? lessonCare ? "care" : "library"
            : "home",
      );
  }
  function openLibrary(selected, duration = lessonDuration) {
    const chosenDuration = sessionDuration(duration);
    setPlaying(false); setSheet(null); setLibraryRegion(selected); setLessonDuration(chosenDuration); setPage("library");
    window.history.pushState({ magicPage: "library", libraryRegion: selected, lessonDuration: chosenDuration }, "", "#/library/" + selected);
  }
  function quickMassage() {
    const latest = records[0];
    if (!latest) return;
    const region = muscles.find(m => m.id === latest.selected) || muscles.find(m => m.name === latest.region);
    if (region) openLibrary(region.id, latest.plannedSeconds * 1000);
    else go("library");
  }
  function configureLesson(action, duration) {
    setLessonAction(action); setLessonDuration(duration);
    window.history.replaceState({ magicPage: "tutorial", lessonRegion, lessonAction: action, lessonDuration: duration }, "", tutorialHash(lessonRegion, action, duration));
  }
  function openTutorial(selected, action = null) {
    const chosen = actionFor(selected, action).id;
    setPlaying(false); setSheet(null); setLessonRegion(selected); setLessonAction(chosen); setPage("tutorial");
    window.history.pushState({ magicPage: "tutorial", lessonRegion: selected, lessonAction: chosen, lessonDuration }, "", tutorialHash(selected, chosen, lessonDuration));
  }
  function choose(id, side = draft.side) {
    if (id === draft.selected && side === draft.side) return;
    patch({
      selected: id,
      side,
      flags: [],
      safeNone: false,
      symptom: "",
      onset: "",
      pain: 3,
      touchStep: 0,
      recoveryStep: 0,
      careStep: 0,
      careNote: "",
      careRestMs: 0,
      stopped: false,
      remaining: 60000,
      duration: 60000,
      practiceMs: 0,
      recoveryMethod: "massage",
      recoveryAction: actionFor(id).id,
    });
    setView(muscles.find((m) => m.id === id).view);
  }
  function configureRecovery(options) {
    setPlaying(false);
    setDraft(d => configureGuidedRecovery(d, options));
    setAnimationKey(k => k + 1);
    setSheet(null);
  }
  function next() {
    if (page === "location") setPreferences((p) => rememberChoice(p, draft));
    if (page === "care") {
      save(true);
      return;
    }
    if (page === "recovery") {
      patch({ after: draft.pain });
      setPlaying(false);
      setSheet("feedback");
      return;
    }
    const n = nextScreen({ ...draft, screen: page });
    if (n) {
      if (n === "recovery") setAnimationKey((k) => k + 1);
      go(n);
    }
  }
  function save(stopOnly = false) {
    const item = makeRecord(draft, { stopOnly }),
      next = upsertRecord(records, item);
    setRecords(next);
    setRecord(item);
    let durable = true;
    try {
      localStorage.setItem(STORE, JSON.stringify(next));
    } catch {
      durable = false;
    }
    setDraft(null);
    go("complete", { replace: true });
    if (!durable) setToast("本机存储不可用，记录暂留在当前页面。请导出保存。");
  }
  function retryFrom(r) {
    const selected =
      r.selected || muscles.find((m) => m.name === r.region)?.id || "quads";
    start({ sport: r.sport, selected, side: r.side, referenceId: r.id });
  }
  function exportRecords() {
    const url = URL.createObjectURL(
        new Blob([JSON.stringify(records, null, 2)], {
          type: "application/json",
        }),
      ),
      a = document.createElement("a");
    a.href = url;
    a.download = "magic-body-notes.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const primary = (label, action, disabled = false, Icon = ArrowRight) => (
    <button className="primary" onClick={action} disabled={disabled}>
      <span>{label}</span>
      <Icon size={20} />
    </button>
  );
  const note = (text, warning = false) => (
    <div className={"note " + (warning ? "warning" : "")}>
      <Info size={17} />
      <p>{text}</p>
    </div>
  );
  const scene = (mode = "explore", className = "") => (
    <div className={`scene-slot ${className}`}>
      <div className="scene-overline">
        <span className="live-dot" /> LIVE BODY MAP <span>3D</span>
      </div>
      <LegScene
        selected={mode === "hero" ? "quads" : draft?.selected || "quads"}
        side={mode === "hero" ? "right" : draft?.side || "right"}
        onSelect={page === "location" ? choose : () => {}}
        view={view}
        setView={setView}
        mode={mode}
        playing={playing && recoveryStep === 1}
        xray={xray}
        animationKey={animationKey}
        touchStep={draft?.touchStep || 0}
      />
    </div>
  );
  let footer = null;
  if (inFlow) {
    if (page === "location")
      footer = primary(
        "下一步，看看感受",
        next,
      );
    if (["touch", "feeling"].includes(page))
      footer = primary(draft.symptom && draft.onset && !result.allow ? "记录感受，查看下一步" : "选动作，开始放松", next, !draft.symptom || !draft.onset);
    if (page === "care")
      footer = (
        <>
          {care?.emergency && (
            <EmergencyNumber />
          )}
          {primary("保存本次身体笔记", next, false, Check)}
          <div className="footer-links"><button onClick={() => openTutorial(draft.selected)}>选择动作 · 查看按摩教程</button></div>
        </>
      );
    if (page === "recovery")
      footer = (
        <>
          <div className="guided-footer-main">
            <div className="guided-clock"><small>{recoveryPhase === "rest" ? "休息中" : playing ? "放松中" : "剩余时间"}</small><span>{String(Math.floor(Math.ceil(draft.remaining / 1000) / 60)).padStart(2, "0")}<i>:</i>{String(Math.ceil(draft.remaining / 1000) % 60).padStart(2, "0")}</span></div>
            {primary(draft.remaining === 0 ? "完成，记录一下" : playing ? "暂停放松" : draft.remaining < recoveryDuration ? "继续放松" : "开始放松", draft.remaining === 0 ? next : () => setPlaying(!playing), false, draft.remaining === 0 ? Check : playing ? Pause : Play)}
          </div>
          <div className="footer-links">
            <button onClick={next}>结束并记录</button>
            <button onClick={() => go("care", { patch: { stopped: true } })}>不适增加，停止</button>
          </div>
        </>
      );
    if (page === "feedback")
      footer = primary("保存记录", () => save(), false, Check);
  }
  if (lessonCare) footer = (
    <>
      {care?.emergency && <EmergencyNumber />}
      {primary("保存建议与本次记录", () => save(true), false, Check)}
      <div className="footer-links"><button onClick={() => go("care")}>返回当前处理建议</button></div>
    </>
  );
  return (
    <div className="preview-stage">
      <aside className="desktop-context">
        <a
          className="brand"
          href="#/home"
          onClick={(e) => {
            e.preventDefault();
            if (inFlow) setSheet("exit");
            else go("home");
          }}
        >
          <Fingerprint weight="bold" size={34} />
          <span>magic.</span>
        </a>
        <div className="desktop-copy">
          <span className="eyebrow">YOUR BODY. YOUR PACE.</span>
          <h1>
            尽兴运动。
            <br />
            <span>恢复，一步步来。</span>
          </h1>
          <p>
            跟着身体的信号，
            <br />
            完成一次只属于你的恢复旅程。
          </p>
          <div className="journey-overview">
            {[
              "找到不适的位置",
              "听懂身体的感受",
              "选好动作与时长，跟着放松",
            ].map((v, i) => (
              <div key={v}>
                <span>0{i + 1}</span>
                {v}
              </div>
            ))}
          </div>
        </div>
        <span className="desktop-foot">MAGIC RECOVERY / BODY AWARENESS</span>
      </aside>
      <div className="app-shell">
        <div className="app-topbar">
          {page === "home" ? (
            <div className="app-brand">
              <Fingerprint size={23} weight="bold" />
              magic.
            </div>
          ) : (
            <button
              className="back-button"
              aria-label="返回上一步"
              onClick={back}
            >
              <ArrowLeft size={21} />
            </button>
          )}
          <span className="page-title">
            {page === "home" ? "运动后的身体伙伴" : labels[page]}
          </span>
          <div className="top-actions">
            <button aria-label="使用说明" onClick={() => setSheet("about")}>
              <Info size={19} />
            </button>
            {inFlow && (
              <button
                aria-label="暂存并退出自查"
                onClick={() => setSheet("exit")}
              >
                <X size={19} />
              </button>
            )}
          </div>
        </div>
        {inFlow && (
          <div className="flow-progress simple-flow-progress" aria-label={`第 ${activeStage + 1} 步，共 3 步`}>
            {stages.map((stage, i) => <span key={stage} className={i === activeStage ? "current" : i < activeStage ? "done" : ""} aria-current={i === activeStage ? "step" : undefined}><i>{i < activeStage ? <Check size={11} /> : i + 1}</i>{stage}</span>)}
          </div>
        )}
        <div
          className={"screen-scroll concise-screen page-" + page}
          ref={scrollRef}
          key={page}
        >
          {page === "home" && (
            <section className="home-screen">
              <div className="home-heading">
                <div className="eyebrow">RECOVER AT YOUR OWN PACE</div>
                <h1>
                  练得尽兴。
                  <br />
                  <span>也恢复得从容。</span>
                </h1>
                <p>三步，找到适合现在的缓解方式。</p>
              </div>
              <div className="home-visual">
                {scene("hero", "home-scene")}
                <div className="hero-coordinate" aria-hidden="true">HUMAN ATLAS <span>01 / LOWER BODY</span></div>
                <div className="hero-callout"><i /><span>感知 · 放松 · 恢复<small>从身体的信号开始</small></span></div>
                <div className="hero-orbit-label" aria-hidden="true">EXPLORE IN 3D <span>↗</span></div>
              </div>
              <div className="home-start">
                <div className="home-meta">
                  <span>
                    <Clock size={14} />约 2 分钟
                  </span>
                  <span>
                    <HandPalm size={14} />
                    轻触自查
                  </span>
                  <span>
                    <ShieldCheck size={14} />
                    量力而行
                  </span>
                </div>
                <div className={"home-entry-actions" + (records.length ? " has-quick-massage" : "")}>
                  {primary(
                    records.length ? draft ? "继续自查" : "重新自查" : draft ? "继续上次自查" : "开始一次身体自查",
                    draft ? resume : () => start(),
                  )}
                  {records.length > 0 && <button className="quick-massage-button" onClick={quickMassage}><HandPalm size={20} /><span>快速按摩</span><ArrowRight size={17} /></button>}
                </div>
                {draft && (
                  <div className="draft-line">
                    <span>已进行到：{labels[draft.screen]}</span>
                    <button onClick={() => setSheet("restart")}>
                      重新开始
                    </button>
                  </div>
                )}
              </div>
              {records.length ? (
                <button
                  className="latest-card"
                  onClick={() => {
                    setRecord(records[0]);
                    go("detail");
                  }}
                >
                  <div className="icon-tile">
                    <ClockCounterClockwise size={24} />
                  </div>
                  <div>
                    <small>{dateLabel(records[0].date)}</small>
                    <h3>
                      {records[0].side === "right" ? "右腿" : "左腿"} ·{" "}
                      {records[0].region}
                    </h3>
                    <p>上次记录 · 点此回看</p>
                  </div>
                  <CaretRight size={18} />
                </button>
              ) : (
                <div className="home-empty">
                  <BookOpen size={25} />
                  <div>
                    <strong>你的第一份身体笔记</strong>
                    <p>完成自查后，会自动汇集在这里。</p>
                  </div>
                </div>
              )}
              <div className="home-bottom-note">
                <ShieldCheck size={14} />
                帮助理解身体感受，做好恢复训练
              </div>
            </section>
          )}
          {page === "location" && (
            <section className="location-screen">
              <div className="screen-body compact">
                <h1>哪里不舒服？</h1>
                <div className="location-controls">
                  <div className="segmented">
                    {[
                      ["right", "右腿"],
                      ["left", "左腿"],
                    ].map(([id, label]) => (
                      <button
                        key={id}
                        aria-pressed={draft.side === id}
                        className={draft.side === id ? "active" : ""}
                        onClick={() => choose(draft.selected, id)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <button
                    className="sport-picker"
                    onClick={() => setSheet("sport")}
                  >
                    {draft.sport}之后 <CaretRight size={14} />
                  </button>
                </div>
              </div>
              <div className="location-picker">
              {scene("explore", "location-scene")}
              <div className="region-grid">
                {recoveryRegions.map((mu) => (
                  <button
                    key={mu.id}
                    className={mu.id === draft.selected ? "selected" : ""}
                    aria-pressed={mu.id === draft.selected}
                    onClick={() => choose(mu.id)}
                  >
                    {mu.name}
                    {mu.id === draft.selected && <Check size={14} />}
                  </button>
                ))}
              </div>
              </div>
              {frequent.length > 0 && (
                <div className="frequent-regions">
                  <span>常用</span>
                  <div>
                    {frequent.slice(0, 2).map((f) => (
                      <button
                        key={f.selected + f.side}
                        onClick={() => choose(f.selected, f.side)}
                      >
                        {f.side === "right" ? "右" : "左"} ·{" "}
                        {muscles.find((mu) => mu.id === f.selected).name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </section>
          )}
          {page === "touch" && (
            <section className="touch-screen">
              <div className="screen-body compact touch-heading">
                <h1>轻触后，有什么感觉？</h1>
                <p className="inline-subtitle">
                  {draft.side === "right" ? "右腿" : "左腿"} · {m.name} ·
                  指腹轻触，疼就停
                </p>
              </div>
              {scene("touch", "touch-scene")}
              <div className="screen-body compact quick-feeling">
                <div
                  className="symptom-grid"
                  role="group"
                  aria-label="最明显的感觉"
                >
                  {symptoms.map((sym) => (
                    <button
                      key={sym}
                      className={draft.symptom === sym ? "selected" : ""}
                      aria-pressed={draft.symptom === sym}
                      onClick={() => patch({ symptom: sym })}
                    >
                      {sym}
                    </button>
                  ))}
                </div>
                <div className="feeling-rating">
                <div className="rating-heading">
                  <label htmlFor="pain">不适程度</label>
                  <span>
                    <b>{draft.pain}</b> / 10
                  </span>
                </div>
                <input
                  id="pain"
                  type="range"
                  min="0"
                  max="10"
                  value={draft.pain}
                  aria-valuetext={`${draft.pain} / 10，0 为无不适，10 为难以忍受`}
                  onChange={(e) => patch({ pain: +e.target.value })}
                />
                </div>
                <label className="field-label">什么时候开始？</label>
                <div
                  className="quick-onset"
                  role="group"
                  aria-label="什么时候开始"
                >
                  {[
                    ["运动时突然出现", "运动中突然"],
                    ["运动后逐渐出现", "运动后逐渐"],
                    ["第二天开始明显", "第二天"],
                    ["持续数天或反复出现", "持续或反复"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      aria-pressed={draft.onset === value}
                      className={draft.onset === value ? "selected" : ""}
                      onClick={() => patch({ onset: value })}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="inline-help">
                  <button onClick={() => setSheet("touch-help")}>
                    怎么触摸？
                  </button>
                  <button onClick={() => setSheet("signals")}>
                    肿胀等异常情况
                  </button>
                </div>
              </div>
            </section>
          )}
          {page === "care" && care && (
            <section className="screen-body concise-care">
              <div className="eyebrow">你的下一步</div>
              <h1>{care.title}</h1>
              <p className="care-priority">{care.priority}</p>
              <div className="care-summary" hidden={care.id === "protect" || care.id === "settle"}>
                {care.steps.map((step, i) => (
                  <div key={step.title}>
                    <span>0{i + 1}</span>
                    <div>
                      <h3>{step.title}</h3>
                      <p>
                        {i === 1 && care.id === "protect"
                          ? step.intro
                          : step.actions[0]}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {["protect", "settle"].includes(care.id) && <CareRest key={draft.id} suspended={!!sheet} onElapsed={ms => setDraft(d => ({ ...d, careRestMs: (d.careRestMs || 0) + ms }))} />}
              <button
                className="secondary"
                onClick={() => setSheet("care-details")}
              >
                查看具体做法 <ArrowUpRight size={16} />
              </button>
              <p className="tiny">感受用于记录，不构成诊断。所选部位的动作仍可浏览；疑似损伤时先减少刺激。</p>
            </section>
          )}
          {page === "recovery" && (
            <GuidedRecovery
              region={m} side={draft.side} action={recoveryAction}
              duration={recoveryDuration} remaining={draft.remaining}
              playing={playing} animationKey={animationKey}
              onChooseAction={() => setSheet("recovery-actions")}
              onDuration={duration => configureRecovery({ duration })}
              onDetails={() => setSheet("lesson")}
            />
          )}
          {page === "feedback" && (
            <section className="screen-body">
              <h1>现在感觉如何？</h1>
              <div className="rating-heading">
                <label htmlFor="after">不适程度</label>
                <span>{draft.after} / 10</span>
              </div>
              <input
                id="after"
                type="range"
                min="0"
                max="10"
                value={draft.after}
                onChange={(e) => patch({ after: +e.target.value })}
              />
            </section>
          )}
          {page === "complete" && record && (
            <section className="screen-body completion-screen compact-complete">
              <div className="completion-mark">
                <CheckCircle size={56} weight="light" />
              </div>
              <h1>这次，记下来了。</h1>
              <p className="subtitle">
                {record.side === "right" ? "右腿" : "左腿"} · {record.region}
              </p>
              <div className="receipt-stats">
                <div>
                  <span>自查</span>
                  <strong>
                    {record.pain ?? "—"}
                    <small>/10</small>
                  </strong>
                </div>
                <div>
                  <span>活动后</span>
                  <strong>
                    {record.after ?? "—"}
                    <small>/10</small>
                  </strong>
                </div>
                <div>
                  <span>实际跟练</span>
                  <strong>
                    {record.seconds}
                    <small>秒</small>
                  </strong>
                </div>
              </div>
              <p className="completion-advice">
                {record.after !== null && record.after > record.pain
                  ? "不适增加，今天先减少刺激；持续或加重时寻求评估。"
                  : recordAdvice.allow
                    ? "今天适当降低负荷，下次运动前再看看。"
                    : recordAdvice.body}
              </p>
              {recordAdvice.kind === "emergency" && (
                <EmergencyNumber />
              )}
              {primary("回到首页", () => go("home"), false, House)}
              <button className="text-button" onClick={() => go("detail")}>
                查看完整记录 <ArrowUpRight size={15} />
              </button>
            </section>
          )}
          {page === "history" && (
            <section className="screen-body">
              <div className="eyebrow">YOUR RECOVERY JOURNAL</div>
              <h1>你的身体笔记。</h1>
              <div className="history-summary">
                <span>{records.length} 份身体笔记</span>
                {records.length > 0 && (
                  <div className="journal-export-actions"><button onClick={() => setSheet("share-history")}>分享长图</button><button onClick={exportRecords}><Download size={16} />导出文件</button></div>
                )}
              </div>
              {records.length ? (
                <div className="history-list">
                  {records.map((r) => (
                    <button
                      className="history-card"
                      key={r.id}
                      onClick={() => {
                        setRecord(r);
                        go("detail");
                      }}
                    >
                      <div>
                        <span>{r.sport}</span>
                        <time>{dateLabel(r.date)}</time>
                      </div>
                      <h3>
                        {r.side === "right" ? "右腿" : "左腿"} · {r.region}
                        <CaretRight size={17} />
                      </h3>
                      <p>
                        {r.symptom || "症状确认"}
                        <span>
                          {r.pain === null ? "未评分" : `${r.pain}/10`}
                          {r.after !== null && r.after !== undefined
                            ? ` → ${r.after}/10`
                            : ""}
                        </span>
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="empty">
                  <BookOpen size={45} weight="light" />
                  <h2>第一份笔记，从今天开始。</h2>
                  <p>每次自查与反馈，都会成为你了解身体的线索。</p>
                  {primary("开始自查", () => start())}
                </div>
              )}
              <p className="tiny">
                仅保存在这台设备的浏览器中，最多保留 100
                条。清理浏览器数据会清除记录。
              </p>
            </section>
          )}
          {page === "detail" && record && (
            <section className="screen-body">
              <div className="eyebrow">{dateLabel(record.date)}</div>
              <h1>
                {record.side === "right" ? "右腿" : "左腿"} · {record.region}
              </h1>
              <div className="detail-rows">
                {[
                  ["运动", record.sport],
                  ["最明显的感受", record.symptom || "未进行轻触"],
                  ["出现时间", record.onset || "未记录"],
                  [
                    "自查强度",
                    record.pain === null ? "未评分" : `${record.pain}/10`,
                  ],
                  [
                    "活动后强度",
                    record.after === null || record.after === undefined
                      ? "未记录"
                      : `${record.after}/10`,
                  ],
                  ...(record.recoveryActionName ? [["本次动作", record.recoveryActionName], ["计划时长", durationLabel((record.plannedSeconds || 60) * 1000)]] : []),
                  ["实际活动", `${record.seconds || 0} 秒`],
                  ...(record.careRestSeconds > 0 ? [["支撑休息", `${record.careRestSeconds} 秒（单独计时）`]] : []),
                ].map(([key, value]) => (
                  <div key={key}>
                    <span>{key}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
              <div className="recommendation">
                <span className="mini-label">当时的下一步建议</span>
                <h3>{record.result}</h3>
                {record.flags?.length > 0 && (
                  <p>
                    {record.flags
                      .map((id) => redFlags.find((f) => f.id === id)?.label)
                      .filter(Boolean)
                      .join("；")}
                  </p>
                )}
              </div>
              {record.carePlan && (
                <div className="saved-care-plan">
                  <h2>这次的处理计划</h2>
                  {carePlanFor(record)?.steps.map((step) => (
                    <details className="lesson-details" key={step.title}>
                      <summary>{step.title}</summary>
                      <p>{step.intro}</p>
                      {step.actions.map((text) => (
                        <p key={text}>{text}</p>
                      ))}
                      <p>{step.tip}</p>
                    </details>
                  ))}
                  <p className="tiny">{carePlanFor(record)?.priority}</p>
                  {record.careNote && (
                    <div className="care-context">
                      <strong>你的补充</strong>
                      <p>{record.careNote}</p>
                    </div>
                  )}
                </div>
              )}
              <button className="secondary note-image-button" onClick={() => setSheet("share-note")}><Download size={18} />生成分享长图</button>
              {primary("开始一次复查", () => retryFrom(record), false, Repeat)}
              <button
                className="text-button"
                onClick={() => setSheet("delete")}
              >
                <Trash size={15} />
                删除这份记录
              </button>
            </section>
          )}
          {page === "tutorial" && (
            <RecoveryTutorial
              key={lessonRegion + (lessonCare?.draftId || "")}
              selected={lessonRegion}
              initialAction={lessonAction}
              initialDuration={lessonDuration}
              onConfig={configureLesson}
              suspended={!!sheet}
              initialSide={lessonCare?.side || preferences.last?.side || "right"}
              careContext={lessonCare ? care : null}
              onCare={() => go("care")}
            />
          )}
          {page === "library" && (
            <RecoveryLibrary selected={libraryRegion} duration={lessonDuration} onDuration={setLessonDuration} onRegion={openLibrary} onAction={openTutorial} />
          )}
        </div>
        {footer && <div className="flow-footer">{footer}</div>}
        {["home", "library", "history"].includes(page) && (
          <nav className="tab-bar" aria-label="主导航">
            {[
              ["home", "首页", House],
              ["library", "恢复动作", Pulse],
              ["history", "记录", BookOpen],
            ].map(([id, title, Icon]) => (
              <button
                key={id}
                className={page === id ? "active" : ""}
                aria-current={page === id ? "page" : undefined}
                onClick={() => go(id)}
              >
                <Icon size={23} weight={page === id ? "fill" : "regular"} />
                <span>{title}</span>
              </button>
            ))}
          </nav>
        )}
        {toast && (
          <div className="toast" role="status">
            <Info size={18} />
            {toast}
          </div>
        )}
      </div>
      <aside className="desktop-side-note">
        <span>MAGIC / MINI EXPERIENCE</span>
        <p>
          一次专注于一步。
          <br />
          把恢复，放回训练日常。
        </p>
      </aside>
      {sheet && (
        <Sheet
          title={
            ["share-note", "share-history"].includes(sheet) ? "分享身体笔记" : sheet === "recovery-actions" ? `${m.name} · 选择恢复动作` : sheet === "feedback"
              ? "现在感觉如何？"
              : sheet === "sport"
                ? "这次做了什么运动？"
                : sheet === "touch-help"
                  ? "跟着动画轻触"
                  : sheet === "lesson"
                    ? "动作要点"
                    : sheet === "reason"
                      ? "根据你的描述"
                      : sheet === "care-details"
                        ? "具体处理建议"
                        : sheet === "exit"
                          ? "先休息一下？"
                          : sheet === "restart"
                            ? "开始新的一次？"
                            : sheet === "delete"
                              ? "删除这份笔记？"
                              : sheet === "signals"
                                ? "哪些情况需要先暂停？"
                                : typeof sheet === "object"
                                  ? "开始这个区域的自查？"
                                  : "了解 Magic Recovery"
          }
          onClose={() => setSheet(null)}
        >
          {["share-note", "share-history"].includes(sheet) ? <NoteShare records={sheet === "share-note" ? [record] : records} initialId={sheet === "share-note" ? record?.id : undefined} /> : sheet === "recovery-actions" ? (
            <div className="recovery-actions guided-action-list" role="group" aria-label="该部位的恢复动作">
              {actionsFor(m.id).map(action => <button key={action.id} aria-pressed={recoveryAction.id === action.id} onClick={() => configureRecovery({ actionId: action.id })}><div className={"action-symbol " + action.method}>{action.method === "massage" ? <HandPalm size={23} /> : <Pulse size={23} />}</div><span><strong>{action.name}</strong><small>{action.summary}</small></span>{recoveryAction.id === action.id ? <Check size={18} /> : <ArrowUpRight size={18} />}</button>)}
            </div>
          ) : sheet === "feedback" ? (
            <>
              <p>停下放松一下，再记录当前感受。活动前 {draft.pain}/10。</p>
              <div className="rating-heading">
                <label htmlFor="feedback-after">现在的不适程度</label>
                <span>
                  <b>{draft.after}</b> / 10
                </span>
              </div>
              <input
                id="feedback-after"
                type="range"
                min="0"
                max="10"
                value={draft.after}
                onChange={(e) => patch({ after: +e.target.value })}
              />
              <div className="range-labels">
                <span>无不适</span>
                <span>难以忍受</span>
              </div>
              {draft.after > draft.pain && (
                <p className="feedback-warning">
                  不适增加，先停止活动；持续或加重时寻求评估。
                </p>
              )}
              {primary("保存，完成", () => save(), false, Check)}
              <button className="text-button" onClick={() => save(true)}>
                跳过评分，保存记录
              </button>
            </>
          ) : sheet === "sport" ? (
            <div className="sport-options">
              {sports.map(([name, Icon]) => (
                <button
                  key={name}
                  aria-pressed={draft.sport === name}
                  onClick={() => {
                    patch({ sport: name });
                    setSheet(null);
                  }}
                >
                  <Icon size={24} />
                  {name}
                  {draft.sport === name && <Check size={18} />}
                </button>
              ))}
            </div>
          ) : sheet === "touch-help" ? (
            <>
              <p>{m.touch}</p>
              <p>{m.avoid}</p>
              <p>光点帮助定位，不代表检测到问题。</p>
              <button
                className="secondary"
                onClick={() => {
                  patch({ touchStep: draft.touchStep === 2 ? 1 : 2 });
                  setSheet(null);
                }}
              >
                {draft.touchStep === 2 ? "查看单侧轻触" : "查看左右对比动画"}
              </button>
            </>
          ) : sheet === "lesson" && recoveryMethod === "massage" ? (
            <div className="about-content">
              <p className="guided-plan-note">已选 {recoveryAction.name} · {durationLabel(recoveryDuration)}。先试 1–3 次；较长计划在前 30 秒后进入松手休息，不必持续按揉或做满。</p>
              <h3>先放松腿部</h3>
              <p>{MASSAGES[m.id].setup}</p>
              <h3>跟着手法做</h3>
              <p>{techniqueFor(m.id, massageTechnique).cue}</p>
              <MassageGuidance selected={m.id} technique={massageTechnique} compact />
              <MassageDetails selected={m.id} technique={massageTechnique} />
              <p>{m.avoid}</p>
              <p>{MASSAGE_NOTE}</p>
            </div>
          ) : sheet === "lesson" ? (
            <div className="about-content">
              <h3>先准备</h3>
              {tutorial.prepare.map((v) => (
                <p key={v}>{v}</p>
              ))}
              <h3>跟着做</h3>
              {tutorial.steps.map((v) => (
                <p key={v.title}>
                  <strong>{v.title}</strong> · {v.body}
                </p>
              ))}
              <h3>保持舒服</h3>
              <p>{tutorial.sensation}</p>
              <p>{tutorial.avoid}</p>
            </div>
          ) : sheet === "reason" ? (
            <>
              <p>
                {draft.symptom} · {draft.pain}/10 · {draft.onset}
              </p>
              <p>{result.body}</p>
              <p>这是根据感受给出的行动建议，不是肌肉或筋膜的诊断。</p>
              <button className="text-button" onClick={() => save(true)}>
                今天先休息，保存自查
              </button>
            </>
          ) : sheet === "care-details" ? (
            <div className="about-content">
              <p>{care.reason}</p>
              {care.steps.map((step) => (
                <div key={step.title}>
                  <h3>{step.title}</h3>
                  <p>{step.intro}</p>
                  {step.actions.map((v) => (
                    <p key={v}>· {v}</p>
                  ))}
                  <p>{step.tip}</p>
                </div>
              ))}
              <label htmlFor="care-note">补充记录（选填）</label>
              <textarea
                id="care-note"
                className="care-note"
                rows={2}
                maxLength={500}
                value={draft.careNote || ""}
                onChange={(e) => patch({ careNote: e.target.value })}
              />
              <ReferenceNotes entries={[care.source]} />
            </div>
          ) : sheet === "signals" ? (
            <div className="signal-options">
              <p>
                如有下面的情况，选择对应一项查看下一步。胸痛、呼吸困难或濒晕时立即寻求急救。
              </p>
              {redFlags.map((f) => (
                <button
                  key={f.id}
                  onClick={() =>
                    go("result", { patch: { flags: [f.id], safeNone: false } })
                  }
                >
                  <span>{f.label}</span>
                  <CaretRight size={18} />
                </button>
              ))}
              {draft?.flags.length > 0 && (
                <button
                  onClick={() => {
                    go("touch", {
                      patch: { flags: [], stopped: false, safeNone: false },
                    });
                  }}
                >
                  刚才选错了，清除异常记录
                </button>
              )}
              <button className="text-button" onClick={() => setSheet(null)}>
                返回当前步骤
              </button>
            </div>
          ) : sheet === "exit" ? (
            <>
              <p>当前进度会暂存。回到首页后，随时可以继续这次自查。</p>
              {primary("暂存进度，返回首页", () => go("home"), false, House)}
              <button className="text-button" onClick={() => setSheet(null)}>
                继续当前自查
              </button>
            </>
          ) : sheet === "restart" || typeof sheet === "object" ? (
            <>
              <p>开始新的自查会替换尚未完成的进度，已保存的身体笔记会保留。</p>
              {primary("开始新的自查", () => {
                const seed =
                  typeof sheet === "object" ? { selected: sheet.selected } : {};
                start(seed);
              })}
              <button
                className="text-button"
                onClick={() => {
                  setSheet(null);
                  resume();
                }}
              >
                继续上次自查
              </button>
            </>
          ) : sheet === "delete" ? (
            <>
              <p>仅删除这条本机记录，其他身体笔记不受影响。</p>
              {primary(
                "确认删除",
                () => {
                  const next = records.filter((r) => r.id !== record.id);
                  try {
                    localStorage.setItem(STORE, JSON.stringify(next));
                    setRecords(next);
                    setRecord(null);
                    go("history");
                    setToast("这份记录已删除。");
                  } catch {
                    setToast("删除失败，请检查浏览器存储设置。");
                  }
                },
                false,
                Trash,
              )}
              <button className="text-button" onClick={() => setSheet(null)}>
                保留记录
              </button>
            </>
          ) : (
            <div className="about-content">
              <p>
                Magic 通过真实 3D
                定位、轻触引导和主观记录，帮助你了解运动后腿部感受。本工具不诊断拉伤、筋膜问题，也不能排除血栓等疾病。
              </p>
              <h3>什么时候先暂停</h3>
              <p>
                突然或严重疼痛、不能负重、明显单侧红肿热、麻木或无力时，停止按压和跟练。胸痛或呼吸困难时立即寻求急救。
              </p>
              <h3>本机偏好</h3>
              <p>
                常用运动、部位与左右侧仅保存在本机。新自查不会沿用上次的症状或疼痛分数。
              </p>
              <button
                className="text-button"
                onClick={() => {
                  setPreferences(cleanPreferences(null));
                  setToast("常用偏好已清除，身体笔记保留。");
                }}
              >
                清除常用偏好
              </button>
              <h3>模型与动作</h3>
              <p>
                采用 Human Atlas 的 BodyParts3D
                成年男性参考模型定位肌群。跟练人物也基于同一 Atlas
                身体网格制作，关节动作与手指为教学示意，橙色标出当前关注区域；动画幅度不代表你需要达到的范围。
              </p>
              <ModelAttribution />
              <ReferenceNotes entries={sources} title="内容来源" />
              <p className="tiny">
                当前是小程序式 H5
                交互原型。分流规则未经临床验证，正式公开前需要专业内容审阅。记录仅存在本机，不会同步至服务器。
              </p>
            </div>
          )}
        </Sheet>
      )}
    </div>
  );
}
