import { Play, Pause, Check, ArrowCounterClockwise } from '@phosphor-icons/react';
import { MAIN_SESSION_DURATIONS, durationLabel, relaxationPhase } from './recoveryCatalog';
export function DurationPicker({ value, onChange }) {
  return <div className="duration-picker" role="group" aria-label="选择放松时长">
    {(value === 30000 ? [30000, ...MAIN_SESSION_DURATIONS] : MAIN_SESSION_DURATIONS).map(ms => <button key={ms} aria-pressed={value === ms} onClick={() => onChange(ms)}>{durationLabel(ms)}</button>)}
  </div>;
}
export function SessionControls({ duration, remaining, running, onDuration, onToggle, onReset }) {
  const phase = relaxationPhase(duration, remaining), completed = phase === 'complete';
  const seconds = Math.ceil(remaining / 1000);
  return <div className="session-controls">
    <div className="session-settings"><span>放松时长</span><DurationPicker value={duration} onChange={onDuration} /></div>
    <div className="session-action">
      <div className="session-clock" aria-label={`剩余 ${seconds} 秒`}>{Math.floor(seconds / 60).toString().padStart(2, '0')}<i>:</i>{(seconds % 60).toString().padStart(2, '0')}</div>
      <button className="primary" onClick={completed ? onReset : onToggle}>
        {completed ? '已完成 · 再看示范' : running ? '暂停放松' : remaining < duration ? '继续放松' : '开始放松'}
        {completed ? <Check size={17} /> : running ? <Pause size={17} /> : <Play size={17} />}
      </button>
      {!completed && remaining < duration && <button className="session-reset" aria-label="重新计时" onClick={onReset}><ArrowCounterClockwise size={18} /></button>}
    </div>
    <p role="status">{completed ? '这次结束了，感受一下身体的变化。' : phase === 'rest' ? '松手休息，自然呼吸；剩余时间用来感受变化。' : '先试 1–3 次，随后松手休息；随时可以结束。'}</p>
  </div>;
}
