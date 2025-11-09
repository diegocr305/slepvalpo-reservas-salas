-- Migración para implementar sistema de roles
-- Reemplaza es_admin por campo rol con valores específicos

-- 1. Agregar nueva columna rol
ALTER TABLE usuarios 
ADD COLUMN rol TEXT CHECK (rol IN ('super_admin', 'admin', 'subdirector', 'funcionario')) DEFAULT 'funcionario';

-- 2. Migrar datos existentes
UPDATE usuarios 
SET rol = CASE 
    WHEN es_admin = true THEN 'admin'
    ELSE 'funcionario'
END;

-- 3. Hacer rol NOT NULL después de migrar datos
ALTER TABLE usuarios 
ALTER COLUMN rol SET NOT NULL;

-- 4. Eliminar columna es_admin
ALTER TABLE usuarios 
DROP COLUMN es_admin;

-- 5. Crear índice para rol
CREATE INDEX idx_usuarios_rol ON usuarios(rol);

-- 6. Verificar migración
SELECT rol, COUNT(*) as cantidad 
FROM usuarios 
GROUP BY rol;