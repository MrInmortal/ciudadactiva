const express = require('express');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const cors = require('cors');
const multer = require('multer');
const pool = require('./db');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 4000;

// =========================
// CARPETA DE SUBIDAS
// =========================
const uploadsDir = path.join(__dirname, '../../frontend/uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// =========================
// MULTER
// =========================
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, safeName);
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten imágenes JPG, JPEG, PNG o WEBP.'));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../../frontend')));
app.use('/uploads', express.static(path.join(__dirname, '../../frontend/uploads')));

// =========================
// HELPERS
// =========================
function leerUsuarioCliente(req) {
    return {
        id: Number(req.headers['x-user-id']) || null,
        rol: req.headers['x-user-role'] || 'ciudadano'
    };
}

function verificarRolAutoridad(req, res, next) {
    const actor = leerUsuarioCliente(req);

    if (actor.rol !== 'autoridad' && actor.rol !== 'admin') {
        return res.status(403).json({ error: 'No autorizado para esta acción' });
    }

    next();
}

function verificarRolAdmin(req, res, next) {
    const actor = leerUsuarioCliente(req);

    if (actor.rol !== 'admin') {
        return res.status(403).json({ error: 'Solo un administrador puede hacer esto' });
    }

    next();
}

async function crearNotificacion(usuarioId, tipo, titulo, mensaje, referenciaReporteId = null) {
    try {
        await pool.query(
            `INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, referencia_reporte_id)
             VALUES ($1, $2, $3, $4, $5)`,
            [usuarioId, tipo, titulo, mensaje, referenciaReporteId]
        );
    } catch (err) {
        console.error('Error creando notificación:', err.message);
    }
}

async function puedeGestionarReporte(req, reporteId) {
    const actor = leerUsuarioCliente(req);

    if (!actor.id) {
        return { ok: false, motivo: 'Usuario no identificado' };
    }

    const result = await pool.query(
        `SELECT id, usuario_id, titulo
         FROM reportes
         WHERE id = $1`,
        [reporteId]
    );

    if (result.rows.length === 0) {
        return { ok: false, motivo: 'Reporte no encontrado' };
    }

    const reporte = result.rows[0];

    if (actor.rol === 'admin' || actor.rol === 'autoridad' || reporte.usuario_id === actor.id) {
        return { ok: true, actor, reporte };
    }

    return { ok: false, motivo: 'No tienes permisos para gestionar este reporte' };
}

// =========================
// PÁGINAS
// =========================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/login.html'));
});

app.get('/registro', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/registro.html'));
});

app.get('/foro', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/foro.html'));
});

app.get('/perfil', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/perfil.html'));
});

app.get('/dashboard-autoridad', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dashboard-autoridad.html'));
});

app.get('/dashboard-reportes', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dashboard-reportes.html'));
});

app.get('/dashboard-roles', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dashboard-roles.html'));
});

// =========================
// AUTH
// =========================
app.post('/api/auth/crear-cuenta', async (req, res) => {
    const { nombre, apellido, email, password } = req.body;

    if (!nombre || !apellido || !email || !password) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    try {
        const existe = await pool.query(
            'SELECT id FROM usuarios WHERE email = $1',
            [email]
        );

        if (existe.rows.length > 0) {
            return res.status(409).json({ error: 'El email ya está registrado' });
        }

        const hash = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO usuarios (nombre, apellido, email, password_hash)
             VALUES ($1, $2, $3, $4)
             RETURNING id, nombre, apellido, email, rol, telefono, foto_perfil`,
            [nombre, apellido, email, hash]
        );

        res.status(201).json({
            mensaje: 'Usuario registrado con éxito',
            user: result.rows[0]
        });
    } catch (err) {
        console.error('Error en registro:', err.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }

    try {
        const result = await pool.query(
            'SELECT * FROM usuarios WHERE email = $1 AND activo = TRUE',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const user = result.rows[0];
        const validPass = await bcrypt.compare(password, user.password_hash);

        if (!validPass) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        res.json({
            mensaje: 'Login exitoso',
            user: {
                id: user.id,
                nombre: user.nombre,
                apellido: user.apellido,
                email: user.email,
                rol: user.rol,
                telefono: user.telefono,
                foto_perfil: user.foto_perfil
            }
        });
    } catch (err) {
        console.error('Error en login:', err.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// =========================
// PERFIL
// =========================
app.get('/api/usuarios/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `SELECT id, nombre, apellido, email, rol, activo, fecha_registro, telefono, foto_perfil
             FROM usuarios
             WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error al obtener perfil:', err.message);
        res.status(500).json({ error: 'No se pudo obtener el perfil' });
    }
});

app.put('/api/usuarios/:id', upload.single('foto_perfil'), async (req, res) => {
    const { id } = req.params;
    const { nombre, apellido, email, telefono, password } = req.body;

    if (!nombre || !apellido || !email) {
        return res.status(400).json({ error: 'Nombre, apellido y email son obligatorios' });
    }

    try {
        const existe = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);

        if (existe.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const actual = existe.rows[0];

        const emailDuplicado = await pool.query(
            'SELECT id FROM usuarios WHERE email = $1 AND id <> $2',
            [email, id]
        );

        if (emailDuplicado.rows.length > 0) {
            return res.status(409).json({ error: 'Ese email ya está en uso por otro usuario' });
        }

        const nuevaFoto = req.file ? `/uploads/${req.file.filename}` : actual.foto_perfil;

        let result;

        if (password && password.trim() !== '') {
            const hash = await bcrypt.hash(password, 10);

            result = await pool.query(
                `UPDATE usuarios
                 SET nombre = $1, apellido = $2, email = $3, telefono = $4, foto_perfil = $5, password_hash = $6
                 WHERE id = $7
                 RETURNING id, nombre, apellido, email, rol, telefono, foto_perfil`,
                [nombre, apellido, email, telefono || null, nuevaFoto, hash, id]
            );
        } else {
            result = await pool.query(
                `UPDATE usuarios
                 SET nombre = $1, apellido = $2, email = $3, telefono = $4, foto_perfil = $5
                 WHERE id = $6
                 RETURNING id, nombre, apellido, email, rol, telefono, foto_perfil`,
                [nombre, apellido, email, telefono || null, nuevaFoto, id]
            );
        }

        res.json({
            mensaje: 'Perfil actualizado correctamente',
            user: result.rows[0]
        });
    } catch (err) {
        console.error('Error al actualizar perfil:', err.message);
        res.status(500).json({ error: 'No se pudo actualizar el perfil' });
    }
});

app.get('/api/usuarios/:id/reportes', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `SELECT id, usuario_id, titulo, descripcion, categoria, estado, ubicacion, likes, imagen, respuesta_autoridad, fecha_respuesta, fecha_creacion, fecha_actualizacion
             FROM reportes
             WHERE usuario_id = $1
             ORDER BY fecha_creacion DESC, id DESC`,
            [id]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener reportes del usuario:', err.message);
        res.status(500).json({ error: 'No se pudo cargar el historial de reportes' });
    }
});

// =========================
// NOTIFICACIONES
// =========================
app.get('/api/notificaciones/:usuarioId', async (req, res) => {
    const { usuarioId } = req.params;

    try {
        const result = await pool.query(
            `SELECT *
             FROM notificaciones
             WHERE usuario_id = $1
             ORDER BY fecha_creacion DESC
             LIMIT 30`,
            [usuarioId]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener notificaciones:', err.message);
        res.status(500).json({ error: 'No se pudieron cargar las notificaciones' });
    }
});

app.put('/api/notificaciones/:id/leida', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `UPDATE notificaciones
             SET leida = TRUE
             WHERE id = $1
             RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Notificación no encontrada' });
        }

        res.json({
            mensaje: 'Notificación actualizada',
            notificacion: result.rows[0]
        });
    } catch (err) {
        console.error('Error al marcar notificación:', err.message);
        res.status(500).json({ error: 'No se pudo actualizar la notificación' });
    }
});

app.put('/api/notificaciones/usuario/:usuarioId/leidas', async (req, res) => {
    const { usuarioId } = req.params;

    try {
        await pool.query(
            `UPDATE notificaciones
             SET leida = TRUE
             WHERE usuario_id = $1`,
            [usuarioId]
        );

        res.json({ mensaje: 'Notificaciones marcadas como leídas' });
    } catch (err) {
        console.error('Error al marcar notificaciones:', err.message);
        res.status(500).json({ error: 'No se pudieron marcar las notificaciones' });
    }
});

// =========================
// REPORTES
// =========================
app.get('/api/reportes', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                r.id,
                r.usuario_id,
                r.titulo,
                r.descripcion,
                r.categoria,
                r.estado,
                r.ubicacion,
                r.likes,
                r.imagen,
                r.respuesta_autoridad,
                r.fecha_respuesta,
                r.fecha_creacion,
                r.fecha_actualizacion,
                u.nombre AS autor,
                u.apellido AS autor_apellido
            FROM reportes r
            JOIN usuarios u ON r.usuario_id = u.id
            ORDER BY r.fecha_creacion DESC, r.id DESC
        `);

        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener reportes:', err.message);
        res.status(500).json({ error: 'No se pudieron cargar los reportes' });
    }
});

app.post('/api/reportes', upload.single('imagen'), async (req, res) => {
    const { usuario_id, titulo, descripcion, ubicacion, categoria } = req.body;

    if (!usuario_id || !titulo || !descripcion || !ubicacion) {
        return res.status(400).json({ error: 'Faltan campos obligatorios del reporte' });
    }

    try {
        const usuarioExiste = await pool.query(
            'SELECT id FROM usuarios WHERE id = $1',
            [usuario_id]
        );

        if (usuarioExiste.rows.length === 0) {
            return res.status(400).json({ error: 'El usuario del reporte no existe' });
        }

        const imagenPath = req.file ? `/uploads/${req.file.filename}` : null;

        const result = await pool.query(
            `INSERT INTO reportes (usuario_id, titulo, descripcion, ubicacion, categoria, imagen)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [usuario_id, titulo, descripcion, ubicacion, categoria || 'Otros', imagenPath]
        );

        res.status(201).json({
            mensaje: 'Reporte creado con éxito',
            reporte: result.rows[0]
        });
    } catch (err) {
        console.error('Error al crear reporte:', err.message);
        res.status(400).json({ error: 'No se pudo crear el reporte' });
    }
});

app.put('/api/reportes/:id', upload.single('imagen'), async (req, res) => {
    const { id } = req.params;
    const { titulo, descripcion, ubicacion, categoria } = req.body;

    if (!titulo || !descripcion || !ubicacion) {
        return res.status(400).json({ error: 'Título, descripción y ubicación son obligatorios' });
    }

    try {
        const permiso = await puedeGestionarReporte(req, id);

        if (!permiso.ok) {
            return res.status(403).json({ error: permiso.motivo });
        }

        const actual = await pool.query(`SELECT * FROM reportes WHERE id = $1`, [id]);

        if (actual.rows.length === 0) {
            return res.status(404).json({ error: 'Reporte no encontrado' });
        }

        const reporteActual = actual.rows[0];
        const nuevaImagen = req.file ? `/uploads/${req.file.filename}` : reporteActual.imagen;

        const result = await pool.query(
            `UPDATE reportes
             SET titulo = $1,
                 descripcion = $2,
                 ubicacion = $3,
                 categoria = $4,
                 imagen = $5,
                 fecha_actualizacion = CURRENT_TIMESTAMP
             WHERE id = $6
             RETURNING *`,
            [titulo, descripcion, ubicacion, categoria || 'Otros', nuevaImagen, id]
        );

        if (permiso.actor.id !== reporteActual.usuario_id) {
            await crearNotificacion(
                reporteActual.usuario_id,
                'edicion',
                'Tu reporte fue editado',
                `Se actualizó el reporte "${reporteActual.titulo}".`,
                Number(id)
            );
        }

        res.json({
            mensaje: 'Reporte actualizado correctamente',
            reporte: result.rows[0]
        });
    } catch (err) {
        console.error('Error al editar reporte:', err.message);
        res.status(500).json({ error: 'No se pudo editar el reporte' });
    }
});

app.delete('/api/reportes/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const permiso = await puedeGestionarReporte(req, id);

        if (!permiso.ok) {
            return res.status(403).json({ error: permiso.motivo });
        }

        const actual = await pool.query(`SELECT * FROM reportes WHERE id = $1`, [id]);

        if (actual.rows.length === 0) {
            return res.status(404).json({ error: 'Reporte no encontrado' });
        }

        const reporteActual = actual.rows[0];

        await pool.query(`DELETE FROM reportes WHERE id = $1`, [id]);

        if (permiso.actor.id !== reporteActual.usuario_id) {
            await crearNotificacion(
                reporteActual.usuario_id,
                'eliminacion',
                'Tu reporte fue eliminado',
                `Se eliminó el reporte "${reporteActual.titulo}".`,
                Number(id)
            );
        }

        res.json({ mensaje: 'Reporte eliminado correctamente' });
    } catch (err) {
        console.error('Error al eliminar reporte:', err.message);
        res.status(500).json({ error: 'No se pudo eliminar el reporte' });
    }
});

app.put('/api/reportes/:id/estado', verificarRolAutoridad, async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;

    const estadosValidos = ['pendiente', 'en proceso', 'solucionado'];

    if (!estadosValidos.includes(estado)) {
        return res.status(400).json({ error: 'Estado no válido' });
    }

    try {
        const previo = await pool.query(
            `SELECT id, usuario_id, titulo
             FROM reportes
             WHERE id = $1`,
            [id]
        );

        if (previo.rows.length === 0) {
            return res.status(404).json({ error: 'Reporte no encontrado' });
        }

        const reporteActual = previo.rows[0];

        const result = await pool.query(
            `UPDATE reportes
             SET estado = $1, fecha_actualizacion = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING *`,
            [estado, id]
        );

        await crearNotificacion(
            reporteActual.usuario_id,
            'estado',
            'Estado actualizado',
            `Tu reporte "${reporteActual.titulo}" ahora está en estado: ${estado}.`,
            Number(id)
        );

        res.json({
            mensaje: 'Estado actualizado correctamente',
            reporte: result.rows[0]
        });
    } catch (err) {
        console.error('Error al actualizar estado:', err.message);
        res.status(500).json({ error: 'No se pudo actualizar el estado' });
    }
});

app.put('/api/reportes/:id/respuesta', verificarRolAutoridad, async (req, res) => {
    const { id } = req.params;
    const { respuesta } = req.body;

    if (!respuesta || !respuesta.trim()) {
        return res.status(400).json({ error: 'La respuesta no puede estar vacía' });
    }

    try {
        const previo = await pool.query(
            `SELECT id, usuario_id, titulo
             FROM reportes
             WHERE id = $1`,
            [id]
        );

        if (previo.rows.length === 0) {
            return res.status(404).json({ error: 'Reporte no encontrado' });
        }

        const reporteActual = previo.rows[0];

        const result = await pool.query(
            `UPDATE reportes
             SET respuesta_autoridad = $1,
                 fecha_respuesta = CURRENT_TIMESTAMP,
                 fecha_actualizacion = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING *`,
            [respuesta.trim(), id]
        );

        await crearNotificacion(
            reporteActual.usuario_id,
            'respuesta',
            'Respuesta de autoridad',
            `Han respondido tu reporte "${reporteActual.titulo}".`,
            Number(id)
        );

        res.json({
            mensaje: 'Respuesta guardada correctamente',
            reporte: result.rows[0]
        });
    } catch (err) {
        console.error('Error al responder reporte:', err.message);
        res.status(500).json({ error: 'No se pudo guardar la respuesta' });
    }
});

// =========================
// DASHBOARD DATOS
// =========================
app.get('/api/dashboard/autoridad', verificarRolAutoridad, async (req, res) => {
    try {
        const totalReportes = await pool.query('SELECT COUNT(*)::int AS total FROM reportes');
        const pendientes = await pool.query("SELECT COUNT(*)::int AS total FROM reportes WHERE estado = 'pendiente'");
        const enProceso = await pool.query("SELECT COUNT(*)::int AS total FROM reportes WHERE estado = 'en proceso'");
        const solucionados = await pool.query("SELECT COUNT(*)::int AS total FROM reportes WHERE estado = 'solucionado'");

        const porCategoria = await pool.query(`
            SELECT categoria, COUNT(*)::int AS total
            FROM reportes
            GROUP BY categoria
            ORDER BY total DESC
            LIMIT 8
        `);

        const porDia = await pool.query(`
            SELECT DATE(fecha_creacion) AS dia, COUNT(*)::int AS total
            FROM reportes
            GROUP BY DATE(fecha_creacion)
            ORDER BY dia DESC
            LIMIT 7
        `);

        const porUbicacion = await pool.query(`
            SELECT ubicacion, COUNT(*)::int AS total
            FROM reportes
            GROUP BY ubicacion
            ORDER BY total DESC
            LIMIT 8
        `);

        const usuariosActivos = await pool.query(`
            SELECT u.id, u.nombre, u.apellido, u.email, u.rol, COUNT(r.id)::int AS total
            FROM usuarios u
            LEFT JOIN reportes r ON r.usuario_id = u.id
            GROUP BY u.id, u.nombre, u.apellido, u.email, u.rol
            ORDER BY total DESC, u.id ASC
            LIMIT 8
        `);

        res.json({
            totalReportes: totalReportes.rows[0].total,
            pendientes: pendientes.rows[0].total,
            enProceso: enProceso.rows[0].total,
            solucionados: solucionados.rows[0].total,
            porCategoria: porCategoria.rows,
            porDia: porDia.rows.reverse(),
            porUbicacion: porUbicacion.rows,
            usuariosActivos: usuariosActivos.rows
        });
    } catch (err) {
        console.error('Error dashboard autoridad:', err.message);
        res.status(500).json({ error: 'No se pudo cargar el dashboard de autoridad' });
    }
});

app.get('/api/dashboard/reportes', verificarRolAutoridad, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                r.id,
                r.usuario_id,
                r.titulo,
                r.descripcion,
                r.categoria,
                r.estado,
                r.ubicacion,
                r.imagen,
                r.respuesta_autoridad,
                r.fecha_respuesta,
                r.fecha_creacion,
                u.nombre,
                u.apellido
            FROM reportes r
            JOIN usuarios u ON r.usuario_id = u.id
            ORDER BY r.fecha_creacion DESC, r.id DESC
        `);

        res.json(result.rows);
    } catch (err) {
        console.error('Error al cargar reportes dashboard:', err.message);
        res.status(500).json({ error: 'No se pudieron cargar los reportes del dashboard' });
    }
});

// =========================
// ADMIN - ROLES
// =========================
app.get('/api/admin/usuarios', verificarRolAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, nombre, apellido, email, rol, activo, telefono, fecha_registro
            FROM usuarios
            ORDER BY id ASC
        `);

        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener usuarios admin:', err.message);
        res.status(500).json({ error: 'No se pudieron cargar los usuarios' });
    }
});

app.put('/api/admin/usuarios/:id/rol', verificarRolAdmin, async (req, res) => {
    const { id } = req.params;
    const { rol } = req.body;

    const rolesValidos = ['ciudadano', 'autoridad', 'admin'];

    if (!rolesValidos.includes(rol)) {
        return res.status(400).json({ error: 'Rol no válido' });
    }

    try {
        const result = await pool.query(
            `UPDATE usuarios
             SET rol = $1
             WHERE id = $2
             RETURNING id, nombre, apellido, email, rol`,
            [rol, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        await crearNotificacion(
            Number(id),
            'rol',
            'Tu rol ha cambiado',
            `Tu cuenta ahora tiene el rol: ${rol}.`,
            null
        );

        res.json({
            mensaje: 'Rol actualizado correctamente',
            user: result.rows[0]
        });
    } catch (err) {
        console.error('Error al actualizar rol:', err.message);
        res.status(500).json({ error: 'No se pudo actualizar el rol' });
    }
});

// =========================
// MANEJO DE ERRORES
// =========================
process.on('uncaughtException', (err) => {
    console.error('❌ Error no controlado:', err);
});

process.on('unhandledRejection', (reason) => {
    console.error('❌ Promesa rechazada no controlada:', reason);
});

const server = app.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 SERVIDOR LISTO EN: http://localhost:${PORT}`);

    try {
        await pool.query('SELECT NOW()');
        console.log('✅ Base de datos conectada correctamente');
        console.log('✅ Base de datos lista para CiudadActiva');
    } catch (err) {
        console.error('❌ Error crítico de DB:', err.message);
    }
});

server.on('error', (err) => {
    console.error('❌ Error del servidor:', err.message);
});

setInterval(() => {}, 1000 * 60 * 30);