# Guía de estilo — Sistema de Reservas SLEP Valparaíso

Guía de identidad visual del proyecto. Describe la paleta institucional, tipografía,
patrones de componentes y convenciones para mantener consistencia.

- **Stack real:** Angular 17 + Ionic (standalone components) + Supabase.
- **Theming:** variables CSS de Ionic en `frontend/src/theme/variables.scss`. NO se usa
  Tailwind ni hex inline. Los componentes son `ion-*` y se colorean con el atributo
  `color="primary|secondary|danger|..."`, no con clases utilitarias.
- **Idioma:** todo en español de Chile (es-CL). Fechas en formato es-CL.

> Nota: existe un documento de referencia externo escrito para un stack React + Vite +
> TailwindCSS. De ese documento SOLO se toma la paleta de color institucional. Las
> convenciones de implementación de este proyecto son las de Angular/Ionic descritas aquí.

---

## 1. Paleta de colores (institucional)

Definida como variables de Ionic en `theme/variables.scss`. Usar SIEMPRE el token, nunca el hex suelto.

| Rol | Hex | Token Ionic | Uso |
|-----|-----|-------------|-----|
| Azul institucional (primario) | `#25306B` | `color="primary"` | Header, footer, títulos, badges oscuros |
| Celeste (acento Gobierno) | `#006BB9` | `color="secondary"` | Estados activos, focus, botones secundarios, franja |
| Azul oscuro (franja inferior) | `#1d2650` | `color="tertiary"` | Barra inferior del footer |
| Rojo (acento Gobierno) | `#FF1D3D` | `color="danger"` | Franja decorativa, acentos de alerta, errores |
| Verde | `#3AB54A` | `color="success"` | Éxito / estados positivos |
| Amarillo | `#F7C500` | `color="warning"` | Advertencia / destacados |
| Gris de fondo | `#EDF0F5` | `--ion-background-color` | Fondo general de la app |

**Franja decorativa Gobierno de Chile:** barra fina horizontal, mitad celeste `#006BB9`
+ mitad rojo `#FF1D3D`. Se repite en header, footer y login. Altura entre 2px y 8px
según el lugar. Como es decorativa, marcarla `aria-hidden="true"`.

### Regla de oro
Si necesitas un color, úsalo vía token (`color="..."` o `var(--ion-color-...)`).
Si el color no existe en la paleta, NO lo inventes inline: agrégalo primero a
`variables.scss` como token y documéntalo aquí.

---

## 2. Contraste y accesibilidad (WCAG)

Pares de color aprobados (fondo → texto):

| Fondo | Texto | Resultado |
|-------|-------|-----------|
| Azul `#25306B` | Blanco | OK (contraste alto) |
| Celeste `#006BB9` | Blanco | OK |
| Rojo `#FF1D3D` | Blanco | Aceptable solo para texto grande/bold o íconos; evitar en texto pequeño |
| Amarillo `#F7C500` | **Negro** | OK. NUNCA texto blanco sobre amarillo |
| Verde `#3AB54A` | Blanco | Aceptable para texto grande; preferir negro en texto pequeño |
| Gris `#EDF0F5` | Gris oscuro/azul | OK para cuerpo de texto |

- Objetivo: WCAG AA → 4.5:1 texto normal, 3:1 texto grande (≥18px bold o ≥24px).
- Área táctil mínima recomendada: 44×44 px (botones e ítems clicables).
- Todo elemento interactivo necesita estado `:focus-visible` visible (anillo celeste).
- La validación completa de accesibilidad requiere pruebas manuales con lectores de
  pantalla y revisión experta; las herramientas automáticas no cubren todo.

---

## 3. Tipografía

- **Decisión del proyecto:** no se cargan Museo Sans ni gobCL (fuentes de marca de
  Gobierno). Se usa la fuente sans-serif por defecto de Ionic. NO escribir en el código
  clases o `font-family` que apunten a fuentes no cargadas (genera confusión).
- Si en el futuro se quiere acercar a la identidad de Gobierno sin licencias, el UI Kit
  de Gobierno Digital sugiere **Roboto Slab** para encabezados como alternativa libre.
  Para adoptarla: cargar la fuente (CDN o `@font-face`) y recién ahí referenciarla.

Jerarquía de tamaños (Ionic/CSS):

- Título de página: `text-2xl` equivalente, `font-weight: 700`.
- Subtítulo de sección: ~1.125rem, bold.
- Labels de columna/footer: ~11px, bold, uppercase, `letter-spacing`.
- Cuerpo: 0.875rem / 0.8rem.
- Notas: 0.625–0.6875rem.

---

## 4. Componentes y patrones

### Botones (`ion-button`)
- Primario: `color="primary"` (o `secondary` para acción alternativa), `expand="block"`
  en formularios. Estado deshabilitado con `[disabled]`.
- Secundario / cancelar: `fill="outline"` `color="medium"`.
- Peligro (eliminar/cancelar reserva): `color="danger"`.

### Tarjetas (`ion-card`)
- Contenedor estándar de contenido: `ion-card` + `ion-card-header` + `ion-card-content`.
- Bordes redondeados y sombra suave (default de Ionic). Para resúmenes importantes,
  encabezado con `ion-card-title`.

### Inputs y formularios
- Usar `ion-item` + `ion-label position="stacked"` + control (`ion-input`,
  `ion-textarea`, `ion-select`).
- Focus ring celeste (hereda de `--ion-color-secondary`).
- Campo obligatorio: asterisco rojo en el label (`color="danger"` o `*` en rojo).
- Estado de error: mensaje bajo el campo con `color="danger"` y texto claro de qué corregir.

### Segmentos (`ion-segment`)
- Para alternar entre opciones excluyentes (ej. selector de edificio). `color="primary"`.

### Badges / estados (`ion-badge`)
- Píldora con color por estado: `success` (ok/vigente), `warning` (pendiente),
  `danger` (bloqueado/sin cupo), `secondary` (info).

### Alertas y mensajes
- `ion-alert` para confirmaciones (cancelar/confirmar reserva, éxito, error).
- Toasts (`ToastController`) para feedback breve: `color="success"` o `color="danger"`,
  `position="top"`, `duration: 3000`.

---

## 5. Convenciones

- **Tokens, no hex inline.** Centralizar color en `variables.scss`.
- **Componentes Ionic, no HTML+CSS a mano** cuando exista el componente equivalente.
- **Español (Chile)** en toda la UI. Fechas con `toLocaleDateString('es-ES'/'es-CL')`.
- **Iconografía:** `ionicons` (los `name="..."` de Ionic). No mezclar librerías de íconos.
- **Layout:** `ion-header` + `ion-content [fullscreen]`. Contenido centrado con anchos máximos.

---

## 6. Modo oscuro (riesgo a controlar)

`index.html` declara `<meta name="color-scheme" content="light dark">`, lo que habilita
que el navegador/SO aplique modo oscuro automático. Hoy NO hay un dark mode diseñado, así
que puede alterar la identidad institucional sin control.

Decisión pendiente (elegir una):
- (a) Diseñar un dark mode con la paleta institucional adaptada, o
- (b) Fijar el tema claro: quitar `dark` del meta `color-scheme` y no incluir las media
  queries de dark de Ionic.

Mientras no se decida, tratar cualquier aparición de dark mode como bug visual.

---

## 7. Do's & Don'ts

**Do**
- Usar `color="primary|secondary|danger|success|warning"` para colorear componentes.
- Agregar colores nuevos como tokens en `variables.scss` y documentarlos aquí.
- Mantener contraste AA; texto negro sobre amarillo.
- Marcar la franja decorativa como `aria-hidden="true"`.

**Don't**
- No usar hex inline (`style="color:#25306B"`) ni clases Tailwind: este proyecto no usa Tailwind.
- No poner texto blanco sobre amarillo `#F7C500`.
- No referenciar Museo Sans / gobCL mientras no estén cargadas.
- No introducir una segunda librería de íconos.
- No dejar que el dark mode automático altere la identidad sin una decisión explícita.

---

## 8. Resumen (una línea)

App de gobierno chileno en Angular + Ionic: azul institucional `#25306B` + acentos celeste
`#006BB9` y rojo `#FF1D3D`, fondo gris `#EDF0F5`, color vía tokens de Ionic
(`--ion-color-*`) sin Tailwind ni hex inline, componentes `ion-*`, español es-CL, íconos
ionicons, texto negro sobre amarillo por contraste, fuentes de marca no cargadas (fallback
sans-serif por decisión), dark mode automático a controlar.

---

## 9. Versionado del sistema (SemVer)

El sistema de Reservas usa **Semantic Versioning**: `MAYOR.MENOR.PARCHE` (ej. `1.1.0`),
con sufijos de pre-lanzamiento cuando aplica. Referencia: https://semver.org/lang/es/

> Nota de stack: el sistema de Matrículas (React + Vite) inyecta la versión con
> `__APP_VERSION__` vía `vite.config.ts`. **Reservas es Angular**, así que el mecanismo
> es distinto (import del `package.json` en `environment`). No copiar el patrón de Vite aquí.

### Fuente única de verdad
- La versión vive SOLO en `frontend/package.json` → campo `version`.
- NO escribir la versión a mano en componentes. Se importa del `package.json`:
  - `frontend/tsconfig.json` tiene `"resolveJsonModule": true` y `"esModuleInterop": true`
    (necesarios para importar el JSON).
  - `src/environments/environment.ts` y `environment.prod.ts` hacen
    `import packageJson from '../../package.json'` y exponen `version: packageJson.version`.
  - Los componentes la leen desde `environment.version` (ej. el footer del login la muestra
    como `Versión {{ version }}`).
- Tras cambiar la versión hay que re-`npm run build` para que el footer muestre el nuevo número.

### Cuándo subir cada número
| Tipo de cambio | Qué subir | Ejemplo |
|---|---|---|
| Arreglo de bug, ajuste menor, cambio de estilo | PARCHE | `1.1.0` → `1.1.1` |
| Funcionalidad nueva compatible | MENOR | `1.1.0` → `1.2.0` |
| Cambio grande / incompatible / rediseño | MAYOR | `1.2.0` → `2.0.0` |

### Fases de pre-lanzamiento
`alpha` (interno) → `beta` (piloto con usuarios reales) → `rc` (casi listo) →
sin sufijo = estable de producción.

### Estado actual
- **`1.2.0`** (estable, en producción). Historial reciente:
  - `1.1.0`: login institucional homologado con RGM 2027, guía de estilo, paleta SLEP,
    cambio de salas Guayaquil→Bandurrias.
  - `1.2.0`: mejoras UX — homologación de colores (morado→azul institucional) en Mis
    Reservas, mejor distribución de tarjetas (sin espacio en blanco), búsqueda por fecha
    específica en Mis Reservas, y flip de bloques con reserva en la grilla de Reservar
    (muestra iniciales del responsable, reemplaza el tooltip negro flotante).
  - `1.3.0`: topbar y tab bar institucionales (azul `#25306B` + franja celeste/rojo,
    logo blanco, botón Salir rojo) en el componente compartido `components/tabs` → afecta
    TODAS las páginas internas. Homologación de Reservas del Día (quitado azul genérico
    `#1976d2` y degradados). Flip mejorado: muestra nombre corto (nombre + apellido) +
    motivo truncado, el bloque se agranda en hover.
  - `1.4.0`: responsividad y mejor distribución. Grids fluidos (`auto-fill minmax(300px, 1fr)`)
    en Mis Reservas y Reservas del Día con ancho máximo 1280px centrado (aprovecha pantallas
    anchas, 1 columna en móvil). Colores de la grilla de Reservar homologados a la paleta SLEP
    (verde `#3AB54A`, rojo `#FF1D3D`, amarillo `#F7C500`, azul `#006BB9`) y azul Ionic viejo
    `#3880ff` eliminado. Topbar con media queries (oculta email/área y texto "Salir" en móvil).
  - `1.5.0`: segmentos (selector de edificio en Reservar y filtro de rango en Mis Reservas)
    rediseñados como pills institucionales (seleccionado azul `#25306B` + sombra, resto con
    texto azul sobre fondo gris). Modal del calendario de Mis Reservas con alto fijo para que
    el `ion-datetime` se vea completo. Filtros más compactos.
  - `1.5.1`: fixes. (1) Calendario de Mis Reservas: números de día eran blancos sobre blanco,
    forzados a azul institucional legible. (2) Flip de la grilla: ya no expande la celda
    (causaba distorsión y scrollbar); ahora el detalle aparece como panel flotante de tamaño
    fijo que no altera el layout. (3) Iniciales corregidas: usan primer nombre + primer
    apellido (ej. "Lionel Nolberto Claro" -> "LC", antes daba "LN").
  - `1.6.0`: filtros de Mis Reservas simplificados a **Hoy / Fecha / Todas** (se quitaron
    "Esta Semana" y "Este Mes" por bajo uso). El título del grupo refleja correctamente el
    filtro: "HOY" para hoy, la fecha real al elegir una fecha específica, y agrupado por fecha
    en "Todas".
  - `1.6.1`: fix definitivo del calendario (números de día invisibles). Los estilos de color
    del `ion-datetime` se movieron a `global.scss` porque los `::part()` NO cruzan la
    encapsulación scoped de los componentes Angular. Regla importante: para estilar partes
    internas de componentes Ionic (shadow DOM) usar `global.scss`, no el `<style>` del componente.
  - `1.6.2`: refuerzo del fix anterior — se forzó `--ion-text-color` del datetime y del modal
    a azul, más `!important` en los `::part(calendar-day)`.
  - `1.7.0`: mejor contraste del tab bar inferior (texto inactivo blanco atenuado legible,
    tab activo con barra superior blanca + fondo sutil). Formulario de reserva: "Propósito de
    la Reunión" → "Motivo" con asterisco rojo obligatorio y placeholder con ejemplos
    representativos ("Reunión de equipo, capacitación, atención de público…"); textarea con
    auto-grow. Resumen centrado con ancho máximo.
  - `1.7.1`: texto "Responsable" → "Organizador de la reunión" / "Organizador" en toda la UI
    (formulario, buscador, tarjetas de Mis Reservas y Reservas del Día, modal). Solo cambió el
    texto visible; el campo interno sigue siendo `responsable` / `responsable_id` en código y BD.
  - `1.8.0`: página Reservar con layout de 2 columnas (Opción 2). En escritorio (≥992px) la
    grilla va a la izquierda y el formulario a la derecha, FIJO (sticky), siempre visible sin
    scroll. En móvil (<992px) se apila (grilla arriba, formulario abajo). Chips de motivos
    sugeridos (PMG, Reunión Equipo Directivo, Comisión Evaluadora, Reunión de equipo, Acopio
    de material) basados en el histórico real: tocar un chip rellena el campo Motivo (toggle),
    el campo sigue editable libre. Hint guía cuando no hay selección. Los chips se definen en
    `motivosSugeridos` en reservar.page.ts (lista fija; a futuro podría ser una tabla en BD).
  - `1.8.1`: ajustes del layout de 2 columnas. Grilla compactada en escritorio (columna sala
    120px, celdas 56px, filas 42px) para que QUEPA junto al panel sin scroll-x ni necesidad de
    zoom. Panel del formulario reducido a 300px y resumen más compacto (menos padding). Leyenda
    con `white-space: nowrap` para que no se corte el texto (Disponible/Ocupado/Mi Reserva/
    Seleccionado). Buscador de organizador: ahora requiere mínimo 2 letras, máximo 6 resultados
    ordenados por nombre, debounce 400ms.
  - `1.8.2`: botón para quitar el organizador seleccionado (ícono X rojo en la tarjeta del
    organizador). `ResponsableSearchComponent` ahora emite `null` al quitar, y el formulario
    deshabilita Confirmar al no haber organizador. Evita tener que reemplazar por otro para
    corregir una selección errónea.
  - `1.8.3`: compactación vertical en escritorio para que todo quepa sin zoom. La fecha y el
    botón "Elegir fecha" van en una sola fila; flechas de navegación más pequeñas (34px);
    menos padding en fecha/edificio/título. Grilla aún más compacta (columna sala 110px,
    celdas 50px, filas 38px) para eliminar el scroll horizontal junto al panel.
  - `1.8.4`: resumen del panel más compacto — cajas Fecha/Sala/Horarios más pequeñas, en bold,
    con menos gap entre ellas y hacia los chips de motivo. Placeholder del motivo acortado
    ("Toca un motivo o escribe uno…") para que no se corte en el panel angosto; fuente del
    textarea reducida.
  - `1.9.0`: grilla de disponibilidad AHORA FLUIDA en escritorio. Antes tenía anchos fijos en
    px (celdas 50px) → no se adaptaba al cambiar de monitor/resolución y obligaba a scroll.
    Ahora las celdas usan `flex: 1 1 0` (sin min-width) y se reparten el ancho disponible, con
    `overflow-x: hidden`: se ven las 11 horas completas sin scroll en cualquier pantalla de
    laptop/desktop. Encabezados de hora en formato compacto "08-09" (método `horarioCorto`).
    En móvil (<992px) la grilla mantiene scroll-x (son muchas columnas para un celular).
  - `1.9.1`: ajuste clave de breakpoints. El panel lateral (2 columnas) ahora solo se activa en
    pantallas MUY anchas (≥1400px); en laptops y pantallas medianas (992–1399px) el formulario
    se APILA abajo, dándole todo el ancho a la grilla (así no se corta ni la grilla ni el botón
    Confirmar). La grilla fluida (celdas flex) aplica desde 992px en ambos layouts. El panel
    lateral tiene `max-height: calc(100vh - 90px)` + `overflow-y: auto` para que, si su contenido
    es más alto que la pantalla, tenga scroll propio y nunca se corte el botón Confirmar.
  - `1.9.2`: breakpoint del panel lateral bajado a ≥1280px (cubre laptops 1920px con escalado
    de Windows 125-150%, que reducen el ancho CSS efectivo). Panel a 300px. Fix del botón quitar
    organizador (X) que se cortaba: la tarjeta del organizador seleccionado ahora tiene el botón
    con tamaño fijo (flex-shrink:0), texto más chico con wrap y sin padding-end que lo empujara.
  - `1.9.3`: fix definitivo del desbordamiento de la grilla. CAUSA: `.horarios-grid` era `flex:1`
    sin `min-width: 0`, lo que impedía que las celdas encogieran (flexbox no encoge bajo el
    contenido natural sin `min-width:0`). Agregado `min-width: 0`. Además columna "Sala" reducida
    a 88px en escritorio y celdas con menos padding, para que las 11 horas quepan sin scroll en
    la pantalla de laptop. Placeholder del buscador acortado a "Buscar por nombre…".

### Comandos para subir versión
```
cd frontend
npm version patch   # 1.1.0 -> 1.1.1
npm version minor   # 1.1.0 -> 1.2.0
npm version major   # 1.2.0 -> 2.0.0
npm version prerelease --preid=beta   # 1.1.0 -> 1.1.1-beta.0
```
> `npm version` crea commit + tag git por defecto. Para evitarlo:
> `npm version <x> --no-git-tag-version` y commitear a mano.
> Recordar: subir versión → `npm run build` → push a `desarrollo` → desplegar en servidor.

---

## 10. UI institucional compartida — pendiente de extraer a componentes

Hoy el login (`pages/login/login.page.html`) tiene la identidad institucional homologada con
RGM 2027: franja decorativa celeste/rojo, tarjeta con encabezado azul `#25306B` + borde rojo,
y footer institucional de 4 columnas (logo / soporte / contacto / marco normativo) con franja
inferior `#1d2650` que incluye copyright + versión.

**Deuda / próximo paso:** ese header, footer y franja están inline en el login. Para que TODAS
las pantallas (reservar, calendario, mis reservas) se vean igual, conviene extraerlos a
componentes Angular reutilizables (ej. `AppFooterComponent`, `AppHeaderComponent`) y usarlos en
el layout común. Mientras no se haga, replicar los mismos colores y estructura descritos aquí.

> PENDIENTE acordado con el dueño: crear ese header/footer institucional compartido (footer de
> 4 columnas + franja inferior con versión, como el login y RGM 2027) y usarlo en las páginas
> internas. Estado parcial en v1.2.0: ya se homologaron los COLORES de las páginas internas
> (se quitó el degradado morado en Mis Reservas); falta el componente compartido.

Decisiones de contenido del footer (heredadas de RGM, confirmar con el dueño si cambian):
- NO logo Mineduc, NO redes sociales, NO párrafo descriptivo largo.
- Crédito "Área de Tecnología e Informática" visible.
- Copyright sin inventar marcas; incluir la versión a la derecha.

---

## 11. Despliegue y caché del navegador

### Servidor (producción)
- Instancia AWS Lightsail con **Bitnami NGINX**. El sistema de Reservas vive en
  `/opt/bitnami/nginx/apps/reservas` (clon git, rama `desarrollo`), y NGINX sirve la carpeta
  compilada `frontend/dist`.
- Dominio: `https://reservas.slepvalparaiso.gob.cl`. Server block:
  `/opt/bitnami/nginx/conf/server_blocks/11-reservas-https.conf`.
- Es una **SPA Angular**: una sola `index.html`; todas las rutas (`/tabs/reservar`, etc.)
  caen a ella vía `try_files $uri $uri/ /index.html`. NO hay páginas HTML separadas.

### Pasos de despliegue
```
cd /opt/bitnami/nginx/apps/reservas
git pull origin desarrollo
cd frontend && npm run build
sudo /opt/bitnami/ctlscript.sh restart nginx
```

### Caché (importante)
- El server block define caché diferenciada:
  - `location = /index.html` → `Cache-Control: no-cache, no-store, must-revalidate`
    (el index NUNCA se cachea, así cada deploy se ve sin forzar recarga).
  - Assets con hash (`*.js`, `*.css`, imágenes, fuentes) → `expires 1y; immutable`
    (son inmutables: Angular cambia el hash del nombre en cada build).
- Esto es **buena práctica estándar** para SPAs, no un workaround.
- Antes de recargar NGINX tras editar el `.conf`: respaldar con `.bak` y validar con
  `sudo /opt/bitnami/nginx/sbin/nginx -t` (debe decir "test is successful"). Si falla,
  restaurar el `.bak`. Editar el `.conf` SOLO dentro de un editor (nano), nunca pegarlo en bash.

### Comportamiento esperado para usuarios finales
- Con la config de caché anterior, tras un deploy la mayoría de usuarios ve la versión nueva
  al entrar normalmente (sin Ctrl+Shift+R).
- Un usuario que entró JUSTO antes de aplicar el `no-cache` puede conservar un `index.html`
  viejo en su navegador hasta que expire o reabra el navegador. Caso poco frecuente.

### PENDIENTE (decisión del dueño: por ahora NO se implementa)
- Para garantía 100% de que ningún usuario quede con versión vieja en NINGÚN deploy, la
  solución robusta es el **Service Worker de Angular con `SwUpdate`** (detecta versión nueva y
  auto-recarga o avisa). Queda documentado como mejora futura; hoy se confía en la config de
  caché de NGINX, que cubre a la mayoría.

---

## 12. Seguridad de la base (Supabase)

- La URL del proyecto y la **anon key** son públicas por diseño (van al navegador en apps
  cliente). Lo que protege la base es **RLS (Row Level Security)**, no ocultar esas claves.
  La **service_role key** jamás debe estar en el frontend (verificado: no lo está).
- Políticas RLS del proyecto: ver `db/policies.sql` (usuarios, reservas, salas, edificios,
  qr_checkin) y `db/fix_rls_seguridad.sql` (historial_reservas + vistas).

### Correcciones del linter de Supabase (04/10/2026) — ver `db/fix_rls_seguridad.sql`
- `historial_reservas`: se habilitó RLS con política de solo lectura para autenticados. La
  tabla la llenan triggers SECURITY DEFINER, así que no se dan políticas de escritura a
  usuarios (historial inmutable para ellos, auditoría automática intacta).
- `vista_reservas_completa` y `vista_historial_completo`: cambiadas a `security_invoker = on`
  (respetan el RLS del usuario que consulta). Se usó `ALTER VIEW ... SET` para NO alterar su
  consulta interna.

### IMPORTANTE: objetos de OTRO sistema en la misma base
- Las vistas con prefijo `v_oirs_*` pertenecen al sistema **OIRS**, que comparte la misma
  base Supabase. NO modificarlas desde el proyecto de Reservas; las corrige el responsable de
  OIRS. Al revisar el linter, filtrar solo los objetos de Reservas.
