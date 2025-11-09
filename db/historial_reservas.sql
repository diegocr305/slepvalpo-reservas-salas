-- Tabla de historial de reservas para respaldo completo
-- Esta tabla mantiene un registro permanente de todas las reservas y sus cambios

CREATE TABLE historial_reservas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reserva_id UUID NOT NULL, -- ID de la reserva original
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    sala_id INTEGER NOT NULL,
    usuario_id UUID NOT NULL,
    proposito TEXT NOT NULL,
    estado VARCHAR(20) NOT NULL,
    checkin_realizado BOOLEAN DEFAULT false,
    checkin_timestamp TIMESTAMP,
    recordatorio_enviado BOOLEAN DEFAULT false,
    
    -- Campos de auditoría
    accion VARCHAR(20) NOT NULL CHECK (accion IN ('INSERT', 'UPDATE', 'DELETE')),
    fecha_accion TIMESTAMP DEFAULT NOW(),
    usuario_accion UUID, -- Usuario que realizó la acción
    
    -- Datos adicionales para contexto
    sala_nombre VARCHAR(100),
    edificio_nombre VARCHAR(50),
    usuario_nombre VARCHAR(255),
    usuario_email VARCHAR(255),
    
    -- Timestamps originales
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Índices para el historial
CREATE INDEX idx_historial_reserva_id ON historial_reservas(reserva_id);
CREATE INDEX idx_historial_fecha_accion ON historial_reservas(fecha_accion);
CREATE INDEX idx_historial_usuario_id ON historial_reservas(usuario_id);
CREATE INDEX idx_historial_accion ON historial_reservas(accion);

-- Función para insertar en historial con datos completos
CREATE OR REPLACE FUNCTION insertar_historial_reserva(
    p_reserva_id UUID,
    p_accion VARCHAR(20),
    p_usuario_accion UUID DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    reserva_record RECORD;
BEGIN
    -- Obtener datos completos de la reserva con joins
    SELECT 
        r.*,
        s.nombre as sala_nombre,
        e.nombre as edificio_nombre,
        u.nombre_completo as usuario_nombre,
        u.email as usuario_email
    INTO reserva_record
    FROM reservas r
    JOIN salas s ON r.sala_id = s.id
    JOIN edificios e ON s.edificio_id = e.id
    JOIN usuarios u ON r.usuario_id = u.id
    WHERE r.id = p_reserva_id;
    
    -- Si no se encuentra la reserva y es DELETE, intentar obtener de historial reciente
    IF NOT FOUND AND p_accion = 'DELETE' THEN
        SELECT 
            hr.reserva_id,
            hr.fecha,
            hr.hora_inicio,
            hr.hora_fin,
            hr.sala_id,
            hr.usuario_id,
            hr.proposito,
            hr.estado,
            hr.checkin_realizado,
            hr.checkin_timestamp,
            hr.recordatorio_enviado,
            hr.sala_nombre,
            hr.edificio_nombre,
            hr.usuario_nombre,
            hr.usuario_email,
            hr.created_at,
            hr.updated_at
        INTO reserva_record
        FROM historial_reservas hr
        WHERE hr.reserva_id = p_reserva_id
        ORDER BY hr.fecha_accion DESC
        LIMIT 1;
    END IF;
    
    -- Insertar en historial si se encontraron datos
    IF FOUND THEN
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
            usuario_accion,
            sala_nombre,
            edificio_nombre,
            usuario_nombre,
            usuario_email,
            created_at,
            updated_at
        ) VALUES (
            p_reserva_id,
            reserva_record.fecha,
            reserva_record.hora_inicio,
            reserva_record.hora_fin,
            reserva_record.sala_id,
            reserva_record.usuario_id,
            reserva_record.proposito,
            reserva_record.estado,
            reserva_record.checkin_realizado,
            reserva_record.checkin_timestamp,
            reserva_record.recordatorio_enviado,
            p_accion,
            NOW(),
            p_usuario_accion,
            reserva_record.sala_nombre,
            reserva_record.edificio_nombre,
            reserva_record.usuario_nombre,
            reserva_record.usuario_email,
            reserva_record.created_at,
            reserva_record.updated_at
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Triggers para auditoría automática
CREATE OR REPLACE FUNCTION trigger_historial_reservas() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM insertar_historial_reserva(NEW.id, 'INSERT');
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM insertar_historial_reserva(NEW.id, 'UPDATE');
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM insertar_historial_reserva(OLD.id, 'DELETE');
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Crear triggers
DROP TRIGGER IF EXISTS trigger_reservas_historial ON reservas;
CREATE TRIGGER trigger_reservas_historial
    AFTER INSERT OR UPDATE OR DELETE ON reservas
    FOR EACH ROW EXECUTE FUNCTION trigger_historial_reservas();

-- Vista para consultar historial completo
CREATE OR REPLACE VIEW vista_historial_completo AS
SELECT 
    hr.*,
    CASE 
        WHEN hr.accion = 'INSERT' THEN 'Creada'
        WHEN hr.accion = 'UPDATE' THEN 'Modificada'
        WHEN hr.accion = 'DELETE' THEN 'Eliminada'
    END as accion_descripcion
FROM historial_reservas hr
ORDER BY hr.fecha_accion DESC;

-- Función para obtener historial de una reserva específica
CREATE OR REPLACE FUNCTION obtener_historial_reserva(p_reserva_id UUID)
RETURNS TABLE (
    id UUID,
    accion VARCHAR(20),
    accion_descripcion TEXT,
    fecha_accion TIMESTAMP,
    estado VARCHAR(20),
    usuario_nombre VARCHAR(255),
    sala_nombre VARCHAR(100),
    edificio_nombre VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        hr.id,
        hr.accion,
        CASE 
            WHEN hr.accion = 'INSERT' THEN 'Creada'
            WHEN hr.accion = 'UPDATE' THEN 'Modificada'
            WHEN hr.accion = 'DELETE' THEN 'Eliminada'
        END as accion_descripcion,
        hr.fecha_accion,
        hr.estado,
        hr.usuario_nombre,
        hr.sala_nombre,
        hr.edificio_nombre
    FROM historial_reservas hr
    WHERE hr.reserva_id = p_reserva_id
    ORDER BY hr.fecha_accion DESC;
END;
$$ LANGUAGE plpgsql;