document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email')?.value.trim();
        const password = document.getElementById('password')?.value.trim();

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