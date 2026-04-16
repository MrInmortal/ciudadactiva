document.addEventListener('DOMContentLoaded', () => {
    aplicarTemaGuardado();
    inicializarBotonesTema();
});

function aplicarTemaGuardado() {
    const temaGuardado = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', temaGuardado);
    actualizarTextoBotones(temaGuardado);
}

function inicializarBotonesTema() {
    const botones = document.querySelectorAll('[data-theme-toggle]');

    botones.forEach(boton => {
        boton.addEventListener('click', () => {
            const actual = document.documentElement.getAttribute('data-theme') || 'light';
            const nuevo = actual === 'dark' ? 'light' : 'dark';

            document.documentElement.setAttribute('data-theme', nuevo);
            localStorage.setItem('theme', nuevo);
            actualizarTextoBotones(nuevo);
        });
    });
}

function actualizarTextoBotones(tema) {
    const botones = document.querySelectorAll('[data-theme-toggle]');

    botones.forEach(boton => {
        if (tema === 'dark') {
            boton.innerText = '☀️ ';
        } else {
            boton.innerText = '🌙 ';
        }
    });
}