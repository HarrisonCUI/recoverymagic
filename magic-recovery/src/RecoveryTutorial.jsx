import { useEffect, useState } from 'react';
import MassageScene from './MassageScene';
import MovementScene from './MovementScene';
import { muscles } from './data';
import { tutorialFor } from './tutorial';
import { MASSAGES, MASSAGE_NOTE, techniqueFor } from './massage';
import MassageGuidance, { MassageDetails, TrialRepetitions } from './MassageGuidance';
import { actionFor, actionsFor, sessionDuration, relaxationPhase } from './recoveryCatalog';
import { SessionControls } from './SessionControls';

export default function RecoveryTutorial({ selected, initialAction, initialDuration = 60000, initialSide = 'right', careContext = null, onCare, onConfig, suspended = false }) {
  const [side, setSide] = useState(initialSide), [actionId, setActionId] = useState(actionFor(selected, initialAction).id);
  const [duration, setDuration] = useState(sessionDuration(initialDuration));
  const [remaining, setRemaining] = useState(sessionDuration(initialDuration)), [running, setRunning] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const region = muscles.find(m => m.id === selected), massage = MASSAGES[selected], movement = tutorialFor(region);
  const action = actionFor(selected, actionId), method = action.method, technique = action.technique;
  const current = method === 'massage' ? techniqueFor(selected, technique) : null;
  const previewOnly = !!careContext, phase = relaxationPhase(duration, remaining), elapsed = duration - remaining;
  useEffect(() => {
    setRunning(false); setActionId(actionFor(selected, initialAction).id);
    setDuration(sessionDuration(initialDuration)); setRemaining(sessionDuration(initialDuration));
    setAnimationKey(k => k + 1);
  }, [selected, initialAction, initialDuration]);
  useEffect(() => {
    if (!running || previewOnly) return;
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now(), delta = now - last; last = now;
      setRemaining(ms => Math.max(0, ms - delta));
    }, 100);
    const hide = () => { if (document.hidden) setRunning(false); };
    document.addEventListener('visibilitychange', hide);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', hide); };
  }, [running, previewOnly]);
  useEffect(() => { if (remaining === 0 || suspended) setRunning(false); }, [remaining, suspended]);
  function configure(id = actionId, ms = duration) {
    setRunning(false); setActionId(id); setDuration(ms); setRemaining(ms); setAnimationKey(k => k + 1);
    onConfig?.(id, ms);
  }
  function changeSide() { setRunning(false); setSide(s => s === 'right' ? 'left' : 'right'); setRemaining(duration); setAnimationKey(k => k + 1); }
  const practicing = running && phase === 'practice';
  return <section className={'direct-tutorial focused-tutorial' + (previewOnly ? ' care-tutorial' : '')}>
    <div className="screen-body compact tutorial-heading">
      <div className="eyebrow">{region.name} · {method === 'massage' ? '按摩放松' : '轻柔活动'}</div>
      <h1>{action.name}</h1>
      {previewOnly ? <div className="tutorial-care-note" role="note"><strong>先了解手法，当前暂不跟练</strong><p>{careContext.emergency ? '请立即联系急救，不要等教程看完。' : '根据刚才的不适，暂不建议实际按揉或跟练；仍可查看完整教程。'}</p><button onClick={onCare}>查看当前处理建议</button></div> : <p className="recovery-benefit">{action.benefit}</p>}
      <div className="tutorial-selectors">
        <select aria-label="选择恢复动作" value={actionId} onChange={e => configure(e.target.value)}>{actionsFor(selected).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
        <button className="side-toggle" onClick={changeSide}>{side === 'right' ? '右腿' : '左腿'} ⇄</button>
      </div>
    </div>
    <div className="tutorial-viewer">
      {method === 'massage' ? <MassageScene key={selected + side + actionId + animationKey} selected={selected} side={side} technique={technique} playing={practicing} elapsed={Math.min(elapsed, 30000)} animationKey={animationKey} autoDemo={!previewOnly && elapsed === 0} /> : <MovementScene compact key={selected + side + actionId + animationKey} selected={selected} side={side} playing={practicing} elapsed={Math.min(elapsed, 30000)} animationKey={animationKey} autoDemo={!previewOnly && elapsed === 0} />}
      {!previewOnly && phase !== 'practice' && <div className="session-rest-card"><strong>{phase === 'complete' ? '这次放松完成了' : '松手，给身体一点时间'}</strong><span>放稳腿部，自然呼吸，感受变化。</span></div>}
    </div>
    <div className="screen-body compact tutorial-instructions">
      <p className="tutorial-main-cue">{current ? current.cue : movement.steps.slice(0,2).map(s => s.body).join('')}</p>
      {current ? <MassageGuidance selected={selected} technique={technique} previewOnly={previewOnly} compact /> : !previewOnly && <TrialRepetitions method="movement" />}
      <p className="massage-reminder">{method === 'massage' ? MASSAGE_NOTE : '小幅、无痛地活动，不适增加就停下。'}</p>
      <details className="lesson-details" onToggle={e => { if (e.currentTarget.open) setRunning(false); }}>
        <summary>准备姿势、次数与详细做法</summary>
        {method === 'massage' ? <><p>{massage.setup}</p><p>{massage.cue}</p><p>{region.avoid}</p><MassageDetails selected={selected} technique={technique} previewOnly={previewOnly} /></> : <>{movement.prepare.filter(t => !previewOnly || !t.includes('先看')).map(t => <p key={t}>{t}</p>)}{movement.steps.filter(s => !previewOnly || !s.title.includes('试做')).map(s => <p key={s.title}>{s.title}：{s.body}</p>)}<p>{movement.avoid}</p></>}
        {!previewOnly && <p>30 秒用来熟悉动作；1 分钟和 5 分钟在前 30 秒后进入休息。先试 1–3 次即可，可提前松手，不必持续操作或做满时间。这是可选的放松计时，不是治疗剂量。</p>}
      </details>
    </div>
    {!previewOnly && <SessionControls duration={duration} remaining={remaining} running={running} onDuration={ms => configure(actionId, ms)} onToggle={() => setRunning(r => !r)} onReset={() => configure()} />}
  </section>;
}
