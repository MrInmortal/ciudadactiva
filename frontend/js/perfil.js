document.addEventListener('DOMContentLoaded', async () => {
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user || !user.id) {
        alert('Debes iniciar sesión.');
        window.location.href = 'login.html';
        return;
    }

    inicializarVista(user);
    await cargarPerfil(user.id);
    await cargarHistorial(user.id);
});

function inicializarVista(user) {
    const profileName = document.getElementById('profileName');
    const profileRole = document.getElementById('profileRole');
    const formNombre = document.getElementById('nombre');
    const formApellido = document.getElementById('apellido');
    const formEmail = document.getElementById('email');
    const formTelefono = document.getElementById('telefono');

    if (profileName) profileName.textContent = `${user.nombre} ${user.apellido || ''}`.trim();
    if (profileRole) profileRole.textContent = capitalizar(user.rol || 'ciudadano');

    if (formNombre) formNombre.value = user.nombre || '';
    if (formApellido) formApellido.value = user.apellido || '';
    if (formEmail) formEmail.value = user.email || '';
    if (formTelefono) formTelefono.value = user.telefono || '';

    renderizarAvatar(user);

    const formPerfil = document.getElementById('formPerfil');
    if (formPerfil) {
        formPerfil.addEventListener('submit', guardarPerfil);
    }

    const fotoInput = document.getElementById('foto_perfil');
    if (fotoInput) {
        fotoInput.addEventListener('change', previewNuevaFoto);
    }
}

async function cargarPerfil(id) {
    try {
        const response = await fetch(`/api/usuarios/${id}`);
        const data = await response.json();

        if (!response.ok) {
            console.error(data);
            return;
        }

        const user = JSON.parse(localStorage.getItem('user')) || {};
        const actualizado = { ...user, ...data };
        localStorage.setItem('user', JSON.stringify(actualizado));

        const profileName = document.getElementById('profileName');
        const profileRole = document.getElementById('profileRole');
        const formNombre = document.getElementById('nombre');
        const formApellido = document.getElementById('apellido');
        const formEmail = document.getElementById('email');
        const formTelefono = document.getElementById('telefono');
        const infoEmail = document.getElementById('infoEmail');
        const infoTelefono = document.getElementById('infoTelefono');
        const infoRegistro = document.getElementById('infoRegistro');

        if (profileName) profileName.textContent = `${data.nombre} ${data.apellido || ''}`.trim();
        if (profileRole) profileRole.textContent = capitalizar(data.rol || 'ciudadano');

        if (formNombre) formNombre.value = data.nombre || '';
        if (formApellido) formApellido.value = data.apellido || '';
        if (formEmail) formEmail.value = data.email || '';
        if (formTelefono) formTelefono.value = data.telefono || '';

        if (infoEmail) infoEmail.textContent = data.email || '-';
        if (infoTelefono) infoTelefono.textContent = data.telefono || 'No agregado';
        if (infoRegistro) infoRegistro.textContent = formatearFecha(data.fecha_registro);

        renderizarAvatar(data);
    } catch (err) {
        console.error('Error cargando perfil:', err);
    }
}

function renderizarAvatar(user) {
    const avatar = document.getElementById('profileAvatar');
    const avatarFallback = document.getElementById('profileAvatarFallback');

    if (!avatar || !avatarFallback) return;

    if (user.foto_perfil) {
        avatar.src = user.foto_perfil;
        avatar.style.display = 'block';
        avatarFallback.style.display = 'none';
    } else {
        avatar.style.display = 'none';
        avatarFallback.style.display = 'flex';
        avatarFallback.textContent = (user.nombre || 'U').charAt(0).toUpperCase();
    }
}

function previewNuevaFoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const avatar = document.getElementById('profileAvatar');
    const avatarFallback = document.getElementById('profileAvatarFallback');

    const reader = new FileReader();
    reader.onload = (event) => {
        if (avatar) {
            avatar.src = event.target.result;
            avatar.style.display = 'block';
        }
        if (avatarFallback) {
            avatarFallback.style.display = 'none';
        }
    };
    reader.readAsDataURL(file);
}

async function guardarPerfil(e) {
    e.preventDefault();

    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.id) return;

    const formData = new FormData();
    formData.append('nombre', document.getElementById('nombre')?.value.trim() || '');
    formData.append('apellido', document.getElementById('apellido')?.value.trim() || '');
    formData.append('email', document.getElementById('email')?.value.trim() || '');
    formData.append('telefono', document.getElementById('telefono')?.value.trim() || '');

    const password = document.getElementById('password')?.value.trim() || '';
    if (password) formData.append('password', password);

    const foto = document.getElementById('foto_perfil')?.files?.[0];
    if (foto) formData.append('foto_perfil', foto);

    try {
        const response = await fetch(`/api/usuarios/${user.id}`, {
            method: 'PUT',
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || 'No se pudo actualizar el perfil');
            return;
        }

        const actualizado = { ...user, ...data.user };
        localStorage.setItem('user', JSON.stringify(actualizado));

        alert('Perfil actualizado correctamente');
        await cargarPerfil(user.id);
        await cargarHistorial(user.id);

        const passInput = document.getElementById('password');
        if (passInput) passInput.value = '';
    } catch (err) {
        console.error('Error guardando perfil:', err);
        alert('No se pudo actualizar el perfil');
    }
}

async function cargarHistorial(id) {
    try {
        const response = await fetch(`/api/usuarios/${id}/reportes`);
        const data = await response.json();

        if (!response.ok) {
            console.error(data);
            return;
        }

        renderizarHistorial(data);
    } catch (err) {
        console.error('Error cargando historial:', err);
    }
}

function renderizarHistorial(reportes) {
    const contenedor = document.getElementById('reportHistory');
    const totalEl = document.getElementById('totalReportesPerfil');
    const solucionadosEl = document.getElementById('solucionadosPerfil');

    if (!contenedor) return;

    if (totalEl) totalEl.textContent = reportes.length;
    if (solucionadosEl) solucionadosEl.textContent = reportes.filter(r => r.estado === 'solucionado').length;

    if (!reportes.length) {
        contenedor.innerHTML = `<div class="report-history-empty">Todavía no has creado reportes.</div>`;
        return;
    }

    contenedor.innerHTML = reportes.map(reporte => {
        const claseEstado = (reporte.estado || 'pendiente').toLowerCase().replace(/\s+/g, '-');
        const imagen = reporte.imagen
            ? `<img src="${escapeHTML(reporte.imagen)}" alt="Imagen del reporte">`
            : '';

        const respuesta = reporte.respuesta_autoridad
            ? `
                <div class="respuesta-autoridad-box">
                    <b>Respuesta de autoridad</b>
                    <p>${escapeHTML(reporte.respuesta_autoridad)}</p>
                    <small>${formatearFechaHora(reporte.fecha_respuesta)}</small>
                </div>
              `
            : '';

        return `
            <article class="report-history-card ${reporte.imagen ? '' : 'no-image'}">
                ${imagen}
                <div class="report-history-body">
                    <div class="report-history-top">
                        <h4>${escapeHTML(reporte.titulo)}</h4>
                        <span class="status-badge ${claseEstado}">${escapeHTML(reporte.estado)}</span>
                    </div>

                    <p>${escapeHTML(reporte.descripcion || '')}</p>

                    <div class="report-history-meta">
                        <span>📍 ${escapeHTML(reporte.ubicacion || '-')}</span>
                        <span>📂 ${escapeHTML(reporte.categoria || 'General')}</span>
                        <span>🕒 ${formatearFecha(reporte.fecha_creacion)}</span>
                    </div>

                    ${respuesta}
                </div>
            </article>
        `;
    }).join('');
}

function cerrarSesion() {
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

function capitalizar(texto) {
    if (!texto) return '';
    return texto.charAt(0).toUpperCase() + texto.slice(1);
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