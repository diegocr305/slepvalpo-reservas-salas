# Sistema de Historial de Reservas

## 📋 Descripción
Sistema de respaldo completo para todas las reservas que mantiene un historial permanente de todas las acciones (crear, modificar, eliminar).

## 🚀 Instalación

### 1. Ejecutar en Supabase (en este orden):

```sql
-- 1. Crear tabla e infraestructura de historial
\i historial_reservas.sql

-- 2. Migrar reservas existentes
\i migrar_historial.sql
```

### 2. Verificar instalación:

```sql
-- Ver estadísticas del historial
SELECT 
    accion,
    COUNT(*) as cantidad
FROM historial_reservas 
GROUP BY accion;

-- Ver últimas acciones
SELECT * FROM vista_historial_completo LIMIT 10;
```

## 🔧 Funcionalidades

### ✅ Automático (Triggers)
- **INSERT**: Cada nueva reserva se guarda automáticamente
- **UPDATE**: Cada modificación se registra
- **DELETE**: Cada eliminación se respalda antes de borrar

### ✅ Manual (Métodos del servicio)
```typescript
// Obtener historial completo
await supabaseService.getHistorialReservas();

// Filtrar por usuario
await supabaseService.getHistorialReservas({ usuario_id: 'uuid' });

// Historial de una reserva específica
await supabaseService.getHistorialReservaEspecifica('reserva-uuid');

// Estadísticas
await supabaseService.getEstadisticasHistorial();
```

## 📊 Datos que se guardan

### Información de la reserva:
- Fecha, hora inicio/fin
- Sala y edificio (nombres incluidos)
- Usuario (nombre y email incluidos)
- Propósito y estado
- Check-in realizado

### Información de auditoría:
- Acción realizada (INSERT/UPDATE/DELETE)
- Fecha y hora de la acción
- Usuario que realizó la acción

## 🔍 Consultas útiles

```sql
-- Reservas eliminadas en los últimos 30 días
SELECT * FROM vista_historial_completo 
WHERE accion = 'DELETE' 
AND fecha_accion >= NOW() - INTERVAL '30 days';

-- Historial completo de una reserva
SELECT * FROM obtener_historial_reserva('uuid-de-reserva');

-- Reservas más modificadas
SELECT reserva_id, COUNT(*) as modificaciones
FROM historial_reservas 
WHERE accion = 'UPDATE'
GROUP BY reserva_id 
ORDER BY modificaciones DESC;
```

## ⚠️ Importante
- El historial **NUNCA** se elimina automáticamente
- Cada acción queda registrada permanentemente
- Los triggers funcionan automáticamente
- No afecta el rendimiento de la aplicación