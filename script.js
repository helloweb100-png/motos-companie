/* ==========================================================================
   MOTORS COMPANIES · «El Tablero» — script.js
   JS puro (sin librerías). Un solo listener de scroll con rAF, un solo bucle
   de animación. Todo el contenido es visible si algo falla.
   ========================================================================== */

/* Número de WhatsApp: ÚNICA fuente. Si queda vacío, se ocultan botones, enlaces y envío. */
const WHATSAPP = "524425864565";

(() => {
  'use strict';

  const root = document.documentElement;
  root.classList.add('js-ok');

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const safe = (fn) => { try { fn(); } catch (e) { console.warn('[motors]', e); } };

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  if (!reduce) root.classList.add('pinear');

  let vw = innerWidth, vh = innerHeight;
  const loops = [];            // funciones por cuadro: (t, dt)
  const onScrollFns = [];      // funciones por scroll
  const onResizeFns = [];

  /* ---------------------------------------------------------------- WhatsApp */
  const waURL = (msg) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
  const DEF_MSG = 'Hola Motors Companies, quiero información sobre sus servicios.';

  safe(function initWA() {
    $$('[data-wa]').forEach((a) => {
      if (!WHATSAPP) { a.classList.add('sin-wa'); return; }
      a.href = waURL(a.dataset.waMsg || DEF_MSG);
      a.target = '_blank';
      a.rel = 'noopener';
    });
    if (!WHATSAPP) {
      const b = $('#fEnviar'); if (b) b.classList.add('sin-wa');
    }
    const lab = $('#waLabel');
    if (lab && WHATSAPP) {
      setTimeout(() => lab.classList.add('mostrar'), 5000);
      setTimeout(() => lab.classList.remove('mostrar'), 9000);
    }
  });

  /* ----------------------------------------------------- Horario / estado vivo */
  const HORARIO = { 0: null, 1: [10, 18], 2: [10, 18], 3: [10, 18], 4: [10, 18], 5: [10, 18], 6: [10, 14] };
  const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const MAPA_DIA = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  function ahoraMX() {
    try {
      const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Mexico_City', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
      const g = (t) => parts.find((p) => p.type === t).value;
      return { dia: MAPA_DIA[g('weekday')], min: (parseInt(g('hour'), 10) % 24) * 60 + parseInt(g('minute'), 10) };
    } catch (e) {
      const d = new Date(); return { dia: d.getDay(), min: d.getHours() * 60 + d.getMinutes() };
    }
  }
  function estadoTaller() {
    const { dia, min } = ahoraMX();
    const h = HORARIO[dia];
    if (h && min >= h[0] * 60 && min < h[1] * 60) return { abierto: true, texto: '● Abierto ahora', corto: 'Abierto ahora', dia };
    let texto;
    if (h && min < h[0] * 60) texto = `Cerrado ahora · Abrimos hoy a las ${h[0]}:00`;
    else {
      let n = 1;
      while (n < 8 && !HORARIO[(dia + n) % 7]) n++;
      const d2 = (dia + n) % 7;
      texto = `Cerrado ahora · Abrimos ${n === 1 ? 'mañana' : 'el ' + DIAS[d2]} a las ${HORARIO[d2][0]}:00`;
    }
    return { abierto: false, texto, corto: 'Cerrado ahora', dia };
  }
  safe(function initEstado() {
    const caja = $('#estadoTaller'), hero = $('#heroEstado');
    const filas = $$('.horario tr[data-dia]');
    const pinta = () => {
      const e = estadoTaller();
      if (caja) { caja.classList.toggle('abierto', e.abierto); $('span', caja).textContent = e.texto; }
      if (hero) hero.textContent = '· ' + e.corto;
      filas.forEach((f) => f.classList.toggle('hoy', f.dataset.dia.split(',').map(Number).includes(e.dia)));
    };
    pinta(); setInterval(pinta, 60000);
  });

  /* ---------------------------------------------------------------- Cargador */
  let esListo = false;
  function listo() {
    if (esListo) return; esListo = true;
    root.classList.add('listo');
    setTimeout(() => { const d = $('#dialScroll'); if (d) d.classList.add('libre'); }, 1400);
  }
  safe(function initCargador() {
    const c = $('#cargador');
    if (!c) { listo(); return; }
    const arco = $('#cargaArco'), num = $('#cargaNum'), txt = $('#cargaTxt'), aguja = $('#cargaAguja'), anillo = $('.carga-anillo', c);
    const L = 439.8, DUR = 1500;
    let cerrado = false;
    const quitar = () => { if (cerrado) return; cerrado = true; c.style.display = 'none'; listo(); };
    setTimeout(quitar, 2300); // corte duro
    const fin = () => {
      if (cerrado) return;
      if (txt) txt.textContent = '¡LISTO PARA RODAR!';
      if (anillo) anillo.classList.add('destello');
      setTimeout(() => { c.classList.add('fin'); listo(); setTimeout(quitar, 620); }, reduce ? 0 : 150);
    };
    if (reduce) { c.style.transition = 'opacity .35s'; setTimeout(() => { c.style.opacity = '0'; listo(); setTimeout(quitar, 360); }, 350); return; }
    const t0 = performance.now();
    (function paso(now) {
      const p = clamp((now - t0) / DUR), e = 1 - Math.pow(1 - p, 2.2);
      if (arco) arco.style.strokeDashoffset = String(L * (1 - e));
      if (aguja) aguja.style.transform = `rotate(${e * 360}deg)`;
      if (num) num.textContent = String(Math.round(e * 100)).padStart(3, '0');
      if (p < 1) requestAnimationFrame(paso); else fin();
    })(t0);
  });
  setTimeout(listo, 3000); // respaldo final

  /* ------------------------------------------------------ Geometría de dial */
  const rad = (d) => d * Math.PI / 180;
  const ang = (v) => 135 + (v / 240) * 270;
  const pt = (r, a) => [300 + r * Math.cos(rad(a)), 300 + r * Math.sin(rad(a))];
  function arcPath(r, a0, a1) {
    const [x0, y0] = pt(r, a0), [x1, y1] = pt(r, a1);
    return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
  }
  function buildDial(g) {
    if (!g) return;
    const NS = 'http://www.w3.org/2000/svg';
    const mk = (n, at) => { const e = document.createElementNS(NS, n); for (const k in at) e.setAttribute(k, at[k]); return e; };
    g.appendChild(mk('path', { d: arcPath(279, 135, 405), fill: 'none', stroke: 'url(#gArco)', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: .8 }));
    g.appendChild(mk('path', { d: arcPath(279, ang(200), 405), fill: 'none', stroke: '#FF4D3D', 'stroke-width': 6, 'stroke-linecap': 'round' }));
    for (let i = 0; i <= 48; i++) {
      const v = i * 5, a = ang(v), mayor = i % 4 === 0;
      const [x1, y1] = pt(mayor ? 224 : 242, a), [x2, y2] = pt(262, a);
      g.appendChild(mk('line', { x1, y1, x2, y2, stroke: v >= 200 ? '#FF4D3D' : (mayor ? '#F5F1DC' : 'rgba(245,241,220,.5)'), 'stroke-width': mayor ? 4 : 2, 'stroke-linecap': 'round' }));
      if (mayor) {
        const [tx, ty] = pt(196, a);
        const t = mk('text', { x: tx, y: ty, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: v >= 200 ? '#FF8A7A' : '#F5F1DC', 'font-size': 27, 'font-weight': 800 });
        t.setAttribute('style', 'font-family:"Saira Extra Condensed","Saira Condensed",sans-serif;font-variant-numeric:tabular-nums');
        t.textContent = String(v); g.appendChild(t);
      }
    }
  }
  safe(() => { buildDial($('#dialMarcas')); buildDial($('#procMarcas')); });

  /* -------------------------------------------------------------- Estelas */
  safe(function estelas() {
    const box = $('#estelas'); if (!box || reduce) return;
    for (let i = 0; i < 13; i++) {
      const s = document.createElement('i'); s.className = 'estela';
      s.style.top = (6 + Math.random() * 84).toFixed(1) + '%';
      s.style.width = (80 + Math.random() * 130).toFixed(0) + 'px';
      s.style.setProperty('--d', (1.6 + Math.random() * 1.8).toFixed(2) + 's');
      s.style.setProperty('--r', (-Math.random() * 3).toFixed(2) + 's');
      s.style.setProperty('--c', i % 3 === 0 ? '#2FE0BE' : '#E3D43B');
      box.appendChild(s);
    }
  });

  /* ------------------------------------------------- Hero: aguja + brasas + tilt */
  const hero = $('#inicio');
  const dialEl = $('#dial');
  let heroVisible = true, heroP = 0;
  const needle = $('#agujaHero'), lecK = $('#lecKmh'), lecR = $('#lecRpm');
  const BASE = 29, PEAK = 204;
  let acc = null, nextAcc = 3200, lastK = -1;
  const tilt = { rx: 0, ry: 0, trx: 0, try: 0 };

  function valorDial(t) {
    let v = BASE + Math.sin(t * .031) * 1.1 + Math.sin(t * .017) * 1.4 + Math.sin(t * .11) * .5;
    if (!acc && t >= nextAcc) acc = { t0: t };
    if (acc) {
      const e = (t - acc.t0) / 1000;
      if (e < .9) { const k = 1 - Math.pow(1 - e / .9, 3); v = BASE + (PEAK - BASE) * k; }
      else {
        const e2 = e - .9;
        v = BASE + (PEAK - BASE) * Math.exp(-3.2 * e2) * Math.cos(9 * e2);
        if (e2 > 2) { acc = null; nextAcc = t + 5000; }
      }
    }
    return Math.max(0, v);
  }

  function setupBrasas() {
    const cv = $('#brasas'); if (!cv || reduce) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    let S = 0, dpr = 1;
    const N = vw < 768 ? 45 : 90;
    const ps = [];
    const dimension = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      S = cv.clientWidth || 300;
      cv.width = Math.round(S * dpr); cv.height = Math.round(S * dpr);
    };
    const nace = (p, inicial) => {
      const a = rad(135 + Math.random() * 270), R = (S / 1.3) * .43;
      p.x = S / 2 + Math.cos(a) * R; p.y = S / 2 + Math.sin(a) * R;
      p.vx = Math.cos(a) * (14 + Math.random() * 38); p.vy = Math.sin(a) * (14 + Math.random() * 38) - (14 + Math.random() * 26);
      p.life = 1.2 + Math.random() * 1.6; p.age = inicial ? Math.random() * p.life : 0;
      p.size = 1 + Math.random() * 2.2; p.ph = Math.random() * 6.28; p.f = 3 + Math.random() * 4; p.amp = 4 + Math.random() * 10;
      p.tq = Math.random() < .12;
    };
    dimension();
    for (let i = 0; i < N; i++) { const p = {}; nace(p, true); ps.push(p); }
    onResizeFns.push(dimension);
    loops.push((t, dt) => {
      if (!heroVisible || document.hidden) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, S, S);
      ctx.globalCompositeOperation = 'lighter';
      for (const p of ps) {
        p.age += dt;
        if (p.age >= p.life) { nace(p, false); continue; }
        p.x += p.vx * dt; p.y += p.vy * dt;
        const k = 1 - p.age / p.life;
        const al = clamp(k * (.65 + .35 * Math.sin(p.age * 18 + p.ph)));
        const x = p.x + Math.sin(p.age * p.f + p.ph) * p.amp * (1 - k * .3);
        const col = p.tq ? '47,224,190' : (k > .5 ? '242,233,107' : '227,212,59');
        ctx.fillStyle = `rgba(${col},${(al * .22).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(x, p.y, p.size * 3, 0, 6.283); ctx.fill();
        ctx.fillStyle = `rgba(${col},${al.toFixed(3)})`;
        ctx.beginPath(); ctx.arc(x, p.y, p.size, 0, 6.283); ctx.fill();
      }
    });
  }
  safe(setupBrasas);

  safe(function heroLoop() {
    if (!needle) return;
    const aplica = (v) => {
      const vv = lerp(v, 240, heroP);
      needle.setAttribute('transform', `rotate(${ang(vv).toFixed(2)} 300 300)`);
      const k = Math.round(vv);
      if (k !== lastK) {
        lastK = k;
        if (lecK) lecK.textContent = String(k);
        if (lecR) lecR.textContent = (vv / 240 * 12).toFixed(1);
      }
    };
    if (reduce) { aplica(BASE); return; }
    loops.push((t) => {
      if (!heroVisible || document.hidden) return;
      aplica(valorDial(t));
      if (fine && dialEl) {
        tilt.rx = lerp(tilt.rx, tilt.trx, .08); tilt.ry = lerp(tilt.ry, tilt.try, .08);
        dialEl.style.transform = `rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg)`;
      }
    });
    if (fine) addEventListener('pointermove', (e) => {
      tilt.try = (e.clientX / vw - .5) * 20; tilt.trx = -(e.clientY / vh - .5) * 20;
    }, { passive: true });
  });

  /* ------------------------------------------------------------- Marquesinas */
  const marqs = [];
  let scrollV = 0, scrollDir = 1, dirSuave = 1;
  safe(function marquesinas() {
    $$('[data-marquee]').forEach((el) => {
      const pista = $('.pista-m', el), g = $('.grupo', pista);
      if (!pista || !g) return;
      const m = { el, pista, g, dir: Number(el.dataset.dir) || -1, vel: Number(el.dataset.vel) || 60, x: 0, gw: 0, vis: true };
      const medir = () => {
        const w = g.offsetWidth; if (!w) return;
        m.gw = w;
        $$('.grupo.clon', pista).forEach((c) => c.remove());
        const n = Math.ceil((vw * 1.4) / w) + 1;
        for (let i = 0; i < n; i++) { const c = g.cloneNode(true); c.classList.add('clon'); pista.appendChild(c); }
      };
      medir(); onResizeFns.push(medir);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(medir);
      marqs.push(m);
    });
    if (reduce) return;
    loops.push((t, dt) => {
      dirSuave = lerp(dirSuave, scrollDir, .08);
      for (const m of marqs) {
        if (!m.gw) continue;
        const sp = (m.vel + scrollV * 38) * dt * dirSuave * m.dir;
        m.x += sp;
        const px = ((m.x % m.gw) + m.gw) % m.gw - m.gw;
        m.pista.style.transform = `translate3d(${px.toFixed(1)}px,0,0)`;
      }
    });
  });

  /* ------------------------------------------------------------ Revelados */
  const revEls = $$('[data-reveal]');
  const pendientes = new Set(revEls);
  const mostrar = (el) => { el.classList.add('vis'); pendientes.delete(el); };
  safe(function revelados() {
    if (!('IntersectionObserver' in window)) { revEls.forEach(mostrar); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { mostrar(e.target); io.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -4% 0px' });
    revEls.forEach((el) => io.observe(el));
  });
  function respaldoGeometria() {
    pendientes.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < vh * .96 && r.bottom > 0) mostrar(el);
    });
  }
  addEventListener('load', () => setTimeout(respaldoGeometria, 2000));
  setTimeout(respaldoGeometria, 3200);

  /* ------------------------------------------------------- Manifiesto */
  const manif = $('#manifiesto');
  let palabras = [], palOn = -1;
  safe(function manifiesto() {
    const h = $('[data-palabras]'); if (!h) return;
    const walk = (node) => {
      Array.from(node.childNodes).forEach((ch) => {
        if (ch.nodeType === 3) {
          const frag = document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach((tok) => {
            if (!tok) return;
            if (/^\s+$/.test(tok)) frag.appendChild(document.createTextNode(tok));
            else { const s = document.createElement('span'); s.className = 'palabra'; s.textContent = tok; frag.appendChild(s); }
          });
          ch.replaceWith(frag);
        } else if (ch.nodeType === 1) walk(ch);
      });
    };
    walk(h);
    palabras = $$('.palabra', h);
  });
  function actualizaManifiesto() {
    if (!manif) return;
    const h = $('[data-palabras]');
    if (h && palabras.length) {
      const r = h.getBoundingClientRect();
      const p = reduce ? 1 : clamp((vh * .88 - r.top) / (vh * .43 + r.height));
      const n = Math.round(p * palabras.length);
      if (n !== palOn) { palabras.forEach((w, i) => w.classList.toggle('on', i < n)); palOn = n; }
    }
    const rm = manif.getBoundingClientRect();
    if (rm.bottom < -100 || rm.top > vh + 100) return;
    const p = clamp((vh - rm.top) / (rm.height + vh));
    const pg = $('#palGig'), eg = $('#engManif');
    if (pg && !reduce) pg.style.transform = `translate3d(${((0.15 - p) * vw * 1.1).toFixed(1)}px,0,0)`;
    if (eg && !reduce) eg.style.transform = `rotate(${(p * 360).toFixed(1)}deg)`;
  }

  /* ------------------------------------------------------- Servicios (pila) */
  const cards = $$('.tarjeta');
  function actualizaPila() {
    if (!cards.length) return;
    if (vw < 900 || reduce) { cards.forEach((c) => { c.style.transform = ''; const v = $('.vela', c); if (v) v.style.opacity = 0; }); return; }
    cards.forEach((c, i) => {
      const next = cards[i + 1]; if (!next) return;
      const rem = parseFloat(getComputedStyle(root).fontSize) || 16;
      const stick = 5.5 * rem + i * 14, stickN = 5.5 * rem + (i + 1) * 14;
      const h = c.offsetHeight, nTop = next.getBoundingClientRect().top;
      const p = clamp(((stick + h) - nTop) / ((stick + h) - stickN));
      c.style.transform = p > 0 ? `scale(${(1 - .06 * p).toFixed(4)})` : '';
      const v = $('.vela', c); if (v) v.style.opacity = (.25 * p).toFixed(3);
    });
  }

  /* onda de motor */
  const onda = $('#ondaMotor');
  let ondaVis = false;
  function dibujaOnda(t) {
    let d = '';
    const amp = 10 + 40 * (.5 + .5 * Math.sin(t * .0009));
    for (let x = 0; x <= 400; x += 5) {
      const env = .6 + .4 * Math.sin(x * .012 + t * .0013);
      const y = 80 + amp * Math.sin(x * .05 + t * .006) * env + Math.sin(x * .21 + t * .012) * 3;
      d += (x ? 'L' : 'M') + x + ' ' + y.toFixed(1);
    }
    onda.setAttribute('d', d);
  }
  safe(() => {
    if (!onda) return;
    if (reduce) { dibujaOnda(900); return; }
    loops.push((t) => { if (ondaVis && !document.hidden) dibujaOnda(t); });
  });

  /* ------------------------------------------------------------- Proceso */
  const pinProc = $('#pinProceso');
  const pinProg = (el) => { const r = el.getBoundingClientRect(); return clamp(-r.top / Math.max(1, r.height - vh)); };
  const pasos = $$('#pasos .paso'), puntos = $$('.puntos i');
  let pasoAct = -1, flashHecho = false;
  function actualizaProceso() {
    if (!pinProc) return;
    const aguja = $('#agujaProc'), arco = $('#procArco'), km = $('#procKmh'), clip = $('#fotoClip'), riel = $('#rielLleno'), cta = $('#procCta');
    if (reduce) {
      if (aguja) aguja.setAttribute('transform', 'rotate(405 300 300)');
      return;
    }
    const r = pinProc.getBoundingClientRect();
    if (r.bottom < -50 || r.top > vh + 50) return;
    const p = pinProg(pinProc);
    const a = ang(p * 240);
    if (aguja) aguja.setAttribute('transform', `rotate(${a.toFixed(2)} 300 300)`);
    if (arco) arco.setAttribute('d', p > .004 ? arcPath(279, 135, Math.max(135.5, a)) : '');
    if (km) km.textContent = String(Math.round(p * 240));
    if (clip) clip.style.clipPath = `circle(${(14 + 36 * ease(clamp(p / .7))).toFixed(1)}% at 50% 50%)`;
    if (riel) riel.style.transform = `scaleY(${p.toFixed(3)})`;
    const idx = Math.min(3, Math.floor(p * 4));
    if (idx !== pasoAct) {
      pasoAct = idx;
      pasos.forEach((s, i) => s.classList.toggle('act', i === idx));
      puntos.forEach((d, i) => d.classList.toggle('on', i <= idx));
      if (cta) cta.classList.toggle('on', idx === 3);
      if (idx === 3 && !flashHecho) {
        flashHecho = true;
        const f = $('#procFlash'); if (f) { f.classList.add('on'); setTimeout(() => f.classList.remove('on'), 1300); }
      }
    }
  }

  /* ------------------------------------------------------------- Taller */
  const pinTaller = $('#pinTaller');
  function actualizaTaller() {
    if (!pinTaller) return;
    const clip = $('#mediaClip'), img = $('#tallerImg'), tit = $('#tallerTit'), fig = $('.taller-fig');
    if (reduce) return;
    const r = pinTaller.getBoundingClientRect();
    if (r.bottom < -50 || r.top > vh + 50) return;
    const p = pinProg(pinTaller);
    const e = ease(clamp(p / .7));
    const mob = vw < 768;
    clip.style.setProperty('--t', lerp(mob ? 12 : 20, 0, e).toFixed(2) + '%');
    clip.style.setProperty('--l', lerp(mob ? 6 : 14, 0, e).toFixed(2) + '%');
    clip.style.setProperty('--rd', lerp(28, 0, e).toFixed(1) + 'px');
    clip.style.setProperty('--s', lerp(1.25, 1, e).toFixed(4));
    if (tit) tit.classList.toggle('on', p > .5);
    if (fig) fig.classList.toggle('hs-on', p > .8);
  }
  safe(() => {
    $$('.hotspot').forEach((b) => b.addEventListener('click', () => {
      const abierto = b.getAttribute('aria-expanded') === 'true';
      $$('.hotspot').forEach((o) => o.setAttribute('aria-expanded', 'false'));
      b.setAttribute('aria-expanded', abierto ? 'false' : 'true');
    }));
    // estado inicial del recorte (solo con JS y sin movimiento reducido)
    const clip = $('#mediaClip');
    if (clip && !reduce) {
      const mob = vw < 768;
      clip.style.setProperty('--t', (mob ? 12 : 20) + '%'); clip.style.setProperty('--l', (mob ? 6 : 14) + '%');
      clip.style.setProperty('--rd', '28px'); clip.style.setProperty('--s', '1.25');
    }
  });

  /* ------------------------------------------------------------- Marca 3D */
  const card3d = $('#card3d');
  const c3 = { rx: 0, ry: 0, trx: 0, try: 0, hover: false, sc: 0 };
  safe(function marca3d() {
    if (!card3d || reduce) return;
    const borde = $('.card3d-borde', card3d), refl = $('#reflejo');
    if (fine) {
      card3d.addEventListener('pointermove', (e) => {
        const r = card3d.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c3.hover = true; c3.try = (x - .5) * 24; c3.trx = -(y - .5) * 24;
        refl.style.setProperty('--rx', (x * 100).toFixed(1) + '%'); refl.style.setProperty('--ry', (y * 100).toFixed(1) + '%');
      });
      card3d.addEventListener('pointerleave', () => { c3.hover = false; c3.try = 0; c3.trx = 0; });
    }
    loops.push(() => {
      const r = card3d.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      const sc = (.5 - clamp((vh - r.top) / (vh + r.height))) * 14;
      c3.rx = lerp(c3.rx, c3.trx + (c3.hover ? 0 : sc), .1); c3.ry = lerp(c3.ry, c3.try, .1);
      borde.style.transform = `rotateX(${c3.rx.toFixed(2)}deg) rotateY(${c3.ry.toFixed(2)}deg)`;
    });
  });

  /* ------------------------------------------------------------- Testigos */
  safe(function testigos() {
    const luces = $$('.testigo'), lista = $('#resLista'), enviar = $('#resEnviar'), modelo = $('#resModelo');
    if (!luces.length) return;
    const arma = () => {
      const sel = luces.filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.dataset.s);
      lista.innerHTML = '';
      if (!sel.length) { const li = document.createElement('li'); li.className = 'vacio'; li.textContent = 'Aún no marcas ninguna luz.'; lista.appendChild(li); }
      sel.forEach((s) => { const li = document.createElement('li'); li.textContent = s; lista.appendChild(li); });
      const m = (modelo.value || '').trim();
      const msg = sel.length
        ? `Hola Motors Companies, mi moto${m ? ' ' + m : ''} presenta: ${sel.join(', ').toLowerCase()}. ¿Pueden revisarla?`
        : (m ? `Hola Motors Companies, tengo una ${m} y quiero que la revisen. ¿Me pueden orientar?` : DEF_MSG);
      if (enviar && WHATSAPP) enviar.href = waURL(msg);
    };
    luces.forEach((b) => b.addEventListener('click', () => {
      b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      // reinicia el bip
      const i = $('i', b); if (i) { i.style.animation = 'none'; void i.offsetWidth; i.style.animation = ''; }
      arma();
    }));
    modelo.addEventListener('input', arma);
    arma();
  });

  /* ------------------------------------------------------------- Contacto */
  const leds = [];
  let ledsVis = false, ledsT0 = 0, ledNivel = -1;
  safe(function ledsInit() {
    const box = $('#leds'); if (!box) return;
    for (let i = 0; i < 24; i++) { const l = document.createElement('i'); if (i >= 19) l.className = 'rojo'; box.appendChild(l); leds.push(l); }
    const pon = (n) => { if (n === ledNivel) return; ledNivel = n; leds.forEach((l, i) => l.classList.toggle('on', i < n)); };
    if (reduce) { pon(14); return; }
    loops.push((t) => {
      if (!ledsVis || document.hidden) return;
      if (!ledsT0) ledsT0 = t;
      const e = (t - ledsT0) / 1000;
      const nivel = e < 1.3 ? Math.round(ease(e / 1.3) * 18) : Math.round(13 + 8 * (.5 + .5 * Math.sin(e * 2.1)) + 2 * Math.sin(e * 7.3));
      pon(clamp(nivel, 0, 24));
    });
  });

  safe(function formulario() {
    const f = $('#form'); if (!f) return;
    const nombre = $('#fNombre'), moto = $('#fMoto'), msg = $('#fMsg'), err = $('#fError');
    const aguja = $('#miniAguja'), arco = $('#miniArco');
    const mini = (k) => {
      aguja.setAttribute('transform', `rotate(${(-70 + 155 * k).toFixed(1)} 60 62)`);
      arco.setAttribute('stroke-dashoffset', String(100 - 100 * k));
    };
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!WHATSAPP) { err.textContent = 'Por ahora no podemos abrir WhatsApp desde aquí. Vuelve a intentarlo más tarde.'; return; }
      const n = nombre.value.trim();
      if (!n) { err.textContent = 'Escribe tu nombre para que sepamos con quién hablamos.'; nombre.setAttribute('aria-invalid', 'true'); nombre.focus(); return; }
      nombre.removeAttribute('aria-invalid'); err.textContent = '';
      const op = (f.querySelector('input[name="necesito"]:checked') || {}).value || 'No estoy seguro';
      const texto = `Hola Motors Companies, soy ${n}. Mi moto: ${moto.value.trim() || 'por confirmar'}. Necesito: ${op}.${msg.value.trim() ? ' ' + msg.value.trim() : ''}`;
      const url = waURL(texto);
      const t0 = performance.now();
      (function p(now) {
        const k = ease(clamp((now - t0) / 400)); mini(k);
        if (k < 1) requestAnimationFrame(p);
      })(t0);
      setTimeout(() => {
        const w = window.open(url, '_blank', 'noopener');
        if (!w) location.href = url;
        setTimeout(() => mini(0), 1200);
      }, 400);
    });
    nombre.addEventListener('input', () => { if (nombre.value.trim()) { nombre.removeAttribute('aria-invalid'); err.textContent = ''; } });
  });

  /* ------------------------------------------------------------- Cursor + magnético */
  safe(function cursor() {
    if (!fine || reduce) return;
    const c = $('#cursor'); if (!c) return;
    let x = vw / 2, y = vh / 2, tx = x, ty = y;
    const sel = 'a, button, summary, .testigo, label, input, textarea';
    addEventListener('pointermove', (e) => {
      tx = e.clientX; ty = e.clientY; c.classList.add('activo');
      const hov = e.target.closest && e.target.closest(sel);
      c.classList.toggle('grande', !!(hov && hov.matches('a, button, summary')));
      // magnético
      for (const b of mag) {
        const r = b.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const dx = e.clientX - cx, dy = e.clientY - cy;
        if (Math.abs(dx) < r.width / 2 + 50 && Math.abs(dy) < r.height / 2 + 50) {
          b.style.transform = `translate(${clamp(dx / (r.width / 2), -1, 1) * 8}px,${clamp(dy / (r.height / 2), -1, 1) * 8}px)`;
          b.dataset.mag = '1';
        } else if (b.dataset.mag) { b.style.transform = ''; delete b.dataset.mag; }
      }
    }, { passive: true });
    document.addEventListener('mouseleave', () => c.classList.remove('activo'));
    const mag = $$('.btn-prim, .btn-tinta').filter((b) => !b.hasAttribute('data-reveal'));
    loops.push(() => {
      x = lerp(x, tx, .2); y = lerp(y, ty, .2);
      c.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
    });
  });

  /* ------------------------------------------------------------- Encabezado / menú */
  safe(function cabecera() {
    const cab = $('#cabecera'), burger = $('#burger'), menu = $('#menuMovil');
    onScrollFns.push(() => cab.classList.toggle('compacta', scrollY > 40));
    if (!burger || !menu) return;
    const abre = (v) => {
      burger.setAttribute('aria-expanded', String(v));
      burger.setAttribute('aria-label', v ? 'Cerrar menú' : 'Abrir menú');
      menu.classList.toggle('abierto', v); menu.setAttribute('aria-hidden', String(!v));
      document.body.classList.toggle('bloqueado', v);
    };
    burger.addEventListener('click', () => abre(burger.getAttribute('aria-expanded') !== 'true'));
    $$('a', menu).forEach((a) => a.addEventListener('click', () => abre(false)));
    addEventListener('keydown', (e) => { if (e.key === 'Escape') abre(false); });
    addEventListener('resize', () => { if (innerWidth >= 1024) abre(false); });
  });

  /* ------------------------------------------------------------- HUD de marcha */
  const secs = $$('[data-marcha]');
  const hudLis = $$('#hudMarchas li');
  let gearAct = -1, velDisp = 0, velObj = 0, ppag = 0;
  const NOM_G = ['N', '1', '2', '3', '4', '5', '6'];
  function actualizaHUD() {
    const doc = root.scrollHeight - vh;
    ppag = doc > 0 ? clamp(scrollY / doc) : 0;
    velObj = Math.round(ppag * 240);
    let g = gearAct < 0 ? 0 : gearAct;
    for (const s of secs) {
      const r = s.getBoundingClientRect();
      if (r.top <= vh / 2 && r.bottom > vh / 2) { g = Number(s.dataset.marcha); break; }
    }
    if (g !== gearAct) {
      gearAct = g;
      hudLis.forEach((li, i) => li.classList.toggle('on', i === g));
      const cg = $('#chipG'); if (cg) cg.textContent = NOM_G[g];
      [$('#chipMarcha'), $('#hudMarchas')].forEach((el) => { if (!el) return; el.classList.remove('cambia'); void el.offsetWidth; el.classList.add('cambia'); });
    }
    const red = $('#hudRed'); if (red) red.classList.toggle('on', g === 6 && ppag > .95);
  }
  loops.push(() => {
    if (Math.abs(velObj - velDisp) > .4) {
      velDisp = lerp(velDisp, velObj, .18);
      const v = String(Math.round(velDisp));
      const a = $('#hudVel'), b = $('#chipV');
      if (a) a.textContent = v; if (b) b.textContent = v;
    }
  });

  /* ------------------------------------------------------------- Scroll unificado */
  let ticking = false, lastY = scrollY;
  function alScroll() {
    const y = scrollY, dy = y - lastY; lastY = y;
    scrollV = lerp(scrollV, Math.min(Math.abs(dy) / 16, 6), .25);
    if (dy < -1) scrollDir = -1; else if (dy > 1) scrollDir = 1;

    const bp = $('#barraProgreso');
    const doc = root.scrollHeight - vh;
    if (bp) bp.style.transform = `scaleX(${doc > 0 ? clamp(y / doc).toFixed(4) : 0})`;
    onScrollFns.forEach((fn) => fn());

    // hero
    if (hero) {
      const r = hero.getBoundingClientRect();
      heroVisible = r.bottom > 0 && r.top < vh;
      heroP = reduce ? 0 : clamp(-r.top / (r.height * .85));
      const ds = $('#dialScroll'), ht = $('#heroTexto');
      if (!reduce && ds && root.classList.contains('listo')) {
        if (heroP > .002) {
          ds.style.transform = `scale(${(1 + .3 * heroP).toFixed(3)}) rotate(${(-10 * heroP).toFixed(2)}deg)`;
          ds.style.opacity = (1 - .3 * heroP).toFixed(3);
        } else { ds.style.transform = ''; ds.style.opacity = ''; }
      }
      if (!reduce && ht && root.classList.contains('listo')) ht.style.transform = heroP > .002 ? `translate3d(0,${(-y * .3).toFixed(1)}px,0)` : '';
    }
    // visibilidad de módulos
    if (onda) { const r = onda.getBoundingClientRect(); ondaVis = r.bottom > 0 && r.top < vh; }
    const ct = $('#contacto'); if (ct) { const r = ct.getBoundingClientRect(); ledsVis = r.top < vh * .85 && r.bottom > 0; }

    actualizaManifiesto(); actualizaPila(); actualizaProceso(); actualizaTaller(); actualizaHUD();
    respaldoGeometria();
    ticking = false;
  }
  const pideScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(alScroll); } };
  addEventListener('scroll', pideScroll, { passive: true });
  addEventListener('resize', () => {
    vw = innerWidth; vh = innerHeight;
    onResizeFns.forEach((fn) => safe(fn));
    pideScroll();
  });
  // decaimiento de la velocidad de scroll cuando se detiene
  loops.push(() => { scrollV = lerp(scrollV, 0, .06); });

  /* ------------------------------------------------------------- Bucle único */
  let tPrev = performance.now();
  function tick(t) {
    const dt = Math.min(.05, (t - tPrev) / 1000); tPrev = t;
    for (const fn of loops) { try { fn(t, dt); } catch (e) { /* un módulo roto no detiene al resto */ } }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  /* ------------------------------------------------------------- Otros */
  safe(() => {
    const up = $('#arriba'); if (up) up.addEventListener('click', () => scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));
  });

  alScroll();
  addEventListener('load', () => { vw = innerWidth; vh = innerHeight; onResizeFns.forEach((fn) => safe(fn)); alScroll(); });
})();
