# SPEC 03 — Pantalla Acerca de + envío de correo con Resend

> **Estado:** Implementado
> **Dependencias:** Spec 01 (`01-mvp-visual.md`) — reutiliza tokens de diseño en `app/globals.css`;
> Spec 02 (`02-home.md`) — reutiliza `components/nav.tsx`, que esta spec extiende agregando el link
> "Acerca de" que quedó pendiente.
> **Fecha:** 2026-07-28
> **Objetivo:** Agregar la pantalla Acerca de del prototipo `home-about` (misión + formulario de
> contacto) como ruta `/acerca-de`, cuyo formulario envía el mensaje por correo electrónico real vía
> Resend (modo sandbox) a `wechavez14@gmail.com`.

## Alcance

**Dentro del alcance:**

- Ruta nueva `/acerca-de` (`app/acerca-de/page.tsx`) que renderiza la pantalla Acerca de migrada 1:1
  desde `about.jsx`:
  - Hero de misión: kicker, título, párrafo de misión y 3 highlight cards (HECHO CON ❤️, JUEGOS EN
    HTML, PROYECTO EN CRECIMIENTO) con animación reveal-on-scroll (reutiliza `.reveal`/`.in` ya
    portado en la spec 02).
  - Banner divisor decorativo entre el hero y la sección de contacto.
  - Sección de contacto: formulario (nombre, correo, mensaje) con validación client-side de campos
    vacíos y animación `shake`, igual que el prototipo.
- Envío real de correo al enviar el formulario:
  - Server Action `app/acerca-de/actions.ts` (`"use server"`) que recibe los datos del formulario,
    valida el formato del correo en el servidor (regex simple) y llama a la API de Resend
    (paquete `resend`) usando `RESEND_API_KEY` desde variables de entorno.
  - Modo sandbox de Resend: remitente `onboarding@resend.dev`, destinatario fijo
    `wechavez14@gmail.com`. El cuerpo del correo incluye nombre, correo y mensaje del remitente.
  - Estado de éxito: al confirmarse el envío, se muestra la UI tipo terminal (`terminal-success`)
    igual que el prototipo, con opción "ENVIAR OTRO MENSAJE" que resetea el formulario.
  - Estado de error: si el envío falla (API key inválida, error de red, respuesta de error de
    Resend), el formulario NO pasa a estado "enviado" — se muestra un mensaje de error inline sobre
    el formulario y el usuario puede corregir y reintentar sin perder lo ya escrito.
- Nueva variable de entorno `RESEND_API_KEY` en `.env.local` (no versionado; `.env*` ya está en
  `.gitignore`).
- Nueva dependencia `resend` en `package.json`.
- Actualización de `components/nav.tsx`: agregar link "Acerca de" → `/acerca-de` (versión desktop y
  panel móvil), extendiendo `isActive` para reconocerlo.
- Migración a `app/globals.css` de las clases CSS que usa `about.jsx` desde
  `references/templates/home-about/styles.css` (`.about-hero`, `.highlight-row`/`.highlight`,
  `.about-divider`, `.about-contact`, `.contact-grid`, `.contact-form`, `.terminal-success`,
  `.term-*`), sin duplicar clases ya portadas en specs anteriores (`.kicker`, `.reveal`/`.in`, etc.).

**Fuera de alcance (para specs futuras):**

- Protección anti-spam/abuso del formulario (honeypot, rate-limiting, CAPTCHA) — se evalúa si se
  vuelve un problema real.
- Persistencia del mensaje de contacto en algún almacenamiento propio (DB, archivo, log) — el envío
  del correo es la única acción del lado servidor.
- Verificar un dominio propio en Resend y usar un remitente distinto a `onboarding@resend.dev` —
  este spec asume modo sandbox; cambiar de remitente/dominio es una spec futura.
- Reintentos automáticos o cola de envío ante fallos de Resend — el único mecanismo de reintento es
  que el usuario vuelva a enviar el formulario manualmente.
- Metadata/SEO específico para `/acerca-de` (usa el `metadata` global ya definido en
  `app/layout.tsx`, igual que la spec 02 hizo para `/inicio`).
- Pruebas automatizadas (no hay test runner configurado en el proyecto).
- Cualquier cambio a Inicio o Biblioteca — permanecen intactas.

## Modelo de datos

Esta feature introduce tipos para el formulario de contacto y el resultado del Server Action. No
reutiliza modelos previos (`Game`, `User`) porque son datos de un dominio distinto.

```ts
// components/about.tsx — estado local del formulario (no exportado)
interface ContactFormState {
  name: string;
  email: string;
  msg: string;
}

// app/acerca-de/actions.ts
export interface ContactPayload {
  name: string;
  email: string;
  message: string;
}

export type ContactResult =
  | { ok: true }
  | { ok: false; error: string }; // error: mensaje corto listo para mostrar en el form
```

Convenciones:

- `sendContactMessage(payload: ContactPayload): Promise<ContactResult>` es la única función
  exportada de `app/acerca-de/actions.ts` y el único punto de entrada al Server Action.
- `ContactResult.error` es un string ya pensado para UI (ej. `"No pudimos enviar tu mensaje. Intenta
  de nuevo."`), no un mensaje crudo de la API de Resend ni un stack trace.
- El correo enviado vía Resend usa: `from: "onboarding@resend.dev"`,
  `to: "wechavez14@gmail.com"`, `subject` fijo tipo `"Nuevo mensaje de contacto — Arcade Vault"`, y
  el cuerpo (texto plano) construido con `name`, `email` y `message` del `ContactPayload`.
- `RESEND_API_KEY` se lee desde `process.env.RESEND_API_KEY` dentro de `actions.ts`; no se expone al
  cliente (no lleva prefijo `NEXT_PUBLIC_`).

## Plan de implementación

1. Instalar la dependencia `resend` (`npm install resend`) y crear `.env.local` con
   `RESEND_API_KEY=` (el valor real lo agrega el usuario manualmente; `.env*` ya está en
   `.gitignore`). Sin cambios de código todavía — el proyecto sigue compilando y viéndose igual.
2. Portar a `app/globals.css` las clases CSS que usa `about.jsx` desde
   `references/templates/home-about/styles.css` (`.about-hero`, `.highlight-row`/`.highlight` con
   modificadores `cyan`/`magenta`/`green`, `.about-divider`, `.about-contact`, `.contact-grid`,
   `.contact-form` con estado `.shake`, `.terminal-success`/`.term-*`). Sin crear todavía ninguna
   ruta ni componente — el proyecto sigue compilando y viéndose igual que antes.
3. Crear `app/acerca-de/actions.ts` (`"use server"`) con `sendContactMessage(payload: ContactPayload):
   Promise<ContactResult>`: valida el formato del correo con una regex simple, construye el mensaje
   y llama a la API de Resend (`from: "onboarding@resend.dev"`, `to: "wechavez14@gmail.com"`) usando
   `RESEND_API_KEY`. Devuelve `{ ok: true }` o `{ ok: false, error }`. Aún no está conectado a
   ninguna UI — se puede probar de forma aislada si se desea.
4. Crear `components/about.tsx` (`"use client"`) migrando `about.jsx`: hook de reveal-on-scroll,
   hero con `HighlightIcon`, banner divisor, y el formulario de contacto con estado
   `{ form, sent, shake, pending, error }`. Al enviar: si hay campos vacíos, dispara `shake` (igual
   que el prototipo); si el formulario es válido, invoca `sendContactMessage` (vía `useTransition`)
   — en éxito muestra el `terminal-success` con botón "ENVIAR OTRO MENSAJE"; en error muestra un
   mensaje inline sobre el formulario y lo deja editable para reintentar.
5. Crear `app/acerca-de/page.tsx` que renderiza `<About />`.
6. Actualizar `components/nav.tsx`: agregar el link "Acerca de" → `/acerca-de` (desktop y panel
   móvil) y extender `isActive` para reconocer `/acerca-de`.
7. Pasada final: `npm run dev`, prueba manual completa en `/acerca-de` — envío válido (confirmar que
   llega el correo real a `wechavez14@gmail.com` desde `onboarding@resend.dev`), campos vacíos
   (verificar `shake`), correo con formato inválido (verificar rechazo server-side con mensaje de
   error inline), simular un fallo de Resend (ej. `RESEND_API_KEY` temporalmente incorrecta) para
   confirmar el estado de error y que reintentar funciona; verificar el link "Acerca de" activo en
   desktop y menú móvil; `npm run lint`.

## Criterios de aceptación

- [x] `npm run dev` levanta la app y `/acerca-de` muestra la pantalla Acerca de (hero de misión,
      3 highlight cards, banner divisor, formulario de contacto) en vez de un 404.
- [x] Las secciones marcadas con `reveal` en `about.jsx` (divisor, sección de contacto) aparecen con
      la animación de entrada al hacer scroll, igual que en el prototipo.
- [x] Enviar el formulario con algún campo vacío (nombre, correo o mensaje) dispara la animación
      `shake` y NO llama al Server Action.
- [x] Enviar el formulario con un correo con formato inválido (ej. `"no-es-un-correo"`) es rechazado
      por la validación server-side y el formulario muestra un mensaje de error inline, sin pasar a
      estado "enviado".
- [x] Enviar el formulario con datos válidos (nombre, correo válido, mensaje) llama a
      `sendContactMessage`, y llega un correo real a `wechavez14@gmail.com` (remitente
      `onboarding@resend.dev`) con el nombre, correo y mensaje ingresados.
- [x] Tras un envío exitoso, el formulario se reemplaza por la UI `terminal-success` con el nombre
      del remitente en mayúsculas, igual que el prototipo.
- [x] El botón "ENVIAR OTRO MENSAJE" de la UI de éxito resetea el formulario a su estado inicial
      vacío.
- [x] Si el envío falla (ej. `RESEND_API_KEY` inválida o ausente), el formulario NO pasa a estado
      "enviado": se muestra un mensaje de error inline y los datos ya escritos por el usuario se
      conservan para poder reintentar.
- [x] `RESEND_API_KEY` no aparece en ningún bundle enviado al cliente (no tiene prefijo
      `NEXT_PUBLIC_`, se lee solo dentro de `app/acerca-de/actions.ts`).
- [x] En el Nav (desktop y menú móvil) aparece un link "Acerca de" que navega a `/acerca-de` y se
      marca activo cuando la ruta actual es `/acerca-de`.
- [x] En pantallas ≤ 840px, el menú móvil (hamburguesa) incluye el link "Acerca de" y funciona igual
      que el resto de links existentes.
- [x] `npm run lint` pasa sin errores nuevos.
- [x] Inicio (`/inicio`) y Biblioteca (`/`) siguen funcionando exactamente igual que antes de esta
      spec — su comportamiento y contenido no se modifican.

## Decisiones tomadas y descartadas

- **Ruta dedicada `/acerca-de`** (tomada) vs. `/about` (descartada). Consistente con las rutas en
  español ya existentes (`/inicio`, `/salon`, `/juegos`).
- **Server Action (`app/acerca-de/actions.ts`)** (tomada) vs. API Route Handler
  (`app/api/contact/route.ts`) (descartada). Menos código: se invoca directo desde el formulario sin
  definir un endpoint HTTP aparte ni manejar `fetch`/serialización manual en el cliente.
- **Action colocado en `app/acerca-de/actions.ts`** (tomada) vs. `lib/actions/contact.ts`
  (descartada). Sigue el patrón común de App Router de colocar el Server Action junto a la ruta que
  lo usa; `lib/` queda para lo que ya vive ahí (`auth-context.tsx`, `games.ts`), no para acciones de
  una sola ruta.
- **Modo sandbox de Resend (`onboarding@resend.dev` → `wechavez14@gmail.com`)** (tomada) vs. dominio
  propio verificado (descartada). El usuario no tiene un dominio propio verificado en Resend
  todavía; usar sandbox permite implementar y probar el envío real ahora mismo. Migrar a un dominio
  propio queda fuera de alcance (ver sección Alcance) y es una spec futura.
- **Validación de formato de email también en el servidor** (tomada) vs. confiar solo en
  `input type="email"` del navegador (descartada). Evita gastar una llamada a la API de Resend con
  un correo malformado si el formulario se invoca sin pasar por la validación HTML5 del navegador.
- **Estado de error inline + reintento manual** (tomada) vs. reusar la animación `shake` también
  para errores del servidor (descartada). Un fallo de Resend es un caso distinto a un campo vacío;
  el usuario necesita saber que el problema fue el envío, no que le faltó llenar algo.
- **Sin protección anti-spam en esta spec** (tomada) vs. agregar un honeypot (descartada). Mantiene
  el alcance acotado a "que el envío funcione"; se evalúa en una spec futura si el formulario público
  recibe abuso real.
- **Sin persistencia propia del mensaje de contacto** (tomada) vs. guardarlo también en un archivo o
  DB (descartada). No hay base de datos en el proyecto todavía; el envío del correo es la única
  fuente de verdad del mensaje.

## Riesgos identificados

| Riesgo                                                                                                                                                                                    | Mitigación                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modo sandbox de Resend solo entrega a la dirección verificada de la cuenta (`wechavez14@gmail.com`). Si en el futuro se necesita otro destinatario, los envíos fallarán o no llegarán.           | Documentado como limitación conocida en esta spec. Migrar a un dominio propio verificado es una spec futura (ver sección Decisiones).                                                              |
| `RESEND_API_KEY` solo existe en `.env.local` (no versionado). Si el proyecto se despliega (Vercel u otro) sin configurar esa variable en el entorno de hosting, todos los envíos fallarán en producción aunque funcionen en local. | El paso 7 del plan solo cubre verificación local. Antes de desplegar a producción, configurar `RESEND_API_KEY` en el panel de variables de entorno del hosting.                                    |
| Formulario público sin protección anti-spam (decisión explícita de esta spec). Un bot o script puede enviar mensajes repetidamente, generando correos no deseados a `wechavez14@gmail.com` y/o consumiendo la cuota de la API de Resend. | Riesgo aceptado para esta spec (ver Decisiones/Fuera de alcance). Si se observa abuso real, agregar honeypot o rate-limiting en una spec futura.                                                    |
| Porteo incompleto de CSS al portar "solo lo que usa `about.jsx`": clases armadas por interpolación (`"highlight " + h.c`, `"contact-form" + (shake ? " shake" : "")`) pueden pasar desapercibidas en un grep superficial de nombres literales en el JSX. | Revisar `styles.css` sección por sección (líneas ~1068-1146, bloque `.about`/`.highlight`/`.contact`/`.terminal-success`) para cada parte de `about.jsx`, no solo los nombres de clase estáticos — mismo enfoque que la spec 02 usó para `home.jsx`. |
| Los IDs de Server Actions en Next.js rotan con cada deploy (hasta cada 14 días aunque el código no cambie); un cliente con una build vieja en caché puede invocar un ID que ya no existe ("Failed to find Server Action"). | Riesgo de despliegue, no de esta implementación local. Documentado para cuando el proyecto se despliegue: preferir despliegues incrementales y que el usuario recargue la página si ve ese error. |
