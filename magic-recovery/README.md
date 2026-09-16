# Magic Recovery · 小程序式交互原型

面向高频运动者的腿部自我观察与轻柔活动工具。v4 将自查收紧为三个主要屏幕，保留已确认的黑色、银灰、运动橙风格和 Human Atlas 真实几何。

## 运行

Node.js 22+；进入本目录后运行：

```bash
npm ci
npm run dev -- --host 0.0.0.0 --port 4173 --strictPort
npm run check
npm run build
```

浏览器预览：http://localhost:4173/ 。生产静态文件位于 `dist/client/`。

## 多屏链路

首页 → **定位 → 轻触动画 + 感受记录 → 建议 + 3D 跟练** → 可跳过的反馈弹层 → 保存。

运动背景在定位页按需选择；准备姿势、具体动作要点、建议依据和详细处理说明点击后展开。异常情况直接进入一屏处理建议，可保存和回看。

- 首页 / 动作 / 记录使用底部导航；进入自查后隐藏导航，改用阶段进度和固定底部主按钮。
- 每步支持返回；修改区域会重置依赖该区域的回答。浏览器返回键也会维护页面状态。
- 暂存退出后可从首页继续，当前标签页刷新后仍可恢复进度，旧多步草稿会迁移至简化屏幕。
- 草稿通过 `sessionStorage` 暂存，只用于当前浏览器会话；完成后移除草稿。
- 笔记保存在 `localStorage`，沿用 v1 键名和记录兼容；完成时按会话 ID 写入，防止重复条目。
- 记录详情可发起复查，继承区域、左右侧与运动，并重新记录当前感受；新记录关联前一次记录。
- 异常分支直接显示更合适的下一步，不进入普通跟练；完成页继续保留原求助建议。
- 动作库先进入自查；根据当前报告的感受决定是否提供动作。
- 计时按实际经过时间累计，支持暂停和提前结束。离开页面、打开弹层或切至后台都会暂停。跟练动画由实际计时驱动；独立示范播放不累计活动时长。
- 记录可导出为 JSON、查看详情和删除。不生成恢复评分，不自动推送通知。

## 3D 与内容

- 五个区域 × 左右两侧：大腿前 / 后 / 内侧，小腿后侧 / 前外侧。
- 186 个真实肌肉和骨骼网格，146,586 个三角面，约 3.93 MiB。
- 点选、拖动旋转、正背侧面与缩放；轻触阶段自动放大所选区域，手指在肌群表面示范靠近、停留、抬起，以及左右对比。
- 五种全身动作示意：坐姿伸膝、扶椅屈膝、坐姿滑脚跟、支撑小腿勾脚、脚踝画圈。包含座椅、支撑垫、运动轨迹、方向提示、镜像和视角切换。跟练人物采用同一 Human Atlas 的真实皮肤、肌肉和骨骼网格，190 个源网格约 5.02 MiB；通过 11 个绑定关节及 GPU 蒙皮驱动，并合并为 3 个材质绘制批次。动作是教学近似，不是个人生物力学模拟。
- 模型全部本地提供；没有模型 CDN、账户、分析追踪或数据后端；字体使用系统字体。

## 当前边界

这是按微信小程序导航习惯设计的 **H5 交互原型**，不是可直接上传微信开发者工具的原生小程序工程。尚未接入 AppID、登录、微信存储 API、支付或订阅消息。迁移至原生小程序时，需要分别适配导航、生命周期、Canvas/WebGL 与文件加载；这些不属于本轮已完成范围。

本工具用于自我观察和舒缓教育，不能通过触摸诊断损伤或排除血栓等疾病。症状分流为保守产品提示，未经临床验证。正式公开前需要专业内容审阅。动画以文字中的支撑姿势和个人舒适范围为准。

## 主要文件

- `src/App.jsx`：独立屏幕、底部导航、退出弹层、计时、记录与复查。
- `src/flow.js`：流程准入、前后步骤、草稿校验、单条记录生成与幂等保存。
- `src/LegScene.jsx`：Three.js 几何、拾取、动画；保留 v1 数据与交互。
- `src/touchGuide.js`：三维手指与轻触阶段状态。
- `src/MovementScene.jsx`、`src/AtlasRig.js`、`src/motions.js`：全身人物、支撑物与五类运动姿态。
- `src/preferences.js`：本机常用部位、左右侧、运动选择；不携带历史症状进入新自查。
- `src/data.js`：肌群、轻触文案、异常症状和分流规则。
- `src/styles.css`：全屏手机体验和桌面预览外壳。
- `scripts/validate.mjs`：几何、左右映射、分流、多屏准入、恢复草稿和重复保存检查。
- `scripts/extract-atlas.py`、`scripts/extract-movement-atlas.py`：从上游 `public/models` 提取定位与跟练模型。
- `qa/v1-source/`：改造前源代码留档。
- `qa/v4/`、`design-qa.md`：本轮验收截图和范围；v2 为已认可风格的视觉基线。

## 署名与参考

- Human Atlas：https://github.com/ashemag/human-atlas
- BodyParts3D © The Database Center for Life Science，CC BY 4.0；完整署名见 `public/ATTRIBUTION.md`。
- 上游 MIT 应用许可见 `public/HUMAN-ATLAS-LICENSE.txt`。
- https://www.nhs.uk/live-well/exercise/how-to-stretch-after-exercising/
- https://www.nhs.uk/conditions/sprains-and-strains/
- https://www.nhs.uk/conditions/deep-vein-thrombosis-dvt/
- https://www.cdc.gov/niosh/rhabdo/signs-symptoms/index.html

## 验证范围

已在 Codex 内置浏览器验证 390×844 主流程、暂存刷新继续、返回修改、保存刷新、复查、异常路径；320×740 窄屏和固定底栏无页面横向溢出。没有真机微信环境、多指手势或低端 GPU 性能验证。


## 本轮验证

- `npm run check`：三屏准入、异常分流、旧草稿迁移、偏好不携带旧症状、真实计时和幂等保存。
- Atlas：源网格保留、二进制边界、蒙皮权重、五种动作的实际顶点形变、左右镜像与稳定支撑。
- 内置浏览器：390×844 主流程，320×740 首屏，反馈跳过后保存、刷新恢复、不适增加后的处理建议。
- `qa/v4/models.html`：独立五动作姿势验收页，不读写用户偏好或记录。
- `npm run build`：静态构建成功；仍有原有大型 Three.js 主包警告，未做真机低端 GPU 性能验证。

## 按摩指引与自由观看教程

- “恢复动作”中的五张卡片直接打开教程，不创建自查、不覆盖草稿、不写入自查结果。
- 教程链接：`#/tutorial/quads`、`hamstrings`、`adductors`、`calves`、`shins`；支持刷新和返回动作库。
- `src/massage.js` 定义五个区域的表面轻抚教学与三段动作节奏；`MassageScene.jsx` 使用现有 Human Atlas 模型，手指轨迹投射到所选肌肉表面。实时 3D 已能清楚展示，所以未使用 GIF。
- `RecoveryTutorial.jsx` 为独立的只读教程，默认按摩指引，可切换左右腿或关节活动。新自查后的跟练也默认显示按摩，可暂停、结束和记录。
- 动画是表面轻抚的手法示意，不模拟压力、不承诺疗效。一般注意事项参考 NCCIH Massage Therapy；新近扭拉伤注意事项参考 NHS Sprains and Strains，链接保留在教程详细做法中。

### 新手部模型

轻触与按摩共用的手已换为真实 Human Atlas / BodyParts3D 皮肤表面网格，含自然掌形、五指、指节和腕部。2196 顶点、4135 三角面，资源约 181 KiB；本地加载并缓存。提取脚本：`scripts/extract-hand.py`，资源：`public/models/hand.json`。原按摩轨迹、左右镜像与暂停控制保留。
