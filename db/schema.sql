-- Esquema de base de datos para Sistema de Reservas SLEP Valparaíso

-- Tabla de edificios
CREATE TABLE edificios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    direccion TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de salas
CREATE TABLE salas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    edificio_id INTEGER REFERENCES edificios(id),
    capacidad INTEGER DEFAULT 10,
    equipamiento TEXT[],
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de usuarios
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    nombre_completo VARCHAR(255) NOT NULL,
    area VARCHAR(100),
    es_admin BOOLEAN DEFAULT false,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de reservas
CREATE TABLE reservas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    sala_id INTEGER REFERENCES salas(id),
    usuario_id UUID REFERENCES usuarios(id),
    proposito TEXT NOT NULL,
    estado VARCHAR(20) DEFAULT 'confirmada' CHECK (estado IN ('confirmada', 'cancelada', 'no_show')),
    checkin_realizado BOOLEAN DEFAULT false,
    checkin_timestamp TIMESTAMP,
    recordatorio_enviado BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de códigos QR para check-in
CREATE TABLE qr_checkin (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reserva_id UUID REFERENCES reservas(id),
    codigo VARCHAR(255) UNIQUE NOT NULL,
    usado BOOLEAN DEFAULT false,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insertar datos iniciales
INSERT INTO edificios (nombre, direccion) VALUES 
('Blanco', 'Dirección Edificio Blanco'),
('Cochrane', 'Dirección Edificio Cochrane');

INSERT INTO salas (nombre, edificio_id, capacidad) VALUES 
('Principal', 1, 20),
('Guayaquil', 1, 15),
('San Antonio', 1, 12),
('Principal', 2, 25),
('Secundaria', 2, 10);

-- Índices para optimización
CREATE INDEX idx_reservas_fecha ON reservas(fecha);
CREATE INDEX idx_reservas_sala_fecha ON reservas(sala_id, fecha);
CREATE INDEX idx_reservas_usuario ON reservas(usuario_id);
CREATE INDEX idx_qr_codigo ON qr_checkin(codigo);