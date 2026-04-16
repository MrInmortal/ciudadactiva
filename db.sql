-- =========================================================
-- CIUDADACTIVA - ESTRUCTURA COMPLETA PARA RENDER
-- =========================================================

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'ciudadano',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    telefono VARCHAR(30),
    foto_perfil VARCHAR(255),
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_rol CHECK (rol IN ('ciudadano', 'autoridad', 'admin'))
);

CREATE TABLE IF NOT EXISTS permisos (
    id SERIAL PRIMARY KEY,
    nombre_permiso VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS usuario_permisos (
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    permiso_id INTEGER NOT NULL REFERENCES permisos(id) ON DELETE CASCADE,
    PRIMARY KEY (usuario_id, permiso_id)
);

CREATE TABLE IF NOT EXISTS reportes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT NOT NULL,
    categoria VARCHAR(80) NOT NULL DEFAULT 'general',
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    ubicacion VARCHAR(255) NOT NULL,
    likes INTEGER NOT NULL DEFAULT 0,
    imagen VARCHAR(255),
    respuesta_autoridad TEXT,
    fecha_respuesta TIMESTAMP,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_estado CHECK (estado IN ('pendiente', 'en proceso', 'solucionado'))
);

CREATE TABLE IF NOT EXISTS notificaciones (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo VARCHAR(30) NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    mensaje TEXT NOT NULL,
    referencia_reporte_id INTEGER REFERENCES reportes(id) ON DELETE SET NULL,
    leida BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);

CREATE INDEX IF NOT EXISTS idx_reportes_usuario_id ON reportes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_reportes_estado ON reportes(estado);
CREATE INDEX IF NOT EXISTS idx_reportes_categoria ON reportes(categoria);
CREATE INDEX IF NOT EXISTS idx_reportes_fecha_creacion ON reportes(fecha_creacion DESC);

CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON notificaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario_leida ON notificaciones(usuario_id, leida);
CREATE INDEX IF NOT EXISTS idx_notificaciones_fecha_creacion ON notificaciones(fecha_creacion DESC);

INSERT INTO permisos (nombre_permiso) VALUES
('moderar_comentarios'),
('ver_denuncias'),
('marcar_solucionado'),
('comunicar_ciudadano'),
('gestionar_reportes'),
('gestionar_usuarios'),
('gestionar_roles'),
('ver_dashboard')
ON CONFLICT (nombre_permiso) DO NOTHING;

CREATE OR REPLACE FUNCTION actualizar_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_actualizar_fecha_reportes ON reportes;

CREATE TRIGGER trg_actualizar_fecha_reportes
BEFORE UPDATE ON reportes
FOR EACH ROW
EXECUTE FUNCTION actualizar_fecha_actualizacion();