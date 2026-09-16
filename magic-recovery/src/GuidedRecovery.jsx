import { CaretDown, HandPalm, Pulse } from '@phosphor-icons/react';
import MassageScene from './MassageScene';
import MovementScene from './MovementScene';
import MassageGuidance, { TrialRepetitions } from './MassageGuidance';
import { DurationPicker } from './SessionControls';
import { techniqueFor } from './massage';
import { tutorialFor } from './tutorial';
import { relaxationPhase } from './recoveryCatalog';

export default function GuidedRecovery({ region, side, action, duration, remaining, playing, animationKey, onChooseAction, onDuration, onDetails }) {
  const phase = relaxationPhase(duration, remaining);
  const elapsed = Math.min(duration - remaining, 30000);
  const isMassage = action.method === 'massage';
  const cue = isMassage ? techniqueFor(region.id, action.technique).cue : tutorialFor(region).steps.slice(0, 2).map(s => s.body).join('');
  return <section className="guided-recovery">
    <header className="guided-heading">
      <h1>开始放松。</h1><span>{side === 'right' ? '右腿' : '左腿'} · {region.name}</span>
    </header>
    <div className="guided-options">
      <button className="guided-action-choice" onClick={onChooseAction} aria-label={`选择恢复动作，当前${action.name}`}>
        <span className="guided-action-icon">{isMassage ? <HandPalm size={23} /> : <Pulse size={23} />}</span>
        <span><small>恢复动作</small><strong>{action.name}</strong></span>
        <span className="change-action">更换<CaretDown size={13} /></span>
      </button>
      <div className="guided-duration"><span>放松时长</span><DurationPicker value={duration} onChange={onDuration} /></div>
      <p className="guided-benefit">{action.benefit}</p>
    </div>
    <div className="tutorial-viewer">
      {isMassage ? <MassageScene key={region.id + side + action.id + animationKey} selected={region.id} side={side} technique={action.technique} playing={playing && phase === 'practice'} autoDemo={elapsed === 0} animationKey={animationKey} elapsed={elapsed} /> : <MovementScene compact key={region.id + side + action.id + animationKey} selected={region.id} side={side} playing={playing && phase === 'practice'} autoDemo={elapsed === 0} animationKey={animationKey} elapsed={elapsed} />}
      {phase !== 'practice' && <div className="session-rest-card"><strong>{phase === 'complete' ? '这次放松完成了' : '松手，给身体一点时间'}</strong><span>放稳腿部，自然呼吸，感受变化。</span></div>}
    </div>
    <div className="guided-instructions">
      <p className="guided-cue">{cue}</p>
      {isMassage ? <MassageGuidance selected={region.id} technique={action.technique} compact /> : <TrialRepetitions method="movement" />}
      <div className="guided-details"><span>轻柔、舒适，不适增加就停。</span><button onClick={onDetails}>查看完整做法 ↗</button></div>
    </div>
  </section>;
}
