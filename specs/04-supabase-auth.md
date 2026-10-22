# SPEC 04 — Integración de Supabase + autenticación real

> **Estado:** Implementado
> **Dependencias:** Spec 01 (`01-mvp-visual.md`) — reemplaza el `AuthProvider` en memoria de
> `lib/auth-context.tsx` y conecta `components/auth-form.tsx` (pantalla `/auth`); Spec 02 y Spec 03 —
> `components/nav.tsx` se modifica solo en su lógica de sesión, sin tocar los links existentes.
> **Fecha:** 2026-10-22
> **Objetivo:** Integrar Supabase en la app de Next.js (clientes SSR y `proxy.ts` de sesión) y
> reemplazar la autenticación simulada por registro e inicio de sesión reales con correo y
> contraseña, guardando el nombre de jugador en el `user_metadata` del usuario de Supabase Auth.
> **Sin cambios en la base de datos:** esta spec no crea tablas, migraciones, triggers ni policies.

## Alcance

**Dentro del alcance:**

- Dependencias nuevas: `@supabase/supabase-js` y `@supabase/ssr` (dependencies).
- Variables de entorno nuevas en `.env.local`: `NEXT_PUBLIC_SUPABASE_URL` y
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (key `sb_publishable_...`).
- Clientes de Supabase:
  - `lib/supabase/server.ts` — `createClient()` async con `createServerClient` + `cookies()` de
    `next/headers`, para Server Components y Server Actions.
  - `lib/supabase/client.ts` — `createClient()` con `createBrowserClient`, para Client Components
    (queda disponible para specs futuras; esta spec no lo consume).
  - `lib/supabase/proxy.ts` — `updateSession(request)`: refresca la sesión llamando a
    `supabase.auth.getClaims()` y reescribe las cookies en la respuesta.
- `proxy.ts` en la raíz del repo (convención de Next 16, reemplaza a `middleware.ts`) que invoca
  `updateSession` en todas las rutas excepto assets estáticos, y redirige `/auth` → `/` si ya hay
  sesión activa.
- Autenticación real con correo + contraseña (Supabase Auth, esquema `auth` gestionado por
  Supabase):
  - Server Actions en `app/auth/actions.ts`: `signUp`, `signIn`, `signOut`.
  - El nombre de jugador se guarda en `user_metadata.username` vía `options.data` de `signUp`.
  - `components/auth-form.tsx`: pestaña "Iniciar sesión" pide **Correo + Contraseña**; pestaña
    "Crear cuenta" pide **Usuario + Correo + Contraseña**. Estado `pending` en el botón y mensaje de
    error inline sobre el formulario (mismo patrón que la spec 03).
  - "Jugar como invitado" navega a `/` sin crear sesión (el nombre se sigue mostrando como
    "INVITADO").
- Confirmación de correo **desactivada** en el dashboard de Supabase (paso manual): al registrarse,
  el usuario queda logueado de inmediato.
- `lib/auth-context.tsx` reescrito: `AuthProvider` recibe `initialUser` desde `app/layout.tsx`
  (que lee la sesión en el servidor); `useAuth()` expone `{ user, logout }` y `logout` invoca el
  Server Action `signOut`. Los consumidores (`nav.tsx`, `hall-of-fame.tsx`, `player-name.tsx`)
  siguen leyendo `user.name` sin cambios.

**Fuera de alcance (para specs futuras):**

- **Cualquier modificación a la base de datos:** tablas (`profiles` u otras), migraciones,
  triggers, funciones, policies de RLS, Supabase CLI (`init` / `link` / `db push`) y tipos
  generados (`lib/database.types.ts`).
- Unicidad del nombre de jugador — requiere una tabla; dos cuentas pueden tener el mismo
  `username`.
- OAuth con Google / GitHub — los botones quedan decorativos como hoy.
- Inicio de sesión anónimo de Supabase para el modo invitado.
- Confirmación de correo, recuperación de contraseña, cambio de correo/contraseña y SMTP propio
  (Resend) para los correos de Auth.
- Edición del perfil (cambiar `username`).
- Rutas protegidas: ninguna ruta exige sesión en esta spec.
- Migrar `GAMES` (`lib/games.ts`) o el Salón de la Fama / puntuaciones a Postgres.
- Desarrollo local con Docker (`supabase start`) — se trabaja solo contra el proyecto remoto.
- Pruebas automatizadas (no hay test runner configurado).

## Modelo de datos

No hay modelo de datos en Postgres. El único dato persistido es el usuario de Supabase Auth, con:

- `user_metadata.username`: nombre de jugador **en minúsculas** (3–10 caracteres, `[a-z0-9_]`); la
  UI lo muestra en mayúsculas, como hoy.

### TypeScript

```ts
// lib/auth-context.tsx
export interface AuthUser {
  id: string; // auth user id (claim `sub`)
  name: string; // user_metadata.username en mayúsculas, listo para UI
}

interface AuthContextValue {
  user: AuthUser | null;
  logout: () => Promise<void>;
}

// app/auth/actions.ts
export type AuthResult = { ok: true } | { ok: false; error: string };

export async function signUp(input: {
  username: string;
  email: string;
  password: string;
}): Promise<AuthResult>;
export async function signIn(input: { email: string; password: string }): Promise<AuthResult>;
export async function signOut(): Promise<void>;
```

Convenciones:

- En éxito, `signUp`/`signIn` hacen `revalidatePath("/", "layout")` y `redirect("/")`; el
  `{ ok: true }` existe por simetría con la spec 03.
- `AuthResult.error` es un texto en español listo para UI, nunca el mensaje crudo de Supabase:
  - `"Correo o contraseña incorrectos."` (credenciales inválidas)
  - `"Ese correo ya está registrado."` (`user_already_exists`)
  - `"El usuario debe tener 3–10 caracteres: letras, números o _."`
  - `"La contraseña debe tener al menos 6 caracteres."`
  - `"No pudimos completar la operación. Intenta de nuevo."` (fallback)
- `signUp` normaliza `username` a minúsculas y lo envía en `options.data.username`.
- `app/layout.tsx` obtiene el nombre desde los claims (`user_metadata.username`) de `getClaims()`,
  sin consultas a tablas. Si falta el `username`, se usa la parte local del correo.
- Las variables `NEXT_PUBLIC_SUPABASE_*` son públicas por diseño. No se usa ni se agrega una
  secret/service-role key.

## Plan de implementación

1. Instalar `@supabase/supabase-js` y `@supabase/ssr`. Agregar `NEXT_PUBLIC_SUPABASE_URL` y
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` a `.env.local` (valores obtenidos del proyecto vía MCP
   `get_project_url` / `get_publishable_keys`). Sin cambios de código.
2. Crear `lib/supabase/server.ts` y `lib/supabase/client.ts`. Aún no se usan; la app compila igual.
3. Crear `lib/supabase/proxy.ts` (`updateSession` con `getClaims()` temprano) y `proxy.ts` en la raíz
   con `matcher` que excluye `_next/static`, `_next/image`, `favicon.ico` e imágenes. Redirección
   `/auth` → `/` cuando hay sesión. Manual: la app navega igual que antes, sin errores en consola.
4. Paso manual del usuario: desactivar "Confirm email" en el dashboard (Authentication → Sign In /
   Providers → Email).
5. Crear `app/auth/actions.ts` con `signUp`, `signIn`, `signOut`: validación de input en el servidor
   y mapeo de errores a los textos de `AuthResult`. Aún no conectado a la UI.
6. Reescribir `lib/auth-context.tsx` (`AuthProvider({ initialUser })`, `useAuth()` →
   `{ user, logout }`) y volver `app/layout.tsx` async: lee `getClaims()` y pasa `initialUser`.
   Ajustar `components/nav.tsx` solo si cambia la firma de `logout`. Manual: sin sesión la app se ve
   igual que hoy.
7. Actualizar `components/auth-form.tsx`: campos por pestaña, llamada a `signIn`/`signUp` con
   `useTransition`, estado `pending`, error inline que conserva lo escrito; "Jugar como invitado" →
   `router.push("/")`. Botones Google/GitHub sin cambios.
8. Pasada final: prueba manual completa del flujo (ver criterios de aceptación), `npm run lint` y
   `npm run build`.

## Criterios de aceptación

- [ ] `npm run build` y `npm run lint` pasan sin errores nuevos.
- [ ] No se agregan archivos en `supabase/` ni cambios al esquema de la base de datos remota.
- [ ] Crear cuenta en `/auth` con usuario `px_kai`, correo nuevo y contraseña ≥ 6 caracteres
      redirige a `/` con sesión activa, y el Nav muestra `PX_KAI ▾`.
- [ ] Tras ese registro, el usuario en Supabase Auth tiene `user_metadata.username = 'px_kai'`.
- [ ] Recargar la página (F5) mantiene la sesión: el Nav sigue mostrando el nombre.
- [ ] Cerrar sesión desde el Nav deja la app sin sesión (Nav muestra "Iniciar Sesión") y recargar no
      la recupera.
- [ ] Iniciar sesión con correo + contraseña correctos redirige a `/` con el nombre en el Nav.
- [ ] Iniciar sesión con contraseña incorrecta muestra `"Correo o contraseña incorrectos."` inline y
      conserva el correo escrito.
- [ ] Registrarse con un correo ya registrado muestra `"Ese correo ya está registrado."`.
- [ ] Registrarse con usuario inválido (ej. `"a"` o `"con espacio"`) o contraseña < 6 caracteres
      muestra el mensaje correspondiente sin llamar a Supabase Auth.
- [ ] Con sesión activa, navegar a `/auth` redirige a `/`.
- [ ] "Jugar como invitado" navega a `/` sin crear sesión; el Salón muestra "INVITADO" donde aplica.
- [ ] `PlayerName` y el Salón de la Fama muestran el nombre del usuario logueado sin cambios en
      `components/player-name.tsx` ni `components/hall-of-fame.tsx`.
- [ ] Ningún bundle de cliente contiene una secret/service-role key.

## Decisiones tomadas y descartadas

- **Sin cambios en la base de datos** (tomada) vs. tabla `profiles` con trigger y migraciones
  versionadas (descartada por ahora). Esta spec se enfoca solo en la integración con Supabase y
  Auth; el esquema llegará con las specs de puntuaciones.
- **`username` en `user_metadata`** (tomada) vs. tabla `profiles` (descartada en esta spec). No
  requiere esquema propio; a cambio, no hay unicidad ni lectura pública de nombres.
- **Infra + Auth en una sola spec** (tomada) vs. spec solo de infraestructura (descartada). Una spec
  de solo clientes no tiene comportamiento verificable; Auth le da un caso de uso real.
- **Publishable key (`sb_publishable_...`)** (tomada) vs. `anon` key legacy (descartada). Es el
  esquema de keys actual de Supabase y se puede rotar sin cortar sesiones.
- **Solo proyecto remoto** (tomada) vs. stack local con Docker (descartada). Menos fricción; el
  proyecto ya existe.
- **Login por correo + contraseña** (tomada) vs. login por `username` buscando el correo
  (descartada). Es el flujo nativo de Supabase y evita exponer qué usuarios existen.
- **`username` en minúsculas, mostrado en mayúsculas** (tomada) vs. guardar tal cual (descartada).
  Facilita una futura migración a una tabla con `unique`; respeta el estilo visual actual.
- **Confirmación de correo desactivada** (tomada) vs. mantenerla con `/auth/confirm` o con SMTP de
  Resend (descartadas). El SMTP integrado tiene un límite muy bajo; se reactiva en una spec futura.
- **Sesión leída en `app/layout.tsx` y pasada al `AuthProvider`** (tomada) vs. listener
  `onAuthStateChange` en el cliente (descartada). Los Server Actions revalidan el layout, así que el
  servidor es la única fuente de verdad y no hay parpadeo de estado.
- **`getClaims()`** (tomada) vs. `getSession()` (descartada). `getClaims` valida el JWT;
  `getSession` no es confiable en el servidor.
- **`proxy.ts`** (tomada) vs. `middleware.ts` (descartada). Convención de Next 16.
- **Modo invitado sin sesión** (tomada) vs. login anónimo de Supabase (descartada). Mantiene el
  comportamiento actual; no hay datos que asociar todavía.

## Riesgos identificados

| Riesgo                                                                                                    | Mitigación                                                                                                                         |
| --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Sin tabla, el `username` no es único: dos jugadores pueden llamarse igual.                                | Aceptado en esta etapa; una spec futura crea `profiles` con `unique` y migra los `user_metadata` existentes.                       |
| `user_metadata` es editable por el propio usuario vía `updateUser`.                                       | Aceptado: solo se usa para mostrar el nombre, nunca para autorización.                                                             |
| Leer cookies en `app/layout.tsx` vuelve dinámicas todas las rutas (sin render estático).                  | Aceptado: las páginas actuales son livianas. Si importa, mover la lectura a un componente bajo `<Suspense>` en una spec futura.    |
| Con la confirmación desactivada, cualquiera puede registrarse con un correo ajeno.                        | Aceptado en esta etapa (no hay datos sensibles); reactivar la confirmación es una spec futura.                                     |
| Despliegue sin las variables `NEXT_PUBLIC_SUPABASE_*` rompe toda la app (el proxy corre en cada request). | Configurarlas en el hosting antes de desplegar, igual que `RESEND_API_KEY` en la spec 03.                                          |
| Respuestas del proxy cacheadas por un CDN pueden filtrar cookies de sesión.                               | Riesgo de despliegue: usar `Cache-Control: private, no-store` en rutas de auth si se pone un CDN delante.                          |

## Lo que **no** entra en esta spec

- Cambios en la base de datos: tablas, migraciones, triggers, policies, Supabase CLI y tipos
  generados.
- Unicidad del nombre de jugador.
- OAuth con Google / GitHub.
- Login anónimo de Supabase para invitados.
- Confirmación de correo, recuperación de contraseña y SMTP propio para Auth.
- Edición de perfil.
- Rutas protegidas.
- Migrar juegos, puntuaciones o el Salón de la Fama a la base de datos.
- Stack local de Supabase con Docker.
- Pruebas automatizadas.

Cada uno de esos puntos, si llega, va en su propia spec.
