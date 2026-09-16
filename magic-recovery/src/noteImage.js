import { redFlags } from './data.js';
import { carePlanFor } from './care.js';

const recorded = value => value === null || value === undefined || value === '' ? '未记录' : String(value);
export const scoreText = value => Number.isFinite(value) ? `${value} / 10` : '未评分';
export function noteSections(record) {
  const sections = [
    { title: '01  身体感受', rows: [
      ['运动', recorded(record.sport)], ['最明显的感受', recorded(record.symptom)],
      ['出现时间', recorded(record.onset)], ['自查强度', scoreText(record.pain)],
      ['活动后强度', scoreText(record.after)],
    ] },
    { title: '02  本次行动', rows: [
      ['恢复动作', record.recoveryActionName || (record.carePlan ? '本次未记录按摩跟练' : '未记录动作')],
      ['计划时长', Number.isFinite(record.plannedSeconds) && record.recoveryActionName ? `${record.plannedSeconds} 秒` : '未记录'],
      ['实际活动', `${Math.max(0, record.seconds || 0)} 秒`],
      ...(record.careRestSeconds > 0 ? [['支撑休息', `${record.careRestSeconds} 秒（单独计时）`]] : []),
      ['中途停止', record.stopped ? '因不适增加而停止' : '未记录中途停止'],
    ] },
    { title: '03  当时的提醒', rows: [
      ['下一步建议', recorded(record.result)],
      ...(record.flags?.length ? [['补充情况', record.flags.map(id => redFlags.find(f => f.id === id)?.label || id).join('；')]] : []),
    ] },
  ];
  const care = record.carePlan ? carePlanFor(record) : null;
  if (care) sections.push({ title: '04  处理参考', rows: [
    ['重要提醒', care.priority], ...care.steps.map(step => [step.title, [step.intro, ...step.actions, step.tip].join('\n')]),
  ] });
  if (record.careNote) sections.push({ title: '补充记录', rows: [['我的补充', record.careNote]] });
  return sections;
}
export function noteDate(record) {
  const date = new Date(record.date);
  return Number.isNaN(date.getTime()) ? '日期未记录' : date.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
}
export function noteFilename(record) {
  const date = new Date(record.date);
  return `Magic-身体笔记-${record.region.replace(/[\\/:*?"<>|]/g, '')}-${Number.isNaN(date.getTime()) ? '记录' : date.toISOString().slice(0, 10)}.png`;
}
// Render actual record data locally. Nothing is uploaded and no DOM screenshot service is used.
export async function renderNoteImage(record) {
  await document.fonts.ready;
  const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('当前浏览器无法生成图片');
  const width = 1080, left = 68, inner = width - left * 2;
  const font = (size, weight = 400) => `${weight} ${size}px -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif`;
  const commands = [];
  let y = 0;
  function text(value, x, top, maxWidth, size = 28, color = '#d7e1e6', weight = 400) {
    ctx.font = font(size, weight);
    const lines = [];
    for (const para of String(value).split('\n')) {
      let line = '';
      for (const char of para) {
        if (line && ctx.measureText(line + char).width > maxWidth && !/[，。；：！？、）》」】”’]/u.test(char)) { lines.push(line); line = ''; }
        line += char;
      }
      lines.push(line);
    }
    commands.push(() => { ctx.font = font(size, weight); ctx.fillStyle = color; ctx.textBaseline = 'top'; lines.forEach((line, i) => ctx.fillText(line, x, top + i * size * 1.55)); });
    return lines.length * size * 1.55;
  }
  text('MAGIC / BODY JOURNAL', left, 64, inner, 23, '#f6a16f', 600);
  y = 124 + text('你的身体笔记。', left, 124, inner, 58, '#f2f5f6', 600);
  y += 20;
  y += text(`${record.side === 'left' ? '左腿' : record.side === 'right' ? '右腿' : '侧别未记录'} · ${record.region}`, left, y, inner, 36, '#cbd9e2', 500);
  y += 12 + text(noteDate(record), left, y + 12, inner, 25, '#8297a4');
  y += 42;
  for (const section of noteSections(record)) {
    const start = y;
    const card = () => { ctx.fillStyle = '#192328'; ctx.strokeStyle = '#33434c'; ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect(left, start, inner, end - start, 24); ctx.fill(); ctx.stroke(); };
    commands.push(card);
    y += 28;
    y += text(section.title, left + 30, y, inner - 60, 27, '#f7b88f', 600) + 24;
    for (const [label, value] of section.rows) {
      const labelHeight = text(label, left + 30, y, 190, 25, '#8fa7b4');
      const valueHeight = text(value, left + 250, y, inner - 280, 28);
      y += Math.max(labelHeight, valueHeight) + 24;
    }
    const end = y + 8;
    y = end + 26;
  }
  y += 10;
  y += text('记录来自个人感受，不构成诊断或疗效证明。', left, y, inner, 23, '#899fa9');
  y += text('计划时长与实际活动分别记录；休息不计入按摩活动。', left, y, inner, 23, '#899fa9');
  y += 62;
  canvas.width = width; canvas.height = Math.ceil(y);
  ctx.fillStyle = '#0e1519'; ctx.fillRect(0, 0, width, canvas.height);
  const gradient = ctx.createLinearGradient(0, 0, width, 450);
  gradient.addColorStop(0, '#243d4a'); gradient.addColorStop(1, '#0e1519');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, 450);
  ctx.fillStyle = '#f48c52'; ctx.fillRect(left, 29, 54, 4);
  commands.forEach(draw => draw());
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('图片生成失败，请重试')), 'image/png'));
}
export function saveNoteImage(blob, filename) {
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
