let adminUser = null;
let usuariosRoles = [];

document.addEventListener('DOMContentLoaded', async () => {
    const user = requireAdmin();
    if (!user) return;

    adminUser = user;

    renderAuthoritySidebar('roles');
    renderAuthorityMobileTop('Gestión de roles');

    configurarBusquedaRoles();
    await cargarUsuariosRoles();
});

function configurarBusquedaRoles() {
    const input = document.getElementById('userSearch');
    if (!input) return;

    input.addEventListener('input', renderizarUsuariosFiltrados);
}

async function cargarUsuariosRoles() {
    try {
        const response = await fetch('/api/admin/usuarios', {
            headers: {
                'x-user-id': adminUser.id,
                'x-user-role': adminUser.rol
            }
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || 'No se pudieron cargar los usuarios');
            return;
        }

        usuariosRoles = Array.isArray(data) ? data : [];
        actualizarResumenRoles(usuariosRoles);
        renderizarUsuariosFiltrados();
    } catch (err) {
        console.error(err);
        alert('No se pudieron cargar los usuarios');
    }
}

function actualizarResumenRoles(usuarios) {
    const total = usuarios.length;
    const ciudadanos = usuarios.filter(u => u.rol === 'ciudadano').length;
    const autoridades = usuarios.filter(u => u.rol === 'autoridad').length;
    const admins = usuarios.filter(u => u.rol === 'admin').length;

    const elTotal = document.getElementById('rolesTotalUsuarios');
    const elCiudadanos = document.getElementById('rolesCiudadanos');
    const elAutoridades = document.getElementById('rolesAutoridades');
    const elAdmins = document.getElementById('rolesAdmins');

    if (elTotal) elTotal.innerText = total;
    if (elCiudadanos) elCiudadanos.innerText = ciudadanos;
    if (elAutoridades) elAutoridades.innerText = autoridades;
    if (elAdmins) elAdmins.innerText = admins;
}

function renderizarUsuariosFiltrados() {
    const input = document.getElementById('userSearch');
    const texto = input ? input.value.trim().toLowerCase() : '';

    const filtrados = usuariosRoles.filter(usuario => {
        return (
            (usuario.nombre || '').toLowerCase().includes(texto) ||
            (usuario.apellido || '').toLowerCase().includes(texto) ||
            (usuario.email || '').toLowerCase().includes(texto)
        );
    });

    renderizarUsuarios(filtrados);
}

function renderizarUsuarios(usuarios) {
    const contenedor = document.getElementById('rolesList');
    if (!contenedor) return;

    if (!usuarios.length) {
        contenedor.innerHTML = `<div class="authority-empty">No hay usuarios que coincidan con la búsqueda.</div>`;
        return;
    }

    contenedor.innerHTML = usuarios.map(usuario => {
        return `
            <div class="roles-table-row">
                <div class="roles-user-cell">
                    <div class="roles-user-avatar">
                        ${escapeHTML((usuario.nombre || 'U').charAt(0).toUpperCase())}
                    </div>
                    <div class="roles-user-main">
                        <strong>${escapeHTML(usuario.nombre)} ${escapeHTML(usuario.apellido || '')}</strong>
                        <span>ID #${usuario.id}</span>
                    </div>
                </div>

                <div class="roles-email-cell">
                    <strong>${escapeHTML(usuario.email || '-')}</strong>
                </div>

                <div class="roles-role-cell">
                    <select class="modal-input roles-select" onchange="cambiarRolAdmin(${usuario.id}, this.value)">
                        <option value="ciudadano" ${usuario.rol === 'ciudadano' ? 'selected' : ''}>Ciudadano</option>
                        <option value="autoridad" ${usuario.rol === 'autoridad' ? 'selected' : ''}>Autoridad</option>
                        <option value="admin" ${usuario.rol === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                </div>

                <div class="roles-phone-cell">
                    ${escapeHTML(usuario.telefono || 'Sin teléfono')}
                </div>

                <div class="roles-date-cell">
                    ${formatearFecha(usuario.fecha_registro)}
                </div>
            </div>
        `;
    }).join('');
}

async function cambiarRolAdmin(id, rol) {
    try {
        const response = await fetch(`/api/admin/usuarios/${id}/rol`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': adminUser.id,
                'x-user-role': adminUser.rol
            },
            body: JSON.stringify({ rol })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || 'No se pudo cambiar el rol');
            return;
        }

        await cargarUsuariosRoles();
    } catch (err) {
        console.error(err);
        alert('No se pudo cambiar el rol');
    }
}