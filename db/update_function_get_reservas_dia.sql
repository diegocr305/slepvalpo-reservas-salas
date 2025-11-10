-- Eliminar función existente y recrearla con zona horaria
DROP FUNCTION IF EXISTS get_reservas_del_dia(date);

-- Recrear función con zona horaria de Chile
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
    usuario_area VARCHAR(100),
    responsable_nombre VARCHAR(255)
) 
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Configurar zona horaria para esta función
    SET LOCAL timezone = 'America/Santiago';
    
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
        u.area as usuario_area,
        COALESCE(resp.nombre_completo, u.nombre_completo) as responsable_nombre
    FROM reservas r
    JOIN salas s ON r.sala_id = s.id
    JOIN edificios e ON s.edificio_id = e.id
    JOIN usuarios u ON r.usuario_id = u.id
    LEFT JOIN usuarios resp ON r.responsable_id = resp.id
    WHERE r.fecha = fecha_consulta
    AND r.estado = 'confirmada'
    ORDER BY r.hora_inicio ASC;
END;
$$;