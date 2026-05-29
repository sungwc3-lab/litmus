/* ───────────────────────────────────────────────────────────
   가치관 실험실 — 공용 Tweaks 패널
   3개 페이지(index/library/auction) 모두 같은 파일을 로드.
   변경값은 localStorage('litmus_tweaks_v1')에 저장되어 페이지 이동에도 유지.
   호스트와는 postMessage 프로토콜로 통신 → 우측 상단 토글로 패널 열기.
   ─────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  // ── 옵션 정의 ────────────────────────────────────────────
  var PALETTES = [
    { id: 'litmus',     label: 'Litmus Blue', accent: '#4A80B5', accentLight: '#D6E8F7', accentDark: '#2C5F8A' },
    { id: 'slate',      label: 'Slate Navy',  accent: '#33526F', accentLight: '#DDE6EE', accentDark: '#1E3B57' },
    { id: 'terracotta', label: 'Terracotta',  accent: '#B65A3F', accentLight: '#F4E1D7', accentDark: '#8C3F2A' },
    { id: 'forest',     label: 'Forest',      accent: '#4E7758', accentLight: '#DCE7DE', accentDark: '#34553D' },
    { id: 'plum',       label: 'Plum',        accent: '#7A4E70', accentLight: '#E9DCE5', accentDark: '#553349' }
  ];

  var HEAD_FONTS = [
    { id: 'dm-serif',    label: 'DM Serif Display', stack: "'DM Serif Display', serif",        google: 'DM+Serif+Display:ital@0;1' },
    { id: 'cormorant',   label: 'Cormorant',        stack: "'Cormorant Garamond', serif",      google: 'Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500' },
    { id: 'playfair',    label: 'Playfair',         stack: "'Playfair Display', serif",        google: 'Playfair+Display:ital,wght@0,500;0,600;0,700;1,500' },
    { id: 'noto-serif',  label: 'Noto Serif KR',    stack: "'Noto Serif KR', serif",           google: 'Noto+Serif+KR:wght@500;600;700' }
  ];

  var BODY_FONTS = [
    { id: 'noto-sans',   label: 'Noto Sans KR',     stack: "'Noto Sans KR', sans-serif",        google: 'Noto+Sans+KR:wght@300;400;500;700;900' },
    { id: 'pretendard',  label: 'Pretendard',       stack: "'Pretendard Variable', 'Pretendard', sans-serif", css: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css' },
    { id: 'ibm-plex',    label: 'IBM Plex Sans KR', stack: "'IBM Plex Sans KR', sans-serif",   google: 'IBM+Plex+Sans+KR:wght@300;400;500;700' }
  ];

  var DEFAULTS = { palette: 'litmus', headFont: 'dm-serif', bodyFont: 'noto-sans' };

  // ── 상태 ─────────────────────────────────────────────────
  var STORAGE_KEY = 'litmus_tweaks_v1';
  var state = loadState();

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return Object.assign({}, DEFAULTS, JSON.parse(raw));
    } catch (e) {}
    return Object.assign({}, DEFAULTS);
  }
  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  // ── 폰트 로더 (중복 방지) ────────────────────────────────
  var loaded = {};
  function loadFont(opt) {
    if (!opt) return;
    if (opt.google) {
      var key = 'g:' + opt.google;
      if (loaded[key]) return;
      loaded[key] = true;
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=' + opt.google + '&display=swap';
      document.head.appendChild(link);
    } else if (opt.css) {
      var key2 = 'c:' + opt.css;
      if (loaded[key2]) return;
      loaded[key2] = true;
      var link2 = document.createElement('link');
      link2.rel = 'stylesheet';
      link2.href = opt.css;
      document.head.appendChild(link2);
    }
  }
  function find(arr, id) { for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i]; return arr[0]; }

  // ── 스타일 오버라이드 적용 ────────────────────────────────
  var styleEl;
  function applyTweaks() {
    var pal  = find(PALETTES, state.palette);
    var head = find(HEAD_FONTS, state.headFont);
    var body = find(BODY_FONTS, state.bodyFont);
    loadFont(head); loadFont(body);

    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = '__litmus_tweaks';
      document.head.appendChild(styleEl);
    }
    // CSS 변수 + serif/sans-serif 패밀리만 덮어쓰기. 기존 디자인 구조는 그대로.
    styleEl.textContent = [
      ':root{',
      '  --blue:' + pal.accent + ';',
      '  --blue-light:' + pal.accentLight + ';',
      '  --blue-dark:' + pal.accentDark + ';',
      '}',
      'body{font-family:' + body.stack + ' !important;}',
      "[style*='DM Serif Display'],",
      ".hero-title,.section-title,.exp-title,.voices-title,.cta-title,",
      ".nav-brand,.store-quote,.voice-quote,.stat-num,.modal-name,.hero-label,",
      ".footer-brand{font-family:" + head.stack + " !important;}"
    ].join('\n');
  }

  // ── 패널 UI ──────────────────────────────────────────────
  var panel, isOpen = false;
  function buildPanel() {
    if (panel) return;
    panel = document.createElement('div');
    panel.id = '__litmus_tweaks_panel';
    panel.innerHTML =
      '<style>' +
      '#__litmus_tweaks_panel{position:fixed;top:80px;right:20px;width:300px;background:#fff;border:1px solid #E8E0D6;border-radius:18px;box-shadow:0 20px 60px rgba(0,0,0,0.15);z-index:9999;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;display:none;overflow:hidden;}' +
      '#__litmus_tweaks_panel.on{display:block;}' +
      '#__litmus_tweaks_panel .ltw-head{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #F1ECE4;background:#FAF8F3;}' +
      '#__litmus_tweaks_panel .ltw-head h3{margin:0;font-size:13px;font-weight:600;color:#1C1917;letter-spacing:0.02em;}' +
      '#__litmus_tweaks_panel .ltw-close{background:none;border:none;cursor:pointer;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#78746E;font-size:14px;}' +
      '#__litmus_tweaks_panel .ltw-close:hover{background:rgba(0,0,0,0.06);color:#1C1917;}' +
      '#__litmus_tweaks_panel .ltw-body{padding:16px 18px 18px;max-height:70vh;overflow-y:auto;}' +
      '#__litmus_tweaks_panel .ltw-section{margin-bottom:18px;}' +
      '#__litmus_tweaks_panel .ltw-section:last-child{margin-bottom:0;}' +
      '#__litmus_tweaks_panel .ltw-label{font-size:11px;font-weight:600;color:#78746E;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:10px;}' +
      '#__litmus_tweaks_panel .ltw-swatches{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;}' +
      '#__litmus_tweaks_panel .ltw-swatch{aspect-ratio:1;border-radius:10px;border:2px solid transparent;cursor:pointer;position:relative;transition:transform 0.15s;}' +
      '#__litmus_tweaks_panel .ltw-swatch:hover{transform:scale(1.05);}' +
      '#__litmus_tweaks_panel .ltw-swatch.on{border-color:#1C1917;}' +
      '#__litmus_tweaks_panel .ltw-swatch.on::after{content:"✓";position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:700;text-shadow:0 1px 2px rgba(0,0,0,0.3);}' +
      '#__litmus_tweaks_panel .ltw-fonts{display:flex;flex-direction:column;gap:6px;}' +
      '#__litmus_tweaks_panel .ltw-font{padding:9px 12px;border:1px solid #E8E0D6;background:#fff;border-radius:10px;cursor:pointer;text-align:left;font-size:13px;color:#2D2B28;display:flex;align-items:center;justify-content:space-between;transition:all 0.15s;}' +
      '#__litmus_tweaks_panel .ltw-font:hover{border-color:#1C1917;}' +
      '#__litmus_tweaks_panel .ltw-font.on{background:#1C1917;color:#fff;border-color:#1C1917;}' +
      '#__litmus_tweaks_panel .ltw-font-preview{font-size:13px;opacity:0.9;}' +
      '#__litmus_tweaks_panel .ltw-foot{padding:10px 18px;border-top:1px solid #F1ECE4;font-size:11px;color:#A09B95;background:#FAF8F3;}' +
      '#__litmus_tweaks_panel .ltw-reset{background:none;border:none;font-size:11px;color:#78746E;cursor:pointer;text-decoration:underline;padding:0;font-family:inherit;}' +
      '#__litmus_tweaks_panel .ltw-reset:hover{color:#1C1917;}' +
      '</style>' +
      '<div class="ltw-head">' +
        '<h3>Tweaks</h3>' +
        '<button class="ltw-close" aria-label="닫기">✕</button>' +
      '</div>' +
      '<div class="ltw-body">' +
        '<div class="ltw-section">' +
          '<div class="ltw-label">Accent Color</div>' +
          '<div class="ltw-swatches" id="ltw-pal"></div>' +
        '</div>' +
        '<div class="ltw-section">' +
          '<div class="ltw-label">Heading Font</div>' +
          '<div class="ltw-fonts" id="ltw-head-font"></div>' +
        '</div>' +
        '<div class="ltw-section">' +
          '<div class="ltw-label">Body Font</div>' +
          '<div class="ltw-fonts" id="ltw-body-font"></div>' +
        '</div>' +
      '</div>' +
      '<div class="ltw-foot">' +
        '<button class="ltw-reset">기본값으로 되돌리기</button>' +
      '</div>';
    document.body.appendChild(panel);

    // 컬러 스왓치
    var palWrap = panel.querySelector('#ltw-pal');
    PALETTES.forEach(function (p) {
      var b = document.createElement('button');
      b.className = 'ltw-swatch' + (state.palette === p.id ? ' on' : '');
      b.style.background = p.accent;
      b.title = p.label;
      b.onclick = function () { setKey('palette', p.id); };
      palWrap.appendChild(b);
    });

    // 폰트 옵션
    function buildFontList(arr, hostId, stateKey) {
      var host = panel.querySelector(hostId);
      arr.forEach(function (f) {
        loadFont(f); // 프리뷰 위해 모두 미리 로드
        var b = document.createElement('button');
        b.className = 'ltw-font' + (state[stateKey] === f.id ? ' on' : '');
        b.innerHTML = '<span>' + f.label + '</span>' +
                      '<span class="ltw-font-preview" style="font-family:' + f.stack + '">Aa 가</span>';
        b.onclick = function () { setKey(stateKey, f.id); };
        host.appendChild(b);
      });
    }
    buildFontList(HEAD_FONTS, '#ltw-head-font', 'headFont');
    buildFontList(BODY_FONTS, '#ltw-body-font', 'bodyFont');

    panel.querySelector('.ltw-close').onclick = function () { setOpen(false); notifyDismiss(); };
    panel.querySelector('.ltw-reset').onclick = function () {
      state = Object.assign({}, DEFAULTS);
      saveState();
      applyTweaks();
      refreshPanel();
      pushToHost();
    };
  }

  function setKey(k, v) {
    state[k] = v;
    saveState();
    applyTweaks();
    refreshPanel();
    pushToHost();
  }

  function refreshPanel() {
    if (!panel) return;
    [].forEach.call(panel.querySelectorAll('.ltw-swatch'), function (el, i) {
      el.classList.toggle('on', PALETTES[i].id === state.palette);
    });
    var headBtns = panel.querySelectorAll('#ltw-head-font .ltw-font');
    [].forEach.call(headBtns, function (el, i) { el.classList.toggle('on', HEAD_FONTS[i].id === state.headFont); });
    var bodyBtns = panel.querySelectorAll('#ltw-body-font .ltw-font');
    [].forEach.call(bodyBtns, function (el, i) { el.classList.toggle('on', BODY_FONTS[i].id === state.bodyFont); });
  }

  function setOpen(open) {
    isOpen = open;
    if (!panel) buildPanel();
    panel.classList.toggle('on', open);
  }

  // ── 호스트 통신 ──────────────────────────────────────────
  function pushToHost() {
    try {
      window.parent.postMessage({ type: '__edit_mode_set_keys', edits: {
        palette: state.palette, headFont: state.headFont, bodyFont: state.bodyFont
      } }, '*');
    } catch (e) {}
  }
  function notifyDismiss() {
    try { window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*'); } catch (e) {}
  }

  // ── 부팅 ─────────────────────────────────────────────────
  function boot() {
    applyTweaks();

    // 호스트 메시지 핸들러를 먼저 등록한 다음, available을 알린다.
    window.addEventListener('message', function (e) {
      var d = e.data;
      if (!d || typeof d !== 'object') return;
      if (d.type === '__activate_edit_mode')   setOpen(true);
      if (d.type === '__deactivate_edit_mode') setOpen(false);
    });

    try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
