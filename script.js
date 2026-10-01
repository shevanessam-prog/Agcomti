(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- Menú móvil ---------- */
  const menuBtn = $('#menuBtn'), nav = $('#nav'), header = $('.header');
  const toggleMenu = (open) => {
    nav.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', open);
  };
  menuBtn.addEventListener('click', () => toggleMenu(!nav.classList.contains('open')));
  $$('a', nav).forEach(a => a.addEventListener('click', () => toggleMenu(false)));

  /* ---------- Carrusel ---------- */
  const slides = $$('.slide'), dotsBox = $('#dots'), bar = $('#bar'), hero = $('#inicio');
  const DELAY = 6000;
  let current = 0, timer = null, start = 0, paused = false, elapsed = 0;

  slides.forEach((_, i) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', 'Ir al destacado ' + (i + 1));
    b.addEventListener('click', () => go(i));
    dotsBox.appendChild(b);
  });
  const dots = $$('button', dotsBox);

  function go(i) {
    slides[current].classList.remove('active');
    current = (i + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots.forEach((d, n) => d.classList.toggle('on', n === current));
    elapsed = 0;
    start = performance.now();
  }

  function tick(now) {
    if (!paused) {
      elapsed = now - start;
      bar.style.width = Math.min(elapsed / DELAY * 100, 100) + '%';
      if (elapsed >= DELAY) go(current + 1);
    } else {
      start = now - elapsed; // congela el progreso mientras está en pausa
    }
    requestAnimationFrame(tick);
  }

  $('#next').addEventListener('click', () => go(current + 1));
  $('#prev').addEventListener('click', () => go(current - 1));
  hero.addEventListener('mouseenter', () => paused = true);
  hero.addEventListener('mouseleave', () => paused = false);
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') go(current + 1);
    if (e.key === 'ArrowLeft') go(current - 1);
  });

  // Deslizar con el dedo
  let x0 = null;
  hero.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; paused = true; }, { passive: true });
  hero.addEventListener('touchend', e => {
    if (x0 !== null) {
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) go(current + (dx < 0 ? 1 : -1));
    }
    x0 = null; paused = false;
  });

  go(0);
  requestAnimationFrame(t => { start = t; tick(t); });

  /* ---------- Actividades (RF02 a RF06) ---------- */
  const KEY = 'tiwanaku_actividades_v1';
  const TIPOS = { comunitaria: 'Comunitaria', cultural: 'Cultural', turistica: 'Turística' };
  const MES = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
  const USERS = {
    alcalde: { nombre: 'Alcalde municipal', rol: 'alcalde' },
    secretaria: { nombre: 'Secretaría municipal', rol: 'secretaria' },
    organizador: { nombre: 'Organizador', rol: 'organizador' },
    comunario: { nombre: 'Comunario', rol: 'comunario' },
    visitante: { nombre: 'Visitante', rol: 'visitante' }
  };
  const seed = [
    ['a1','Feria de productores locales','Venta directa de papa nativa, quinua y tejidos.','2026-09-19','07:00','Mercado comunal','comunitaria','Junta vecinal'],
    ['a2','Recorrido guiado al centro ceremonial','Visita guiada con información histórica para visitantes.','2026-09-26','10:00','Ingreso al centro ceremonial','turistica','Oficina de Turismo'],
    ['a3','Asamblea general de la comunidad','Informe anual y elección de turnos de servicio.','2026-10-10','09:00','Plaza principal','comunitaria','Secretaría municipal'],
    ['a4','Feria de productores locales','Productos de la zona, comida típica y artesanías.','2026-10-17','07:00','Mercado comunal','comunitaria','Junta vecinal'],
    ['a5','Taller de tejido en telar','Técnicas tradicionales con lana de alpaca.','2026-10-24','15:00','Casa comunal','cultural','Asociación de tejedoras'],
    ['a6','Recorrido guiado por el sitio arqueológico','Recorrido de dos horas con guía local.','2026-10-31','10:00','Ingreso al centro ceremonial','turistica','Oficina de Turismo'],
    ['a7','Todos Santos: ofrenda comunitaria','Mesas de ofrenda y encuentro de familias.','2026-11-02','10:00','Cementerio y plaza','cultural','Comunidad'],
    ['a8','Taller de sikus y música andina','Abierto a niñas, niños y jóvenes.','2026-11-14','16:00','Escuela comunal','cultural','Unidad educativa'],
    ['a9','Fiesta del solsticio','Danzas, comida compartida y música en vivo.','2026-12-21','18:00','Explanada','cultural','Secretaría municipal']
  ].map(([id,nombre,descripcion,fecha,hora,lugar,tipo,responsable]) => ({ id, nombre, descripcion, fecha, hora, lugar, tipo, responsable }));

  const load = () => {
    try { const s = JSON.parse(localStorage.getItem(KEY)); if (Array.isArray(s)) return s; } catch (e) {}
    return seed.map(x => ({ ...x }));
  };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(acts)); } catch (e) {} };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const fmt = f => { const [y, m, d] = f.split('-'); return `${+d} de ${MES[+m - 1]} de ${y}`; };

  let acts = load(), user = null, tipo = 'all';
  const box = $('#events'), emptyMsg = $('#empty');
  const canEdit = () => user && (user.rol === 'secretaria' || user.rol === 'organizador');

  function card(a, i) {
    const [, m, d] = a.fecha.split('-');
    return `<article class="event" style="animation-delay:${Math.min(i, 8) * 60}ms">
      <time datetime="${a.fecha}"><b>${d}</b>${MES[+m - 1]}</time>
      <div><span class="tag ${a.tipo}">${TIPOS[a.tipo]}</span><h3>${esc(a.nombre)}</h3>
      <p>${esc(a.lugar)}, ${esc(a.hora)} h</p>
      <div class="acts"><button class="link" data-a="ver" data-id="${a.id}">Ver detalle</button>
      ${canEdit() ? `<button class="link" data-a="edit" data-id="${a.id}">Modificar</button><button class="link danger" data-a="del" data-id="${a.id}">Cancelar</button>` : ''}</div></div></article>`;
  }

  function render() {
    const q = $('#q').value.trim().toLowerCase(), f = $('#fecha').value, v = $('#vista').value, t = today();
    const list = acts.filter(a =>
      (tipo === 'all' || a.tipo === tipo) && (!f || a.fecha === f) &&
      (v === 'all' || (v === 'prox' ? a.fecha >= t : a.fecha < t)) &&
      (!q || [a.nombre, a.lugar, a.responsable, a.descripcion].join(' ').toLowerCase().includes(q))
    ).sort((a, b) => v === 'ant' ? b.fecha.localeCompare(a.fecha) : a.fecha.localeCompare(b.fecha));
    box.innerHTML = list.map(card).join('');
    emptyMsg.hidden = list.length > 0;
  }

  function setTipo(t) {
    tipo = t;
    $$('.chip[data-f]').forEach(c => c.classList.toggle('on', c.dataset.f === t));
    render();
  }
  $$('.chip[data-f]').forEach(c => c.addEventListener('click', () => setTipo(c.dataset.f)));
  ['#q', '#fecha', '#vista'].forEach(s => $(s).addEventListener('input', render));
  $('#clear').addEventListener('click', () => { $('#q').value = ''; $('#fecha').value = ''; $('#vista').value = 'prox'; setTipo('all'); });
  $$('[data-tipo]').forEach(a => a.addEventListener('click', () => setTipo(a.dataset.tipo)));

  /* Diálogos */
  $$('dialog').forEach(d => {
    d.addEventListener('click', e => { if (e.target === d) d.close(); });
    $$('[data-close]', d).forEach(b => b.addEventListener('click', () => d.close()));
  });

  /* RF06: detalle */
  function showInfo(a) {
    $('#info').innerHTML = `<span class="tag ${a.tipo}">${TIPOS[a.tipo]}</span><h3 id="iTitle">${esc(a.nombre)}</h3><p>${esc(a.descripcion)}</p>
      <ul class="info-list"><li><b>Fecha:</b> ${fmt(a.fecha)}</li><li><b>Hora:</b> ${esc(a.hora)} h</li><li><b>Lugar:</b> ${esc(a.lugar)}</li><li><b>Responsable:</b> ${esc(a.responsable)}</li></ul>`;
    $('#dlgInfo').showModal();
  }

  /* RF02 y RF03: crear y modificar */
  const actForm = $('#actForm');
  function openForm(a) {
    actForm.reset();
    $('#actNote').textContent = '';
    $('#fTitle').textContent = a ? 'Modificar actividad' : 'Nueva actividad';
    const data = a || { id: '', responsable: user.nombre };
    Object.keys(data).forEach(k => { if (actForm.elements[k]) actForm.elements[k].value = data[k]; });
    $('#dlgForm').showModal();
  }
  actForm.addEventListener('submit', e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(actForm));
    Object.keys(d).forEach(k => d[k] = String(d[k]).trim());
    if (['nombre','descripcion','fecha','hora','lugar','responsable'].some(k => !d[k])) {
      $('#actNote').textContent = 'Completa todos los campos.'; return;
    }
    if (d.id) acts = acts.map(a => a.id === d.id ? { ...d } : a);
    else acts.push({ ...d, id: Date.now().toString(36) });
    save(); $('#dlgForm').close(); render();
  });

  /* Acciones en tarjetas (incluye RF04: cancelar) */
  box.addEventListener('click', e => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    const a = acts.find(x => x.id === b.dataset.id); if (!a) return;
    if (b.dataset.a === 'ver') showInfo(a);
    if (b.dataset.a === 'edit' && canEdit()) openForm(a);
    if (b.dataset.a === 'del' && canEdit() && confirm('¿Cancelar y eliminar esta actividad?')) { acts = acts.filter(x => x.id !== a.id); save(); render(); }
  });

  /* RF05: reporte del alcalde */
  function report() {
    const t = today(), n = acts.length, prox = acts.filter(a => a.fecha >= t).length;
    const bars = Object.keys(TIPOS).map(k => {
      const c = acts.filter(a => a.tipo === k).length;
      return `<div class="bar"><span>${TIPOS[k]}</span><i style="width:${n ? c / n * 100 : 0}%"></i><b>${c}</b></div>`;
    }).join('');
    $('#rep').innerHTML = `<p>Total registradas: <b>${n}</b>. Próximas: <b>${prox}</b>. Realizadas: <b>${n - prox}</b>.</p>${bars}`;
    $('#dlgRep').showModal();
  }

  /* RF01: sesión (demostración; la autenticación real va en el servidor) */
  const loginBtn = $('#loginBtn'), gestion = $('#gestion');
  function paintSession() {
    loginBtn.textContent = user ? 'Salir' : 'Ingresar';
    gestion.hidden = !user;
    if (user) {
      gestion.innerHTML = `<span>Sesión iniciada: <b>${esc(user.nombre)}</b></span>` +
        (canEdit() ? '<button class="btn sm" data-g="new">Nueva actividad</button>' : '') +
        (user.rol === 'alcalde' ? '<button class="btn sm" data-g="rep">Ver reporte</button>' : '');
    }
    render();
  }
  gestion.addEventListener('click', e => {
    const g = e.target.dataset.g;
    if (g === 'new') openForm(); if (g === 'rep') report();
  });
  loginBtn.addEventListener('click', () => {
    toggleMenu(false);
    if (user) { user = null; paintSession(); } else { $('#loginForm').reset(); $('#loginNote').textContent = ''; $('#dlgLogin').showModal(); }
  });
  $('#loginForm').addEventListener('submit', e => {
    e.preventDefault();
    const u = e.target.u.value.trim().toLowerCase(), p = e.target.p.value;
    if (USERS[u] && p === '1234') { user = USERS[u]; $('#dlgLogin').close(); paintSession(); }
    else $('#loginNote').textContent = 'Usuario o contraseña incorrectos.';
  });

  render();

  /* ---------- Animación al hacer scroll ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.15 });
  $$('.reveal').forEach((el, i) => {
    el.style.transitionDelay = (i % 3) * 120 + 'ms';
    io.observe(el);
  });

  /* ---------- Header y botón "subir" ---------- */
  const topBtn = $('#top');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', scrollY > 20);
    topBtn.classList.toggle('show', scrollY > 600);
  }, { passive: true });
  topBtn.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

  /* ---------- Formulario ---------- */
  const form = $('#form'), note = $('#note');
  form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    $$('input,textarea', form).forEach(f => {
      const bad = !f.value.trim();
      f.classList.toggle('invalid', bad);
      if (bad) ok = false;
    });
    note.textContent = ok
      ? 'Gracias. Recibimos tu propuesta y te contactaremos pronto.'
      : 'Completa todos los campos para enviar tu propuesta.';
    if (ok) form.reset();
  });

  $('#year').textContent = new Date().getFullYear();
})();