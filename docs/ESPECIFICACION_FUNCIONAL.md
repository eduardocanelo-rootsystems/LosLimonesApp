# Especificación Funcional — Web App Los Limones Creativos

> **Cliente:** Los Limones Creativos
> **Desarrollador:** /root · Eduardo Canelo
> **Versión:** 1.0 · Abril 2026
> **Estado:** Especificación cerrada, lista para desarrollo

---

## Índice

1. [Visión general](#1-visión-general)
2. [Lineamientos generales (UI/UX)](#2-lineamientos-generales-uiux)
3. [Stack tecnológico](#3-stack-tecnológico)
4. [Arquitectura de datos](#4-arquitectura-de-datos)
5. [Página 1 — Presupuesto](#5-página-1--presupuesto)
6. [Página 2 — Servicios](#6-página-2--servicios)
7. [Página 3 — Materiales](#7-página-3--materiales)
8. [Página 4 — Mano de Obra (Nómina)](#8-página-4--mano-de-obra-nómina)
9. [Página 5 — Contrato](#9-página-5--contrato)
10. [Página 6 — Facturación (Ventas)](#10-página-6--facturación-ventas)
11. [Página 7 — Compras](#11-página-7--compras)
12. [Página 8 — Dashboard](#12-página-8--dashboard)
13. [Página 9 — Movimientos](#13-página-9--movimientos)
14. [Configuración global](#14-configuración-global)
15. [Modelo de datos completo](#15-modelo-de-datos-completo)
16. [Roadmap de implementación](#16-roadmap-de-implementación)

---

## 1. Visión general

Aplicación web de gestión integral para Los Limones Creativos, empresa de obras en fachadas de edificios en Buenos Aires. El sistema reemplaza el manejo actual basado en planillas dispersas y centraliza:

- Armado de presupuestos con cálculo automático según complejidad de obra (coeficiente K).
- Gestión de catálogos (servicios, materiales, mano de obra) con historial de precios.
- Generación automática de PDF combinado (presupuesto + contrato) con firma digital del cliente.
- Sincronización con ARCA de los 3 CUITs de los socios para visualización unificada de facturación y compras.
- Registro de movimientos de plata fuera de ARCA (caja, transferencias, retiros, gastos sin factura).
- Dashboard ejecutivo con KPIs de salud financiera y rentabilidad por obra.

La empresa está conformada por 3 socios que facturan individualmente (cada uno con su CUIT y certificado digital de ARCA).

---

## 2. Lineamientos generales (UI/UX)

### Estética
Diseño minimalista al estilo Apple/Steve Jobs:
- Mucho whitespace, jerarquía tipográfica clara.
- Tipografía como protagonista visual.
- Colores neutros con uno o dos acentos.
- Animaciones sutiles, sin decoración innecesaria.
- Modo oscuro como default (basado en los mockups recibidos).

### Tipografía
- **Fuente principal:** Jost (Google Fonts).
- **Fuente para datos numéricos:** ui-monospace / SF Mono / Consolas (mejora alineación visual de importes, CUITs, fechas).

### Branding
- Logo "/root" presente en footer global.
- Texto del footer: **"Desarrollado por /root y Eduardo Canelo"**.

### Patrón visual de páginas tipo lista
Todas las páginas con datos tabulares (Facturación, Compras, Movimientos) siguen el mismo patrón:
1. Header con título de sección y botones de acción a la derecha (Exportar, Sincronizar, Nuevo).
2. Fila de cards con KPIs del período.
3. Fila de filtros (búsqueda + dropdowns + rango de fechas).
4. Datatable con sort por columnas.

---

## 3. Stack tecnológico

| Capa | Tecnología | Justificación |
|---|---|---|
| Frontend framework | React 18 + TypeScript + Vite | Tipado fuerte, ecosistema masivo, build rápido |
| Estilos | Tailwind CSS + shadcn/ui | Componentes accesibles, consistencia visual |
| Routing | React Router v6 | Standard de facto para apps tipo dashboard |
| Estado / data fetching | TanStack Query | Cache, sincronización, revalidación |
| Backend (BaaS) | Supabase | PostgreSQL + Auth + Storage + RLS + Vault |
| Base de datos | PostgreSQL (Supabase) | Relacional, soporta JSON para campos flexibles |
| Auth / roles | Supabase Auth + RLS | Login email/password, permisos por rol |
| Storage de fotos | Supabase Storage | CDN incluido, integrado con auth |
| Storage credenciales ARCA | Supabase Vault (pgsodium) | Encriptación de claves privadas a nivel DB |
| Editor del contrato | (no aplica — solo upload de PDF) | Decisión: se sube PDF prearmado |
| Generación de PDF | pdf-lib + Puppeteer (server) | Concatenación, estampado, hashing |
| Firma digital | signature_pad + crypto.subtle | Canvas en frontend + hash SHA-256 |
| Tablas de datos | TanStack Table | Datatables performantes, headless |
| Charts | Recharts | Gráficos React-friendly |
| Integración ARCA | SDK Node.js (afip.js) en Edge Functions | Webservices wsfev1 y consulta de comprobantes |
| Email transaccional | Resend o Supabase + SendGrid | Notificaciones de firma, envío de PDFs |
| Hosting frontend | Vercel | Deploy continuo, CDN global, free tier |
| Control de versiones | Git + GitHub | Repositorio privado |

---

## 4. Arquitectura de datos

### Decisión clave: snapshot de precios

Todos los catálogos con precio (Servicios, Materiales, Mano de Obra) implementan **historial de precios con vigencia**. Cuando un ítem se carga en un presupuesto, **el precio del momento se congela en el ítem del presupuesto**, no se referencia el precio vigente. Esto garantiza que:

- Los presupuestos viejos no se alteran cuando se actualizan precios.
- Los contratos firmados quedan inmutables.
- Existe trazabilidad completa de qué precio se cobró cuándo.

### Decisión clave: separación cliente / interno

El sistema maneja dos vistas de cada presupuesto:
- **Vista cliente**: lo que aparece en el PDF (servicios, materiales, descuento, IVA, total).
- **Vista interna**: incluye además el costo estimado de mano de obra y el margen calculado.

La mano de obra **nunca aparece en el PDF al cliente**. Su única función es el cálculo de rentabilidad para gestión interna.

---

## 5. Página 1 — Presupuesto

### Propósito
Formulario principal del sistema. Permite armar un presupuesto completo con datos del cliente, características de la edificación, servicios, materiales, mano de obra interna, fotos del levantamiento, descuentos y planes de financiamiento.

### Encabezado
- Número correlativo autogenerado tipo `PRESU-2026-0001`, visible desde que se abre el formulario.
- Selector de estado: **Emitido** / **Aprobado** / **Finalizado**.

### Estados del presupuesto

| Estado | Comportamiento |
|---|---|
| **Emitido** | El usuario está armando o ya envió al cliente. Botón "Guardar" congela los precios actuales para este presupuesto. |
| **Aprobado** | El cliente lo aprobó. Genera PDF combinado (presupuesto + contrato) con firma de los dueños y dispara el flujo de firma digital del cliente. |
| **Finalizado** | Obra terminada. Se habilita un dropdown para asociar la factura emitida desde la página Facturación. |

### Sección 1 — Datos del cliente
- Razón Social (input texto).
- Teléfono (input texto).
- Dirección (input texto).
- Nombre Administrador (input texto).
- Email (input texto, validación email).

### Sección 2 — Características de la edificación
- Años de la edificación (input numérico).
- Altura de la edificación (input numérico, sufijo "m").
- Color al momento del levantamiento (input texto).
- Acabado (multi-checkbox): Mampostería / Vidrio / Ladrillo / Concreto / Texturizado.
- Metros Cuadrados (input numérico, sufijo "m²").
- **Condiciones estructurales** (dropdown obligatorio):
  - **Sin Riesgo** — Estado bueno/muy bueno. Sin fisuras estructurales, revoques firmes, ornamentos estables.
  - **Deterioros Leves** — Estado regular. Fisuras capilares (<1mm), manchas de humedad, desprendimiento de pintura.
  - **Riesgo Potencial** — Estado deficiente. Grietas con profundidad, carbonatación, descascaramiento.
  - **Peligro Inminente** — Estado malo/peligroso. Desprendimientos visibles, fallas estructurales (grietas a 45° en vigas), corrosión total.
- **Tipología arquitectónica** (dropdown):
  - Edificio de Perímetro Libre (Torre)
  - Edificio entre Medianeras
  - PH (Propiedad Horizontal)
  - Petit Hôtel
- **Clasificación Técnica de Incendio** (dropdown):
  - E1 — menos de 12m
  - E2 — entre 12m y 47m
  - E3 — más de 47m
- **Valor Patrimonial** (toggle Sí/No):
  - Si es Sí, despliega dropdown:
    - Protección Integral
    - Protección Estructural
    - Protección Cautelar
- **Coeficiente de Complejidad K** (dropdown obligatorio):

| Nivel | Parámetro arquitectónico | K |
|---|---|---|
| K1 — Plano | Fachada lisa, sin salientes, menos de 1 AC por piso | 1.00 |
| K2 — Semi-Saturado | Balcones corridos, 1-2 AC por paño, molduras simples | 1.25 |
| K3 — Saturado | Celosías, múltiples AC, antenas, redes de protección | 1.50 |
| K4 — Crítico | Ángulos negativos, gárgolas, fragilidad estructural | 1.80 |

### Sección 3 — Observaciones
Textarea libre, máximo 350 caracteres, contador visible.

### Sección 4 — Servicios a realizar
Selector múltiple dependiente de la página Servicios (solo activos).

**Cálculo por servicio:**
```
subtotal_servicio = precio_m2 × m2_obra × K
```

### Sección 5 — Lista de materiales
Selector múltiple dependiente de la página Materiales (solo activos). Cada material agregado requiere:
- Selección del material (dropdown).
- Cantidad (numérico, libre).
- La unidad y precio unitario se traen del catálogo.

**Cálculo por material:**
```
subtotal_material = precio_unitario × cantidad
```
(Sin coeficiente K — solo aplica a servicios.)

### Sección 6 — Mosaico de fotos
- Upload de fotos en formatos comunes (jpg, png, webp, heic).
- Grid de hasta 6 fotos.
- Orden automático según orden de subida.
- Compresión cliente-side antes del upload (browser-image-compression).

### Sección 7 — Descuento
- Toggle Sí/No.
- Si es Sí: elegir entre monto fijo ($) o porcentaje (%).

### Sección 8 — Planes de financiamiento
Solo se deja la estructura (selector + campo). Cálculos a definir en futura iteración.

### Sección interna — Análisis de costos (no aparece en PDF)

Visualmente diferenciada (fondo distinto + ícono de candado + leyenda **"Uso interno · No se incluye en el PDF al cliente"**). Idealmente colapsable.

Campos:
- Días estimados de obra (numérico, único por presupuesto).
- Lista dinámica de mano de obra: tipo de empleado (dropdown desde Mano de Obra) + cantidad de empleados.
- El costo diario se trae del catálogo y se congela en el ítem.

**Cálculo:**
```
costo_mano_obra = Σ (costo_diario × cantidad × días_estimados)
```

### Panel de totales (al pie del formulario)

```
─── Visible al cliente (va al PDF) ───
Subtotal Servicios:    $ XXX.XXX
Subtotal Materiales:   $ XXX.XXX
Descuento:            −$ XXX.XXX
Neto:                  $ XXX.XXX
IVA (X% — configurable):   $ XXX.XXX
Total al cliente:      $ XXX.XXX

─── Análisis interno ───
Costo estimado MO:     $ YYY.YYY
Margen bruto:          $ ZZZ.ZZZ  (XX%)
```

**Fórmula del margen:**
```
margen_bruto = total_al_cliente − costo_mano_obra
margen_pct   = (margen_bruto / total_al_cliente) × 100
```

---

## 6. Página 2 — Servicios

### Propósito
ABM de servicios. Esta hoja alimenta el dropdown de servicios en la página Presupuesto.

### Estructura de cada servicio
- Nombre (texto)
- Precio por m² ($)
- Estado (Activo / Inactivo)

### Vista principal
Tabla con:
- Búsqueda por nombre.
- Orden ascendente/descendente por columnas (nombre, precio, estado, fecha de última modificación).
- Filtro por estado (Activo / Inactivo / Todos).
- Acciones por fila: editar, cambiar estado, ver historial de precios.

### Acciones
- Crear, editar, activar/desactivar (no se borra nunca).

### Historial de precios
- Tabla `servicios` → datos maestros (nombre, estado).
- Tabla `servicios_precios` → registros con `servicio_id`, `precio_m2`, `fecha_desde`, `fecha_hasta`.
- Al cargar un servicio en un presupuesto, el precio del momento queda congelado en el ítem.
- Vista "ver historial" muestra timeline de cambios.

---

## 7. Página 3 — Materiales

### Propósito
ABM de materiales. Esta hoja alimenta el selector de materiales en la página Presupuesto.

### Estructura de cada material
- Nombre (texto)
- Unidad de medida (dropdown): m², ml, unidad, kg, litro, bolsa, balde, rollo
- Precio ($) — referido a la unidad seleccionada
- Estado (Activo / Inactivo)

### Vista principal
Tabla con:
- Búsqueda por nombre.
- Orden por columnas.
- Filtros por unidad y por estado.
- Acciones: editar, cambiar estado, ver historial de precios.

### Historial de precios
Mismo esquema que Servicios. Tablas `materiales` + `materiales_precios`.

---

## 8. Página 4 — Mano de Obra (Nómina)

### Propósito
ABM de tipos de empleados con su costo diario. Alimenta el dropdown de mano de obra en la sección interna del Presupuesto.

### Estructura
- Tipo de empleado (texto, ej: Oficial, Ayudante, Capataz, Especialista)
- Costo diario ($)
- Estado (Activo / Inactivo)

### Vista principal
Tabla con búsqueda por tipo, sort por columnas, filtro por estado, acciones.

### Historial de costos
Mismo esquema. Tablas `mano_obra_tipos` + `mano_obra_costos`.

---

## 9. Página 5 — Contrato

### Propósito
ABM mínimo: el usuario sube/reemplaza el PDF de la plantilla de contrato. Ese PDF se concatena al presupuesto cuando este pasa a estado Aprobado.

### Vista
- Visor del PDF actual cargado.
- Botón "Reemplazar PDF" (sube uno nuevo, el anterior pasa a histórico).
- Historial de versiones: lista con fecha de carga, nombre de archivo, usuario, opción de descargar versiones anteriores.
- Sección **Firma de los dueños**: input para subir imagen PNG con fondo transparente. Vista previa.

### Flujo de firma digital al aprobar presupuesto

1. **Generación del documento combinado**:
   - Sistema genera PDF del presupuesto (vista cliente, sin mano de obra).
   - Concatena el PDF del contrato vigente.
   - Estampa firma de los dueños (PNG) en zona de firmas.
   - Calcula `hash_documento = SHA-256(pdf_bytes)`.

2. **Generación del link único de firma**:
   - Token UUID v4 + secret en tabla `firma_tokens`.
   - URL: `app.loslimones.com/firmar/{token}`.
   - Expira en 30 días.

3. **Notificación al cliente**:
   - Email con saludo personalizado, link único, PDF adjunto sin firmar, branding de Los Limones.

4. **Pantalla pública de firma** (`/firmar/{token}`):
   - Verifica token válido, no expirado, no usado.
   - Visor del PDF completo.
   - Datos del cliente prellenados (solo lectura).
   - Canvas de firma (signature_pad) con botón "Limpiar".
   - Checkbox de aceptación: "He leído y acepto los términos del presente contrato y presupuesto".
   - Botón "Firmar y enviar".

5. **Sellado y auditoría**:
   - Captura: timestamp UTC, IP, user-agent, geolocalización aproximada.
   - Genera PDF final con: PDF original + firma del cliente + firma de los dueños + página final de constancia con todos los datos auditables y texto legal de Ley 25.506.
   - Recalcula hash del PDF firmado.
   - Guarda en Supabase Storage: `pdf_firmado_url`.
   - Marca `firma_tokens.usado = true`.

6. **Confirmación**:
   - Pantalla de éxito al cliente.
   - Email al cliente con PDF firmado adjunto.
   - Email a Los Limones notificando.
   - Notificación en el dashboard.

---

## 10. Página 6 — Facturación (Ventas)

### Alcance
La app **no emite facturas**. Lee y sincroniza los comprobantes ya emitidos en ARCA por los 3 CUITs de los socios y los presenta en una vista unificada con campos extra de gestión interna (cobranza).

### Header
- Botón "Vencimientos" (filtro rápido a facturas próximas a vencer).
- Botón "Exportar Excel".
- Botón destacado "Sincronizar ARCA".

### Cards de KPIs (4 tarjetas)
- Total Facturado
- Cobrado (verde)
- Pendiente / Por Cobrar (naranja)
- Vencidas Sin Cobrar (rojo, en cantidad de facturas)

### Filtros
- Buscador por cliente, CUIT o número.
- Dropdown estados (Pendiente / Cobrado / Vencido).
- Dropdown formas de pago.
- Rango de fechas con limpiar.

### Datatable

| Columna | Origen |
|---|---|
| Fecha emisión | ARCA |
| Tipo (Factura A/B/C) | ARCA |
| PV / N° | ARCA |
| Cliente | ARCA |
| CUIT | ARCA |
| Importe | ARCA |
| NC / Asociación | ARCA |
| Vencimiento | Calculado/ARCA |
| Fecha cobro | Editable |
| Días | Calculado |
| Forma pago | Editable (dropdown) |
| Nro. comprobante | Editable |
| Estado | Calculado |

### Estado calculado
```
si fecha_cobro != null → "Cobrado"
si fecha_vencimiento < hoy → "Vencido"
caso contrario → "Pendiente"
```

### Submódulo Emisores
Configuración de los 3 socios:

| Campo | Detalle |
|---|---|
| Nombre del socio | Texto |
| CUIT | Texto |
| Punto de venta | Numérico |
| Certificado digital (.crt) | Upload |
| Clave privada (.key) | Upload (encriptada en Supabase Vault) |
| Vencimiento del certificado | Date + alerta a 30 días |
| Activo / Inactivo | Toggle |

### Lógica de sincronización
Click en "Sincronizar ARCA" dispara Edge Function:
1. Itera sobre los 3 emisores activos.
2. Para cada uno, llama al webservice `wsfev1` con sus credenciales.
3. Solicita comprobantes desde la última sincronización.
4. Hace upsert en tabla `facturas` con clave única `cuit_emisor + tipo + pv + numero`.
5. **No sobrescribe** campos editables (fecha cobro, forma pago, nro comprobante).
6. Toast: "Sincronización completa: X nuevas, Y actualizadas".

Frecuencia: manual + opcional cron diario.

---

## 11. Página 7 — Compras

### Alcance
Igual que Facturación pero del lado de comprobantes recibidos. La app lee desde ARCA los comprobantes que los proveedores emitieron a nombre de los 3 CUITs y los presenta unificados.

### Header
- Botón "Exportar Excel".
- Botón destacado "Sincronizar ARCA".

### Cards de KPIs (3 tarjetas)
- Total Comprobantes (cantidad).
- Total Compras (período) — violeta.
- Proveedores únicos (cantidad de CUITs distintos) — verde.

### Filtros
- Buscador por proveedor, CUIT o número.
- Dropdown tipos (Factura A/B / Nota Crédito / Nota Débito).
- Rango de fechas con limpiar.
- Contador de registros a la derecha.

### Datatable

| Columna | Origen |
|---|---|
| Fecha emisión | ARCA |
| Tipo | ARCA |
| PV / N° | ARCA |
| Proveedor | ARCA |
| CUIT Emisor | ARCA |
| Importe | ARCA |
| NC / Asociación | Editable: botón "Asociar factura →" |

### Lógica especial: Notas de Crédito
- Badge `NC` al lado del tipo.
- Importe en verde (resta del total).
- Botón "Asociar factura →" abre modal con buscador de facturas del mismo proveedor y monto compatible.
- Al asociar, se guarda vínculo en `notas_credito_asociaciones`.
- En el cálculo de Total Compras, las NC asociadas restan automáticamente.

### Sincronización
Mismo patrón que Facturación, con webservice de comprobantes recibidos.

---

## 12. Página 8 — Dashboard

### Header
Selector de período: Este mes / Mes pasado / Trimestre / Año / Custom.

### Sección 1 — Pulso del mes (4 cards con delta vs período anterior)

| Card | Cálculo |
|---|---|
| Facturado | Σ facturas emitidas en período |
| Cobrado | Σ facturas con fecha_cobro en período |
| Gastado | Σ compras del período (NC restadas) + egresos en efectivo |
| Margen estimado | Facturado − Gastado − MO real |

### Sección 2 — Salud financiera

**Bloque A — Cobranza**
- Big number: $ Pendiente de cobro total.
- Top 5 facturas vencidas sin cobrar.
- Mini gráfico aging (0-30 / 31-60 / 61-90 / +90 días).

**Bloque B — Distribución por socio**
- Barras horizontales con facturado por cada CUIT.
- Indicador de % del tope anual de monotributo consumido.
- Alerta visual si supera 80%.

**Bloque C — Top clientes / Top proveedores**
- Top 5 clientes por facturación anual.
- Top 5 proveedores por compras anuales.

**Bloque D — Saldos por cuenta**
- Lista de cuentas activas con saldo actual.
- Total general consolidado.

### Sección 3 — Rentabilidad por obra

Tabla con obras finalizadas en el período:

| Obra | Cliente | Total cotizado | MO real | Materiales | Margen $ | Margen % |

Codificada por color: verde (>30%), amarillo (10-30%), rojo (<10%).

A la derecha: scatter plot con m² (X) vs margen % (Y). Cada punto es una obra.

---

## 13. Página 9 — Movimientos

### Propósito
Registro manual de plata que no pasa por ARCA: caja chica, transferencias entre cuentas propias, retiros de socios, gastos en efectivo sin factura.

### Header
- Botón "Exportar Excel".
- Botón destacado "+ Nuevo movimiento".

### Cards de KPIs (4 tarjetas del período)
- Total ingresos (verde).
- Total egresos (rojo).
- Saldo del período (color según signo).
- Saldo total acumulado.

### Filtros
- Buscador.
- Dropdown Cuenta.
- Dropdown Tipo (Ingreso / Egreso / Transferencia).
- Dropdown Categoría.
- Rango de fechas.
- Contador de registros.

### Datatable

| Columna | Detalle |
|---|---|
| Fecha | Fecha del movimiento |
| Cuenta | Badge con color por cuenta |
| Tipo | Badge: verde / rojo / azul |
| Categoría | Texto |
| Descripción | Texto libre |
| Comprobante | Mini icono si tiene foto adjunta |
| Importe | Monto con signo |
| Saldo cuenta | Saldo después del movimiento |
| Acciones | Editar / Eliminar |

### Modal "Nuevo movimiento"
- Tipo (radio): Ingreso / Egreso / Transferencia entre cuentas.
- Fecha (default: hoy).
- Cuenta (si es Transferencia: Desde + Hacia).
- Categoría (dropdown con buscador).
- Importe (numérico positivo, signo lo determina el tipo).
- Descripción (texto libre, máx 200 caracteres).
- Adjuntar comprobante (opcional, jpg/png, máx 5MB).

Validaciones:
- Transferencia: cuentas Desde y Hacia distintas.
- Egreso con saldo negativo: warning visual, no bloquea.

### Submódulos de configuración

**Cuentas**

| Campo | Detalle |
|---|---|
| Nombre | Texto |
| Tipo | Caja / Banco / Billetera virtual |
| Socio asociado | Socio 1/2/3/Sociedad (opcional) |
| Saldo inicial | Numérico |
| Color | Color picker |
| Activo | Toggle |

**Categorías**

| Campo | Detalle |
|---|---|
| Nombre | Texto |
| Tipo afín | Ingreso / Egreso / Ambos |
| Activo | Toggle |

Categorías pre-cargadas:
- **Egresos**: Insumos, Comidas y viáticos, Traslados, Sueldos sin recibo, Combustible, Honorarios profesionales, Servicios públicos, Alquileres, Mantenimiento, Retiro de socio, Otros.
- **Ingresos**: Pago de cliente en efectivo, Aporte de socio, Devolución de gastos, Otros.

### Cálculo del saldo por cuenta

```
saldo_cuenta(c) = saldo_inicial(c)
  + Σ ingresos donde cuenta_origen_id = c
  + Σ transferencias donde cuenta_destino_id = c
  − Σ egresos donde cuenta_origen_id = c
  − Σ transferencias donde cuenta_origen_id = c
```

Implementado como vista SQL para performance.

---

## 14. Configuración global

Página de Settings (admin only) con:

- **Tasa de IVA** (numérico, default 0%, configurable).
- **Datos fiscales de Los Limones** (logo, dirección, etc.).
- **Texto legal del contrato** (referencia a Ley 25.506 para firma electrónica).
- **Plantillas de email** (notificación de firma, recordatorios de cobro).
- **Configuración de alertas** (vencimiento de certificados ARCA, tope monotributo, etc.).

### Roles y permisos (RLS)

| Rol | Permisos |
|---|---|
| Admin (dueños) | Acceso total |
| Operario | Presupuestos + carga de fotos + lectura de catálogos |
| Contable | Facturación + Compras + Movimientos + Dashboard (read-only en presupuestos) |

---

## 15. Modelo de datos completo

```sql
-- Catálogos
servicios                 (id, nombre, estado, fecha_creacion)
servicios_precios         (id, servicio_id, precio_m2, fecha_desde, fecha_hasta)

materiales                (id, nombre, unidad, estado, fecha_creacion)
materiales_precios        (id, material_id, precio, fecha_desde, fecha_hasta)

mano_obra_tipos           (id, tipo, estado, fecha_creacion)
mano_obra_costos          (id, tipo_id, costo_diario, fecha_desde, fecha_hasta)

-- Presupuestos
presupuestos              (id, numero, estado, fecha_creacion, fecha_aprobacion,
                           cliente_razon_social, cliente_telefono, cliente_direccion,
                           cliente_administrador, cliente_email,
                           edif_anios, edif_altura, edif_color, edif_acabado (jsonb),
                           edif_m2, edif_condicion_estructural, edif_tipologia,
                           edif_clase_incendio, edif_valor_patrimonial,
                           edif_proteccion, coef_k,
                           observaciones, descuento_tipo, descuento_valor,
                           dias_estimados_obra, factura_asociada_id)

presupuesto_servicios     (id, presupuesto_id, servicio_id, nombre_snapshot,
                           precio_m2_snapshot, m2, k_aplicado, subtotal)

presupuesto_materiales    (id, presupuesto_id, material_id, nombre_snapshot,
                           unidad_snapshot, precio_snapshot, cantidad, subtotal)

presupuesto_mano_obra     (id, presupuesto_id, tipo_id, tipo_snapshot,
                           costo_diario_snapshot, cantidad_empleados)

presupuesto_fotos         (id, presupuesto_id, url, orden, fecha_subida)

-- Contrato
contratos_versiones       (id, pdf_url, fecha_carga, usuario_id, vigente)
firmas_duenos             (id, nombre, imagen_url, vigente)
firma_tokens              (token, presupuesto_id, expira_en, usado, fecha_creacion)
presupuestos_firmados     (presupuesto_id, pdf_firmado_url,
                           hash_documento_original, hash_documento_firmado,
                           fecha_firma, ip_firmante, user_agent_firmante,
                           contrato_version_id)

-- ARCA
emisores                  (id, nombre, cuit, punto_venta, cert_url,
                           key_vault_id, cert_vencimiento, activo)

facturas                  (id, emisor_id, cuit_cliente, nombre_cliente,
                           tipo_comprobante, punto_venta, numero, fecha_emision,
                           importe_total, importe_neto, iva, fecha_vencimiento,
                           asociacion_nc, cae, fecha_cae,
                           fecha_cobro, forma_pago, nro_comprobante_pago,
                           notas_internas, ultima_sincronizacion)

formas_pago               (id, nombre, activo)

compras                   (id, socio_receptor_id, cuit_emisor, nombre_proveedor,
                           tipo_comprobante, punto_venta, numero, fecha_emision,
                           importe_total, importe_neto, iva, cae,
                           notas_internas, ultima_sincronizacion)

notas_credito_asociaciones (id, nc_compra_id, factura_compra_id,
                            fecha_asociacion, usuario_id)

-- Movimientos
cuentas                   (id, nombre, tipo, socio_asociado_id,
                           saldo_inicial, color, activo, fecha_creacion)

categorias_movimientos    (id, nombre, tipo_afin, activo)

movimientos               (id, fecha, tipo, cuenta_origen_id, cuenta_destino_id,
                           categoria_id, descripcion, importe,
                           comprobante_url, usuario_id, fecha_creacion)

-- Settings
configuracion             (clave, valor, descripcion, tipo_dato)
usuarios_roles            (usuario_id, rol)
```

---

## 16. Roadmap de implementación

### Fase 1 — Fundación (sprints 1-2)
- Setup proyecto: Vite + React + TS + Tailwind + shadcn.
- Setup Supabase: tablas base, auth, RLS, Vault.
- Layout global, navegación, footer con branding /root.
- Login y gestión de usuarios.

### Fase 2 — Catálogos (sprint 3)
- Servicios + historial de precios.
- Materiales + historial.
- Mano de Obra + historial.
- Configuración global (IVA).

### Fase 3 — Presupuesto (sprints 4-5)
- Formulario completo con todas las secciones.
- Cálculos cliente + interno.
- Estados Emitido/Aprobado/Finalizado.
- Generación de PDF presupuesto.

### Fase 4 — Contrato + Firma digital (sprint 6)
- Página Contrato (upload, historial, firma de dueños).
- Concatenación PDF + estampado.
- Pantalla pública de firma (signature_pad).
- Hash + auditoría + email.

### Fase 5 — Movimientos (sprint 7)
- Cuentas + categorías.
- ABM movimientos.
- Cálculo de saldos.

### Fase 6 — Integración ARCA (sprints 8-10)
- Configuración de emisores con Vault.
- Edge Function de sincronización wsfev1.
- Página Facturación con KPIs y datatable.
- Página Compras con KPIs y asociación de NC.
- Ambiente de homologación → producción.

### Fase 7 — Dashboard (sprint 11)
- Cards de pulso.
- Bloques de salud financiera.
- Tabla y scatter de rentabilidad.

### Fase 8 — Pulido y deploy (sprint 12)
- Tests end-to-end.
- Optimización de queries.
- Capacitación al cliente.
- Deploy a producción en Vercel + Supabase.

---

**Documento preparado por /root · Eduardo Canelo**
**Especificación cerrada — base para desarrollo**
