// Motion layer for the BetterPitch theme (colours live in theme.css). Injected
// into every HTML page by server.js; once React has hydrated it loads the
// vendored libraries from /__bp/vendor/ (loading them earlier lets ScrollTrigger
// touch <body> during hydration, which React reports as a mismatch):
//   - Motion (framer-motion's DOM API): page entrance, scroll reveals, masked
//     image reveals, staggered headings and the page-transition veil
//   - GSAP + ScrollTrigger: scroll-scrubbed image parallax and the hero exit
//   - GSAP quickTo: 3D card tilt and magnetic buttons (fine pointers only)
// Like content.js it waits for React to hydrate. It only adds attributes,
// transient inline styles and three fixed overlays; split headings are put back
// to their original text nodes once revealed, so no element is moved, removed
// or re-ordered and React keeps valid references to everything it rendered.
// voice.js (the playful voice-agent effects) builds on this layer: it listens
// for bp:motion (libraries loaded, reveals set up), bp:route (reveals set up
// again after a client-side page change) and bp:scrubs (ScrollTrigger re-bound).
(function () {
  // pages framed inside the site (the chat widget) keep the colours, not the motion
  if (window.top !== window) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  let M, G, ST; // window.Motion, window.gsap, window.ScrollTrigger once loaded

  const EASE = [0.22, 1, 0.36, 1];      // expo-like out
  const EASE_IO = [0.76, 0, 0.24, 1];   // for the veil
  const EASE_WORD = [0.34, 1.25, 0.64, 1]; // words land with a small bounce

  // hold the page hidden until entrance states are set (content.js / hero.js
  // unhide on the same tick; this keeps the first frame from flashing)
  const hide = document.createElement('style');
  hide.textContent = 'body{opacity:0!important}';
  if (!reduce) document.head.appendChild(hide);

  // the site scrolls inside #page-scroller, except where that element doesn't overflow
  const scroller = () => {
    const sc = document.getElementById('page-scroller');
    return sc && sc.scrollHeight > sc.clientHeight ? sc : document.scrollingElement;
  };

  // Elements already animated by the page's own scripts (inline opacity /
  // transform / filter) or positioned with translate utilities are left alone.
  function animatedByPage(el) {
    const st = el.getAttribute('style') || '';
    if (/opacity|transform|translate|filter|clip-path/.test(st)) return true;
    const cs = getComputedStyle(el);
    return cs.translate !== 'none' || cs.transform !== 'none' || cs.position === 'absolute' || cs.position === 'fixed' || cs.position === 'sticky';
  }
  const clear = (el, props) => props.forEach(p => el.style.removeProperty(p));
  // Motion writes the final keyframe back to inline style just after `finished`
  // resolves, so clean-up runs a beat later (the values are the natural ones by then)
  const settled = (anims, fn) => Promise.allSettled([].concat(anims).map(a => a.finished)).then(() => setTimeout(fn, 80));

  // ---- staggered headings ----

  // Wraps each word of a heading in a mask; returns a restore() that puts the
  // original text nodes back. Text inside gradient-clipped elements stays whole
  // (splitting would break background-clip:text) and those elements fade instead.
  const clipsText = el => { const cs = getComputedStyle(el); return cs.webkitBackgroundClip === 'text' || cs.backgroundClip === 'text'; };
  function split(h) {
    if (clipsText(h)) return null;
    const words = [], wholes = [], swaps = [];
    const tw = document.createTreeWalker(h, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
      acceptNode(n) {
        if (n.nodeType === 1) {
          if (clipsText(n)) { wholes.push(n); return NodeFilter.FILTER_REJECT; }
          return NodeFilter.FILTER_SKIP;
        }
        return n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
    });
    const texts = [];
    while (tw.nextNode()) if (tw.currentNode.nodeType === 3) texts.push(tw.currentNode);
    // text sitting directly in a flex/grid container is one anonymous item;
    // splitting it would turn every word into its own item and re-flow the heading
    if (texts.some(t => /flex|grid/.test(getComputedStyle(t.parentNode).display))) return null;
    for (const t of texts) {
      const frag = document.createDocumentFragment(), made = [];
      for (const part of t.nodeValue.split(/(\s+)/)) {
        if (!part) continue;
        let n;
        if (/^\s+$/.test(part)) n = document.createTextNode(part);
        else {
          n = document.createElement('span');
          n.className = 'bp-w';
          n.innerHTML = '<span class="bp-wi"></span>';
          n.firstChild.textContent = part;
          words.push(n.firstChild);
        }
        frag.appendChild(n);
        made.push(n);
      }
      if (!made.length) continue;
      t.parentNode.replaceChild(frag, t);
      swaps.push([t, made]);
    }
    // order the fading whole-elements among the words by document position
    const units = [...words, ...wholes].sort((a, b) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
    return {
      units,
      restore() {
        for (const [t, made] of swaps) {
          if (!made[0].isConnected) continue;
          made[0].parentNode.insertBefore(t, made[0]);
          made.forEach(n => n.remove());
        }
        wholes.forEach(w => clear(w, ['opacity']));
      },
    };
  }

  function revealHeading(h, delay) {
    if (h.dataset.bpSplit) return;
    h.dataset.bpSplit = '1';
    const s = split(h);
    if (!s || !s.units.length) return;
    const words = s.units.filter(u => u.classList && u.classList.contains('bp-wi'));
    const wholes = s.units.filter(u => !words.includes(u));
    words.forEach(w => { w.style.transform = 'translateY(118%)'; });
    wholes.forEach(w => { w.style.opacity = '0'; });
    const run = () => {
      const anims = s.units.map((u, i) => words.includes(u)
        ? M.animate(u, { transform: ['translateY(118%)', 'translateY(0%)'] }, { duration: 1.05, delay: delay + i * 0.045, ease: EASE_WORD })
        : M.animate(u, { opacity: [0, 1] }, { duration: 1.1, delay: delay + i * 0.045, ease: EASE }));
      settled(anims, s.restore);
    };
    return run;
  }

  // ---- scroll reveals ----

  // Content blocks to reveal inside one top-level section: the children of its
  // main content column, and the cards inside row/grid containers among them.
  function targets(section) {
    const col = section.querySelector('[class*="max-w-7xl"], [class*="max-w-[1320px]"]') || section.firstElementChild;
    if (!col) return [];
    if (/(^|\s)grid(\s|$)/.test(col.getAttribute('class') || '')) return [...col.children].map((c, i) => [c, i]);
    const out = [];
    for (const child of col.children) {
      if (child.querySelector('[class*="sticky"]')) continue; // scroll-driven section: leave intact
      const cls = child.getAttribute('class') || '';
      const isRow = /(^|\s)(grid|lg:flex-row|md:grid)/.test(cls) && child.children.length > 1;
      if (isRow) out.push(...[...child.children].map((c, i) => [c, i]));
      else out.push([child, 0]);
    }
    return out;
  }

  // a block whose main content is a picture gets a masked wipe instead of a rise
  function mediaOf(el) {
    for (const m of el.querySelectorAll('img, video, picture, canvas')) {
      if (m.offsetWidth >= el.offsetWidth * 0.6 && m.offsetHeight >= 140) return m;
    }
    return null;
  }

  function topSections() {
    const main = document.querySelector('main');
    if (!main) return [];
    const sections = [...main.querySelectorAll('section')].filter(s => s.id !== 'bp-hero' && !s.parentElement.closest('section'));
    for (const d of main.querySelectorAll(':scope > div > div')) if (!d.querySelector('section') && !d.closest('section')) sections.push(d);
    return sections;
  }

  const seen = new WeakSet();
  // entrance = true: blocks already on screen animate now (page load / route change)
  function reveal(entrance) {
    const vh = innerHeight;
    const headings = [];
    topSections().forEach(sec => {
      let n = 0;
      for (const [el, i] of targets(sec)) {
        if (seen.has(el) || animatedByPage(el)) continue;
        seen.add(el);
        const top = el.getBoundingClientRect().top;
        if (top < vh && !entrance) continue; // already visible: never blink out
        const delay = Math.min(i, 5) * 0.09 + Math.min(n, 2) * 0.06 + (entrance && top < vh ? 0.15 : 0);
        const media = mediaOf(el);
        el.setAttribute('data-bp-reveal', '');
        if (media && (media.dataset.bpParallax || !animatedByPage(media))) {
          // a parallaxed picture already carries a zoom (GSAP owns its transform)
          const zoom = !media.dataset.bpParallax;
          el.style.clipPath = 'inset(14% 0 14% 0 round 28px)';
          el.style.opacity = '0';
          if (zoom) media.style.transform = 'scale(1.08)';
          M.inView(el, () => {
            settled(M.animate(el, { clipPath: ['inset(14% 0 14% 0 round 28px)', 'inset(0% 0 0% 0 round 0px)'], opacity: [0, 1] }, { duration: 1.3, delay, ease: EASE }),
              () => { clear(el, ['clip-path', 'opacity']); el.removeAttribute('data-bp-reveal'); });
            if (zoom) settled(M.animate(media, { transform: ['scale(1.08)', 'scale(1)'] }, { duration: 1.6, delay, ease: EASE }), () => clear(media, ['transform']));
          }, { amount: 0.1, margin: '0px 0px -6% 0px' });
        } else {
          el.style.opacity = '0';
          el.style.transform = 'translateY(32px)';
          M.inView(el, () => {
            settled(M.animate(el, { opacity: [0, 1], transform: ['translateY(32px)', 'translateY(0px)'] }, { duration: 1.1, delay, ease: EASE }),
              () => { clear(el, ['opacity', 'transform']); el.removeAttribute('data-bp-reveal'); });
          }, { amount: 0.1, margin: '0px 0px -6% 0px' });
        }
        n++;
      }
      for (const h of sec.querySelectorAll('h1, h2')) headings.push(h);
    });

    // headings: words rise in as each heading enters view. They're split only
    // as they come near, so a heading is in its split state just briefly.
    for (const h of headings) {
      if (h.dataset.bpSplit || h.closest('#bp-hero') || animatedByPage(h) || h.textContent.trim().length > 140) continue;
      const top = h.getBoundingClientRect().top;
      if (top < vh && !entrance) continue;
      if (top < vh) { const run = revealHeading(h, 0.25); if (run) run(); continue; }
      M.inView(h, () => {
        const run = revealHeading(h, 0.1);
        if (run) M.inView(h, run, { amount: 0.2 });
      }, { margin: '0px 0px 35% 0px' });
    }
  }

  // nav and hero settle in on first load
  function entrance() {
    const nav = document.querySelector('#page-scroller nav, nav');
    if (nav) {
      const items = [...nav.querySelectorAll('a, button')].filter(el => el.offsetParent && !animatedByPage(el)).slice(0, 8);
      items.forEach(el => { el.style.opacity = '0'; });
      settled(M.animate(items, { opacity: [0, 1], transform: ['translateY(-10px)', 'translateY(0px)'] }, { duration: 0.9, delay: M.stagger(0.06, { startDelay: 0.1 }), ease: EASE }),
        () => items.forEach(el => clear(el, ['opacity', 'transform'])));
    }
    const hero = document.querySelector('#bp-hero h1');
    if (hero && !hero.dataset.bpSplit) { const run = revealHeading(hero, 0.2); if (run) run(); }
  }

  // ---- scroll-scrubbed effects (GSAP ScrollTrigger) ----

  let boundScroller = null;
  function scrubs() {
    ST.getAll().forEach(t => t.kill());
    const sc = boundScroller = scroller();
    ST.defaults({ scroller: sc === document.scrollingElement ? window : sc });

    // image parallax: pictures that fill an overflow-clipped frame drift slowly
    let count = 0;
    for (const img of document.querySelectorAll('main img, main video')) {
      if (count >= 24 || img.closest('#bp-hero') || img.offsetWidth < 260 || img.offsetHeight < 180) continue;
      let f = img.parentElement, clipped = null;
      for (let k = 0; f && k < 3; k++, f = f.parentElement) {
        const ov = getComputedStyle(f).overflow;
        if (/hidden|clip/.test(ov)) { clipped = f; break; }
      }
      if (!clipped || (!img.dataset.bpParallax && animatedByPage(img))) continue;
      if (img.offsetWidth < clipped.clientWidth - 2 || img.offsetHeight < clipped.clientHeight - 2) continue;
      img.dataset.bpParallax = '1';
      G.fromTo(img, { yPercent: -3.5, scale: 1.09 }, { yPercent: 3.5, scale: 1.09, ease: 'none',
        scrollTrigger: { trigger: clipped, start: 'top bottom', end: 'bottom top', scrub: 0.8 } });
      count++;
    }

    // home hero: copy drifts up and softens as it leaves; the tile field lags behind
    const hero = document.querySelector('#bp-hero .bph-box');
    if (hero) {
      G.to('#bp-hero .bph-copy', { yPercent: -10, opacity: 0.55, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 } });
      G.to('#bp-hero .bph-tiles', { yPercent: 8, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 } });
    }
    ST.refresh();
    document.dispatchEvent(new Event('bp:scrubs'));
  }

  // ---- pointer interactions (GSAP quickTo) ----

  const CARD = 'main .rounded-2xl:is(.bg-white,.bg-primary-50,.bg-secondary-light-ivory):not([class*="py-16"]):not([class*="py-30"]), main .rounded-3xl.bg-white';
  const MAGNET = 'main a[class*="py-3.5"], main button[class*="py-3.5"], nav a[class*="py-3.5"], .bph-btn';

  function pointer() {
    let card = null, cardTo = null, btn = null, btnTo = null;
    function leaveCard() {
      if (!card) return;
      const c = card;
      card.classList.remove('bp-tilt');
      G.to(c, { rotationX: 0, rotationY: 0, y: 0, duration: 0.8, ease: 'expo.out', onComplete: () => G.set(c, { clearProps: 'transform,translate,rotate,scale' }) });
      card = null;
    }
    function leaveBtn() {
      if (!btn) return;
      const b = btn;
      G.to(b, { x: 0, y: 0, scale: 1, duration: 0.7, ease: 'elastic.out(1,0.5)', onComplete: () => G.set(b, { clearProps: 'transform,translate,rotate,scale' }) });
      btn = null;
    }
    document.addEventListener('pointermove', e => {
      const t = e.target instanceof Element ? e.target : null;
      // 3D tilt on cards that aren't moving for another reason
      // the outermost card: panels nested inside a card match the selector too
      let c = t && t.closest(CARD);
      for (let up; c && (up = c.parentElement && c.parentElement.closest(CARD));) c = up;
      if (c !== card) {
        leaveCard();
        if (c && c.offsetWidth <= 680 && !c.hasAttribute('data-bp-reveal') && (c.dataset.bpTilt || !animatedByPage(c))) {
          card = c;
          card.dataset.bpTilt = '1';
          card.classList.add('bp-tilt');
          G.set(card, { transformPerspective: 1100 });
          cardTo = { rx: G.quickTo(card, 'rotationX', { duration: 0.6, ease: 'power3.out' }), ry: G.quickTo(card, 'rotationY', { duration: 0.6, ease: 'power3.out' }) };
          G.to(card, { y: -4, duration: 0.6, ease: 'power3.out' });
        }
      }
      if (card) {
        const r = card.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        cardTo.rx((0.5 - py) * 5);
        cardTo.ry((px - 0.5) * 6);
        card.style.setProperty('--bp-mx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--bp-my', (py * 100).toFixed(1) + '%');
      }
      // magnetic CTAs
      const b = t && t.closest(MAGNET);
      if (b !== btn) {
        leaveBtn();
        if (b && (b.dataset.bpMagnet || !animatedByPage(b))) {
          btn = b;
          btn.dataset.bpMagnet = '1';
          btnTo = { x: G.quickTo(btn, 'x', { duration: 0.5, ease: 'power3.out' }), y: G.quickTo(btn, 'y', { duration: 0.5, ease: 'power3.out' }) };
        }
      }
      if (btn) {
        const r = btn.getBoundingClientRect();
        btnTo.x(Math.max(-6, Math.min(6, (e.clientX - r.left - r.width / 2) * 0.18)));
        btnTo.y(Math.max(-5, Math.min(5, (e.clientY - r.top - r.height / 2) * 0.25)));
      }
    }, { passive: true });
    document.addEventListener('pointerleave', () => { leaveCard(); leaveBtn(); });
    // press: GSAP owns a magnetic button's transform (it pins `scale: none`
    // inline), so the CSS :active scale can't apply and the press is done here
    document.addEventListener('pointerdown', () => { if (btn) G.to(btn, { scale: 0.97, duration: 0.15, ease: 'power2.out' }); });
    document.addEventListener('pointerup', () => { if (btn) G.to(btn, { scale: 1, duration: 0.45, ease: 'expo.out' }); });
  }

  // ---- page transitions ----

  let veil = null;
  function veilEl() {
    if (!veil) {
      veil = document.createElement('div');
      veil.id = 'bp-veil';
      veil.setAttribute('aria-hidden', 'true');
      veil.innerHTML = '<i></i>';
    }
    if (!veil.isConnected) document.body.appendChild(veil);
    return veil;
  }
  let veilTimer = 0, veilUp = false;
  function veilIn() {
    const v = veilEl();
    veilUp = true;
    v.classList.add('on');
    v.style.visibility = 'visible';
    M.animate(v, { opacity: [0, 1], clipPath: ['inset(100% 0 0 0)', 'inset(0% 0 0 0)'] }, { duration: 0.55, ease: EASE_IO });
    M.animate(v.firstChild, { transform: ['scaleX(0)', 'scaleX(1)'] }, { duration: 0.7, delay: 0.2, ease: EASE });
    clearTimeout(veilTimer);
    veilTimer = setTimeout(veilOut, 2600); // the click didn't navigate after all
  }
  function veilOut() {
    clearTimeout(veilTimer);
    if (!veilUp) return;
    veilUp = false;
    const v = veilEl();
    settled(M.animate(v, { clipPath: ['inset(0 0 0% 0)', 'inset(0 0 100% 0)'] }, { duration: 0.75, ease: EASE_IO }),
      () => { if (!veilUp) { v.classList.remove('on'); v.style.visibility = 'hidden'; } });
  }

  function transitions() {
    // exit: internal links to another page raise the veil (clicks that a page
    // script cancels, or that never navigate, lower it again on a timer)
    document.addEventListener('click', e => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target instanceof Element && e.target.closest('a[href]');
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
      const u = new URL(a.href, location.href);
      if (u.origin !== location.origin || u.pathname.startsWith('/__ext') || u.pathname === location.pathname) return;
      veilIn();
    });
    // entrance after a client-side route change: wait for React to render the
    // new page, then lower the veil and set up reveals for the new content
    let path = location.pathname;
    const changed = () => {
      if (location.pathname === path) return;
      path = location.pathname;
      setTimeout(() => {
        veilOut();
        scrubs();
        reveal(true);
        document.dispatchEvent(new Event('bp:route'));
      }, 380);
    };
    for (const k of ['pushState', 'replaceState']) {
      const orig = history[k];
      history[k] = function () { const r = orig.apply(this, arguments); changed(); return r; };
    }
    addEventListener('popstate', changed);
    // returning via the back/forward cache must not show a raised veil
    addEventListener('pageshow', e => { if (e.persisted) { veilUp = true; veilOut(); } });
  }

  // ---- overlays ----

  function progress() {
    const bar = document.createElement('div');
    bar.id = 'bp-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    let raf = 0;
    const update = () => {
      raf = 0;
      // React can re-render <body> after a hydration mismatch, dropping the bar
      // and replacing #page-scroller, so look both up again every time
      if (!bar.isConnected) document.body.appendChild(bar);
      const sc = scroller();
      const max = sc.scrollHeight - sc.clientHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? sc.scrollTop / max : 0).toFixed(4) + ')';
    };
    // scroll doesn't bubble, but capturing on document sees every scroller
    document.addEventListener('scroll', e => {
      raf ||= requestAnimationFrame(update);
      // ScrollTrigger is bound to one element; follow a replaced #page-scroller
      if (ST && e.target.id === 'page-scroller' && e.target !== boundScroller) scrubs();
    }, { passive: true, capture: true });
    update();
  }

  function grain() {
    const g = document.createElement('div');
    g.id = 'bp-grain';
    g.setAttribute('aria-hidden', 'true');
    document.body.appendChild(g);
  }

  function load(src) {
    return new Promise((ok, fail) => {
      const s = document.createElement('script');
      s.src = '/__bp/vendor/' + src;
      s.async = false; // execute in order: ScrollTrigger needs gsap
      s.onload = ok;
      s.onerror = fail;
      document.head.appendChild(s);
    });
  }

  // The intro screen (intro.js) fills its wordmark loader until bp:ready, then
  // resolves window.bpIntro as it starts opening: the page is shown and its
  // entrance played only then, so they aren't spent behind the intro.
  const ready = () => document.dispatchEvent(new Event('bp:ready'));
  let started = false;
  async function start() {
    if (started) return;
    started = true;
    try {
      grain();
      if (reduce) { ready(); if (window.bpIntro) await window.bpIntro; return; }
      await Promise.all(['gsap.min.js', 'ScrollTrigger.min.js', 'motion.js'].map(load));
      M = window.Motion; G = window.gsap; ST = window.ScrollTrigger;
      G.registerPlugin(ST);
      ready();
      if (window.bpIntro) await window.bpIntro;
      progress();
      entrance();
      scrubs(); // before reveal(): marks the parallaxed pictures
      reveal(true);
      if (fine) pointer();
      transitions();
      document.dispatchEvent(new Event('bp:motion'));
      // lazy images change section heights: keep trigger positions current
      let rt;
      const main = document.querySelector('main');
      if (main) new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(() => ST.refresh(), 250); }).observe(main);
    } catch (e) {
      console.warn('BetterPitch motion layer off:', e);
      ready();
    } finally {
      hide.remove();
    }
  }
  // once React has hydrated (bpReady, defined in content.js), after content.js
  // has swapped the copy and hero.js has placed the hero
  bpReady(start, 120);
})();
