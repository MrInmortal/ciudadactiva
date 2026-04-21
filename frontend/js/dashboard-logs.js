let adminUser = null;
let logsGlobal = [];

document.addEventListener('DOMContentLoaded', async () => {
    const user = requireAdmin();
    if (!user) return;

    adminUser = user;

    renderAuthoritySidebar('logs');
    renderAuthorityMobileTop('Logs del sistema');

    configurarFiltrosLogs();
    await cargarLogs();
});

function configurarFiltrosLogs() {
    const search = document.getElementById('logsSearch');
    const accion = document.getElementById('logsAccionFilter');
    const entidad = document.getElementById('logsEntidadFilter');

    if (search) search.addEventListener('input', renderizarLogsFiltrados);
    if (accion) accion.addEventListener('change', renderizarLogsFiltrados);
    if (entidad) entidad.addEventListener('change', renderizarLogsFiltrados);
}

async function cargarLogs() {
    try {
        const response = await fetch('/api/admin/logs', {
            headers: {
                'x-user-id': adminUser.id,
                'x-user-role': adminUser.rol
            }
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || 'No se pudieron cargar los logs');
            return;
        }

        logsGlobal = Array.isArray(data) ? data : [];
        renderizarLogsFiltrados();
    } catch (err) {
        console.error(err);
        alert('No se pudieron cargar los logs');
    }
}

function renderizarLogsFiltrados() {
    const search = document.getElementById('logsSearch')?.value.trim().toLowerCase() || '';
    const accion = document.getElementById('logsAccionFilter')?.value || '';
    const entidad = document.getElementById('logsEntidadFilter')?.value || '';

    const filtrados = logsGlobal.filter((log) => {
        const matchSearch =
            (log.actor_nombre || '').toLowerCase().includes(search) ||
            (log.actor_email || '').toLowerCase().includes(search) ||
            (log.descripcion || '').toLowerCase().includes(search);

        const matchAccion = !accion || log.accion === accion;
        const matchEntidad = !entidad || log.entidad === entidad;

        return matchSearch && matchAccion && matchEntidad;
    });

    actualizarStatsLogs(filtrados);
    renderizarLogs(filtrados);
}

function actualizarStatsLogs(logs) {
    const total = logs.length;
    const reportes = logs.filter((l) => l.entidad === 'reporte').length;
    const usuarios = logs.filter((l) => l.entidad === 'usuario').length;
    const comentarios = logs.filter((l) => l.entidad === 'comentario').length;

    const totalEl = document.getElementById('logsTotalCount');
    const reportesEl = document.getElementById('logsReportesCount');
    const usuariosEl = document.getElementById('logsUsuariosCount');
    const comentariosEl = document.getElementById('logsComentariosCount');

    if (totalEl) totalEl.innerText = total;
    if (reportesEl) reportesEl.innerText = reportes;
    if (usuariosEl) usuariosEl.innerText = usuarios;
    if (comentariosEl) comentariosEl.innerText = comentarios;
}

function renderizarLogs(logs) {
    const contenedor = document.getElementById('logsList');
    if (!contenedor) return;

    if (!logs.length) {
        contenedor.innerHTML = `<div class="authority-empty">No hay logs que coincidan con la búsqueda.</div>`;
        return;
    }

    contenedor.innerHTML = logs.map((log) => `
        <div class="logs-table-row">
            <div>${formatearFechaHora(log.fecha_creacion)}</div>
            <div class="logs-actor-cell">
                <strong>${escapeHTML(log.actor_nombre || 'Sistema')}</strong>
                <span>${escapeHTML(log.actor_email || '-')}</span>
            </div>
            <div>
                <span class="category-tag">${escapeHTML(log.actor_rol || '-')}</span>
            </div>
            <div>
                <span class="status-badge pendiente">${escapeHTML(log.accion)}</span>
            </div>
            <div>${escapeHTML(log.entidad || '-')}</div>
            <div class="logs-description-cell">${escapeHTML(log.descripcion || '-')}</div>
        </div>
    `).join('');
}