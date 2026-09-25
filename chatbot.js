/* Ascend Labs Assistant - self-contained chatbot, no external account needed.
   Answers questions about services, pricing, timelines, process and contact,
   and captures leads (name -> need -> contact) with a WhatsApp handoff. */
(function () {
  'use strict';

  var WA_NUMBER = '916385314684';
  var WA_LINK = 'https://wa.me/916385314684';
  var EMAIL = 'ascendlabs.com@gmail.com';

  var CSS = [
    '.ascend-fab{position:fixed;right:20px;bottom:20px;width:60px;height:60px;border-radius:50%;',
    'background:#fff;color:#000;border:none;cursor:pointer;z-index:9998;display:flex;align-items:center;',
    'justify-content:center;box-shadow:0 8px 30px rgba(255,255,255,.18);transition:transform .2s ease}',
    '.ascend-fab:hover{transform:scale(1.06)}',
    '.ascend-fab svg{width:26px;height:26px}',
    '.ascend-nudge{position:fixed;right:92px;bottom:32px;max-width:230px;background:#fff;color:#000;',
    'font-size:13px;line-height:1.4;padding:10px 36px 10px 14px;border-radius:14px;z-index:9998;',
    'box-shadow:0 8px 30px rgba(0,0,0,.4);display:none;font-family:Inter,system-ui,sans-serif}',
    '.ascend-nudge.show{display:block}',
    '.ascend-nudge button{position:absolute;right:8px;top:8px;border:none;background:none;cursor:pointer;',
    'font-size:14px;color:#666}',
    '.ascend-panel{position:fixed;right:20px;bottom:92px;width:370px;max-width:calc(100vw - 40px);',
    'height:540px;max-height:calc(100vh - 130px);background:#111;border:1px solid rgba(255,255,255,.12);',
    'border-radius:20px;z-index:9999;display:none;flex-direction:column;overflow:hidden;',
    'box-shadow:0 20px 60px rgba(0,0,0,.6);font-family:Inter,system-ui,sans-serif}',
    '.ascend-panel.open{display:flex}',
    '.ascend-head{background:#fff;color:#000;padding:14px 16px;display:flex;align-items:center;gap:10px}',
    '.ascend-head .dot{width:10px;height:10px;border-radius:50%;background:#16a34a;flex-shrink:0}',
    '.ascend-head b{font-size:15px}',
    '.ascend-head small{display:block;font-size:11px;color:#444;font-weight:400}',
    '.ascend-head button{margin-left:auto;border:none;background:none;font-size:20px;cursor:pointer;color:#000}',
    '.ascend-body{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px}',
    '.ascend-msg{max-width:85%;padding:10px 14px;border-radius:16px;font-size:14px;line-height:1.5}',
    '.ascend-msg a{color:#fff;text-decoration:underline}',
    '.ascend-bot{background:#262626;color:#e5e5e5;align-self:flex-start;border-bottom-left-radius:4px}',
    '.ascend-user{background:#fff;color:#000;align-self:flex-end;border-bottom-right-radius:4px}',
    '.ascend-typing{align-self:flex-start;background:#262626;color:#999;padding:10px 16px;border-radius:16px;font-size:14px}',
    '.ascend-chips{display:flex;flex-wrap:wrap;gap:8px;padding:0 16px 10px}',
    '.ascend-chips button{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.25);',
    'border-radius:100px;padding:7px 14px;font-size:12px;cursor:pointer}',
    '.ascend-chips button:hover{background:rgba(255,255,255,.12)}',
    '.ascend-input{display:flex;gap:8px;padding:12px;border-top:1px solid rgba(255,255,255,.1)}',
    '.ascend-input input{flex:1;background:#1a1a1a;border:1px solid rgba(255,255,255,.12);border-radius:100px;',
    'padding:10px 16px;color:#fff;font-size:14px;outline:none}',
    '.ascend-input input:focus{border-color:rgba(255,255,255,.35)}',
    '.ascend-input button{background:#fff;color:#000;border:none;border-radius:50%;width:42px;height:42px;',
    'cursor:pointer;font-size:18px;flex-shrink:0}',
    '@media (max-width:480px){.ascend-panel{right:10px;left:10px;width:auto;bottom:90px}.ascend-fab{right:14px;bottom:14px}}'
  ].join('\n');

  function injectCss() {
    var s = document.createElement('style');
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  var ICON_OPEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';
  var DEFAULT_CHIPS = ['Our services', 'Pricing', 'Timelines', 'Get a quote'];

  var RULES = [
    { keys: ['starter', '15k', '15000', 'basic plan', 'small site', '3 page'], reply: '<b>Starter - Rs 15,000.</b><br>Up to 3 pages, mobile-friendly design, contact form with WhatsApp, basic SEO, and 1 year of hosting. Ready in 7-10 days.<br><br>Want this plan? Tap <b>Get a quote</b> or <a href="pricing.html">see all plans</a>.' },
    { keys: ['professional', '25k', '25000', 'pro plan', 'most popular', '4-6', '4 to 6'], reply: '<b>Professional - Rs 25,000</b> (most popular).<br>4-6 custom pages, better design, lead capture forms, speed tuning, and 1 year of hosting. Ready in 10-14 days.<br><br>Shall I start your free quote?' },
    { keys: ['enterprise', '40k', '40000', 'custom plan', 'ecommerce', 'e-commerce', 'online store', 'shop online', 'unlimited'], reply: '<b>Enterprise - Rs 40,000+.</b><br>Unlimited pages, online shop with payments, custom features, priority support, and 1 year of hosting. Ready in 14-21 days.<br><br>Tell me what you need and I will arrange a free call.' },
    { keys: ['how much', 'price', 'pricing', 'cost', 'charge', 'much', 'rate', 'package', 'plan'], reply: 'Simple pricing, no hidden fees:<br><br><b>Starter Rs 15K</b> - up to 3 pages, 7-10 days<br><b>Professional Rs 25K</b> - 4-6 pages, 10-14 days<br><b>Enterprise Rs 40K+</b> - custom, 14-21 days<br><br>Every plan includes 1 year of hosting. Full list on our <a href="pricing.html">pricing page</a>.<br><br>Want a free quote for your work?' },
    { keys: ['website', 'site', 'web design', 'web development', 'landing page', 'redesign', 'rebuild'], reply: 'We build fast, mobile-first websites for shops, salons, cafes, gyms and clinics. Clear design, quick to load, made to bring calls and sales.<br><br>Starter (Rs 15K) suits a simple site, Professional (Rs 25K) suits growing shops. See <a href="services.html">services</a>.' },
    { keys: ['app', 'mobile app', 'android', 'ios', 'iphone', 'play store', 'flutter', 'react native'], reply: 'Yes, we build apps for iOS and Android with React Native or Flutter, backend on Firebase or Supabase, and we handle Play Store and App Store upload.<br><br>App work is quoted custom (Enterprise range). Tell me your app idea?' },
    { keys: ['instagram', 'social media', 'reels', 'poster', 'marketing', 'followers', 'content'], reply: 'Our social media service covers Instagram management, Reels and short videos, posters and graphics, a content plan, and a monthly report.<br><br>Want monthly help with your page?' },
    { keys: ['logo', 'brand', 'branding', 'identity'], reply: 'We design logos, colors, fonts and a full brand kit so your shop looks sharp everywhere - site, boards, and social.<br><br>Branding can be added to any website plan. Want a quote?' },
    { keys: ['seo', 'google', 'rank', 'ranking', 'search', 'traffic'], reply: 'Every site ships with basic SEO: proper titles, sitemap, and fast loading. For deeper growth we do keyword setup, speed fixes and technical SEO.<br><br>Want a free website audit first?' },
    { keys: ['ai', 'automat', 'chatbot', 'bot', 'whatsapp auto'], reply: 'We set up chatbots, WhatsApp auto-replies, lead follow-up and work automation so you save time and never miss a customer.<br><br>By the way, I am one! Want this on your own site too?' },
    { keys: ['how long', 'time', 'long', 'duration', 'delivery', 'deadline', 'fast', 'ready', 'timeline'], reply: 'Starter: 7-10 days. Professional: 10-14 days. Custom: 14-21 days. Work starts once we have your text and photos.<br><br>Need it urgently? Tell me your deadline.' },
    { keys: ['do you host', 'host', 'domain', 'server', 'deploy', 'launch', 'publish'], reply: 'Every plan includes 1 year of managed hosting, so you pay nothing extra to stay online. We handle setup and launch.<br><br>Already own a domain? We can connect it free.' },
    { keys: ['process', 'how it works', 'steps', 'workflow', 'start'], reply: 'How we work:<br>1. Free call - we hear your needs<br>2. Clear quote - price and days fixed<br>3. Design - you see the phone view first<br>4. Build - code, speed and SEO tested<br>5. Launch - plus 30 days of free fixes' },
    { keys: ['audit', 'review my site', 'check my site', 'free audit'], reply: 'Our free website audit checks speed, phone view, and Google basics, then tells you what to fix.<br><br>Share your site link here, or message us on <a href="' + WA_LINK + '?text=Hi%20Ascend%20Labs%2C%20I%20want%20a%20free%20website%20audit" target="_blank" rel="noopener">WhatsApp</a>.' },
    { keys: ['work', 'portfolio', 'project', 'demo', 'example', 'salon', 'cafe', 'gym', 'clinic', 'restaurant'], reply: 'We have built demos for a gym, cafe, restaurant, dental clinic and two salons. See them all on our <a href="work.html">work page</a>.<br><br>Which type is closest to your business?' },
    { keys: ['about', 'who are you', 'your team', 'company', 'ascend'], reply: 'Ascend Labs is a small digital team in Chennai. We make websites, apps, brands and SEO for shops and startups. Simple work, clear prices, fast delivery.<br><br>More on our <a href="about.html">about page</a>.' },
    { keys: ['email', 'mail'], reply: 'You can email us at <b>' + EMAIL + '</b>. We reply within 24 hours on work days.' },
    { keys: ['phone', 'number', 'call', 'whatsapp', 'contact', 'talk', 'human', 'person', 'book'], reply: 'You can reach us fastest on <a href="' + WA_LINK + '?text=Hi%20Ascend%20Labs" target="_blank" rel="noopener">WhatsApp (+91 63853 14684)</a> or email <b>' + EMAIL + '</b>. We are in Chennai and reply within 24 hours on work days.<br><br>Or tap <b>Get a quote</b> and I will take your details now.' },
    { keys: ['where', 'location', 'address', 'chennai', 'city'], reply: 'We are based in <b>Chennai, Tamil Nadu, India</b> and work with clients anywhere online.' },
    { keys: ['quote', 'estimate', 'enquiry', 'enquire', 'interested', 'get started', 'sign up'], reply: '__LEAD_START__' },
    { keys: ['thank', 'thanks', 'great', 'nice', 'awesome', 'super'], reply: 'You are welcome! Anything else - services, prices, or timelines?' },
    { keys: ['bye', 'see you', 'goodbye', 'later'], reply: 'Goodbye! When ready, message us on <a href="' + WA_LINK + '" target="_blank" rel="noopener">WhatsApp</a> or email <b>' + EMAIL + '</b>.' },
    { keys: ['hi', 'hello', 'hey', 'vanakkam', 'morning', 'evening'], reply: 'Hi! I am the Ascend Labs assistant. Ask me about our websites, prices, or timelines - or tap below.' },
    { keys: ['ok', 'yes', 'yeah', 'sure', 'please'], reply: 'Great. What would you like next - services, pricing, or a free quote?' }
  ];

  var FALLBACK = 'I am not sure about that yet. I know our services, prices, timelines and contact best. Or reach a human on <a href="' + WA_LINK + '?text=Hi%20Ascend%20Labs" target="_blank" rel="noopener">WhatsApp</a> or <b>' + EMAIL + '</b>.';

  var state = { flow: null, name: '', need: '' };

  function normalize(s) {
    return (' ' + (s || '').toLowerCase() + ' ').replace(/[^a-z0-9+ ]/g, ' ');
  }

  function findReply(text) {
    var t = normalize(text);
    var best = null, bestScore = 0;
    for (var i = 0; i < RULES.length; i++) {
      var score = 0;
      for (var j = 0; j < RULES[i].keys.length; j++) {
        if (t.indexOf(RULES[i].keys[j].toLowerCase()) !== -1) score += RULES[i].keys[j].length;
      }
      if (score > bestScore) { bestScore = score; best = RULES[i]; }
    }
    return bestScore > 0 ? best.reply : FALLBACK;
  }

  function waQuoteLink() {
    var msg = 'Hi Ascend Labs, I am ' + state.name + '. I need: ' + state.need + '. My contact: ' + state.contact;
    return WA_LINK + '?text=' + encodeURIComponent(msg);
  }

  function handleFlow(text) {
    if (state.flow === 'awaitName') {
      state.name = text.trim().slice(0, 60) || 'Friend';
      state.flow = 'awaitNeed';
      return 'Nice to meet you, <b>' + escapeHtml(state.name) + '</b>. What do you need - a new website, an app, branding, or something else?';
    }
    if (state.flow === 'awaitNeed') {
      state.need = text.trim().slice(0, 200) || 'general enquiry';
      state.flow = 'awaitContact';
      return 'Got it. Lastly, share your <b>phone number or email</b> so we can reply within 24 hours.';
    }
    if (state.flow === 'awaitContact') {
      state.contact = text.trim().slice(0, 80);
      state.flow = null;
      return 'Thanks <b>' + escapeHtml(state.name) + '</b>! Noted: <i>' + escapeHtml(state.need) + '</i>.<br><br>Tap here to send it to us now on <a href="' + waQuoteLink() + '" target="_blank" rel="noopener"><b>WhatsApp</b></a>, or just wait - we reply within 24 hours on work days.';
    }
    return null;
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function buildUi() {
    var fab = document.createElement('button');
    fab.className = 'ascend-fab';
    fab.setAttribute('aria-label', 'Chat with Ascend Labs');
    fab.innerHTML = ICON_OPEN;

    var nudge = document.createElement('div');
    nudge.className = 'ascend-nudge';
    nudge.innerHTML = '<span>Need a website? Ask me about services and pricing.</span><button aria-label="Dismiss">x</button>';

    var panel = document.createElement('div');
    panel.className = 'ascend-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Ascend Labs chat');
    panel.innerHTML =
      '<div class="ascend-head"><span class="dot"></span><div><b>Ascend Assistant</b><small>Typically replies instantly - human follow-up in 24h</small></div><button aria-label="Close chat">x</button></div>' +
      '<div class="ascend-body"></div>' +
      '<div class="ascend-chips"></div>' +
      '<div class="ascend-input"><input type="text" placeholder="Ask about services, pricing..." aria-label="Type your message"><button aria-label="Send">></button></div>';

    document.body.appendChild(fab);
    document.body.appendChild(nudge);
    document.body.appendChild(panel);
    return { fab: fab, nudge: nudge, panel: panel };
  }

  function init() {
    injectCss();
    var ui = buildUi();
    var body = ui.panel.querySelector('.ascend-body');
    var chips = ui.panel.querySelector('.ascend-chips');
    var input = ui.panel.querySelector('input');
    var sendBtn = ui.panel.querySelector('.ascend-input button');
    var opened = false;

    function addMsg(html, who) {
      var d = document.createElement('div');
      d.className = 'ascend-msg ' + (who === 'user' ? 'ascend-user' : 'ascend-bot');
      if (who === 'user') d.textContent = html;
      else d.innerHTML = html;
      body.appendChild(d);
      body.scrollTop = body.scrollHeight;
    }

    function renderChips(list) {
      chips.innerHTML = '';
      list.forEach(function (c) {
        var b = document.createElement('button');
        b.textContent = c;
        b.onclick = function () { send(c); };
        chips.appendChild(b);
      });
    }

    function botSay(html, chipList) {
      var t = document.createElement('div');
      t.className = 'ascend-typing';
      t.textContent = '...';
      body.appendChild(t);
      body.scrollTop = body.scrollHeight;
      setTimeout(function () {
        t.remove();
        addMsg(html, 'bot');
        renderChips(chipList || DEFAULT_CHIPS);
      }, 600);
    }

    function send(text) {
      var clean = (text || '').trim();
      if (!clean) return;
      addMsg(escapeHtml(clean), 'user');
      input.value = '';
      var flowReply = handleFlow(clean);
      if (flowReply) { botSay(flowReply); return; }
      var reply = findReply(clean);
      if (reply === '__LEAD_START__') {
        state.flow = 'awaitName';
        botSay('Sure, I can start your free quote. What is <b>your name</b>?');
        return;
      }
      botSay(reply);
    }

    function open() {
      ui.panel.classList.add('open');
      ui.nudge.classList.remove('show');
      try { localStorage.setItem('ascend_chat_seen', '1'); } catch (e) {}
      if (!opened) {
        opened = true;
        botSay('Hi! I am the Ascend Labs assistant. Ask me about our <b>services</b>, <b>prices</b>, or <b>timelines</b> - or tap below.');
      }
      setTimeout(function () { input.focus(); }, 100);
    }

    ui.fab.onclick = function () {
      ui.panel.classList.contains('open') ? ui.panel.classList.remove('open') : open();
    };
    ui.panel.querySelector('.ascend-head button').onclick = function () { ui.panel.classList.remove('open'); };
    ui.nudge.querySelector('button').onclick = function (e) {
      e.stopPropagation();
      ui.nudge.classList.remove('show');
      try { localStorage.setItem('ascend_chat_seen', '1'); } catch (err) {}
    };
    ui.nudge.onclick = function () { open(); };
    sendBtn.onclick = function () { send(input.value); };
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') send(input.value); });

    var seen = null;
    try { seen = localStorage.getItem('ascend_chat_seen'); } catch (e) {}
    if (!seen) setTimeout(function () { if (!ui.panel.classList.contains('open')) ui.nudge.classList.add('show'); }, 6000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
