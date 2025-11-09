# Sistema de Roles - SLEP Valparaíso

## 📋 Descripción
Sistema completo de roles para el sistema de reservas de salas con 4 niveles de permisos.

## 🎯 Roles Definidos

### 👑 Super Admin
- **Permisos**: Acceso total al sistema
- **Puede**: Crear, editar, eliminar reservas + Panel de estadísticas + Gestión de usuarios
- **Restricciones**: Ninguna

### 🔧 Admin  
- **Permisos**: Gestión completa de reservas
- **Puede**: Crear, editar, eliminar reservas
- **Restricciones**: No accede a estadísticas ni gestión de usuarios

### 📊 Subdirector
- **Permisos**: Gestión básica de reservas  
- **Puede**: Crear y editar reservas
- **Restricciones**: No puede eliminar reservas

### 👤 Funcionario
- **Permisos**: Solo visualización
- **Puede**: Ver calendario y disponibilidad
- **Restricciones**: No puede crear, editar ni eliminar reservas

## 🚀 Instalación

### 1. Base de Datos
```sql
-- Ejecutar en Supabase
\i db/migration_roles.sql
\i db/policies_roles.sql
```

### 2. Frontend
```bash
# Los archivos ya están creados en:
# - services/auth.service.ts
# - guards/role.guard.ts  
# - models/usuario.model.ts
```

### 3. Actualizar componentes existentes
```typescript
// En cualquier componente
constructor(public authService: AuthService) {}

// En el template
<ion-button *ngIf="authService.canCreateReservations()">
  Crear Reserva
</ion-button>
```

## 📁 Archivos Creados

### Base de Datos
- `db/migration_roles.sql` - Migración de es_admin a rol
- `db/policies_roles.sql` - Políticas RLS por roles

### Frontend  
- `services/auth.service.ts` - Servicio de autenticación con roles
- `guards/role.guard.ts` - Guards para proteger rutas
- `models/usuario.model.ts` - Modelo de usuario con tipos
- `examples/` - Ejemplos de uso en UI y rutas

## 🔒 Seguridad

### Supabase (Backend)
- ✅ Políticas RLS activas
- ✅ Verificación de roles en base de datos
- ✅ Funciones de seguridad

### Angular (Frontend)
- ✅ Guards en rutas sensibles
- ✅ Verificación de permisos en UI
- ✅ Servicio centralizado de roles

## 📖 Uso Rápido

### Verificar permisos en componentes
```typescript
// Inyectar servicio
constructor(public authService: AuthService) {}

// Verificar roles
if (this.authService.canCreateReservations()) {
  // Mostrar botón de crear
}

if (this.authService.isSuperAdmin()) {
  // Mostrar panel de admin
}
```

### Proteger rutas
```typescript
{
  path: 'admin',
  canActivate: [AdminGuard],
  loadComponent: () => import('./admin.page')
}
```

### Mostrar/ocultar en template
```html
<ion-button *ngIf="authService.canEditReservations()">
  Editar
</ion-button>

<div *ngIf="authService.isFuncionario()">
  Solo puedes ver el calendario
</div>
```

## ⚡ Próximos Pasos

1. **Ejecutar migración** en Supabase
2. **Actualizar componentes** existentes con verificaciones de roles
3. **Agregar guards** a rutas sensibles
4. **Crear páginas de admin** para super_admin
5. **Asignar roles** a usuarios existentes

## 🎨 Personalización

Para agregar nuevos roles o permisos:

1. **Actualizar enum** en `usuario.model.ts`
2. **Agregar métodos** en `auth.service.ts` 
3. **Actualizar políticas** en Supabase
4. **Crear guards específicos** si es necesario

¡El sistema está listo para implementar control de acceso granular! 🚀