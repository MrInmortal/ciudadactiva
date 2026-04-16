document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registroForm');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nombre = document.getElementById('nombre')?.value.trim();
        const apellido = document.getElementById('apellido')?.value.trim();
        const email = document.getElementById('email')?.value.trim();
        const password = document.getElementById('password')?.value.trim();

        if (!nombre || !apellido || !email || !password) {
            alert('Completa todos los campos.');
            return;
        }

        try {
            const response = await fetch('/api/auth/crear-cuenta', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nombre,
                    apellido,
                    email,
                    password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || 'No se pudo crear la cuenta');
                return;
            }

            alert('Cuenta creada correctamente. Ahora inicia sesión.');
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Error registro:', error);
            alert('Problema de conexión con el servidor.');
        }
    });
});