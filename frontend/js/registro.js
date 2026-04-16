document.addEventListener('DOMContentLoaded', () => {
    const form =
        document.getElementById('registroForm') ||
        document.getElementById('formRegistro') ||
        document.querySelector('form');

    if (!form) {
        console.error('No se encontró el formulario de registro');
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nombreInput =
            document.getElementById('nombre') ||
            document.getElementById('regNombre') ||
            document.querySelector('input[name="nombre"]');

        const apellidoInput =
            document.getElementById('apellido') ||
            document.getElementById('regApellido') ||
            document.querySelector('input[name="apellido"]');

        const emailInput =
            document.getElementById('email') ||
            document.getElementById('regEmail') ||
            document.querySelector('input[type="email"]') ||
            document.querySelector('input[name="email"]');

        const passwordInput =
            document.getElementById('password') ||
            document.getElementById('regPass') ||
            document.querySelector('input[type="password"]') ||
            document.querySelector('input[name="password"]');

        const nombre = nombreInput ? nombreInput.value.trim() : '';
        const apellido = apellidoInput ? apellidoInput.value.trim() : '';
        const email = emailInput ? emailInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value.trim() : '';

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