/* ===== DECK: el sitio como slider 3D =====
   Cada sección es una "diapositiva" fija a pantalla completa y el scroll (rueda,
   touch, teclado) avanza entre ellas. En las secciones de experiencia la
   pantalla se parte en dos columnas: a la izquierda la intro de la experiencia
   (se mantiene fija) y a la derecha los proyectos, uno por paso. La estructura
   de columnas se arma aquí, ANTES que el resto de módulos, para que todos midan
   sobre el layout final. El controlador vive al final del archivo. */
/* IDIOMA: la misma hoja de script sirve a la versión en inglés (index.html) y
   a la española (es/index.html, <html lang="es" data-base="../">). tr() elige
   el texto según el idioma y ASSET_BASE corrige las rutas a los recursos. */
const ES = document.documentElement.lang === 'es';
const tr = (en, es) => (ES ? es : en);
const ASSET_BASE = document.documentElement.dataset.base || '';

const DECK = !!document.getElementById('page');
if (DECK) {
  document.body.classList.add('deck');
  document.querySelectorAll('.company-sec > .container').forEach(container => {
    const cols  = document.createElement('div');
    const intro = document.createElement('div');
    const right = document.createElement('div');
    const head  = document.createElement('div');
    const projs = document.createElement('div');
    cols.className = 'stage-cols';
    intro.className = 'col-intro';
    right.className = 'col-right';
    head.className = 'col-projects-head';
    projs.className = 'col-projects';
    [...container.children].forEach(ch => {
      if (ch.matches('.project')) projs.appendChild(ch);
      else if (ch.matches('.projects-title')) head.appendChild(ch);
      else intro.appendChild(ch);
    });

    const exp = intro.querySelector('.exp-intro');
    if (exp) {
      // ubicación dentro de la tarjeta, en la misma línea que la fecha
      const loc  = intro.querySelector('.section-head .head-loc');
      const date = exp.querySelector('.proj-num');
      // fecha arriba; la ubicación va debajo del rol
      if (loc || date) {
        const meta = document.createElement('div');
        meta.className = 'exp-meta';
        if (date) meta.appendChild(date);
        exp.prepend(meta);
        if (loc) {
          const role = exp.querySelector('.exp-role');
          const locBox = document.createElement('div');
          locBox.className = 'exp-meta exp-loc';
          locBox.appendChild(loc);
          if (role) role.after(locBox); else meta.after(locBox);
        }
      }
      // la descripción de cada proyecto pasa a la tarjeta de la experiencia,
      // bajo "Project description"; se muestra la del proyecto actual
      const descs = [...projs.children].map(p => p.querySelector('.proj-desc'));
      if (descs.some(Boolean)) {
        const box = document.createElement('div');
        box.className = 'exp-projdesc';
        const stack = document.createElement('div');
        stack.className = 'exp-projdesc-stack';
        descs.forEach((d, i) => {
          const item = d || document.createElement('p');
          if (!d) item.className = 'proj-desc';
          item.dataset.pdesc = i;
          // encabezado: nombre del proyecto (se escribe con el resto del
          // texto al mostrarse)
          const nameEl = projs.children[i].querySelector('.proj-name');
          const head = document.createElement('span');
          head.className = 'pd-name';
          head.textContent = nameEl ? nameEl.textContent.trim() : (projs.children[i].dataset.name || 'Project');
          item.prepend(head);
          stack.appendChild(item);
        });
        box.append(stack);
        exp.appendChild(box);
        // los enlaces a los sitios van debajo de la terminal
        const sites = exp.querySelector('.exp-sites');
        if (sites) exp.appendChild(sites);
      }
    }

    const n = projs.children.length;
    if (n <= 1) head.classList.add('no-pager');
    if (n > 1) {
      const pager = document.createElement('div');
      pager.className = 'proj-pager';
      const label = document.createElement('span');
      label.className = 'proj-pager-count micro';
      // texto inicial con el mismo largo que tendrá siempre ("Project 01 / 04"):
      // así se parte en letras para el imán y luego sólo cambian los dígitos
      label.textContent = tr('Project', 'Proyecto') + ' 01 / ' + String(n).padStart(2, '0');
      pager.appendChild(label);
      for (let i = 0; i < n; i++) {
        const b = document.createElement('button');
        b.type = 'button';
        b.dataset.proj = i;
        const name = projs.children[i].querySelector('.proj-name');
        b.setAttribute('aria-label', tr(`Show project ${i + 1} of ${n}`, `Ver proyecto ${i + 1} de ${n}`) + (name ? `: ${name.textContent.trim()}` : ''));
        pager.appendChild(b);
      }
      head.appendChild(pager);
    }
    right.append(head, projs);
    cols.append(intro, right);
    container.appendChild(cols);
  });
}

/* ===== IMÁN POR LETRA: división del texto =====
   Los textos grandes y cortos (números/nombres de sección, títulos de rol,
   nombres de proyecto y botones) se parten en palabras (.mg-word, bloque sin
   salto interno → el texto sigue envolviendo por palabras) y letras (.mg-ch).
   Se hace AQUÍ, antes de que el efecto de escritura guarde sus nodos de texto,
   para que éste siga funcionando letra a letra. El cálculo por cercanía del
   cursor vive al final del archivo. */
const MAG_SELECTOR = '.big-num, .section-title, .exp-role, .proj-name, #hero .hero-ctas a, .exp-intro .site-pill, #hero .hd-stat, #hero .hd-text, ' +
  '#topbar .btn-light .cv-text, .exp-meta .head-loc, .exp-meta .proj-num, .pd-name, .proj-meta dd, .proj-pager-count, #about .skill-tag, #bottombar > a > span, #bottombar .bb-title, ' +
  // resto de los textos: logo y rol del topbar, etiquetas laterales, títulos
  // "Projects", descripciones y el about. (Quedan fuera los que el JS reescribe
  // en vivo: contadores de diapositiva y del visor)
  '#topbar .nav-logo .brand, .side-label, .projects-title, .slide-tag, .exp-desc, .exp-note, .proj-desc, .proj-desc-shared, #about .about-copy p';
function splitLetters(root) {
  const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let n;
  while ((n = walk.nextNode())) if (n.nodeValue.trim()) nodes.push(n);
  if (!root.hasAttribute('aria-label') && !root.matches('a, button')) {
    root.setAttribute('aria-label', root.textContent.replace(/\s+/g, ' ').trim());
  }
  nodes.forEach(node => {
    const frag = document.createDocumentFragment();
    node.nodeValue.split(/(\s+)/).forEach(part => {
      if (!part) return;
      if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
      const w = document.createElement('span');
      w.className = 'mg-word';
      [...part].forEach(ch => {
        const c = document.createElement('span');
        c.className = 'mg-ch';
        c.textContent = ch;
        w.appendChild(c);
      });
      frag.appendChild(w);
    });
    node.parentNode.replaceChild(frag, node);
  });
  root.classList.add('mag');
}
/* ===== IMÁGENES DIFERIDAS =====
   Las imágenes de las diapositivas (salvo el hero) vienen con data-src: las
   diapositivas ocultas cubren la pantalla, así que el loading="lazy" del
   navegador NO las frenaba y al cargar se bajaba el sitio entero. Reciben su
   src cuando su diapositiva se muestra o se precalienta como vecina (ver
   warmDeck). Sin el deck (móvil) se les da el src al tiro y el lazy nativo
   hace su trabajo. */
// avisa cuando el deck termina una transición (el body pierde deck-moving):
// lo usan quienes necesitan medir el layout ya quieto
(function () {
  let moving = false;
  new MutationObserver(() => {
    const m = document.body.classList.contains('deck-moving');
    if (moving && !m) requestAnimationFrame(() => document.dispatchEvent(new CustomEvent('deck:settled')));
    moving = m;
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
})();
function loadImgs(root) {
  // las galerías dentro de root quedan "vivas": desde ahora cargan solas
  // las diapositivas cercanas al avanzar (ver markNear)
  if (root.querySelectorAll) root.querySelectorAll('[data-slider]').forEach(s => { s.__live = true; });
  root.querySelectorAll('img[data-src]').forEach(img => {
    const sl = img.closest('.slide');
    if (sl && sl.__far) return;      // diapositiva lejana: espera su turno
    img.src = img.dataset.src;
    img.removeAttribute('data-src');
  });
  // video del about: igual de diferido (póster + video); se reproduce sólo
  // con el about visible (ver más abajo)
  root.querySelectorAll('video.about-video[data-src]').forEach(v => {
    v.poster = v.dataset.poster;
    v.src = v.dataset.src;
    v.preload = 'auto';
    v.removeAttribute('data-src');
  });
}
// VIDEO DEL ABOUT: al entrar al about se reproduce desde el inicio UNA vez;
// al terminar queda quieto 15 s y vuelve a empezar. Pasar el mouse por
// encima lo reinicia al momento (con un pequeño "golpe" pixel del marco).
// Sólo corre con el about a la vista, la pestaña visible y sin "reducir
// movimiento"; fuera de ahí se pausa y se cancela la espera.
(function () {
  const v = document.querySelector('.about-video');
  if (!v) return;
  v.loop = false;
  v.removeAttribute('loop');
  const frame = v.closest('.about-frame');
  // (por sección: la clase .stage la pone el deck más tarde)
  const stage = v.closest('header[id], section[id]');
  const REST = 30000;
  let wait = null, wasOn = false;
  const canRun = () => (!stage || stage.classList.contains('is-active')) && !document.hidden &&
                       !reducedMotionQuery.matches && !v.hasAttribute('data-src');
  function restart() {
    clearTimeout(wait); wait = null;
    if (!canRun()) return;
    try { v.currentTime = 0; } catch (_) {}
    v.play().catch(() => {});
  }
  v.addEventListener('ended', () => {
    clearTimeout(wait);
    wait = setTimeout(restart, REST);
  });
  const sync = () => {
    const on = canRun();
    if (on && !wasOn) restart();                       // recién se entra: desde el inicio
    else if (!on) { clearTimeout(wait); wait = null; if (!v.paused) v.pause(); }
    wasOn = on;
  };
  document.addEventListener('deck:change', () => setTimeout(sync, 0));
  document.addEventListener('visibilitychange', sync);
  if (frame) {
    // el hover solo vuelve a reproducir si el video está detenido (en la
    // pausa de 30 s o terminado); si ya está corriendo, ni reinicio ni efecto
    frame.addEventListener('mouseenter', () => {
      if (!v.paused && !v.ended) return;
      if (!canRun()) return;
      restart();
      frame.classList.remove('is-poke');
      void frame.offsetWidth;                          // reinicia la animación
      frame.classList.add('is-poke');
    });
    frame.addEventListener('animationend', () => frame.classList.remove('is-poke'));
  }
})();
if (!DECK) loadImgs(document);
else document.addEventListener('deck:change', e => {
  const st = e.detail && e.detail.step && e.detail.step.stage;
  if (st) loadImgs(st);
});

// ¿hay mouse? Brave puede reportar (hover: hover) como falso aun con mouse →
// se considera "con hover" todo lo que no sea una pantalla táctil
const CAN_HOVER = window.matchMedia('(hover: hover)').matches || !('ontouchstart' in window);
if (DECK && CAN_HOVER) {
  document.querySelectorAll(MAG_SELECTOR).forEach(splitLetters);
}

/* ===== CURSOR + GHOSTING ===== */
const cursor = document.getElementById('cursor');
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

/* ===== MODO LIGERO =====
   body.lite quita lo decorativo más costoso (animaciones de fondo continuas,
   vidrio esmerilado, efecto agua, estela fantasma, halos del iris) para que
   el sitio vaya fluido en portátiles modestos. Se activa:
     · si el sistema pide reducir el movimiento
     · si el equipo va a tirones de forma SOSTENIDA (ver abajo)
     · a mano con ?lite=1 / ?lite=0
   La decisión automática NO se guarda: cada carga vuelve a medir, así un
   falso positivo (un pico puntual del equipo) no deja el sitio "pegado" en
   modo ligero al recargar. */
const isLite = () => document.body.classList.contains('lite');
let liteDecided = false;            // ya se decidió (a mano o por medición)
function setLite(on, why) {
  if (on === isLite()) return;
  document.body.classList.toggle('lite', on);
  document.body.dataset.liteWhy = why || '';   // para depurar: por qué se activó
  document.dispatchEvent(new CustomEvent('lite:change', { detail: { on, why } }));
}
(function initLite() {
  const q = /[?&]lite=([01])/.exec(location.search);
  if (q) { liteDecided = true; document.body.classList.toggle('lite', q[1] === '1'); }
  else if (reducedMotionQuery.matches) document.body.classList.add('lite');
})();

// mide los cuadros durante `ms` y dice si fueron a TIRONES. No basta con los
// fps: hay navegadores/equipos con un ritmo fijo bajo (37.5 fps, 30 fps en
// ahorro de batería) que se ve fluido. Se toma como base el ritmo normal
// (percentil 10) y se cuenta cuántos cuadros tardan mucho más que él:
//   lento = más del 30% de cuadros con tirón, o un ritmo base < 22 fps
// null (no cuenta) si la pestaña no está visible/enfocada o se ocultó a
// mitad de la medición: en segundo plano el navegador frena los cuadros
function sampleFrames(ms) {
  return new Promise(res => {
    if (document.hidden || !document.hasFocus()) return res(null);
    const d = []; let last = 0; const t0 = performance.now();
    function f() {
      // reloj real (no el timestamp del cuadro, que algunos navegadores
      // entregan a ritmo fijo aunque el cuadro se haya atrasado)
      const t = performance.now();
      if (document.hidden || !document.hasFocus()) return res(null);
      if (last) d.push(t - last);
      last = t;
      if (t - t0 < ms) { requestAnimationFrame(f); return; }
      if (d.length < 10) return res(null);
      const sorted = d.slice().sort((a, b) => a - b);
      const base = sorted[Math.floor(sorted.length * 0.1)];
      // cuadros de ~1 s o más: el navegador frenó la página (ventana tapada o
      // minimizada aunque la pestaña cuente como visible). Eso no es un
      // equipo lento → no cuenta
      if (base > 200) return res(null);
      const jank = d.filter(x => x > Math.max(base * 1.6, 34)).length / d.length;
      res({ base, jank, slow: jank > 0.3 || base > 45 });
    }
    requestAnimationFrame(f);
  });
}
// en reposo: DOS mediciones lentas seguidas (separadas unos segundos) para
// descartar picos puntuales (decodificar imágenes, otra app, mover la
// ventana). No mide mientras el deck está en transición.
function probeIdle(tries, slowSoFar) {
  if (liteDecided || isLite()) return;
  const retry = n => { if (tries > 0) setTimeout(() => probeIdle(tries - 1, n), 2500); };
  if (document.body.classList.contains('deck-moving') || document.body.classList.contains('deck-warming')) return retry(slowSoFar);
  sampleFrames(2000).then(r => {
    if (liteDecided || isLite()) return;
    if (r === null || document.body.classList.contains('deck-moving') || document.body.classList.contains('deck-warming')) return retry(slowSoFar);
    if (!r.slow) return;                      // fue fluido → listo, no se activa
    if (slowSoFar + 1 >= 2) { liteDecided = true; setLite(true, 'idle'); }
    else retry(slowSoFar + 1);
  });
}
// tras la intro del hero (escritura del nombre, fuentes, imágenes)
window.addEventListener('load', () => setTimeout(() => probeIdle(6, 0), 5000));

// pestaña oculta → todo en pausa
document.addEventListener('visibilitychange', () => {
  document.body.classList.toggle('tab-hidden', document.hidden);
});

let mx = -100, my = -100;
let lastDetect = 0;
let lastGhost = 0;
let cursorIsDark = false;
let curMag = null; // 'in' | 'out' | null
let lastHeroSpawn = 0;
const heroEl = document.getElementById('hero');

function getFocusable(container) {
  return [...container.querySelectorAll(
    'a[href], button:not([disabled]), video[controls], [tabindex]:not([tabindex="-1"])'
  )].filter(el => el.getClientRects().length && !el.closest('[aria-hidden="true"]'));
}

function trapFocus(container, event) {
  if (event.key !== 'Tab') return;
  const focusable = getFocusable(container);
  if (!focusable.length) {
    event.preventDefault();
    container.focus();
    return;
  }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

const modalBackground = [
  document.getElementById('topbar'),
  document.getElementById('bottombar'),
  document.getElementById('page'),
  document.getElementById('deck-nav'),
].filter(Boolean);

function setModalBackgroundInert(inert) {
  modalBackground.forEach(el => el.toggleAttribute('inert', inert));
}
function overHeroPoint(x, y) {
  if (!heroEl) return false;
  // en el deck todas las secciones ocupan el viewport: sólo cuenta la activa
  if (DECK && !heroEl.classList.contains('is-active')) return false;
  const h = heroEl.getBoundingClientRect();
  return x >= h.left && x <= h.right && y >= h.top && y <= h.bottom;
}

// El hero y el about son las dos bandas CLARAS. Sobre ellas el blend overlay del
// agua resalta mucho más que sobre el body oscuro, así que las gotas ahí van a
// intensidad reducida — y la MISMA en las dos para que se sientan iguales.
const aboutEl = document.getElementById('about');
function overLightBand(x, y) {
  if (overHeroPoint(x, y)) return true;
  if (!aboutEl) return false;
  if (DECK && !aboutEl.classList.contains('is-active')) return false;
  const a = aboutEl.getBoundingClientRect();
  return x >= a.left && x <= a.right && y >= a.top && y <= a.bottom;
}

/* Zonas donde el ghosting del cursor está permitido: bottombar y topbar, más
   cualquier visor de imagen abierto (zoom modal / lightbox). En el hero la
   estela ya la hacen los iconos flotantes, y en el contenido competía con la
   lectura, así que en ninguno de los dos se genera. */
const GHOST_ZONES = '#bottombar, #topbar, #zoom, #lightbox';
function ghostAllowedAt(x, y) {
  const body = document.body;
  // con una imagen abierta la estela se muestra en todo el overlay
  if (body.classList.contains('zoom-open') || body.classList.contains('lb-open')) return true;
  const el = document.elementFromPoint(x, y);
  return !!(el && el.closest(GHOST_ZONES));
}

// Color de fondo efectivo: sube por el DOM hasta encontrar uno opaco
// Elementos en pixel art cuyo fondo real está en ::before (recortado con
// clip-path): la tarjeta de experiencia, los enlaces a sitios y la barra del rol
const PSEUDO_BG = '.exp-intro, .exp-intro .site-pill, #hero .hero-rolebig';
function opaqueColor(bg, op) {
  const m = bg.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const p = m[1].split(',').map(s => parseFloat(s));
  const a = (p[3] === undefined ? 1 : p[3]) * (op === undefined ? 1 : op);
  return a > 0.35 ? { r: p[0], g: p[1], b: p[2] } : null;
}
function effectiveBg(el) {
  while (el && el.nodeType === 1) {
    if (el.matches(PSEUDO_BG)) {
      const ps = getComputedStyle(el, '::before');
      const c = opaqueColor(ps.backgroundColor, parseFloat(ps.opacity));
      if (c) return c;
    }
    const c = opaqueColor(getComputedStyle(el).backgroundColor);
    if (c) return c;
    el = el.parentElement;
  }
  return null; // sin fondo opaco → asumimos claro (body crema)
}

// Un SOLO hit-test por tick. La LUPA se auto-invierte según el fondo real con
// mix-blend-mode (CSS) → sensible al pixel, sin canvas y funciona también con file://.
function detect() {
  const body = document.body;
  if (body.classList.contains('zoom-open')) {
    const el = document.elementFromPoint(mx, my);
    if (el && el.closest('#zoom-prev, #zoom-next, #zoom-close')) {
      curMag = null;
      body.classList.add('zoom-ctrl');
      body.classList.remove('mag-in', 'cur-link');
    } else {
      curMag = 'out';
      body.classList.remove('zoom-ctrl', 'mag-in', 'cur-link');
    }
    if (cursorIsDark) { cursorIsDark = false; cursor.classList.remove('on-dark'); }
    return;
  }
  if (body.classList.contains('lb-open')) {
    const el = document.elementFromPoint(mx, my);
    if (el && el.closest('#lb-close, #lb-prev, #lb-next')) {
      curMag = null;
      body.classList.add('zoom-ctrl');
      body.classList.remove('mag-in', 'cur-link');
    } else {
      curMag = 'out';
      body.classList.remove('zoom-ctrl', 'mag-in', 'cur-link');
    }
    if (cursorIsDark) { cursorIsDark = false; cursor.classList.remove('on-dark'); }
    return;
  }
  const el = document.elementFromPoint(mx, my); // ignora #cursor (pointer-events:none)
  const overMag = !!(el && (
    (el.closest('.slide') && (el.tagName === 'IMG' || el.tagName === 'VIDEO')) ||
    el.closest('.design-item')
  ));
  const overLink = !overMag && !!(el && el.closest('a, button'));
  curMag = overMag ? 'in' : null;
  body.classList.toggle('mag-in', overMag);
  body.classList.toggle('cur-link', overLink);
  if (overMag) {
    // la lupa se invierte sola (mix-blend-mode: difference); no usamos on-dark
    if (cursorIsDark) { cursorIsDark = false; cursor.classList.remove('on-dark'); }
  } else {
    const c = el ? effectiveBg(el) : null;
    const dark = c ? (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) < 130 : false;
    if (dark !== cursorIsDark) { cursorIsDark = dark; cursor.classList.toggle('on-dark', dark); }
  }
}

/* ===== EFECTO AGUA (ripple) =====
   Simulación 2D en un canvas de baja resolución (240×135), escalado por CSS al
   viewport. Cada mousemove deja una gota con amplitud proporcional a la velocidad
   del cursor. Las gotas se propagan y amortiguan solas hasta calmarse — cuando la
   energía cae bajo un umbral el rAF se detiene y no consume CPU. */
const rippleCv = document.getElementById('ripple');
let rippleDrop = null;   // función expuesta al mousemove; null si el canvas no existe
if (rippleCv) {
  // 240 celdas de ancho; el alto sigue la proporción de la ventana para que
  // cada celda sea CUADRADA en pantalla → las ondas salen redondas en
  // cualquier tamaño (con 240×135 fijo se estiraban en óvalo fuera de 16:9)
  const W = 240;
  let H = 135;
  const ctx = rippleCv.getContext('2d');
  let img, cur, prev;
  function fitGrid() {
    const h = Math.max(30, Math.round(W * window.innerHeight / Math.max(1, window.innerWidth)));
    if (h === H && img) return;
    H = h;
    rippleCv.width = W; rippleCv.height = H;
    img = ctx.createImageData(W, H);
    cur = new Float32Array(W * H);
    prev = new Float32Array(W * H);
    if (typeof paintNeutral === 'function') paintNeutral();
  }
  fitGrid();
  window.addEventListener('resize', fitGrid);
  // densidad intermedia: la ola se ve pasar bajo el cursor y muere en ~4-5
  // frames, sin rebotar por la pantalla. Recorrido de ajuste: 0.985 (agua
  // ligera, rebotaba) → 0.87 → 0.68 (gel, no se notaba) → 0.80.
  const DAMP = 0.80;
  const R = 3;                       // radio en celdas del grid → pequeño y local
  // clic: gota más ancha y agua menos densa por un momento, para que el
  // anillo se abra y viaje bien visible en vez de morir en el sitio
  const CLICK_DAMP = 0.95, CLICK_MS = 750;
  let clickUntil = 0;
  let running = false;

  // Base gris medio: en mix-blend-mode overlay el gris 128 es identidad, así el
  // canvas en reposo no altera nada de lo que hay debajo. Sólo las crestas
  // (>128) iluminan y los valles (<128) oscurecen.
  function paintNeutral() {
    const d = img.data;
    for (let k = 0; k < d.length; k += 4) {
      d[k] = d[k+1] = d[k+2] = 128;
      d[k+3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }
  paintNeutral();

  function drop(px, py, amount, r = R) {
    const cx = Math.floor(px / window.innerWidth  * W);
    const cy = Math.floor(py / window.innerHeight * H);
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const d2 = dx*dx + dy*dy;
        if (d2 > r * r) continue;
        const nx = cx + dx, ny = cy + dy;
        if (nx < 1 || nx >= W - 1 || ny < 1 || ny >= H - 1) continue;
        cur[ny * W + nx] += amount * (1 - Math.sqrt(d2) / r);
      }
    }
  }

  function tick() {
    let energy = 0;
    const damp = performance.now() < clickUntil ? CLICK_DAMP : DAMP;
    // paso de propagación clásico: new = ((izq+der+arriba+abajo)/2 - prev) * damp
    for (let y = 1; y < H - 1; y++) {
      let i = y * W + 1;
      for (let x = 1; x < W - 1; x++, i++) {
        const val = ((cur[i-1] + cur[i+1] + cur[i-W] + cur[i+W]) * 0.5 - prev[i]) * damp;
        prev[i] = val;
        energy += val * val;
      }
    }
    const t = cur; cur = prev; prev = t;

    // render: base neutra + crestas/valles sólo donde hay ola
    const data = img.data;
    for (let k = 0; k < data.length; k += 4) {
      data[k] = data[k+1] = data[k+2] = 128;
      data[k+3] = 255;
    }
    for (let y = 1; y < H - 1; y++) {
      let i = y * W + 1;
      let j = i * 4;
      for (let x = 1; x < W - 1; x++, i++, j += 4) {
        const gx = cur[i+1] - cur[i-1];
        const gy = cur[i+W] - cur[i-W];
        // multiplicador de intensidad visual del agua (crestas/valles), bajado
        // por pasos: 470 → 282 → 197. Efecto cada vez más tenue.
        const lit = -(gx + gy) * 197;
        const b = lit > 127 ? 127 : lit < -127 ? -127 : lit;
        const v = 128 + b;
        data[j] = data[j+1] = data[j+2] = v;
      }
    }
    ctx.putImageData(img, 0, 0);

    if (energy > 1e-4) {
      requestAnimationFrame(tick);
    } else {
      running = false;
      paintNeutral();   // en reposo el canvas es identidad: no altera nada
      // En calma se OCULTA el canvas: una capa fija a pantalla completa con
      // mix-blend-mode recompone en cada repintado (scroll, sliders…) aunque no
      // cambie. display:none la saca del compositor → arregla el "tironeo" al
      // usar los sliders. Se vuelve a mostrar en la próxima gota.
      rippleCv.style.display = 'none';
    }
  }

  rippleDrop = (x, y, amount, click) => {
    if (rippleCv.style.display === 'none') rippleCv.style.display = '';
    if (click) clickUntil = performance.now() + CLICK_MS;
    drop(x, y, amount, click ? 7 : R);
    if (!running) { running = true; requestAnimationFrame(tick); }
  };
}

let lastRipX = -1, lastRipY = -1, lastRipT = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cursor.style.left = mx + 'px';
  cursor.style.top  = my + 'px';

  const now = performance.now();
  if (now - lastDetect > 90) { lastDetect = now; detect(); }


  // El agua va en TODA la página (no sólo en el hero). No se generan gotas
  // durante el scroll ni con un modal abierto (el canvas con mix-blend
  // recomponiendo detrás es justo lo que tironeaba).
  if (!reducedMotionQuery.matches && !isLite() && rippleDrop &&
      !document.body.classList.contains('scrolling') &&
      !document.body.classList.contains('zoom-open') &&
      !document.body.classList.contains('lb-open')) {
    if (lastRipX >= 0) {
      const dx = mx - lastRipX, dy = my - lastRipY;
      const dist = Math.sqrt(dx*dx + dy*dy);
      // Umbral de recorrido: un clic mueve el puntero 1-2px, y con un dt tan
      // corto la velocidad se disparaba y salía una gota a amplitud máxima
      // (parecía caer una gota al hacer clic). Por debajo de 5px no se genera.
      if (dist >= 5) {
        // dt con piso de 12ms (~1 frame): con piso de 1ms dos eventos seguidos
        // daban v enorme por el divisor diminuto, no por movimiento real
        const dt = Math.max(12, now - lastRipT);
        const v = dist / dt;                       // px por ms
        // sobre las bandas claras (hero y about) la gota va a intensidad media,
        // igual en las dos
        const amp = Math.min(0.85, v * 0.75) * (overLightBand(mx, my) ? 0.6 : 1);
        if (amp > 0.04) rippleDrop(mx, my, amp);
        lastRipX = mx; lastRipY = my; lastRipT = now;
      }
    } else {
      lastRipX = mx; lastRipY = my; lastRipT = now;
    }
  }

  // Dentro del #hero la estela son iconos reales que se quedan y flotan como
  // el fondo (menos frecuencia).
  // (lo mismo en el about, la otra banda clara)
  if (!curMag && window.__toolTrails) {
    const tr = window.__toolTrails.find(t => t.over(mx, my));
    if (tr && now - lastHeroSpawn > 100) {   // ~10 iconos por segundo
      lastHeroSpawn = now;
      tr.spawn(mx, my);
    }
  }

  // El ghosting del cursor queda restringido a tres zonas de chrome (hero,
  // bottombar, topbar) y a los visores de imagen abiertos (zoom / lightbox),
  // donde la estela sí aporta. En el resto del contenido distraía de la
  // lectura, así que ahí no se genera.
  if (!reducedMotionQuery.matches && !isLite() && ghostAllowedAt(mx, my)) {
    const interval = curMag ? 110 : 55;
    if (now - lastGhost > interval) {
      lastGhost = now;
      const ghost = document.createElement('div');
      ghost.className = 'cursor-ghost';
      ghost.style.left = mx + 'px';
      ghost.style.top  = my + 'px';
      if (curMag === 'in') ghost.classList.add('gz-in');
      else if (curMag === 'out') ghost.classList.add('gz-out');
      else {
        if (document.body.classList.contains('cur-link')) ghost.classList.add('gh-hand');
        if (cursorIsDark) ghost.classList.add('on-dark');
      }
      document.body.appendChild(ghost);
      setTimeout(() => ghost.remove(), 450);
    }
  }
}, { passive: true });

/* (El handler de clic que suelta iconos + gota vive junto al sistema de iconos
   del clic, más abajo, para tener a mano su función de spawn.) */

/* mientras se hace scroll (página o slider interno) se marca body.scrolling para
   desactivar el mix-blend del cursor y no frenar el scroll por GPU */
let scrollIdleT;
function onAnyScroll() {
  document.body.classList.add('scrolling');
  clearTimeout(scrollIdleT);
  scrollIdleT = setTimeout(() => document.body.classList.remove('scrolling'), 140);
}
// capture:true para captar también el scroll de los contenedores internos (.slide)
window.addEventListener('scroll', onAnyScroll, { passive: true, capture: true });

/* ===== AUDIO ===== */
const sounds = {
  clic:   document.getElementById('snd-clic'),
  whoosh: document.getElementById('snd-whoosh'),
  tilin:  document.getElementById('snd-tilin'),
  whoomp: document.getElementById('snd-whoomp'),
};

const MASTER_VOL = 0.6; // baja ~40% el volumen de todas las interacciones
function playSound(name, volume = 0.4) {
  const s = sounds[name];
  if (!s) return;
  s.volume = Math.min(1, volume * MASTER_VOL);
  s.currentTime = 0;
  s.play().catch(() => {});
}

document.querySelectorAll('[data-sound]').forEach(el => {
  el.addEventListener('click', () => playSound(el.dataset.sound));
});

document.querySelectorAll('#bottombar a').forEach(el => {
  el.addEventListener('mouseenter', () => playSound('tilin', 0.12));
});

/* ===== HERO: TYPEWRITER + DECODE + GLITCH ===== */
function typeText(el, text, speed, done) {
  el.classList.add('typing');
  let i = 0;
  const iv = setInterval(() => {
    el.textContent = text.slice(0, ++i);
    if (i >= text.length) {
      clearInterval(iv);
      el.classList.remove('typing');
      if (done) done();
    }
  }, speed);
}

// Efecto distinto para WEB DEVELOPER: decodificación con caracteres aleatorios
function scrambleText(el, text, done) {
  const chars = '!<>-_\\/[]{}=+*^?#01';
  let frame = 0;
  el.classList.add('typing');
  const iv = setInterval(() => {
    frame++;
    const resolved = Math.floor(frame / 2);
    let out = '';
    for (let i = 0; i < text.length; i++) {
      out += i < resolved ? text[i] : chars[Math.floor(Math.random() * chars.length)];
    }
    el.textContent = out;
    if (resolved >= text.length) {
      clearInterval(iv);
      el.textContent = text;
      el.classList.remove('typing');
      if (done) done();
    }
  }, 30);
}

document.addEventListener('DOMContentLoaded', () => {
  const nameEl  = document.getElementById('type-name');
  const name2El = document.getElementById('type-name2');
  const pxEl    = document.getElementById('type-px');
  const ampEl   = document.getElementById('type-amp');
  const NAME1 = 'David Arias', NAME2 = 'González';
  const PX = tr('WEB DEVELOPER', 'DESARROLLADOR WEB'), AMP = tr('& DESIGNER', '& DISEÑADOR');

  /* Bloque justificado: la línea más corta del nombre y el rol se expanden con
     letter-spacing hasta el ancho de la línea más larga. Se mide con el texto
     COMPLETO (aunque se esté tecleando) para que el espaciado final ya esté
     puesto desde la primera letra y nada salte al terminar. */
  function fitHeroType() {
    const role = pxEl.closest('.hero-rolebig');
    const lines = [nameEl, name2El].filter(Boolean);
    lines.concat(pxEl, ampEl).forEach(e => {
      e.style.letterSpacing = ''; e.style.marginRight = ''; e.style.fontSize = ''; e.style.whiteSpace = '';
    });
    if (role) { role.style.fontSize = ''; role.style.flexWrap = ''; }
    const inner = nameEl.closest('.hero-inner');
    if (inner) inner.style.removeProperty('--hero-w');
    const narrow = window.innerWidth < 720;   // móvil: sólo se iguala el nombre

    const els = lines.concat(pxEl, ampEl);
    const FULL = (name2El ? [NAME1, NAME2] : [NAME1]).concat(PX, AMP);
    // las líneas ya divididas en letras (imán) tienen el texto completo: no se
    // les reemplaza el contenido (destruiría las letras)
    const saved = els.map(e => (e.classList.contains('mag') ? null : e.textContent));
    els.forEach((e, i) => { if (saved[i] !== null) e.textContent = FULL[i]; });

    const widths = lines.map(e => e.offsetWidth);
    let target = Math.max(...widths);
    // la línea más corta se iguala AGRANDANDO su tipografía (no con
    // letter-spacing): el ancho escala proporcional al tamaño de fuente
    lines.forEach((e, i) => {
      if (widths[i] >= target - 0.5) return;
      const fs = parseFloat(getComputedStyle(e).fontSize);
      e.style.fontSize = (fs * target / widths[i]) + 'px';
    });

    // móvil: el nombre ocupa todo el ancho disponible (el de la descripción)
    const row = inner && inner.querySelector('.hero-row');
    if (narrow && row && row.offsetWidth) {
      const avail = row.offsetWidth;
      lines.forEach(e => {
        const fs = parseFloat(getComputedStyle(e).fontSize);
        e.style.fontSize = (fs * avail / e.offsetWidth) + 'px';
      });
      target = avail;
      // el rol en UNA línea: sin envolver y con la letra ajustada al ancho
      // (en un iPhone partía "WEB DEVELOPER / & DESIGNER" en dos)
      if (role) {
        pxEl.style.whiteSpace = ampEl.style.whiteSpace = 'nowrap';
        role.style.flexWrap = 'nowrap';
        for (let k = 0; k < 2; k++) {
          role.style.width = 'max-content';
          const rw = role.offsetWidth;
          role.style.width = '';
          if (!rw || Math.abs(rw - target) < 1) break;
          const fs = parseFloat(getComputedStyle(role).fontSize);
          const pad = rw - pxEl.offsetWidth - ampEl.offsetWidth;   // relleno + hueco (no escalan)
          role.style.fontSize = Math.min(fs * 1.25, fs * (target - pad) / (rw - pad)) + 'px';
        }
      }
    }
    // si el rol sin espaciado ya es más ancho que el nombre (una sola línea
    // corta), el nombre crece hasta el ancho del rol para que éste no envuelva
    if (role && !narrow) {
      pxEl.style.whiteSpace = ampEl.style.whiteSpace = 'nowrap';
      role.style.width = 'max-content';
      const roleW = role.offsetWidth;
      role.style.width = '';
      if (roleW > target) {
        lines.forEach(e => {
          const fs = parseFloat(getComputedStyle(e).fontSize);
          e.style.fontSize = (fs * roleW / target) + 'px';
        });
        target = Math.max(...lines.map(e => e.offsetWidth));
      }
    }
    // rol: mismo espaciado en las dos partes; un par de pasadas para afinar
    const chars = PX.length + AMP.length;
    let ls = 0;
    for (let k = 0; k < 3 && role; k++) {
      ls = Math.max(0, ls + (target - role.offsetWidth) / chars);
      pxEl.style.letterSpacing = ampEl.style.letterSpacing = ls + 'px';
      // sólo la última palabra anula su espacio final; el de WEB DEVELOPER
      // se suma al hueco antes del "&"
      ampEl.style.marginRight = -ls + 'px';
    }
    // descripción y botones toman el mismo ancho que el nombre
    if (inner) inner.style.setProperty('--hero-w', target + 'px');
    els.forEach((e, i) => { if (saved[i] !== null) e.textContent = saved[i]; });
  }
  let fitT;
  window.addEventListener('resize', () => { clearTimeout(fitT); fitT = setTimeout(fitHeroType, 120); });

  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();

  // aparición en orden de lectura: arriba→abajo, izquierda→derecha
  const heroEl = document.getElementById('hero');
  const heroDesc = heroEl && heroEl.querySelector('.hero-desc');
  const stage = cls => heroEl && heroEl.classList.add(cls);
  const showRight = () => {
    stage('hero-in-desc');
    // los botones entran junto con el recuadro (no esperan a que termine
    // de escribirse la descripción)
    stage('hero-in-ctas');
    if (heroDesc && window.__typeIn && !reducedMotionQuery.matches) window.__typeIn(heroDesc);
  };

  if (reducedMotionQuery.matches) {
    ['hero-in-role', 'hero-in-desc', 'hero-in-ctas'].forEach(stage);
    nameEl.textContent = NAME1;
    if (name2El) name2El.textContent = NAME2;
    pxEl.textContent = PX;
    ampEl.textContent = AMP;
    fontsReady.then(fitHeroType);
    return;
  }

  const glitchOn = (el, text) => { el.dataset.text = text; el.classList.add('glitch'); };
  fontsReady.then(() => {
    fitHeroType();
    setTimeout(() => {
      typeText(nameEl, NAME1, 38, () => {
        glitchOn(nameEl, NAME1);
        // terminado el nombre, el rol y la columna derecha (descripción +
        // botones) cargan EN PARALELO
        const afterName = () => {
          stage('hero-in-role');
          showRight();
          scrambleText(pxEl, PX, () => {
            // glitch en loop una vez decodificado
            pxEl.dataset.text = PX;
            pxEl.classList.add('glitch-on');
            typeText(ampEl, AMP, 32, () => {
              glitchOn(ampEl, AMP);
              // ya escrito todo: nombre y rol se dividen en letras para el imán
              if (window.__magAdd && CAN_HOVER) {
                [nameEl, name2El, pxEl, ampEl].forEach(el => {
                  if (!el) return;
                  splitLetters(el);
                  window.__magAdd(el);
                });
                // las letras sueltas miden un pelo distinto: se reajusta el ancho
                fitHeroType();
              }
            });
          });
        };
        if (!name2El) return afterName();
        typeText(name2El, NAME2, 38, () => { glitchOn(name2El, NAME2); afterName(); });
      });
    }, 150);
  });

  // Inicializar desfases y duraciones aleatorias en cada elemento glitch para romper la sincronía
  document.querySelectorAll('.glitch').forEach(el => {
    const delay = (Math.random() * 5).toFixed(2) + 's';
    const duration = (3.2 + Math.random() * 2.5).toFixed(2) + 's';
    el.style.setProperty('--glitch-delay', delay);
    el.style.setProperty('--glitch-dur', duration);
  });
});

/* ===== SWIPE TÁCTIL =====
   Deslizar el dedo en horizontal sobre un slider, el zoom o el visor de
   diseños pasa de imagen (a la izquierda = siguiente). Sólo cuenta un gesto
   claramente horizontal y rápido; el vertical se deja para el scroll. */
function onSwipe(el, cb) {
  if (!el) return;
  let t0 = null;
  el.addEventListener('touchstart', e => {
    if (e.touches.length !== 1) { t0 = null; return; }
    const t = e.touches[0];
    t0 = { x: t.clientX, y: t.clientY, at: performance.now() };
  }, { passive: true });
  el.addEventListener('touchend', e => {
    if (!t0) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - t0.x, dy = t.clientY - t0.y, dt = performance.now() - t0.at;
    t0 = null;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.3 || dt > 900) return;
    cb(dx < 0 ? 1 : -1);
  }, { passive: true });
}

/* ===== SLIDERS ===== */
const sliderVideoControllers = [];

function ensureVideoLoaded(video) {
  if (!video || video.getAttribute('src') || !video.dataset.src) return;
  video.src = video.dataset.src;
  video.load();
}

function syncAllSliderVideos() {
  sliderVideoControllers.forEach(sync => sync());
}

document.addEventListener('visibilitychange', syncAllSliderVideos);
if (reducedMotionQuery.addEventListener) {
  reducedMotionQuery.addEventListener('change', syncAllSliderVideos);
} else {
  reducedMotionQuery.addListener(syncAllSliderVideos);
}

// sonido al pasar de imagen en las galerías: bastante más bajo que el clic normal
const SLIDE_VOL = 0.085;
/* BEFORE / AFTER: rótulo grande centrado sobre la imagen, con fondo oscuro
   translúcido. En el "Before" queda puesto hasta el primer hover; al llegar
   a la primera imagen "After" aparece un instante (1 s) y se va solo. Lo
   mismo dentro del zoom. */
const baTag = el => {
  const t = el && el.querySelector('.slide-tag');
  const v = t ? t.textContent.trim().toLowerCase() : '';
  return v === 'antes' ? 'before' : v === 'después' ? 'after' : v;
};
const BA_MS = 700;                     // lo que se ve el rótulo grande
function baFlash(host, text) {
  host.querySelectorAll(':scope > .ba-flash').forEach(f => f.remove());
  const f = document.createElement('span');
  f.className = 'ba-cover ba-flash';
  f.textContent = text;
  f.setAttribute('aria-hidden', 'true');
  host.appendChild(f);
  setTimeout(() => f.remove(), BA_MS + 200);
}

document.querySelectorAll('[data-slider]').forEach(slider => {
  const slides  = [...slider.querySelectorAll('.slide')];
  const thumbs  = [...slider.querySelectorAll('.thumb')];
  const fill    = slider.querySelector('.progress-fill');
  const counter = slider.querySelector('.slide-counter');
  const prevBtn = slider.querySelector('.prev-btn');
  const nextBtn = slider.querySelector('.next-btn');
  let current = 0;
  let sliderNearViewport = !('IntersectionObserver' in window);
  const sliderProject = slider.closest('.project');
  const sliderStage = slider.closest('#page > section');
  // en el deck "visible" = su proyecto es el actual dentro de la sección activa
  const sliderLive = () => DECK
    ? !!(sliderStage && sliderStage.classList.contains('is-active') &&
         sliderProject && sliderProject.classList.contains('is-current'))
    : sliderNearViewport;

  const pad = n => String(n).padStart(2, '0');

  function syncSliderVideos() {
    slides.forEach((slide, index) => {
      const video = slide.querySelector('video');
      if (!video) return;
      const shouldPlay = index === current && sliderLive() &&
        !document.body.classList.contains('fx-idle') &&
        !document.hidden && !reducedMotionQuery.matches &&
        !document.body.classList.contains('zoom-open') &&
        !document.body.classList.contains('lb-open');
      if (shouldPlay) {
        ensureVideoLoaded(video);
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }

  sliderVideoControllers.push(syncSliderVideos);
  if (!DECK && 'IntersectionObserver' in window) {
    const videoIO = new IntersectionObserver(entries => {
      sliderNearViewport = entries[0].isIntersecting;
      syncSliderVideos();
    }, { rootMargin: '300px 0px', threshold: 0.01 });
    videoIO.observe(slider);
  }

  // CONTRASTE DE LAS FLECHAS: color sólido según lo que tengan detrás →
  // zona clara: flecha NEGRA (.on-light); zona oscura: flecha crema. Para las
  // imágenes se usa un perfil de luminosidad precalculado (data-lum en el
  // HTML); para los videos se muestrea el cuadro con un canvas de 8×8. Si la
  // flecha cae fuera de la imagen se usa el fondo del slide.
  const probe = document.createElement('canvas');
  probe.width = probe.height = 8;
  const pctx = probe.getContext('2d', { willReadFrequently: true });
  const lum = c => (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
  function lumBehind(btn) {
    const media = slides[current].querySelector('img, video');
    const nw = media && (media.naturalWidth || media.videoWidth);
    const nh = media && (media.naturalHeight || media.videoHeight);
    // imagen aún sin cargar: no se adivina (se recalcula en su 'load')
    if (!nw || !nh) return null;
    const br = btn.getBoundingClientRect();
    const mr = media.getBoundingClientRect();
    const sc = Math.min(mr.width / nw, mr.height / nh);   // object-fit: contain
    const ox = mr.left + (mr.width - nw * sc) / 2, oy = mr.top + (mr.height - nh * sc) / 2;
    const fy0 = (br.top - oy) / (nh * sc), fy1 = (br.bottom - oy) / (nh * sc);
    const inX = br.right > ox && br.left < ox + nw * sc;
    if (!inX || fy1 <= 0 || fy0 >= 1) {
      const bg = effectiveBg(slides[current]);         // flecha fuera de la imagen
      return bg ? lum(bg) : null;
    }
    // 1) perfil precalculado (data-lum: luminosidad de los bordes izquierdo y
    //    derecho de la imagen, fila a fila): funciona también con file://
    const prof = media.dataset && media.dataset.lum;
    if (prof) {
      const col = prof.split('|')[btn.classList.contains('prev-btn') ? 0 : 1];
      const rows = col.length / 2;
      const r0 = Math.max(0, Math.floor(fy0 * rows)), r1 = Math.min(rows - 1, Math.ceil(fy1 * rows));
      let sum = 0, n = 0;
      for (let r = r0; r <= r1; r++) { sum += parseInt(col.substr(r * 2, 2), 16); n++; }
      if (n) return sum / n / 255;
    }
    // 2) videos: muestreo del cuadro actual (no disponible con file://)
    const x0 = Math.max(br.left, ox), y0 = Math.max(br.top, oy);
    const x1 = Math.min(br.right, ox + nw * sc), y1 = Math.min(br.bottom, oy + nh * sc);
    try {
      pctx.clearRect(0, 0, 8, 8);
      pctx.drawImage(media, (x0 - ox) / sc, (y0 - oy) / sc, (x1 - x0) / sc, (y1 - y0) / sc, 0, 0, 8, 8);
      const d = pctx.getImageData(0, 0, 8, 8).data;
      let r = 0, g = 0, b = 0;
      for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
      const n = d.length / 4;
      return lum({ r: r / n, g: g / n, b: b / n });
    } catch (_) { return null; }
  }
  function navContrast() {
    // en plena transición del deck las medidas están desplazadas (3D):
    // se espera a que termine (evento deck:settled)
    if (document.body.classList.contains('deck-moving')) return;
    [prevBtn, nextBtn].forEach(b => {
      const L = lumBehind(b);
      if (L !== null) b.classList.toggle('on-light', L > 0.6);
    });
  }
  // cuándo recalcular: al cargar cada imagen, al desplazar las capturas
  // largas y al entrar a la diapositiva del proyecto
  slides.forEach(sl => {
    const m = sl.querySelector('img, video');
    if (m) m.addEventListener(m.tagName === 'IMG' ? 'load' : 'loadeddata', () => { if (sl === slides[current]) navContrast(); });
    let st;
    sl.addEventListener('scroll', () => { clearTimeout(st); st = setTimeout(navContrast, 120); }, { passive: true });
  });
  document.addEventListener('deck:settled', () => { if (sliderLive()) navContrast(); });

  // rótulos Before / After (ver baFlash)
  const firstAfter = slides.findIndex(sl => baTag(sl) === 'after');
  slides.forEach(sl => {
    if (baTag(sl) !== 'before') return;
    const c = document.createElement('span');
    c.className = 'ba-cover';
    c.textContent = tr('Before', 'Antes');
    c.setAttribute('aria-hidden', 'true');
    sl.appendChild(c);
    const off = () => c.classList.add('is-gone');
    sl.addEventListener('mouseenter', off, { once: true });
    sl.addEventListener('click', off, { once: true });
  });
  // CARGA POR CERCANÍA: de las imágenes grandes sólo se piden la actual y sus
  // vecinas (las miniaturas son archivos pequeños aparte). loadImgs se salta
  // las lejanas (__far); al avanzar se piden las que entran en el rango, pero
  // sólo si la sección ya se cargó (slider.__live)
  function markNear() {
    const n = slides.length;
    slides.forEach((sl, i) => {
      const d = Math.min(Math.abs(i - current), n - Math.abs(i - current));
      sl.__far = d > 1;
      if (!sl.__far && slider.__live) loadImgs(sl);
    });
  }
  let baReady = false;               // el show(0) inicial no muestra el After
  let afterShown = false;

  function show(index) {
    const oldVideo = slides[current].querySelector('video');
    if (oldVideo) oldVideo.pause();

    slides[current].classList.remove('active');
    if (thumbs[current]) thumbs[current].classList.remove('active');

    current = (index + slides.length) % slides.length;
    markNear();

    slides[current].classList.add('active');
    if (thumbs[current]) thumbs[current].classList.add('active');

    slides.forEach((slide, index) => {
      const active = index === current;
      slide.tabIndex = active ? 0 : -1;
      slide.setAttribute('aria-hidden', String(!active));
      if (thumbs[index]) {
        thumbs[index].setAttribute('aria-pressed', String(active));
      }
    });

    const video = slides[current].querySelector('video');
    if (video && video.getAttribute('src')) video.currentTime = 0;
    syncSliderVideos();

    if (fill) {
      const pct = ((current + 1) / slides.length) * 100 + '%';
      fill.style.width = pct;
      // en el deck la barra es VERTICAL (sube con el avance): el CSS usa --p.
      // La primera imagen = cohete abajo (junto a las miniaturas), la última =
      // arriba del todo
      const vp = slides.length > 1 ? current / (slides.length - 1) : 1;
      fill.style.setProperty('--p', (vp * 100) + '%');
      // el degradado se dimensiona contra el ancho del TRACK, no del fill, para
      // que los colores no se compriman cuando la barra va poco avanzada
      const track = fill.parentElement;
      if (track) {
        fill.style.setProperty('--track-w', track.clientWidth + 'px');
        fill.style.setProperty('--track-h', track.clientHeight + 'px');
      }
    }
    if (counter) counter.textContent = `${pad(current + 1)} / ${pad(slides.length)}`;
    // el After grande sale sólo la primera vez que se llega a esa imagen
    if (baReady && current === firstAfter && !afterShown) {
      afterShown = true;
      baFlash(slides[current], tr('After', 'Después'));
    }
    // la imagen entra deslizándose: se mide otra vez cuando ya está quieta
    navContrast();
    clearTimeout(navT);
    navT = setTimeout(navContrast, 650);
  }
  let navT;
  // el deck (rueda, teclas, swipe) recorre primero las imágenes del slider
  // del proyecto actual; en los extremos devuelve false y pasa de proyecto
  slider.__nav = dir => {
    const to = current + dir;
    if (to < 0 || to >= slides.length) return false;
    show(to);
    playSound('clic', SLIDE_VOL);
    return true;
  };

  prevBtn.addEventListener('click', e => {
    e.stopPropagation();
    show(current - 1);
    playSound('clic', SLIDE_VOL);
  });

  nextBtn.addEventListener('click', e => {
    e.stopPropagation();
    show(current + 1);
    playSound('clic', SLIDE_VOL);
  });

  onSwipe(slider.querySelector('.slider-main'), dir => {
    show(current + dir);
    playSound('clic', SLIDE_VOL);
  });

  thumbs.forEach((thumb, i) => {
    const media = slides[i] && slides[i].querySelector('img, video');
    const description = media?.getAttribute('alt') || tr(`slide ${i + 1}`, `imagen ${i + 1}`);
    thumb.setAttribute('aria-label', tr(`Show ${description} (${i + 1} of ${slides.length})`, `Ver ${description} (${i + 1} de ${slides.length})`));
    thumb.addEventListener('click', () => {
      show(i);
      playSound('clic', SLIDE_VOL);
    });
  });

  // clic sobre el media del slide (imagen o video) → abrir en zoom
  const sliderMain = slider.querySelector('.slider-main');
  const isTall = !!(sliderMain && sliderMain.classList.contains('tall'));
  const mediaList = slides.map(s => s.querySelector('img, video')).filter(Boolean);
  slides.forEach((slide, index) => {
    const media = slide.querySelector('img, video');
    if (!media) return;
    slide.setAttribute('role', 'button');
    const what = media.getAttribute('alt') || tr(`slide ${index + 1}`, `imagen ${index + 1}`);
    slide.setAttribute('aria-label', tr(`Open ${what} in media viewer`, `Abrir ${what} en el visor`));
    const openSlide = () => {
      slide.focus({ preventScroll: true });
      openZoom(mediaList, mediaList.indexOf(media), isTall);
      playSound('whoosh');
    };
    slide.addEventListener('click', openSlide);
    // flechas y espacio son SIEMPRE del deck (ver su keydown): aquí sólo Enter
    slide.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        openSlide();
      }
    });
  });

  // teclado del deck (← → ↑ ↓ espacio): avanza / retrocede una imagen; false
  // si ya no hay más en esa dirección (entonces el deck cambia de proyecto)
  slider.__goto = el => {
    const i = slides.indexOf(el);
    if (i >= 0 && i !== current) show(i);
  };
  // la flecha de la galería correspondiente se "presiona" (aspecto de hover)
  let pulseT;
  slider.__step = dir => {
    const n = current + dir;
    if (n < 0 || n >= slides.length) return false;
    show(n);
    playSound('clic', SLIDE_VOL);
    const btn = dir > 0 ? nextBtn : prevBtn;
    const other = dir > 0 ? prevBtn : nextBtn;
    other.classList.remove('is-pulse');
    btn.classList.add('is-pulse');
    clearTimeout(pulseT);
    pulseT = setTimeout(() => btn.classList.remove('is-pulse'), 450);
    return true;
  };

  show(0);
  baReady = true;
});

/* ===== ZOOM MODAL (imágenes y videos de los sliders, con navegación) ===== */
const zoomModal = document.getElementById('zoom');
const zoomImg   = document.getElementById('zoom-img');
const zoomVideo = document.getElementById('zoom-video');
const zoomTag   = document.getElementById('zoom-tag');
let zoomList = [];
let zoomIndex = 0;
let zoomReturnFocus = null;

const zoomBa = document.getElementById('zoom-ba');
const zoomBaSeen = new WeakSet();
let zoomBaT = 0;
function zoomBaSync(media) {
  if (!zoomBa) return;
  const slide = media.closest('.slide');
  const tag = baTag(slide);
  zoomBa.querySelectorAll('.ba-flash').forEach(f => f.remove());
  zoomBa.classList.remove('on', 'is-gone');
  zoomBa.textContent = '';
  // en el zoom el rótulo grande sale sólo la primera vez que se ve la imagen
  if (!tag || zoomBaSeen.has(media)) return;
  zoomBaSeen.add(media);
  if (tag === 'before') {
    zoomBa.textContent = tr('Before', 'Antes');
    zoomBa.classList.add('on');
    clearTimeout(zoomBaT);
    zoomBaT = setTimeout(() => zoomBa.classList.add('is-gone'), BA_MS);
  } else if (tag === 'after' && slide && slide.parentElement &&
             [...slide.parentElement.querySelectorAll('.slide')].find(sl => baTag(sl) === 'after') === slide) {
    baFlash(zoomModal, tr('After', 'Después'));
  }
}
// la etiqueta Before / After del zoom va fuera de la imagen: a su izquierda,
// alineada con su borde superior; si no hay espacio, justo encima
function placeZoomTag() {
  if (!zoomTag || !zoomTag.classList.contains('on')) return;
  const m = zoomImg.style.display !== 'none' ? zoomImg : zoomVideo;
  const r = m.getBoundingClientRect();
  if (!r.width) return;
  const w = zoomTag.offsetWidth, h = zoomTag.offsetHeight, GAP = 12;
  let left, top;
  if (r.left - w - GAP >= 8) { left = r.left - w - GAP; top = Math.max(8, r.top); }
  else { left = Math.max(8, r.left); top = Math.max(8, r.top - h - GAP); }
  zoomTag.style.left = left + 'px';
  zoomTag.style.top = top + 'px';
}
if (zoomImg) zoomImg.addEventListener('load', placeZoomTag);
if (zoomVideo) zoomVideo.addEventListener('loadedmetadata', placeZoomTag);
window.addEventListener('resize', placeZoomTag);
function renderZoomMedia() {
  const media = zoomList[zoomIndex];
  if (!media) return;
  zoomBaSync(media);
  // la etiqueta Before/After viaja con el media: se lee del .slide que lo contiene
  if (zoomTag) {
    const tag = media.closest('.slide')?.querySelector('.slide-tag');
    zoomTag.textContent = tag ? tag.textContent : '';
    zoomTag.classList.toggle('on', !!tag);
  }
  if (media.tagName === 'VIDEO') {
    ensureVideoLoaded(media);
    zoomVideo.src = media.currentSrc || media.src || media.dataset.src;
    zoomVideo.style.display = 'block';
    zoomVideo.controls = reducedMotionQuery.matches;
    zoomImg.style.display = 'none';
    zoomImg.removeAttribute('src');
    if (!reducedMotionQuery.matches) zoomVideo.play().catch(() => {});
  } else {
    zoomImg.src = media.currentSrc || media.src || media.dataset.src;
    zoomImg.alt = media.alt || tr('Expanded project media', 'Imagen ampliada del proyecto');
    zoomImg.style.display = 'block';
    zoomVideo.style.display = 'none';
    zoomVideo.pause(); zoomVideo.removeAttribute('src');
  }
  zoomModal.querySelector('.zoom-view').scrollTop = 0;
  requestAnimationFrame(placeZoomTag);
}
function openZoom(list, index, isTall) {
  if (!zoomModal) return;
  zoomReturnFocus = document.activeElement;
  zoomList = list || [];
  zoomIndex = Number.isInteger(index) ? index : 0;
  zoomModal.classList.toggle('zoom-scroll', !!isTall); // scroll solo en landings
  // el modal (fondo opaco) se muestra PRIMERO → aparece al instante; la imagen
  // grande se decodifica async y entra un momento después, sin congelar el clic
  zoomModal.classList.add('active');
  zoomModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('zoom-open');
  document.body.style.overflow = 'hidden';
  setModalBackgroundInert(true);
  syncAllSliderVideos();
  renderZoomMedia();
  document.getElementById('zoom-close').focus();
}
function zoomStep(dir) {
  if (zoomList.length < 2) return;
  zoomIndex = (zoomIndex + dir + zoomList.length) % zoomList.length;
  renderZoomMedia();
}
function closeZoom() {
  if (!zoomModal) return;
  // la galería queda en la imagen que se estaba viendo en el zoom
  const seen = zoomList[zoomIndex];
  const seenSlider = seen && seen.closest('[data-slider]');
  if (seenSlider && seenSlider.__goto) seenSlider.__goto(seen.closest('.slide'));
  zoomModal.classList.remove('active');
  zoomModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('zoom-open', 'zoom-ctrl');
  document.body.style.overflow = '';
  setModalBackgroundInert(false);
  zoomImg.removeAttribute('src');
  zoomVideo.pause(); zoomVideo.removeAttribute('src');
  if (zoomTag) { zoomTag.textContent = ''; zoomTag.classList.remove('on'); }
  syncAllSliderVideos();
  if (zoomReturnFocus && zoomReturnFocus.isConnected) zoomReturnFocus.focus();
  zoomReturnFocus = null;
}
if (zoomModal) {
  document.getElementById('zoom-close').addEventListener('click', e => { e.stopPropagation(); closeZoom(); });
  onSwipe(zoomModal, dir => { if (document.body.classList.contains('zoom-open')) zoomStep(dir); });
  document.getElementById('zoom-prev').addEventListener('click', e => { e.stopPropagation(); zoomStep(-1); });
  document.getElementById('zoom-next').addEventListener('click', e => { e.stopPropagation(); zoomStep(1); });
  zoomModal.addEventListener('click', e => {
    // clic en el fondo, el contenedor, la propia imagen o el propio video → zoom out / cierra modal
    if (
      e.target === zoomModal || 
      e.target.classList.contains('zoom-view') || 
      e.target.id === 'zoom-img' || 
      e.target.id === 'zoom-video'
    ) {
      closeZoom();
    }
  });
  document.addEventListener('keydown', e => {
    if (!zoomModal.classList.contains('active')) return;
    if (e.key === 'Tab') trapFocus(zoomModal, e);
    else if (e.key === 'Escape') closeZoom();
    else if (e.key === 'ArrowLeft') zoomStep(-1);
    else if (e.key === 'ArrowRight') zoomStep(1);
    // cualquier otra tecla cierra el zoom, salvo ↑ ↓, espacio y RePág / AvPág
    // (recorren la imagen) y las modificadoras solas (Shift, Ctrl…)
    else if (!['ArrowUp', 'ArrowDown', ' ', 'PageUp', 'PageDown',
               'Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) {
      e.preventDefault();
      e.stopImmediatePropagation();
      closeZoom();
    }
  });
  const syncZoomMotionPreference = () => {
    if (!zoomModal.classList.contains('active') || zoomVideo.style.display === 'none') return;
    zoomVideo.controls = reducedMotionQuery.matches;
    if (reducedMotionQuery.matches) zoomVideo.pause();
    else zoomVideo.play().catch(() => {});
  };
  if (reducedMotionQuery.addEventListener) {
    reducedMotionQuery.addEventListener('change', syncZoomMotionPreference);
  } else {
    reducedMotionQuery.addListener(syncZoomMotionPreference);
  }
}

/* ===== ACTIVE NAV LINK ===== */
const sections = document.querySelectorAll('section[id], header[id]');
const navLinks = document.querySelectorAll('#topbar ul a');

let navTick = false;
function setActiveNav(id) {
  navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
}
function updateActiveNav() {
  if (DECK) return;   // en el deck lo marca el controlador (setActiveNav)
  let currentId = '';
  sections.forEach(s => {
    if (window.scrollY >= s.offsetTop - 160) currentId = s.id;
  });
  navLinks.forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === '#' + currentId);
  });
}
window.addEventListener('scroll', () => {
  if (navTick) return;
  navTick = true;
  requestAnimationFrame(() => {
    navTick = false;
    updateActiveNav();
  });
}, { passive: true });
updateActiveNav();

/* ===== REVEAL ON SCROLL ===== */
const revealEls = [
  ...document.querySelectorAll('.project'),
  ...document.querySelectorAll('.design-item'),
  ...document.querySelectorAll('.skill-tag'),
  ...document.querySelectorAll('.exp-intro'),
  document.querySelector('.about-img'),
  document.querySelector('.about-text'),
].filter(Boolean);

revealEls.forEach(el => el.classList.add('reveal'));

if (DECK) {
  // en el deck el reveal lo dispara la entrada de cada diapositiva (deckReveal)
} else if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  revealEls.forEach(el => io.observe(el));
} else {
  revealEls.forEach(el => el.classList.add('visible'));
}

/* ===== TEXTO QUE SE ESCRIBE AL ENTRAR EN PANTALLA =====
   Cada párrafo/título del contenido se teclea cuando aparece. Para no romper el
   markup interno (<strong>, <a>…) se recorre el árbol y se guarda cada nodo de
   texto con su contenido original; luego se van revelando carácter a carácter
   en orden de documento. El layout no salta porque el elemento reserva su alto
   final con min-height antes de empezar (medido con el texto completo). */
(function () {
  if (!('IntersectionObserver' in window)) return;

  const SELECTOR = [
    '.hero-desc',
    '.exp-desc', '.proj-desc', '.proj-desc-shared',
    '.section-title', '.projects-title', '.exp-role', '.proj-name',
    '.about-copy', '.head-loc',   // los dos párrafos del about como UN bloque (el 2.º sigue al 1.º)
  ].join(', ');

  const targets = [...document.querySelectorAll(SELECTOR)]
    // el hero tiene su propio typewriter para el NOMBRE y el ROL; el resto de
    // sus textos (la descripción) sí entra en este sistema de escritura
    .filter(el => !(el.closest('#hero') && !el.classList.contains('hero-desc')));

  if (!targets.length) return;

  function collectTextNodes(root) {
    const out = [];
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walk.nextNode())) {
      if (n.nodeValue.trim()) out.push({ node: n, full: n.nodeValue });
    }
    return out;
  }

  function typeIn(el, done) {
    // el texto ORIGINAL se captura una sola vez: si el elemento se vuelve a
    // escribir (descripciones de proyecto) o se relanza a medio teclear, se
    // parte siempre del texto completo y no de uno recortado
    if (!el.__typeParts) el.__typeParts = collectTextNodes(el);
    const parts = el.__typeParts;
    if (!parts.length) return;
    const run = (el.__typeRun = (el.__typeRun || 0) + 1);   // cancela la pasada anterior
    parts.forEach(p => { p.node.nodeValue = p.full; });
    el.style.minHeight = '';

    // reserva el alto final para que el texto no empuje el layout al crecer.
    // offsetHeight (layout) y no getBoundingClientRect: en el deck el texto se
    // mide mientras la diapositiva entra con transform 3D (escalada).
    el.style.minHeight = el.offsetHeight + 'px';

    const total = parts.reduce((s, p) => s + p.full.length, 0);
    // duración objetivo ~1.1s para bloques cortos, hasta ~2.4s para largos
    const DUR = Math.min(2400, 700 + total * 4);
    parts.forEach(p => { p.node.nodeValue = ''; });
    el.classList.add('typing-in');

    // bloques de varios párrafos (tarjeta del about): el caret es un elemento
    // real que va justo detrás de la última letra escrita, en el párrafo que
    // toque (su ::after ya lo usa la sombra de la tarjeta)
    let caret = null;
    if (el.classList.contains('about-copy')) {
      caret = el.__caret || (el.__caret = document.createElement('span'));
      caret.className = 'type-caret';
      caret.setAttribute('aria-hidden', 'true');
    }

    const t0 = performance.now();
    function step(now) {
      if (el.__typeRun !== run) return;   // hubo una pasada nueva: ésta se abandona
      const t = Math.min(1, (now - t0) / DUR);
      // easeOutQuad: arranca rápido y desacelera al final
      const shown = Math.round(total * (1 - Math.pow(1 - t, 2)));
      let left = shown, at = parts[0].node;
      for (const p of parts) {
        if (left <= 0) { p.node.nodeValue = ''; continue; }
        p.node.nodeValue = p.full.slice(0, left);
        at = p.node;
        left -= p.full.length;
      }
      if (caret && at.nextSibling !== caret) at.after(caret);
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        parts.forEach(p => { p.node.nodeValue = p.full; });
        if (caret) caret.remove();
        el.classList.remove('typing-in');
        el.style.minHeight = '';
        if (done) done();
      }
    }
    requestAnimationFrame(step);
  }

  // el hero orquesta su propio orden (nombre → rol → descripción → botones)
  window.__typeIn = typeIn;

  if (reducedMotionQuery.matches) return;   // sin movimiento: se deja el texto tal cual

  if (DECK) {
    // el deck llama a esto al entrar a una diapositiva / proyecto; `accept`
    // filtra (p. ej. los proyectos no actuales de la sección)
    window.__typeWithin = (root, accept) => {
      targets.forEach(el => {
        if (!root.contains(el) || (accept && !accept(el))) return;
        if (el.closest('#hero')) return;   // el hero lo escribe su propia secuencia
        // las descripciones de proyecto se escriben CADA vez que se muestran;
        // el resto del texto, sólo la primera vez
        const always = !!el.closest('[data-pdesc]');
        if (el.dataset.typed && !always) return;
        el.dataset.typed = '1';
        typeIn(el);
      });
    };
    return;
  }

  const typeIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      typeIO.unobserve(e.target);
      typeIn(e.target);
    });
  }, { threshold: 0.25, rootMargin: '0px 0px -8% 0px' });

  targets.forEach(el => typeIO.observe(el));
})();

/* ===== LIGHTBOX (graphic design gallery) ===== */
const lightbox = document.getElementById('lightbox');
const lbImg    = document.getElementById('lb-img');
const designImgs = [...document.querySelectorAll('.design-item img')];
let lbIndex = 0;
let lightboxReturnFocus = null;

function openLightbox(i) {
  lightboxReturnFocus = document.activeElement;
  lbIndex = i;
  lbImg.src = designImgs[i].src || designImgs[i].dataset.src;
  lbImg.alt = designImgs[i].alt || `Graphic design piece ${i + 1}`;
  lightbox.classList.add('active');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.classList.add('lb-open');
  document.body.style.overflow = 'hidden';
  setModalBackgroundInert(true);
  syncAllSliderVideos();
  document.getElementById('lb-close').focus();
  playSound('tilin');
}
function closeLightbox() {
  lightbox.classList.remove('active');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('lb-open', 'zoom-ctrl');
  document.body.style.overflow = '';
  setModalBackgroundInert(false);
  lbImg.src = '';
  lbImg.alt = tr('Enlarged view', 'Vista ampliada');
  syncAllSliderVideos();
  if (lightboxReturnFocus && lightboxReturnFocus.isConnected) lightboxReturnFocus.focus();
  lightboxReturnFocus = null;
}
function lbStep(dir) {
  lbIndex = (lbIndex + dir + designImgs.length) % designImgs.length;
  lbImg.src = designImgs[lbIndex].src || designImgs[lbIndex].dataset.src;
  lbImg.alt = designImgs[lbIndex].alt || tr(`Graphic design piece ${lbIndex + 1}`, `Pieza de diseño gráfico ${lbIndex + 1}`);
}

designImgs.forEach((img, i) => {
  const button = img.closest('.design-item');
  button.setAttribute('aria-label', tr(`Open graphic design piece ${i + 1} of ${designImgs.length}`, `Abrir pieza de diseño gráfico ${i + 1} de ${designImgs.length}`));
  button.addEventListener('click', () => openLightbox(i));
});
document.getElementById('lb-close').addEventListener('click', closeLightbox);
onSwipe(lightbox, dir => { if (lightbox.classList.contains('active')) lbStep(dir); });
document.getElementById('lb-prev').addEventListener('click', () => lbStep(-1));
document.getElementById('lb-next').addEventListener('click', () => lbStep(1));
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });

document.addEventListener('keydown', e => {
  if (lightbox.classList.contains('active') && e.key === 'Tab') {
    trapFocus(lightbox, e);
    return;
  }
  if (e.key === 'Escape') {
    if (lightbox.classList.contains('active')) closeLightbox();
    return;
  }
  if (!lightbox.classList.contains('active')) return;
  if (e.key === 'ArrowLeft')  lbStep(-1);
  if (e.key === 'ArrowRight') lbStep(1);
});

/* ===== BOTTOMBAR: se abre con clic en la barra o tras 30s; cierra al clic fuera ===== */
(function () {
  const bb = document.getElementById('bottombar');
  if (!bb) return;
  // en móvil la barra abierta ocupa casi un cuarto de pantalla y tapa el hero:
  // ahí arranca CERRADA y el hero no la abre (se abre con su botón)
  const bbMobile = window.matchMedia('(max-width: 720px)');
  let manualOpen = !bbMobile.matches; // escritorio: arranca ABIERTA al cargar
  let bottomTrigger = false;  // estamos al final de la página
  let bottomActive = false;   // ya disparamos el scroll automático al fondo
  let suppressBottom = false; // tras back-to-top: ignora el fondo hasta salir de él
  let autoTimers = [];
  let autoRaf = null;

  const secs = document.querySelectorAll('#page > section');
  const lastSection   = secs[secs.length - 1];
  const secondSection = secs[1]; // about[0], FAMA[1] → back-to-top tras ésta

  function setOpen(open) {
    bb.classList.toggle('open', open);
    document.body.classList.toggle('bb-open', open);
  }
  function clearAuto() {
    autoTimers.forEach(clearTimeout); autoTimers = [];
    if (autoRaf) { cancelAnimationFrame(autoRaf); autoRaf = null; }
  }
  // el hero cuenta como zona de barra abierta: mientras se vea el hero la barra
  // se queda desplegada (es la "portada", ahí sí queremos los contactos a mano)
  const heroSec = document.getElementById('hero');
  let inHeroView = false;
  let heroDismissed = false;  // el usuario la cerró a mano estando en el hero

  function render() {
    setOpen(manualOpen || bottomTrigger || (inHeroView && !heroDismissed && !bbMobile.matches));
    bb.classList.toggle('at-bottom', bottomTrigger); // al final no se muestra el botón cerrar
  }

  function check() {
    if (DECK) {
      // en el deck no hay scroll de página: el estado sale de la diapositiva
      // activa (hero → abierta, última → abierta sin botón cerrar, back-to-top
      // a partir de la 2ª sección de contenido)
      const d = window.deck;
      const si = d ? d.stageIndex() : 0;
      const n  = d ? d.stageCount() : 1;
      const wasInHero = inHeroView;
      inHeroView = si === 0;
      if (wasInHero && !inHeroView) heroDismissed = false;
      bottomTrigger = n > 1 && si === n - 1;
      bb.classList.toggle('show-backtop', si >= 1);   // Home: fuera del hero
      render();
      return;
    }
    const atPageBottom = !!lastSection &&
      lastSection.getBoundingClientRect().bottom <= window.innerHeight + 2;
    if (suppressBottom && !atPageBottom) suppressBottom = false;
    bottomTrigger = atPageBottom && !suppressBottom;

    // ¿seguimos sobre el hero? (su mitad inferior aún visible)
    const wasInHero = inHeroView;
    inHeroView = !!heroSec &&
      heroSec.getBoundingClientRect().bottom > window.innerHeight * 0.5;
    // al salir del hero se olvida el cierre manual: si vuelve, se reabre
    if (wasInHero && !inHeroView) heroDismissed = false;

    // back-to-top visible solo después de la 2ª sección (con el hero/about oculto)
    // (Home: visible en cuanto se sale del hero)
    const showBackTop = !inHeroView;
    bb.classList.toggle('show-backtop', showBackTop);

    render();

    // al ENTRAR al fondo: UN solo deslizamiento suave hacia el fondo para que la
    // barra (y el padding del #page) no oculte el contenido. Antes se lanzaban
    // tres scrolls "smooth" encadenados que competían entre sí y causaban el
    // "doble salto" (el #page crece su padding-bottom durante 0.55s, así que cada
    // scroll apuntaba a un fondo distinto). Este tween recalcula el fondo en cada
    // frame: sigue el crecimiento del layout y termina abajo en un único gesto.
    if (bottomTrigger && !bottomActive) {
      bottomActive = true;
      if (reducedMotionQuery.matches) {
        window.scrollTo({
          top: document.documentElement.scrollHeight - window.innerHeight,
          behavior: 'auto',
        });
        return;
      }
      const startY = window.scrollY;
      const t0 = performance.now();
      const DUR = 620; // un poco más que la transición de 0.55s
      const easeOut = t => 1 - Math.pow(1 - t, 3);
      const step = now => {
        if (suppressBottom || !bottomActive) { autoRaf = null; return; }
        const t = Math.min(1, (now - t0) / DUR);
        const maxY = document.documentElement.scrollHeight - window.innerHeight;
        // 'instant': el easing lo controla este tween, no el scroll-behavior:smooth
        // global del html (que si no convertiría cada frame en otro scroll suave
        // que compite consigo mismo).
        window.scrollTo({ top: startY + (maxY - startY) * easeOut(t), behavior: 'instant' });
        autoRaf = t < 1 ? requestAnimationFrame(step) : null;
      };
      autoRaf = requestAnimationFrame(step);
    } else if (!bottomTrigger && bottomActive) {
      bottomActive = false;
    }
  }

  // Al recargar a media página el navegador restaura el scroll y dispara un evento
  // 'scroll' que NO es del usuario: cerraría la barra antes de que se vea. Mientras
  // dure `booting` el scroll no la cierra; se levanta con el primer gesto real.
  let booting = true;
  const endBoot = () => { booting = false; };
  ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(ev =>
    window.addEventListener(ev, endBoot, { passive: true, once: true }));
  setTimeout(endBoot, 1200);

  let prevY = window.scrollY;
  let bbTick = false;
  // Se agregó capture:true para detectar también el scroll dentro de contenedores internos (como sliders)
  window.addEventListener('scroll', () => {
    if (bbTick) return;
    bbTick = true;
    requestAnimationFrame(() => {
      bbTick = false;
      const y = window.scrollY;
      if (y < prevY) { clearAuto(); suppressBottom = true; } // scroll up → cancela el auto-scroll
      prevY = y;
      if (!booting) manualOpen = false; // hacer scroll (página o slider) cierra la barra
      check();
    });
  }, { passive: true, capture: true });
  window.addEventListener('resize', check);
  document.addEventListener('deck:change', () => setTimeout(check, 0));
  // cambiar de diapositiva equivale a hacer scroll: cierra la barra manual
  window.__bbNav = () => {
    if (!booting) manualOpen = false;
    clearAuto();
    check();
  };

  // ABRIR/CERRAR con clic en la barra (no en un enlace); CERRAR con clic fuera
  document.addEventListener('click', e => {
    if (e.target.closest('.bb-toggle')) return; // lo maneja su handler
    const insideBar = bb.contains(e.target);
    const onLink = e.target.closest('#bottombar a');
    if (insideBar && !onLink) {
      manualOpen = !manualOpen; // Invierte el estado de apertura al hacer clic en la barra
    } else if (!insideBar) {
      manualOpen = false;
    }
    render();
  });

  // botón "+" (45°) → cierra la barra
  const toggle = bb.querySelector('.bb-toggle');
  if (toggle) {
    toggle.addEventListener('click', e => {
      e.stopPropagation();
      manualOpen = false; clearAuto();
      heroDismissed = true;   // permite cerrarla también estando en el hero
      render();
    });
  }

  // back to top → cancela el auto-scroll, sube, cierra y oculta su texto
  const backTop = bb.querySelector('.backtop');
  if (backTop) {
    backTop.addEventListener('click', () => {
      clearAuto();
      if (DECK) { manualOpen = false; render(); return; } // el deck navega al #hero
      suppressBottom = true; bottomActive = false; manualOpen = false; bottomTrigger = false;
      render();
      window.scrollTo({
        top: 0,
        behavior: reducedMotionQuery.matches ? 'auto' : 'smooth',
      });
      bb.classList.add('backtop-hidden');
      const waitStarted = performance.now();
      const waitTop = setInterval(() => {
        if (window.scrollY <= 5) {
          clearInterval(waitTop);
          setTimeout(() => {
            if (window.scrollY > 5) {
              bb.classList.remove('backtop-hidden');
            } else {
              window.addEventListener('scroll', () => bb.classList.remove('backtop-hidden'),
                { passive: true, once: true });
            }
          }, 250);
        } else if (performance.now() - waitStarted > 2500) {
          clearInterval(waitTop);
          bb.classList.remove('backtop-hidden');
        }
      }, 100);
    });
  }

  // tras 30s de inactividad, abre la barra
  let idleTimer;
  function resetIdle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => { manualOpen = true; render(); }, 30000);
  }
  ['mousemove', 'scroll', 'keydown', 'click', 'touchstart'].forEach(ev =>
    window.addEventListener(ev, resetIdle, { passive: true }));
  resetIdle();

  // ===== TOOLTIPS (≤1103px): el texto de cada icono aparece al hover y se oculta
  // en cualquier interacción (scroll, clic, touch, tecla). Mover el ratón sobre un
  // icono reactiva el tooltip (quita .tip-off). En pantallas anchas no tiene efecto. =====
  const dismissTip = () => bb.classList.add('tip-off');
  ['scroll', 'wheel', 'click', 'touchstart', 'keydown'].forEach(ev =>
    window.addEventListener(ev, dismissTip, { passive: true, capture: true }));
  bb.addEventListener('mouseover', e => {
    if (e.target.closest('#bottombar a')) bb.classList.remove('tip-off');
  });

  check();
})();

/* ===== TOOLS FLOTANTES EN EL HERO =====
   Los iconos suben y el mouse los repele a menos de 300px. El rAF y el
   temporizador sólo viven mientras la sección está cerca del viewport, la
   pestaña está visible y el usuario permite movimiento. */
function initToolFloat(toolsBg, opts) {
  if (!toolsBg) return;
  const cfg = opts || {};
  const icons = ['illustrator','wordpress','ps','figma','css','html','js','php','react','moodle','ux','aftereffects','premiere','claude','codex','gemini','creativecloud','woocommerce','elementor','jquery'];

  const R_NEAR = 300;
  const R_HARD = 100;
  const MAX_ITEMS = cfg.maxItems || 28;   // tope de seguridad (-30% adicional)
  const MAX_OP    = cfg.maxOpacity !== undefined ? cfg.maxOpacity : 0.1;   // antes 0.156: más tenues
  const CLASS     = cfg.itemClass || 'tool-float';
  const items = [];
  let mouseX = -9999, mouseY = -9999, hasMouse = false;
  let inView = !('IntersectionObserver' in window);
  let raf = null, last = 0, spawnTimer = null, seeded = false, spawnTick = 0;

  const localRect = () => toolsBg.getBoundingClientRect();

  window.addEventListener('mousemove', e => {
    if (!inView) return;
    const r = localRect();
    mouseX = e.clientX - r.left;
    mouseY = e.clientY - r.top;
    hasMouse = true;
  }, { passive: true });
  window.addEventListener('mouseleave', () => { hasMouse = false; });

  // px,py opcionales (en coords de página): si se pasan, el icono nace ahí
  // (usado por la estela del cursor); si no, nace abajo en X aleatoria.
  function spawn(px, py) {
    if (!shouldAnimate()) return;
    // en pantallas <1024px, la mitad de iconos en pantalla
    const cap = window.innerWidth < 1024 ? Math.round(MAX_ITEMS / 2) : MAX_ITEMS;
    if (items.length >= cap) return;
    const r = localRect();
    const atCursor = px !== undefined;
    const size = 20 + Math.random() * 27;
    const img = document.createElement('img');
    img.src = ASSET_BASE + 'tools/' + icons[Math.floor(Math.random() * icons.length)] + '.png';
    img.className = CLASS;
    img.alt = '';
    img.style.width = size + 'px';
    const it = {
      el: img, size,
      x: atCursor ? px - r.left : size / 2 + Math.random() * Math.max(1, r.width - size),
      y: atCursor ? py - r.top  : r.height + size,   // centro Y
      driftX: Math.random() * 36 - 18,       // deriva horizontal al subir
      baseVy: (46 + Math.random() * 60) * 0.7, // rapidez de ascenso (-30%)
      vx: 0, vy: 0,
      rot: Math.random() * 20 - 10,          // inclinación inicial pequeña
      vr: Math.random() * 12 - 6,            // giro leve (±6°/s)
      age: 0, dead: false,
    };
    it.vy = -it.baseVy;
    place(it);
    toolsBg.appendChild(img);
    items.push(it);
    ensureFrame();
  }

  function place(it) {
    it.el.style.transform =
      'translate(' + (it.x - it.size / 2) + 'px,' + (it.y - it.size / 2) + 'px) rotate(' + it.rot + 'deg)';
  }

  // la estela del cursor dentro del hero crea iconos aquí (se quedan y flotan)
  // (la estela vale para la sección del contenedor mientras está activa)
  if (cfg.trail) {
    const sec = toolsBg.closest('#hero, #page > section');
    (window.__toolTrails = window.__toolTrails || []).push({
      over: (x, y) => {
        if (!sec || (DECK && !sec.classList.contains('is-active'))) return false;
        const h = sec.getBoundingClientRect();
        return x >= h.left && x <= h.right && y >= h.top && y <= h.bottom;
      },
      spawn: (clientX, clientY) => spawn(clientX, clientY),
    });
  }

  function frame(t) {
    if (!shouldAnimate() || !items.length) {
      raf = null;
      last = 0;
      return;
    }
    const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
    last = t;
    const r = localRect();

    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      if (it.dead) { items.splice(i, 1); continue; }
      it.age += dt;

      // velocidad deseada: por defecto subir; el mouse los aleja por tramos
      let desVx = it.driftX, desVy = -it.baseVy, steer = 4;
      if (hasMouse) {
        const dx = mouseX - it.x, dy = mouseY - it.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < R_NEAR * R_NEAR) {
          const d = Math.sqrt(d2) || 1;
          // fuerza de repulsión por tramos (px/s, alejándose del cursor)
          const push = d <= R_HARD ? 150 : 95;   // ≤100 fuerte · ≤300
          const ux = dx / d, uy = dy / d;     // dirección hacia el cursor
          // se suma al ascenso base, pero en sentido contrario (aleja)
          desVx = it.driftX - ux * push;
          desVy = -it.baseVy - uy * push;
          steer = 6;
        }
      }

      const k = Math.min(1, steer * dt);
      it.vx += (desVx - it.vx) * k;
      it.vy += (desVy - it.vy) * k;
      it.x  += it.vx * dt;
      it.y  += it.vy * dt;
      it.rot += it.vr * dt;
      // mantener la inclinación pequeña: nunca boca abajo
      if (it.rot > 18)  { it.rot = 18;  it.vr = -it.vr; }
      if (it.rot < -18) { it.rot = -18; it.vr = -it.vr; }

      // reciclar cuando sale del hero (por arriba o por los lados)
      if (it.y < -it.size * 2 ||
          it.x < -it.size * 3 || it.x > r.width + it.size * 3) {
        it.el.remove(); items.splice(i, 1); continue;
      }

      it.el.style.opacity = Math.min(MAX_OP, it.age / 0.4 * MAX_OP);
      place(it);
    }
    raf = items.length ? requestAnimationFrame(frame) : null;
  }

  function shouldAnimate() {
    return inView && !document.hidden && !reducedMotionQuery.matches && !isLite();
  }

  function ensureFrame() {
    if (shouldAnimate() && items.length && !raf) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  }

  function scheduleSpawn() {
    clearTimeout(spawnTimer);
    spawnTimer = null;
    if (!shouldAnimate() || cfg.ambient === false) return;
    spawnTimer = setTimeout(() => {
      if (window.innerWidth >= 1024 || !(spawnTick++ & 1)) spawn();
      scheduleSpawn();
    }, cfg.interval || 1529);
  }

  function updateActivity() {
    if (shouldAnimate()) {
      if (!seeded && cfg.ambient !== false) {
        seeded = true;
        const count = window.innerWidth < 1024 ? 2 : 4;
        for (let i = 0; i < count; i++) setTimeout(spawn, i * 350);
      }
      ensureFrame();
      scheduleSpawn();
    } else {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
      last = 0;
      clearTimeout(spawnTimer);
      spawnTimer = null;
      if (reducedMotionQuery.matches || isLite()) {
        items.forEach(item => item.el.remove());
        items.length = 0;
      }
    }
  }

  if (DECK) {
    const stage = toolsBg.closest('#hero, #page > section');
    document.addEventListener('deck:change', () => {
      inView = !!stage && stage.classList.contains('is-active');
      updateActivity();
    });
  } else if ('IntersectionObserver' in window) {
    const toolIO = new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      updateActivity();
    }, { rootMargin: '200px 0px', threshold: 0.01 });
    toolIO.observe(toolsBg);
  }
  document.addEventListener('visibilitychange', updateActivity);
  document.addEventListener('lite:change', updateActivity);
  if (reducedMotionQuery.addEventListener) {
    reducedMotionQuery.addEventListener('change', updateActivity);
  } else {
    reducedMotionQuery.addListener(updateActivity);
  }
  updateActivity();
}

// Sólo en las dos bandas oscuras (hero y about): ahí los iconos invertidos se
// leen bien. En el contenido claro competían con el texto, así que no van.
initToolFloat(document.querySelector('#hero .tools-bg'), { trail: true, maxItems: 30 });
initToolFloat(document.querySelector('#about .tools-bg'), { trail: true, maxItems: 30, interval: 1900 });
// secciones de proyectos: sólo la estela del mouse (sin iconos ambientales)
document.querySelectorAll('#page > section.company-sec').forEach(sec => {
  const bg = document.createElement('div');
  bg.className = 'tools-bg';
  bg.setAttribute('aria-hidden', 'true');
  sec.prepend(bg);
  // misma transparencia y mezcla que los iconos del clic sobre el body oscuro
  initToolFloat(bg, { trail: true, ambient: false, maxItems: 30, maxOpacity: 0.13, itemClass: 'tool-float ct-dark' });
});

/* ===== ICONOS AL HACER CLIC =====
   Un clic en zona vacía suelta tres iconos en abanico que suben y se disuelven DENTRO de la
   sección clicada. La sección tiene overflow:hidden y position:relative, así
   que el icono queda recortado en sus bordes → "desaparece al final de su
   sección". El color se adapta al fondo (effectiveBg → luminancia): sobre banda
   clara (hero/about) el icono va normal (oscuro) y con la MISMA opacidad que los
   ambientales del hero; sobre el body oscuro va invertido (claro) algo más
   tenue. Igual que los del hero, el cursor los REPELE (usa el mx/my global, sin
   listeners de mousemove extra → no cuesta rendimiento en los sliders). */
(function () {
  const ICONS = ['illustrator','wordpress','ps','figma','css','html','js','php','react','moodle','ux','aftereffects','premiere','claude','codex','gemini','creativecloud','woocommerce','elementor','jquery'];
  const live = [];
  let raf = null, last = 0;
  const MAX = 40;                    // tope de iconos vivos a la vez
  const R_NEAR = 300, R_HARD = 100;  // radios de repulsión (mismos que el hero)

  function sectionOf(x, y) {
    const el = document.elementFromPoint(x, y);
    return el && el.closest ? el.closest('#hero, #page > section') : null;
  }

  // side: -1 izquierda · 0 centro · 1 derecha (abanico al soltar varios)
  function spawnAt(x, y, side = 0, icon) {
    if (live.length >= MAX) return;
    const section = sectionOf(x, y);
    if (!section) return;
    let layer = section.querySelector(':scope > .click-tools');
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'click-tools';
      layer.setAttribute('aria-hidden', 'true');
      section.appendChild(layer);
    }
    const bg = effectiveBg(section);
    const light = bg ? (0.299 * bg.r + 0.587 * bg.g + 0.114 * bg.b) > 140 : false;
    const rect = section.getBoundingClientRect();
    const size = 22 + Math.random() * 26;
    const img = document.createElement('img');
    img.src = ASSET_BASE + 'tools/' + (icon || ICONS[(Math.random() * ICONS.length) | 0]) + '.png';
    img.className = 'click-tool ' + (light ? 'ct-light' : 'ct-dark');
    img.alt = '';
    img.style.width = size + 'px';
    layer.appendChild(img);
    live.push({
      el: img, size, section,
      x: x - rect.left, y: y - rect.top,
      driftX: side * 28 + Math.random() * 30 - 15,   // deriva horizontal al subir
      baseVy: 42 + Math.random() * 48,     // rapidez de ascenso
      // impulso inicial hacia su lado del abanico (luego se suaviza)
      vx: side * (110 + Math.random() * 50), vy: side ? -40 : -90,
      rot: Math.random() * 20 - 10,
      vr: Math.random() * 12 - 6,
      age: 0,
      // en el hero/about se iguala a los ambientales (0.156); en el body sube
      // un poco respecto al 0.10 anterior
      maxOp: light ? 0.1 : 0.13,
    });
    if (!raf) { last = 0; raf = requestAnimationFrame(step); }
  }

  function step(t) {
    const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
    last = t;
    const rectCache = new Map();   // un getBoundingClientRect por sección por frame
    for (let i = live.length - 1; i >= 0; i--) {
      const it = live[i];
      it.age += dt;

      // velocidad deseada: subir con su deriva; el cursor lo aleja por tramos
      let desVx = it.driftX, desVy = -it.baseVy, steer = 4;
      let rect = rectCache.get(it.section);
      if (!rect) { rect = it.section.getBoundingClientRect(); rectCache.set(it.section, rect); }
      const cxLocal = mx - rect.left, cyLocal = my - rect.top;   // cursor en coords de la sección
      const dx = cxLocal - it.x, dy = cyLocal - it.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < R_NEAR * R_NEAR) {
        const d = Math.sqrt(d2) || 1;
        const push = d <= R_HARD ? 150 : 95;   // ≤100 fuerte · ≤300 medio
        const ux = dx / d, uy = dy / d;
        desVx = it.driftX - ux * push;         // se aleja del cursor
        desVy = -it.baseVy - uy * push;
        steer = 6;
      }

      const k = Math.min(1, steer * dt);
      it.vx += (desVx - it.vx) * k;
      it.vy += (desVy - it.vy) * k;
      it.x += it.vx * dt;
      it.y += it.vy * dt;
      it.rot += it.vr * dt;
      if (it.rot > 18)  { it.rot = 18;  it.vr = -it.vr; }
      if (it.rot < -18) { it.rot = -18; it.vr = -it.vr; }

      // desaparece al salir por arriba/los lados de su sección (o por tiempo)
      if (it.y < -it.size * 2 ||
          it.x < -it.size * 3 || it.x > rect.width + it.size * 3 || it.age > 16) {
        it.el.remove(); live.splice(i, 1); continue;
      }
      it.el.style.transform =
        'translate(' + (it.x - it.size / 2) + 'px,' + (it.y - it.size / 2) + 'px) rotate(' + it.rot + 'deg)';
      it.el.style.opacity = Math.min(it.maxOp, it.age / 0.4 * it.maxOp);
    }
    raf = live.length ? requestAnimationFrame(step) : null;
  }

  document.addEventListener('click', e => {
    if (reducedMotionQuery.matches) return;
    if (e.target.closest &&
        e.target.closest('a, button, input, textarea, select, label, [role="button"], [data-sound]')) return;
    // tres iconos distintos en abanico: izquierda, centro, derecha
    const pick = ICONS.slice().sort(() => Math.random() - 0.5);
    [-1, 0, 1].forEach((side, k) => spawnAt(e.clientX, e.clientY, side, pick[k % pick.length]));
    // onda en el punto del clic: ancha y fuerte (algo menos sobre hero y about)
    if (rippleDrop && !isLite()) rippleDrop(e.clientX, e.clientY, overLightBand(e.clientX, e.clientY) ? 1.6 : 2.4, true);
  }, { passive: true });
})();

/* ===== CÓDIGO DECORATIVO DE FONDO =====
   Columnas de binario + fragmentos reales de los lenguajes del CV, cayendo muy
   despacio. Se generan una sola vez al cargar (no hay rAF: la caída la hace una
   animación CSS lineal), así que el coste en runtime es cero. */
(function () {
  const host = document.getElementById('code-rain');
  if (!host) return;
  if (reducedMotionQuery.matches) return;
  if (window.matchMedia('(max-width: 900px)').matches) return;

  /* Fragmentos de los stacks del CV, agrupados por estilo. La mezcla de
     lenguajes (no una pared de binario) es lo que hace que el fondo lea como
     "código" y no como ruido. El binario queda relegado a un acento raro. */
  const LINES = [
    // PHP / WordPress / WooCommerce
    "add_action('woocommerce_checkout_order_processed', $fn);",
    "add_filter('woocommerce_available_payment_gateways', $fn);",
    'wp_enqueue_script("dargo-main", $src, [], $ver, true);',
    'if (!current_user_can("edit_posts")) return;',
    '$order = wc_get_order($order_id);',
    '$wpdb->get_results($wpdb->prepare($sql, $id));',
    'update_post_meta($post_id, "_plan", $plan);',
    'return new WP_REST_Response($payload, 200);',
    // Moodle
    'function get_string($id, $component = "") {',
    '$PAGE->requires->js_call_amd("mod_ludifica/badges", "init");',
    '$context = context_module::instance($cm->id);',
    'require_capability("mod/ludifica:view", $context);',
    '{{#each badges}}<li>{{name}}</li>{{/each}}',
    '$DB->get_record("ludifica_badge", ["userid" => $USER->id]);',
    // JS / React
    'const [state, setState] = useState(null);',
    'useEffect(() => { mount(); return () => off(); }, []);',
    'await fetch(url).then(r => r.json());',
    'document.querySelectorAll(".slide").forEach(bind);',
    'export default function App({ children }) {',
    'window.addEventListener("scroll", onScroll, { passive: true });',
    'const io = new IntersectionObserver(onEnter, { threshold: .25 });',
    'requestAnimationFrame(step);',
    // CSS
    '.grid { display: grid; gap: 1rem; }',
    'grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));',
    '@media (min-width: 1000px) {',
    'transform: translate3d(0, 0, 0);',
    'mix-blend-mode: multiply;',
    'clip-path: inset(10% 0 60% 0);',
    // SQL
    'SELECT id, name FROM mdl_user WHERE deleted = 0;',
    'INNER JOIN wp_postmeta pm ON pm.post_id = p.ID',
    'CREATE INDEX idx_course_user ON enrolments (courseid);',
    // JSON / config / shell
    '{ "seo": { "sitemap": true, "canonical": "auto" } }',
    '"scripts": { "build": "vite build" }',
    '$ git commit -m "feat: custom checkout"',
    '$ lighthouse --preset=desktop --only=performance',
    'Cache-Control: public, max-age=31536000, immutable',
  ];

  // acentos cortos: hex, hashes y algún grupo de bits suelto
  const hex = () => '0x' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
  const sha = () => Array.from({ length: 7 }, () =>
    '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
  const bits = () => Array.from({ length: 8 }, () =>
    (Math.random() < 0.5 ? '0' : '1')).join('');

  const pick = a => a[Math.floor(Math.random() * a.length)];

  const frag = document.createDocumentFragment();
  const COLS = 7;   // pocas columnas + huecos grandes = presencia sin saturación

  for (let i = 0; i < COLS; i++) {
    const col = document.createElement('div');
    col.className = 'code-col' + (i % 3 === 1 ? ' accent' : '');
    // reparto irregular a lo ancho, no una rejilla perfecta
    col.style.left = (i / COLS * 100 + Math.random() * 5).toFixed(2) + '%';

    // Cada columna: líneas de código muy separadas entre sí, con un acento
    // corto (hex / sha / bits) de vez en cuando. Los huecos grandes son lo que
    // permite subir el contraste de cada línea sin que el fondo se sature.
    const lines = [];
    for (let k = 0; k < 18; k++) {
      const r = Math.random();
      if (r < 0.72)      lines.push(pick(LINES));
      else if (r < 0.82) lines.push(hex() + '  ' + hex());
      else if (r < 0.92) lines.push('# ' + sha());
      else               lines.push(bits());          // binario: sólo ~8%
      // 8-13 líneas en blanco tras cada línea con contenido. Subir el hueco es
      // lo que baja la densidad sin perder el reparto horizontal: con 7 huecos
      // de media 1 línea de cada 8 tenía contenido (12.5%); con 10.5 de media
      // pasa a 1 de cada 11.5 (8.7%) → un 30% menos de código en pantalla.
      const gap = 8 + Math.floor(Math.random() * 6);
      for (let g = 0; g < gap; g++) lines.push('');
    }
    col.textContent = lines.join('\n');

    // cada columna con su propia duración y desfase → nunca van sincronizadas
    col.style.animationDuration = (90 + Math.random() * 140).toFixed(0) + 's';
    col.style.animationDelay = '-' + (Math.random() * 120).toFixed(0) + 's';
    frag.appendChild(col);
  }
  host.appendChild(frag);

  /* El código de fondo usa multiply sobre el crema del body, pero el hero y el
     about son oscuros: ahí multiply lo hace invisible. Se marca el body con
     .on-dark-band cuando una de esas dos bandas domina el viewport, y el CSS
     invierte el blend a screen con texto claro. */
  const bands = [document.getElementById('hero'), document.getElementById('about')].filter(Boolean);
  if (!bands.length) return;
  let bandTick = false;
  function updateBand() {
    if (DECK) {
      document.body.classList.toggle('on-dark-band', bands.some(el => el.classList.contains('is-active')));
      return;
    }
    const mid = window.innerHeight / 2;
    const onDark = bands.some(el => {
      const r = el.getBoundingClientRect();
      return r.top <= mid && r.bottom >= mid;
    });
    document.body.classList.toggle('on-dark-band', onDark);
  }
  window.addEventListener('scroll', () => {
    if (bandTick) return;
    bandTick = true;
    requestAnimationFrame(() => { bandTick = false; updateBand(); });
  }, { passive: true });
  window.addEventListener('resize', updateBand);
  document.addEventListener('deck:change', updateBand);
  updateBand();
})();

/* ===== RENDIMIENTO: pausar animaciones fuera de pantalla =====
   Marca con .anim-off el hero y cada sección cuando están lejos del viewport;
   el CSS congela ahí sus animaciones decorativas (glitch, orbes con blur, anillos,
   puntos, formas, watermark). Se reanudan ~150px antes de volver a entrar, así que
   visualmente es idéntico pero deja de gastar CPU/GPU en lo que no se ve. */
(function () {
  if (DECK) return;   // en el deck .anim-off lo pone el controlador
  if (!('IntersectionObserver' in window)) return;
  const targets = [
    document.getElementById('hero'),
    ...document.querySelectorAll('#page > section'),
  ].filter(Boolean);
  if (!targets.length) return;
  const animIO = new IntersectionObserver(entries => {
    entries.forEach(e => e.target.classList.toggle('anim-off', !e.isIntersecting));
  }, { rootMargin: '150px 0px' });
  targets.forEach(el => animIO.observe(el));
})();

/* ===== DECK: CONTROLADOR =====
   Pasos = una entrada por proyecto (o una por sección si no tiene proyectos).
   · Cambio de SECCIÓN: la diapositiva entera gira en 3D (tipo cubo, eje Y) y
     la saliente deja una estela "ghost" de copias rezagadas y translúcidas.
   · Cambio de PROYECTO dentro de la misma sección: sólo gira la columna de
     proyectos; la intro de la experiencia se queda quieta.
   Rueda / trackpad, touch y teclado avanzan; si el contenido de la diapositiva
   desborda (pantallas bajas / móvil) primero hace scroll interno y al llegar al
   borde pasa a la siguiente. Todo con transform/opacity (compositor). */
(function () {
  if (!DECK) return;
  const page = document.getElementById('page');
  const body = document.body;
  const stages = [...page.children].filter(el => el.matches('header#hero, section[id]'));
  if (!stages.length) return;
  stages.forEach(s => s.classList.add('stage'));

  const MOBILE_DECK = window.matchMedia('(max-width: 720px)');  // transición liviana en móvil
  /* MÓVIL "REELS": la tarjeta de la experiencia va en una pantalla propia (sin
     la descripción del proyecto) y cada proyecto en otra, con su descripción
     (la terminal) encima del slider. Las pantallas pasan hacia arriba. La
     estructura se decide al cargar: si se cruza el límite de ancho, se recarga */
  const REELS = MOBILE_DECK.matches;
  MOBILE_DECK.addEventListener('change', () => location.reload());
  if (REELS) {
    body.classList.add('deck-reels');
    stages.forEach(stage => {
      const intro = stage.querySelector('.col-intro .exp-projdesc');
      if (!intro) return;
      const descs = [...intro.querySelectorAll('[data-pdesc]')];
      stage.querySelectorAll('.col-projects > .project').forEach((proj, i) => {
        const d = descs.find(x => +x.dataset.pdesc === i);
        if (!d) return;
        const box = document.createElement('div');
        box.className = 'exp-projdesc';
        const stack = document.createElement('div');
        stack.className = 'exp-projdesc-stack';
        stack.appendChild(d);
        box.appendChild(stack);
        proj.prepend(box);
      });
      intro.remove();
    });
  }

  const steps = [];
  stages.forEach((stage, si) => {
    const projs = [...stage.querySelectorAll('.col-projects > .project')];
    if (projs.length) {
      if (REELS) {
        stage.classList.add('has-reels');
        steps.push({ stage, si, proj: null, pi: -1, count: projs.length, intro: true });
      }
      projs.forEach((proj, pi) => steps.push({ stage, si, proj, pi, count: projs.length }));
    } else steps.push({ stage, si, proj: null, pi: 0, count: 0 });
  });

  // color de fondo del body (oscuro, con matiz distinto por sección) + glow
  const TINT = {
    hero: '#000000', fama: '#120b1f', freelance: '#1c0d0a', bambuco: '#07160f',
    confiar: '#091224', volunteering: '#1a0a18', about: '#000000',
  };
  const GLOW = {
    hero: '#e63946', fama: '#8b5cf6', freelance: '#ff7a3d', bambuco: '#2bd47d',
    confiar: '#38a8ff', volunteering: '#ff59c8', about: '#e63946',
  };
  const LIGHT = new Set(['hero', 'about']);
  // transición al entrar/salir del hero y el about: 'iris' (círculo desde el
  // cursor) o 'wipe' (telón diagonal)
  const LIGHT_TRANSITION = 'iris';
  const IRIS_MS = 900;   // duración de la apertura del iris (máscara + halo)

  const prevBtn  = document.getElementById('deck-prev');
  const nextBtn  = document.getElementById('deck-next');
  const countEl  = document.getElementById('deck-count');
  const progress = document.querySelector('#deck-progress span');
  const topbar   = document.getElementById('topbar');
  const pad = n => String(n).padStart(2, '0');
  const reduced = () => reducedMotionQuery.matches;
  const modalOpen = () => body.classList.contains('zoom-open') || body.classList.contains('lb-open');

  let cur = -1;
  let busy = false;
  let pending = null;
  let probedMoves = 0, slowMoves = 0;   // medición de las primeras transiciones

  // en la primera / última diapositiva la flecha sólo se desactiva si ya no
  // queda contenido por recorrer (en móvil el About desborda: → y ← lo
  // desplazan hacia abajo / arriba)
  function syncArrows() {
    const st = steps[cur];
    const sc = st && st.stage.querySelector(':scope > .container');
    const canUp = !!sc && sc.scrollTop > 1;
    const canDown = !!sc && sc.scrollTop + sc.clientHeight < sc.scrollHeight - 1;
    if (prevBtn) prevBtn.disabled = cur === 0 && !canUp;
    if (nextBtn) nextBtn.disabled = cur === steps.length - 1 && !canDown;
  }
  document.addEventListener('scroll', e => {
    if (e.target && e.target.matches && e.target.matches('#page > .stage > .container')) syncArrows();
  }, { capture: true, passive: true });
  window.addEventListener('resize', () => syncArrows());
  window.addEventListener('load', () => syncArrows());
  // el contenido crece al cargar imágenes / video / fuentes: se recalcula
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(() => syncArrows());
    document.querySelectorAll('#page > .stage > .container, #page > .stage > .container > *').forEach(el => ro.observe(el));
  }

  function setTopVar() {
    if (topbar) document.documentElement.style.setProperty('--deck-top', topbar.offsetHeight + 'px');
  }
  setTopVar();
  window.addEventListener('resize', setTopVar);

  // el contenedor de "Project description" toma el alto de la descripción
  // actual (las demás son absolutas y no ocupan sitio)
  function fitDescStack(stack) {
    if (!stack) return;
    const curDesc = stack.querySelector('.proj-desc.is-current');
    stack.style.height = (curDesc ? curDesc.offsetHeight : 0) + 'px';
  }
  const refitDescs = () => document.querySelectorAll('.exp-projdesc-stack').forEach(fitDescStack);
  // la terminal se ajusta cada vez que cambia el alto del texto actual (el
  // efecto de escritura, las fuentes o el ancho): si no, podía quedar con un
  // alto viejo y mucho espacio vacío debajo del texto
  if ('ResizeObserver' in window) {
    const descRO = new ResizeObserver(entries => entries.forEach(en => {
      if (en.target.classList.contains('is-current')) fitDescStack(en.target.closest('.exp-projdesc-stack'));
    }));
    document.querySelectorAll('.exp-projdesc-stack > .proj-desc').forEach(d => descRO.observe(d));
  }
  window.addEventListener('resize', refitDescs);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refitDescs);

  /* ---------- estado (clases, UI, eventos) ---------- */
  function applyState(from, to) {
    // sin tocar la copia de la transición reels (.reel-snap)
    const q = sel => [...to.stage.querySelectorAll(sel)].filter(el => !el.closest('.reel-snap'));
    stages.forEach(s => {
      const on = s === to.stage;
      s.classList.toggle('is-active', on);
      s.classList.toggle('is-leaving', !!from && s === from.stage && from.stage !== to.stage);
      s.toggleAttribute('inert', !on);
      s.setAttribute('aria-hidden', String(!on));
      // las animaciones decorativas sólo corren en la diapositiva visible
      s.classList.toggle('anim-off', !on && !(from && s === from.stage));
    });
    // reels: pantalla de la tarjeta de la experiencia (sin proyecto actual)
    to.stage.classList.toggle('m-intro', !!to.intro);
    if (to.intro) {
      q('.site-pill[data-projs]').forEach(pl => pl.classList.remove('is-current'));
      q('.exp-note[data-show-projs]').forEach(n => n.classList.remove('is-collapsed'));
    }
    if (to.proj) {
      q('.col-projects > .project').forEach(p => {
        const on = p === to.proj;
        p.classList.toggle('is-current', on);
        p.classList.toggle('is-leaving', !!from && from.stage === to.stage && p === from.proj && !on);
        p.toggleAttribute('inert', !on);
        p.setAttribute('aria-hidden', String(!on));
      });
      q('[data-pdesc]').forEach(d => {
        d.classList.toggle('is-current', +d.dataset.pdesc === to.pi);
      });
      // enlace al sitio del proyecto que se está viendo: subrayado rojo
      q('.site-pill[data-projs]').forEach(pl => {
        pl.classList.toggle('is-current', pl.dataset.projs.split(',').includes(String(to.pi)));
      });
      // enlaces que sólo aplican a ciertos proyectos: se ocultan en los demás
      q('.site-pill[data-show-projs]').forEach(pl => {
        pl.hidden = !pl.dataset.showProjs.split(',').includes(String(to.pi));
      });
      // notas de la experiencia que sólo van con ciertos proyectos: se
      // colapsan con transición (ver .exp-note[data-show-projs] en el CSS)
      q('.exp-note[data-show-projs]').forEach(n => {
        n.classList.toggle('is-collapsed', !n.dataset.showProjs.split(',').includes(String(to.pi)));
      });
      // en el checkout el enlace de famaedu.com apunta a /apply/ (y su texto
      // dice famaedu.com/apply)
      q('.site-pill[data-alt-proj]').forEach(pl => {
        if (!pl.dataset.baseHref) {
          pl.dataset.baseHref = pl.getAttribute('href');
          pl.__baseHTML = pl.innerHTML;
        }
        const alt = String(to.pi) === pl.dataset.altProj;
        pl.setAttribute('href', alt ? pl.dataset.altHref : pl.dataset.baseHref);
        if (!pl.dataset.altLabel || alt === (pl.dataset.alt === '1')) return;
        pl.dataset.alt = alt ? '1' : '';
        if (alt) {
          const ico = pl.querySelector('.web-ico');
          pl.innerHTML = (ico ? ico.outerHTML : '') + pl.dataset.altLabel;
        } else pl.innerHTML = pl.__baseHTML;
      });
      fitDescStack(to.stage.querySelector('.exp-projdesc-stack'));
      const pager = to.stage.querySelector('.proj-pager');
      if (pager) {
        pager.querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-current', String(i === to.pi)));
        const lbl = pager.querySelector('.proj-pager-count');
        if (lbl) {
          const txt = tr('Project', 'Proyecto') + ' ' + pad(to.pi + 1) + ' / ' + pad(to.count);
          // partido en letras (imán): se cambian sólo los caracteres, sin
          // reemplazar los nodos (el largo del texto es siempre el mismo)
          const chs = lbl.querySelectorAll('.mg-ch');
          const plain = txt.replace(/\s+/g, '');
          if (chs.length === plain.length) {
            chs.forEach((c, k) => { if (c.textContent !== plain[k]) c.textContent = plain[k]; });
            lbl.setAttribute('aria-label', txt);
          } else lbl.textContent = txt;
        }
      }
    }

    const id = to.stage.id;
    body.style.setProperty('--deck-bg', TINT[id] || '#000');
    body.style.setProperty('--deck-glow', GLOW[id] || '#e63946');
    body.classList.toggle('deck-light', LIGHT.has(id));
    body.classList.toggle('deck-at-end', cur === steps.length - 1);
    setActiveNav(id);
    if (countEl) countEl.textContent = pad(cur + 1) + ' / ' + pad(steps.length);
    if (progress) progress.style.width = ((cur + 1) / steps.length * 100) + '%';
    syncArrows();
    try { history.replaceState(null, '', '#' + id); } catch (_) {}

    document.dispatchEvent(new CustomEvent('deck:change', { detail: { index: cur, step: to } }));
    syncAllSliderVideos();
    if (window.__bbNav) window.__bbNav();

    // texto que se escribe + reveal de lo que entra en pantalla
    const root = from && from.stage === to.stage ? to.proj : to.stage;
    const accept = el => {
      const p = el.closest('.col-projects > .project');
      const d = el.closest('[data-pdesc]');
      return (!p || p === to.proj) && (!d || +d.dataset.pdesc === to.pi);
    };
    if (window.__typeWithin) {
      window.__typeWithin(root, accept);
      // la descripción del proyecto vive en la columna izquierda
      const pd = to.stage.querySelector('.exp-projdesc-stack');
      if (pd && root !== to.stage) window.__typeWithin(pd, accept);
    }
    let k = 0;
    root.querySelectorAll('.reveal:not(.visible)').forEach(el => {
      if (!accept(el)) return;
      if (el.matches('.design-item, .skill-tag')) el.style.transitionDelay = (0.25 + k++ * 0.045).toFixed(3) + 's';
      el.classList.add('visible');
    });
  }

  function cleanup(from, to) {
    stages.forEach(s => {
      s.classList.remove('is-leaving', 'iris-reveal');
      s.classList.toggle('anim-off', s !== to.stage);
    });
    if (from && from.proj) from.proj.classList.remove('is-leaving');
    [from && from.stage, to.stage, from && from.proj, to.proj].forEach(el => {
      if (!el) return;
      el.getAnimations().forEach(a => a.cancel());
      el.style.zIndex = '';
    });
    body.classList.remove('deck-moving', 'scrolling');
    busy = false;
    if (pending !== null) {
      const p = pending; pending = null;
      goTo(p);
    }
  }

  /* ---------- animación 3D + estela ghost ---------- */
  const EASE = 'cubic-bezier(.77,0,.18,1)';
  const P = 'perspective(1800px) ';

  function stageFrames(dir) {
    const out = [
      { transform: P + 'translate3d(0,0,0) rotateY(0deg)', opacity: 1, offset: 0 },
      { opacity: 0.85, offset: 0.4 },
      { transform: P + 'translate3d(' + (-dir * 42) + '%,0,-520px) rotateY(' + (-dir * 38) + 'deg)', opacity: 0, offset: 1 },
    ];
    const inn = [
      { transform: P + 'translate3d(' + (dir * 42) + '%,0,-520px) rotateY(' + (dir * 38) + 'deg)', opacity: 0, offset: 0 },
      { opacity: 0.9, offset: 0.6 },
      { transform: P + 'translate3d(0,0,0) rotateY(0deg)', opacity: 1, offset: 1 },
    ];
    return { out, inn };
  }
  /* Transición de "telón" para entrar/salir de las bandas claras (hero y
     about): sin 3D. La diapositiva que entra se destapa con un barrido
     diagonal en el sentido del scroll y la que sale se hunde un poco hacia el
     lado contrario (parallax) y se oscurece. */
  function wipeFrames(dir, curtain) {
    // polígono de 4 puntos: borde de avance inclinado 20%
    const poly = (a, b, c, d) => `polygon(0% ${a}%, 100% ${b}%, 100% ${c}%, 0% ${d}%)`;
    // el borde llega más allá del final (-40/-20, 140/120) para que el
    // telón CUBRA TODO hacia el 86% del recorrido y no justo en el último frame
    const inn = dir > 0
      ? [ // entra desde abajo: el borde superior sube
          { clipPath: poly(100, 120, 100, 100), transform: 'translate3d(0,9%,0)', offset: 0 },
          { clipPath: poly(-40, -20, 100, 100), transform: 'translate3d(0,0,0)', offset: 1 },
        ]
      : [ // entra desde arriba: el borde inferior baja
          { clipPath: poly(0, 0, 0, -20),       transform: 'translate3d(0,-9%,0)', offset: 0 },
          { clipPath: poly(0, 0, 140, 120),     transform: 'translate3d(0,0,0)', offset: 1 },
        ];
    // la que sale se hunde y se apaga; cuando ya está completamente tapada
    // por el telón (≈86%) baja su opacidad a 0, así al terminar no "desaparece"
    const out = [
      { transform: 'translate3d(0,0,0) scale(1)', filter: 'brightness(1)', opacity: 1, offset: 0 },
      { opacity: 1, offset: 0.86 },
      { opacity: 0, offset: 0.9 },
      { transform: `translate3d(0,${-dir * 12}%,0) scale(0.94)`, filter: 'brightness(0.55)', opacity: 0, offset: 1 },
    ];
    // TELÓN OPACO: las diapositivas oscuras son transparentes (dejan ver el
    // fondo del body), así que el hero/about se veía A TRAVÉS de ellas y al
    // final desaparecía de golpe. Mientras dura el barrido la que entra lleva
    // un fondo sólido con el color de su sección (tapa de verdad lo que hay
    // debajo) y en el último tramo ese fondo se disuelve en el del body, que
    // ya tiene el mismo tono: la rejilla y el código reaparecen sin salto.
    if (curtain) {
      inn[0].backgroundColor = curtain;
      inn.splice(1, 0, { backgroundColor: curtain, offset: 0.9 });
      inn[2].backgroundColor = 'rgba(0,0,0,0)';
    }
    return { out, inn };
  }

  /* Transición IRIS ("portal") para las bandas claras: la diapositiva que entra
     se abre en un círculo que crece desde el cursor (o el centro) con un anillo
     rojo luminoso en su borde; la que sale hace un leve zoom-through (se
     agranda y se apaga) y, ya cubierta, baja a opacidad 0. */
  function irisFrames(curtain) {
    const w = window.innerWidth, h = window.innerHeight;
    const x = mx >= 0 && mx <= w ? mx : w / 2;
    const y = my >= 0 && my <= h ? my : h / 2;
    // BORDE DIFUMINADO: en vez de clip-path (borde duro) la diapositiva que
    // entra usa una máscara radial (.iris-reveal en CSS) cuyo radio --iris-r
    // se anima: sólida por dentro y un degradado de ~140px en el borde, así
    // una capa se funde con la otra.
    const cover = Math.hypot(Math.max(x, w - x), Math.max(y, h - y));
    // margen fijo + proporcional: al 90% del recorrido el borde SÓLIDO de la
    // máscara (radio − difuminado de hasta 140px) ya pasó la esquina más
    // lejana en cualquier tamaño de pantalla; recién ahí se oculta la saliente
    const R = cover * 1.25 + 180;
    const inn = [
      { '--iris-r': '0px', offset: 0 },
      { '--iris-r': R + 'px', offset: 1 },
    ];
    if (curtain) {
      inn[0].backgroundColor = curtain;
      inn.splice(1, 0, { backgroundColor: curtain, offset: 0.93 });
      inn[2].backgroundColor = 'rgba(0,0,0,0)';
    }
    const out = [
      { transform: 'scale(1)', filter: 'brightness(1)', opacity: 1, offset: 0 },
      { opacity: 1, offset: 0.9 },
      { opacity: 0, offset: 0.93 },
      { transform: 'scale(1.12)', filter: 'brightness(0.5)', opacity: 0, offset: 1 },
    ];
    return { out, inn, ring: { x, y, R } };
  }
  // IRIS ARCOÍRIS que acompaña el borde del círculo: un halo ancho y difuso +
  // un anillo fino brillante (conic-gradient enmascarado como aro, sin filter
  // blur → barato). El contenedor mide un 12% más que el círculo final y su
  // banda luminosa cae justo en el borde (radio/1.12 ≈ 89%), así al escalar
  // 0→1 con la misma curva que el clip, el arcoíris viaja pegado al borde.
  function irisRing(ring, dur, dark, host) {
    const el = document.createElement('div');
    el.className = 'iris-fx';
    el.innerHTML = '<span class="iris-halo"></span><span class="iris-halo iris-halo-b"></span>';
    // RENDIMIENTO / MEMORIA GPU: antes el contenedor medía el tamaño final
    // (~2900px por lado, dos capas que giran → cientos de MB en pantallas
    // retina); al repetir la transición varias convivían y la GPU se
    // saturaba. Ahora se dibuja a un tamaño acotado y llega escalando.
    const BASE = 700;
    const r = ring.R * 1.12;
    el.style.width = el.style.height = (BASE * 2) + 'px';
    el.style.left = (ring.x - BASE) + 'px';
    el.style.top  = (ring.y - BASE) + 'px';
    (host || document.body).appendChild(el);
    const timing = { duration: dur, easing: EASE, fill: 'both' };
    const anims = [
      el.animate([
        { transform: 'scale(0)', opacity: 1, offset: 0 },
        { opacity: 1, offset: 0.72 },
        { transform: `scale(${r / BASE})`, opacity: 0, offset: 1 },
      ], timing),
      // dos halos que giran a velocidades distintas (y en sentidos opuestos)
      // mientras el círculo crece: los colores se cruzan y se mezclan
      el.firstChild.animate([{ rotate: '0deg' }, { rotate: '150deg' }], timing),
      el.lastChild.animate([{ rotate: '60deg' }, { rotate: '-330deg' }], timing),
    ];
    // además del evento, un temporizador de respaldo: si la pestaña no está
    // pintando, onfinish puede no llegar y el efecto quedaría en el DOM
    const kill = () => el.remove();
    anims[0].onfinish = kill; anims[0].oncancel = kill;
    setTimeout(kill, dur + 400);
    irisWave(ring, dur, dark, host);
  }

  // OLA: una sola onda que nace en el centro poco después de que empieza la
  // apertura y se expande más despacio que la máscara (queda rezagada detrás
  // del borde). No es una banda de luz: deforma lo que tiene detrás como agua
  // (backdrop-filter: leve desenfoque + saturación, recortado en forma de aro
  // con una máscara suave) y lleva un sombreado muy tenue que le da volumen.
  function irisWave(ring, dur, dark, host) {
    const BASE = 600;                         // radio del elemento en px
    const DELAY = Math.round(dur * 0.2);      // arranca detrás de la máscara
    const WAVE_MS = 1150;                     // un poco más lenta que la máscara
    const el = document.createElement('div');
    // sobre una sección oscura la onda refracta y brilla más (efecto agua)
    el.className = 'iris-wave' + (dark ? ' on-dark' : '');
    const r = ring.R / 0.75;                  // el centro del aro cae al 75% del elemento
    el.style.width = el.style.height = (BASE * 2) + 'px';
    el.style.left = (ring.x - BASE) + 'px';
    el.style.top  = (ring.y - BASE) + 'px';
    (host || document.body).appendChild(el);
    const a = el.animate([
      { transform: 'scale(0)', opacity: 0, offset: 0 },
      { opacity: 1, offset: 0.12 },
      { opacity: 0.8, offset: 0.6 },
      { transform: `scale(${r / BASE})`, opacity: 0, offset: 1 },
    ], { duration: WAVE_MS, delay: DELAY, easing: 'cubic-bezier(.45,.15,.3,1)', fill: 'both' });
    const kill = () => el.remove();
    a.onfinish = kill; a.oncancel = kill;
    setTimeout(kill, DELAY + WAVE_MS + 400);
  }

  function projFrames(dir) {
    const out = [
      { transform: P + 'translate3d(0,0,0) rotateY(0deg)', opacity: 1, filter: 'blur(0px)' },
      { transform: P + 'translate3d(' + (-dir * 28) + '%,0,-260px) rotateY(' + (-dir * 26) + 'deg)', opacity: 0, filter: 'blur(6px)' },
    ];
    const inn = [
      { transform: P + 'translate3d(' + (dir * 28) + '%,0,-260px) rotateY(' + (dir * 26) + 'deg)', opacity: 0, filter: 'blur(6px)' },
      { transform: P + 'translate3d(0,0,0) rotateY(0deg)', opacity: 1, filter: 'blur(0px)' },
    ];
    return { out, inn };
  }

  // Copias translúcidas que siguen el mismo recorrido con retraso → estela.
  // Van DETRÁS (z-index menor) y se eliminan al terminar.
  function ghostTrail(source, contentSel, frames, timing) {
    const LAYERS = [0.34, 0.16];
    LAYERS.forEach((alpha, i) => {
      let g;
      if (contentSel) {
        // diapositiva: copia superficial (fondo, clases, id para los estilos)
        // + sólo su contenido, sin la decoración pesada (blurs, streaks)
        g = source.cloneNode(false);
        const content = source.querySelector(contentSel);
        if (content) {
          const c = content.cloneNode(true);
          g.appendChild(c);
          requestAnimationFrame(() => { c.scrollTop = content.scrollTop; });
        }
      } else {
        g = source.cloneNode(true);
      }
      g.classList.remove('is-active', 'is-current');
      g.classList.add('is-leaving', 'ghost-echo');
      g.setAttribute('aria-hidden', 'true');
      g.setAttribute('inert', '');
      g.querySelectorAll('video').forEach(v => v.remove());
      g.style.zIndex = '1';
      source.parentNode.appendChild(g);   // al final → getElementById sigue dando el original
      const a = g.animate(frames.map(f => {
        const o = Object.assign({}, f);
        if (o.opacity !== undefined) o.opacity *= alpha;
        return o;
      }), Object.assign({}, timing, { delay: (timing.delay || 0) + (i + 1) * 55, fill: 'both' }));
      const kill = () => g.remove();
      a.onfinish = kill;
      a.oncancel = kill;
      setTimeout(kill, (timing.duration || 0) + (timing.delay || 0) + (i + 1) * 55 + 400);
    });
  }

  // copia estática del contenido de la diapositiva, encima de él, para la
  // transición reels dentro de una sección (sin videos ni interacción)
  function reelSnapshot(stage) {
    const c = stage.querySelector(':scope > .container');
    const g = c.cloneNode(true);
    g.querySelectorAll('video').forEach(v => v.remove());
    g.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
    g.setAttribute('aria-hidden', 'true');
    g.setAttribute('inert', '');
    g.classList.add('reel-snap');
    Object.assign(g.style, {
      position: 'absolute', margin: '0', pointerEvents: 'none',
      top: c.offsetTop + 'px', left: c.offsetLeft + 'px',
      width: c.offsetWidth + 'px', height: c.offsetHeight + 'px',
    });
    c.after(g);
    g.scrollTop = c.scrollTop;
    return g;
  }

  function animateSwap(outEl, inEl, frames, dur, contentSel, opts) {
    const timing = { duration: dur, easing: EASE, fill: 'both' };
    outEl.style.zIndex = '2';
    inEl.style.zIndex = '3';
    if (!(opts && opts.noGhost)) ghostTrail(outEl, contentSel, frames.out, timing);
    const aOut = outEl.animate(frames.out, timing);
    const inDelay = opts && opts.inDelay !== undefined ? opts.inDelay : 40;
    const aIn  = inEl.animate(frames.inn, Object.assign({}, timing, { delay: inDelay }));
    return Promise.all([aOut.finished, aIn.finished]).catch(() => {});
  }

  /* ---------- navegación ---------- */
  // transiciones INTERRUMPIBLES: si llega otra navegación mientras una
  // animación está en curso, no se bloquea: la actual se acelera (×3) para
  // terminar enseguida y la nueva queda encadenada justo después
  function hurryCurrent() {
    document.getAnimations().forEach(a => {
      if (a instanceof CSSAnimation || a instanceof CSSTransition) return;   // sólo las del deck (WAAPI)
      if (a.updatePlaybackRate) a.updatePlaybackRate(3); else a.playbackRate = 3;
    });
  }
  // la flecha principal del sentido del avance se "presiona" (mismo aspecto
  // que su hover) mientras pasa la diapositiva, se haya usado la rueda, el
  // teclado, el tacto o la propia flecha
  let pulseT = null;
  function pulseArrow(dir) {
    const on = dir > 0 ? nextBtn : prevBtn;
    const off = dir > 0 ? prevBtn : nextBtn;
    if (off) off.classList.remove('is-pulse');
    if (!on) return;
    // si el mouse está sobre esa flecha (se hizo clic en ella), el hover ya la
    // pinta de rojo: sin destello, que la dejaba roja al sacar el mouse
    if (on.matches(':hover')) return;
    on.classList.add('is-pulse');
    clearTimeout(pulseT);
    pulseT = setTimeout(() => on.classList.remove('is-pulse'), 650);
  }
  // al sacar el mouse de una flecha, su destello se apaga en el acto
  [prevBtn, nextBtn].forEach(b => b && b.addEventListener('mouseleave', () => b.classList.remove('is-pulse')));
  /* ---------- precalentado de las transiciones ----------
     La PRIMERA vez que corre cada tipo de transición va a tirones: el
     navegador crea capas, rasteriza los degradados cónicos de los halos y
     compila los efectos (máscara del iris, backdrop-filter de la onda, 3D).
     En reposo se hace un ensayo invisible de la transición que viene
     (la de la diapositiva actual a la siguiente): los mismos elementos y
     animaciones, dentro de una capa casi transparente. Una vez por tipo. */
  const warmedFx = new Set();
  let warmStop = null;
  function warmTransition() {
    if (busy || warmStop || reduced() || isLite() || document.hidden) return;
    const from = steps[cur], to = steps[cur + 1] || steps[cur - 1];
    if (!from || !to || from.stage === to.stage) return;
    const iris = LIGHT.has(from.stage.id) || LIGHT.has(to.stage.id);
    const kind = iris ? 'iris' : '3d';
    if (warmedFx.has(kind)) return;
    warmedFx.add(kind);
    const MS = 500;
    const st = to.stage;
    const host = document.createElement('div');
    host.className = 'fx-warm';
    host.setAttribute('aria-hidden', 'true');
    body.appendChild(host);
    st.classList.add('is-warming');
    let anim;
    if (iris) {
      const curtain = LIGHT.has(st.id) ? null : (TINT[st.id] || '#000');
      const f = irisFrames(curtain);
      st.style.setProperty('--ix', f.ring.x + 'px');
      st.style.setProperty('--iy', f.ring.y + 'px');
      st.classList.add('iris-reveal');
      irisRing(f.ring, MS, !!curtain, host);
      anim = st.animate(f.inn, { duration: MS, easing: EASE });
    } else {
      // la opacidad del ensayo se multiplica para que siga invisible
      const fr = stageFrames(1).inn.map(k => Object.assign({}, k,
        k.opacity !== undefined ? { opacity: k.opacity * 0.002 } : null));
      anim = st.animate(fr, { duration: MS, easing: EASE });
    }
    let t = 0;
    warmStop = () => {
      clearTimeout(t);
      warmStop = null;
      anim.cancel();
      host.remove();
      st.classList.remove('is-warming');
      // si la diapositiva entró de verdad mientras tanto, su iris sigue
      if (!st.classList.contains('is-active') && !st.classList.contains('is-leaving')) {
        st.classList.remove('iris-reveal');
      }
    };
    anim.finished.catch(() => {}).then(() => warmStop && warmStop());
    t = setTimeout(() => warmStop && warmStop(), MS + 800);   // si no se pinta
  }
  const idleRun = fn => (window.requestIdleCallback
    ? requestIdleCallback(fn, { timeout: 1500 })
    : setTimeout(fn, 200));
  const warmSoon = ms => setTimeout(() => idleRun(warmTransition), ms);
  // la primera, apenas terminan de cargar los recursos principales (en el
  // cuadro siguiente al load, con la página ya pintada)
  const warmNow = () => requestAnimationFrame(() => requestAnimationFrame(warmTransition));
  if (document.readyState === 'complete') warmNow();
  else window.addEventListener('load', warmNow, { once: true });
  document.addEventListener('deck:change', () => warmSoon(1600));

  function goTo(i, opts) {
    i = Math.max(0, Math.min(steps.length - 1, i));
    if (warmStop) warmStop();
    if (busy) {
      if (i !== cur) { pending = i; hurryCurrent(); }
      else pending = null;
      return;
    }
    if (i === cur) return;
    const from = steps[cur];
    const to = steps[i];
    const dir = i > cur ? 1 : -1;
    // reels: dentro de la misma sección la pantalla que sale es una copia
    // (instantánea) del contenido antes del cambio; sube mientras entra la nueva
    const snap = REELS && from && from.stage === to.stage && !reduced() && !(opts && opts.instant)
      ? reelSnapshot(from.stage) : null;
    cur = i;
    applyState(from, to);
    if (from) pulseArrow(dir);

    if (!from || reduced() || (opts && opts.instant)) { cleanup(from, to); return; }

    busy = true;
    body.classList.add('deck-moving', 'scrolling');
    playSound('whoosh', 0.14);
    let done, dur;
    const lite = isLite();
    if (snap) {
      // reels: la pantalla actual sube y la siguiente entra desde abajo
      // (al revés al retroceder), pegadas como en un feed vertical
      dur = 520;
      const box = to.stage.querySelector(':scope > .container');
      const out = [
        { transform: 'translate3d(0,0,0)' },
        { transform: `translate3d(0,${-dir * 100}%,0)` },
      ];
      const inn = [
        { transform: `translate3d(0,${dir * 100}%,0)` },
        { transform: 'translate3d(0,0,0)' },
      ];
      done = animateSwap(snap, box, { out, inn }, dur, null, { noGhost: true, inDelay: 0 }).then(() => {
        snap.remove();
        box.getAnimations().forEach(a => a.cancel());
        box.style.zIndex = '';
      });
    } else if (from.stage === to.stage && MOBILE_DECK.matches) {
      // móvil: cambio de proyecto plano (sin 3D, desenfoque ni estela), un
      // deslizamiento horizontal corto con fundido
      dur = 380;
      const out = [
        { transform: 'translate3d(0,0,0)', opacity: 1 },
        { transform: `translate3d(${-dir * 14}%,0,0)`, opacity: 0 },
      ];
      const inn = [
        { transform: `translate3d(${dir * 14}%,0,0)`, opacity: 0 },
        { transform: 'translate3d(0,0,0)', opacity: 1 },
      ];
      done = animateSwap(from.proj, to.proj, { out, inn }, dur, null, { noGhost: true, inDelay: 0 });
    } else if (from.stage === to.stage) {
      dur = 520;
      const pf = projFrames(dir);
      // ligero: sin blur en el cambio de proyecto ni estela
      if (lite) [pf.out, pf.inn].forEach(fr => fr.forEach(k => delete k.filter));
      done = animateSwap(from.proj, to.proj, pf, dur, null, lite ? { noGhost: true } : null);
    } else if (MOBILE_DECK.matches) {
      // móvil (todas las secciones): el iris y el giro 3D se sentían forzados
      // en celulares. En su lugar la sección nueva entra deslizándose desde abajo
      // (desde arriba al retroceder) con el telón de su color, y la anterior
      // se aleja un poco y se desvanece. Sólo transform + opacity.
      dur = 560;
      const curtain = LIGHT.has(to.stage.id) ? null : (TINT[to.stage.id] || '#000');
      const inn = [
        { transform: `translate3d(0, ${dir * 100}%, 0)`, offset: 0 },
        { transform: 'translate3d(0, 0, 0)', offset: 1 },
      ];
      if (curtain) {
        inn[0].backgroundColor = curtain;
        inn.splice(1, 0, { backgroundColor: curtain, offset: 0.8 });
        inn[2].backgroundColor = 'rgba(0,0,0,0)';
      }
      // reels: la anterior sube completa, pegada a la que entra
      const out = REELS ? [
        { transform: 'translate3d(0, 0, 0)', offset: 0 },
        { transform: `translate3d(0, ${-dir * 100}%, 0)`, offset: 1 },
      ] : [
        { transform: 'translate3d(0, 0, 0)', opacity: 1, offset: 0 },
        { transform: `translate3d(0, ${-dir * 18}%, 0)`, opacity: 0, offset: 1 },
      ];
      done = animateSwap(from.stage, to.stage, { out, inn }, dur, null, { noGhost: true, inDelay: 0 });
    } else if (lite && (LIGHT.has(from.stage.id) || LIGHT.has(to.stage.id))) {
      // ligero: en vez del iris (máscara a pantalla completa + halos + onda)
      // un fundido con leve zoom; la que entra lleva el telón de su color
      dur = 600;
      const curtain = LIGHT.has(to.stage.id) ? null : (TINT[to.stage.id] || '#000');
      const inn = [
        { opacity: 0, transform: 'scale(1.03)', offset: 0 },
        { opacity: 1, transform: 'scale(1)', offset: 1 },
      ];
      if (curtain) {
        inn[0].backgroundColor = curtain;
        inn.splice(1, 0, { backgroundColor: curtain, offset: 0.85 });
        inn[2].backgroundColor = 'rgba(0,0,0,0)';
      }
      const out = [{ opacity: 1, offset: 0 }, { opacity: 1, offset: 0.55 }, { opacity: 0, offset: 1 }];
      done = animateSwap(from.stage, to.stage, { out, inn }, dur, null, { noGhost: true, inDelay: 0 });
    } else if (LIGHT.has(from.stage.id) || LIGHT.has(to.stage.id)) {
      // frontera con una banda clara (hero / about): telón diagonal, sin 3D
      // si entra una sección oscura, lleva telón opaco de su color
      const curtain = LIGHT.has(to.stage.id) ? null : (TINT[to.stage.id] || '#000');
      if (LIGHT_TRANSITION === 'iris') {
        const f = irisFrames(curtain);
        to.stage.style.setProperty('--ix', f.ring.x + 'px');
        to.stage.style.setProperty('--iy', f.ring.y + 'px');
        to.stage.classList.add('iris-reveal');
        irisRing(f.ring, IRIS_MS, !!curtain);
        dur = IRIS_MS;
        done = animateSwap(from.stage, to.stage, f, IRIS_MS, null, { noGhost: true, inDelay: 0 });

      } else {
        dur = 820;
        done = animateSwap(from.stage, to.stage, wipeFrames(dir, curtain), 820, null, { noGhost: true, inDelay: 0 });
      }
    } else {
      dur = 680;
      done = animateSwap(from.stage, to.stage, stageFrames(dir), dur, ':scope > .container', lite ? { noGhost: true } : null);
    }
    done.then(() => cleanup(from, to));
    // las primeras transiciones (con todos los efectos) también se miden;
    // la PRIMERA no cuenta (el navegador prepara capas por primera vez y
    // siempre da tirones); de las 4 siguientes, 3 deben ir lentas
    if (!lite && !liteDecided && probedMoves < 5) {
      if (probedMoves++ > 0) sampleFrames(Math.min(dur, 600)).then(r => {
        if (r === null || liteDecided || isLite()) return;
        if (r.slow && ++slowMoves >= 3) { liteDecided = true; setLite(true, 'transitions'); }
      });
    }
  }
  // paso relativo: si ya hay una navegación encadenada se cuenta desde ella,
  // así varios gestos seguidos avanzan varias diapositivas
  const step = dir => goTo((pending !== null ? pending : cur) + dir);
  const next = () => step(1);
  const prev = () => step(-1);
  function goToStage(id) {
    const i = steps.findIndex(s => s.stage.id === id);
    if (i >= 0) goTo(i);
  }

  // reels: si el proyecto no cabe en la pantalla (celulares bajos), el visor
  // del slider se achica lo que sobra → un toque siempre pasa de proyecto
  if (REELS) {
    const fitReel = () => {
      const s = steps[cur];
      const sm = s && s.proj && s.proj.querySelector('.slider-main');
      if (!sm) return;
      sm.style.height = '';
      sm.style.aspectRatio = '';
      const c = s.stage.querySelector(':scope > .container');
      const over = c.scrollHeight - c.clientHeight;
      if (over <= 0) return;
      const h = Math.max(140, sm.offsetHeight - over);
      sm.style.aspectRatio = 'auto';
      sm.style.height = h + 'px';
    };
    document.addEventListener('deck:change', () => requestAnimationFrame(fitReel));
    window.addEventListener('resize', fitReel);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitReel);
  }

  window.deck = {
    next, prev, goTo, goToStage,
    stageIndex: () => (steps[cur] ? steps[cur].si : 0),
    stageCount: () => stages.length,
    index: () => cur,
    count: () => steps.length,
  };

  // si la flecha pasó de imagen, la galería ya hizo su sonido (más bajo)
  // las flechas del deck avanzan como las teclas ↓ ↑: primero recorren el
  // contenido de la diapositiva si desborda y luego pasan de proyecto
  function arrowStep(dir) {
    const sc = steps[cur] && steps[cur].stage.querySelector(':scope > .container');
    if (sc && scrollerFor(sc, false, dir)) {
      // si lo que falta cabe en una pantalla, va hasta el final de una vez
      // (antes avanzaba el 80% y en móvil había que tocar dos veces)
      const left = dir > 0 ? sc.scrollHeight - sc.clientHeight - sc.scrollTop : sc.scrollTop;
      const by = left <= sc.clientHeight ? left : sc.clientHeight * 0.8;
      sc.scrollBy({ top: dir * by, behavior: reduced() ? 'auto' : 'smooth' });
      return false;
    }
    slideOrStep(dir);
    return false;
  }
  if (prevBtn) prevBtn.addEventListener('click', () => { if (!arrowStep(-1)) playSound('clic'); });
  if (nextBtn) nextBtn.addEventListener('click', () => { if (!arrowStep(1)) playSound('clic'); });

  // enlaces internos (#fama, #hero, back to top, "See my work"…) → navegan el deck
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    if (!stages.some(s => s.id === id)) return;
    e.preventDefault();
    goToStage(id);
  });

  // pager de proyectos (columna izquierda)
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('.proj-pager button[data-proj]');
    if (!b) return;
    const stage = b.closest('.stage');
    const i = steps.findIndex(s => s.stage === stage && s.pi === +b.dataset.proj);
    if (i >= 0) { goTo(i); playSound('clic'); }
  });

  /* ---------- scroll interno antes de avanzar ---------- */
  // SLACK: los contenedores de diapositiva tienen ~1.6rem de padding de
  // sobra; un desborde menor sólo come ese margen y no merece secuestrar la rueda
  const SLACK = 26;
  function scrollerFor(target, horizontal, delta) {
    let el = target && target.nodeType === 1 ? target : null;
    while (el && el !== page && el !== body) {
      const cs = getComputedStyle(el);
      if (horizontal) {
        if (/(auto|scroll)/.test(cs.overflowX) && el.scrollWidth > el.clientWidth + 1) {
          if (delta > 0 ? el.scrollLeft + el.clientWidth < el.scrollWidth - 1 : el.scrollLeft > 0) return el;
        }
      } else if (/(auto|scroll)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + SLACK) {
        if (delta > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0) return el;
      }
      el = el.parentElement;
    }
    return null;
  }

  /* ---------- rueda / trackpad ----------
     Un gesto = una diapositiva, SIEMPRE. Tras navegar se ignora todo el
     "chorro" de eventos (scroll largo, desplazamiento suave de Windows,
     inercia del trackpad) hasta que la rueda quede QUIETA un momento
     (QUIET ms sin eventos). Antes también se desbloqueaba con un "impulso
     claramente nuevo" (un evento mucho más fuerte que el anterior), pero el
     desplazamiento suave manda eventos de fuerza irregular y eso hacía pasar
     dos diapositivas en un solo scroll largo. */
  const QUIET = 260;
  let acc = 0, lastT = 0, blocked = false;
  // rueda, teclado, swipe y flechas del deck avanzan entre PROYECTOS (no
  // entre las imágenes de la galería, que se recorren con sus propias flechas
  // y miniaturas). Devuelve false: el clic de las flechas lleva su sonido
  function galOrStep(dir) {
    step(dir);
    return false;
  }
  // siempre por proyecto: las imágenes del slider se recorren sólo con sus
  // propias flechas, miniaturas o deslizando sobre él
  function slideOrStep(dir) {
    galOrStep(dir);
  }
  window.addEventListener('wheel', e => {
    if (e.ctrlKey) return;
    // zoom / galería: la rueda recorre la imagen si es más alta que la
    // pantalla; cuando ya no queda más en esa dirección, un gesto NUEVO pasa
    // a la imagen siguiente / anterior (como ↑ ↓). Mismo bloqueo por gesto.
    if (modalOpen()) {
      const nowM = performance.now();
      let dm = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (e.deltaMode === 1) dm *= 16;
      else if (e.deltaMode === 2) dm *= window.innerHeight;
      const gapM = nowM - lastT;
      lastT = nowM;
      const view = body.classList.contains('zoom-open') ? document.querySelector('#zoom .zoom-view') : null;
      const room = view && (dm > 0
        ? view.scrollTop + view.clientHeight < view.scrollHeight - 2
        : view.scrollTop > 2);
      if (room) { blocked = true; acc = 0; return; }   // scroll nativo de la imagen
      e.preventDefault();
      if (gapM > QUIET) { blocked = false; acc = 0; }
      if (blocked) return;
      acc += dm;
      if (Math.abs(acc) >= 40) {
        const dirM = acc > 0 ? 1 : -1;
        acc = 0;
        blocked = true;
        tapKey(dirM > 0 ? 'ArrowRight' : 'ArrowLeft');
      }
      return;
    }
    const now = performance.now();
    const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
    let d = horizontal ? e.deltaX : e.deltaY;
    if (e.deltaMode === 1) d *= 16;
    else if (e.deltaMode === 2) d *= window.innerHeight;
    const gap = now - lastT;
    lastT = now;

    if (scrollerFor(e.target, horizontal, d)) {   // scroll nativo del contenido
      blocked = true; acc = 0;
      return;
    }
    e.preventDefault();

    if (gap > QUIET) { blocked = false; acc = 0; }
    if (blocked) return;

    acc += d;
    if (Math.abs(acc) >= 40) {
      const dir = acc > 0 ? 1 : -1;
      acc = 0;
      blocked = true;
      slideOrStep(dir);
    }
  }, { passive: false });

  /* ---------- touch ---------- */
  let t0 = null;
  window.addEventListener('touchstart', e => {
    if (modalOpen() || e.touches.length !== 1) { t0 = null; return; }
    const t = e.touches[0];
    // el borde de scroll se evalúa al EMPEZAR el gesto: si el contenido ya
    // estaba al tope en esa dirección, el swipe navega
    t0 = { x: t.clientX, y: t.clientY, target: e.target };
  }, { passive: true });
  window.addEventListener('touchend', e => {
    if (!t0 || modalOpen()) return;
    const t = e.changedTouches[0];
    const dx = t0.x - t.clientX, dy = t0.y - t.clientY;
    const start = t0; t0 = null;
    const horizontal = Math.abs(dx) > Math.abs(dy);
    const dist = horizontal ? dx : dy;
    if (Math.abs(dist) < 60) return;
    // en horizontal no se roba el swipe a sliders/miniaturas
    if (horizontal && start.target.closest && start.target.closest('.slider, .thumbs, .design-grid')) return;
    if (scrollerFor(start.target, horizontal, dist)) return;
    slideOrStep(dist > 0 ? 1 : -1);
  }, { passive: true });

  /* ---------- teclado ---------- */
  // pulsa y suelta una tecla "virtual" (p. ej. → para pasar de imagen en el
  // zoom): el keyup va un poco después para que la tecla del instructivo se
  // vea presionar y se suelte sola (sin keyup quedaba encendida)
  function tapKey(key) {
    document.dispatchEvent(new KeyboardEvent('keydown', { key }));
    setTimeout(() => document.dispatchEvent(new KeyboardEvent('keyup', { key })), 140);
  }
  let holdKey = null, holdRaf = 0;   // recorrido continuo con ↑ ↓ en el zoom
  const stopHold = () => { holdKey = null; cancelAnimationFrame(holdRaf); };
  document.addEventListener('keyup', e => { if (e.key === holdKey) stopHold(); });
  window.addEventListener('blur', stopHold);
  document.addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    // con el zoom / la galería abiertos: ← → cambian de imagen (lo manejan
    // ellos). ↑ ↓ recorren la imagen como un scroll normal: mantenidos bajan
    // de forma CONTINUA (no a saltos); espacio / RePág / AvPág avanzan por
    // páginas. Si ya no hay más en esa dirección, una pulsación NUEVA pasa a
    // la imagen siguiente / anterior; mantener la tecla nunca cambia de imagen
    if (modalOpen()) {
      const arrow = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
      let page = 0;
      if (e.key === 'PageDown') page = 1;
      else if (e.key === 'PageUp') page = -1;
      else if (e.key === ' ') page = e.shiftKey ? -1 : 1;
      const vdir = arrow || page;
      if (!vdir) return;
      e.preventDefault();
      const fa = document.activeElement;
      if (fa && fa !== document.body && fa.blur) fa.blur();
      if (e.repeat && arrow) return;           // el recorrido continuo ya corre
      const view = body.classList.contains('zoom-open') ? document.querySelector('#zoom .zoom-view') : null;
      const room = v => view && (v > 0
        ? view.scrollTop + view.clientHeight < view.scrollHeight - 2
        : view.scrollTop > 2);
      if (!room(vdir)) {
        // sin más recorrido: una pulsación NUEVA pasa a la imagen siguiente /
        // anterior del visor (lo mismo que → / ←); mantenida no hace nada
        if (e.repeat) return;
        tapKey(vdir > 0 ? 'ArrowRight' : 'ArrowLeft');
        return;
      }
      if (page) {
        view.scrollBy({ top: page * view.clientHeight * 0.8, behavior: reduced() ? 'auto' : 'smooth' });
        return;
      }
      // recorrido continuo mientras la flecha siga presionada
      holdKey = e.key;
      const t0 = performance.now();
      let last = t0;
      cancelAnimationFrame(holdRaf);
      (function roll(now) {
        if (holdKey !== e.key || !modalOpen()) return;
        const dt = Math.min(0.05, (now - last) / 1000); last = now;
        // arranca suave y acelera hasta ~1700 px/s
        const v = Math.min(1700, 500 + (now - t0) * 1.4);
        view.scrollTop += arrow * v * dt;
        if (!room(arrow)) { holdKey = null; return; }
        holdRaf = requestAnimationFrame(roll);
      })(t0 + 16);
      return;
    }
    const tag = e.target && e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target && e.target.isContentEditable)) return;
    // flechas y espacio navegan el deck SIEMPRE, tenga el foco lo que tenga
    // (un botón, una miniatura, el visor…): se suelta ese foco para que el
    // espacio no "pulse" el botón y la navegación no dependa del clic previo
    let dir = 0;
    if (e.key === 'ArrowDown' || e.key === 'PageDown') dir = 1;
    else if (e.key === 'ArrowUp' || e.key === 'PageUp') dir = -1;
    else if (e.key === ' ') dir = e.shiftKey ? -1 : 1;
    else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') dir = e.key === 'ArrowRight' ? 1 : -1;
    else if (e.key === 'Home') { e.preventDefault(); goTo(0); return; }
    else if (e.key === 'End')  { e.preventDefault(); goTo(steps.length - 1); return; }
    else if (/^[0-9]$/.test(e.key)) {
      // números = secciones del menú (0 Home, 1 FAMA … 6 About); los
      // mayores que la última sección llevan a la última
      const links = document.querySelectorAll('nav ul a[href^="#"]');
      const link = links[Math.min(+e.key, links.length - 1)];
      if (!link) return;
      e.preventDefault();
      goToStage(link.getAttribute('href').slice(1));
      return;
    }
    if (!dir) return;
    e.preventDefault();
    const fa = document.activeElement;
    if (fa && fa !== document.body && fa.blur) fa.blur();
    // si la diapositiva desborda, primero recorre su contenido (sólo vertical)
    const vertical = e.key !== 'ArrowRight' && e.key !== 'ArrowLeft';
    const sc = steps[cur] && steps[cur].stage.querySelector(':scope > .container');
    if (vertical && sc && scrollerFor(sc, false, dir)) {
      sc.scrollBy({ top: dir * sc.clientHeight * 0.8, behavior: reduced() ? 'auto' : 'smooth' });
      return;
    }
    slideOrStep(dir);
  });

  /* ---------- arranque ---------- */
  const startId = decodeURIComponent((location.hash || '').slice(1));
  let start = steps.findIndex(s => s.stage.id === startId);
  if (start < 0) start = 0;
  goTo(start, { instant: true });
  body.classList.remove('deck-boot');   // ya hay diapositiva activa
})();

/* ===== PISTA DE TECLADO EN PIXEL ART (hero) =====
   Cada keycap es un SVG de 12×13 "píxeles" (shape-rendering crispEdges):
   contorno, cara, sombra inferior (relieve) y la flecha. Al presionar una
   flecha real la tecla correspondiente se hunde y se ilumina. */
(function () {
  const hint = document.querySelector('.kbd-hint');
  if (!hint) return;
  const CAP = [
    '..oooooooo..',
    '.offffffffo.',
    'offffffffffo',
    'offffffffffo',
    'offffffffffo',
    'offffffffffo',
    'offffffffffo',
    'offffffffffo',
    'offffffffffo',
    'offffffffffo',
    'ossssssssssо'.replace('о', 'o'),
    '.ossssssssо.'.replace('о', 'o'),
    '..oooooooo..',
  ];
  const ARROWS = {
    ArrowRight: [[3,4],[4,4],[4,5],[5,4],[5,5],[5,6],[6,4],[6,5],[7,4]],
    ArrowLeft:  [[3,7],[4,6],[4,7],[5,5],[5,6],[5,7],[6,6],[6,7],[7,7]],
    ArrowUp:    [[4,5],[4,6],[5,4],[5,5],[5,6],[5,7],[6,3],[6,4],[6,5],[6,6],[6,7],[6,8]],
    ArrowDown:  [[4,3],[4,4],[4,5],[4,6],[4,7],[4,8],[5,4],[5,5],[5,6],[5,7],[6,5],[6,6]],
    // números de la pista del hero ("Press 0–6"), en pixel font de 4×5
    0: [[3,5],[3,6],[4,4],[4,7],[5,4],[5,7],[6,4],[6,7],[7,5],[7,6]],
    6: [[3,5],[3,6],[4,4],[5,4],[5,5],[5,6],[6,4],[6,7],[7,5],[7,6]],
  };
  const cls = { o: 'po', f: 'pf', s: 'ps' };
  function capSVG(key) {
    let rects = '';
    CAP.forEach((row, y) => {
      [...row].forEach((c, x) => {
        if (cls[c]) rects += `<rect class="${cls[c]}" x="${x}" y="${y}" width="1" height="1"/>`;
      });
    });
    (ARROWS[key] || []).forEach(([y, x]) => {
      rects += `<rect class="pa" x="${x}" y="${y}" width="1" height="1"/>`;
    });
    return `<svg viewBox="0 0 12 13" shape-rendering="crispEdges">${rects}</svg>`;
  }
  // barra espaciadora: tecla ancha (38×13 píxeles, mismo tamaño de píxel y
  // alto que las flechas; va a la izquierda de ◄ ▼ ►) con el símbolo ␣ en el centro
  function spaceSVG() {
    const W = 38, H = 13;
    let rects = '';
    const put = (c, x, y) => { rects += `<rect class="${c}" x="${x}" y="${y}" width="1" height="1"/>`; };
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const edgeX = x === 0 || x === W - 1, edgeY = y === 0 || y === H - 1;
        // esquinas en escalón de 2 píxeles (como las flechas)
        if ((y === 0 || y === H - 1) && (x < 2 || x > W - 3)) continue;
        if ((y === 1 || y === H - 2) && (x === 0 || x === W - 1)) { continue; }
        const nearCorner = (y === 1 || y === H - 2) && (x === 1 || x === W - 2);
        if (edgeX || edgeY || nearCorner) put('po', x, y);
        else put(y >= H - 3 ? 'ps' : 'pf', x, y);
      }
    }
    // ␣: línea con dos topes
    for (let x = 14; x <= 23; x++) put('pa', x, 6);
    put('pa', 14, 5); put('pa', 23, 5);
    return `<svg viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">${rects}</svg>`;
  }
  // táctil: el instructivo de mouse/teclado sobra → se oculta al primer toque
  window.addEventListener('touchstart', () => document.body.classList.add('touch-ui'),
    { once: true, passive: true });
  const caps = {};
  hint.querySelectorAll('.kc').forEach(k => {
    k.innerHTML = k.dataset.key === ' ' ? spaceSVG() : capSVG(k.dataset.key);
    caps[k.dataset.key] = k;
  });
  // teclas 0 y 6 del texto del hero: mismo dibujo; se hunden al presionarlas
  const numCaps = {};
  document.querySelectorAll('.kcap[data-key]').forEach(k => {
    k.innerHTML = capSVG(k.dataset.key);
    numCaps[k.dataset.key] = k;
  });
  document.addEventListener('keydown', e => { if (numCaps[e.key]) numCaps[e.key].classList.add('is-down'); });
  document.addEventListener('keyup', e => { if (numCaps[e.key]) numCaps[e.key].classList.remove('is-down'); });

  document.addEventListener('keydown', e => {
    const k = caps[e.key];
    if (!k) return;
    k.classList.add('is-down');
    hint.classList.add('used');           // detiene la demo automática
  });
  document.addEventListener('keyup', e => {
    const k = caps[e.key];
    if (k) k.classList.remove('is-down');
  });
  // si la ventana pierde el foco con una tecla presionada, su keyup no llega
  window.addEventListener('blur', () => {
    Object.values(caps).forEach(k => k.classList.remove('is-down'));
  });

  // MOUSE con ruedita (9×13 píxeles): cuerpo con botones y la rueda (grupo
  // aparte, la anima el CSS). Al girar la rueda real se ilumina.
  // L / R = cara de los botones izquierdo y derecho (se pintan al hacer clic)
  const MOUSE = [
    '..ooooo..',
    '.oLLoRRo.',
    'oLLLoRRRo',
    'oLLLoRRRo',
    'oLLLoRRRo',
    'ooooooooo',
    'offfffffo',
    'offfffffo',
    'offfffffo',
    'offfffffo',
    'offfffffo',
    '.offfffo.',
    '..ooooo..',
  ];
  const mouse = hint.querySelector('.kbd-mouse');
  if (mouse) {
    let rects = '';
    const mcls = Object.assign({ L: 'pf pl', R: 'pf pr' }, cls);
    MOUSE.forEach((row, y) => [...row].forEach((c, x) => {
      if (mcls[c]) rects += `<rect class="${mcls[c]}" x="${x}" y="${y}" width="1" height="1"/>`;
    }));
    const wheel = '<g class="pw"><rect x="4" y="1" width="1" height="2"/></g>';
    mouse.innerHTML = `<svg viewBox="0 0 9 13" shape-rendering="crispEdges">${rects}${wheel}</svg>`;
    let wt;
    window.addEventListener('wheel', () => {
      mouse.classList.add('is-scrolling');
      clearTimeout(wt);
      wt = setTimeout(() => mouse.classList.remove('is-scrolling'), 450);
    }, { passive: true });
    // clic izquierdo / derecho → se pinta de rojo el botón correspondiente
    const BTN = { 0: 'btn-l', 2: 'btn-r' };
    window.addEventListener('mousedown', e => {
      if (BTN[e.button]) mouse.classList.add(BTN[e.button]);
    }, { passive: true });
    window.addEventListener('mouseup', e => {
      if (BTN[e.button]) mouse.classList.remove(BTN[e.button]);
    }, { passive: true });
    // el menú contextual puede "tragarse" el mouseup del clic derecho
    window.addEventListener('contextmenu', () => {
      setTimeout(() => mouse.classList.remove('btn-r'), 250);
    });
    window.addEventListener('blur', () => mouse.classList.remove('btn-l', 'btn-r'));
  }
})();

/* ===== MENÚ MAGNÉTICO POR LETRA =====
   El texto de cada enlace del topbar se divide en letras (<span class="mg-ch">)
   y CADA LETRA reacciona a la cercanía del cursor: se desplaza un poco hacia
   él (el eje horizontal más contenido) y se aclara según la distancia
   (--p 0→1), así el efecto ondula a lo largo de la palabra. Las posiciones base se cachean con offsetLeft/Top
   (ignoran transform) y se recalculan al redimensionar. Sólo con mouse.
   La transición lenta del movimiento la pone el CSS. */
(function () {
  const links = [...document.querySelectorAll('#topbar ul a')];
  if (!links.length || !CAN_HOVER) return;

  // dividir en letras sin romper el markup (el número .micro también)
  const chars = [];
  links.forEach(a => {
    a.setAttribute('aria-label', a.textContent.replace(/\s+/g, ' ').trim());
    const walk = document.createTreeWalker(a, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let n;
    while ((n = walk.nextNode())) if (n.nodeValue.trim()) nodes.push(n);
    nodes.forEach(node => {
      const frag = document.createDocumentFragment();
      [...node.nodeValue].forEach(ch => {
        if (ch.trim() === '') { frag.appendChild(document.createTextNode(ch)); return; }
        const sp = document.createElement('span');
        sp.className = 'mg-ch';
        sp.setAttribute('aria-hidden', 'true');
        sp.textContent = ch;
        frag.appendChild(sp);
        chars.push({ el: sp, link: a, x: 0, y: 0 });
      });
      // el enlace es flex con gap: si las letras quedaran como hijos directos,
      // cada una recibiría el gap (el espaciado se disparaba) → se agrupan en
      // un único span de palabra
      if (node.parentNode === a) {
        const word = document.createElement('span');
        word.className = 'mg-word';
        word.appendChild(frag);
        node.parentNode.replaceChild(word, node);
        return;
      }
      node.parentNode.replaceChild(frag, node);
    });
  });

  // centro base de cada letra (sin transform) en coords de viewport
  function measure() {
    links.forEach(a => { a.__r = a.getBoundingClientRect(); });
    chars.forEach(c => {
      let x = c.el.offsetLeft, y = c.el.offsetTop, p = c.el.offsetParent;
      while (p && p !== c.link) { x += p.offsetLeft; y += p.offsetTop; p = p.offsetParent; }
      c.x = c.link.__r.left + x + c.el.offsetWidth / 2;
      c.y = c.link.__r.top + y + c.el.offsetHeight / 2;
    });
  }
  measure();
  window.addEventListener('resize', () => setTimeout(measure, 150));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

  const RADIUS = 80, PULL = 0.3;
  let px = -1e4, py = -1e4, raf = null;
  function update() {
    raf = null;
    const still = reducedMotionQuery.matches;
    chars.forEach(c => {
      const dx = px - c.x, dy = py - c.y;
      const d = Math.hypot(dx, dy);
      const p = d >= RADIUS ? 0 : 1 - d / RADIUS;
      c.el.style.setProperty('--p', p.toFixed(3));
      // en ambos ejes, con el horizontal más contenido para que los huecos
      // entre letras apenas varíen
      c.el.style.setProperty('--cx', still ? '0px' : (dx * PULL * p * 0.55).toFixed(1) + 'px');
      c.el.style.setProperty('--cy', still ? '0px' : (dy * PULL * p * 0.6).toFixed(1) + 'px');
    });
  }
  const queue = () => { if (!raf) raf = requestAnimationFrame(update); };
  window.addEventListener('mousemove', e => { px = e.clientX; py = e.clientY; queue(); }, { passive: true });
  document.addEventListener('mouseleave', () => { px = py = -1e4; queue(); });
})();

/* ===== IMÁN POR LETRA EN TÍTULOS Y BOTONES =====
   Mismo efecto que el menú, para los textos marcados con .mag (ver
   splitLetters arriba). Para que no pese:
   · sólo se procesan los grupos de la diapositiva visible (y del proyecto
     actual), y sólo los que tienen el cursor cerca (rect + radio)
   · no se calcula durante las transiciones del deck
   · las posiciones base se miden cada ~0.6s (o al cambiar de diapositiva /
     hacer scroll interno), no en cada movimiento: centro de la letra =
     rect de su palabra (sin transform) + offset de la letra en la palabra */
(function () {
  const makeGroup = el => ({
    el,
    stage: el.closest('#page > .stage'),
    proj: el.closest('.col-projects > .project'),
    words: [...el.querySelectorAll('.mg-word')].map(w => ({ el: w, chars: [...w.querySelectorAll('.mg-ch')].map(c => ({ el: c, x: 0, y: 0, lx: 0, ly: 0 })) })),
    rect: null,
    hot: false,
  });
  const groups = [...document.querySelectorAll('.mag')].map(makeGroup);
  // textos que se dividen más tarde (nombre y rol del hero, tras escribirse)
  window.__magAdd = el => { groups.push(makeGroup(el)); stale = true; };
  const RADIUS = 100, PX = 0.16, PY = 0.2;
  let px = -1e4, py = -1e4, raf = null, lastMeasure = 0, stale = true;
  const body = document.body;

  const live = g => (!g.stage || g.stage.classList.contains('is-active')) &&
                    (!g.proj || g.proj.classList.contains('is-current'));

  // MEDICIÓN PEREZOSA (hay párrafos enteros con imán):
  // · cada ~0.6 s sólo el rect de cada grupo visible (1 lectura por grupo)
  // · las posiciones de palabras y letras, sólo del grupo que tiene el
  //   cursor cerca, y se reutilizan hasta la próxima medición general
  function measure() {
    groups.forEach(g => {
      g.rect = live(g) ? g.el.getBoundingClientRect() : null;
      g.cm = false;
    });
    lastMeasure = performance.now();
    stale = false;
  }
  function measureChars(g) {
    g.words.forEach(w => {
      const wr = w.el.getBoundingClientRect();
      w.l = wr.left; w.t = wr.top; w.r = wr.right; w.b = wr.bottom;
      w.chars.forEach(c => {
        c.x = wr.left + c.el.offsetLeft + c.el.offsetWidth / 2;
        c.y = wr.top + c.el.offsetTop + c.el.offsetHeight / 2;
      });
    });
    g.cm = true;
  }
  function setChar(c, x, y) {
    if (Math.abs(c.lx - x) < 0.3 && Math.abs(c.ly - y) < 0.3) return;
    c.lx = x; c.ly = y;
    c.el.style.setProperty('--cx', x.toFixed(1) + 'px');
    c.el.style.setProperty('--cy', y.toFixed(1) + 'px');
  }
  // devuelve a su sitio sólo las palabras que estaban desplazadas
  function coolWord(w) {
    if (!w.hot) return;
    w.hot = false;
    w.chars.forEach(c => setChar(c, 0, 0));
  }
  function cool(g) {
    if (!g.hot) return;
    g.hot = false;
    g.words.forEach(coolWord);
  }
  function update() {
    raf = null;
    if (reducedMotionQuery.matches || body.classList.contains('deck-moving') ||
        body.classList.contains('zoom-open') || body.classList.contains('lb-open')) {
      groups.forEach(cool); stale = true; return;
    }
    if (stale || performance.now() - lastMeasure > 600) measure();
    groups.forEach(g => {
      const r = g.rect;
      if (!r || px < r.left - RADIUS || px > r.right + RADIUS || py < r.top - RADIUS || py > r.bottom + RADIUS) {
        cool(g); return;
      }
      if (!g.cm) measureChars(g);
      g.hot = true;
      g.words.forEach(w => {
        // palabra fuera del radio: no se calcula letra por letra
        if (px < w.l - RADIUS || px > w.r + RADIUS || py < w.t - RADIUS || py > w.b + RADIUS) {
          coolWord(w); return;
        }
        w.hot = true;
        w.chars.forEach(c => {
          const dx = px - c.x, dy = py - c.y;
          const d = Math.hypot(dx, dy);
          const p = d >= RADIUS ? 0 : 1 - d / RADIUS;
          setChar(c, dx * PX * p, dy * PY * p);
        });
      });
    });
  }
  const queue = () => { if (!raf) raf = requestAnimationFrame(update); };
  window.addEventListener('mousemove', e => { px = e.clientX; py = e.clientY; queue(); }, { passive: true });
  document.addEventListener('mouseleave', () => { px = py = -1e4; queue(); });
  document.addEventListener('deck:change', () => { stale = true; groups.forEach(cool); });
  window.addEventListener('resize', () => { stale = true; });
  window.addEventListener('scroll', () => { stale = true; }, { passive: true, capture: true });
})();

/* ===== FLECHAS EN PIXEL ART (deck + visores de proyecto) =====
   Reemplaza el SVG vectorial de las flechas principales y de los visores por un chevron
   dibujado píxel a píxel (6×9, crispEdges). La flecha "anterior" lo rota por
   CSS como antes. */
(function () {
  const CHEVRON = [
    'o.....',
    'oo....',
    '.oo...',
    '..oo..',
    '...oo.',
    '..oo..',
    '.oo...',
    'oo....',
    'o.....',
  ];
  let rects = '';
  CHEVRON.forEach((row, y) => [...row].forEach((c, x) => {
    if (c === 'o') rects += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
  }));
  const svg = `<svg viewBox="0 0 6 9" shape-rendering="crispEdges" aria-hidden="true" focusable="false">${rects}</svg>`;
  ['deck-prev', 'deck-next'].forEach(id => {
    const b = document.getElementById(id);
    if (b) b.innerHTML = svg;
  });
  // también las flechas de los visores de proyecto
  document.querySelectorAll('.nav-btn').forEach(b => { b.innerHTML = svg; });
})();

/* ===== COHETE PIXEL ART DE LAS BARRAS DE PROGRESO =====
   Reemplaza el emoji 🚀 por un sprite de 16×9 "píxeles" (SVG con
   crispEdges) mirando a la derecha, con una llama de dos cuadros que
   parpadea (CSS) y chispas que quedan atrás. La estela es la propia barra. */
(function () {
  const ROCKET = [
    '..ooo...........',
    '..orroooooooo...',
    '...owwwwwwwwroo.',
    '...owwwbbwwwrro.',
    '...owwbbbbwwrrro',
    '...owwwbbwwwrro.',
    '...owwwwwwwwroo.',
    '..orroooooooo...',
    '..ooo...........',
  ];
  // llama: dos cuadros (x, y, clase) que se alternan
  const FLAME_A = [[2,3,'fy'],[2,4,'fw'],[1,4,'fy'],[0,4,'fo'],[2,5,'fy'],[1,3,'fo'],[1,5,'fo']];
  const FLAME_B = [[2,3,'fo'],[2,4,'fy'],[1,4,'fo'],[2,5,'fo']];
  const cls = { o: 'ro', w: 'rw', b: 'rb', r: 'rr' };
  let body = '';
  ROCKET.forEach((row, y) => [...row].forEach((c, x) => {
    if (cls[c]) body += `<rect class="${cls[c]}" x="${x}" y="${y}" width="1" height="1"/>`;
  }));
  const flame = (pts, k) => `<g class="${k}">` +
    pts.map(([x, y, c]) => `<rect class="${c}" x="${x}" y="${y}" width="1" height="1"/>`).join('') + '</g>';
  const svg = `<svg viewBox="0 0 16 9" shape-rendering="crispEdges" aria-hidden="true">${body}${flame(FLAME_A, 'fa')}${flame(FLAME_B, 'fb')}</svg>`;
  document.querySelectorAll('.progress-fill > span').forEach(s => {
    s.classList.add('px-rocket');
    s.setAttribute('aria-hidden', 'true');
    s.innerHTML = svg + '<i class="px-sparks"></i>';
  });
})();

/* ===== OVNI PIXEL ART DE LA BARRA DE PROGRESO GENERAL =====
   Sprite de 18×8 "píxeles" (cúpula de cristal, casco plateado y luces que se
   encienden en cadena) + un rayo tractor tenue debajo. Va al final de la
   barra y la recorre al avanzar por el sitio. */
(function () {
  const bar = document.querySelector('#deck-progress span');
  if (!bar) return;
  const UFO = [
    '......oooooo......',
    '.....obbbbbbo.....',
    '.....obwbbbbo.....',
    '..oooooooooooooo..',
    '.osssssssssssssso.',
    'o' + 'sL'.repeat(8) + 'o',
    '.osssssssssssssso.',
    '..oooooooooooooo..',
  ];
  let rects = '', li = 0;
  UFO.forEach((row, y) => [...row].forEach((c, x) => {
    if (c === '.') return;
    const k = c === 'L' ? 'ul' + (li++ % 3) : { o: 'uo', b: 'ub', w: 'uw', s: 'us' }[c];
    rects += `<rect class="${k}" x="${x}" y="${y}" width="1" height="1"/>`;
  }));
  // rayo tractor: trapecio escalonado que se abre hacia abajo
  let beam = '';
  for (let r = 0; r < 5; r++) {
    const w = 6 + r * 2, x0 = 9 - w / 2;
    beam += `<rect class="bm" x="${x0}" y="${8 + r}" width="${w}" height="1" opacity="${(0.55 - r * 0.09).toFixed(2)}"/>`;
  }
  const ufo = document.createElement('i');
  ufo.className = 'px-ufo';
  ufo.innerHTML = `<svg viewBox="0 0 18 13" shape-rendering="crispEdges" aria-hidden="true"><g class="ufo-beam">${beam}</g><g class="ufo-body">${rects}</g></svg>`;
  bar.appendChild(ufo);

  // ARRASTRAR EL OVNI: la estela sigue al dedo / mouse por la barra y al
  // soltarlo el deck salta a la diapositiva de esa posición
  const track = bar.parentElement;
  let drag = null;
  const pos = e => {
    const r = track.getBoundingClientRect();
    return Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
  };
  ufo.addEventListener('pointerdown', e => {
    if (!window.deck || !window.deck.count || e.button > 0) return;
    e.preventDefault();
    ufo.setPointerCapture(e.pointerId);
    // el ovni no salta bajo el dedo: se conserva la distancia al punto tomado
    drag = { off: parseFloat(bar.style.width || 0) / 100 - pos(e), i: window.deck.index() };
    document.body.classList.add('ufo-dragging');
  });
  ufo.addEventListener('pointermove', e => {
    if (!drag) return;
    const f = Math.min(1, Math.max(0, pos(e) + drag.off));
    const n = window.deck.count();
    bar.style.width = (f * 100) + '%';
    drag.i = Math.max(0, Math.ceil(f * n) - 1);
  });
  const drop = () => {
    if (!drag) return;
    const i = drag.i;
    drag = null;
    document.body.classList.remove('ufo-dragging');
    const n = window.deck.count();
    // la estela vuelve al largo exacto de la diapositiva elegida
    bar.style.width = ((i + 1) / n * 100) + '%';
    if (i !== window.deck.index()) window.deck.goTo(i);
  };
  ufo.addEventListener('pointerup', drop);
  ufo.addEventListener('pointercancel', drop);
})();

/* ---------- precalentado del deck ----------
   La primera transición iba lenta: las diapositivas ocultas nunca se habían
   pintado (imágenes sin decodificar, capas y texto sin rasterizar), así que
   todo ese trabajo caía justo en medio de la animación. En reposo se
   decodifican sus imágenes y se pinta cada una UNA vez, casi transparente.
   Sólo las VECINAS de la diapositiva actual (la anterior y la siguiente):
   antes se descargaba todo el sitio al cargar; ahora se va preparando lo
   que viene a medida que se avanza. */
(function warmDeck() {
  if (!document.body.classList.contains('deck')) return;
  const stages = [...document.querySelectorAll('#page > .stage')];
  const idle = cb => (window.requestIdleCallback
    ? requestIdleCallback(cb, { timeout: 600 })
    : setTimeout(cb, 60));
  // con tope de tiempo: con la pestaña oculta rAF no corre
  const twoFrames = () => new Promise(r => { requestAnimationFrame(() => requestAnimationFrame(r)); setTimeout(r, 120); });

  async function warm(stage) {
    if (stage.classList.contains('is-active') || stage.classList.contains('is-leaving')) return;
    loadImgs(stage);
    const imgs = [...stage.querySelectorAll('img')];
    imgs.forEach(img => { if (img.loading === 'lazy') img.loading = 'eager'; });
    // con tope: decode() puede quedarse esperando si la página no se renderiza
    await Promise.race([
      Promise.all(imgs.map(img => (img.decode ? img.decode().catch(() => {}) : null))),
      new Promise(r => setTimeout(r, 1500)),
    ]);
    // si mientras tanto el deck se movió, se espera a que termine
    while (document.body.classList.contains('deck-moving')) await new Promise(r => setTimeout(r, 300));
    stage.classList.add('is-warming');
    await twoFrames();
    stage.classList.remove('is-warming');
  }

  const warmed = new Set();
  let running = false, again = false;
  async function run() {
    if (running) { again = true; return; }
    running = true;
    do {
      again = false;
      const i = stages.findIndex(s => s.classList.contains('is-active'));
      const next = [stages[i + 1], stages[i - 1]].filter(s => s && !warmed.has(s));
      if (next.length) document.body.classList.add('deck-warming');
      for (const s of next) {
        if (document.hidden) await new Promise(r => document.addEventListener('visibilitychange', r, { once: true }));
        await new Promise(r => idle(r));
        await warm(s);
        warmed.add(s);
      }
    } while (again);
    document.body.classList.remove('deck-warming');
    running = false;
  }
  const start = () => {
    setTimeout(run, 400);
    // al cambiar de diapositiva, se preparan sus nuevas vecinas
    document.addEventListener('deck:change', () => setTimeout(run, 900));
  };
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
})();

/* instructivo: el texto "Scroll or press to navigate" se ve fijo en el hero
   (y al pasar el mouse por los iconos en el resto del sitio) */
document.addEventListener('deck:change', e => {
  const st = e.detail && e.detail.step && e.detail.step.stage;
  document.body.classList.toggle('at-hero', !!st && st.id === 'hero');
});
// la primera diapositiva se activa antes de que exista este listener
(function () {
  const a = document.querySelector('#page > .stage.is-active');
  document.body.classList.toggle('at-hero', !a || a.id === 'hero');
})();

/* ===== FONDO FLUIDO DEL HERO (WebGL, "mancha de aceite") =====
   Reemplaza a las franjas de degradado (.hero-streak): un shader con ruido
   fractal y deformación del dominio (el ruido se deforma con ruido) da un
   flujo orgánico; el color sale de una paleta iridiscente tipo película fina
   (bandas de arcoíris como el aceite sobre agua), mezclada hacia blanco para
   que sea suave. El mouse lo remueve con un remolino local.
   OPTIMIZACIÓN:
   · se dibuja a ~30% de la resolución (máx. ~170k píxeles) y el navegador lo
     escala suavizado: el patrón es difuso, no se nota
   · tope de 30 fps
   · sólo corre con el hero visible: se pausa fuera del hero, con la pestaña
     oculta y en modo lite / movimiento reducido (ahí queda un cuadro fijo)
   · contexto sin antialias, sin profundidad y en "low-power"
   · sin WebGL → se quedan las franjas CSS de antes */
function initFluid(hero) {
  if (!hero || !document.body.classList.contains('deck')) return;
  const cv = document.createElement('canvas');
  cv.className = 'hero-fluid';
  cv.setAttribute('aria-hidden', 'true');
  const gl = cv.getContext('webgl', {
    alpha: false, antialias: false, depth: false, stencil: false,
    premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: 'low-power',
  });
  if (!gl) return;

  const VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  const FS = `
precision mediump float;
uniform vec2 u_res;
uniform float u_t;
uniform vec2 u_m;      // mouse suavizado (0..1, origen abajo-izq)
uniform float u_e;     // energía del mouse (sube al moverlo, decae sola)
uniform sampler2D u_f; // campo de deformación que deja el mouse (persiste unos segundos)
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), u.x),
             mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0., a = .5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = m * p; a *= .5; }
  return v;
}
void main(){
  float asp = u_res.x / u_res.y;
  // el efecto del mouse se calcula en espacio de PANTALLA (proporción real,
  // igual en horizontal y vertical) y después se estira el patrón: si se
  // hacía en el espacio estirado, el remolino salía ovalado y el movimiento
  // horizontal se sentía a saltos
  vec2 uv = gl_FragCoord.xy / u_res; uv.x *= asp;
  vec2 mu = u_m; mu.x *= asp;
  vec2 d = uv - mu;
  float fall = exp(-dot(d, d) * 3.5);
  float ang = fall * u_e * 0.55;
  float c = cos(ang), s = sin(ang);
  uv = mu + mat2(c, -s, s, c) * d - d * fall * u_e * 0.3;
  // ondita que se abre desde el cursor mientras se mueve
  float dl = length(d) + 1e-4;
  uv += d / dl * sin(dl * 22. - u_t * 5.) * 0.03 * u_e * exp(-dl * dl * 2.1);
  // REMOVER EL ACEITE: el mouse va dejando un campo de desplazamiento que
  // persiste unos segundos (se suaviza y se disuelve despacio) → los colores
  // se arrastran detrás del cursor y la composición cambia de verdad
  uv -= (texture2D(u_f, gl_FragCoord.xy / u_res).rg - 0.5) * 0.5;
  // escala grande y estirada en vertical: vetas anchas y largas que fluyen
  // como una película de aceite sobre agua (no remolinos apretados)
  vec2 p = uv * vec2(0.8, 0.5);
  float t = u_t * 0.018;
  // OLAS: ondas que viajan y doblan las vetas (dos trenes cruzados)
  float wt = u_t * 0.3;
  p += vec2(sin(p.y * 5.5 + wt) * 0.085 + sin(p.y * 2.3 - wt * 0.6) * 0.11,
            sin(p.x * 3.8 - wt * 0.8) * 0.065);
  vec2 q = vec2(fbm(p + vec2(0., t)), fbm(p + vec2(5.2, 1.3) - t * 0.8));
  vec2 r = vec2(fbm(p + 2.4 * q + vec2(1.7, 9.2) + t * 0.9),
                fbm(p + 2.4 * q + vec2(8.3, 2.8) - t * 0.7));
  float f = fbm(p + 2.2 * r);
  // bandas iridiscentes anchas (película fina); fase lenta
  float band = f * 3.0 + r.x * 1.25 + p.x * 0.35 + t * 0.5;
  // arcoíris completo (rueda de tono entera, rosado y morado incluidos) con
  // muchas bandas en pantalla para que ningún color predomine; el tono pasa
  // un poco más rápido por los verdes (en la rueda ocupan más) para
  // equilibrar
  float u = fract(band * 0.9 + p.x * 0.8 + p.y * 1.3);
  float h = fract(u + 0.35 / 6.2831 * sin(6.2831 * (u - 0.33)));
  vec3 col = clamp(abs(mod(h * 6. + vec3(0., 4., 2.), 6.) - 3.) - 1., 0., 1.);
  col = mix(vec3(1.), col, 0.88);   // saturación algo contenida (armonía)
  // color casi en todo el hero (bandas anchas), con zonas algo más suaves
  float k = 0.45 + 0.55 * smoothstep(0.3, 0.8, f + 0.3 * length(q));
  gl_FragColor = vec4(mix(vec3(1.), col, 0.23 * k), 1.);
}`;
  function sh(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  }
  const vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) return;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aLoc = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(aLoc);
  gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0);
  const uRes = gl.getUniformLocation(prog, 'u_res');
  const uT = gl.getUniformLocation(prog, 'u_t');
  const uM = gl.getUniformLocation(prog, 'u_m');
  const uE = gl.getUniformLocation(prog, 'u_e');
  // campo de deformación: rejilla pequeña calculada en JS y subida como
  // textura (filtrado lineal → se ve continuo)
  const GW = 64;
  let GH = 36, fx, fy, fbuf, fpix;
  const tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(gl.getUniformLocation(prog, 'u_f'), 0);
  function allocField(asp) {
    GH = Math.max(16, Math.round(GW / Math.max(0.5, asp)));
    fx = new Float32Array(GW * GH); fy = new Float32Array(GW * GH);
    fbuf = new Float32Array(GW * GH);
    fpix = new Uint8Array(GW * GH * 4).fill(128);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, GW, GH, 0, gl.RGBA, gl.UNSIGNED_BYTE, fpix);
  }
  allocField((hero.clientWidth || 16) / (hero.clientHeight || 9));

  hero.insertBefore(cv, hero.firstChild);
  hero.classList.add('has-fluid');

  const SCALE = 0.3, MAX_PX = 170000, FRAME_MS = 1000 / 30;
  function fit() {
    const w = hero.clientWidth || window.innerWidth, h = hero.clientHeight || window.innerHeight;
    let k = SCALE;
    if (w * h * k * k > MAX_PX) k = Math.sqrt(MAX_PX / (w * h));
    const cw = Math.max(32, Math.round(w * k)), ch = Math.max(32, Math.round(h * k));
    if (cv.width !== cw || cv.height !== ch) {
      cv.width = cw; cv.height = ch;
      gl.viewport(0, 0, cw, ch);
      gl.uniform2f(uRes, cw, ch);
      allocField(w / h);   // la rejilla sigue la proporción de la pantalla
    }
  }
  fit();
  window.addEventListener('resize', () => { fit(); if (!running && heroOn()) draw(); });

  // mouse: sólo se guarda la posición; el suavizado va en el cuadro
  let tx = 0.5, ty = 0.5, sx = 0.5, sy = 0.5, energy = 0;
  let lastInput = performance.now();
  ['mousemove', 'keydown', 'wheel', 'pointerdown'].forEach(ev =>
    window.addEventListener(ev, () => { lastInput = performance.now(); }, { passive: true }));
  // STIR: cuánto empuja el mouse · FMAX: tope del desplazamiento (en alto de
  // pantalla) · HALF: segundos en que la deformación se reduce a la mitad
  const STIR = 0.85, FMAX = 0.25, HALF = 4, SIGMA = 2.8;
  let fieldOn = false, lastUx = null, lastUy = null;
  window.addEventListener('mousemove', e => {
    const r = hero.getBoundingClientRect();
    if (!r.width) return;
    const nx = (e.clientX - r.left) / r.width, ny = 1 - (e.clientY - r.top) / r.height;
    // energía según la distancia REAL recorrida (en píxeles, relativa al alto):
    // con fracciones de ancho/alto por separado, un mismo movimiento contaba
    // el doble en vertical que en horizontal
    const dpx = Math.hypot((nx - tx) * r.width, (ny - ty) * r.height) / r.height;
    energy = Math.min(0.3, energy + dpx * 0.6);
    tx = nx; ty = ny;
    // remover: el tramo recorrido (en alto de pantalla, igual en ambos ejes)
    // empuja las celdas cercanas en esa dirección
    const ux = nx * r.width / r.height, uy = ny;
    if (lastUx !== null) {
      let dx = ux - lastUx, dy = uy - lastUy;
      const L = Math.hypot(dx, dy);
      if (L > 0.15) { dx = dy = 0; }            // salto (entró desde fuera)
      if (L > 0) addStir(nx, ny, dx * STIR, dy * STIR);
    }
    lastUx = ux; lastUy = uy;
  }, { passive: true });
  window.addEventListener('mouseout', e => { if (!e.relatedTarget) lastUx = null; }, { passive: true });

  const t0 = performance.now();
  let t = 0, last = 0, running = false, raf = 0;
  // suma el empuje alrededor del cursor (gaussiana de SIGMA celdas)
  function addStir(nx, ny, dx, dy) {
    const cx = nx * GW, cy = ny * GH, R = Math.ceil(SIGMA * 2.5);
    const x0 = Math.max(0, Math.floor(cx - R)), x1 = Math.min(GW - 1, Math.ceil(cx + R));
    const y0 = Math.max(0, Math.floor(cy - R)), y1 = Math.min(GH - 1, Math.ceil(cy + R));
    const k = -1 / (2 * SIGMA * SIGMA);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const ddx = x + 0.5 - cx, ddy = y + 0.5 - cy;
        const w = Math.exp((ddx * ddx + ddy * ddy) * k);
        const i = y * GW + x;
        fx[i] = Math.max(-FMAX, Math.min(FMAX, fx[i] + dx * w));
        fy[i] = Math.max(-FMAX, Math.min(FMAX, fy[i] + dy * w));
      }
    }
    fieldOn = true;
  }
  // cada cuadro: se suaviza un poco (difusión) y se disuelve despacio
  function relax(dt) {
    if (!fieldOn) return;
    const dec = Math.pow(0.5, dt / HALF), a = Math.min(1, dt * 3);
    let mx = 0;
    for (const f of [fx, fy]) {
      for (let y = 0; y < GH; y++) {
        for (let x = 0; x < GW; x++) {
          const i = y * GW + x;
          const n = (f[x > 0 ? i - 1 : i] + f[x < GW - 1 ? i + 1 : i] +
                     f[y > 0 ? i - GW : i] + f[y < GH - 1 ? i + GW : i]) * 0.25;
          fbuf[i] = (f[i] + (n - f[i]) * a) * dec;
        }
      }
      f.set(fbuf);
    }
    for (let i = 0; i < fx.length; i++) {
      const v = Math.abs(fx[i]) + Math.abs(fy[i]);
      if (v > mx) mx = v;
      fpix[i * 4]     = 128 + Math.round(fx[i] / 0.25 * 127);
      fpix[i * 4 + 1] = 128 + Math.round(fy[i] / 0.25 * 127);
    }
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, GW, GH, gl.RGBA, gl.UNSIGNED_BYTE, fpix);
    if (mx < 0.002) {                          // ya se disolvió → reposo
      fx.fill(0); fy.fill(0); fpix.fill(128);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, GW, GH, gl.RGBA, gl.UNSIGNED_BYTE, fpix);
      fieldOn = false;
    }
  }
  function draw() {
    gl.uniform1f(uT, t);
    gl.uniform2f(uM, sx, sy);
    gl.uniform1f(uE, energy);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    // en reposo basta con 30 fps (15 fps si nadie interactúa hace 8 s: el
    // flujo es tan lento que no se nota y el equipo no se calienta con el
    // rato); mientras el mouse remueve el agua se dibuja cada cuadro
    const idleMs = now - lastInput > 8000 ? 1000 / 15 : FRAME_MS;
    if (energy < 0.02 && !fieldOn && now - last < idleMs) return;
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    t += dt;
    // suavizado y decaimiento según el tiempo real (igual a 30 o 60 fps)
    const f30 = dt * 30;
    const kf = 1 - Math.pow(1 - 0.07, f30);
    sx += (tx - sx) * kf; sy += (ty - sy) * kf;
    energy *= Math.pow(0.95, f30);
    relax(dt);
    draw();
  }
  const still = () => isLite() || reducedMotionQuery.matches || document.body.classList.contains('fx-idle');
  const heroOn = () => hero.classList.contains('is-active') || hero.classList.contains('is-leaving');
  function update() {
    const go = heroOn() && !document.hidden && !still();
    if (go && !running) { running = true; last = 0; raf = requestAnimationFrame(frame); }
    else if (!go && running) { running = false; cancelAnimationFrame(raf); }
    // cuadro fijo sólo si el hero se ve pero no debe animarse (lite /
    // movimiento reducido); en pausa no se dibuja nada
    if (!go && heroOn() && still()) draw();
  }
  t = (performance.now() - t0) / 1000 + 20;   // arranca ya "fluido"
  document.addEventListener('deck:change', () => setTimeout(update, 0));
  document.addEventListener('visibilitychange', update);
  document.addEventListener('lite:change', update);
  document.addEventListener('fx:idle', update);
  // la limpieza de la transición quita is-leaving después del deck:change
  document.addEventListener('transitionend', e => { if (e.target === hero) update(); });
  setInterval(update, 1500);   // red de seguridad barata (sólo lee clases)
  update();
}
// hero y about (las dos diapositivas claras); cada una corre sólo cuando se ve
initFluid(document.getElementById('hero'));
initFluid(document.getElementById('about'));

// HERO: la flecha de la pista ("… use these keys →") avanza a saltos parejos
// hacia el instructivo de teclas, dejando en cada salto una copia que se
// apaga por pasos (rastro pixel art); al chocar se desintegra en píxeles, las
// teclas se hunden en orden y la flecha reaparece parpadeando. Espera 5 s y
// repite. Al salir del hero se cancela y se borra todo lo que esté en vuelo.
// Se mueve un clon fijo (coordenadas de pantalla): el hero vive dentro del
// deck 3D y sus transformaciones no afectan al recorrido.
(function () {
  const arrow = document.querySelector('#hero .hint-arrow');
  const hint = document.querySelector('.kbd-hint');
  if (!arrow || !hint || !arrow.animate) return;
  // sale una flecha cada WAIT ms aunque la anterior siga en camino (en
  // pantallas anchas pueden ir varias a la vez) · HOP: ms por salto
  const WAIT = 3000, HOP = 170;
  // la flecha en una rejilla de 5×5 (para desintegrarla píxel a píxel)
  const SHAPE = ['..#..', '...#.', '#####', '...#.', '..#..'];
  let timer = null;
  const live = new Set(), timers = new Set(), ticks = new Set();
  const visible = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const atHero = () => document.body.classList.contains('at-hero');
  const canRun = () => atHero() && !document.hidden && !document.body.classList.contains('fx-idle') &&
    !reducedMotionQuery.matches && visible(arrow) && visible(hint) &&
    getComputedStyle(hint).opacity !== '0';
  function later(fn, ms) {
    const id = setTimeout(() => { timers.delete(id); fn(); }, ms);
    timers.add(id);
  }
  function add(el) { document.body.appendChild(el); live.add(el); return el; }
  function drop(el) { el.remove(); live.delete(el); }
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(() => { if (canRun()) launch(); schedule(); }, WAIT);
  }
  // corta el recorrido en curso: borra clon, rastro y píxeles, suelta las
  // teclas y deja la flecha original en su sitio
  function cancel() {
    ticks.forEach(clearInterval); ticks.clear();
    timers.forEach(clearTimeout); timers.clear();
    live.forEach(el => el.remove()); live.clear();
    hint.querySelectorAll('.kc.is-down').forEach(k => k.classList.remove('is-down'));
    const m = hint.querySelector('.kbd-mouse');
    if (m) m.classList.remove('is-scrolling');
    arrow.getAnimations().forEach(an => an.cancel());
    arrow.style.visibility = '';
  }
  function pressKeys() {
    const order = [' ', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowUp'];
    const els = order.map(k => hint.querySelector(`.kc[data-key="${k}"]`)).filter(Boolean);
    const mouse = hint.querySelector('.kbd-mouse');
    els.forEach((k, i) => later(() => {
      k.classList.add('is-down');
      later(() => k.classList.remove('is-down'), 200);
    }, i * 120));
    // el mouse se activa como al hacer scroll (cara roja, rueda girando)
    if (mouse) later(() => {
      mouse.classList.add('is-scrolling');
      later(() => mouse.classList.remove('is-scrolling'), 600);
    }, els.length * 120);
    return els.length * 120 + 650;
  }
  // desintegración: cada píxel de la flecha rebota hacia atrás, se abre en
  // vertical, cae un poco y se apaga, todo a saltos
  function shatter(r, color) {
    const cell = Math.max(2, Math.round(Math.min(r.width, r.height) / 5));
    const ox = Math.round(r.left + (r.width - cell * 5) / 2);
    const oy = Math.round(r.top + (r.height - cell * 5) / 2);
    SHAPE.forEach((row, y) => [...row].forEach((c, x) => {
      if (c !== '#') return;
      const b = add(document.createElement('i'));
      b.className = 'hint-bit';
      Object.assign(b.style, {
        left: ox + x * cell + 'px', top: oy + y * cell + 'px',
        width: cell + 'px', height: cell + 'px', background: color,
      });
      const vx = -Math.round(4 + Math.random() * 14 + (4 - x) * 2);
      const vy = Math.round((y - 2) * 4 + (Math.random() - 0.5) * 10);
      const g = Math.round(6 + Math.random() * 6);
      b.animate([
        { transform: 'translate(0, 0)', opacity: 1 },
        { transform: `translate(${Math.round(vx * 0.6)}px, ${Math.round(vy * 0.6)}px)`, opacity: 0.8, offset: 0.4 },
        { transform: `translate(${vx}px, ${vy + g}px)`, opacity: 0 },
      ], { duration: 520 + Math.random() * 260, easing: 'steps(5, end)', fill: 'forwards' })
        .onfinish = () => drop(b);
    }));
  }
  function launch() {
    const space = hint.querySelector('.kc-space') || hint;
    const a = arrow.getBoundingClientRect(), t = space.getBoundingClientRect();
    const dx = t.left - a.right + 2;
    const dy = (t.top + t.height / 2) - (a.top + a.height / 2);
    if (dx < 20) return;
    arrow.getAnimations().forEach(an => an.cancel());
    const cs = getComputedStyle(arrow);
    const fly = add(document.createElement('span'));
    fly.className = 'hint-fly';
    fly.textContent = arrow.textContent;
    Object.assign(fly.style, {
      left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px',
      font: cs.font, color: cs.color, lineHeight: a.height + 'px',
    });
    arrow.style.visibility = 'hidden';
    // saltos iguales de ~1,6 flechas de largo, en píxeles enteros
    const hops = Math.max(3, Math.round(dx / (a.width * 1.6)));
    let i = 0;
    const tick = setInterval(() => {
      if (!canRun()) { cancel(); return; }
      // rastro: copia de la flecha donde estaba, que se apaga por pasos
      const g = add(fly.cloneNode(true));
      g.classList.add('hint-ghost');
      g.animate([{ opacity: 0.5 }, { opacity: 0 }],
        { duration: 900, easing: 'steps(3, end)', fill: 'forwards' }).onfinish = () => drop(g);
      i++;
      fly.style.transform = `translate(${Math.round(dx * i / hops)}px, ${Math.round(dy * i / hops)}px)`;
      if (i < hops) return;
      clearInterval(tick); ticks.delete(tick);
      later(() => {
        shatter(fly.getBoundingClientRect(), cs.color);
        drop(fly);
        pressKeys();
        // la flecha reaparece en su sitio parpadeando (encendido / apagado a
        // saltos), salvo que otra ya haya salido después de ésta
        later(() => {
          if ([...live].some(el => el.classList.contains('hint-fly') && !el.classList.contains('hint-ghost'))) return;
          arrow.style.visibility = '';
          const off = { opacity: 0, easing: 'steps(1, end)' }, on = { opacity: 1, easing: 'steps(1, end)' };
          arrow.animate([off, on, off, on], { duration: 640 });
        }, 300);
      }, HOP);
    }, HOP);
    ticks.add(tick);
  }
  // cambio de diapositiva: fuera del hero se corta al instante; al volver,
  // la cuenta de 5 s empieza de nuevo
  document.addEventListener('deck:change', e => {
    const st = e.detail && e.detail.step && e.detail.step.stage;
    if (st && st.id === 'hero') schedule();
    else { cancel(); clearTimeout(timer); }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancel(); clearTimeout(timer); } else schedule();
  });
  schedule();
})();

// ATENCIÓN: de vez en cuando, al azar, se "activa" sola una de las flechas
// del deck (destello rojo, como al navegar) o una tecla / el mouse del
// instructivo, para que se note que son interactivos. Sólo con el usuario
// quieto unos segundos, sin transición en curso ni zoom / galería abiertos.
(function () {
  if (!DECK) return;
  const arrows = [...document.querySelectorAll('.deck-arrow')];
  // flechas de la galería del proyecto que se está viendo
  const galArrows = () => [...document.querySelectorAll(
    '#page > .stage.is-active .project.is-current [data-slider] .nav-btn')];
  const hint = document.querySelector('.kbd-hint');
  const keys = hint ? [...hint.querySelectorAll('.kc')] : [];
  const mouse = hint && hint.querySelector('.kbd-mouse');
  let lastInput = performance.now();
  ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(ev =>
    window.addEventListener(ev, () => { lastInput = performance.now(); }, { passive: true, capture: true }));
  const shown = el => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
  };
  const pick = list => list[Math.floor(Math.random() * list.length)];
  function flash(el, cls, ms) {
    if (el.classList.contains(cls)) return;
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), ms);
  }
  function poke() {
    const b = document.body;
    const calm = !document.hidden && !reducedMotionQuery.matches &&
      !b.classList.contains('fx-idle') &&
      performance.now() - lastInput > 2000 &&
      !b.classList.contains('deck-moving') && !b.classList.contains('zoom-open') &&
      !b.classList.contains('lb-open');
    if (calm) {
      const arrowFx = arrows.concat(galArrows())
        .filter(a => !a.disabled && shown(a) && !a.matches(':hover'))
        .map(a => () => flash(a, 'is-pulse', 260));
      const hintFx = hint && shown(hint) && getComputedStyle(hint).opacity !== '0'
        ? keys.map(k => () => flash(k, 'is-down', 220)).concat(mouse ? [
            () => flash(mouse, 'is-scrolling', 500),
            () => flash(mouse, Math.random() < 0.5 ? 'btn-l' : 'btn-r', 220),
          ] : [])
        : [];
      // casi siempre una flecha (deck o galería); a veces el instructivo
      const pool = arrowFx.length && (!hintFx.length || Math.random() < 0.7) ? arrowFx : hintFx;
      if (pool.length) pick(pool)();
    }
    setTimeout(poke, 3500 + Math.random() * 4500);
  }
  setTimeout(poke, 3000);
})();

// "+3" en los sitios de FAMA: abre / cierra un menú con los demás sitios.
// Fijo en pantalla, debajo del botón (o encima si no cabe); se cierra con el
// botón, Escape, un clic afuera o al cambiar de diapositiva
document.querySelectorAll('.site-more').forEach(btn => {
  const menu = document.getElementById(btn.getAttribute('aria-controls'));
  if (!menu) return;
  document.body.appendChild(menu);        // fuera de la tarjeta (sin recortes)
  const place = () => {
    const r = btn.getBoundingClientRect();
    const h = menu.offsetHeight, w = menu.offsetWidth;
    const below = r.bottom + 6 + h <= window.innerHeight - 8;
    menu.style.top = (below ? r.bottom + 6 : Math.max(8, r.top - 6 - h)) + 'px';
    menu.style.left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8)) + 'px';
  };
  const open = () => {
    menu.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    place();
  };
  const close = (refocus) => {
    if (menu.hidden) return;
    menu.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    if (refocus) btn.focus({ preventScroll: true });
  };
  btn.addEventListener('click', e => {
    e.stopPropagation();
    if (menu.hidden) open(); else close();
  });
  document.addEventListener('click', e => {
    if (!menu.hidden && !menu.contains(e.target)) close();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !menu.hidden) { e.stopPropagation(); close(true); }
  }, true);
  window.addEventListener('resize', () => { if (!menu.hidden) place(); });
  document.addEventListener('deck:change', () => close());
});

// GLITCH POR RÁFAGAS: antes cada texto con glitch tenía una animación CSS
// infinita (clip-path) que el navegador recalculaba en cada cuadro aunque el
// efecto sólo se viera un instante. Ahora la animación corre sólo durante la
// ráfaga visible (~0.4 s, clase .gl-burst) y entre ráfagas no corre nada.
(function () {
  const SEL = '.glitch, .px-glitch.glitch-on, #cursor';
  const next = new WeakMap();
  function tick() {
    const b = document.body;
    if (!document.hidden && !reducedMotionQuery.matches && !b.classList.contains('fx-idle')) {
      const now = performance.now();
      document.querySelectorAll(SEL).forEach(el => {
        if (el.closest('#page > .stage:not(.is-active)')) return;   // sólo lo que se ve
        const t = next.get(el);
        if (t === undefined) { next.set(el, now + 500 + Math.random() * 3500); return; }
        if (now < t) return;
        next.set(el, now + 3000 + Math.random() * 2500);
        el.classList.remove('gl-burst');
        void el.offsetWidth;
        el.classList.add('gl-burst');
        setTimeout(() => el.classList.remove('gl-burst'), 450);
      });
    }
    setTimeout(tick, 250);
  }
  tick();
})();

// REPOSO: tras 60 s sin mover el mouse, teclear, hacer scroll ni tocar se
// pausan las animaciones decorativas, el fondo
// líquido y los videos de las galerías. Vuelve todo al primer movimiento.
(function () {
  const IDLE_MS = 60000;
  const b = document.body;
  let t = 0, idle = false;
  function set(on) {
    if (on === b.classList.contains('fx-idle')) return;
    b.classList.toggle('fx-idle', on);
    document.dispatchEvent(new CustomEvent('fx:idle', { detail: on }));
    if (typeof syncAllSliderVideos === 'function') syncAllSliderVideos();
  }
  const sync = () => set(idle);
  function wake() {
    clearTimeout(t);
    if (idle) { idle = false; sync(); }
    t = setTimeout(() => { idle = true; sync(); }, IDLE_MS);
  }
  ['mousemove', 'pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'].forEach(ev =>
    window.addEventListener(ev, wake, { passive: true, capture: true }));
  wake();
})();

// TABLET / MÓVIL: el contenido de cada diapositiva puede tener scroll propio
// (.container). Al llegar a una diapositiva nueva —sección o proyecto interno—
// se vuelve arriba para empezar a leerla desde el principio
// al avanzar, la diapositiva nueva arranca ARRIBA; al retroceder arranca
// ABAJO (se viene "desde abajo", y ← sigue subiendo por su contenido)
let lastDeckIndex = window.deck && window.deck.index ? window.deck.index() : null;
document.addEventListener('deck:change', e => {
  const d = e.detail || {};
  const back = lastDeckIndex !== null && d.index < lastDeckIndex;
  lastDeckIndex = d.index;
  const st = d.step && d.step.stage;
  const box = st && st.querySelector(':scope > .container');
  if (!box) return;
  const idx = d.index;
  // al cambiar de SECCIÓN el contenedor aún no se ve (scrollHeight 0): se
  // reintenta en los siguientes cuadros hasta que tenga alto
  let tries = 0;
  const apply = () => {
    if (lastDeckIndex !== idx) return;              // ya se navegó a otra
    if (!box.clientHeight && tries++ < 30) { requestAnimationFrame(apply); return; }
    const top = back ? box.scrollHeight - box.clientHeight : 0;
    if (Math.abs(box.scrollTop - top) > 1) box.scrollTo({ top, behavior: reducedMotionQuery.matches ? 'auto' : 'smooth' });
  };
  apply();
  // entre secciones el layout termina de armarse con la transición: al
  // quedar quieta se vuelve a aplicar (si ya está en su sitio no hace nada)
  document.addEventListener('deck:settled', apply, { once: true });
});

/* cambio de idioma: conserva la sección actual (#fama, #about…) al pasar de
   una versión a la otra */
document.querySelectorAll('.lang-switch').forEach(a => {
  a.addEventListener('click', e => {
    if (!location.hash || e.ctrlKey || e.metaKey || e.shiftKey) return;
    e.preventDefault();
    location.href = a.getAttribute('href').split('#')[0] + location.hash;
  });
});

/* español: "AÑOS" bajo el "8+" del hero crece a medio camino del ancho de la cifra
   (en inglés "YEARS" ya lo llena). Se escala la tipografía, no el espaciado,
   y se anula el espacio final de la última letra para que quede centrado. */
if (ES) {
  const fitUnit = () => {
    const num = document.querySelector('#hero .hd-num');
    const unit = document.querySelector('#hero .hd-unit');
    if (!num || !unit) return;
    unit.style.fontSize = ''; unit.style.marginRight = '';
    unit.style.letterSpacing = '0.08em';
    const target = num.getBoundingClientRect().width;
    const fs = parseFloat(getComputedStyle(unit).fontSize);
    const ls = parseFloat(getComputedStyle(unit).letterSpacing) || 0;
    const w = unit.getBoundingClientRect().width - ls;
    if (!target || !w) return;
    // punto intermedio entre el tamaño original y el ancho completo del "8+"
    const k = (1 + target / w) / 2;
    unit.style.fontSize = (fs * k) + 'px';
    unit.style.marginRight = (-ls * k) + 'px';
  };
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(fitUnit);
  let fitUnitT;
  window.addEventListener('resize', () => { clearTimeout(fitUnitT); fitUnitT = setTimeout(fitUnit, 120); });
  document.addEventListener('deck:change', () => setTimeout(fitUnit, 50));
}

/* placeholder de carga (ver CSS): al cargar la imagen o el video de un slide,
   miniatura o pieza de diseño, su contenedor recibe .is-loaded y el logo gris
   se desvanece. load/loadeddata no burbujean: se escuchan en captura. */
(function () {
  const HOLDERS = '.slide, .thumb, .design-item';
  const mark = el => { const h = el.closest && el.closest(HOLDERS); if (h) h.classList.add('is-loaded'); };
  document.addEventListener('load', e => { if (e.target.tagName === 'IMG') mark(e.target); }, true);
  document.addEventListener('loadeddata', e => mark(e.target), true);
  document.querySelectorAll('.slide img, .thumb img, .design-item img').forEach(img => {
    if (img.getAttribute('src') && img.complete && img.naturalWidth) mark(img);
  });
})();

/* MENÚ DEL TOPBAR (pantallas angostas, donde se desplaza en horizontal): se
   recorre solo hasta dejar centrada la sección actual. Si el usuario lo
   mueve, a los 5 s sin tocarlo vuelve a centrarla. */
(function () {
  const ul = document.querySelector('#topbar ul');
  if (!ul) return;
  const IDLE_MS = 5000;
  let ownScrollUntil = 0, idleT = 0;
  function center(smooth) {
    if (ul.scrollWidth <= ul.clientWidth + 1) return;   // cabe entero: nada que hacer
    const a = ul.querySelector('a.active');
    if (!a) return;
    const li = a.closest('li') || a;
    const ur = ul.getBoundingClientRect(), r = li.getBoundingClientRect();
    const left = ul.scrollLeft + (r.left - ur.left) - (ul.clientWidth - r.width) / 2;
    ownScrollUntil = performance.now() + 700;
    ul.scrollTo({ left: Math.max(0, left), behavior: smooth && !reducedMotionQuery.matches ? 'smooth' : 'auto' });
  }
  // la sección activa cambia → se centra (la clase .active la pone el deck)
  let lastActive = ul.querySelector('a.active');
  new MutationObserver(() => {
    const now = ul.querySelector('a.active');
    if (now === lastActive) return;
    lastActive = now;
    clearTimeout(idleT);
    center(true);
  }).observe(ul, { subtree: true, attributes: true, attributeFilter: ['class'] });
  // desplazado a mano → vuelve a la sección actual tras 5 s quieto
  ul.addEventListener('scroll', () => {
    if (performance.now() < ownScrollUntil) return;
    clearTimeout(idleT);
    idleT = setTimeout(() => center(true), IDLE_MS);
  }, { passive: true });
  window.addEventListener('resize', () => center(false));
  window.addEventListener('load', () => center(false));
  center(false);
})();

/* pantalla de carga (ver #loader): se quita cuando la página cargó (load) y
   las fuentes están listas, dos cuadros después para que el deck ya esté
   pintado en su sitio. Tope de 8 s por si algún recurso se cuelga. */
(function () {
  const loader = document.getElementById('loader');
  if (!loader) return;
  let done = false;
  const finish = () => {
    if (done) return; done = true;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      loader.classList.add('is-done');
      setTimeout(() => loader.remove(), 600);
    }));
  };
  const loaded = document.readyState === 'complete'
    ? Promise.resolve()
    : new Promise(r => window.addEventListener('load', r, { once: true }));
  const fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  Promise.all([loaded, fonts]).then(finish);
  setTimeout(finish, 8000);
})();
