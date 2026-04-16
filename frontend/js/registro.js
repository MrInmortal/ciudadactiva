document.getElementById('formRegistro').addEventListener('submit', async (e) => {
    e.preventDefault();

    const datos = {
        nombre: document.getElementById('regNombre').value.trim(),
        apellido: document.getElementById('regApellido').value.trim(),
        email: document.getElementById('regEmail').value.trim(),
        password: document.getElementById('regPass').value
    };

    try {
        const response = await fetch('http://localhost:4000/api/auth/crear-cuenta', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        const res = await response.json();

        if (response.ok) {
            alert('¡Cuenta creada! Ahora puedes iniciar sesión.');
            window.location.href = 'login.html';
        } else {
            alert('Error: ' + res.error);
        }
    } catch (err) {
        console.error('Error en registro:', err);
        alert('Problema de conexión con el servidor.');
    }
});