# Magic Recovery v4 · Design QA

final result: passed

## Source and comparison

- Source visual truth: `qa/v2/location.png` (accepted existing app style), plus the pre-edit library capture in this task. The v2 source is a style/layout baseline, not a requirement to preserve the superseded five-stage flow.
- Implementation: `http://localhost:4173/`; captures in `qa/v4/` from the isolated `127.0.0.1` origin. User notes/preferences on localhost were not populated with synthetic checks.
- Full-view side-by-side evidence: `qa/v4/comparison.html`, captured in `qa/v4/comparison.jpg`. Both location images are 390×844 physical pixels, displayed at 390×844 CSS pixels (1:1); no density scaling or cropping. The comparison canvas is 1100×920.
- State: right quadriceps selected. The v4 image additionally has a remembered frequent region; its presence is expected.
- Intentional changes: three-stage progress, shorter headline, sport in an optional selector, larger available anatomy area, removal of redundant selection summary. All regions and the primary action fit the first viewport.

## Five required surfaces

- Typography: retained system Chinese sans-serif and hierarchy. Core headings are one line where space allows; paragraph content has become short labels or optional sheets. No required form label truncates at 320px.
- Spacing/layout: retained mobile shell and fixed primary action. Verified 390×844 and 320×740 core screens. Expanded help and historical record lists intentionally scroll; content is not forcibly clipped for large accessibility text sizes.
- Colors/tokens: retained near-black surfaces, silver anatomy, muted labels and orange selection/action states.
- Asset quality: original Human Atlas leg mesh remains on location/touch; the exercise person now uses original Atlas skin plus muscular/skeletal meshes with GPU skinning. Five fixed left-side poses inspected together in `atlas-five-poses.jpg`; right-side movement exercised through the primary flow. Models remain educational pose approximations, without finger-grip or physiological simulation.
- Copy/content: removed separate sport, touch confirmations, result confirmation, preparation and settling gates. Action instructions, supports, discomfort guidance and rationale remain available on demand. Emergency/care outcomes retain visible next actions and saving.

## Findings and corrections

1. [P2, resolved] 320px home: the previous latest-record card ran below the fold. Removed the extra section heading, reduced the hero height and condensed the record card. Post-fix: `home-320.jpg` shows the complete card and navigation.
2. [P2, resolved] Atlas standing pose: narrow chair support did not visibly meet the palms. Expanded its support surface. A wrist-rotation experiment pinched the elbow mesh; reverted that experiment. Post-fix: `atlas-five-poses.jpg` shows continuous arms and visible support. Fine finger contact remains an illustrative limitation.
3. [P2, resolved] Small-screen library: fifth card reached the bottom navigation. Removed repeated per-card timing subtitles and condensed icon/card height. Post-fix: `library-320.jpg` shows all five actions above navigation.

No remaining actionable P0/P1/P2 findings for this prototype scope.

## Focused checks

`touch-320.jpg` checks the 3D hand, symptom buttons, slider labels, onset choices, help links and primary action at native size. `recovery-320.jpg` checks model framing, playback, timer and ending/stopping actions. Separate focused crops were unnecessary because these native screenshots make the controls legible.

Other evidence: `location-390.jpg`, `touch-390.jpg`, `recovery-390.jpg`, `care-320.jpg`, `stopped-care-390.jpg`.

## Functional verification

- Main three-screen route: location → touch + fresh answers → advice with actual movement.
- 3D demonstration does not count as exercise; start counts, pause and sheets stop counting, early end opens optional feedback. Skipping feedback stores null rather than an inferred score.
- Saved a completed note and a care plan; refreshed an in-progress session and resumed successfully.
- Reported sharp pain and sudden onset goes to actionable care; stopping exercise gives a support/observation plan. Rules and priority covered by automated checks.
- `npm run check`: geometry/buffer bounds, source mesh identity, normalized skin weights, actual mesh deformation in all five motions, stable supports, mirrored limbs, preferences, legacy drafts, safety routing and record idempotency.
- `npm run build`: succeeds. Existing main-bundle size warning remains.
- No separate console-log capture, physical-device touch test, native WeChat runtime test or low-end GPU benchmark was performed. Browser rendering and interactions above were directly observed.

## Implementation checklist

- [x] Genuine Atlas exercise geometry
- [x] Three primary screens and optional feedback
- [x] Details revealed on demand
- [x] Mobile first-viewport checks
- [x] Legacy drafts / remembered preferences / records preserved
- [x] Safety outcomes retain actionable care paths
- [x] Build and relevant automated checks

## v5 addendum — Massage and direct tutorial access

final result: passed

- Preserved v4 colors, type and mobile layout. This targeted addition uses existing Atlas anatomy and the existing animated hand, extended from stationary touch to a projected stroke across the muscle surface.
- Tutorial screenshots: `qa/v5/tutorial-quads-390.jpg`, `tutorial-shins-320.jpg`, `library-390.jpg`, `guided-massage-320.jpg`. Native viewport sizes match filenames. No visual source replacement or generated raster asset was needed.
- Direct tutorial: library card → massage tutorial, with no assessment prompt. Tested pause, reset, left/right, joint-activity switch, header back, and valid hash navigation.
- Tested draft independence: paused a quadriceps self-check, opened the hamstring tutorial from the library, then resumed the original quadriceps self-check with its answers intact.
- A same-document direct hash initially fell back to home because it had no history state. Fixed by resolving validated public tutorial hashes in the popstate handler; verified by navigating directly to the adductor tutorial. Invalid region names fall back to home.
- Tested 390×844 direct massage tutorial and 320×740 direct/after-assessment massage. Main instructions and controls fit the first viewport; expanded detail scrolls intentionally.
- `npm run check` covers five massage strokes, bounded travel, contact/lift phases, mirrored pacing, direct tutorial route validation and preservation of legacy movement drafts. Existing anatomy, assessment and records checks continue to pass.
- Massage content describes gentle surface stroking, not deep pressure or treatment of an injury. Sources appear in detailed guidance. No clinical efficacy or personal suitability claim is made by opening a tutorial.
- Limitations: hand is an illustrative model, pressure is not simulated; native WeChat and low-end GPU performance remain untested. Real-time 3D communicates the requested movement, so a GIF fallback was not produced.

## v6 addendum — Continuous anatomical hand

- Replaced the primitive glove with a 2196-vertex, 4135-triangle hand extracted from the original licensed BodyParts3D Skin surface. Removed capsule fingers, separate joint spheres, colored finger pads and the black wrist ball.
- Retained the three-phase touch/massage animation and mirroring. Adjusted the close-up target slightly downward to include the longer anatomical wrist.
- Checked the right and left calf tutorial at 390×844; capture: `qa/v6/atlas-hand-left-390.jpg`. Natural finger lengths, thumb and continuous palm/wrist replace the old segmented form.
- Geometry/index bounds and unit normals verified. Existing `npm run check` passed; production build passed. Async load errors are surfaced, and unmounted scenes do not receive late-loaded meshes.
- This remains an illustrative hand pose, not a simulation of finger pressure.

final result: passed

## v7 addendum — Contact, effort and instructional limits

- Added a shared palm-side contact diagram and visible index/middle/ring finger-pad guidance to direct tutorials and guided recovery. Thumb and little finger remain relaxed. This is explicitly a demonstration convention, not a validated regional prescription.
- Added sensory effort limits (surface gliding, no deep compression or additional pain), one-stroke reassessment, stop signals, and expanded posture/source explanations. No invented force units or treatment duration.
- Preserved the continuous Atlas hand. The separate diagram identifies contact anatomy; the 3D overlay explicitly says it illustrates the path and does not simulate pressure. No claim of rigged individual contact or clinical validation.
- General references: NCCIH massage evidence/risks, NHS acute sprain/strain care, and Human Kinetics technique principles. None is claimed to validate the exact three-finger convention.
- Automated flow/anatomy/animation checks and production build passed. Existing bundle-size warning remains. Local server returned HTTP 200. No new browser screenshot/interaction QA in this targeted content update; mobile CSS reduces scene height to make space for the visible guidance, with expanded details remaining scrollable.

## v8 addendum — Repetitions and intended relief

- Added first-screen comfort goals to all five massage and joint-activity tutorials and the guided recovery heading. Library cards now show the intended relaxation goal and introductory repetition count instead of a 60-second duration.
- Shared practice guidance defines one repetition and one introductory round: try one, only add two if comfortable, then stop and reassess. This is an explicitly labelled lesson convention, not a validated therapeutic dose, a daily prescription or a count inferred from the animation.
- Labelled touch as self-check localization and recovery as massage relaxation / gentle activity. The existing massage animation remains a surface glide, not diagnostic palpation or kneading.
- Benefit copy describes intended relief of mild tightness or stiffness without injury-healing promises. NHS knee/ankle exercise pages informed the movement distinction; clinical injury protocols and repetition counts were not transplanted into a universal massage prescription.
- npm run check and npm run build passed; local server returned HTTP 200. Existing bundle-size warning remains. No new browser interaction or screenshot QA was performed for this content change.

## v9 addendum — Document-based massage and continuous lower body

- Read the complete user-provided expanded seated/supine DOCX, including all table cells and original hyperlink targets. No illustrations were embedded. Retained an unchanged local download in public/guides and checked the relevant Physitrack source pages.
- Added region-specific selectors for palm circles, broad strokes, gentle whole-hand kneading, cautious thumb contact, light strokes and supine supported hamstring knee motion. All selected techniques update contact diagrams, effort cues and repetition definitions. Thin shin tissue remains light-touch only.
- Added a smooth curl morph to the original Atlas hand, distinct circular surface-projected paths and cup/release pacing. These are illustrative gestures; finger/tissue contact and applied force are not physically validated. The supine tutorial uses the same original full-body Atlas model with stable supported thigh and a fixed-length moving lower leg.
- Restored every original Skin triangle, including pelvis and lower limbs, over all retained anatomical layers. Added subtle region tint and a pelvis-only shorts tint. Corrected arm/leg weight assignment boundaries, blended the shoulder attachment and removed disproportionate foot scaling.
- Checked 390×844 calf kneading/thumb selection, left/right switching, repaired calf joint activity, and supine hamstring tutorial; checked 320×740 quadriceps sweep selection. Captures: qa/v9/calves-knead-390.jpg, quads-sweep-320.jpg, movement-fixed-390.jpg, hamstrings-supine-390.jpg. Longer details remain scrollable.
- npm run check and npm run build passed. Regression checks now cover full original skin triangle count, no arm weights on lower outer thighs, distinct gesture paths/curl/release, bounded values and stable mirrored supine shin length. Existing bundle-size warning remains. No native WeChat, low-end GPU or clinical validation is claimed.
- The original document contains no universal per-technique repetition prescription. Introductory 1–3 repetitions remain explicitly the app's practice structure. Removed trigger-point hunting and arm-assisted deep pressure from the adapted self-care tutorial and explained those adaptations in the source notes.

## v10 addendum — Care advice continues to massage learning

- Replaced the save-only care footer with a primary “继续查看按摩指引” action and optional direct save. All care cases can reach the selected-region tutorial; urgent calling remains visible in emergencies.
- Added retained care context to tutorials, derived from the untouched draft so refresh and back retain risk information. Tutorial back returns to care advice; its footer saves advice and notes with no fabricated after score or activity duration.
- Educational demonstrations begin paused, remain manually playable, and show a compact current-advice reminder. Trial repetition invitations are omitted in this context. Normal direct tutorials and authorized recovery practice remain available as before.
- Browser verified on the isolated 127.0.0.1 origin at 390×844: sudden-onset answer → care → tutorial → refresh → play/pause → care → tutorial → save. Completion showed actual practice 0 seconds and no post-activity score.
- Regression tests cover injury, numbness, strong pain, stopped practice, unilateral swelling and emergency contexts; assert preserved answers, refresh reconstruction, no practice authorization, no added seconds and honest care record creation. npm run check and production build passed; existing bundle-size warning remains.

## v11 addendum — Local references and concrete notices

- Replaced reference anchors in massage details, care details, the legacy care component and about content with an in-app text reference component. Removed external/new-tab document and model-project links. Model ownership, adaptation notes and license/source identifiers remain plain text.
- Changed generic medical-referral phrasing to concrete current-action language without weakening emergency urgency or changing risk routing. The care → educational massage tutorial → save path is intact. No assumption is made that a term is platform-banned or that this change guarantees approval.
- Replaced all tel links with an accessible static emergency-number panel; added format-detection metadata to suppress automatic phone/email/address linking in supporting browsers. Local record export still uses its existing Blob download.
- Regression scan confirms all rendered anchor tags target in-app hashes and no window.open/location navigation handler exists. Emergency urgency and risk routing assertions pass. npm run check and production build passed; existing bundle-size warning remains. No additional browser QA was performed for this text/link replacement.

## v12 addendum — Supine waist and arm intersections

- Reproduced the reported black waist triangles and overly long reaching hands. Coordinate-only skin assignment treated parts of the waist as forearms; internal anatomical layers could also protrude through the skin.
- Added connected-component arm/torso classification below the armpit, retained shoulder blending, and restricted the teaching-person draw surface to complete original skin. Internal anatomy remains in the loaded data.
- Moved wrist targets behind/below the supported thigh and solved elbow positions with constant upper-arm and forearm lengths. This prevents uniform forearm scaling from enlarging the attached hands into the thigh.
- Visually checked left and right supine lateral views and playback. Captures: qa/v12/supine-left-side.jpg and supine-right-side.jpg. The waist triangle artifacts are absent and the hands approach from beneath the thigh.
- Added actual mesh-connectivity assertions for torso/arm membership and arm-length checks across five cycle phases for both sides. Visible-movement tests now sample only rendered meshes. npm run check and build passed; no general-purpose soft-tissue collision simulation is claimed.

## v13 — Opaque sports shorts

- Replaced the pelvis vertex tint with an independent opaque charcoal sports garment, including a waist band and leg hems.
- Removed underlying covered pelvis triangles from rendering so genital anatomy cannot protrude through clothing; source assets remain intact.
- Garment shares the existing pelvis/thigh skeleton. Regression checks cover all five movement types and both sides of the supine cycle; build passes.
- No browser visual inspection was performed for this change.

## v14 — Garment fit and supine hands

- Replaced the procedural shorts with a garment tailored to the Atlas skin, with smoothed/flattened front, straight openings and a 9 mm surface offset.
- Retained one outer shell instead of drawing the scan's two overlapping surfaces.
- Moved support wrists laterally and below the thigh, preserving fixed arm lengths.
- Visually checked supine left/right lateral views, frontal view and seated knee movement at 480×950. Palms approach the back of the thigh without the previous visible insertion. This is a pose correction, not a general physical collision simulator.

## v15 — Screenshot-reported seam and finger issues

- Replaced snapped garment boundaries with triangle-plane clipping and continuous three-bone crotch weights.
- Added two independent wrist bones, smooth forearm-to-hand weights and a supine hand orientation along the thigh.
- Added a regression using actual deformed palm/finger vertices versus a 70 mm thigh-axis clearance capsule, both sides and five phases. This is a conservative inner-volume regression, not a complete mesh collision solver.
- Inspected enlarged seated front crotch/cuffs and supine side hand/cuff images; verified mirrored side and all existing animation/flow checks.

## v16 — Raised side cuff

- Added native-coordinate fragment clipping for skin under the garment, keeping arm skin unaffected.
- Changed the garment offset from a constant 12 mm to a 6 mm maximum tapering to zero at sewn openings.
- Inspected enlarged calf joint-movement side and oblique seated screenshots; the raised band is no longer visible at these angles. Existing regression checks pass.

## v17 — Cupped and staggered support

- Added a smooth finger curl around the original knuckle region for supine poses only, preserving the original continuous hand surface.
- Oriented each palm toward the thigh and fingers around its underside. Staggered the hands along the thigh instead of aligning fingers in one plane.
- Actual sampled hand vertices have 12 mm minimum mutual separation; regression requires at least 8 mm, plus the existing thigh inner-volume clearance check, on both sides and five animation phases.
- Enlarged side and oblique screenshots inspected. This remains an educational posed model, not a general collision/force simulation.

## Rebind — 51-bone exported character

- Replaced the runtime full-body rig with a Blender-authored hierarchy and exported animation clips. Includes pelvis/spine/chest/neck/head, clavicles, arm/leg chains, wrists, forearm twist and three phalanges per digit.
- Used a single source skin shell and anatomical-region-constrained heat weights. Preserved original bind connectivity and painted continuous cloth weights. Rest bone lengths remain fixed in playback.
- Baked 12 six-second clips: five joint activities and supine support, each left/right. Retargeted the support pose with two-bone arm IK, posed fingers, surface clearance and separate hands.
- Adjusted chair and support coordinates for the actual leg proportions. Production playback uses the GLB AnimationMixer; no direct hand vertex warp. Versioned asset loading prevents stale geometry after rebuild.
- Passed hierarchy/weights/attachment/animation checks for every clip. Dense sampled hand vertices checked against deformed thigh triangles in mirrored supine poses at 0/3 s; no detected penetration in the final measurements, closest contacts within 6 mm. This is mesh pose QA, not a medical accuracy certification or a general collision simulator.
- Reviewed large side/oblique/skeleton views and 390×844 tutorial playback. Review page: `/qa/rebind/rig-review.html`. Authoring sources: `assets/rig/`.

## Palm frame correction — 2026-09-16

- The reported open/inverted hand came from independently aligning phalange long axes without preserving palm roll. Mapped complete source/target frames for the hand and each non-thumb phalanx; the thumb inherits the hand frame. Curled fingers toward the posterior thigh.
- Found support targets outside practical fixed-arm reach. Flexed the supported hip toward the torso, fitted wrist positions for the asymmetric source hands, and made unreachable support targets a build error. Exported all 12 clips again and refreshed the model version.
- Added actual deformed palmar-normal checks and bent-elbow checks. Both mirrored support poses pass contact, surface clearance and hand separation at 0, 1.5, 3 and 4.5 seconds. Final measured closest hand contacts are approximately 0.7–1.7 mm; no penetrating sampled hand vertices were detected in the final contact measurements. These are pose checks, not a general collision simulation.
- Inspected enlarged side/oblique views on both sides and the actual tutorial canvas. Captures are in `qa/palm-frame/`. Full `npm run check` and production build passed; the pre-existing bundle-size warning remains.

## Whole-pose correction — 2026-09-16

- Rebuilt the supine motion around actual fixed-length knee positions. The shin moves from 1.65 to 2.00 radians from downward; the ankle follows the shin. The foot no longer folds into the shorts or resting leg, and the moving calf clears the support fingers throughout the cycle.
- Changed the grip to approach around the actual posterior thigh. Source-normal checks now distinguish posterior contact from simply touching any part of a thigh. The anatomical tint and default camera show that region. Both wrists remain near neutral (approximately 16–18 degrees in this clip), with forearm twist distributed before the palm.
- Repainted elbow/wrist transitions and a continuous axillary transition. Clipped visible skin now retains original-face weight provenance and winding, avoiding mistaken transfers between nearly touching torso and arm surfaces. Sewn cuff weights match the corresponding exposed skin; 199 paired seam vertices stay aligned across all 12 clips.
- Added exact triangle-intersection checks among hands, both legs and shorts, plus palm coverage, anatomical posterior contact, wrist volume, knee motion and foot clearances. Both sides at 13 phases each pass. The final audit is `qa/whole-pose/surface-audit.json`; minimum sampled foot/shorts separation is about 22 cm, and foot/resting-leg separation about 30 cm. These measurements are geometry QA, not force or clinical-range guidance.
- Reviewed both lateral views, head-side, top and oblique views, including bent/extended endpoints and close-ups; checked a seated calf clip for binding regressions and the actual tutorial page. Current review captures include `right-side-bent.jpg`, `right-side-extended.jpg`, `right-head-final.jpg`, `left-side-bent.jpg`, `left-top-extended.jpg` and `tutorial-final.jpg` in `qa/whole-pose/`.
- Full `npm run check` and production build pass. Existing bundle-size warning remains. The source remains a low-resolution educational scan; this work does not add soft-tissue/contact-force simulation.

## 2026-09-16 — Region/action library and duration

- Home: dedicated oblique hero camera, closer crop, cool rim light, restrained scan ring and lower-body callouts; camera changes isolated from the assessment/touch views.
- Library: 7 regional entries / 24 region-and-action choices, with actual technique selection before opening the tutorial. This is 6 shared hand techniques and 5 shared joint activities, not 24 unique exercises or exhaustive deep-muscle coverage.
- Added lateral thigh (vastus lateralis / IT-band context) and separated lateral calf from the anterior shin. Surface targets use existing Atlas geometry; updated the lateral anchors after ray-contact validation caught off-surface initial coordinates. Start/mid/end contacts now hit intended soft-tissue surfaces on both sides.
- Duration: 30s / 60s / 300s selector in action chooser, direct tutorial and guided recovery. Longer plans switch to hands-off rest after the initial 30s; first-screen count remains 1–3 trial repetitions. Pausing, resuming, action switching, side switching, completed countdown state and validated deep-link options are supported. Guided records count actual practice separately from rest/planned time; direct library viewing does not modify assessment drafts or create records.
- Care-context educational lessons retain their advice, sources and preservation rules; they do not show the practice timer.
- Visual browser review: home, region grid, calf action list and massage tutorial at 390×844 and 320×740 via dedicated QA iframe viewports. Verified direct outer-thigh/outer-calf geometry and existing full-body ankle-circle animation. Both mobile screens expose the essential controls without opening details.
- Interactive browser review: selected 5 minutes on the calf action page; entered the exact kneading action with 05:00. Ran outer-thigh 5-minute plan through practice -> rest, paused/resumed it, changed action and side, then changed duration and retained the selected left side. Side-camera directions for new regions use an oblique surface-aligned view.
- Validation: existing flow/model/content regressions passed; 24 action links × 3 durations, invalid option fallback, new-region care context, actual-practice accounting, and lateral surface-contact checks passed. Bound rig check retained all 12 clips, 199 matched cuff vertices and 26 support-pose samples with no audit errors. Production build passed; existing bundle-size advisory remains.
- QA artifacts: `qa/recovery-library/review.html`, `regions-mobile.jpg`, `actions-mobile.jpg`; tests are on the independent 127.0.0.1 browser origin, leaving localhost assessment data intact.

## 2026-09-16 — Main-flow simplification and upright home

- Home camera uses Y-up without roll and a closer near-frontal framing. Saved `qa/recovery-library/home-upright-mobile.jpg` at 390×844 and 320×740.
- Main location screen places all 7 region buttons beside the model. Main feeling screen keeps explicit symptom/onset reporting and the 0–10 intensity range while reducing duplicate headings, control rows and helper copy. The progress bar now shows the actual three steps without a second counter.
- New `GuidedRecovery` reads the same `actionsFor()` catalog as the library. The named action switcher and all three duration choices are prominent above the viewer; method tabs, separate technique tabs and the second timer panel are removed. Full instructions remain in a sheet. Small-screen follow-along framing retains contact/pressure/count and the footer on the first screen.
- Guided drafts now persist the exact `recoveryAction`; action/duration changes keep practice seconds separate from plan time. Valid main-flow refreshes resume in place, with the region's correct camera view. Legacy drafts and care context are preserved. Saved records include the selected action and plan time; care-only records omit an action name.
- Browser walkthrough on the independent 127.0.0.1 origin: home → location → calf → symptoms/onset → guided recovery → change from knead to sweep → choose 5min → fresh page load at recovery. Exact action/time survived. Mobile first screens reviewed at 390×844 and 320×740; saved `qa/recovery-library/guided-mobile.jpg`.
- All existing validation cases and new main-flow cases passed: every region/action choice, changing duration without inventing practice, fresh JSON restore, record fields, migration of old method-only drafts, and direct-route protection for saved care states. Production build passed with the existing bundle-size advisory. No rig mesh, weights or baked animation changed in this iteration.
- End-to-end completion verified in the browser: started the 5-minute sweep plan, ended early, skipped the optional post-score, then inspected the saved record. It correctly showed 全掌推按, planned 5 minutes, actual 26 seconds and after-score 未记录. Deleted only this newly created test record through the UI; localhost user data was not changed.


## 2026-09-16 — stacked region selection and shareable body notes

- Restored the requested model-above / region-grid-below layout. Visually checked 390×844 and 320×740: seven regions, remembered choices and primary continuation fit the first screen. Evidence: `qa/recovery-library/location-stacked-mobile.jpg`.
- Added per-record 1080px PNG generation entirely on device, full care guidance and notes included. History offers note selection; detail opens the current note. Preview scrolls independently; downloads and native file share are explicit actions. Unsupported native sharing falls back to downloading; no external destination or upload.
- Walked the protect branch on the isolated 127.0.0.1 origin, timed supported rest and saved a record. Downloaded and inspected the actual 1080×3134 PNG: 11 seconds of rest, zero massage activity, no invented follow-up score. Fixed Chinese punctuation wrapping. Evidence: `qa/recovery-library/note-share-example.png`, `note-share-preview.jpg`. Removed only the test record created by this check and cleaned its temporary downloads.
- Ordinary gentle cases retain normal action/time practice. Protect/settle branches now have optional supported rest with separately persisted seconds and a save action; urgent/emergency branches do not introduce a delay timer. Massage practice restrictions remain for suspected acute injury/red flags. NHS sprain/strain guidance was rechecked; no external product links added.
- Validation covers missing vs zero scores, care content in image data, independent rest accounting, restoration and retained injury guards. Existing app validation and production build passed. Native recipient delivery is not tested or claimed; it depends on browser/system file-share support.
