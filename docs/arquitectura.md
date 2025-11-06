# Arquitectura del Sistema de Reservas SLEP Valparaíso

## 🏗️ Visión General

El sistema está diseñado como una aplicación web moderna con arquitectura de microservicios, utilizando Supabase como backend-as-a-service y Angular/Ionic como frontend.

## 📊 Diagrama de Arquitectura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Supabase      │    │   Servicios     │
│   (Ionic/Angular│◄──►│   (PostgreSQL   │◄──►│   Externos      │
│   + TypeScript) │    │   + Auth + API) │    │   (Amazon SES)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx Server  │    │   Row Level     │    │   Email         │
│   (Lightsail)   │    │   Security      │    │   Templates     │
│   98.90.163.67  │    │   (RLS)         │    │   (HTML)        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Componentes Principales

### Frontend (Ionic Angular)
- **Tecnología**: Angular 17 + Ionic 7
- **Lenguaje**: TypeScript
- **Estilo**: SCSS + Ionic Components
- **Estado**: RxJS + BehaviorSubjects
- **Autenticación**: Supabase Auth (Google + Microsoft)

### Backend (Supabase)
- **Base de Datos**: PostgreSQL con extensiones
- **Autenticación**: OAuth 2.0 (Google Workspace + Microsoft 365)
- **API**: Auto-generada REST + GraphQL
- **Tiempo Real**: WebSockets para actualizaciones
- **Almacenamiento**: Para archivos QR y assets

### Seguridad
- **RLS (Row Level Security)**: Políticas a nivel de fila
- **JWT**: Tokens de autenticación
- **HTTPS**: Certificado SSL/TLS
- **CORS**: Configuración restrictiva

## 📁 Estructura de Datos

### Entidades Principales

```sql
edificios (id, nombre, direccion)
    ↓
salas (id, nombre, edificio_id, capacidad, equipamiento)
    ↓
reservas (id, fecha, hora_inicio, hora_fin, sala_id, usuario_id, proposito, estado)
    ↓
qr_checkin (id, reserva_id, codigo, usado, expires_at)

usuarios (id, email, nombre_completo, area, es_admin)
```

### Relaciones
- Un edificio tiene muchas salas (1:N)
- Una sala tiene muchas reservas (1:N)
- Un usuario tiene muchas reservas (1:N)
- Una reserva tiene un código QR (1:1)

## 🔄 Flujos de Trabajo

### Flujo de Reserva
1. Usuario se autentica (Google/Microsoft)
2. Selecciona fecha y sala disponible
3. Sistema valida disponibilidad
4. Se crea reserva en BD
5. Se envía confirmación por email
6. Se programa recordatorio automático

### Flujo de Check-in
1. Usuario llega a la sala
2. Escanea QR o usa enlace
3. Sistema valida horario (±15 min)
4. Se registra check-in
5. Se actualiza estado de reserva

### Flujo de Administración
1. Admin accede al panel
2. Ve estadísticas y reportes
3. Gestiona salas y usuarios
4. Configura reglas del sistema

## 🚀 Despliegue

### Entorno de Desarrollo
```bash
# Frontend
cd frontend
npm install
npm start  # http://localhost:8100

# Base de datos
# Ejecutar scripts en Supabase Dashboard
```

### Entorno de Producción
```bash
# Build
ng build --configuration=production

# Deploy a Nginx
scp -r dist/* user@98.90.163.67:/var/www/reservas.slepvalparaiso.cl/

# Configuración Nginx
server {
    listen 443 ssl;
    server_name reservas.slepvalparaiso.cl;
    
    root /var/www/reservas.slepvalparaiso.cl;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 📈 Escalabilidad

### Horizontal
- Supabase maneja automáticamente la escalabilidad de BD
- Frontend es estático, se puede servir desde CDN
- Nginx puede usar load balancing si es necesario

### Vertical
- Upgrade del plan de Supabase según uso
- Optimización de consultas con índices
- Caching de datos frecuentes

## 🔒 Seguridad

### Autenticación
- OAuth 2.0 con proveedores confiables
- Restricción de dominio (@slepvalparaiso.cl)
- Tokens JWT con expiración

### Autorización
- RLS en todas las tablas sensibles
- Roles de usuario (admin/user)
- Validación en frontend y backend

### Datos
- Encriptación en tránsito (HTTPS)
- Encriptación en reposo (Supabase)
- Backup automático diario

## 📊 Monitoreo

### Métricas Clave
- Número de reservas por día/mes
- Tasa de no-shows
- Utilización por sala
- Tiempo de respuesta de la aplicación

### Alertas
- Errores de autenticación
- Fallas en envío de emails
- Uso excesivo de recursos
- Intentos de acceso no autorizado

## 🔄 Mantenimiento

### Tareas Regulares
- Backup de base de datos
- Limpieza de códigos QR expirados
- Actualización de dependencias
- Revisión de logs de seguridad

### Actualizaciones
- Versionado semántico (SemVer)
- Testing en ambiente de desarrollo
- Deploy gradual con rollback plan
- Comunicación a usuarios sobre cambios