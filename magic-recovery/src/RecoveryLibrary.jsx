import { ArrowUpRight, HandPalm, Pulse, CaretRight } from '@phosphor-icons/react';
import { recoveryRegions, actionsFor } from './recoveryCatalog';
import { DurationPicker } from './SessionControls';

function RegionGlyph({ region }) {
  const areas = {
    quads: 'M16 12 Q23 10 25 18 L23 32 Q20 35 17 31Z',
    hamstrings: 'M16 12 Q22 10 25 18 L23 32 L18 32Z',
    outerthigh: 'M15 11 L19 12 L20 31 L16 32Z',
    adductors: 'M23 12 L26 16 L23 32 L21 31Z',
    calves: 'M17 37 Q24 34 25 42 L22 54 L19 54Z',
    shins: 'M17 36 L20 37 L20 57 L18 57Z',
    outercalf: 'M16 36 L19 37 L20 49 L18 54Z',
  };
  return <svg viewBox="0 0 56 72" aria-hidden="true" className="region-glyph">
    <path d="M15 6 Q28 2 41 6 L43 23 L38 36 L39 50 L36 63 L42 65 Q45 70 38 70 L31 67 L31 54 L29 37 L28 20 L27 37 L25 54 L25 67 L18 70 Q11 70 14 65 L20 63 L17 50 L18 36 L13 23Z" fill="#38484e" stroke="#7d939c" strokeWidth=".8"/>
    <path d={areas[region]} fill="#ff955c"/>
    <path d="M10 35H46" stroke="#6c9dab" strokeOpacity=".35" strokeDasharray="2 3"/>
  </svg>;
}
export default function RecoveryLibrary({ selected, duration, onDuration, onRegion, onAction }) {
  const region = recoveryRegions.find(r => r.id === selected);
  if (region) return <section className="screen-body action-library">
    <div className="eyebrow">{region.en}</div>
    <h1>{region.name}，这样放松。</h1>
    <p className="subtitle">选一个动作，直接看示范。</p>
    <div className="library-duration"><span>想放松多久？</span><DurationPicker value={duration} onChange={onDuration} /></div>
    <div className="recovery-actions">
      {actionsFor(region.id).map((action, i) => <button key={action.id} onClick={() => onAction(region.id, action.id)}>
        <div className={'action-symbol ' + action.method}>{action.method === 'massage' ? <HandPalm size={23} weight="light" /> : <Pulse size={23} weight="light" />}</div>
        <span><strong>{action.name}</strong><small>{action.summary}</small></span><ArrowUpRight size={18} />
      </button>)}
    </div>
    <p className="library-hint">时长包含试做与休息，不必持续按揉。</p>
    {region.id === 'outerthigh' && <p className="region-boundary">髂胫束是筋膜带。手法演示放在前外侧肌腹，不沿硬带深压。</p>}
  </section>;
  return <section className="screen-body region-library">
    <div className="eyebrow">YOUR RECOVERY, YOUR PACE</div>
    <h1>今天，想放松哪里？</h1>
    <p className="subtitle">7 个部位 · 按摩放松与轻柔活动</p>
    <div className="recovery-region-grid">
      {recoveryRegions.map(r => <button key={r.id} onClick={() => onRegion(r.id)}>
        <RegionGlyph region={r.id} /><span><strong>{r.name}</strong><small>{actionsFor(r.id).length} 个动作可选</small></span><CaretRight size={13} />
      </button>)}
    </div>
    <details className="coverage-note"><summary>这些部位覆盖哪些肌肉？</summary><p>覆盖大腿前、后、内、外侧与小腿前、后、外侧的常见紧绷区域；股四头肌、腘绳肌、内收肌、腓肠肌与比目鱼肌等按区域归类。并非每块深层肌肉都适合或能用手直接放松，臀部、足底和肌腱不在本轮教程范围内。</p><p>同一种手法可以用于不同部位，动作数量是“部位＋动作”的入口数。髂胫束等筋膜带也属于区域说明，但不作为深压目标。</p></details>
  </section>;
}
