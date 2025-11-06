# Sistema de Reservas de Salas SLEP Valparaíso

Sistema web para la reserva de salas de reunión en los edificios Blanco y Cochrane del Servicio Local de Educación Pública de Valparaíso.

## 🏗️ Arquitectura

- **Frontend**: Ionic Angular
- **Backend**: Supabase (PostgreSQL + Auth)
- **Despliegue**: Nginx en Lightsail (98.90.163.67)
- **Dominio**: reservas.slepvalparaiso.cl

## 🏢 Edificios y Salas

### Edificio Blanco
- Sala Principal
- Sala Guayaquil  
- Sala San Antonio

### Edificio Cochrane
- Sala Principal
- Sala Secundaria

## 🚀 Instalación

1. Clonar el repositorio
2. Copiar `.env.example` a `.env` y configurar variables
3. Instalar dependencias del frontend:
   ```bash
   cd frontend
   npm install
   ```
4. Ejecutar migraciones de base de datos en Supabase
5. Iniciar aplicación:
   ```bash
   npm start
   ```

## 📋 Funcionalidades

- ✅ Autenticación con Google Workspace y Microsoft 365
- ✅ Calendario de reservas
- ✅ Gestión de reservas (crear, editar, cancelar)
- ✅ Check-in con QR
- ✅ Recordatorios automáticos
- ✅ Panel de administración
- ✅ Estadísticas de uso

## 🔧 Configuración

Ver documentación en `/docs/` para detalles de configuración y despliegue.