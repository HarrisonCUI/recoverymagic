import { CaretDown, HandPalm, Pulse } from '@phosphor-icons/react';
import MassageScene from './MassageScene';
import MovementScene from './MovementScene';
import MassageGuidance, { TrialRepetitions } from './MassageGuidance';
import { DurationPicker } from './SessionControls';
import { massageSetup, techniqueFor } from './massage';
import { tutorialFor } from './tutorial';
import { routineState } from './recoveryRoutine';
import { routinePresentation } from './routinePresentation';

export default function GuidedRecovery({ region, side, duration, remaining, playing, animationKey, onChooseAction, onDuration, onDetails }) {
  const state = routineState(region.id, duration, remaining), {action, step, phase} = state;
  const isMassage = action.method === 'massage', active = phase === 'practice';
  const visual = routinePresentation(state), visualMassage = visual.action.method === 'massage';
  const preview = visual.mode === 'preview';
  const animate = playing && visual.animate;
  const animationElapsed = visual.elapsed;
  const sceneKey = region.id + side + animationKey;
  const cue = isMassage ? techniqueFor(region.id, action.technique).cue : tutorialFor(region).steps.slice(0, 2).map(s => s.body).join('');
  return <section className="guided-recovery">
    <header className="guided-heading"><h1>跟着节奏放松。</h1><span>{side === 'right' ? '右腿' : '左腿'} · {region.name}</span></header>
    <div className="guided-options">
      <button className="guided-action-choice" onClick={onChooseAction} aria-label="查看自动跟练顺序">
        <span className="guided-action-icon">{isMassage ? <HandPalm size={23} /> : <Pulse size={23} />}</span>
        <span><small>{state.complete ? '本次结束' : `第 ${state.index + 1} / ${state.steps.length} 步 · 自动衔接`}</small><strong>{step.title}</strong></span>
        <span className="change-action">流程<CaretDown size={13} /></span>
      </button>
      <div className="guided-duration"><span>总时长</span><DurationPicker value={duration} onChange={onDuration} /></div>
      <div className="routine-next" aria-live="polite" key={step.id}><span>{active ? `动作 ${state.actionNumber}/${state.actionCount}` : phase === 'prepare' ? '准备姿势' : phase === 'transition' ? '换个手法' : '松手休息'}</span><span>{state.next ? `接下来：${state.next.title}` : '接下来：结束并记录'}</span></div>
    </div>
    <div className="tutorial-viewer routine-viewer">
      <div className="routine-scene-fade" style={{opacity: visual.opacity}} data-presentation={visual.mode}>
      {visualMassage ? <MassageScene key={sceneKey + "massage"} selected={region.id} side={side} technique={visual.action.technique} playing={animate} autoDemo={false} animationKey={animationKey} elapsed={animationElapsed} controlled /> : <MovementScene compact controlled key={sceneKey + "movement"} selected={region.id} side={side} playing={animate} autoDemo={false} animationKey={animationKey} elapsed={animationElapsed} />}
      </div>
    </div>
    <div className="guided-instructions">
      {!active && <div className="session-rest-card" role="status"><strong>{state.complete ? '本次跟练结束' : step.title}</strong><b>{state.complete ? '✓' : `${Math.ceil(state.remaining / 1000)} 秒`}</b><span>{preview ? '先看动作预览，准备好再跟随。' + (isMassage ? massageSetup(region.id, action.technique) : tutorialFor(region).prepare[0]) : phase === 'transition' ? `先松手，准备${action.name}。` + (isMassage ? massageSetup(region.id, action.technique) : tutorialFor(region).prepare[0]) : '动作已暂停。自然呼吸，留意是否舒服。'}</span></div>}
      {active && <><p className="guided-benefit">{action.benefit}</p><p className="guided-cue">{cue}</p>
      {isMassage ? <MassageGuidance selected={region.id} technique={action.technique} compact /> : <TrialRepetitions method="movement" />}
      </>}
      <div className="guided-details"><span>{state.complete ? '已结束，可记录这次感受。' : '每段先试 1 次，舒适再继续；随时可停。'}</span><button onClick={onDetails}>动作要点 ↗</button></div>
    </div>
  </section>;
}
export function RoutineSteps({region, duration, remaining}) {
  const state = routineState(region, duration, remaining);
  return <ol className="routine-steps">{state.steps.map((step,i) => <li key={step.id} aria-current={state.index === i ? 'step' : undefined}><span>{i + 1}</span><div><strong>{step.title}</strong><small>{step.kind === 'action' ? '按舒适程度跟随，可随时停止' : '不按揉 · 不计入活动时间'}</small></div><b>{step.ms / 1000} 秒</b></li>)}</ol>;
}
