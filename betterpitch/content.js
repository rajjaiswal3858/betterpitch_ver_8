// Swaps the replica's text for BetterPitch copy after the page renders, without
// touching markup or styles. Injected into every HTML page by server.js.
// Keys are the original text of a text node (trimmed, whitespace collapsed).
(function () {
  const TEXT = {
    // Nav
    'Ava, the AI BDR': 'BetterPitch Voice Agents',
    'Put your outbound on autopilot.': 'AI agents that make and take your calls.',
    'Find your ideal leads': 'Build your agent',
    'AI-powered prospect identification.': 'Set goals, guardrails and a voice in minutes.',
    'B2B leads': 'Knowledge base',
    'Companies and contacts, always enriched.': 'Answers grounded in your own documents.',
    'Local data': 'Languages',
    'Region and market-level insights.': 'Natural conversations in regional languages.',
    'Run autonomous campaigns': 'Run calling campaigns',
    'Email and social on autopilot, calls queued.': 'Outbound and inbound calls at any scale.',
    'Cold outbound': 'Lead qualification',
    'Target net-new prospects.': 'Call new leads within seconds.',
    'Signals': 'Collections',
    'Reach prospects when they show intent.': 'Polite, compliant payment reminders.',
    'CRM': 'Customer support',
    'Reengage existing and churned contacts.': 'Answer every call, day or night.',
    'Cross-sell and upsell': 'Feedback & surveys',
    'Expand revenue from existing customers.': 'Collect structured answers by voice.',
    'Book meetings on autopilot': 'Book appointments automatically',
    'Automated scheduling and follow ups.': 'Schedule, confirm and reschedule on the call.',
    'Startups': 'Startups',
    'Launch and scale outbound, fast.': 'Go live with your first agent this week.',
    'SMBs': 'SMBs',
    'Grow your business, efficiently.': 'Handle more calls without hiring more agents.',
    'Enterprise': 'Enterprise',
    'Scale outbound with full control.': 'Millions of calls with security and control.',
    'Outbound sales strategies and AI insights.': 'Guides on voice AI for sales and support.',
    'How companies grow faster with Artisan.': 'How teams grow with BetterPitch.',
    'Join the team building AI employees.': 'Help us build voice agents people enjoy talking to.',
    'Built for the best. Backed by the best.': 'The team behind BetterPitch.',
    'Artisan in the news and media assets.': 'BetterPitch news and media kit.',
    'Looking for AI employees for all roles?': 'Multilingual calling is here.',
    'artie': 'BetterPitch',

    // Hero
    'AI BDR': 'AI voice agent',
    'that runs in your stack, alongside your team': 'that calls, qualifies and follows up for your team',
    'Ava finds leads, enriches them, sends personalized messages, and books meetings on behalf of your reps.':
      'BetterPitch agents call your leads and customers, talk naturally in their language, and log every outcome straight into your CRM.',
    'Looking for Artie?': 'Prefer to talk first?',
    'Explore Artie': 'Call our demo agent',
    'Ava 2.0 is live now': 'Multilingual calling is live',
    'Scale pipeline without adding headcount': 'Handle more calls without adding headcount',
    'With Ava 2.0 you get full control over outbound working alongside your reps to scale efficiently.':
      'BetterPitch agents switch languages mid-call, hand off to your team when needed, and never miss a follow-up.',
    'Trusted by 6,000+ sales teams, from startups to enterprise': 'Trusted by sales, support and collections teams',

    // Case study (placeholders: fill with real BetterPitch results)
    '20x ROI': '[00]x ROI',
    '$700K ARR sourced in 6 months': '[Result] in [timeframe]',
    "We've replaced our entire outbound sales team with Artisan, and they help close $100K deals day after day.":
      '[Customer quote about BetterPitch goes here.]',
    'Jason Lemkin': '[Customer name]',
    'Founder & CEO, SaaStr': '[Title, Company]',
    '$52 CPL': '[00]% connect rate',
    'From 400k+ personalized emails': 'Across [00]k+ calls',

    // Deployment
    'Run Ava alongside': 'Run BetterPitch yourself,',
    "your stack, or let her replace it": 'or let us run it for you',
    "Some teams plug Ava into their stack, others hand her the whole motion. You can switch whenever you're ready.":
      'Build agents in the self-serve platform, or have our team design, launch and tune them for you.',
    'Alongside your stack': 'Self-serve platform',
    'Ava plugs into the tools you already run and does the heavy lifting inside them. Your team keeps working where they already do.':
      'Create, test and launch agents from the dashboard or API, connected to the tools you already use.',
    'Two-way sync with your CRM, no migration': 'Two-way CRM sync with no migration',
    'Sends as your reps, respects account owners': 'Warm transfer to a person whenever needed',
    "Reps don't need to adopt another tool": 'Test every change in the browser before going live',
    'Manual touches queued as rep tasks': 'Webhooks and API for custom workflows',
    'As your outbound stack': 'Managed deployment',
    'Consolidate data, sequencing, dialing, and booking into one platform, and let Ava run the whole motion.':
      'Our team maps your call flow, writes the scripts, connects your systems and stays on until targets are met.',
    '250M+ contact database and enrichment built in': 'Call-flow design and script writing',
    'Replaces ZoomInfo, Nooks, Outreach, and more': 'Testing against your real call recordings',
    'Cut the subscription sprawl and per-seat fees': 'Integrations configured for you',
    "End-to-end autopilot when you're ready": 'Weekly reviews and tuning after launch',

    // How it works
    'How Ava runs outbound': 'How a BetterPitch agent',
    'autonomously': 'handles your calls',
    'Set your outbound strategy once. Ava finds the leads, runs the campaigns, and books the meetings.':
      'Tell it the goal once. The agent places the calls, holds the conversation and records the result.',
    'She finds and prioritizes high-intent leads': 'It learns your business',
    'Search 250M+ verified B2B contacts or import from your CRM. Ava enriches prospects using 22+ data sources, then prioritizes them by likelihood to convert using intent signals like funding rounds and leadership hires.':
      'Upload product docs, FAQs and pricing. The agent answers from your sources, follows your script and says so when it does not know.',
    'She launches personalized multi-channel sequences': 'It calls at the right moment',
    'Ava sends personalized multi-channel outreach across email and social. She queues call steps in the native dialer so your reps can click and dial without leaving the platform.':
      'Trigger calls from a form fill or upload a list. Set calling windows, retries and how many calls run at once.',
    'She tests and optimizes messaging automatically': 'It talks like a person',
    "Ava runs dozens of message variations per campaign simultaneously, testing subject lines, structure, CTAs, and tone. She shifts volume toward what's working so performance compounds over time.":
      'Low-latency speech, natural interruptions and regional accents, with language switching when the customer switches.',
    'She handles replies and books meetings autonomously': 'It takes action and reports back',
    "Ava handles every reply. She qualifies interested leads, handles objections, and books meetings directly on your reps' calendars. You set escalation rules to decide when a human gets pulled in.":
      'It books meetings, sends payment links and transfers to your team mid-call, then writes a transcript, summary and outcome to your CRM.',

    // Platform
    'whole outbound stack': 'whole voice platform',
    'in one place': 'in one place',
    "Data, campaigns, engagement, and autonomy, consolidated. Start with one motion and expand when you're ready.":
      'Agents, knowledge, campaigns and analytics together. Start with one use case and add more when you are ready.',
    'Start with the right data': 'Ground agents in your knowledge',
    '250M+ contacts enriched from 22+ sources. Intent signals, website visitors, and product data tell Ava when to act.':
      'Docs, FAQs and live data from your systems keep every answer accurate.',
    'Run every campaign type': 'Run inbound and outbound calls',
    'Cover every channel': 'Follow up on WhatsApp and SMS',
    'Let Ava handle replies': 'Track every outcome',
    'Plug into your stack': 'Sync with your CRM',

    // Use cases
    '20+ campaigns': 'Use cases',
    'to grow your pipeline': 'for every call you make',
    'Every campaign ships ready to run from the library. Ava suggests campaigns that fit your goals.':
      'Start from a ready-made agent template and adapt it to your script.',
    "Net-new pipeline when you're ready to scale into new markets.": 'Turn more leads into meetings.',
    'B2B cold outbound': 'Lead qualification',
    'Website visitor de-anonymization': 'Outbound sales calls',
    'Intent-triggered outreach': 'Appointment booking',
    'Known contacts': 'Collections',
    'Everyone already in your CRM who deserves a second conversation.': 'Recover payments with polite, compliant reminders.',
    'CRM leads reactivation': 'EMI and payment reminders',
    'Closed lost follow-up': 'Promise-to-pay capture',
    'Event follow-up': 'Renewal calls',
    'Existing customers': 'Support & feedback',
    'Grow the accounts you already have, from CRM and product usage data.': 'Answer customers around the clock and hear what they think.',
    'Upsell & cross-sell': 'Inbound customer support',
    'Self-serve to sales-assisted': 'NPS and feedback surveys',
    'New customer onboarding': 'Order confirmation calls',
    'View all campaigns': 'View all use cases',

    // Guardrails
    'You set the guardrails': 'You set the guardrails',
    'Ava runs the rest': 'the agent runs the calls',
    'Ava owns the execution, you own the constraints. You can set rules per campaign and change them anytime.':
      'Decide what agents can say and do, per campaign, and change it anytime.',
    'Approval mode': 'Script controls',
    'Have Ava draft every reply and wait for your click, or let her send.': 'Keep agents on message with required and forbidden phrases.',
    'Respects your account owners': 'Calling compliance',
    'Ava knows who owns what, sends as the right person, and never steps on an active account.': 'Calling windows, DND checks and consent records built in.',
    'Escalation rules': 'Human handoff',
    'Decide when a human steps in. Ava hands off the moment a conversation crosses your line.': 'Transfer to your team the moment a call needs a person.',
    'Exclusion and DNC lists': 'Do-not-call lists',
    'Domains and accounts Ava will never touch, enforced automatically.': 'Numbers the agent will never dial, enforced automatically.',

    // Security
    'AI guardrails & policy controls': 'PII redaction in transcripts',
    'Workspace isolation per brand': 'Data residency options',

    // Segments
    'Start building your pipeline in minutes without hiring a BDR.': 'Launch a voice agent in days, not months.',
    'More pipeline per rep, without adding headcount.': 'Handle more calls without hiring more agents.',

    // Footer
    'Meet Artie': 'Voice agents',
    'Find leads': 'Agent builder',
    'Intent signals': 'Languages',
    'Run campaigns': 'Campaigns',
    'Book meetings': 'Analytics',
    'Artisan vs 11x': 'Developers',
    'Artisan vs AiSDR': 'API docs',
    'Artisan university': 'BetterPitch academy',
    'What is an AI BDR?': 'What is an AI voice agent?',
    'How to use AI for cold email': 'Voice AI for collections',
    'AI lead generation strategies': 'Speed-to-lead with AI calling',
    'How to use AI for sales prospecting': 'Multilingual customer support',
    '© 2026 Artisan AI Inc. All rights reserved.': '© 2026 BetterPitch. All rights reserved.',
  };

  // Brand words inside any remaining text.
  const WORDS = [
    [/\bArtisan AI Inc\.?/g, 'BetterPitch'],
    [/\bArtisan\b/g, 'BetterPitch'],
    [/\bAva\b/g, 'BetterPitch'],
    [/\bAI BDRs?\b/g, 'AI voice agent'],
  ];

  const norm = s => s.replace(/\s+/g, ' ').trim();
  const done = new WeakMap(); // text node -> text we set, so React rewrites get redone

  function swapText(node) {
    // Never touch inline script data: Next.js RSC rows are length-prefixed.
    const p = node.parentNode;
    if (!p || /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE)$/.test(p.nodeName)) return;
    if (done.get(node) === node.nodeValue) return;
    const raw = node.nodeValue;
    const key = norm(raw);
    if (!key) return;
    let out = TEXT[key];
    if (out === undefined) {
      out = key;
      for (const [re, to] of WORDS) out = out.replace(re, to);
      if (out === key) return;
    }
    node.nodeValue = raw.replace(raw.trim(), out);
    done.set(node, node.nodeValue);
  }

  function swapAttrs(el) {
    for (const a of ['alt', 'aria-label', 'title', 'placeholder']) {
      const v = el.getAttribute && el.getAttribute(a);
      if (!v) continue;
      let out = TEXT[norm(v)] || v;
      for (const [re, to] of WORDS) out = out.replace(re, to);
      if (out !== v) el.setAttribute(a, out);
    }
    // Replace the Artisan wordmark image with a BetterPitch wordmark of the same size.
    if (el.tagName === 'IMG' && /artisan-text-logo/.test(el.getAttribute('src') || '') && !el.dataset.bp) {
      el.dataset.bp = '1';
      const span = document.createElement('span');
      span.textContent = 'BetterPitch';
      span.style.cssText = 'font-weight:700;font-size:20px;letter-spacing:-0.02em;line-height:1;color:currentColor;display:inline-block';
      el.replaceWith(span);
    }
    // "Meet <Artie wordmark>" pill in the hero.
    if (el.tagName === 'IMG' && /\/assets\/artie\/wordmark/.test(el.getAttribute('src') || '') && !el.dataset.bp) {
      el.dataset.bp = '1';
      const span = document.createElement('span');
      span.textContent = 'BetterPitch';
      span.style.cssText = 'font-weight:700;color:currentColor';
      el.replaceWith(span);
    }
    if (el.tagName === 'A' && /artie\.ai/.test(el.getAttribute('href') || '')) el.setAttribute('href', '/request-demo');
  }

  function walk(root) {
    if (root.nodeType === 3) return swapText(root);
    if (root.nodeType !== 1) return;
    if (root.tagName === 'SCRIPT' || root.tagName === 'STYLE') return;
    swapAttrs(root);
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode: n => (n.nodeType === 1 && (n.tagName === 'SCRIPT' || n.tagName === 'STYLE'))
        ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
    });
    // Collect first: swapAttrs may replace the logo <img>, which would end the walk early.
    const nodes = [];
    let n;
    while ((n = tw.nextNode())) nodes.push(n);
    for (const x of nodes) x.nodeType === 3 ? swapText(x) : swapAttrs(x);
  }

  function run() {
    document.title = document.title.replace(/.*/, t => {
      let out = t;
      for (const [re, to] of WORDS) out = out.replace(re, to);
      return out;
    });
    walk(document.body);
  }

  // Editing text before React hydrates causes a mismatch (React error #418) and
  // React re-renders the whole page from scratch. So hide the page, wait for
  // hydration, swap, then keep watching for later client renders.
  const hide = document.createElement('style');
  hide.textContent = 'body{opacity:0!important}';
  document.head.appendChild(hide);

  // Runs fn once React has hydrated the page (hero.js, theme.js use it too, in
  // this order). Hydration leaves a __reactFiber$ property on every DOM node it
  // touched, so it's polled for on the last parts of the page rather than
  // guessed with a fixed delay; a fallback timer never leaves the page hidden.
  const hydrated = () => {
    const main = document.querySelector('main');
    if (!main) return false;
    // the nav (its logo is swapped below), every top-level section and the footer
    const els = [document.querySelector('nav a'), main, ...main.querySelectorAll(':scope > div > *'), [...document.querySelectorAll('footer a')].pop()].filter(Boolean);
    return els.every(el => Object.keys(el).some(k => k.startsWith('__reactFiber')));
  };
  window.bpReady = (fn, extra = 0) => {
    let done = false;
    const go = () => { if (!done) { done = true; setTimeout(fn, 200 + extra); } };
    const poll = () => { if (done) return; hydrated() ? go() : setTimeout(poll, 60); };
    window.addEventListener('load', poll);
    setTimeout(poll, 1500); // in case load already fired, or is slow
    setTimeout(go, 7000);
  };

  let started = false;
  function start() {
    if (started) return;
    started = true;
    run();
    new MutationObserver(muts => {
      for (const m of muts) {
        if (m.type === 'characterData') swapText(m.target);
        else if (m.type === 'attributes') swapAttrs(m.target);
        else m.addedNodes.forEach(walk);
      }
    }).observe(document.documentElement, {
      subtree: true, childList: true, characterData: true,
      attributes: true, attributeFilter: ['alt', 'aria-label', 'title', 'placeholder', 'src'],
    });
    hide.remove();
  }
  bpReady(start);
})();
