document.addEventListener('DOMContentLoaded', () => {
    const form =
        document.getElementById('loginForm') ||
        document.querySelector('form');

    if (!form) {
        console.error('No se encontró el formulario de login');
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const emailInput =
            document.getElementById('email') ||
            document.getElementById('loginEmail') ||
            document.querySelector('input[type="email"]') ||
            document.querySelector('input[name="email"]');

        const passwordInput =
            document.getElementById('password') ||
            document.getElementById('loginPassword') ||
            document.querySelector('input[type="password"]') ||
            document.querySelector('input[name="password"]');

        const email = emailInput ? emailInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value.trim() : '';

        if (!email || !password) {
            alert('Completa todos los campos.');
            return;
        }

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || 'No se pudo iniciar sesión');
                return;
            }

            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = 'foro.html';
        } catch (error) {
            console.error('Error login:', error);
            alert('Problema de conexión con el servidor.');
        }
    });
});