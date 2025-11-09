-- Función para obtener todas las reservas de un día (bypassa RLS)
-- Permite a funcionarios ver todas las reservas sin restricciones

CREATE OR REPLACE FUNCTION get_reservas_del_dia(fecha_consulta DATE)
RETURNS TABLE (
    id UUID,
    fecha DATE,
    hora_inicio TIME,
    hora_fin TIME,
    proposito TEXT,
    estado VARCHAR(20),
    usuario_id UUID,
    sala_nombre VARCHAR(100),
    edificio_nombre VARCHAR(50),
    usuario_nombre VARCHAR(255),
    usuario_area VARCHAR(100)
) 
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.fecha,
        r.hora_inicio,
        r.hora_fin,
        r.proposito,
        r.estado,
        r.usuario_id,
        s.nombre as sala_nombre,
        e.nombre as edificio_nombre,
        u.nombre_completo as usuario_nombre,
        u.area as usuario_area
    FROM reservas r
    JOIN salas s ON r.sala_id = s.id
    JOIN edificios e ON s.edificio_id = e.id
    JOIN usuarios u ON r.usuario_id = u.id
    WHERE r.fecha = fecha_consulta
    AND r.estado = 'confirmada'
    ORDER BY r.hora_inicio ASC;
END;
$$;