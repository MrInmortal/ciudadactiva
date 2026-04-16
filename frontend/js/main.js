document.addEventListener('DOMContentLoaded', () => {
    inicializarNavegacionSuave();
    inicializarBotonesAuth();
    cargarEstadisticas();
});

function inicializarNavegacionSuave() {
    const linksInternos = document.querySelectorAll('a[href^="#"]');

    linksInternos.forEach(link => {
        link.addEventListener('click', (e) => {
            const destino = link.getAttribute('href');

            if (!destino || destino === '#') return;

            const seccion = document.querySelector(destino);
            if (!seccion) return;

            e.preventDefault();
            seccion.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}

function inicializarBotonesAuth() {
    const btnLogin = document.querySelector('.btn-login');
    const btnRegister = document.querySelector('.btn-register');

    if (btnLogin) {
        btnLogin.addEventListener('click', (e) => {
            const href = btnLogin.getAttribute('href');

            if (!href || href === '#') {
                e.preventDefault();
                window.location.href = 'login.html';
            }
        });
    }

    if (btnRegister) {
        btnRegister.addEventListener('click', (e) => {
            const href = btnRegister.getAttribute('href');

            if (!href || href === '#') {
                e.preventDefault();
                window.location.href = 'registro.html';
            }
        });
    }
}

async function cargarEstadisticas() {
    try {
        const response = await fetch('/api/estadisticas');
        const data = await response.json();

        if (!response.ok) {
            console.warn('No se pudieron cargar las estadísticas:', data);
            return;
        }

        actualizarTextoSiExiste('statTotalReportes', data.totalReportes);
        actualizarTextoSiExiste('statPendientes', data.pendientes);
        actualizarTextoSiExiste('statEnProceso', data.enProceso);
        actualizarTextoSiExiste('statSolucionados', data.solucionados);
        actualizarTextoSiExiste('statCiudadanos', data.ciudadanos);

        // Compatibilidad por si tus cards usan otros IDs
        actualizarTextoSiExiste('totalReportes', data.totalReportes);
        actualizarTextoSiExiste('pendientes', data.pendientes);
        actualizarTextoSiExiste('enProceso', data.enProceso);
        actualizarTextoSiExiste('solucionados', data.solucionados);
        actualizarTextoSiExiste('ciudadanos', data.ciudadanos);
    } catch (error) {
        console.warn('No se pudieron cargar las estadísticas del inicio:', error);
    }
}

function actualizarTextoSiExiste(id, valor) {
    const elemento = document.getElementById(id);
    if (elemento) {
        elemento.innerText = valor;
    }
}