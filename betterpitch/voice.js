// Playful voice-agent effects on top of theme.js's motion layer. theme.js loads
// the vendored Motion + GSAP and fires bp:motion once its reveals are set up
// (bp:route after a client-side page change, bp:scrubs when it re-binds
// ScrollTrigger, which kills every trigger). Every section gets something that
// says "calls, voice, conversation":
//   - a small waveform at the top of each section that speaks as the section
//     scrolls in, then settles into a quiet hum
//   - call-event chips (incoming call, lead qualified, meeting booked...) that
//     spring in over the hero screenshot; on the tall dark section they float
//     up the margins with scroll, one with a live call timer
//   - logos and icon tiles ring like a phone as they come into view
//   - check marks and list icons pop in one after another
//   - numbered step badges pulse in sequence, like a number being dialled
//   - badges levitate on the security section
//   - the main CTAs send out a dial ring on hover
// The only elements added are our own aria-hidden, absolutely positioned nodes,
// appended to the nearest positioned ancestor (usually <main>) and re-placed on
// resize; everything else is classes and inline transforms that are cleared
// again afterwards, so React keeps valid references to everything it rendered.
(function () {
  if (window.top !== window) return;
  let M, G; // window.Motion, window.gsap (loaded by theme.js)
  const BACK = [0.2, 1.5, 0.4, 1]; // overshoot
  const nodes = [];    // placed decorations: {el, target, at}
  const stops = [];    // Motion inView stop functions
  const tweens = [];   // GSAP tweens
  const timers = [];
  const marks = [];    // [element, class] added to page elements
  const drifters = []; // chips tied to scroll on the dark section

  const rect = el => el.getBoundingClientRect();
  const text = el => (el.textContent || '').replace(/\s+/g, ' ').trim();
  const between = (v, a, b) => v >= a && v <= b;
  const clear = (el, props) => props.forEach(p => el.style.removeProperty(p));
  const settled = (anims, fn) => Promise.allSettled([].concat(anims).map(a => a.finished)).then(() => setTimeout(fn, 80));
  const mark = (el, cls) => { el.classList.add(cls); marks.push([el, cls]); };

  // same rules as theme.js: leave what the page positions or animates itself
  function animatedByPage(el) {
    const st = el.getAttribute('style') || '';
    if (/opacity|transform|translate|filter|clip-path/.test(st)) return true;
    const cs = getComputedStyle(el);
    return cs.translate !== 'none' || cs.transform !== 'none' || cs.position === 'absolute' || cs.position === 'fixed' || cs.position === 'sticky';
  }
  function topSections() {
    const main = document.querySelector('main');
    if (!main) return [];
    const sections = [...main.querySelectorAll('section')].filter(s => !s.parentElement.closest('section'));
    for (const d of main.querySelectorAll(':scope > div > div')) if (!d.querySelector('section') && !d.closest('section')) sections.push(d);
    return sections.sort((a, b) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
  }
  function dark(sec) {
    const m = getComputedStyle(sec).backgroundColor.match(/[\d.]+/g);
    if (!m) return false;
    const [r, g, b, a = 1] = m.map(Number);
    return a > 0.5 && r * 0.299 + g * 0.587 + b * 0.114 < 110;
  }

  // ---- decorations anchored to a page element ----

  // the positioned ancestor a decoration is appended to (body = not positioned: skip)
  function host(target) {
    const p = target.offsetParent;
    return p && p !== document.body && p !== document.documentElement ? p : null;
  }
  // at(targetRect) -> {x, y} offset from the target's top-left corner
  function add(target, el, at) {
    if (!host(target)) return null;
    el.classList.add('bpv');
    el.setAttribute('aria-hidden', 'true');
    const n = { el, target, at };
    nodes.push(n);
    place(n);
    return el;
  }
  function place(n) {
    const p = n.target.isConnected && host(n.target);
    if (!p) { n.el.remove(); return false; }
    if (n.el.parentNode !== p) p.appendChild(n.el); // also puts it back if React dropped it
    const pr = rect(p), tr = rect(n.target), o = n.at(tr);
    n.el.style.left = (tr.left - pr.left + p.scrollLeft - p.clientLeft + o.x).toFixed(1) + 'px';
    n.el.style.top = (tr.top - pr.top + p.scrollTop - p.clientTop + o.y).toFixed(1) + 'px';
    return true;
  }
  let inited = false, reinit;
  function relayout() {
    const had = nodes.length;
    for (let i = nodes.length - 1; i >= 0; i--) if (!place(nodes[i])) nodes.splice(i, 1);
    // every anchor gone at once: React re-rendered the page from scratch (a
    // hydration mismatch does that), so set everything up again on the new DOM
    if (had && !nodes.length && inited) { clearTimeout(reinit); reinit = setTimeout(() => { teardown(); init(); }, 800); }
  }
  let rl;
  const relayoutSoon = () => { clearTimeout(rl); rl = setTimeout(relayout, 120); };

  // ---- the section speaks ----

  function waves(secs) {
    for (const sec of secs) {
      if (sec.id === 'bp-hero' || rect(sec).height < 300) continue;
      const h = sec.querySelector('h1, h2, h3, p');
      const hTop = h ? rect(h).top - rect(sec).top : Infinity;
      if (hTop < 96) continue; // no room above the first text
      // sits in the section's top padding, below the fixed header when the section is scrolled to the top
      const pad = parseFloat(getComputedStyle(sec).paddingTop) || 0;
      const y = Math.min(hTop - 60, Math.max(pad / 2 + 10, 44));
      const el = document.createElement('div');
      el.className = 'bpv-wave' + (dark(sec) ? ' dark' : '');
      for (let i = 0; i < 21; i++) {
        const b = document.createElement('i'), c = 1 - Math.abs(i - 10) / 10; // taller towards the middle
        b.style.setProperty('--h', (6 + c * 13 + Math.random() * 4).toFixed(0) + 'px');
        b.style.setProperty('--dur', (0.3 + Math.random() * 0.3).toFixed(2) + 's');
        b.style.setProperty('--delay', (-Math.random()).toFixed(2) + 's');
        el.appendChild(b);
      }
      if (!add(sec, el, r => ({ x: r.width / 2 - 60, y }))) continue;
      let t;
      stops.push(M.inView(sec, () => {
        el.classList.add('on');
        t = setTimeout(() => el.classList.add('calm'), 3000);
        return () => { clearTimeout(t); el.classList.remove('on', 'calm'); };
      }, { amount: 0.12 }));
    }
  }

  // ---- call-event chips ----

  const ICON = {
    phone: '<path d="M5 4h3.5l1.8 4.5-2.2 1.4a11 11 0 0 0 5.5 5.5l1.4-2.2L19.5 15v3.5a2 2 0 0 1-2 2A15.5 15.5 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7"/>',
    cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    lang: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5a13 13 0 0 1 0 17M12 3.5a13 13 0 0 0 0 17"/>',
    user: '<circle cx="12" cy="8" r="3.8"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>',
  };
  // three layers so the spring (fill-forwards animation), the bob and GSAP's
  // scroll drift each own their own transform
  function chip(icon, label, cls) {
    const c = document.createElement('div');
    c.className = 'bpv-chip ' + (cls || '');
    c.innerHTML = '<span class="bpv-chip-in"><span class="bpv-chip-b"><i><svg viewBox="0 0 24 24">' + ICON[icon] + '</svg></i><b></b></span></span>';
    c.querySelector('b').textContent = label;
    return c;
  }

  function chips(secs) {
    // the hero screenshot: the first picture that fills its section (theme.js is
    // zooming it at this point, so only its positioning is checked)
    const first = secs.find(s => s.id !== 'bp-hero');
    const media = first && [...first.querySelectorAll('img, video')].find(m =>
      !m.closest('[class*="absolute"], [class*="pointer-events-none"]') && getComputedStyle(m).position === 'static' && rect(m).width >= rect(first).width * 0.5 && rect(m).height >= 200);
    if (media) {
      const list = [
        ['phone', 'Incoming call · +1 (415) 555-0132', r => ({ x: -14, y: 26 }), 'ring'],
        ['check', 'Lead qualified', r => ({ x: r.width + 14, y: r.height * 0.42 }), 'r ok'],
        ['cal', 'Meeting booked · Tue 10:30', r => ({ x: 24, y: r.height - 60 }), 'gold'],
        ['lang', 'Switched to Spanish', r => ({ x: r.width + 8, y: r.height - 98 }), 'r'],
      ].slice(0, rect(media).width < 640 ? 2 : 4);
      const made = list.map(([ic, label, at, cls], i) => {
        const c = chip(ic, label, cls);
        c.style.setProperty('--d', (0.3 + i * 0.55).toFixed(2) + 's');
        return add(media, c, at);
      }).filter(Boolean);
      // the picture's block is still rising when it enters: place once that's done
      if (made.length) stops.push(M.inView(media, () => { setTimeout(() => { relayout(); made.forEach(c => c.classList.add('on')); }, 900); }, { amount: 0.35 }));
    }
    // tall dark section: call events floating up the margins beside the heading
    // (only when there's room for them: the chat panel can narrow the page)
    for (const sec of secs) {
      const h = sec.querySelector('h1, h2');
      if (!dark(sec) || !h || rect(sec).height < 1500 || (rect(sec).width - rect(h).width) / 2 < 300) continue;
      const list = [
        ['phone', 'Call connected · 0:00', r => ({ x: 64, y: 150 }), 'dark ring'],
        ['lang', 'Hindi → English', r => ({ x: r.width - 64, y: 200 }), 'dark r'],
        ['user', 'Handed to a human', r => ({ x: 48, y: 330 }), 'dark'],
        ['check', 'Payment link sent', r => ({ x: r.width - 48, y: 390 }), 'dark r ok'],
      ];
      const made = list.map(([ic, label, at, cls], i) => {
        const c = chip(ic, label, cls);
        c.style.setProperty('--d', (0.2 + i * 0.4).toFixed(2) + 's');
        const el = add(sec, c, at);
        if (el) drifters.push({ el, sec, i });
        return el;
      }).filter(Boolean);
      if (!made.length) continue;
      stops.push(M.inView(sec, () => {
        relayout();
        made.forEach(c => c.classList.add('on'));
        // the first chip is a live call timer
        const b = made[0].querySelector('b');
        let s = 0;
        const tick = setInterval(() => { s++; b.textContent = 'Call connected · ' + Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }, 1000);
        timers.push(tick);
        return () => clearInterval(tick);
      }, { amount: 0.1 }));
      drift();
    }
  }
  function drift() {
    for (const d of drifters) {
      if (d.tween) d.tween.kill();
      d.tween = G.fromTo(d.el, { y: 50 + d.i * 16 }, { y: -110 - d.i * 30, ease: 'none',
        scrollTrigger: { trigger: d.sec, start: 'top 85%', end: 'top -100%', scrub: 1.2 } });
      tweens.push(d.tween);
    }
  }

  // ---- logos and icon tiles ring like a phone ----

  function wiggle(el, delay, done) {
    el.style.transition = 'none'; // the theme transitions tile transforms on hover
    tweens.push(G.to(el, { keyframes: { rotation: [0, -6, 6, -5, 5, -3, 3, 0], easeEach: 'sine.inOut' }, duration: 0.85, delay, transformOrigin: '50% 85%',
      onComplete: () => { G.set(el, { clearProps: 'transform,transformOrigin' }); clear(el, ['transition']); if (done) done(); } }));
  }
  function ringers(secs) {
    for (const sec of secs) {
      const items = [], seen = new Set();
      for (const card of sec.querySelectorAll('.rounded-2xl, .rounded-3xl')) {
        if (card.closest('li') || text(card).length > 40) continue; // logo-only cards
        const img = card.querySelector('img, svg');
        if (img && !seen.has(img) && !animatedByPage(img)) { seen.add(img); items.push([card, img, false]); }
      }
      for (const tile of sec.querySelectorAll('[class*="place-items-center"]')) {
        if (tile.closest('li') || seen.has(tile) || animatedByPage(tile)) continue; // list icons pop instead
        const r = rect(tile);
        if (!between(r.width, 32, 72) || !between(r.height, 32, 72) || !tile.querySelector('img, svg')) continue; // icon tiles only
        seen.add(tile);
        items.push([tile, tile, true]);
      }
      items.forEach(([trigger, el, tile], i) => stops.push(M.inView(trigger, () => {
        if (!between(rect(el).width, 20, 320)) return;
        const d = 0.25 + (i % 6) * 0.12;
        wiggle(el, d);
        if (tile) setTimeout(() => mark(el, 'bpv-ring'), d * 1000);
      }, { amount: 0.6 })));
    }
  }

  // ---- check marks and list icons pop in one after another ----

  function pops(secs) {
    for (const sec of secs) {
      const groups = new Map(); // list element -> its icons
      for (const li of sec.querySelectorAll('li')) {
        const r = rect(li);
        if (!r.height || r.height > 140 || text(li).length > 120) continue;
        const ic = li.querySelector('svg, img, [class*="place-items-center"]');
        if (!ic || animatedByPage(ic)) continue;
        const ir = rect(ic);
        if (!between(ir.width, 12, 64) || !between(ir.height, 12, 64)) continue;
        (groups.get(li.parentElement) || groups.set(li.parentElement, []).get(li.parentElement)).push(ic);
      }
      for (const [list, icons] of groups) {
        icons.forEach(ic => { ic.style.transition = 'none'; ic.style.transform = 'scale(0) rotate(-25deg)'; });
        stops.push(M.inView(list, () => icons.forEach((ic, i) =>
          settled(M.animate(ic, { transform: ['scale(0) rotate(-25deg)', 'scale(1) rotate(0deg)'] }, { duration: 0.75, delay: 0.3 + i * 0.09, ease: BACK }),
            () => clear(ic, ['transform', 'transition']))), { amount: 0.4 }));
      }
    }
  }

  // ---- numbered step badges pulse in sequence while their section is on screen ----

  function lives(secs) {
    for (const sec of secs) {
      const badges = [...sec.querySelectorAll('div, span')].filter(el =>
        el.children.length <= 1 && /^\d$/.test(text(el)) && !el.closest('a') && between(rect(el).width, 24, 72) && between(rect(el).height, 24, 72));
      if (!badges.length) continue;
      badges.forEach((b, i) => b.style.setProperty('--i', i));
      stops.push(M.inView(sec, () => {
        badges.forEach(b => mark(b, 'bpv-live'));
        return () => badges.forEach(b => b.classList.remove('bpv-live'));
      }, { amount: 0.15 }));
    }
  }

  // ---- badges levitate on the security section ----

  function floaters(secs) {
    for (const sec of secs) {
      const h = sec.querySelector('h1, h2');
      if (!h || !/security|trust|complian/i.test(text(h))) continue;
      const imgs = [...sec.querySelectorAll('img')].filter(i => between(rect(i).width, 56, 240) && !i.closest('li') && !animatedByPage(i)).slice(0, 6);
      stops.push(M.inView(sec, () => {
        const tw = imgs.map((img, i) => G.to(img, { y: -9, duration: 2.2 + i * 0.35, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: i * 0.4 }));
        tweens.push(...tw);
        return () => tw.forEach(t => { t.kill(); G.set(t.targets()[0], { clearProps: 'transform' }); });
      }, { amount: 0.2 }));
    }
  }

  // ---- dial ring on the main CTAs ----

  function dials() {
    for (const b of document.querySelectorAll('main a[class*="py-3.5"], main button[class*="py-3.5"], nav a[class*="py-3.5"]')) {
      if (animatedByPage(b)) continue;
      if (getComputedStyle(b).position === 'static') b.style.position = 'relative'; // for the ::after ring
      mark(b, 'bpv-dial');
    }
  }

  // ---- lifecycle ----

  let ro = null, mo = null;
  function init() {
    inited = true;
    const secs = topSections();
    waves(secs); chips(secs); ringers(secs); pops(secs); lives(secs); floaters(secs); dials();
    relayout();
    [1500, 3200].forEach(t => setTimeout(relayout, t)); // after the entrance reveals and lazy images
    const main = document.querySelector('main');
    if (main && !ro) {
      (ro = new ResizeObserver(relayoutSoon)).observe(main);
      (mo = new MutationObserver(relayoutSoon)).observe(main, { childList: true, subtree: true });
    }
  }
  function teardown() {
    stops.splice(0).forEach(s => { try { s(); } catch (e) { /* already stopped */ } });
    tweens.splice(0).forEach(t => t.kill());
    timers.splice(0).forEach(clearInterval);
    nodes.splice(0).forEach(n => n.el.remove());
    drifters.length = 0;
    marks.splice(0).forEach(([el, cls]) => el.classList.remove(cls));
  }

  document.addEventListener('bp:motion', () => {
    M = window.Motion; G = window.gsap;
    if (M && G) init();
  });
  document.addEventListener('bp:route', () => { if (M) { teardown(); init(); } });
  document.addEventListener('bp:scrubs', () => { if (G) { drift(); relayout(); } });
  addEventListener('resize', relayoutSoon);
})();
