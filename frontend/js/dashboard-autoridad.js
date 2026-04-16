let currentUser = null;
let dashboardReportes = [];
let dashboardUsuarios = [];

document.addEventListener('DOMContentLoaded', async () => {
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user || (user.rol !== 'autoridad' && user.rol !== 'admin')) {
        alert('No tienes permisos para entrar aquí.');
        window.location.href = 'foro.html';
        return;
    }

    currentUser = user;

    configurarFiltrosDashboard();
    await cargarDashboard();
    await cargarUsuarios();
});

function configurarFiltrosDashboard() {
    const search = document.getElementById('authoritySearch');
    const estado = document.getElementById('authorityEstadoFiltro');

    if (search) {
        search.addEventListener('input', renderizarReportesFiltrados);
    }

    if (estado) {
        estado.addEventListener('change', renderizarReportesFiltrados);
    }
}

async function cargarDashboard() {
    try {
        const response = await fetch('http://localhost:4000/api/dashboard/autoridad', {
            headers: {
                'x-user-role': currentUser.rol
            }
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || 'No se pudo cargar el dashboard');
            return;
        }

        dashboardReportes = Array.isArray(data.ultimosReportes) ? data.ultimosReportes : [];

        document.getElementById('dashTotal').innerText = data.totalReportes || 0;
        document.getElementById('dashPendientes').innerText = data.pendientes || 0;
        document.getElementById('dashProceso').innerText = data.enProceso || 0;
        document.getElementById('dashSolucionados').innerText = data.solucionados || 0;

        renderizarResumen('listaCategorias', data.porCategoria, 'categoria', 'total', 'reportes');
        renderizarResumen('listaUbicaciones', data.porUbicacion, 'ubicacion', 'total', 'reportes');
        renderizarUsuariosActivos(data.usuariosActivos || []);
        renderizarDias(data.porDia || []);
        renderizarReportesFiltrados();
    } catch (err) {
        console.error('Error dashboard:', err);
        alert('No se pudo cargar el dashboard');
    }
}

async function cargarUsuarios() {
    try {
        const response = await fetch('http://localhost:4000/api/admin/usuarios', {
            headers: {
                'x-user-role': currentUser.rol
            }
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || 'No se pudieron cargar los usuarios');
            return;
        }

        dashboardUsuarios = Array.isArray(data) ? data : [];
        renderizarUsuarios();
    } catch (err) {
        console.error('Error cargando usuarios:', err);
        alert('No se pudieron cargar los usuarios');
    }
}

function renderizarResumen(idContenedor, items, keyText, keyValue, suffix) {
    const contenedor = document.getElementById(idContenedor);
    if (!contenedor) return;

    contenedor.innerHTML = '';

    if (!items.length) {
        contenedor.innerHTML = `<div class="report-history-empty">No hay datos todavía.</div>`;
        return;
    }

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'quick-action';
        card.innerHTML = `
            <b>${escapeHTML(item[keyText] || '-')}</b>
            <span>${item[keyValue] || 0} ${suffix}</span>
        `;
        contenedor.appendChild(card);
    });
}

function renderizarUsuariosActivos(items) {
    const contenedor = document.getElementById('listaUsuariosActivos');
    if (!contenedor) return;

    contenedor.innerHTML = '';

    if (!items.length) {
        contenedor.innerHTML = `<div class="report-history-empty">No hay datos todavía.</div>`;
        return;
    }

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'quick-action';
        card.innerHTML = `
            <b>${escapeHTML(item.nombre)} ${escapeHTML(item.apellido || '')}</b>
            <span>${item.total || 0} reportes • ${escapeHTML(item.rol || 'ciudadano')}</span>
        `;
        contenedor.appendChild(card);
    });
}

function renderizarDias(items) {
    const contenedor = document.getElementById('listaDias');
    if (!contenedor) return;

    contenedor.innerHTML = '';

    if (!items.length) {
        contenedor.innerHTML = `<div class="report-history-empty">No hay datos todavía.</div>`;
        return;
    }

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'quick-action';
        card.innerHTML = `
            <b>${formatearFecha(item.dia)}</b>
            <span>${item.total || 0} reportes</span>
        `;
        contenedor.appendChild(card);
    });
}

function renderizarReportesFiltrados() {
    const search = document.getElementById('authoritySearch');
    const estado = document.getElementById('authorityEstadoFiltro');

    const texto = search ? search.value.trim().toLowerCase() : '';
    const estadoFiltro = estado ? estado.value : '';

    const filtrados = dashboardReportes.filter(reporte => {
        const coincideTexto =
            (reporte.titulo || '').toLowerCase().includes(texto) ||
            (reporte.ubicacion || '').toLowerCase().includes(texto) ||
            (reporte.nombre || '').toLowerCase().includes(texto) ||
            (reporte.apellido || '').toLowerCase().includes(texto);

        const coincideEstado = !estadoFiltro || reporte.estado === estadoFiltro;

        return coincideTexto && coincideEstado;
    });

    renderizarReportes(filtrados);
}

function renderizarReportes(reportes) {
    const contenedor = document.getElementById('tablaReportesAutoridad');
    if (!contenedor) return;

    if (!reportes.length) {
        contenedor.innerHTML = `<div class="report-history-empty">No hay reportes que coincidan.</div>`;
        return;
    }

    contenedor.innerHTML = `
        <div class="authority-table">
            <div class="authority-table-head">
                <div>Reporte</div>
                <div>Estado</div>
                <div>Respuesta</div>
                <div>Acciones</div>
            </div>
            <div class="authority-table-body">
                ${reportes.map(reporte => filaReporteHTML(reporte)).join('')}
            </div>
        </div>
    `;
}

function filaReporteHTML(reporte) {
    const claseEstado = (reporte.estado || 'pendiente').toLowerCase().replace(/\s+/g, '-');

    return `
        <div class="authority-row">
            <div class="authority-col authority-col-main">
                <div class="authority-report-title">${escapeHTML(reporte.titulo)}</div>
                <div class="authority-meta">
                    <span>${escapeHTML(reporte.nombre)} ${escapeHTML(reporte.apellido || '')}</span>
                    <span>•</span>
                    <span>${escapeHTML(reporte.ubicacion || '-')}</span>
                    <span>•</span>
                    <span>${formatearFecha(reporte.fecha_creacion)}</span>
                </div>
                <div class="authority-row-tags">
                    <span class="category-tag">${escapeHTML(reporte.categoria || 'General')}</span>
                </div>
                <div class="authority-row-desc">${escapeHTML(reporte.descripcion || '')}</div>
            </div>

            <div class="authority-col">
                <label class="authority-label">Estado</label>
                <select class="modal-input authority-select" onchange="cambiarEstado(${reporte.id}, this.value)">
                    <option value="pendiente" ${reporte.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                    <option value="en proceso" ${reporte.estado === 'en proceso' ? 'selected' : ''}>En proceso</option>
                    <option value="solucionado" ${reporte.estado === 'solucionado' ? 'selected' : ''}>Solucionado</option>
                </select>
                <span class="status-badge ${claseEstado}">${escapeHTML(reporte.estado)}</span>
            </div>

            <div class="authority-col authority-col-response">
                <label class="authority-label">Respuesta oficial</label>
                <textarea class="profile-textarea authority-response-text" id="respuesta-${reporte.id}" placeholder="Escribe una respuesta clara para el ciudadano...">${escapeHTML(reporte.respuesta_autoridad || '')}</textarea>
                <button class="btn-primary authority-btn-inline" type="button" onclick="guardarRespuesta(${reporte.id})">Guardar respuesta</button>
            </div>

            <div class="authority-col authority-col-actions">
                <label class="authority-label">Acciones</label>
                <button class="btn-login authority-action-btn" type="button" onclick="abrirEdicionReporte(${reporte.id})">Editar</button>
                <button class="btn-danger-soft authority-action-btn" type="button" onclick="eliminarReporteAutoridad(${reporte.id})">Eliminar</button>
            </div>
        </div>
    `;
}

function renderizarUsuarios() {
    const contenedor = document.getElementById('tablaUsuariosRoles');
    if (!contenedor) return;

    if (!dashboardUsuarios.length) {
        contenedor.innerHTML = `<div class="report-history-empty">No hay usuarios.</div>`;
        return;
    }

    contenedor.innerHTML = `
        <div class="authority-table">
            <div class="authority-table-head authority-table-head-users">
                <div>Usuario</div>
                <div>Correo</div>
                <div>Rol</div>
                <div>Teléfono</div>
            </div>
            <div class="authority-table-body">
                ${dashboardUsuarios.map(usuario => `
                    <div class="authority-row authority-row-users">
                        <div class="authority-user-cell">
                            <b>${escapeHTML(usuario.nombre)} ${escapeHTML(usuario.apellido || '')}</b>
                        </div>
                        <div class="authority-user-cell">${escapeHTML(usuario.email)}</div>
                        <div class="authority-user-cell">
                            <select class="modal-input authority-select" onchange="cambiarRol(${usuario.id}, this.value)">
                                <option value="ciudadano" ${usuario.rol === 'ciudadano' ? 'selected' : ''}>Ciudadano</option>
                                <option value="autoridad" ${usuario.rol === 'autoridad' ? 'selected' : ''}>Autoridad</option>
                                <option value="admin" ${usuario.rol === 'admin' ? 'selected' : ''}>Admin</option>
                            </select>
                        </div>
                        <div class="authority-user-cell">${escapeHTML(usuario.telefono || '—')}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

async function cambiarEstado(id, estado) {
    try {
        const response = await fetch(`http://localhost:4000/api/reportes/${id}/estado`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-user-role': currentUser.rol
            },
            body: JSON.stringify({ estado })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || 'No se pudo cambiar el estado');
            return;
        }

        await cargarDashboard();
    } catch (err) {
        console.error(err);
        alert('Error al actualizar el estado');
    }
}

async function guardarRespuesta(id) {
    const textarea = document.getElementById(`respuesta-${id}`);
    if (!textarea) return;

    const respuesta = textarea.value.trim();

    if (!respuesta) {
        alert('La respuesta no puede estar vacía.');
        return;
    }

    try {
        const response = await fetch(`http://localhost:4000/api/reportes/${id}/respuesta`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-user-role': currentUser.rol
            },
            body: JSON.stringify({ respuesta })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || 'No se pudo guardar la respuesta');
            return;
        }

        await cargarDashboard();
    } catch (err) {
        console.error(err);
        alert('Error al guardar la respuesta');
    }
}

async function cambiarRol(id, rol) {
    try {
        const response = await fetch(`http://localhost:4000/api/admin/usuarios/${id}/rol`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-user-role': currentUser.rol
            },
            body: JSON.stringify({ rol })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || 'No se pudo cambiar el rol');
            return;
        }

        await cargarUsuarios();
    } catch (err) {
        console.error(err);
        alert('Error al actualizar el rol');
    }
}

function abrirEdicionReporte(id) {
    window.location.href = `foro.html?edit=${id}`;
}

async function eliminarReporteAutoridad(id) {
    const confirmar = confirm('¿Seguro que quieres eliminar este reporte?');
    if (!confirmar) return;

    try {
        const response = await fetch(`http://localhost:4000/api/reportes/${id}`, {
            method: 'DELETE',
            headers: {
                'x-user-id': currentUser.id,
                'x-user-role': currentUser.rol
            }
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || 'No se pudo eliminar');
            return;
        }

        await cargarDashboard();
    } catch (err) {
        console.error(err);
        alert('No se pudo eliminar el reporte');
    }
}

function cerrarSesion() {
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

function formatearFecha(fecha) {
    if (!fecha) return '-';
    const d = new Date(fecha);
    if (Number.isNaN(d.getTime())) return '-';

    return d.toLocaleDateString('es-DO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function escapeHTML(valor) {
    return String(valor)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}