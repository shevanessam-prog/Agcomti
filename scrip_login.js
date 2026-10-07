(() => {
  const $ = s => document.querySelector(s);

  /* ---------- Cuentas de demostración (la autenticación real irá en el servidor) ---------- */
  const DEMO_PASS = 'tiwa2026';
  const USERS = {
    'alcalde@tiwanaku.example': { nombre: 'Alcalde municipal', rol: 'alcalde' },
    'secretaria@tiwanaku.example': { nombre: 'Secretaría municipal', rol: 'secretaria' },
    'organizador@tiwanaku.example': { nombre: 'Organizador', rol: 'organizador' },
    'comunario@tiwanaku.example': { nombre: 'Comunario', rol: 'comunario' },
    'visitante@tiwanaku.example': { nombre: 'Visitante', rol: 'visitante' }
  };
  const MAX_TRIES = 3, LOCK_SECONDS = 30, EMAIL_KEY = 'tiwanaku_email';
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const form = $('#loginForm'), email = $('#email'), pass = $('#pass');
  const fEmail = $('#fEmail'), fPass = $('#fPass'), btn = $('#submit'), btnText = $('.btn-text');
  let tries = 0, locked = false;

  /* ---------- Alertas dinámicas ---------- */
  const ICONS = { success: '\u2713', error: '!', warning: '\u26A0', info: 'i' };
  function toast(type, title, text = '', ms = 4500) {
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.style.setProperty('--d', ms + 'ms');
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    el.innerHTML = '<span class="t-ico"></span><div><b></b><p></p></div><button class="t-x" aria-label="Cerrar alerta">&times;</button><i class="t-bar"></i>';
    el.querySelector('.t-ico').textContent = ICONS[type];
    el.querySelector('b').textContent = title;   // textContent evita inyección de HTML
    el.querySelector('p').textContent = text;
    const box = $('#toasts');
    box.appendChild(el);
    while (box.children.length > 4) close(box.firstElementChild);
    let timer = setTimeout(() => close(el), ms);
    el.addEventListener('mouseenter', () => clearTimeout(timer));
    el.addEventListener('mouseleave', () => { timer = setTimeout(() => close(el), 1500); });
    el.querySelector('.t-x').addEventListener('click', () => close(el));
    return el;
  }
  function close(el) {
    if (!el || el.classList.contains('out')) return;
    el.classList.add('out');
    setTimeout(() => el.remove(), 350);
  }

  /* ---------- Validación en vivo ---------- */
  function setState(field, msgId, ok, text) {
    field.classList.toggle('ok', ok);
    field.classList.toggle('bad', !ok && !!text);
    $(msgId).textContent = text || '';
  }
  function checkEmail(final) {
    const v = email.value.trim();
    if (!v) return setState(fEmail, '#mEmail', false, final ? 'Escribe tu correo electrónico.' : ''), false;
    if (!EMAIL_RE.test(v)) return setState(fEmail, '#mEmail', false, final ? 'El correo no tiene un formato válido.' : ''), false;
    setState(fEmail, '#mEmail', true); return true;
  }
  function checkPass(final) {
    const v = pass.value;
    if (!v) return setState(fPass, '#mPass', false, final ? 'Escribe tu contraseña.' : ''), false;
    if (v.length < 6) return setState(fPass, '#mPass', false, final ? 'Debe tener al menos 6 caracteres.' : ''), false;
    setState(fPass, '#mPass', true); return true;
  }
  email.addEventListener('input', () => checkEmail(false));
  email.addEventListener('blur', () => email.value && checkEmail(true));
  pass.addEventListener('input', () => checkPass(false));
  pass.addEventListener('blur', () => pass.value && checkPass(true));

  /* ---------- Mostrar/ocultar contraseña y Bloq Mayús ---------- */
  $('#eye').addEventListener('click', e => {
    const show = pass.type === 'password';
    pass.type = show ? 'text' : 'password';
    e.currentTarget.textContent = show ? 'Ocultar' : 'Ver';
    e.currentTarget.setAttribute('aria-pressed', show);
    e.currentTarget.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña');
  });
  const capsCheck = e => { $('#caps').hidden = !(e.getModifierState && e.getModifierState('CapsLock')); };
  pass.addEventListener('keydown', capsCheck);
  pass.addEventListener('keyup', capsCheck);
  pass.addEventListener('blur', () => $('#caps').hidden = true);

  /* ---------- Recordar correo ---------- */
  try {
    const saved = localStorage.getItem(EMAIL_KEY);
    if (saved) { email.value = saved; $('#remember').checked = true; checkEmail(false); }
  } catch (e) {}

  $('#forgot').addEventListener('click', () => {
    toast('info', 'Recuperar contraseña',
      'Comunícate con la Secretaría municipal para restablecerla. Esta función se conectará al servidor más adelante.', 6000);
  });

  /* ---------- Bloqueo temporal por intentos fallidos ---------- */
  function lock() {
    locked = true; btn.disabled = true;
    let left = LOCK_SECONDS;
    toast('error', 'Acceso bloqueado temporalmente', `Demasiados intentos fallidos. Espera ${LOCK_SECONDS} segundos.`, 6000);
    const iv = setInterval(() => {
      left--;
      btnText.textContent = `Bloqueado (${left} s)`;
      if (left <= 0) {
        clearInterval(iv); locked = false; tries = 0; btn.disabled = false;
        btnText.textContent = 'Ingresar';
        toast('info', 'Ya puedes intentarlo de nuevo');
      }
    }, 1000);
    btnText.textContent = `Bloqueado (${left} s)`;
  }

  function fail(title, text) {
    form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake');
    toast('error', title, text);
  }

  /* ---------- Envío ---------- */
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (locked) return toast('warning', 'Espera un momento', 'El acceso sigue bloqueado.');
    const okE = checkEmail(true), okP = checkPass(true);
    if (!okE || !okP) {
      form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake');
      return toast('warning', 'Revisa los datos', 'Corrige los campos marcados para continuar.');
    }
    btn.disabled = true; btn.classList.add('loading'); btnText.textContent = 'Verificando...';

    setTimeout(() => {   // simula la consulta al servidor
      btn.classList.remove('loading');
      const key = email.value.trim().toLowerCase();
      const user = USERS[key];
      if (user && pass.value === DEMO_PASS) {
        try {
          $('#remember').checked ? localStorage.setItem(EMAIL_KEY, key) : localStorage.removeItem(EMAIL_KEY);
          sessionStorage.setItem('tiwanaku_sesion', JSON.stringify({ correo: key, ...user }));
        } catch (err) {}
        btnText.textContent = 'Ingreso exitoso';
        toast('success', `Bienvenido, ${user.nombre}`, 'Te estamos llevando a la agenda...', 1600);
        setTimeout(() => { location.href = 'index.html'; }, 1500);
        return;
      }
      tries++;
      btn.disabled = false; btnText.textContent = 'Ingresar';
      pass.value = ''; checkPass(false); pass.focus();
      if (tries >= MAX_TRIES) { fail('Credenciales incorrectas', 'Se alcanzó el máximo de intentos.'); lock(); }
      else {
        const left = MAX_TRIES - tries;
        fail('Credenciales incorrectas', `Correo o contraseña no válidos. Te ${left === 1 ? 'queda 1 intento' : 'quedan ' + left + ' intentos'}.`);
        if (left === 1) setTimeout(() => toast('warning', 'Último intento', 'Si fallas, el acceso se bloqueará por unos segundos.'), 600);
      }
    }, 1100);
  });

  /* ---------- Mensaje de bienvenida ---------- */
  setTimeout(() => toast('info', 'Agenda de Tiwanaku', 'Ingresa con tu correo y contraseña.', 3500), 700);
})();