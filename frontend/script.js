// ══════════════════════════════════════════
//  MediVisit — script.js
// ══════════════════════════════════════════

// ── DATOS ──

let pacientes = [];

let visitas = [];

let graficoHabitaciones = null;

let indicePacienteEditando = null;

let indiceVisitaEditando = null;

// ── CARGA DE DATOS ──

// URL base de la API
const API_URL = 'https://medivisit-final.onrender.com/api';

async function cargarDatos() {
  try {
    const [resPac, resVis] = await Promise.all([
      fetch(`${API_URL}/pacientes`),
      fetch(`${API_URL}/visitas`)
    ]);
    if (!resPac.ok || !resVis.ok) throw new Error('Error en la API');
    pacientes = await resPac.json();
    visitas   = await resVis.json();
  } catch (err) {
    console.warn('⚠️ Sin conexión al backend:', err.message);
    pacientes = [];
    visitas   = [];
  }
}


// ── NAVEGACIÓN ENTRE SECCIONES ──
function showSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item, .nav-bottom-item').forEach(n => n.classList.remove('active'));

  document.getElementById('section-' + name).classList.add('active');
  const navEl = document.getElementById('nav-' + name);
  if (navEl) navEl.classList.add('active');

  closeAllMenus();
}

// ── MODALES ──
function openModal(id) {
  document.getElementById(id).classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

function closeModalOutside(event, id) {
  if (event.target === document.getElementById(id)) {
    closeModal(id);
  }
}

// ── DROPDOWN MENUS (tres puntitos) ──
function toggleMenu(btn) {
  closeAllMenus();
  const menu = btn.nextElementSibling;
  menu.classList.toggle('open');
  event.stopPropagation();
}

function closeAllMenus() {
  document.querySelectorAll('.dropdown-menu.open').forEach(m => m.classList.remove('open'));
}

// Cerrar menús al hacer click en cualquier lado
document.addEventListener('click', closeAllMenus);

// ── FILTRO PACIENTES (buscador) ──
function filterPacientes(query) {
  const rows = document.querySelectorAll('#tbody-pacientes tr');
  rows.forEach(row => {
    const match = row.textContent.toLowerCase().includes(query.toLowerCase());
    row.style.display = match ? '' : 'none';
  });
}

// ── FILTRO VISITAS (buscador) ──
function filterVisitas(query) {
  const rows = document.querySelectorAll('#tbody-visitas tr');
  rows.forEach(row => {
    const match = row.textContent.toLowerCase().includes(query.toLowerCase());
    row.style.display = match ? '' : 'none';
  });
}

// ── FILTRO VISITAS POR ESTADO (tabs) ──
function filterByEstado(estado, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const rows = document.querySelectorAll('#tbody-visitas tr');
  rows.forEach(row => {
    const match = estado === 'todas' || row.dataset.estado === estado;
    row.style.display = match ? '' : 'none';
  });
}

function renderGrafico(){

  const canvas = document.getElementById('deptChart');



  if (!canvas) return;

  const habitaciones = [...new Set(
    pacientes.map(p => p.habitacion)
  )];

  const deptLabels = habitaciones;

  const deptFullNames = habitaciones.map(
    h => "Habitación " + h
  );

  const deptData = habitaciones.map(habitacion => {

    const pacientesHabitacion = pacientes.filter(
      p => p.habitacion === habitacion
    );

    return visitas.filter(visita =>
      pacientesHabitacion.some(
        p => p.nombre === visita.paciente
      )
    ).length;

  });

  if(graficoHabitaciones){
    graficoHabitaciones.destroy();
}

  graficoHabitaciones = new Chart(canvas,{

    type: 'bar',

    data: {

      labels: deptLabels,

      datasets: [{

        label: 'Visitas',

        data: deptData,

        backgroundColor: '#3b82f6',

        borderRadius: 5,

        borderSkipped: false

      }]

    },

    options: {

      responsive: true,

      maintainAspectRatio: false,

      plugins: {

        legend: { display: false },

        tooltip: {

          callbacks: {

            title: items =>
              deptFullNames[items[0].dataIndex],

            label: item =>
              ' Visitas: ' + item.raw

          },

          backgroundColor: '#111827',

          titleFont: { size: 12 },

          bodyFont: { size: 12 },

          padding: 8,

          cornerRadius: 6

        }

      },

      scales: {

        x: {

          grid: { display: false },

          ticks: {

            font: { size: 11 },

            color: '#9ca3af'

          }

        },

        y: {

          grid: {

            color: 'rgba(0,0,0,0.05)'

          },

          ticks: {

            stepSize: 1,

            font: { size: 11 },

            color: '#9ca3af'

          },

          min: 0

        }

      }

    }

  });

}

// ── GRÁFICO DE BARRAS (Panel) ──
window.addEventListener('load', async () => {
  await cargarDatos();
  cargarPacientesEnSelect();
  renderPacientes();
  renderCards();
  renderVisitas();
  renderProximasVisitas();
  renderGrafico();
});

// para llenar el select automaticamente
function cargarPacientesEnSelect(){

    const optionsHtml = `<option value="">Seleccionar paciente</option>` +
        pacientes.map(p => `<option>${p.nombre}</option>`).join("");

    const selectNuevo = document.getElementById("visita-paciente");
    if(selectNuevo) selectNuevo.innerHTML = optionsHtml;

    const selectEditar = document.getElementById("editar-visita-paciente");
    if(selectEditar) selectEditar.innerHTML = optionsHtml;

  }
function renderPacientes(){

    const tbody = document.getElementById("tbody-pacientes");

    if(!tbody) return;

    tbody.innerHTML = "";

    pacientes.forEach((paciente, indice)=>{

        tbody.innerHTML += `
        <tr>

            <td>
                <div class="td-patient">
                    <div class="avatar av-blue">
                        ${paciente.nombre[0]}
                    </div>

                    <span>
                        ${paciente.nombre}
                    </span>
                </div>
            </td>

            <td>${paciente.documento}</td>

            <td>${paciente.habitacion}</td>

            <td>${paciente.cama}</td>

            <td>

                <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;">

                    <span style="display:flex;align-items:center;gap:4px;font-size:12px;color:#6b7280;">
                        <i class="ti ti-phone"></i>
                        ${paciente.telefono}
                    </span>

                    <span style="display:flex;align-items:center;gap:4px;font-size:12px;color:#6b7280;">
                        <i class="ti ti-mail"></i>
                        ${paciente.email}
                    </span>

                </div>

            </td>

            <td>
                <span class="badge badge-programada">
                    ${paciente.sangre}
                </span>
            </td>

            <td>

                <div class="menu-wrap">

                    <button class="dots-btn"
                    onclick="toggleMenu(this)">
                        <i class="ti ti-dots-vertical"></i>
                    </button>

                    <div class="dropdown-menu">

                        <div class="dropdown-item"
                        onclick="verDetallesPaciente(${indice})">
                            <i class="ti ti-eye"></i>
                            Ver detalles
                        </div>

                        <div class="dropdown-item"
                        onclick="abrirEditarPaciente(${indice})">
                            <i class="ti ti-edit"></i>
                            Editar
                        </div>

                        <div class="dropdown-item danger"
                        onclick="eliminarPaciente(${indice})">
                            <i class="ti ti-trash"></i>
                            Eliminar
                        </div>

                    </div>

                </div>

            </td>

        </tr>
        `;

    });

}

function renderCards(){

    document.getElementById("total-pacientes").textContent =
    pacientes.length;

    document.getElementById("total-visitas").textContent =
    visitas.length;

    document.getElementById("total-permanentes").textContent =
    visitas.filter(v=>v.tipo==="Permanente").length;

    document.getElementById("total-temporales").textContent =
    visitas.filter(v=>v.tipo==="Temporal").length;

}

function renderVisitas(){

    const tbody = document.getElementById("tbody-visitas");

    if(!tbody) return;

    tbody.innerHTML = "";

    visitas.forEach((visita, indice)=>{

        tbody.innerHTML += `
        <tr data-estado="${(visita.tipo || '').toLowerCase()}">

            <td>${visita.paciente || ""}</td>

            <td>${visita.nombreVisitante || ""} ${visita.apellidoVisitante || ""}</td>

            <td>${visita.dni || ""}</td>

            <td>${visita.telefono || ""}</td>

            <td>${visita.parentesco || ""}</td>

            <td>${visita.fecha || ""}</td>

            <td>
                <span class="badge ${(visita.tipo || '').toLowerCase() === 'permanente' ? 'badge-permanente' : 'badge-temporal'}">
                    ${visita.tipo || ""}
                </span>
            </td>

            <td>

                <div class="menu-wrap">

                    <button class="dots-btn"
                    onclick="toggleMenu(this)">
                        <i class="ti ti-dots-vertical"></i>
                    </button>

                    <div class="dropdown-menu">

                        <div class="dropdown-item"
                        onclick="verDetallesVisita(${indice})">
                            <i class="ti ti-eye"></i>
                            Ver detalle
                        </div>

                        <div class="dropdown-item"
                        onclick="abrirEditarVisita(${indice})">
                            <i class="ti ti-edit"></i>
                            Editar
                        </div>

                        <div class="dropdown-item danger"
                        onclick="eliminarVisita(${indice})">
                            <i class="ti ti-trash"></i>
                            Eliminar
                        </div>

                    </div>

                </div>

            </td>

        </tr>
        `;

    });

}

function renderProximasVisitas(){

    const contenedor = document.getElementById("proximas-visitas");

    if(!contenedor) return;

    contenedor.innerHTML = "";

    visitas.forEach(visita=>{

        contenedor.innerHTML += `

        <div class="visit-item">

            <div>

                <div class="visit-name">

                    ${visita.nombreVisitante}
                    ${visita.apellidoVisitante}

                </div>

                <div class="visit-patient">

                    ${visita.paciente}

                </div>

            </div>

            <div class="visit-time">

                ${visita.fecha}

            </div>

        </div>

        `;

    });

}

// ── Helper: recargar todo desde la API ──────────────────
async function recargarTodo() {
  await cargarDatos();
  renderPacientes();
  renderVisitas();
  renderCards();
  renderProximasVisitas();
  renderGrafico();
  cargarPacientesEnSelect();
}

// ── PACIENTES ────────────────────────────────────────────

async function guardarPaciente() {
  const datos = {
    nombre:          document.getElementById("paciente-nombre").value,
    documento:       document.getElementById("paciente-documento").value,
    fechaNacimiento: document.getElementById("paciente-fecha-nacimiento").value,
    genero:          document.getElementById("paciente-genero").value,
    sangre:          document.getElementById("paciente-sangre").value,
    telefono:        document.getElementById("paciente-telefono").value,
    email:           document.getElementById("paciente-email").value,
    direccion:       document.getElementById("paciente-direccion").value,
    habitacion:      document.getElementById("paciente-habitacion").value,
    cama:            document.getElementById("paciente-cama").value,
    alergias:        document.getElementById("paciente-alergias").value,
  };
  try {
    const res = await fetch(`${API_URL}/pacientes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    if (!res.ok) {
      const err = await res.json();
      alert('Error: ' + err.error);
      return;
    }
    closeModal("modal-nuevo-paciente");
    await recargarTodo();
  } catch (e) {
    alert('No se pudo conectar al servidor.');
  }
}

function abrirEditarPaciente(indice) {
  indicePacienteEditando = indice;
  const p = pacientes[indice];
  document.getElementById("editar-paciente-nombre").value     = p.nombre      || '';
  document.getElementById("editar-paciente-documento").value  = p.documento   || '';
  document.getElementById("editar-paciente-fecha").value      = p.fechaNacimiento || '';
  document.getElementById("editar-paciente-genero").value     = p.genero      || '';
  document.getElementById("editar-paciente-sangre").value     = p.sangre      || '';
  document.getElementById("editar-paciente-telefono").value   = p.telefono    || '';
  document.getElementById("editar-paciente-email").value      = p.email       || '';
  document.getElementById("editar-paciente-direccion").value  = p.direccion   || '';
  document.getElementById("editar-paciente-habitacion").value = p.habitacion  || '';
  document.getElementById("editar-paciente-cama").value       = p.cama        || '';
  document.getElementById("editar-paciente-alergias").value   = p.alergias    || '';
  document.getElementById("editar-paciente-notas").value      = p.notas       || '';
  openModal("modal-editar-paciente");
}

function verDetallesPaciente(indice) {
  const paciente = pacientes[indice];

  const avatarEl = document.getElementById("detalle-avatar-letra");
  if (avatarEl) avatarEl.textContent = paciente.nombre ? paciente.nombre[0].toUpperCase() : "?";

  document.getElementById("detalle-nombre").textContent     = paciente.nombre    || "—";
  document.getElementById("detalle-documento").textContent  = paciente.documento || "—";
  document.getElementById("detalle-habitacion").textContent = paciente.habitacion || "?";
  document.getElementById("detalle-cama").textContent       = paciente.cama       || "?";

  const chipSangre = document.getElementById("detalle-chip-sangre");
  if (chipSangre) {
    if (paciente.sangre) {
      chipSangre.style.display = "";
      chipSangre.innerHTML = "🩸 " + paciente.sangre;
    } else {
      chipSangre.style.display = "none";
    }
  }

  document.getElementById("detalle-fecha").textContent     = paciente.fechaNacimiento || "—";
  document.getElementById("detalle-genero").textContent    = paciente.genero          || "—";
  document.getElementById("detalle-telefono").textContent  = paciente.telefono        || "—";
  document.getElementById("detalle-email").textContent     = paciente.email           || "—";
  document.getElementById("detalle-direccion").textContent = paciente.direccion       || "—";
  document.getElementById("detalle-alergias").textContent  = paciente.alergias || "Sin alergias registradas";
  document.getElementById("detalle-notas").textContent     = paciente.notas    || "Sin notas clínicas";

  const visitasLista = document.getElementById("detalle-visitas-lista");
  if (visitasLista) {
    const visitasPaciente = visitas.filter(v => v.paciente === paciente.nombre);
    if (visitasPaciente.length === 0) {
      visitasLista.innerHTML = `<div class="detalle-sin-visitas"><i class="ti ti-calendar-off"></i> Sin visitas registradas</div>`;
    } else {
      visitasLista.innerHTML = visitasPaciente.map(v => {
        const tipoBadge = (v.tipo || '').toLowerCase() === 'permanente' ? 'badge-permanente' : 'badge-temporal';
        return `<div class="detalle-visita-item">
          <div>
            <div class="detalle-visita-nombre">${v.nombreVisitante||''} ${v.apellidoVisitante||''}</div>
            <div class="detalle-visita-meta">
              <span><i class="ti ti-id-badge"></i> ${v.dni||'—'}</span>
              <span><i class="ti ti-phone"></i> ${v.telefono||'—'}</span>
              <span><i class="ti ti-users"></i> ${v.parentesco||'—'}</span>
              <span><i class="ti ti-calendar"></i> ${v.fecha||'—'}</span>
            </div>
          </div>
          <span class="badge ${tipoBadge}">${v.tipo||''}</span>
        </div>`;
      }).join('');
    }
  }

  openModal("modal-detalles-paciente");
}

async function guardarEdicionPaciente() {
  const p = pacientes[indicePacienteEditando];
  const datos = {
    nombre:          document.getElementById("editar-paciente-nombre").value,
    documento:       document.getElementById("editar-paciente-documento").value,
    fechaNacimiento: document.getElementById("editar-paciente-fecha").value,
    genero:          document.getElementById("editar-paciente-genero").value,
    sangre:          document.getElementById("editar-paciente-sangre").value,
    telefono:        document.getElementById("editar-paciente-telefono").value,
    email:           document.getElementById("editar-paciente-email").value,
    direccion:       document.getElementById("editar-paciente-direccion").value,
    habitacion:      document.getElementById("editar-paciente-habitacion").value,
    cama:            document.getElementById("editar-paciente-cama").value,
    alergias:        document.getElementById("editar-paciente-alergias").value,
    notas:           document.getElementById("editar-paciente-notas").value,
  };
  try {
    const res = await fetch(`${API_URL}/pacientes/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    if (!res.ok) { const e = await res.json(); alert('Error: ' + e.error); return; }
    closeModal("modal-editar-paciente");
    await recargarTodo();
  } catch (e) {
    alert('No se pudo conectar al servidor.');
  }
}

async function eliminarPaciente(indice) {
  const p = pacientes[indice];
  if (!confirm(`¿Eliminar a ${p.nombre}? También se eliminarán sus visitas.`)) return;
  try {
    const res = await fetch(`${API_URL}/pacientes/${p.id}`, { method: 'DELETE' });
    if (!res.ok) { const e = await res.json(); alert('Error: ' + e.error); return; }
    await recargarTodo();
  } catch (e) {
    alert('No se pudo conectar al servidor.');
  }
}

// ── VISITAS ──────────────────────────────────────────────

async function guardarVisita() {
  const datos = {
    paciente:          document.getElementById("visita-paciente").value,
    nombreVisitante:   document.getElementById("visitante-nombre").value,
    apellidoVisitante: document.getElementById("visitante-apellido").value,
    telefono:          document.getElementById("visitante-telefono").value,
    domicilio:         document.getElementById("visitante-domicilio").value,
    dni:               document.getElementById("visita-dni").value,
    parentesco:        document.getElementById("visita-parentesco").value,
    fecha:             document.getElementById("visita-fecha").value,
    horaIngreso:       document.getElementById("visita-ingreso").value,
    horaSalida:        document.getElementById("visita-salida").value,
    tipo:              document.getElementById("visita-tipo").value,
    observaciones:     document.getElementById("visita-observaciones").value,
  };

  try {
    const res = await fetch(`${API_URL}/visitas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    if (!res.ok) { const e = await res.json(); alert('Error: ' + e.error); return; }
    closeModal("modal-nueva-visita");
    await recargarTodo();
    if (datos.tipo === "Permanente") {
      alert("La visita permanente fue registrada correctamente.")
    } else if (datos.tipo === "Temporal") {
      alert("La visita temporal fue registrada correctamente.");
    }{
      
    }
  } catch (e) {
    alert('No se pudo conectar al servidor.');
  }
}

function abrirEditarVisita(indice) {
  indiceVisitaEditando = indice;
  const v = visitas[indice];
  document.getElementById("editar-visita-paciente").value      = v.paciente           || '';
  document.getElementById("editar-visita-nombre").value        = v.nombreVisitante    || '';
  document.getElementById("editar-visita-apellido").value      = v.apellidoVisitante  || '';
  document.getElementById("editar-visita-telefono").value      = v.telefono           || '';
  document.getElementById("editar-visita-domicilio").value     = v.domicilio          || '';
  document.getElementById("editar-visita-dni").value           = v.dni               || '';
  document.getElementById("editar-visita-parentesco").value    = v.parentesco         || '';
  document.getElementById("editar-visita-fecha").value         = v.fecha             || '';
  document.getElementById("editar-visita-ingreso").value       = v.horaIngreso        || '';
  document.getElementById("editar-visita-salida").value        = v.horaSalida         || '';
  document.getElementById("editar-visita-tipo").value          = v.tipo              || '';
  document.getElementById("editar-visita-observaciones").value = v.observaciones      || '';
  openModal("modal-editar-visita");
}

async function guardarEdicionVisita() {
  const v = visitas[indiceVisitaEditando];
  const datos = {
    paciente:          document.getElementById("editar-visita-paciente").value,
    nombreVisitante:   document.getElementById("editar-visita-nombre").value,
    apellidoVisitante: document.getElementById("editar-visita-apellido").value,
    telefono:          document.getElementById("editar-visita-telefono").value,
    domicilio:         document.getElementById("editar-visita-domicilio").value,
    dni:               document.getElementById("editar-visita-dni").value,
    parentesco:        document.getElementById("editar-visita-parentesco").value,
    fecha:             document.getElementById("editar-visita-fecha").value,
    horaIngreso:       document.getElementById("editar-visita-ingreso").value,
    horaSalida:        document.getElementById("editar-visita-salida").value,
    tipo:              document.getElementById("editar-visita-tipo").value,
    observaciones:     document.getElementById("editar-visita-observaciones").value,
  };
  try {
    const res = await fetch(`${API_URL}/visitas/${v.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    if (!res.ok) { const e = await res.json(); alert('Error: ' + e.error); return; }
    closeModal("modal-editar-visita");
    await recargarTodo();
  } catch (e) {
    alert('No se pudo conectar al servidor.');
  }
}

async function eliminarVisita(indice) {
  const v = visitas[indice];
  if (!confirm('¿Eliminar esta visita?')) return;
  try {
    const res = await fetch(`${API_URL}/visitas/${v.id}`, { method: 'DELETE' });
    if (!res.ok) { const e = await res.json(); alert('Error: ' + e.error); return; }
    await recargarTodo();
  } catch (e) {
    alert('No se pudo conectar al servidor.');
  }
}


// ══════════════════════════════════════════
//  AUTENTICACIÓN — Administrador único
// ══════════════════════════════════════════

const AUTH_KEY     = 'medivisit_admin';
const AUTH_SESSION = 'medivisit_sesion';

// Obtiene el admin guardado (objeto único, no lista)
function authObtenerAdmin() {
    try {
        return JSON.parse(localStorage.getItem(AUTH_KEY)) || null;
    } catch(e) {
        return null;
    }
}

function authGuardarAdmin(admin) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(admin));
}

function authMostrarAlerta(msg, tipo) {
    const el = document.getElementById('auth-alert');
    el.textContent = msg;
    el.className = 'auth-alert visible ' + tipo;
}

function authOcultarAlerta() {
    const el = document.getElementById('auth-alert');
    el.className = 'auth-alert';
}

function authLimpiarErrores(ids) {
    ids.forEach(id => {
        const input = document.getElementById(id);
        const hint  = document.getElementById('err-' + id);
        if (input) input.classList.remove('input-error');
        if (hint)  hint.classList.remove('visible');
    });
}

function authMarcarError(id, msg) {
    const input = document.getElementById(id);
    const hint  = document.getElementById('err-' + id);
    if (input) input.classList.add('input-error');
    if (hint) {
        if (msg) hint.textContent = msg;
        hint.classList.add('visible');
    }
}

function authMostrarLogin() {
    document.getElementById('auth-panel-login').style.display    = '';
    document.getElementById('auth-panel-registro').style.display = 'none';
    authOcultarAlerta();
    authLimpiarErrores(['login-usuario','login-password']);
}

function authLogin() {
    authOcultarAlerta();
    authLimpiarErrores(['login-usuario','login-password']);

    const usuario  = document.getElementById('login-usuario').value.trim();
    const password = document.getElementById('login-password').value;

    let ok = true;
    if (!usuario)  { authMarcarError('login-usuario');  ok = false; }
    if (!password) { authMarcarError('login-password'); ok = false; }
    if (!ok) return;

    const admin = authObtenerAdmin();
    if (!admin || admin.usuario !== usuario || admin.password !== password) {
        authMostrarAlerta('Usuario o contraseña incorrectos.', 'error');
        return;
    }

    localStorage.setItem(AUTH_SESSION, JSON.stringify({ usuario: admin.usuario, nombre: admin.nombre }));
    document.getElementById('auth-screen').classList.add('hidden');
}

function authRegistrar() {
    // Bloqueo duro — si ya existe admin no se puede crear otro
    if (authObtenerAdmin()) {
        authMostrarAlerta('Ya existe un administrador registrado. No se puede crear otro.', 'error');
        return;
    }

    authOcultarAlerta();
    authLimpiarErrores(['reg-nombre','reg-usuario','reg-password','reg-password2']);

    const nombre    = document.getElementById('reg-nombre').value.trim();
    const usuario   = document.getElementById('reg-usuario').value.trim();
    const password  = document.getElementById('reg-password').value;
    const password2 = document.getElementById('reg-password2').value;

    let ok = true;
    if (!nombre)   { authMarcarError('reg-nombre');   ok = false; }
    if (!usuario)  { authMarcarError('reg-usuario');  ok = false; }
    if (password.length < 4) {
        authMarcarError('reg-password', 'Mínimo 4 caracteres.');
        ok = false;
    }
    if (password !== password2) {
        authMarcarError('reg-password2', 'Las contraseñas no coinciden.');
        ok = false;
    }
    if (!ok) return;

    authGuardarAdmin({ nombre, usuario, password });

    authMostrarAlerta('¡Administrador creado! Iniciá sesión.', 'success');
    document.getElementById('reg-nombre').value    = '';
    document.getElementById('reg-usuario').value   = '';
    document.getElementById('reg-password').value  = '';
    document.getElementById('reg-password2').value = '';

    // Ir al login después de crear
    setTimeout(() => authMostrarLogin(), 1500);
}

// ── Admin por defecto (credenciales fijas) ──────────────
// usuario: hospital2026  |  contraseña: 12345678
const ADMIN_DEFAULT = { nombre: 'Administrador', usuario: 'hospital2026', password: '12345678' };

(function authVerificarSesion() {
    // Forzar siempre las credenciales por defecto (sobreescribe cualquier admin anterior)
    authGuardarAdmin(ADMIN_DEFAULT);

    // Si hay sesión activa → entrar directo sin pedir login
    const sesion = localStorage.getItem(AUTH_SESSION);
    if (sesion) {
        document.getElementById('auth-screen').classList.add('hidden');
        return;
    }

    // Mostrar siempre el login (el admin por defecto ya existe)
    document.getElementById('auth-panel-login').style.display    = '';
    document.getElementById('auth-panel-registro').style.display = 'none';
})();

// Cerrar sesión — vuelve al login sin opción de crear cuenta
document.querySelector('.nav-bottom-item').addEventListener('click', function() {
    localStorage.removeItem(AUTH_SESSION);
    document.getElementById('auth-screen').classList.remove('hidden');
    authMostrarLogin();
    document.getElementById('login-usuario').value  = '';
    document.getElementById('login-password').value = '';
});

// ══════════════════════════════════════════
//  VALIDACIÓN DE CAMPOS OBLIGATORIOS
// ══════════════════════════════════════════

function validarCamposRequeridos(campos) {
    // campos: array de { id, hintId }
    let ok = true;
    campos.forEach(({ id, hintId }) => {
        const input = document.getElementById(id);
        const hint  = document.getElementById(hintId);
        if (!input) return;
        const vacio = input.value.trim() === '';
        input.classList.toggle('field-required-error', vacio);
        if (hint) hint.classList.toggle('visible', vacio);
        if (vacio) ok = false;
    });
    return ok;
}

// Validaciones campos obligatorios — wrappers async
const _gpOrig = guardarPaciente;
guardarPaciente = async function() {
    const ok = validarCamposRequeridos([
        { id: 'paciente-nombre',    hintId: 'hint-paciente-nombre' },
        { id: 'paciente-documento', hintId: 'hint-paciente-documento' },
        { id: 'paciente-direccion', hintId: 'hint-paciente-direccion' },
    ]);
    if (!ok) return;
    await _gpOrig();
};

const _gepOrig = guardarEdicionPaciente;
guardarEdicionPaciente = async function() {
    const ok = validarCamposRequeridos([
        { id: 'editar-paciente-nombre',    hintId: 'hint-editar-paciente-nombre' },
        { id: 'editar-paciente-documento', hintId: 'hint-editar-paciente-documento' },
        { id: 'editar-paciente-direccion', hintId: 'hint-editar-paciente-direccion' },
    ]);
    if (!ok) return;
    await _gepOrig();
};

const _gvOrig = guardarVisita;
guardarVisita = async function() {
    const ok = validarCamposRequeridos([
        { id: 'visitante-nombre',    hintId: 'hint-visitante-nombre' },
        { id: 'visitante-apellido',  hintId: 'hint-visitante-apellido' },
        { id: 'visitante-domicilio', hintId: 'hint-visitante-domicilio' },
        { id: 'visita-dni',          hintId: 'hint-visita-dni' },
    ]);
    if (!ok) return;
    await _gvOrig();
};

const _gevOrig = guardarEdicionVisita;
guardarEdicionVisita = async function() {
    const ok = validarCamposRequeridos([
        { id: 'editar-visita-nombre',    hintId: 'hint-editar-visita-nombre' },
        { id: 'editar-visita-apellido',  hintId: 'hint-editar-visita-apellido' },
        { id: 'editar-visita-domicilio', hintId: 'hint-editar-visita-domicilio' },
        { id: 'editar-visita-dni',       hintId: 'hint-editar-visita-dni' },
    ]);
    if (!ok) return;
    await _gevOrig();
}

function verDetallesVisita(indice) {
    const v = visitas[indice];
    if (!v) return;

    const nombre = (v.nombreVisitante || "") + " " + (v.apellidoVisitante || "");

    // Avatar
    const avatarEl = document.getElementById("dv-avatar");
    if (avatarEl) avatarEl.textContent = (v.nombreVisitante || "?")[0].toUpperCase();

    // Nombre y chips header
    document.getElementById("dv-nombre-completo").textContent = nombre.trim() || "—";
    document.getElementById("dv-dni").textContent = v.dni || "—";

    const badgeTipo = document.getElementById("dv-badge-tipo");
    if (badgeTipo) {
        const esPerm = (v.tipo || "").toLowerCase() === "permanente";
        badgeTipo.className = "detalle-chip " + (esPerm ? "chip-blood" : "chip-doc");
        badgeTipo.textContent = v.tipo || "—";
    }

    // Paciente
    document.getElementById("dv-paciente").textContent    = v.paciente    || "—";

    // Visitante
    document.getElementById("dv-telefono").textContent    = v.telefono    || "—";
    document.getElementById("dv-parentesco").textContent  = v.parentesco  || "—";
    document.getElementById("dv-domicilio").textContent   = v.domicilio   || "—";

    // Visita
    document.getElementById("dv-fecha").textContent        = v.fecha        || "—";
    document.getElementById("dv-tipo").textContent         = v.tipo         || "—";
    document.getElementById("dv-ingreso").textContent      = v.horaIngreso  || "—";
    document.getElementById("dv-salida").textContent       = v.horaSalida   || "—";
    document.getElementById("dv-observaciones").textContent = v.observaciones || "Sin observaciones";

    openModal("modal-detalle-visita");
}

;