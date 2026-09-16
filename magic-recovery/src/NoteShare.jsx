import { useEffect, useState } from 'react';
import { Download, ShareNetwork } from '@phosphor-icons/react';
import { renderNoteImage, noteFilename, noteDate, saveNoteImage } from './noteImage';
export default function NoteShare({ records, initialId }) {
  const [id, setId] = useState(initialId || records[0]?.id);
  const [asset, setAsset] = useState(null), [error, setError] = useState(''), [message, setMessage] = useState('');
  const [attempt, setAttempt] = useState(0), [sharing, setSharing] = useState(false);
  const record = records.find(r => r.id === id) || records[0];
  useEffect(() => {
    let disposed = false, url;
    setAsset(null); setError(''); setMessage('');
    if (record) renderNoteImage(record).then(blob => {
      if (disposed) return;
      url = URL.createObjectURL(blob);
      setAsset({ blob, url, id: record.id, filename: noteFilename(record) });
    }).catch(() => { if (!disposed) setError('图片暂时没有生成成功，请重试。'); });
    return () => { disposed = true; if (url) URL.revokeObjectURL(url); };
  }, [record, attempt]);
  const ready = asset?.id === record?.id;
  async function download() {
    setSharing(true); setMessage('');
    try {
      await saveNoteImage(asset.blob, asset.filename);
      setMessage(__MINITOOL_BUILD__ ? '图片已保存到系统相册。' : '已发起 PNG 下载，可从设备文件中选择图片分享。');
    } catch (error) {
      setMessage(error.message || '图片保存失败，请检查权限后重试。');
    } finally { setSharing(false); }
  }
  async function share() {
    const file = new File([asset.blob], asset.filename, { type: 'image/png' });
    setSharing(true); setMessage('');
    try {
      if (navigator.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share({ files: [file] });
        setMessage('已完成系统分享操作。');
      } else { await download(); }
    } catch (e) {
      if (e.name !== 'AbortError') setMessage('系统分享未完成，请点击“保存图片”后分享。');
    } finally { setSharing(false); }
  }
  if (!record) return <p>还没有可生成图片的笔记。</p>;
  return <div className="note-share">
    {records.length > 1 && <label className="share-picker">选择笔记<select aria-label="选择要分享的笔记" value={record.id} onChange={e => setId(e.target.value)}>{records.map(r => <option key={r.id} value={r.id}>{noteDate(r)} · {r.side === 'left' ? '左' : '右'} · {r.region}</option>)}</select></label>}
    <p className="tiny">一份笔记，一张完整长图。上下滑动预览，再保存或分享。</p>
    <div className="share-preview" aria-busy={!ready && !error}>
      {ready ? <img src={asset.url} alt={`${record.region}的详细身体笔记，包含自查感受、行动时长和当时的提醒`} /> : <p role="status">{error || '正在生成清晰长图…'}</p>}
      {error && <button className="secondary" onClick={() => setAttempt(n => n + 1)}>重新生成</button>}
    </div>
    <div className="share-actions"><button className="secondary" disabled={!ready || sharing} onClick={download}><Download size={18} />{__MINITOOL_BUILD__ ? '保存到相册' : '保存图片'}</button>{!__MINITOOL_BUILD__ && <button className="primary" disabled={!ready || sharing} onClick={share}><span>{sharing ? '分享中…' : '分享图片'}</span><ShareNetwork size={18} /></button>}</div>
    <p className="share-status" role="status">{message || 'PNG 高清长图 · 在本机生成'}</p>
  </div>;
}
