// Reference metadata is displayed locally as text, never as a navigation target.
export default function ReferenceNotes({ entries, title = "参考资料" }) {
  return <section className="reference-notes" aria-label={title}>
    <h4>{title}</h4>
    <p>教程要点已在应用内整理，以下保留资料名称与来源。</p>
    <ul>{entries.map(([name, id]) => <li key={id || name}>{name.replace("原始教程", "手法参考").replace("本地原文", "用户提供的指南")}</li>)}</ul>
  </section>;
}
export function ModelAttribution() {
  return <details className="model-attribution">
    <summary>模型署名与许可</summary>
    <p>BodyParts3D © The Database Center for Life Science。采用 CC Attribution 4.0 International（CC BY 4.0）许可。</p>
    <p>模型来自 Human Atlas / ashemag 的 BodyParts3D 参考数据。本应用提取并重组腿部与手部网格，调整坐标、材质、蒙皮和演示动作；完整人物外形沿用原始 Skin 表面。</p>
    <p>来源与许可标识（仅作文字署名）：</p>
    <code>https://github.com/ashemag/human-atlas</code>
    <code>https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html</code>
    <code>https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html</code>
    <code>https://creativecommons.org/licenses/by/4.0/</code>
    <p>Mitsuhashi et al. (2009), BodyParts3D: 3D structure database for anatomical concepts. DOI: 10.1093/nar/gkn613。</p>
  </details>;
}
export function EmergencyNumber() {
  return <div className="urgent-call emergency-number" role="note" aria-label="中国大陆急救电话 120">
    <strong>120</strong><span>中国大陆急救电话<small>请使用手机电话拨打</small></span>
  </div>;
}
