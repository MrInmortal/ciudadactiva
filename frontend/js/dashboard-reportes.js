let authorityUser = null;
let reportesAuthority = [];
let reporteActivo = null;

document.addEventListener('DOMContentLoaded', async () => {
    const user = requireAuthority();
    if (!user) return;

    authorityUser = user;

    renderAuthoritySidebar('reportes');
    renderAuthorityMobileTop('Reportes');

    configurarFiltros();
    configurarModal();
    await cargarReportes();
});

function configurarFiltros() {
    const search = document.getElementById('reportSearch');
    const estado = document.getElementById('reportEstadoFilter');

    if (search) search.addEventListener('input', renderizarReportesFiltrados);
    if (estado) estado.addEventListener('change', renderizarReportesFiltrados);
}

function configurarModal() {
    const overlay = document.getElementById('editReportModal');
    const closeBtn = document.getElementById('closeEditReportModal');

    if (closeBtn) {
        closeBtn.addEventListener('click', cerrarModalReporte);
    }

    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                cerrarModalReporte();
            }
        });
    }
}

async function cargarReportes() {
    try {
        const response = await fetch('http://localhost:4000/api/dashboard/reportes', {
            headers: {
                'x-user-id': authorityUser.id,
                'x-user-role': authorityUser.rol
            }
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || 'No se pudieron cargar los reportes');
            return;
        }

        reportesAuthority = Array.isArray(data) ? data : [];
        renderizarReportesFiltrados();
    } catch (err) {
        console.error(err);
        alert('No se pudieron cargar los reportes');
    }
}

function renderizarReportesFiltrados() {
    const search = document.getElementById('reportSearch');
    const estado = document.getElementById('reportEstadoFilter');

    const texto = search ? search.value.trim().toLowerCase() : '';
    const estadoFiltro = estado ? estado.value : '';

    const filtrados = reportesAuthority.filter(reporte => {
        const matchText =
            (reporte.titulo || '').toLowerCase().includes(texto) ||
            (reporte.ubicacion || '').toLowerCase().includes(texto) ||
            (reporte.nombre || '').toLowerCase().includes(texto) ||
            (reporte.apellido || '').toLowerCase().includes(texto) ||
            (reporte.descripcion || '').toLowerCase().includes(texto);

        const matchEstado = !estadoFiltro || reporte.estado === estadoFiltro;

        return matchText && matchEstado;
    });

    actualizarMiniStats(filtrados);
    renderizarReportes(filtrados);
}

function actualizarMiniStats(reportes) {
    const total = reportes.length;
    const pendientes = reportes.filter(r => r.estado === 'pendiente').length;
    const proceso = reportes.filter(r => r.estado === 'en proceso').length;
    const solucionados = reportes.filter(r => r.estado === 'solucionado').length;

    const visible = document.getElementById('reportVisibleCount');
    const pend = document.getElementById('reportPendCount');
    const proc = document.getElementById('reportProcessCount');
    const sol = document.getElementById('reportSolvedCount');

    if (visible) visible.innerText = total;
    if (pend) pend.innerText = pendientes;
    if (proc) proc.innerText = proceso;
    if (sol) sol.innerText = solucionados;
}

function renderizarReportes(reportes) {
    const contenedor = document.getElementById('reportList');
    if (!contenedor) return;

    if (!reportes.length) {
        contenedor.innerHTML = `<div class="authority-empty">No hay reportes que coincidan con la búsqueda.</div>`;
        return;
    }

    contenedor.innerHTML = reportes.map(reporte => {
        const claseEstado = (reporte.estado || 'pendiente').toLowerCase().replace(/\s+/g, '-');

        return `
            <div class="authority-report-table-row">
                <div class="cell-name">
                    <div class="report-row-title">${escapeHTML(reporte.titulo || 'Sin título')}</div>
                    <div class="report-row-desc">${escapeHTML(reporte.descripcion || '')}</div>
                </div>

                <div>
                    <span class="category-tag">${escapeHTML(reporte.categoria || 'General')}</span>
                </div>

                <div>
                    <span class="status-badge ${claseEstado}">${escapeHTML(reporte.estado || 'pendiente')}</span>
                </div>

                <div>${escapeHTML(reporte.ubicacion || '-')}</div>

                <div>${escapeHTML((reporte.nombre || '') + ' ' + (reporte.apellido || ''))}</div>

                <div>${formatearFecha(reporte.fecha_creacion)}</div>

                <div class="report-row-actions">
                    <button class="btn-login report-row-btn" type="button" onclick="abrirModalReporte(${reporte.id})">Editar</button>
                    <button class="btn-danger-soft report-row-btn" type="button" onclick="eliminarReporteAuthority(${reporte.id})">Eliminar</button>
                </div>
            </div>
        `;
    }).join('');
}

function abrirModalReporte(id) {
    const reporte = reportesAuthority.find(r => Number(r.id) === Number(id));
    if (!reporte) return;

    reporteActivo = reporte;

    const body = document.getElementById('editReportModalBody');
    const overlay = document.getElementById('editReportModal');
    if (!body || !overlay) return;

    const claseEstado = (reporte.estado || 'pendiente').toLowerCase().replace(/\s+/g, '-');

    body.innerHTML = `
        <div class="authority-modal-summary">
            <div class="summary-item">
                <small>Nombre</small>
                <strong>${escapeHTML(reporte.titulo || 'Sin título')}</strong>
            </div>
            <div class="summary-item">
                <small>Categoría</small>
                <strong>${escapeHTML(reporte.categoria || 'General')}</strong>
            </div>
            <div class="summary-item">
                <small>Ubicación</small>
                <strong>${escapeHTML(reporte.ubicacion || '-')}</strong>
            </div>
            <div class="summary-item">
                <small>Creado por</small>
                <strong>${escapeHTML((reporte.nombre || '') + ' ' + (reporte.apellido || ''))}</strong>
            </div>
            <div class="summary-item">
                <small>Fecha</small>
                <strong>${formatearFecha(reporte.fecha_creacion)}</strong>
            </div>
            <div class="summary-item">
                <small>Estado actual</small>
                <strong><span class="status-badge ${claseEstado}">${escapeHTML(reporte.estado || 'pendiente')}</span></strong>
            </div>
        </div>

        <div class="authority-modal-grid">
            <div class="authority-modal-block">
                <label class="authority-cell-label">Estado</label>
                <select id="modalEstadoReporte" class="modal-input">
                    <option value="pendiente" ${reporte.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                    <option value="en proceso" ${reporte.estado === 'en proceso' ? 'selected' : ''}>En proceso</option>
                    <option value="solucionado" ${reporte.estado === 'solucionado' ? 'selected' : ''}>Solucionado</option>
                </select>
            </div>

            <div class="authority-modal-block authority-modal-block-full">
                <label class="authority-cell-label">Respuesta oficial</label>
                <textarea id="modalRespuestaReporte" class="profile-textarea authority-response-area" placeholder="Escribe una respuesta clara para el ciudadano...">${escapeHTML(reporte.respuesta_autoridad || '')}</textarea>
            </div>
        </div>

        <div class="authority-modal-actions">
            <button class="btn-primary" type="button" onclick="guardarCambiosModalReporte()">Guardar cambios</button>
            <button class="btn-danger-soft" type="button" onclick="eliminarReporteAuthority(${reporte.id})">Eliminar reporte</button>
        </div>
    `;

    overlay.classList.add('open');
}

function cerrarModalReporte() {
    const overlay = document.getElementById('editReportModal');
    if (overlay) overlay.classList.remove('open');
    reporteActivo = null;
}

async function guardarCambiosModalReporte() {
    if (!reporteActivo) return;

    const estado = document.getElementById('modalEstadoReporte')?.value || '';
    const respuesta = document.getElementById('modalRespuestaReporte')?.value.trim() || '';

    try {
        if (estado && estado !== reporteActivo.estado) {
            const estadoResponse = await fetch(`http://localhost:4000/api/reportes/${reporteActivo.id}/estado`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': authorityUser.id,
                    'x-user-role': authorityUser.rol
                },
                body: JSON.stringify({ estado })
            });

            const estadoData = await estadoResponse.json();
            if (!estadoResponse.ok) {
                alert(estadoData.error || 'No se pudo actualizar el estado');
                return;
            }
        }

        if (respuesta) {
            const respResponse = await fetch(`http://localhost:4000/api/reportes/${reporteActivo.id}/respuesta`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': authorityUser.id,
                    'x-user-role': authorityUser.rol
                },
                body: JSON.stringify({ respuesta })
            });

            const respData = await respResponse.json();
            if (!respResponse.ok) {
                alert(respData.error || 'No se pudo guardar la respuesta');
                return;
            }
        }

        cerrarModalReporte();
        await cargarReportes();
    } catch (err) {
        console.error(err);
        alert('No se pudieron guardar los cambios');
    }
}

async function eliminarReporteAuthority(id) {
    const confirmar = confirm('¿Seguro que quieres eliminar este reporte?');
    if (!confirmar) return;

    try {
        const response = await fetch(`http://localhost:4000/api/reportes/${id}`, {
            method: 'DELETE',
            headers: {
                'x-user-id': authorityUser.id,
                'x-user-role': authorityUser.rol
            }
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || 'No se pudo eliminar el reporte');
            return;
        }

        cerrarModalReporte();
        await cargarReportes();
    } catch (err) {
        console.error(err);
        alert('No se pudo eliminar el reporte');
    }
}