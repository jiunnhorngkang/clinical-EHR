/*
 * 臨床內容資料檔：主訴、病史、紅旗徵象、理學檢查、診斷規則與建議
 * ------------------------------------------------------------------
 * 修改或新增主訴只需編輯此檔，不必動 app.js。
 *
 * 項目 (item) 欄位：
 *   id     唯一代碼（同一主訴內不可重複）
 *   label  畫面顯示名稱
 *   hint   (選填) 中文提示
 *   type   'yn'   → 有(+) / 無(-)
 *          'side' → 陰性 / R / L / Bil
 *          'opts' → 自訂選項 options: [{ v, label, text, pos }]
 *                   pos: true 代表此選項視為「陽性」，會用於診斷評分
 *   text   (選填) 病歷輸出用文字，未填則用 label
 *
 * 診斷 (dx) 欄位：
 *   name       診斷名稱
 *   icd        ICD-10-CM，可為字串或依側別 { R, L, B, U }（僅供參考，請自行確認）
 *   criteria   { 項目id: 權重 }，陽性即加分。另可用衍生條件：
 *              __age50 / __age60（年齡 ≥50 / ≥60）、__acute（<6 週）、__chronic（≥12 週）
 *   threshold  分數達此值即列為「建議」並預設勾選
 *   plan       選此診斷時加入的處置建議
 *
 * 紅旗 (redFlags) 為 'yn' 項目，另帶 plan：勾選 (+) 時，建議會置頂並標示警示。
 */

const COMPLAINTS = [
  // ================================================================ 下背痛
  {
    id: 'lbp',
    label: 'Low back pain',
    zh: '下背痛',
    cc: 'low back pain',
    region: 'spine',
    history: [
      { id: 'motion', label: 'Pain aggravated by motion / activity', hint: '活動時加劇', type: 'yn', text: 'pain aggravated by motion' },
      { id: 'rest_relief', label: 'Relieved by rest', hint: '休息緩解', type: 'yn', text: 'pain relieved by rest' },
      { id: 'flex_aggr', label: 'Worse with flexion / prolonged sitting', hint: '彎腰、久坐加劇', type: 'yn', text: 'pain worse with flexion or prolonged sitting' },
      { id: 'ext_aggr', label: 'Worse with extension / prolonged standing', hint: '後仰、久站加劇', type: 'yn', text: 'pain worse with extension or prolonged standing' },
      { id: 'resting_stiff', label: 'Resting stiffness (gelling after inactivity)', hint: '靜止後僵硬', type: 'yn', text: 'resting stiffness after inactivity' },
      { id: 'morning_stiff', label: 'Morning stiffness > 30 min, improves with exercise', hint: '發炎性下背痛', type: 'yn', text: 'morning stiffness > 30 min improving with exercise' },
      { id: 'radiating', label: 'Radiating pain to leg', hint: '下肢放射痛', type: 'side', text: 'radiating pain to leg' },
      { id: 'below_knee', label: 'Radiation below the knee', type: 'yn', text: 'radiation below the knee' },
      { id: 'numbness', label: 'Numbness / tingling of leg', hint: '下肢麻', type: 'side', text: 'numbness/tingling of leg' },
      { id: 'weakness', label: 'Subjective leg weakness', hint: '下肢無力', type: 'side', text: 'leg weakness' },
      { id: 'claudication', label: 'Neurogenic claudication', hint: '走路變遠變痛/麻，坐下或彎腰緩解', type: 'yn', text: 'neurogenic claudication (relieved by sitting/flexion)' },
      { id: 'night_pain', label: 'Night pain', hint: '夜間痛', type: 'yn', text: 'night pain' },
    ],
    redFlags: [
      { id: 'rf_cauda', label: 'Bowel/bladder dysfunction or saddle anesthesia', hint: '疑馬尾症候群', type: 'yn', text: 'bowel/bladder dysfunction or saddle anesthesia',
        plan: 'URGENT: suspected cauda equina syndrome — emergent lumbar MRI and neurosurgical referral' },
      { id: 'rf_progressive', label: 'Progressive neurological deficit', type: 'yn', text: 'progressive neurological deficit',
        plan: 'Progressive neurological deficit — arrange early lumbar MRI and spine surgery consultation' },
      { id: 'rf_fever', label: 'Fever / immunosuppression / IV drug use', hint: '疑感染', type: 'yn', text: 'fever or immunosuppression',
        plan: 'Rule out spinal infection — CBC/DC, ESR, CRP; MRI with contrast if suspected' },
      { id: 'rf_cancer', label: 'History of cancer / unexplained weight loss', hint: '疑腫瘤', type: 'yn', text: 'history of cancer or unexplained weight loss',
        plan: 'Rule out malignancy — ESR, CRP, lumbar X-ray; consider MRI or bone scan' },
      { id: 'rf_fracture', label: 'Significant trauma / osteoporosis / long-term steroid', hint: '疑骨折', type: 'yn', text: 'significant trauma, osteoporosis or long-term steroid use',
        plan: 'Rule out vertebral fracture — lumbar X-ray (AP/lateral); consider BMD (DXA)' },
    ],
    exam: [
      { id: 'rom', label: 'Lumbar ROM', type: 'opts', options: [
        { v: 'full', label: 'Full', text: 'full' },
        { v: 'flex', label: 'Limited flex', text: 'limited in flexion', pos: true },
        { v: 'ext', label: 'Limited ext', text: 'limited in extension', pos: true },
        { v: 'global', label: 'Limited global', text: 'globally limited', pos: true },
      ] },
      { id: 'pain_flex', label: 'Pain on forward flexion', type: 'yn' },
      { id: 'pain_ext', label: 'Pain on extension', type: 'yn' },
      { id: 'para_tender', label: 'Paraspinal muscle tenderness', type: 'side' },
      { id: 'trigger', label: 'Trigger point / taut band', hint: '激痛點', type: 'side' },
      { id: 'sp_tender', label: 'Spinous process tenderness', type: 'yn' },
      { id: 'facet', label: 'Facet loading (Kemp) test', type: 'side' },
      { id: 'slrt', label: 'SLRT', hint: '直膝抬腿', type: 'side' },
      { id: 'slump', label: 'Slump test', type: 'side' },
      { id: 'faber', label: 'FABER (Patrick) test', type: 'side' },
      { id: 'sij', label: 'SIJ provocation (thigh thrust / Gaenslen)', type: 'side' },
      { id: 'wk_l4', label: 'Knee extension weakness (L4)', type: 'side' },
      { id: 'wk_l5', label: 'Ankle DF / EHL weakness (L5)', type: 'side' },
      { id: 'wk_s1', label: 'Plantarflexion weakness (S1)', type: 'side' },
      { id: 'sensory', label: 'Dermatomal hypoesthesia', type: 'side' },
      { id: 'kj', label: 'Decreased knee jerk', type: 'side' },
      { id: 'aj', label: 'Decreased ankle jerk', type: 'side' },
    ],
    dx: [
      { id: 'mech', name: 'Mechanical low back pain (lumbar strain)', icd: 'M54.50', threshold: 3,
        criteria: { motion: 2, rest_relief: 1, para_tender: 1, pain_flex: 1, rom: 1, resting_stiff: 1 },
        plan: [
          'Education: stay active, avoid prolonged bed rest; posture and lifting ergonomics',
          'PT: hot pack, TENS / IFC for pain control',
          'Core stabilization and lumbar stretching exercise program',
        ] },
      { id: 'mps', name: 'Myofascial pain syndrome, lumbar', icd: 'M79.18', threshold: 3,
        criteria: { trigger: 3, para_tender: 1, resting_stiff: 1 },
        plan: [
          'Trigger point injection or dry needling',
          'Stretching of involved muscles; therapeutic ultrasound',
        ] },
      { id: 'radic', name: 'Lumbar radiculopathy (suspected disc herniation)', icd: 'M54.16', threshold: 5,
        criteria: { radiating: 2, below_knee: 2, numbness: 1, weakness: 1, flex_aggr: 1, slrt: 3, slump: 2, wk_l4: 2, wk_l5: 2, wk_s1: 2, sensory: 2, kj: 1, aj: 1 },
        plan: [
          'Lumbar traction and neural mobilization; directional preference (McKenzie) exercise if centralization',
          'Consider gabapentinoid for neuropathic pain',
          'Lumbar MRI if progressive deficit or no improvement after 6 weeks of conservative treatment',
          'Consider NCV/EMG to confirm root level; consider epidural steroid injection',
        ] },
      { id: 'lss', name: 'Lumbar spinal stenosis with neurogenic claudication', icd: 'M48.062', threshold: 4,
        criteria: { claudication: 4, ext_aggr: 2, __age60: 1, numbness: 1 },
        plan: [
          'Flexion-based exercise; stationary cycling for aerobic conditioning',
          'Lumbar spine X-ray (AP/lateral, flexion/extension)',
          'Lumbar MRI and spine surgery referral if walking tolerance is severely limited',
        ] },
      { id: 'facet', name: 'Lumbar spondylosis / facet joint syndrome', icd: 'M47.816', threshold: 4,
        criteria: { ext_aggr: 2, facet: 3, pain_ext: 1, __age50: 1 },
        plan: [
          'Lumbar spine X-ray (AP/lateral)',
          'Avoid repetitive hyperextension; lumbar stabilization exercise',
          'Consider medial branch block / facet joint injection if refractory',
        ] },
      { id: 'sijd', name: 'Sacroiliac joint dysfunction', icd: '', threshold: 4,
        criteria: { sij: 3, faber: 2 },
        plan: [
          'Pelvic stabilization exercise; consider SI belt',
          'Consider ultrasound-guided SI joint injection if refractory',
        ] },
      { id: 'axspa', name: 'Inflammatory back pain, r/o axial spondyloarthritis', icd: '', threshold: 4,
        criteria: { morning_stiff: 3, night_pain: 1, faber: 1, sij: 1 },
        plan: [
          'Check HLA-B27, ESR, CRP; SI joint X-ray',
          'Refer to rheumatology',
        ] },
    ],
    plan: [
      'Acetaminophen or NSAID PRN if no contraindication (renal / GI / CV risk assessed)',
      'Follow-up in 2–4 weeks; re-evaluate if symptoms worsen',
    ],
  },

  // ================================================================ 頸痛
  {
    id: 'neck',
    label: 'Neck pain',
    zh: '頸痛',
    cc: 'neck pain',
    region: 'spine',
    history: [
      { id: 'motion', label: 'Pain aggravated by neck motion', hint: '轉頭加劇', type: 'yn', text: 'pain aggravated by neck motion' },
      { id: 'posture', label: 'Prolonged computer / phone use', hint: '姿勢不良', type: 'yn', text: 'prolonged computer/phone use' },
      { id: 'stiff', label: 'Neck stiffness', type: 'yn', text: 'neck stiffness' },
      { id: 'shoulder_ache', label: 'Shoulder / upper trapezius soreness', hint: '肩頸痠', type: 'side', text: 'upper trapezius soreness' },
      { id: 'radiating', label: 'Radiating pain to arm', hint: '上肢放射痛', type: 'side', text: 'radiating pain to arm' },
      { id: 'numbness', label: 'Numbness / tingling of hand', type: 'side', text: 'numbness/tingling of hand' },
      { id: 'weakness', label: 'Subjective arm weakness', type: 'side', text: 'arm weakness' },
      { id: 'headache', label: 'Occipital headache', hint: '頸因性頭痛', type: 'yn', text: 'occipital headache' },
    ],
    redFlags: [
      { id: 'rf_myelo', label: 'Hand clumsiness / gait disturbance', hint: '疑脊髓病變', type: 'yn', text: 'hand clumsiness or gait disturbance',
        plan: 'Suspected cervical myelopathy — cervical MRI and spine surgery referral; avoid cervical traction and manipulation' },
      { id: 'rf_trauma', label: 'Significant trauma', type: 'yn', text: 'significant trauma',
        plan: 'Rule out cervical fracture/instability — cervical X-ray (consider flexion/extension views or CT)' },
      { id: 'rf_fever', label: 'Fever / immunosuppression', type: 'yn', text: 'fever or immunosuppression',
        plan: 'Rule out infection — CBC/DC, ESR, CRP; MRI if suspected' },
      { id: 'rf_cancer', label: 'History of cancer / unexplained weight loss', type: 'yn', text: 'history of cancer or unexplained weight loss',
        plan: 'Rule out malignancy — cervical X-ray, ESR, CRP; consider MRI' },
    ],
    exam: [
      { id: 'rom', label: 'Cervical ROM', type: 'opts', options: [
        { v: 'full', label: 'Full', text: 'full' },
        { v: 'rot', label: 'Limited rotation', text: 'limited in rotation', pos: true },
        { v: 'ext', label: 'Limited ext', text: 'limited in extension', pos: true },
        { v: 'global', label: 'Limited global', text: 'globally limited', pos: true },
      ] },
      { id: 'fhp', label: 'Forward head / rounded shoulder posture', type: 'yn' },
      { id: 'trap_tender', label: 'Upper trapezius tenderness', type: 'side' },
      { id: 'trigger', label: 'Trigger point / taut band', hint: '激痛點', type: 'side' },
      { id: 'facet_tender', label: 'Cervical facet tenderness', type: 'side' },
      { id: 'spurling', label: 'Spurling test', type: 'side' },
      { id: 'abd_relief', label: 'Shoulder abduction relief sign', type: 'side' },
      { id: 'ultt', label: 'ULTT (median nerve bias)', type: 'side' },
      { id: 'wk_c5', label: 'Shoulder abduction weakness (C5)', type: 'side' },
      { id: 'wk_c6', label: 'Wrist extension weakness (C6)', type: 'side' },
      { id: 'wk_c7', label: 'Elbow extension weakness (C7)', type: 'side' },
      { id: 'wk_c8', label: 'Finger flexion weakness (C8)', type: 'side' },
      { id: 'sensory', label: 'Dermatomal hypoesthesia', type: 'side' },
      { id: 'dtr_dec', label: 'Decreased biceps / triceps reflex', type: 'side' },
      { id: 'hoffmann', label: 'Hoffmann sign', type: 'side' },
      { id: 'hyperreflexia', label: 'Hyperreflexia (UE/LE)', type: 'yn' },
    ],
    dx: [
      { id: 'strain', name: 'Cervicalgia (mechanical neck pain)', icd: 'M54.2', threshold: 3,
        criteria: { motion: 2, stiff: 1, posture: 1, rom: 1, trap_tender: 1 },
        plan: [
          'Education: posture correction, screen at eye level, regular breaks from desk work',
          'PT: hot pack, TENS / IFC',
          'Deep neck flexor strengthening and scapular stabilization exercise',
        ] },
      { id: 'mps', name: 'Myofascial pain syndrome, upper trapezius', icd: 'M79.18', threshold: 3,
        criteria: { trigger: 3, trap_tender: 1, shoulder_ache: 1, posture: 1 },
        plan: [
          'Trigger point injection or dry needling',
          'Upper trapezius / levator scapulae stretching; therapeutic ultrasound',
        ] },
      { id: 'radic', name: 'Cervical radiculopathy', icd: 'M54.12', threshold: 5,
        criteria: { radiating: 2, numbness: 1, weakness: 1, spurling: 3, abd_relief: 2, ultt: 1, wk_c5: 2, wk_c6: 2, wk_c7: 2, wk_c8: 2, sensory: 2, dtr_dec: 1 },
        plan: [
          'Cervical traction (if no myelopathy) and neural mobilization',
          'Consider gabapentinoid for neuropathic pain',
          'Cervical spine X-ray; MRI if progressive deficit or no improvement after 6 weeks',
          'Consider NCV/EMG to confirm root level and exclude entrapment neuropathy',
        ] },
      { id: 'spondylosis', name: 'Cervical spondylosis / facet arthropathy', icd: 'M47.812', threshold: 4,
        criteria: { facet_tender: 3, stiff: 1, __age50: 1, rom: 1 },
        plan: [
          'Cervical spine X-ray (AP/lateral)',
          'Range-of-motion and isometric strengthening exercise',
          'Consider cervical medial branch block if refractory',
        ] },
      { id: 'myelo', name: 'Cervical spondylotic myelopathy, suspected', icd: 'M47.12', threshold: 3,
        criteria: { hoffmann: 3, hyperreflexia: 2 },
        plan: [
          'Cervical MRI; refer to spine surgery',
          'Avoid cervical traction and manipulation',
        ] },
      { id: 'cgh', name: 'Cervicogenic headache', icd: 'G44.86', threshold: 3,
        criteria: { headache: 3, facet_tender: 1, rom: 1 },
        plan: [
          'Suboccipital release and deep neck flexor training',
          'Consider greater occipital nerve block if refractory',
        ] },
    ],
    plan: [
      'Acetaminophen or NSAID PRN if no contraindication; consider muscle relaxant short-term',
      'Follow-up in 2–4 weeks; re-evaluate if symptoms worsen',
    ],
  },

  // ================================================================ 肩痛
  {
    id: 'shoulder',
    label: 'Shoulder pain',
    zh: '肩痛',
    cc: 'shoulder pain',
    region: 'limb',
    history: [
      { id: 'overhead', label: 'Pain with overhead activity', hint: '舉手過頭痛', type: 'yn', text: 'pain with overhead activity' },
      { id: 'night', label: 'Night pain / lying on affected side', hint: '夜間痛、壓到痛', type: 'yn', text: 'night pain when lying on affected side' },
      { id: 'stiff', label: 'Stiffness: difficulty combing hair / reaching back', hint: '梳頭、扣內衣困難', type: 'yn', text: 'stiffness with difficulty combing hair or reaching back' },
      { id: 'weak', label: 'Weakness lifting the arm', type: 'yn', text: 'weakness lifting the arm' },
      { id: 'trauma', label: 'Preceding fall / traumatic event', type: 'yn', text: 'preceding fall or trauma' },
      { id: 'click', label: 'Clicking / catching', type: 'yn', text: 'clicking or catching' },
      { id: 'anterior', label: 'Anterior shoulder pain', hint: '前側痛', type: 'yn', text: 'anterior shoulder pain' },
      { id: 'dm', label: 'Diabetes / thyroid disease', type: 'yn', text: 'diabetes or thyroid disease' },
      { id: 'neck_rad', label: 'Pain radiating from neck', hint: '排除頸因', type: 'yn', text: 'pain radiating from neck' },
    ],
    redFlags: [
      { id: 'rf_deform', label: 'Trauma with deformity / inability to move', hint: '疑脫臼骨折', type: 'yn', text: 'trauma with deformity',
        plan: 'Rule out fracture/dislocation — shoulder X-ray (AP, scapular Y, axillary)' },
      { id: 'rf_septic', label: 'Fever with red, hot joint', hint: '疑化膿性關節炎', type: 'yn', text: 'fever with red, hot joint',
        plan: 'URGENT: rule out septic arthritis — CBC, ESR, CRP; joint aspiration; refer to orthopedics' },
      { id: 'rf_cardiac', label: 'Exertional chest pain / dyspnea', hint: '排除心因性轉移痛', type: 'yn', text: 'exertional chest pain or dyspnea',
        plan: 'Rule out cardiac referred pain — ECG; refer to cardiology/ER as indicated' },
      { id: 'rf_cancer', label: 'History of cancer / unexplained weight loss', type: 'yn', text: 'history of cancer or unexplained weight loss',
        plan: 'Rule out malignancy (e.g. Pancoast tumor, metastasis) — chest and shoulder X-ray' },
    ],
    exam: [
      { id: 'arom', label: 'Active ROM', type: 'opts', options: [
        { v: 'full', label: 'Full', text: 'full' },
        { v: 'painful', label: 'Full but painful', text: 'full but painful', pos: true },
        { v: 'limited', label: 'Limited', text: 'limited', pos: true },
      ] },
      { id: 'prom_er', label: 'Passive ER markedly limited (capsular pattern)', type: 'yn' },
      { id: 'arc', label: 'Painful arc (60–120°)', type: 'yn' },
      { id: 'neer', label: 'Neer test', type: 'yn' },
      { id: 'hawkins', label: 'Hawkins-Kennedy test', type: 'yn' },
      { id: 'empty_can', label: 'Empty can (Jobe) test', type: 'opts', options: [
        { v: 'neg', label: '−', text: '(-)' },
        { v: 'pain', label: 'Pain', text: '(+) pain', pos: true },
        { v: 'weak', label: 'Weak', text: '(+) weakness', pos: true },
      ] },
      { id: 'drop_arm', label: 'Drop arm test', type: 'yn' },
      { id: 'er_lag', label: 'ER lag / resisted ER weakness', type: 'yn' },
      { id: 'liftoff', label: 'Lift-off / belly press test', type: 'yn' },
      { id: 'speed', label: "Speed's test", type: 'yn' },
      { id: 'yergason', label: "Yergason's test", type: 'yn' },
      { id: 'groove', label: 'Bicipital groove tenderness', type: 'yn' },
      { id: 'ac_tender', label: 'AC joint tenderness', type: 'yn' },
      { id: 'cross', label: 'Cross-body adduction test', type: 'yn' },
      { id: 'spurling', label: 'Spurling test', hint: '排除頸因', type: 'yn' },
    ],
    dx: [
      { id: 'impinge', name: 'Subacromial impingement / rotator cuff tendinopathy', icd: { R: 'M75.41', L: 'M75.42', B: 'M75.41, M75.42', U: 'M75.40' }, threshold: 4,
        criteria: { overhead: 2, night: 1, arc: 2, neer: 2, hawkins: 2, empty_can: 1 },
        plan: [
          'Activity modification: avoid repetitive overhead activity',
          'Rotator cuff and scapular stabilization exercise',
          'PT: therapeutic ultrasound, hot pack, TENS',
          'Musculoskeletal ultrasound; consider US-guided subacromial steroid injection',
        ] },
      { id: 'tear', name: 'Rotator cuff tear, suspected', icd: { R: 'M75.101', L: 'M75.102', B: 'M75.101, M75.102', U: 'M75.100' }, threshold: 5,
        criteria: { weak: 2, trauma: 1, drop_arm: 3, er_lag: 2, liftoff: 2, empty_can: 2, __age60: 1 },
        plan: [
          'Musculoskeletal ultrasound or shoulder MRI to evaluate tear size',
          'Refer to orthopedics for acute traumatic full-thickness tear or young active patient',
        ] },
      { id: 'frozen', name: 'Adhesive capsulitis', icd: { R: 'M75.01', L: 'M75.02', B: 'M75.01, M75.02', U: 'M75.00' }, threshold: 4,
        criteria: { stiff: 2, night: 1, prom_er: 3, arom: 1, dm: 1 },
        plan: [
          'ROM exercise: pendulum, wall climbing, stretching within tolerance',
          'PT: heat and joint mobilization',
          'Consider hydrodilatation or intra-articular steroid injection',
          'Check HbA1c and thyroid function if not recently done',
        ] },
      { id: 'biceps', name: 'Bicipital tendinitis', icd: { R: 'M75.21', L: 'M75.22', B: 'M75.21, M75.22', U: 'M75.20' }, threshold: 4,
        criteria: { anterior: 2, speed: 2, yergason: 2, groove: 2 },
        plan: [
          'Eccentric strengthening; avoid heavy lifting with elbow flexion',
          'Consider US-guided biceps tendon sheath injection',
        ] },
      { id: 'ac', name: 'Acromioclavicular joint arthropathy', icd: '', threshold: 4,
        criteria: { ac_tender: 3, cross: 3 },
        plan: [
          'Avoid cross-body and overhead loading',
          'Consider US-guided AC joint injection',
        ] },
      { id: 'cervical', name: 'Referred pain from cervical spine, r/o', icd: '', threshold: 3,
        criteria: { neck_rad: 2, spurling: 3 },
        plan: [
          'Evaluate cervical spine (see neck pain work-up)',
        ] },
    ],
    plan: [
      'Acetaminophen or NSAID PRN if no contraindication',
      'Shoulder X-ray (AP/lateral) if not done, to exclude calcific tendinitis or arthritis',
      'Follow-up in 2–4 weeks',
    ],
  },

  // ================================================================ 膝痛
  {
    id: 'knee',
    label: 'Knee pain',
    zh: '膝痛',
    cc: 'knee pain',
    region: 'limb',
    history: [
      { id: 'stairs', label: 'Pain on stairs / squatting', hint: '上下樓梯、蹲痛', type: 'yn', text: 'pain on stairs or squatting' },
      { id: 'theater', label: 'Pain after prolonged sitting', hint: '久坐後痛', type: 'yn', text: 'pain after prolonged sitting' },
      { id: 'stiff', label: 'Morning stiffness < 30 min', type: 'yn', text: 'morning stiffness < 30 min' },
      { id: 'walk', label: 'Pain on weight-bearing / walking', type: 'yn', text: 'pain on weight-bearing' },
      { id: 'swelling', label: 'Swelling', type: 'yn', text: 'knee swelling' },
      { id: 'locking', label: 'Locking / catching', hint: '卡住', type: 'yn', text: 'locking or catching' },
      { id: 'giving', label: 'Giving way / instability', hint: '腿軟', type: 'yn', text: 'giving way' },
      { id: 'twist', label: 'Twisting injury', type: 'yn', text: 'twisting injury' },
      { id: 'medial', label: 'Medial knee pain', hint: '內側痛', type: 'yn', text: 'medial knee pain' },
    ],
    redFlags: [
      { id: 'rf_septic', label: 'Fever with red, hot, swollen joint', hint: '疑化膿性關節炎', type: 'yn', text: 'fever with red, hot, swollen joint',
        plan: 'URGENT: rule out septic arthritis — CBC, ESR, CRP; arthrocentesis with synovial fluid analysis; refer to orthopedics' },
      { id: 'rf_fracture', label: 'Unable to bear weight after trauma', hint: 'Ottawa knee rule', type: 'yn', text: 'inability to bear weight after trauma',
        plan: 'Rule out fracture — knee X-ray (Ottawa knee rule)' },
      { id: 'rf_dvt', label: 'Calf swelling / tenderness', hint: '疑 DVT', type: 'yn', text: 'calf swelling or tenderness',
        plan: 'Rule out DVT — D-dimer and lower-limb venous duplex ultrasound' },
      { id: 'rf_cancer', label: 'History of cancer / unexplained weight loss / night pain', type: 'yn', text: 'history of cancer, weight loss or night pain',
        plan: 'Rule out bone tumor — knee X-ray; consider MRI' },
    ],
    exam: [
      { id: 'rom', label: 'Knee ROM', type: 'opts', options: [
        { v: 'full', label: 'Full', text: 'full' },
        { v: 'flex', label: 'Limited flex', text: 'limited in flexion', pos: true },
        { v: 'ext', label: 'Flexion contracture', text: 'lacking full extension', pos: true },
      ] },
      { id: 'varus', label: 'Genu varum deformity', type: 'yn' },
      { id: 'effusion', label: 'Effusion (bulge / ballottement)', type: 'yn' },
      { id: 'crepitus', label: 'Crepitus', type: 'yn' },
      { id: 'mjl', label: 'Medial joint line tenderness', type: 'yn' },
      { id: 'ljl', label: 'Lateral joint line tenderness', type: 'yn' },
      { id: 'pes', label: 'Pes anserine tenderness', type: 'yn' },
      { id: 'grind', label: 'Patellar grind (Clarke) test', type: 'yn' },
      { id: 'pf_tender', label: 'Patellar facet tenderness', type: 'yn' },
      { id: 'mcmurray', label: 'McMurray test', type: 'yn' },
      { id: 'thessaly', label: 'Thessaly test', type: 'yn' },
      { id: 'lachman', label: 'Lachman / anterior drawer', type: 'yn' },
      { id: 'valgus', label: 'Valgus / varus stress laxity', type: 'yn' },
      { id: 'quad', label: 'Quadriceps atrophy / weakness', type: 'yn' },
    ],
    dx: [
      { id: 'oa', name: 'Osteoarthritis of knee', icd: { R: 'M17.11', L: 'M17.12', B: 'M17.0', U: 'M17.10' }, threshold: 4,
        criteria: { __age50: 2, stiff: 1, walk: 1, stairs: 1, crepitus: 2, varus: 1, rom: 1, mjl: 1, quad: 1 },
        plan: [
          'Weight reduction if overweight; quadriceps strengthening',
          'Low-impact aerobic exercise (cycling, swimming)',
          'Knee brace or cane as needed; topical NSAID',
          'Knee X-ray (standing AP/lateral, skyline)',
          'Consider intra-articular injection (steroid / hyaluronic acid / PRP) if refractory',
        ] },
      { id: 'pfps', name: 'Patellofemoral pain syndrome', icd: { R: 'M22.2X1', L: 'M22.2X2', B: 'M22.2X3', U: 'M22.2X9' }, threshold: 4,
        criteria: { stairs: 1, theater: 3, grind: 2, pf_tender: 2 },
        plan: [
          'Hip abductor and quadriceps strengthening',
          'Patellar taping; activity modification (avoid deep squatting)',
        ] },
      { id: 'pes', name: 'Pes anserine bursitis / tendinopathy', icd: { R: 'M70.51', L: 'M70.52', B: 'M70.51, M70.52', U: 'M70.50' }, threshold: 3,
        criteria: { medial: 1, pes: 3, stairs: 1 },
        plan: [
          'Hamstring stretching; avoid prolonged cross-legged sitting',
          'Consider US-guided pes anserine bursa injection',
        ] },
      { id: 'menis', name: 'Meniscal lesion, suspected', icd: '', threshold: 5,
        criteria: { locking: 3, twist: 1, swelling: 1, mjl: 1, ljl: 1, mcmurray: 3, thessaly: 3 },
        plan: [
          'Knee MRI',
          'Refer to orthopedics if mechanical locking',
        ] },
      { id: 'lig', name: 'Knee ligament injury, suspected', icd: '', threshold: 4,
        criteria: { giving: 2, twist: 1, swelling: 1, lachman: 3, valgus: 3 },
        plan: [
          'Knee MRI; hinged knee brace',
          'Refer to orthopedics / sports medicine',
        ] },
    ],
    plan: [
      'Acetaminophen or NSAID PRN if no contraindication',
      'Consider arthrocentesis with synovial fluid analysis if significant effusion',
      'Follow-up in 2–4 weeks',
    ],
  },
];
