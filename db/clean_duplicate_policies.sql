-- Eliminar políticas duplicadas y mantener solo las correctas

-- Eliminar políticas antiguas problemáticas
DROP POLICY IF EXISTS "Los usuarios pueden crear sus propias reservas" ON reservas;
DROP POLICY IF EXISTS "Los usuarios pueden editar sus propias reservas" ON reservas;
DROP POLICY IF EXISTS "Los usuarios pueden ver todas las reservas" ON reservas;
DROP POLICY IF EXISTS "Users can delete their own reservations" ON reservas;

-- Verificar que solo queden las políticas correctas
SELECT policyname, cmd, 
       CASE 
         WHEN cmd = 'INSERT' THEN 'Solo admin/subdirector/super_admin'
         WHEN cmd = 'UPDATE' THEN 'Solo admin/subdirector/super_admin'
         WHEN cmd = 'DELETE' THEN 'Solo admin/super_admin'
         WHEN cmd = 'SELECT' THEN 'Todos pueden ver'
       END as descripcion
FROM pg_policies 
WHERE tablename = 'reservas'
ORDER BY cmd;