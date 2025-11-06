-- Políticas de seguridad RLS (Row Level Security) para Supabase

-- Habilitar RLS en todas las tablas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_checkin ENABLE ROW LEVEL SECURITY;

-- Políticas para usuarios
CREATE POLICY "Los usuarios pueden ver su propio perfil" ON usuarios
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Los usuarios pueden actualizar su propio perfil" ON usuarios
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Los admins pueden ver todos los usuarios" ON usuarios
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE id = auth.uid() AND es_admin = true
        )
    );

-- Políticas para reservas
CREATE POLICY "Los usuarios pueden ver todas las reservas" ON reservas
    FOR SELECT USING (true);

CREATE POLICY "Los usuarios pueden crear sus propias reservas" ON reservas
    FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Los usuarios pueden editar sus propias reservas" ON reservas
    FOR UPDATE USING (auth.uid() = usuario_id);

CREATE POLICY "Los usuarios pueden cancelar sus propias reservas" ON reservas
    FOR DELETE USING (auth.uid() = usuario_id);

CREATE POLICY "Los admins pueden gestionar todas las reservas" ON reservas
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE id = auth.uid() AND es_admin = true
        )
    );

-- Políticas para QR check-in
CREATE POLICY "Los usuarios pueden ver sus propios códigos QR" ON qr_checkin
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM reservas 
            WHERE reservas.id = qr_checkin.reserva_id 
            AND reservas.usuario_id = auth.uid()
        )
    );

CREATE POLICY "Sistema puede crear códigos QR" ON qr_checkin
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Sistema puede actualizar códigos QR" ON qr_checkin
    FOR UPDATE USING (true);

-- Las tablas de edificios y salas son de solo lectura para usuarios normales
ALTER TABLE edificios ENABLE ROW LEVEL SECURITY;
ALTER TABLE salas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos pueden ver edificios" ON edificios
    FOR SELECT USING (true);

CREATE POLICY "Todos pueden ver salas" ON salas
    FOR SELECT USING (true);

CREATE POLICY "Solo admins pueden modificar salas" ON salas
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE id = auth.uid() AND es_admin = true
        )
    );