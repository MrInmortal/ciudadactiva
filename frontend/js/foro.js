let reportesGlobal = [];
let currentUser = null;
let editReportId = null;

document.addEventListener('DOMContentLoaded', () => {
    const usuario = JSON.parse(localStorage.getItem('user'));

    if (!usuario || !usuario.id) {
        alert('Debes iniciar sesión para acceder al foro.');
        window.location.href = 'login.html';
        return;
    }

    currentUser = usuario;

    renderizarAvatarHeader(usuario);

    const userNameFull = document.getElementById('userNameFull');
    const userRoleText = document.getElementById('userRoleText');
    const linkDashboard = document.getElementById('linkDashboardAutoridad');

    if (userNameFull) userNameFull.innerText = `${usuario.nombre} ${usuario.apellido || ''}`.trim();
    if (userRoleText) userRoleText.innerText = capitalizar(usuario.rol || 'ciudadano');

    if (linkDashboard && (usuario.rol === 'autoridad' || usuario.rol === 'admin')) {
        linkDashboard.style.display = 'block';
    }

    configurarModal();
    configurarFormularioReporte();
    configurarPreviewImagen();
    configurarFiltros();
    configurarNotificaciones();
    obtenerReportes();
    cargarNotificaciones();
    revisarModoEdicionDesdeURL();
});

function renderizarAvatarHeader(usuario) {
    const userInitial = document.getElementById('userInitial');
    const userInitialMini = document.getElementById('userInitialMini');

    const inicial = (usuario.nombre || 'U').charAt(0).toUpperCase();

    if (usuario.foto_perfil) {
        if (userInitial) {
            userInitial.innerHTML = `<img src="${escapeHTML(usuario.foto_perfil)}" alt="Foto de perfil" class="avatar-img">`;
        }
        if (userInitialMini) {
            userInitialMini.innerHTML = `<img src="${escapeHTML(usuario.foto_perfil)}" alt="Foto de perfil" class="avatar-img">`;
        }
    } else {
        if (userInitial) userInitial.textContent = inicial;
        if (userInitialMini) userInitialMini.textContent = inicial;
    }
}

function configurarModal() {
    const modal = document.getElementById('modalReporte');
    const btnAbrir = document.getElementById('btnAbrirModal');
    const btnCerrar = document.getElementById('btnCerrarModal');
    const btnX = document.getElementById('btnCerrarX');

    if (!modal) return;

    const abrir = () => {
        prepararModalCrear();
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        modal.scrollTop = 0;
    };

    const cerrar = () => {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        limpiarFormularioReporte();
    };

    if (btnAbrir) {
        btnAbrir.addEventListener('click', abrir);
    }

    if (btnCerrar) {
        btnCerrar.addEventListener('click', cerrar);
    }

    if (btnX) {
        btnX.addEventListener('click', cerrar);
    }

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            cerrar();
        }
    });
}

function prepararModalCrear() {
    editReportId = null;

    const titulo = document.getElementById('modalFormTitle');
    const submit = document.getElementById('btnSubmitReporte');

    if (titulo) titulo.innerText = 'Crear Nuevo Reporte';
    if (submit) submit.innerText = 'Enviar Reporte';
}

function prepararModalEditar(reporte) {
    editReportId = reporte.id;

    const modal = document.getElementById('modalReporte');
    const titulo = document.getElementById('modalFormTitle');
    const submit = document.getElementById('btnSubmitReporte');

    if (titulo) titulo.innerText = 'Editar Reporte';
    if (submit) submit.innerText = 'Guardar cambios';

    document.getElementById('repTitulo').value = reporte.titulo || '';
    document.getElementById('repCategoria').value = reporte.categoria || 'Otros';
    document.getElementById('repUbicacion').value = reporte.ubicacion || '';
    document.getElementById('repDescripcion').value = reporte.descripcion || '';

    const preview = document.getElementById('previewImagen');
    if (preview && reporte.imagen) {
        preview.src = reporte.imagen;
        preview.style.display = 'block';
    }

    modal.classList.add('active');
document.body.style.overflow = 'hidden';
modal.scrollTop = 0;
}

function limpiarFormularioReporte() {
    const form = document.getElementById('formReporte');
    if (form) form.reset();

    const preview = document.getElementById('previewImagen');
    if (preview) {
        preview.src = '';
        preview.style.display = 'none';
    }

    const nombre = document.getElementById('repImagenNombre');
    if (nombre) nombre.innerText = 'Ningún archivo seleccionado';

    prepararModalCrear();
}

function configurarPreviewImagen() {
    const input = document.getElementById('repImagen');
    const preview = document.getElementById('previewImagen');
    const nombre = document.getElementById('repImagenNombre');

    if (!input || !preview) return;

    input.addEventListener('change', () => {
        const archivo = input.files[0];

        if (nombre) {
            nombre.innerText = archivo ? archivo.name : 'Ningún archivo seleccionado';
        }

        if (!archivo) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(archivo);
    });
}

function configurarFiltros() {
    const buscador = document.getElementById('buscadorReportes');
    const filtroEstado = document.getElementById('filtroEstado');

    if (buscador) buscador.addEventListener('input', aplicarFiltros);
    if (filtroEstado) filtroEstado.addEventListener('change', aplicarFiltros);
}

function configurarNotificaciones() {
    const btn = document.getElementById('btnNotificaciones');
    const panel = document.getElementById('notificationPanel');

    if (!btn || !panel) return;

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        panel.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
        if (!panel.contains(e.target) && !btn.contains(e.target)) {
            panel.classList.remove('open');
        }
    });
}

async function cargarNotificaciones() {
    try {
        const response = await fetch(`/api/notificaciones/${currentUser.id}`);
        const data = await response.json();

        if (!response.ok) {
            console.error(data);
            return;
        }

        renderizarNotificaciones(data);
    } catch (err) {
        console.error('Error cargando notificaciones:', err);
    }
}

function renderizarNotificaciones(notificaciones) {
    const panel = document.getElementById('notificationPanel');
    const count = document.getElementById('notificationCount');

    if (!panel || !count) return;

    const unread = notificaciones.filter(n => !n.leida).length;

    if (unread > 0) {
        count.style.display = 'flex';
        count.innerText = unread;
    } else {
        count.style.display = 'none';
    }

    if (!notificaciones.length) {
        panel.innerHTML = `<div class="notification-empty">No tienes notificaciones.</div>`;
        return;
    }

    panel.innerHTML = '';

    const markAll = document.createElement('button');
    markAll.className = 'btn-outline-history';
    markAll.style.width = '100%';
    markAll.style.marginBottom = '10px';
    markAll.innerText = 'Marcar todas como leídas';
    markAll.addEventListener('click', async () => {
        await fetch(`/api/notificaciones/usuario/${currentUser.id}/leidas`, {
            method: 'PUT'
        });
        await cargarNotificaciones();
    });

    panel.appendChild(markAll);

    notificaciones.forEach(n => {
        const item = document.createElement('div');
        item.className = `notification-item ${n.leida ? '' : 'unread'}`;

        item.innerHTML = `
            <b>${escapeHTML(n.titulo)}</b>
            <p>${escapeHTML(n.mensaje)}</p>
            <small>${formatearFechaHora(n.fecha_creacion)}</small>
        `;

        item.addEventListener('click', async () => {
            if (!n.leida) {
                await fetch(`/api/notificaciones/${n.id}/leida`, {
                    method: 'PUT'
                });
                await cargarNotificaciones();
            }
        });

        panel.appendChild(item);
    });
}

async function obtenerReportes() {
    try {
        const res = await fetch('/api/reportes');
        const reportes = await res.json();

        if (!Array.isArray(reportes)) {
            console.error('La API no devolvió un arreglo:', reportes);
            return;
        }

        reportesGlobal = reportes;
        renderizarReportes(reportesGlobal);
    } catch (err) {
        console.error('Error cargando el foro:', err);
    }
}

function aplicarFiltros() {
    const buscador = document.getElementById('buscadorReportes');
    const filtroEstado = document.getElementById('filtroEstado');

    const texto = buscador ? buscador.value.trim().toLowerCase() : '';
    const estado = filtroEstado ? filtroEstado.value : '';

    const filtrados = reportesGlobal.filter(reporte => {
        const coincideTexto =
            (reporte.titulo || '').toLowerCase().includes(texto) ||
            (reporte.categoria || '').toLowerCase().includes(texto) ||
            (reporte.ubicacion || '').toLowerCase().includes(texto);

        const coincideEstado = !estado || reporte.estado === estado;

        return coincideTexto && coincideEstado;
    });

    renderizarReportes(filtrados);
}

function renderizarReportes(reportes) {
    const contenedor = document.getElementById('contenedorReportes');
    if (!contenedor) return;

    contenedor.innerHTML = '';

    reportes.forEach(reporte => {
        const card = document.createElement('div');
        card.className = 'card-reporte';

        const claseEstado = (reporte.estado || 'pendiente').toLowerCase().replace(/\s+/g, '-');
        const imagenHTML = reporte.imagen ? `<img src="${escapeHTML(reporte.imagen)}" alt="Imagen del reporte">` : '';

        const respuestaHTML = reporte.respuesta_autoridad
            ? `
                <div class="respuesta-autoridad-box">
                    <b>Respuesta de autoridad</b>
                    <p>${escapeHTML(reporte.respuesta_autoridad)}</p>
                    <small>${formatearFechaHora(reporte.fecha_respuesta)}</small>
                </div>
            `
            : '';

        const puedeGestionar =
            currentUser &&
            (currentUser.id === reporte.usuario_id || currentUser.rol === 'autoridad' || currentUser.rol === 'admin');

        const accionesHTML = puedeGestionar
            ? `
                <div class="report-card-actions">
                    <button class="btn-login report-action-btn" type="button" onclick="editarReporte(${reporte.id})">Editar</button>
                    <button class="btn-danger-soft report-action-btn" type="button" onclick="eliminarReporte(${reporte.id})">Eliminar</button>
                </div>
            `
            : '';

        card.innerHTML = `
            ${imagenHTML}
            <div class="card-body">
                <div class="card-header-info">
                    <span class="category-tag">${escapeHTML(reporte.categoria || 'General')}</span>
                    <span class="status-badge ${claseEstado}">${escapeHTML(reporte.estado || 'pendiente')}</span>
                </div>
                <h3>${escapeHTML(reporte.titulo)}</h3>
                <p>${escapeHTML(reporte.descripcion)}</p>
                <div class="card-footer">
                    <span>📍 ${escapeHTML(reporte.ubicacion)}</span>
                </div>
                ${respuestaHTML}
                ${accionesHTML}
            </div>
        `;

        contenedor.appendChild(card);
    });

    actualizarEstadisticas();
}

function actualizarEstadisticas() {
    const total = reportesGlobal.length;
    const pendientes = reportesGlobal.filter(r => r.estado === 'pendiente').length;
    const enProceso = reportesGlobal.filter(r => r.estado === 'en proceso').length;
    const solucionados = reportesGlobal.filter(r => r.estado === 'solucionado').length;

    const statTotal = document.getElementById('statTotal');
    const statPendientes = document.getElementById('statPendientes');
    const statProceso = document.getElementById('statProceso');
    const statSolucionados = document.getElementById('statSolucionados');

    if (statTotal) statTotal.innerText = total;
    if (statPendientes) statPendientes.innerText = pendientes;
    if (statProceso) statProceso.innerText = enProceso;
    if (statSolucionados) statSolucionados.innerText = solucionados;
}

function configurarFormularioReporte() {
    const formReporte = document.getElementById('formReporte');
    if (!formReporte) return;

    formReporte.addEventListener('submit', async (e) => {
        e.preventDefault();

        const tituloEl = document.getElementById('repTitulo');
        const categoriaEl = document.getElementById('repCategoria');
        const ubicacionEl = document.getElementById('repUbicacion');
        const descripcionEl = document.getElementById('repDescripcion');
        const imagenEl = document.getElementById('repImagen');

        const formData = new FormData();
        formData.append('titulo', tituloEl ? tituloEl.value.trim() : '');
        formData.append('categoria', categoriaEl ? categoriaEl.value : 'Otros');
        formData.append('ubicacion', ubicacionEl ? ubicacionEl.value.trim() : '');
        formData.append('descripcion', descripcionEl ? descripcionEl.value.trim() : '');

        if (imagenEl && imagenEl.files && imagenEl.files[0]) {
            formData.append('imagen', imagenEl.files[0]);
        }

        try {
            let response;

            if (editReportId) {
                response = await fetch(`/api/reportes/${editReportId}`, {
                    method: 'PUT',
                    headers: {
                        'x-user-id': currentUser.id,
                        'x-user-role': currentUser.rol
                    },
                    body: formData
                });
            } else {
                formData.append('usuario_id', Number(currentUser.id));
                response = await fetch('/api/reportes', {
                    method: 'POST',
                    body: formData
                });
            }

            const resultado = await response.json();

            if (response.ok) {
                alert(editReportId ? 'Reporte actualizado con éxito.' : 'Reporte creado con éxito.');
                limpiarFormularioReporte();

                const modal = document.getElementById('modalReporte');
                if (modal) modal.style.display = 'none';

                await obtenerReportes();
            } else {
                alert('Error: ' + (resultado.error || 'No se pudo guardar el reporte'));
            }
        } catch (err) {
            console.error('Error al enviar reporte:', err);
            alert('No se pudo enviar el reporte.');
        }
    });
}

function editarReporte(id) {
    const reporte = reportesGlobal.find(r => Number(r.id) === Number(id));
    if (!reporte) return;

    prepararModalEditar(reporte);
}

async function eliminarReporte(id) {
    const confirmar = confirm('¿Seguro que quieres eliminar este reporte?');
    if (!confirmar) return;

    try {
        const response = await fetch(`/api/reportes/${id}`, {
            method: 'DELETE',
            headers: {
                'x-user-id': currentUser.id,
                'x-user-role': currentUser.rol
            }
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || 'No se pudo eliminar el reporte');
            return;
        }

        await obtenerReportes();
    } catch (err) {
        console.error(err);
        alert('No se pudo eliminar el reporte');
    }
}

function revisarModoEdicionDesdeURL() {
    const params = new URLSearchParams(window.location.search);
    const edit = params.get('edit');

    if (!edit) return;

    const espera = setInterval(() => {
        const reporte = reportesGlobal.find(r => Number(r.id) === Number(edit));
        if (reporte) {
            clearInterval(espera);
            prepararModalEditar(reporte);
        }
    }, 200);

    setTimeout(() => clearInterval(espera), 4000);
}

function cerrarSesion() {
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

function capitalizar(texto) {
    if (!texto) return '';
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function formatearFechaHora(fecha) {
    if (!fecha) return '-';

    const d = new Date(fecha);
    if (Number.isNaN(d.getTime())) return '-';

    return d.toLocaleString('es-DO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
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