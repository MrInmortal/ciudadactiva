document.addEventListener('DOMContentLoaded', async () => {
    const user = requireAuthority();
    if (!user) return;

    renderAuthoritySidebar('dashboard');
    renderAuthorityMobileTop('Dashboard');

    await cargarDashboard(user);
});

async function cargarDashboard(user) {
    try {
        const response = await fetch('http://localhost:4000/api/dashboard/autoridad', {
            headers: {
                'x-user-id': user.id,
                'x-user-role': user.rol
            }
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || 'No se pudo cargar el dashboard');
            return;
        }

        document.getElementById('dashTotal').innerText = data.totalReportes || 0;
        document.getElementById('dashPendientes').innerText = data.pendientes || 0;
        document.getElementById('dashProceso').innerText = data.enProceso || 0;
        document.getElementById('dashSolucionados').innerText = data.solucionados || 0;

        renderChartList('chartCategorias', data.porCategoria || [], 'categoria', 'total');
        renderChartList('chartDias', data.porDia || [], 'dia', 'total', true);
        renderChartList('chartUbicaciones', data.porUbicacion || [], 'ubicacion', 'total');
        renderChartList('chartUsuarios', data.usuariosActivos || [], 'nombre', 'total', false, true);

        document.getElementById('quickEstado').innerText = obtenerEstadoPrincipal(data);
        document.getElementById('quickCategoria').innerText = (data.porCategoria?.[0]?.categoria || '-');
        document.getElementById('quickUbicacion').innerText = (data.porUbicacion?.[0]?.ubicacion || '-');
        document.getElementById('quickUsuario').innerText = data.usuariosActivos?.length
            ? `${data.usuariosActivos[0].nombre} ${data.usuariosActivos[0].apellido || ''}`.trim()
            : '-';
    } catch (err) {
        console.error(err);
        alert('No se pudo cargar el dashboard');
    }
}

function renderChartList(id, items, keyText, keyValue, isDate = false, isUser = false) {
    const contenedor = document.getElementById(id);
    if (!contenedor) return;

    if (!items.length) {
        contenedor.innerHTML = `<div class="authority-empty">No hay datos todavía.</div>`;
        return;
    }

    const max = Math.max(...items.map(i => Number(i[keyValue]) || 0), 1);

    contenedor.innerHTML = items.map(item => {
        let label = item[keyText] || '-';

        if (isDate) {
            label = formatearFecha(item[keyText]);
        }

        if (isUser) {
            label = `${item.nombre || ''} ${item.apellido || ''}`.trim();
        }

        const value = Number(item[keyValue]) || 0;
        const width = Math.max((value / max) * 100, 8);

        return `
            <div class="chart-row">
                <div class="chart-row-top">
                    <span>${escapeHTML(label)}</span>
                    <span>${value}</span>
                </div>
                <div class="chart-bar-wrap">
                    <div class="chart-bar" style="width:${width}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

function obtenerEstadoPrincipal(data) {
    const estados = [
        { nombre: 'Pendiente', total: data.pendientes || 0 },
        { nombre: 'En proceso', total: data.enProceso || 0 },
        { nombre: 'Solucionado', total: data.solucionados || 0 }
    ].sort((a, b) => b.total - a.total);

    return estados[0]?.nombre || '-';
}