# 🌿 Flujo de Ramas - Sistema Reservas SLEP

## 📋 Esquema de Ramas

```
main (🚀 PRODUCCIÓN)
  ↑
 qa (🧪 TESTING)
  ↑
desarrollo (💻 DESARROLLO)
```

## 🔄 Flujo de Trabajo

### 1. Desarrollo Diario
```bash
# Asegurarse de estar en desarrollo
git checkout desarrollo

# Hacer cambios...
# Editar archivos, agregar funcionalidades

# Guardar cambios
git add .
git commit -m "feat: descripción del cambio"
git push origin desarrollo
```

### 2. Preparar para Testing
```bash
# Ir a rama QA
git checkout qa

# Traer últimos cambios de desarrollo
git merge desarrollo

# Subir a QA para pruebas
git push origin qa

# 🧪 HACER PRUEBAS EN QA
```

### 3. Subir a Producción
```bash
# Solo después de aprobar QA
git checkout main

# Traer cambios aprobados de QA
git merge qa

# Subir a producción
git push origin main

# 🚀 DEPLOY A PRODUCCIÓN
```

## 📝 Comandos Útiles

| Comando | Descripción |
|---------|-------------|
| `git branch -a` | Ver todas las ramas |
| `git checkout [rama]` | Cambiar de rama |
| `git status` | Ver cambios pendientes |
| `git log --oneline` | Ver historial de commits |
| `git pull origin [rama]` | Traer cambios del servidor |

## 🚨 Reglas Importantes

1. **NUNCA** hacer cambios directamente en `main`
2. **SIEMPRE** desarrollar en `desarrollo`
3. **PROBAR** en `qa` antes de producción
4. **COMMITS** descriptivos: `feat:`, `fix:`, `docs:`

## 🏷️ Tipos de Commits

- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `docs:` Documentación
- `style:` Cambios de estilo/formato
- `refactor:` Refactorización de código

## 📍 Estado Actual

- **Rama activa:** `desarrollo`
- **Último deploy:** `main`
- **En testing:** `qa`

---
*Actualizado: $(Get-Date -Format "dd/MM/yyyy")*