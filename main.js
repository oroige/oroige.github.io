// Portfolio de Oriol Roige: tira de la portada, arrastre de las tiras, vídeos, móvil en vivo, correo y entradas.
document.documentElement.classList.add('js');

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Dónde vive cada web. En local apunta a los servidores de desarrollo.
const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
const SITES = {
  duermevela: {
    name: 'Duermevela',
    url: local ? 'http://localhost:4198/' : 'https://oroige.github.io/duermevela-trenes-nocturnos/',
  },
  albar: {
    name: 'Albar',
    url: local ? 'http://localhost:4199/' : 'https://oroige.github.io/albar-mercado-de-origen/',
  },
};
document.querySelectorAll('[data-site]').forEach((a) => { a.href = SITES[a.dataset.site].url; });

// Tira de la portada: se ilumina el fotograma que queda en el centro y su título aparece debajo.
const strip = document.querySelector('[data-strip]');
if (strip) {
  const row = strip.querySelector('.strip__row');
  const frames = [...row.children];
  const caption = strip.querySelector('[data-strip-caption]');
  let ticking = false;
  const light = () => {
    ticking = false;
    const mid = row.getBoundingClientRect().left + row.clientWidth / 2;
    let best = frames[0], dist = Infinity;
    for (const f of frames) {
      const r = f.getBoundingClientRect();
      const d = Math.abs(r.left + r.width / 2 - mid);
      if (d < dist) { dist = d; best = f; }
    }
    frames.forEach((f) => f.classList.toggle('is-lit', f === best));
    caption.textContent = best.dataset.title;
  };
  row.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(light); } }, { passive: true });
  addEventListener('resize', light);
  // Empieza con el tercer fotograma centrado para que los bordes queden cortados por los lados.
  requestAnimationFrame(() => {
    const f = frames[2];
    row.scrollLeft = f.offsetLeft - (row.clientWidth - f.offsetWidth) / 2;
    light();
  });
}

// Arrastrar las tiras con el ratón; en táctil ya se desplazan solas.
document.querySelectorAll('.strip__row, .slides__row').forEach((row) => {
  let startX = 0, startLeft = 0, moved = false, down = false;
  row.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') return;
    down = true; moved = false; startX = e.clientX; startLeft = row.scrollLeft;
  });
  addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = e.clientX - startX;
    if (!moved && Math.abs(dx) > 4) { moved = true; row.classList.add('is-dragging'); }
    if (moved) row.scrollLeft = startLeft - dx;
  });
  addEventListener('pointerup', () => {
    if (!down) return;
    down = false;
    if (moved) {
      row.classList.remove('is-dragging');
      // Deja que el snap coloque el fotograma más cercano.
      row.scrollBy({ left: 1, behavior: 'smooth' });
    }
  });
  row.addEventListener('click', (e) => { if (moved) e.preventDefault(); }, true);
  row.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const step = row.firstElementChild.offsetWidth + 10;
    row.scrollBy({ left: e.key === 'ArrowRight' ? step : -step, behavior: reduce ? 'auto' : 'smooth' });
  });
});

// Los recorridos en vídeo solo se reproducen mientras se ven, y siempre se pueden pausar.
// Con el movimiento reducido no arrancan solos: se quedan en el primer fotograma hasta que se pulsa.
const videos = document.querySelectorAll('video[data-autoplay]');
videos.forEach((v) => {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'play';
  v.after(btn);
  v.dataset.wanted = String(!reduce);
  const label = () => { btn.textContent = v.paused ? 'Ver el recorrido' : 'Pausar'; };
  v.addEventListener('play', label);
  v.addEventListener('pause', label);
  btn.addEventListener('click', () => {
    if (v.paused) { v.dataset.wanted = 'true'; v.play().catch(() => {}); }
    else { v.dataset.wanted = 'false'; v.pause(); }
  });
  label();
});
if ('IntersectionObserver' in window) {
  const vio = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const v = e.target;
      if (e.isIntersecting && v.dataset.wanted === 'true') { v.preload = 'auto'; v.play().catch(() => {}); }
      else if (!e.isIntersecting) v.pause();
    }
  }, { threshold: 0.4 });
  videos.forEach((v) => vio.observe(v));
}

// El móvil en vivo: cambia de web, de lista de cosas que probar y de enlace.
const frame = document.querySelector('.phone__screen');
const open = document.querySelector('[data-open]');
const show = (key) => {
  const site = SITES[key];
  if (frame.dataset.current !== key) {
    frame.src = site.url;
    frame.dataset.current = key;
    frame.title = `${site.name} funcionando a tamaño de móvil`;
  }
  document.querySelectorAll('[data-show]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.show === key)));
  document.querySelectorAll('[data-tries]').forEach((l) => { l.hidden = l.dataset.tries !== key; });
  open.href = site.url;
  open.textContent = `Abrir ${site.name} en otra pestaña`;
};
document.querySelectorAll('[data-show]').forEach((b) => b.addEventListener('click', () => show(b.dataset.show)));
if ('IntersectionObserver' in window) {
  const fio = new IntersectionObserver((entries, o) => {
    if (entries.some((e) => e.isIntersecting)) { show(frame.dataset.srcSite); o.disconnect(); }
  }, { rootMargin: '400px 0px' });
  fio.observe(frame);
} else {
  show(frame.dataset.srcSite);
}

// Formulario de contacto: abre el correo con el asunto y el mensaje empezados.
const form = document.querySelector('[data-mail]');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const to = form.getAttribute('action').replace('mailto:', '');
  const name = form.nombre.value.trim();
  const company = form.empresa.value.trim();
  const subject = company ? `Portfolio · ${company}` : 'Portfolio';
  const body = `Hola, Oriol:\n\nHe visto tu portfolio y me gustaría hablar contigo.\n\n${name}${company ? `\n${company}` : ''}`;
  location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

// Entradas: cada parte de una sección sube un poco después de la anterior.
const reveals = document.querySelectorAll('[data-reveal]');
if ('IntersectionObserver' in window) {
  const groups = new Map();
  reveals.forEach((el) => {
    const s = el.closest('section, article') || document.body;
    const i = groups.get(s) || 0;
    groups.set(s, i + 1);
    el.style.setProperty('--d', `${Math.min(i, 5) * 80}ms`);
  });
  const rio = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); rio.unobserve(e.target); }
  }, { rootMargin: '0px 0px -8% 0px' });
  reveals.forEach((el) => rio.observe(el));
} else {
  reveals.forEach((el) => el.classList.add('is-in'));
}
