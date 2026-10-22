// Intro screen shown when someone first enters the site (once per browser
// session; add ?intro to the URL to see it again). A line-art logo story in the
// spirit of Moov Studio's "Logo animation for APW", told for a voice agent:
//   six strokes pinwheel in and snap into a hexagon -> nodes pop onto its corners
//   around a ringing phone -> the hexagon becomes a circle and a waveform talks
//   inside it -> it collapses to a gold dot that shoots off -> the speech-bubble
//   mark draws itself and the BetterPitch wordmark rises in.
// The wordmark is the loader: it fills left to right as the site gets ready
// (theme.js fires bp:ready once React has hydrated and its motion is set up),
// the dot drops back onto the i, and the site opens through a widening circle
// with a champagne edge. theme.js waits on window.bpIntro so its entrance
// animations play as the site opens, not hidden behind this screen.
// Plain WAAPI (the vendored libraries load later). Injected first in <head> by
// server.js, so it covers the page before anything else paints.
(function () {
  if (window.top !== window) return; // the chat widget's iframe
  let seen = false;
  try { seen = sessionStorage.getItem('bp-intro') === '1'; } catch (e) { /* storage blocked */ }
  if (seen && !/[?&]intro\b/.test(location.search)) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const EASE = 'cubic-bezier(.22,1,.36,1)';
  const SNAP = 'cubic-bezier(.2,1.3,.35,1)';
  const IO = 'cubic-bezier(.76,0,.24,1)';
  const R = 88; // story hexagon radius (viewBox -150..150)
  const V = [...Array(6)].map((_, k) => { const a = (-90 + 60 * k) * Math.PI / 180; return [R * Math.cos(a), R * Math.sin(a)]; });
  const f = n => n.toFixed(1);

  const sides = V.map((v, k) => { const w = V[(k + 1) % 6]; return `<g class="side"><line x1="${f(v[0])}" y1="${f(v[1])}" x2="${f(w[0])}" y2="${f(w[1])}"/></g>`; }).join('');
  const nodes = V.map(v => `<circle class="node" cx="${f(v[0])}" cy="${f(v[1])}" r="10"/>`).join('');
  const bars = [...Array(9)].map((_, i) => `<line x1="${(i - 4) * 15}" y1="-6" x2="${(i - 4) * 15}" y2="6"/>`).join('');
  const letters = (s) => [...s].map((c, i) => c === 'ı'
    ? `<i class="dl" style="--i:${i}">ı<b class="tittle"></b></i>` : `<i style="--i:${i}">${c}</i>`).join('');
  const WORD = 'BetterPıtch'; // dotless i: its dot is the gold one that lands

  const el = document.createElement('div');
  el.id = 'bp-intro';
  el.setAttribute('role', 'status');
  el.innerHTML = `
<span class="bpi-sr">Loading BetterPitch</span>
<div class="bpi-stage" aria-hidden="true">
  <div class="bpi-box">
    <svg class="bpi-story" viewBox="-150 -150 300 300">
      <g class="hex">${sides}</g>
      <circle class="orbit" r="${R}"/>
      <g class="nodes">${nodes}</g>
      <g class="phone"><path transform="translate(-31 -29) scale(2.6)" vector-effect="non-scaling-stroke" d="M5 4h3.5l1.8 4.5-2.2 1.4a11 11 0 0 0 5.5 5.5l1.4-2.2L19.5 15v3.5a2 2 0 0 1-2 2A15.5 15.5 0 0 1 3 6a2 2 0 0 1 2-2z"/></g>
      <path class="ring r1" d="M9 -40a22 22 0 0 1 22 22"/>
      <path class="ring r2" d="M9 -58a40 40 0 0 1 40 40"/>
      <circle class="disc" r="${R}"/>
      <g class="bars">${bars}</g>
      <circle class="dot" r="9"/>
    </svg>
    <svg class="bpi-mark" viewBox="-150 -150 300 300">
      <path class="bubble" d="M0 -86L69.3 -46L69.3 34L0 74L-17.3 64L-50 94L-41.6 50L-69.3 34L-69.3 -46Z"/>
      <text text-anchor="middle" dominant-baseline="central" y="-8">BP</text>
      <line class="tick" x1="-28" y1="34" x2="28" y2="34"/>
    </svg>
  </div>
  <div class="bpi-word"><span class="o">${letters(WORD)}</span><span class="f">${letters(WORD)}</span></div>
</div>
<button class="bpi-skip" type="button">Skip intro</button>`;
  document.documentElement.appendChild(el);
  document.documentElement.classList.add('bp-intro-on');

  const $ = s => el.querySelector(s);
  const $$ = s => [...el.querySelectorAll(s)];
  const anims = [];
  const play = (node, kf, o) => { const a = node.animate(kf, Object.assign({ fill: 'forwards' }, o)); anims.push(a); return a; };
  const show = (node, at, dur = 1) => play(node, [{ opacity: 0 }, { opacity: 1 }], { duration: dur, delay: at });
  const hide = (node, at, dur = 250) => play(node, [{ opacity: 1 }, { opacity: 0 }], { duration: dur, delay: at });
  const word = $('.bpi-word');
  // the wordmark uses the site's heading serif once the page's own CSS has it
  const serif = () => { const v = document.body && getComputedStyle(document.body).getPropertyValue('--font-intrinseca').trim(); if (v) word.style.setProperty('--bpi-serif', v); };
  document.addEventListener('DOMContentLoaded', serif);

  // ---- the story (ms) ----
  let storyEnd = 0;
  function story() {
    const g = s => $('.bpi-story ' + s);
    // 1. six strokes pinwheel in from outside and snap into a hexagon
    show(g('.hex'), 0);
    play(g('.hex'), [{ transform: 'rotate(-50deg)' }, { transform: 'rotate(0deg)' }], { duration: 1150, easing: EASE });
    $$('.bpi-story .side').forEach((s, k) => {
      const a = (-60 + 60 * k) * Math.PI / 180; // outward normal of side k
      show(s, 0); show(s.firstChild, 0);
      play(s, [
        { transform: `translate(${f(Math.cos(a) * 190)}px,${f(Math.sin(a) * 190)}px) rotate(62deg) scale(1.9,1)` },
        { transform: `translate(${f(Math.cos(a) * 60)}px,${f(Math.sin(a) * 60)}px) rotate(22deg) scale(1.25,1)`, offset: .55 },
        { transform: 'none' }], { duration: 950, delay: k * 35, easing: SNAP });
    });
    // 2. nodes pop onto the corners; a phone appears in the middle and rings
    show(g('.nodes'), 900);
    $$('.bpi-story .node').forEach((n, k) => {
      show(n, 900 + k * 55);
      play(n, [{ transform: 'scale(0)' }, { transform: 'scale(1)' }], { duration: 520, delay: 900 + k * 55, easing: SNAP, fill: 'both' });
    });
    show(g('.phone'), 1050); show(g('.phone path'), 1050);
    play(g('.phone'), [{ transform: 'scale(0) rotate(-40deg)' }, { transform: 'scale(1) rotate(0deg)' }], { duration: 600, delay: 1050, easing: SNAP, fill: 'both' });
    play(g('.phone'), [0, -14, 12, -10, 8, -5, 0].map(d => ({ transform: `rotate(${d}deg)` })), { duration: 600, delay: 1550, composite: 'add' });
    for (const [r, d] of [['.r1', 1600], ['.r2', 1700]]) {
      play(g(r), [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1)', offset: .4 }, { opacity: 0, transform: 'scale(1.15)' }], { duration: 700, delay: d, fill: 'both' });
    }
    // 3. the hexagon opens into a circle through the same corners; a waveform talks inside
    play(g('.hex'), [{ opacity: 1, transform: 'rotate(0deg) scale(1)' }, { opacity: 0, transform: 'rotate(30deg) scale(.88)' }], { duration: 420, delay: 2050, easing: EASE, fill: 'both' });
    play(g('.phone'), [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.4)' }], { duration: 300, delay: 2050, easing: EASE, fill: 'both' });
    const orbit = g('.orbit'), L = 2 * Math.PI * R;
    orbit.style.strokeDasharray = L;
    show(orbit, 2050);
    play(orbit, [{ strokeDashoffset: L, transform: 'rotate(-90deg)' }, { strokeDashoffset: 0, transform: 'rotate(-90deg)' }], { duration: 520, delay: 2050, easing: EASE, fill: 'both' });
    $$('.bpi-story .node').forEach((n, k) => play(n, [{ transform: 'scale(1)' }, { transform: 'scale(0)' }], { duration: 300, delay: 2400 + k * 30, easing: 'ease-in', fill: 'forwards' }));
    show(g('.bars'), 2350);
    $$('.bpi-story .bars line').forEach((b, i) => {
      show(b, 2350);
      const h = 2.2 + Math.sin(i * 1.7) * 1.2 + (4 - Math.abs(i - 4)) * .9;
      play(b, [{ transform: 'scaleY(1)' }, { transform: `scaleY(${f(h * 1.5)})` }, { transform: 'scaleY(1.3)' }, { transform: `scaleY(${f(h * 1.9)})` }, { transform: 'scaleY(1)' }],
        { duration: 560, delay: 2350 + i * 25, iterations: 1, easing: 'ease-in-out', fill: 'both' });
    });
    // 4. it fills in, collapses to a gold dot, and the dot shoots off
    const disc = g('.disc');
    play(disc, [{ opacity: 0, transform: 'scale(1)' }, { opacity: 1, transform: 'scale(1)', offset: .3 }, { opacity: 1, transform: 'scale(.1)' }], { duration: 520, delay: 2950, easing: 'cubic-bezier(.6,0,.3,1)', fill: 'both' });
    hide(orbit, 3130, 120); hide(g('.bars'), 3050, 160);
    const dot = g('.dot');
    show(dot, 3420, 60);
    // a little crouch, then it shoots up and away (it lands on the i at the end)
    play(dot, [
      { transform: 'translate(0,0) scale(1)', easing: 'ease-out' },
      { transform: 'translate(0,9px) scale(1.3,.75)', offset: .3, easing: 'cubic-bezier(.55,0,.9,.4)' },
      { transform: 'translate(46px,-640px) scale(.7,1.5)' }],
      { duration: 420, delay: 3440, fill: 'both' });
    hide(disc, 3470, 60);
    storyEnd = 3650;
  }

  // ---- the mark and the wordmark ----
  function mark(at) {
    const bubble = $('.bpi-mark .bubble'), L = bubble.getTotalLength ? bubble.getTotalLength() : 700;
    bubble.style.strokeDasharray = L;
    play(bubble, [{ strokeDashoffset: L }, { strokeDashoffset: 0 }], { duration: 760, delay: at, easing: IO, fill: 'both' });
    play($('.bpi-mark text'), [{ opacity: 0, transform: 'translateY(14px) scale(.9)' }, { opacity: 1, transform: 'none' }], { duration: 600, delay: at + 420, easing: SNAP, fill: 'both' });
    const tick = $('.bpi-mark .tick');
    play(tick, [{ opacity: 1, transform: 'scaleX(0)' }, { opacity: 1, transform: 'scaleX(1)' }], { duration: 500, delay: at + 700, easing: EASE, fill: 'both' });
    setTimeout(() => { serif(); word.classList.add('in'); }, at + 200);
  }

  // ---- loading: the wordmark fills as the site gets ready ----
  let ready = false, p = 0, fillFrom = Infinity, raf = 0, finished = false;
  const t0 = performance.now();
  document.addEventListener('bp:ready', () => { ready = true; });
  function tick(now) {
    raf = requestAnimationFrame(tick);
    if (now < fillFrom) return;
    const target = ready ? 100 : Math.min(86, (now - fillFrom) / 2600 * 86);
    p += (target - p) * (ready ? 0.11 : 0.06);
    if (ready && p > 99.4) p = 100;
    word.style.setProperty('--p', p.toFixed(2));
    if (p === 100) { cancelAnimationFrame(raf); land(); }
  }

  let landed = false;
  function land() {
    if (landed) return;
    landed = true;
    $$('.tittle').forEach(t => t.classList.add('land'));
    setTimeout(open, reduce ? 250 : 600);
  }

  // ---- the site opens through a widening circle ----
  let resolveIntro;
  window.bpIntro = new Promise(r => { resolveIntro = r; });
  function open() {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(raf);
    try { sessionStorage.setItem('bp-intro', '1'); } catch (e) { /* storage blocked */ }
    el.classList.add('leaving');
    const box = $('.bpi-box').getBoundingClientRect();
    const cx = box.left + box.width / 2, cy = box.top + box.height / 2;
    const end = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy)) + 40;
    setTimeout(() => {
      document.documentElement.classList.remove('bp-intro-on');
      resolveIntro(); // theme.js shows the page and plays its entrance now
      el.classList.add('open');
      const start = performance.now(), dur = reduce ? 450 : 1150;
      const step = now => {
        const t = Math.min(1, (now - start) / dur);
        const e = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // easeInOutCubic
        const r = reduce ? end : e * end;
        el.style.background = reduce
          ? `rgba(251,248,242,${(1 - t).toFixed(3)})`
          : `radial-gradient(circle at ${cx}px ${cy}px, transparent ${r}px, rgba(198,167,107,.95) ${r}px, rgba(198,167,107,.95) ${r + 2}px, #fbf8f2 ${r + 2.5}px)`;
        if (t < 1) requestAnimationFrame(step);
        else { el.remove(); anims.length = 0; }
      };
      requestAnimationFrame(step);
    }, reduce ? 150 : 280);
  }

  // skip: jump to the wordmark (the site still has to be ready before it opens)
  function skip() {
    if (finished || landed) return;
    anims.forEach(a => { try { a.finish(); } catch (e) { /* done */ } }); // story ends hidden, mark drawn
    serif();
    word.classList.add('in');
    fillFrom = Math.min(fillFrom, performance.now());
  }
  $('.bpi-skip').addEventListener('click', skip);
  addEventListener('keydown', e => { if (!finished && (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ')) skip(); });

  if (reduce) {
    // no story: the mark and wordmark appear, fill as the site loads, then fade away
    $$('.bpi-story *').forEach(n => { n.style.opacity = '0'; });
    mark(0);
    fillFrom = t0 + 400;
  } else {
    story();
    mark(storyEnd - 250);
    fillFrom = t0 + storyEnd + 250;
  }
  raf = requestAnimationFrame(tick);
  setTimeout(() => { ready = true; }, 9000); // never hold the site back for long
})();
