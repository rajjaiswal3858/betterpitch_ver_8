// Adds the voice-demo hero as the first section of the home page and pushes the
// recorded page down under it. Animations and interactions are ported from the
// betterpitch.vercel.app hero. Injected into every HTML page by server.js; only
// acts on "/". Like content.js it waits for React to hydrate (bpReady, defined
// there) before touching the DOM, otherwise React would throw the section away.
(function () {
  if (location.pathname !== '/') return;

  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = '/__bp/hero.css';
  document.head.appendChild(css);

  const hide = document.createElement('style');
  hide.textContent = 'body{opacity:0!important}';
  document.head.appendChild(hide);

  const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>';
  const HTML = `
<div class="bph-box">
  <div class="bph-tiles" aria-hidden="true"></div>
  <div class="bph-wrap bph-grid">
    <div class="bph-copy">
      <span class="bph-pill bph-enter" style="--d:.05s"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 3.5 11.6 8.4 16.5 10 11.6 11.6 10 16.5 8.4 11.6 3.5 10 8.4 8.4z"/><path d="M18 3v4M16 5h4M18 16v4M16 18h4"/></svg>The First AI Revenue Engine Built For Service Businesses</span>
      <h1 class="bph-enter" style="--d:.15s">Clone your best humans to answer every call, close every lead,<em>&amp; run your front office 24/7.</em></h1>
      <p class="bph-enter" style="--d:.3s">The top 1% of service businesses don't outwork the competition. They out-system them. BetterPitch installs a custom AI Revenue Engine into your business. Voice, iMessage, and outbound. Live in 14 days. Guaranteed to perform.</p>
    </div>

    <div class="bph-demo bph-enter-side">
      <div class="bph-mode" data-mode="voice">
        <button class="on" data-mode="voice"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2M9 10v4M12 8v8M15 10v4"/></svg>Voice AI</button>
        <span class="bph-switch" role="switch" aria-checked="false" aria-label="Switch between Voice AI and iMessage AI"><span class="bph-knob"></span></span>
        <button data-mode="chat"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z"/><text x="12" y="14.8" text-anchor="middle" font-size="7" font-weight="700" fill="currentColor" stroke="none">AI</text></svg>iMessage AI</button>
      </div>
      <div class="bph-panel">
        <div class="bph-orb-wrap">
          <div class="bph-orb" role="button" tabindex="0" aria-label="Start a demo call"><span class="bph-tri"></span></div>
          <div class="bph-wave" aria-hidden="true"></div>
          <div class="bph-status" aria-live="polite">Idle</div>
        </div>
        <div class="bph-samples"></div>
        <div class="bph-row">
          <button class="bph-btn bph-btn-light bph-call">Talk to AI ${ARROW}</button>
          <a href="/request-demo" class="bph-btn bph-btn-glass">Talk to a Human ${ARROW}</a>
        </div>
      </div>
    </div>
  </div>

  <div class="bph-wrap bph-features">
    <div class="bph-feature bph-enter" style="--d:.6s"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7v5l3 2"/><path d="M4.6 15.5A8 8 0 1 0 6 6.3M6 2.5v4h4"/></svg>Response time: &lt; 30 seconds</div>
    <div class="bph-feature bph-enter" style="--d:.7s"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 11A8.5 8.5 0 1 0 11 20.5"/><path d="M11 7v4.5l2.5 1.5"/><path d="M14.5 15.5h2.5a.75.75 0 0 1 0 1.5h-1a.75.75 0 0 0 0 1.5h1.5M20.5 15v2.2h1.5M21 15v4"/></svg>Available: 24/7 - 365</div>
    <div class="bph-feature bph-enter" style="--d:.8s"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="13" height="13" rx="3"/><path d="M7 14.5c.7.8 1.6 1.2 2.5 1.2s1.8-.4 2.5-1.2M7.5 11.5h.01M11.5 11.5h.01"/><path d="M18.5 2.5v4M16.5 4.5h4M20 9.5v2M19 10.5h2"/></svg>Customers don’t realize it’s AI</div>
  </div>
</div>

<div class="bph-proof">
  <div class="bph-enter" style="--d:.9s"><i></i>18,342+ users</div>
  <div class="bph-enter" style="--d:.97s"><i></i>Featured in Business Insider</div>
  <div class="bph-enter" style="--d:1.04s"><i></i>Backed by Dan Martell</div>
  <div class="bph-enter" style="--d:1.11s"><i></i>Guaranteed to Perform</div>
</div>`;

  const SAMPLES = {
    voice: [['Sample 1: "HVAC Emergency Service"', '01:35'], ['Sample 2: "Divorce Attorney Booking a Consult"', '02:46']],
    chat: [['Sample 1: "Med Spa Rebooking Over iMessage"', '00:58'], ['Sample 2: "Roofing Quote Follow-up"', '01:24']],
  };

  function build() {
    const sec = document.createElement('section');
    sec.id = 'bp-hero';
    sec.innerHTML = HTML;

    const $ = s => sec.querySelector(s);
    const panel = $('.bph-panel'), orb = $('.bph-orb'), st = $('.bph-status'), callBtn = $('.bph-call');
    const mode = $('.bph-mode'), samplesBox = $('.bph-samples');
    let playing = null, timer = null, secs = 0;

    function setLive(on, label) {
      orb.classList.toggle('live', on);
      panel.classList.toggle('live', on);
      orb.setAttribute('aria-label', on ? 'End the demo call' : 'Start a demo call');
      st.textContent = on ? label : 'Idle';
    }
    function stopAll() {
      clearInterval(timer);
      timer = null;
      playing = null;
      samplesBox.querySelectorAll('.bph-sample').forEach(x => x.classList.remove('playing'));
      callBtn.classList.replace('bph-btn-end', 'bph-btn-light');
      callBtn.innerHTML = 'Talk to AI ' + ARROW;
      setLive(false);
    }
    // demo call (simulated): "Talk to AI" and the big play button start/end it
    function toggleCall() {
      if (timer) return stopAll();
      stopAll();
      secs = 0;
      setLive(true, 'Live · 0:00');
      timer = setInterval(() => { secs++; st.textContent = 'Live · ' + Math.floor(secs / 60) + ':' + String(secs % 60).padStart(2, '0'); }, 1000);
      callBtn.classList.replace('bph-btn-light', 'bph-btn-end');
      callBtn.textContent = 'End call';
    }
    callBtn.onclick = toggleCall;
    orb.onclick = toggleCall;
    orb.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCall(); } };

    // voice / iMessage samples (simulated playback)
    function renderSamples(m) {
      samplesBox.innerHTML = '';
      SAMPLES[m].forEach(([t, len], i) => {
        const b = document.createElement('button');
        b.className = 'bph-sample';
        b.style.animationDelay = (i * .08) + 's';
        b.innerHTML = '<span class="bph-pb"></span><b></b><span class="bph-mini">' + '<i></i>'.repeat(9) + '</span><span class="bph-len">' + len + '</span>';
        b.querySelector('b').textContent = t;
        b.onclick = () => {
          const on = playing !== b;
          stopAll();
          if (on) { b.classList.add('playing'); playing = b; setLive(true, 'Playing ' + t); }
        };
        samplesBox.appendChild(b);
      });
    }
    function setMode(m) {
      mode.dataset.mode = m;
      mode.querySelectorAll('button').forEach(x => x.classList.toggle('on', x.dataset.mode === m));
      $('.bph-switch').setAttribute('aria-checked', String(m === 'chat'));
      stopAll();
      renderSamples(m);
    }
    mode.querySelectorAll('button').forEach(btn => btn.onclick = () => setMode(btn.dataset.mode));
    $('.bph-switch').onclick = () => setMode(mode.dataset.mode === 'voice' ? 'chat' : 'voice');
    renderSamples('voice');

    // waveform under the orb: mostly tiny ticks with a few tall spikes, like a sparse audio trace
    const w = $('.bph-wave');
    const spikes = { 6: 30, 8: 60, 10: 95, 12: 40, 17: 15, 24: 10, 30: 20, 36: 100, 38: 55, 40: 30 };
    for (let i = 0; i < 48; i++) {
      const b = document.createElement('i');
      b.style.setProperty('--h', (spikes[i] || (4 + Math.random() * 12)).toFixed(0) + '%');
      // hover ripple spreads out from the centre
      b.style.setProperty('--d', (Math.abs(i - 23.5) * 12).toFixed(0) + 'ms');
      // live-call height: taller towards the middle; negative delay so motion is mid-swing on the first frame
      b.style.setProperty('--lh', (30 + Math.random() * 70 * (1 - Math.abs(i - 23.5) / 40)).toFixed(0) + '%');
      b.style.setProperty('--dur', (.35 + Math.random() * .4).toFixed(2) + 's');
      b.style.animationDelay = (-Math.random()).toFixed(2) + 's';
      w.appendChild(b);
    }

    // animated tile grid that blooms outwards from the centre and glows under the pointer
    const grid = $('.bph-tiles'), box = $('.bph-box');
    function tiles() {
      const cols = Math.ceil(box.clientWidth / 123) + 1, rows = Math.ceil(box.clientHeight / 48) + 1;
      grid.style.gridTemplateColumns = 'repeat(' + cols + ',115px)';
      grid.innerHTML = '';
      const cx = (cols - 1) / 2, cy = (rows - 1) / 2;
      for (let i = 0; i < cols * rows; i++) {
        const t = document.createElement('i'), x = i % cols, y = Math.floor(i / cols);
        t.style.animationDelay = (Math.hypot((x - cx) * 123, (y - cy) * 48) / 650).toFixed(2) + 's';
        grid.appendChild(t);
      }
    }
    let rt, lastW = 0;
    new ResizeObserver(() => {
      if (box.clientWidth === lastW) return;
      lastW = box.clientWidth;
      clearTimeout(rt);
      rt = setTimeout(tiles, 200);
    }).observe(box);
    box.addEventListener('pointermove', e => {
      const el = document.elementsFromPoint(e.clientX, e.clientY).find(n => n.parentElement === grid);
      if (el && !el.classList.contains('hot')) { el.classList.add('hot'); setTimeout(() => el.classList.remove('hot'), 900); }
    });

    sec._tiles = tiles;
    return sec;
  }

  let sec = null;
  function place() {
    const host = document.querySelector('main > div');
    if (!host) return false;
    if (!sec) sec = build();
    // clear the fixed site header
    const nav = document.querySelector('#page-scroller nav');
    if (nav) sec.style.setProperty('--bph-nav', nav.getBoundingClientRect().height + 'px');
    if (sec.parentNode !== host || host.firstChild !== sec) {
      host.insertBefore(sec, host.firstChild);
      sec._tiles();
    }
    return true;
  }

  let started = false;
  function start() {
    if (started) return;
    started = true;
    if (place()) {
      // keep it first if React re-renders the page container later
      new MutationObserver(() => { if (!sec.isConnected || sec.parentNode.firstChild !== sec) place(); })
        .observe(document.querySelector('main'), { childList: true, subtree: true });
    }
    hide.remove();
  }
  bpReady(start, 50); // after content.js has swapped the copy
})();
