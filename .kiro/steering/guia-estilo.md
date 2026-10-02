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
