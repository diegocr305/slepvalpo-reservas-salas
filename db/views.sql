-- Vistas para consultas optimizadas

-- Vista de reservas con información completa
CREATE VIEW vista_reservas_completa AS
SELECT 
    r.id,
    r.fecha,
    r.hora_inicio,
    r.hora_fin,
    r.proposito,
    r.estado,
    r.checkin_realizado,
    r.checkin_timestamp,
    r.created_at,
    s.nombre as sala_nombre,
    e.nombre as edificio_nombre,
    u.nombre_completo as usuario_nombre,
    u.email as usuario_email,
    u.area as usuario_area
FROM reservas r
JOIN salas s ON r.sala_id = s.id
JOIN edificios e ON s.edificio_id = e.id
JOIN usuarios u ON r.usuario_id = u.id;

-- Vista de estadísticas mensuales por sala
CREATE VIEW estadisticas_salas_mensual AS
SELECT 
    s.nombre as sala_nombre,
    e.nombre as edificio_nombre,
    DATE_TRUNC('month', r.fecha) as mes,
    COUNT(*) as total_reservas,
    COUNT(CASE WHEN r.estado = 'confirmada' THEN 1 END) as confirmadas,
    COUNT(CASE WHEN r.estado = 'cancelada' THEN 1 END) as canceladas,
    COUNT(CASE WHEN r.estado = 'no_show' THEN 1 END) as no_shows,
    COUNT(CASE WHEN r.checkin_realizado = true THEN 1 END) as con_checkin,
    ROUND(
        COUNT(CASE WHEN r.checkin_realizado = true THEN 1 END)::numeric / 
        NULLIF(COUNT(CASE WHEN r.estado = 'confirmada' THEN 1 END), 0) * 100, 
        2
    ) as porcentaje_checkin
FROM reservas r
JOIN salas s ON r.sala_id = s.id
JOIN edificios e ON s.edificio_id = e.id
WHERE r.fecha >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '12 months')
GROUP BY s.id, s.nombre, e.nombre, DATE_TRUNC('month', r.fecha)
ORDER BY mes DESC, edificio_nombre, sala_nombre;

-- Vista de disponibilidad de salas por día
CREATE VIEW disponibilidad_salas AS
SELECT 
    s.id as sala_id,
    s.nombre as sala_nombre,
    e.nombre as edificio_nombre,
    generate_series(
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '30 days',
        '1 day'::interval
    )::date as fecha,
    ARRAY_AGG(
        CASE 
            WHEN r.id IS NOT NULL THEN 
                r.hora_inicio::text || '-' || r.hora_fin::text
            ELSE NULL 
        END
    ) FILTER (WHERE r.id IS NOT NULL) as horas_ocupadas
FROM salas s
CROSS JOIN generate_series(
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    '1 day'::interval
) AS fecha_serie
JOIN edificios e ON s.edificio_id = e.id
LEFT JOIN reservas r ON s.id = r.sala_id 
    AND r.fecha = fecha_serie::date 
    AND r.estado = 'confirmada'
WHERE s.activa = true
GROUP BY s.id, s.nombre, e.nombre, fecha_serie::date
ORDER BY fecha_serie::date, e.nombre, s.nombre;