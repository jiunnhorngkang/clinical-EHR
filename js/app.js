/* SOAP 門診病歷產生器 — 介面邏輯（臨床內容見 data.js） */
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const SIDE_WORD = { R: 'right', L: 'left', B: 'bilateral' };
  const SIDE_BTNS = [['neg', '−'], ['R', 'R'], ['L', 'L'], ['B', 'Bil']];
  const SECTIONS = ['history', 'redFlags', 'exam'];

  const state = {
    complaint: null,
    values: { history: {}, redFlags: {}, exam: {} },
    levels: {},       // 'sec.id' → 皮節陣列（derm 項目）
    rom: {},          // 'id.motion.a' / 'id.motion.p' → 角度字串（rom 項目）
    dxOverride: {},   // dx.id → true/false（使用者手動勾選）
    planOverride: {}, // plan 文字 → true/false
  };

  function clearFindings() {
    state.values = { history: {}, redFlags: {}, exam: {} };
    state.levels = {};
    state.rom = {};
    state.dxOverride = {};
    state.planOverride = {};
  }

  // ---------------------------------------------------------------- helpers
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const sideTag = (v) => (v === 'B' ? 'bilateral' : v);
  const normText = (m) => (m.normal ? `0–${m.normal}°` : '0°');

  function isPositive(item, v) {
    if (v == null) return false;
    if (item.type === 'yn') return v === 'y';
    if (item.type === 'side' || item.type === 'derm') return v in SIDE_WORD;
    const opt = item.options.find((o) => o.v === v);
    return !!(opt && opt.pos);
  }

  function durationWeeks() {
    const n = parseFloat($('durNum').value);
    if (isNaN(n)) return null;
    return n * { day: 1 / 7, week: 1, month: 4.345, year: 52 }[$('durUnit').value];
  }

  function durationText() {
    const n = parseFloat($('durNum').value);
    if (isNaN(n)) return '';
    const unit = $('durUnit').value;
    return `${n} ${unit}${n === 1 ? '' : 's'}`;
  }

  /** 所有陽性發現（含衍生條件），供診斷評分用 */
  function positiveFindings() {
    const c = state.complaint;
    const pos = new Set();
    SECTIONS.forEach((sec) => {
      c[sec].forEach((item) => {
        if (isPositive(item, state.values[sec][item.id])) pos.add(item.id);
      });
    });
    c.exam.filter((item) => item.type === 'rom').forEach((item) => {
      item.motions.forEach((m) => {
        ['a', 'p'].forEach((k) => {
          const key = `${item.id}.${m.id}.${k}`;
          if (romLimited(m, state.rom[key])) pos.add(key);
        });
      });
    });
    const age = parseInt($('age').value, 10);
    if (age >= 50) pos.add('__age50');
    if (age >= 60) pos.add('__age60');
    const wk = durationWeeks();
    if (wk != null && wk < 6) pos.add('__acute');
    if (wk != null && wk >= 12) pos.add('__chronic');
    return pos;
  }

  /** 與正常值相差 ≥10° 或 ≥10% 視為受限 */
  function romLimited(motion, val) {
    const n = parseFloat(val);
    if (isNaN(n)) return false;
    return motion.normal - n >= Math.max(10, motion.normal * 0.1);
  }

  function dermLevels(sec, item) {
    const chosen = state.levels[`${sec}.${item.id}`] || [];
    return item.levels.filter((l) => chosen.includes(l));
  }

  function scoredDx() {
    const pos = positiveFindings();
    return state.complaint.dx
      .map((dx) => {
        const score = Object.entries(dx.criteria).reduce((s, [id, w]) => s + (pos.has(id) ? w : 0), 0);
        const max = Object.values(dx.criteria).reduce((a, b) => a + b, 0);
        const suggested = score >= dx.threshold;
        const checked = dx.id in state.dxOverride ? state.dxOverride[dx.id] : suggested;
        return { dx, score, max, suggested, checked };
      })
      .sort((a, b) => b.score / b.dx.threshold - a.score / a.dx.threshold);
  }

  function icdFor(dx) {
    if (!dx.icd) return '';
    if (typeof dx.icd === 'string') return dx.icd;
    return dx.icd[$('side').value] || dx.icd.U || '';
  }

  function positiveRedFlags() {
    return state.complaint.redFlags.filter((rf) => state.values.redFlags[rf.id] === 'y');
  }

  /** 彙整處置建議：紅旗 → 已選診斷 → 一般建議（去重） */
  function planItems(dxRows) {
    const items = [];
    const seen = new Set();
    const add = (text, urgent) => {
      if (seen.has(text)) return;
      seen.add(text);
      const checked = text in state.planOverride ? state.planOverride[text] : true;
      items.push({ text, urgent, checked });
    };
    positiveRedFlags().forEach((rf) => add(rf.plan, true));
    dxRows.filter((r) => r.checked).forEach((r) => r.dx.plan.forEach((p) => add(p, false)));
    state.complaint.plan.forEach((p) => add(p, false));
    return items;
  }

  // ---------------------------------------------------------------- step 1
  function renderComplaints() {
    $('ccGrid').innerHTML = '';
    COMPLAINTS.forEach((c) => {
      const b = document.createElement('button');
      b.className = 'cc-card';
      b.innerHTML = `<strong>${c.label}</strong><span>${c.zh}</span>`;
      b.onclick = () => selectComplaint(c);
      b.dataset.id = c.id;
      $('ccGrid').appendChild(b);
    });
  }

  function selectComplaint(c) {
    if (state.complaint !== c) {
      state.complaint = c;
      clearFindings();
    }
    document.querySelectorAll('.cc-card').forEach((el) => el.classList.toggle('selected', el.dataset.id === c.id));
    $('toStep2').disabled = false;
  }

  // ---------------------------------------------------------------- step 2
  function buttonsFor(item) {
    if (item.type === 'yn') return [['y', '+'], ['n', '−']];
    if (item.type === 'side' || item.type === 'derm') return SIDE_BTNS;
    return item.options.map((o) => [o.v, o.label]);
  }

  function renderItems(sec, container) {
    container.innerHTML = '';
    state.complaint[sec].forEach((item) => {
      if (item.type === 'rom') {
        container.appendChild(renderRom(item));
        return;
      }
      const row = document.createElement('div');
      row.className = 'item';
      const label = document.createElement('div');
      label.className = 'item-label';
      label.innerHTML = item.label + (item.hint ? `<small>${item.hint}</small>` : '');
      const group = document.createElement('div');
      group.className = 'seg';
      buttonsFor(item).forEach(([v, text]) => {
        const b = document.createElement('button');
        b.textContent = text;
        b.dataset.v = v;
        b.onclick = () => {
          const cur = state.values[sec][item.id];
          if (cur === v) delete state.values[sec][item.id];
          else state.values[sec][item.id] = v;
          paintRow(sec, item, group, row);
        };
        group.appendChild(b);
      });
      row.append(label, group);
      if (item.type === 'derm') row.appendChild(renderDermChips(sec, item));
      container.appendChild(row);
      paintRow(sec, item, group, row);
    });
  }

  /** 皮節選擇（陽性時顯示，可複選） */
  function renderDermChips(sec, item) {
    const key = `${sec}.${item.id}`;
    const wrap = document.createElement('div');
    wrap.className = 'chips';
    wrap.innerHTML = '<span>皮節</span>';
    item.levels.forEach((lv) => {
      const b = document.createElement('button');
      b.textContent = lv;
      b.className = 'chip';
      const sync = () => b.classList.toggle('on', (state.levels[key] || []).includes(lv));
      b.onclick = () => {
        const cur = state.levels[key] || [];
        state.levels[key] = cur.includes(lv) ? cur.filter((x) => x !== lv) : [...cur, lv];
        sync();
      };
      sync();
      wrap.appendChild(b);
    });
    return wrap;
  }

  /** 關節活動度量表：AROM / PROM 角度輸入 */
  function renderRom(item) {
    const box = document.createElement('div');
    box.className = 'item rom';
    const rows = item.motions.map((m) => {
      const cell = (k) => {
        const key = `${item.id}.${m.id}.${k}`;
        return `<input type="number" step="5" data-key="${key}" value="${state.rom[key] || ''}">`;
      };
      return `<tr><th>${m.label}</th><td>${cell('a')}</td><td>${cell('p')}</td><td class="nl">${normText(m)}</td></tr>`;
    }).join('');
    box.innerHTML =
      `<div class="item-label">${item.label}${item.hint ? `<small>${item.hint}</small>` : ''}</div>` +
      `<table><thead><tr><th></th><th>AROM°</th><th>PROM°</th><th class="nl">Normal</th></tr></thead><tbody>${rows}</tbody></table>`;
    box.querySelectorAll('input').forEach((inp) => {
      const motion = item.motions.find((m) => m.id === inp.dataset.key.split('.')[1]);
      const paint = () => inp.classList.toggle('limited', romLimited(motion, inp.value));
      inp.oninput = () => {
        if (inp.value === '') delete state.rom[inp.dataset.key];
        else state.rom[inp.dataset.key] = inp.value;
        paint();
      };
      paint();
    });
    return box;
  }

  function paintRow(sec, item, group, row) {
    const v = state.values[sec][item.id];
    group.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.v === v));
    const chips = row.querySelector('.chips');
    if (chips) chips.hidden = !isPositive(item, v);
    row.classList.toggle('pos', isPositive(item, v));
    row.classList.toggle('neg', v != null && !isPositive(item, v));
  }

  function negateRest(sec) {
    state.complaint[sec].forEach((item) => {
      if (state.values[sec][item.id] != null) return;
      if (item.type === 'rom') return;
      if (item.type === 'yn') state.values[sec][item.id] = 'n';
      else if (item.type === 'side' || item.type === 'derm') state.values[sec][item.id] = 'neg';
      else {
        const neg = item.options.find((o) => !o.pos);
        if (neg) state.values[sec][item.id] = neg.v;
      }
    });
    renderStep2();
  }

  function renderStep2() {
    const c = state.complaint;
    const side = $('side').value;
    const sideTxt = side in SIDE_WORD ? `（${ {R: '右', L: '左', B: '雙側'}[side] }）` : '';
    $('step2Title').textContent = `${c.label} ${c.zh}${sideTxt}`;
    renderItems('history', $('historyList'));
    renderItems('redFlags', $('redFlagList'));
    renderItems('exam', $('examList'));
  }

  // ---------------------------------------------------------------- step 3
  function renderStep3() {
    const rows = scoredDx();

    const rfs = positiveRedFlags();
    $('redAlert').hidden = rfs.length === 0;
    $('redAlert').innerHTML = rfs.length
      ? '<strong>⚠ 紅旗徵象</strong><ul>' + rfs.map((r) => `<li>${r.label}</li>`).join('') + '</ul>'
      : '';

    $('dxList').innerHTML = '';
    rows.forEach((r) => {
      const el = document.createElement('label');
      el.className = 'dx' + (r.suggested ? ' suggested' : '');
      const pct = Math.round((r.score / r.max) * 100);
      const icd = icdFor(r.dx);
      el.innerHTML =
        `<input type="checkbox" ${r.checked ? 'checked' : ''}>` +
        `<span class="dx-name">${r.dx.name}${icd ? ` <code>${icd}</code>` : ''}</span>` +
        `${r.suggested ? '<span class="badge">建議</span>' : ''}` +
        `<span class="bar" title="score ${r.score}/${r.max}"><i style="width:${pct}%"></i></span>`;
      el.querySelector('input').onchange = (e) => {
        state.dxOverride[r.dx.id] = e.target.checked;
        renderStep3();
      };
      $('dxList').appendChild(el);
    });

    $('planList').innerHTML = '';
    planItems(rows).forEach((p) => {
      const el = document.createElement('label');
      el.className = 'plan' + (p.urgent ? ' urgent' : '');
      el.innerHTML = `<input type="checkbox" ${p.checked ? 'checked' : ''}><span></span>`;
      el.querySelector('span').textContent = p.text;
      el.querySelector('input').onchange = (e) => {
        state.planOverride[p.text] = e.target.checked;
        generate();
      };
      $('planList').appendChild(el);
    });

    generate();
  }

  // ---------------------------------------------------------------- SOAP 文字
  function dermSuffix(sec, item) {
    const lv = dermLevels(sec, item);
    return lv.length ? `, ${lv.join('/')} dermatome` : '';
  }

  function itemPhrase(item, v, sec) {
    const base = item.text || item.label;
    if (item.type === 'side' && v in SIDE_WORD) return `${base} (${sideTag(v)})`;
    if (item.type === 'derm' && v in SIDE_WORD) return `${base} (${sideTag(v)}${dermSuffix(sec, item)})`;
    if (item.type === 'opts') return `${base}: ${item.options.find((o) => o.v === v).text}`;
    return base;
  }

  function examValue(item, v) {
    if (item.type === 'yn') return v === 'y' ? '(+)' : '(-)';
    if (item.type === 'side') return v === 'neg' ? '(-)' : `(+) ${sideTag(v)}`;
    if (item.type === 'derm') return v === 'neg' ? '(-)' : `(+) ${sideTag(v)}${dermSuffix('exam', item)}`;
    return item.options.find((o) => o.v === v).text;
  }

  function romLines(item) {
    const deg = (x) => (x == null ? '-' : `${x}°`);
    return item.motions
      .map((m) => {
        const a = state.rom[`${item.id}.${m.id}.a`];
        const p = state.rom[`${item.id}.${m.id}.p`];
        if (a == null && p == null) return null;
        return `  ${m.label} ${deg(a)}/${deg(p)} (N ${normText(m)})`;
      })
      .filter(Boolean);
  }

  function sideSuffix() {
    const s = $('side').value;
    return state.complaint.region === 'limb' && s in SIDE_WORD ? `, ${SIDE_WORD[s]}` : '';
  }

  function generate() {
    const c = state.complaint;
    const side = $('side').value;
    const S = [];
    const O = [];
    const AP = [];

    // ---- S
    let cc;
    if (c.region === 'limb') cc = side in SIDE_WORD ? `${cap(SIDE_WORD[side])} ${c.cc}` : cap(c.cc);
    else cc = cap(c.cc) + (side in SIDE_WORD ? ` (${side === 'B' ? 'bilateral' : SIDE_WORD[side] + '-sided'})` : '');
    const dur = durationText();
    S.push(`CC: ${cc}${dur ? ` for ${dur}` : ''}.`);

    const demo = [];
    const age = $('age').value;
    const sex = $('sex').value;
    if (age || sex) demo.push([age && `${age} y/o`, sex].filter(Boolean).join(' '));
    if ($('onset').value) demo.push($('onset').value);
    const nrs = parseInt($('nrs').value, 10);
    let demoLine = demo.join(', ');
    if (demoLine) demoLine = cap(demoLine) + '.';
    if (nrs >= 0) demoLine += `${demoLine ? ' ' : ''}Pain NRS ${nrs}/10.`;
    if (demoLine) S.push(`- ${demoLine}`);

    const pos = [];
    const neg = [];
    c.history.forEach((item) => {
      const v = state.values.history[item.id];
      if (v == null) return;
      (isPositive(item, v) ? pos : neg).push(itemPhrase(item, v, 'history'));
    });
    if (pos.length) S.push(`- (+) ${pos.join('; ')}`);
    if (neg.length) S.push(`- (-) ${neg.join('; ')}`);

    const rfPos = [];
    const rfNeg = [];
    c.redFlags.forEach((item) => {
      const v = state.values.redFlags[item.id];
      if (v === 'y') rfPos.push(item.text);
      else if (v === 'n') rfNeg.push(item.text);
    });
    if (rfPos.length) S.push(`- RED FLAG (+): ${rfPos.join('; ')}`);
    if (rfNeg.length) S.push(`- Red flags (-): ${rfNeg.join('; ')}`);
    if ($('prevTx').value.trim()) S.push(`- ${$('prevTx').value.trim()}`);
    if ($('historyNote').value.trim()) S.push(`- ${$('historyNote').value.trim()}`);

    // ---- O
    if (c.region === 'limb' && side in SIDE_WORD) O.push(`[${cap(SIDE_WORD[side])} ${c.cc.replace(' pain', '')}]`);
    let anyExam = false;
    c.exam.forEach((item) => {
      if (item.type === 'rom') {
        const lines = romLines(item);
        if (lines.length) {
          anyExam = true;
          O.push(`- ${item.text || item.label} (AROM/PROM):`, ...lines);
        }
        return;
      }
      const v = state.values.exam[item.id];
      if (v == null) return;
      anyExam = true;
      O.push(`- ${item.text || item.label}: ${examValue(item, v)}`);
    });
    if ($('examNote').value.trim()) {
      anyExam = true;
      O.push(`- ${$('examNote').value.trim()}`);
    }
    if (!anyExam) O.push('- (not recorded)');

    // ---- A
    AP.push('A:');
    const rows = scoredDx().filter((r) => r.checked);
    const dxLines = rows.map((r) => {
      const icd = icdFor(r.dx);
      return `${r.dx.name}${sideSuffix()}${icd ? ` (${icd})` : ''}`;
    });
    if ($('dxOther').value.trim()) dxLines.push($('dxOther').value.trim());
    if (!dxLines.length) dxLines.push(`${cap(c.cc)}${sideSuffix()}, under evaluation`);
    dxLines.forEach((d, i) => AP.push(`${i + 1}. ${d}`));
    if (rfPos.length) AP.push(`* Red flag present — further work-up required`);

    // ---- P
    AP.push('');
    AP.push('P:');
    const plans = planItems(scoredDx()).filter((p) => p.checked).map((p) => p.text);
    $('planOther').value.split('\n').map((s) => s.trim()).filter(Boolean).forEach((s) => plans.push(s));
    plans.forEach((p, i) => AP.push(`${i + 1}. ${p}`));

    $('outS').value = S.join('\n');
    $('outO').value = O.join('\n');
    $('outAP').value = AP.join('\n');
  }

  // ---------------------------------------------------------------- 導覽
  function go(step) {
    [1, 2, 3].forEach((n) => ($('step' + n).hidden = n !== step));
    document.querySelectorAll('#stepper li').forEach((li) => {
      const n = +li.dataset.step;
      li.classList.toggle('active', n === step);
      li.classList.toggle('done', n < step);
    });
    if (step === 2) renderStep2();
    if (step === 3) renderStep3();
    window.scrollTo(0, 0);
  }

  function download() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
    const text = [
      `Date: ${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      '',
      'S:',
      $('outS').value,
      '',
      'O:',
      $('outO').value,
      '',
      $('outAP').value,
    ].join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `SOAP_${state.complaint.id}_${stamp}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function copy(btn) {
    const box = $(btn.dataset.copy);
    try {
      await navigator.clipboard.writeText(box.value);
    } catch (e) {
      box.select();
      document.execCommand('copy');
    }
    const label = btn.textContent;
    btn.textContent = '已複製 ✓';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = label;
      btn.disabled = false;
    }, 1500);
  }

  function reset() {
    if (!confirm('確定清除所有內容，開始新病人？')) return;
    state.complaint = null;
    clearFindings();
    ['age', 'durNum', 'prevTx', 'historyNote', 'examNote', 'dxOther', 'planOther', 'outS', 'outO', 'outAP'].forEach((id) => ($(id).value = ''));
    $('sex').value = '';
    $('side').value = 'U';
    $('onset').value = '';
    $('durUnit').value = 'week';
    $('nrs').value = -1;
    $('nrsOut').textContent = '—';
    $('toStep2').disabled = true;
    document.querySelectorAll('.cc-card').forEach((el) => el.classList.remove('selected'));
    go(1);
  }

  // ---------------------------------------------------------------- init
  renderComplaints();
  $('nrs').oninput = (e) => ($('nrsOut').textContent = e.target.value < 0 ? '—' : `${e.target.value}/10`);
  $('toStep2').onclick = () => go(2);
  $('toStep3').onclick = () => go(3);
  $('back1').onclick = () => go(1);
  $('back2').onclick = () => go(2);
  document.querySelectorAll('[data-copy]').forEach((b) => (b.onclick = () => copy(b)));
  $('dlBtn').onclick = download;
  $('resetBtn').onclick = reset;
  document.querySelectorAll('[data-negate]').forEach((b) => (b.onclick = () => negateRest(b.dataset.negate)));
  ['dxOther', 'planOther'].forEach((id) => $(id).addEventListener('input', generate));
  go(1);
})();
