document.getElementById('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPass').value;

    try {
        const response = await fetch('http://localhost:4000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('user', JSON.stringify(data.user));
            alert(`¡Bienvenido, ${data.user.nombre}!`);
            window.location.href = 'foro.html';
        } else {
            alert('Error: ' + data.error);
        }
    } catch (err) {
        console.error('Error en el login:', err);
        alert('Hubo un problema al conectar con el servidor.');
    }
});

document.getElementById('togglePassLogin').addEventListener('click', function () {
    const passInput = document.getElementById('loginPass');
    passInput.type = passInput.type === 'password' ? 'text' : 'password';
});