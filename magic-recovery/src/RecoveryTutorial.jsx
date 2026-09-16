import { useEffect, useState } from 'react';
import MassageScene from './MassageScene';
import MovementScene from './MovementScene';
import { muscles } from './data';
import { tutorialFor } from './tutorial';
import { MASSAGES, massageSetup, MASSAGE_NOTE, techniqueFor } from './massage';
import MassageGuidance, { MassageDetails, TrialRepetitions } from './MassageGuidance';
import { actionFor, actionsFor, sessionDuration } from './recoveryCatalog';

// Single-action pages are lessons. All timed practice uses the shared automatic course.
export default function RecoveryTutorial({ selected, initialAction, initialDuration = 60000, initialSide = 'right', careContext = null, onCare, onConfig, suspended = false }) {
  const [side, setSide] = useState(initialSide), [actionId, setActionId] = useState(actionFor(selected, initialAction).id);
  const [animationKey, setAnimationKey] = useState(0);
  const region = muscles.find(m => m.id === selected), massage = MASSAGES[selected], movement = tutorialFor(region);
  const action = actionFor(selected, actionId), method = action.method, technique = action.technique;
  const current = method === 'massage' ? techniqueFor(selected, technique) : null;
  const previewOnly = !!careContext;
  useEffect(() => { setActionId(actionFor(selected, initialAction).id); setAnimationKey(k=>k+1); }, [selected, initialAction]);
  function configure(id) { setActionId(id); setAnimationKey(k=>k+1); onConfig?.(id,sessionDuration(initialDuration)); }
  return <section className={'direct-tutorial focused-tutorial' + (careContext ? ' care-tutorial' : '')}>
    <div className="screen-body compact tutorial-heading">
      <div className="eyebrow">{region.name} · {action.id === 'pin' ? '支撑下的关节活动' : method === 'massage' ? '按摩手法教学' : '轻柔活动教学'}</div>
      <h1>{action.name}</h1>
      {careContext ? <div className="tutorial-care-note" role="note"><strong>保留当前提醒，可继续了解动作</strong><p>{careContext.emergency ? '请立即联系急救，不要等教程看完。' : '当前症状不适合直接按揉；教程浏览不会清除刚才的记录。'}</p><button onClick={onCare}>查看当前处理建议</button></div> : <p className="recovery-benefit">{action.benefit}</p>}
      <div className="tutorial-selectors"><select aria-label="选择恢复动作" value={actionId} onChange={e=>configure(e.target.value)}>{actionsFor(selected).map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select><button className="side-toggle" onClick={()=>setSide(s=>s==='right'?'left':'right')}>{side==='right'?'右腿':'左腿'} ⇄</button></div>
    </div>
    <div className="tutorial-viewer">
      {method==='massage' ? <MassageScene key={selected+side+actionId+animationKey+suspended} selected={selected} side={side} technique={technique} autoDemo={!previewOnly && !suspended}/> : <MovementScene compact key={selected+side+actionId+animationKey+suspended} selected={selected} side={side} autoDemo={!previewOnly && !suspended}/>}
    </div>
    <div className="screen-body compact tutorial-instructions">
      <p className="tutorial-main-cue">{current ? current.cue : movement.steps.slice(0,2).map(s=>s.body).join('')}</p>
      {current ? <MassageGuidance selected={selected} technique={technique} previewOnly={previewOnly} compact/> : !previewOnly && <TrialRepetitions method="movement"/>}
      <p className="massage-reminder">{method==='massage' ? MASSAGE_NOTE : '小幅、无痛地活动，不适增加就停下。'}</p>
      <details className="lesson-details"><summary>准备姿势、次数与详细做法</summary>
        {method==='massage' ? <><p>{massageSetup(selected, technique)}</p><p>{massage.cue}</p><p>{region.avoid}</p><MassageDetails selected={selected} technique={technique} previewOnly={previewOnly}/></> : <>{movement.prepare.filter(t=>!previewOnly || !t.includes('先看')).map(t=><p key={t}>{t}</p>)}{movement.steps.filter(s=>!previewOnly || !s.title.includes('试做')).map(s=><p key={s.title}>{s.title}：{s.body}</p>)}<p>{movement.avoid}</p></>}
        <p>此页用于单独学习，观看不计为实际活动。完整跟练会按所选总时长自动串联动作与休息。</p>
      </details>
      {!careContext && <button className="primary" onClick={()=>onConfig?.('routine',sessionDuration(initialDuration))}><span>开始自动跟练</span><span>→</span></button>}
    </div>
  </section>;
}
