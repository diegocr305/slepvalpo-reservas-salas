-- Script para migrar reservas existentes al historial
-- Ejecutar DESPUÉS de crear la tabla historial_reservas

-- Migrar todas las reservas existentes como 'INSERT' en el historial
INSERT INTO historial_reservas (
    reserva_id,
    fecha,
    hora_inicio,
    hora_fin,
    sala_id,
    usuario_id,
    proposito,
    estado,
    checkin_realizado,
    checkin_timestamp,
    recordatorio_enviado,
    accion,
    fecha_accion,
    sala_nombre,
    edificio_nombre,
    usuario_nombre,
    usuario_email,
    created_at,
    updated_at
)
SELECT 
    r.id as reserva_id,
    r.fecha,
    r.hora_inicio,
    r.hora_fin,
    r.sala_id,
    r.usuario_id,
    r.proposito,
    r.estado,
    r.checkin_realizado,
    r.checkin_timestamp,
    r.recordatorio_enviado,
    'INSERT' as accion,
    r.created_at as fecha_accion, -- Usar la fecha original de creación
    s.nombre as sala_nombre,
    e.nombre as edificio_nombre,
    u.nombre_completo as usuario_nombre,
    u.email as usuario_email,
    r.created_at,
    r.updated_at
FROM reservas r
JOIN salas s ON r.sala_id = s.id
JOIN edificios e ON s.edificio_id = e.id
JOIN usuarios u ON r.usuario_id = u.id
WHERE NOT EXISTS (
    SELECT 1 FROM historial_reservas hr 
    WHERE hr.reserva_id = r.id AND hr.accion = 'INSERT'
);

-- Verificar la migración
SELECT 
    'Reservas en tabla principal' as tipo,
    COUNT(*) as cantidad
FROM reservas
UNION ALL
SELECT 
    'Registros en historial' as tipo,
    COUNT(*) as cantidad
FROM historial_reservas
UNION ALL
SELECT 
    'Reservas únicas en historial' as tipo,
    COUNT(DISTINCT reserva_id) as cantidad
FROM historial_reservas;