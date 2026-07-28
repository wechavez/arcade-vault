# Spec 01 — Interfaz visual MVP de Arcade Vault

**Estado:** Aprobado
**Dependencias:** Ninguna (primer spec del proyecto)
**Fecha:** 2026-07-27

## Objetivo

Migrar a Next.js App Router, como interfaz puramente visual (sin lógica de juego real ni
backend), las cinco pantallas del prototipo en `references/templates/` — Biblioteca, Detalle,
Reproductor (estático), Salón de la Fama y Autenticación — junto con el sistema de diseño y los
datos mock que las alimentan.

## Alcance

### Dentro del alcance

- 5 rutas bajo App Router: `/` (Biblioteca), `/juegos/[id]` (Detalle), `/juegos/[id]/jugar`
  (Reproductor estático), `/salon` (Salón de la Fama), `/auth` (Autenticación).
- `app/layout.tsx` extendido con la barra de navegación (`Nav`, persistente entre rutas) y el
  footer (`© 2026 ARCADE VAULT · HECHO CON PIXELES Y NEÓN · v2.6.0`), ambos ya presentes como
  markup pero pendientes de componentes reales.
- Un `AuthContext` cliente en memoria (`{ name: string } | null`), sin persistencia, que expone
  login, registro y logout simulados. Alimenta el nav (nombre de usuario / botón "Iniciar
  Sesión") y la fila "tu mejor marca" del Salón de la Fama.
- Migración tipada de `data.jsx` (`GAMES`, `CATS`, `PLAYERS`, `seededScores`) a un módulo TS
  en `lib/games.ts`.
- Biblioteca: búsqueda por nombre y filtro por categoría funcionando con estado local de React.
- Detalle: información del juego + tabla de mejores puntuaciones (datos mock vía `seededScores`).
- Reproductor: HUD con valores fijos (puntuación 0, 3 vidas, nivel 01), escena CRT decorativa
  con las mismas animaciones CSS del prototipo. Los botones PAUSA y FIN son decorativos (no
  cambian estado). Solo SALIR navega (vuelve a Detalle).
- Salón de la Fama: tabs por juego, podio (top 3) y tabla de posiciones funcionando con estado
  local de React; fila "tu mejor marca" visible solo si hay usuario en `AuthContext`.
- Autenticación: tabs Iniciar Sesión / Crear Cuenta funcionando; enviar el formulario setea el
  usuario en `AuthContext` (sin validar credenciales) y navega a `/`. "Jugar como invitado"
  replica el comportamiento del prototipo (no setea nombre de usuario).
- Menú móvil (hamburguesa) funcional en el nav.
- Responsive tal como está definido en `styles.css` (breakpoints ya incluidos en `globals.css`).

### Fuera del alcance

- Cualquier juego jugable: no hay loop de puntuación, colisiones, ni motor de juego real.
- Persistencia entre recargas de página (no `localStorage`): el usuario logueado se pierde al
  refrescar.
- Backend real, validación de credenciales, o llamadas de red.
- El modal "Fin del Juego" y el flujo de "Guardar Puntuación": no se disparan porque el
  Reproductor es estático puro (PAUSA/FIN no cambian estado).
- Botones "GOOGLE" / "GITHUB" del formulario de auth: quedan como decorativos, sin flujo OAuth.
- Sistema de créditos real: el contador "CRÉDITOS · 03" del nav sigue siendo estático.
- Pruebas automatizadas (no hay test runner configurado en el proyecto).

## Modelo de datos

### `lib/games.ts` — catálogo y puntuaciones mock

Migración tipada de `data.jsx`, sin cambios de contenido (mismos 8 juegos, mismos nombres de
jugador, mismo algoritmo pseudo-aleatorio determinista).

```ts
export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type GameColor = "cyan" | "magenta" | "yellow" | "green";

export interface Game {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: GameCategory;
  cover: string;   // sufijo de clase CSS, ej. "cover-bricks" (ya definida en globals.css)
  color: GameColor;
  best: number;
  plays: string;   // valor ya formateado para mostrar, ej. "12.4K"
}

export const GAMES: Game[];
export const CATS: readonly ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"];

export interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string; // "DD/MM/YYYY"
}

export function seededScores(seed: number, count?: number): ScoreRow[];
```

`PLAYERS` (la lista de nombres mock) queda como constante interna del módulo, sin exportarse,
ya que solo la usa `seededScores`.

### `lib/auth-context.tsx` — sesión simulada en memoria

Nuevo `AuthProvider` (client component) que envuelve la app desde `app/layout.tsx`, y un hook
`useAuth()` consumido por `Nav`, la pantalla de Autenticación y el Salón de la Fama.

```ts
export interface AuthUser {
  name: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (name: string) => void;
  loginAsGuest: () => void;
  logout: () => void;
}

export function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element;
export function useAuth(): AuthContextValue;
```

Sin persistencia (no `localStorage`, no cookies): el estado vive solo en memoria del cliente y
se reinicia al recargar la página, tal como se acordó en el alcance.

## Plan de implementación

1. Crear `lib/games.ts` con los tipos y los datos migrados desde `data.jsx` (`Game`, `ScoreRow`,
   `GAMES`, `CATS`, `seededScores`). Sin cambios visuales todavía; el proyecto sigue compilando.
2. Crear `lib/auth-context.tsx` (`AuthProvider` + `useAuth`) e integrarlo en `app/layout.tsx`
   envolviendo `children`. Sin cambios visuales todavía.
3. Construir `components/nav.tsx` (client component) migrando `nav.jsx`: logo, links
   Biblioteca/Salón, contador de créditos estático, botón de sesión conectado a `useAuth()`,
   panel móvil. Añadirlo a `app/layout.tsx`.
4. Construir la pantalla Biblioteca en `app/page.tsx` migrando `biblioteca.jsx`: hero, buscador +
   chips de categoría (estado local), grid de `GameCard` con tilt on hover, enlaces con
   `next/link` hacia `/juegos/[id]`.
5. Construir la pantalla Detalle en `app/juegos/[id]/page.tsx` migrando `detalle.jsx`:
   información del juego + leaderboard vía `seededScores`, botón "JUGAR AHORA"
   (`next/link` a `/juegos/[id]/jugar`) y "VOLVER AL VAULT".
6. Construir la pantalla Reproductor en `app/juegos/[id]/jugar/page.tsx` migrando
   `reproductor.jsx` en su versión estática pura: HUD con valores fijos, escena CRT decorativa,
   PAUSA/FIN sin handlers, SALIR con `next/link` de vuelta a Detalle.
7. Construir la pantalla Salón de la Fama en `app/salon/page.tsx` migrando `salon.jsx`: tabs por
   juego (estado local), podio, tabla, fila "tu mejor marca" condicionada a `useAuth()`.
8. Construir la pantalla Autenticación en `app/auth/page.tsx` migrando `auth.jsx`: tabs Iniciar
   Sesión/Crear Cuenta, formulario conectado a `useAuth().login`, botón invitado a
   `loginAsGuest`, navegación a `/` tras enviar.
9. Mover el footer estático (`© 2026 ARCADE VAULT · HECHO CON PIXELES Y NEÓN · v2.6.0`) a
   `app/layout.tsx` y hacer que los links activos del Nav reflejen la ruta actual con
   `usePathname()`.
10. Pasada final: `npm run lint`, revisión visual responsive de las 5 pantallas en breakpoints
    móvil/tablet, y limpieza de cualquier resto del scaffold original en `app/page.tsx`
    (logos de Next.js, textos de ejemplo, etc.).

## Criterios de aceptación

- [ ] `npm run dev` levanta la app y `/` muestra la Biblioteca (hero, buscador, chips de
      categoría y grid de juegos) en vez del scaffold de `create-next-app`.
- [ ] Escribir en el buscador de la Biblioteca filtra los juegos por título en tiempo real.
- [ ] Hacer click en un chip de categoría filtra el grid; "TODOS" muestra los 8 juegos.
- [ ] Hacer click en una tarjeta de juego (o su botón "JUGAR") navega a `/juegos/[id]` con la
      información correcta de ese juego y su tabla de mejores puntuaciones.
- [ ] En `/juegos/[id]`, el botón "JUGAR AHORA" navega a `/juegos/[id]/jugar`.
- [ ] En `/juegos/[id]/jugar`, el HUD muestra puntuación 0, 3 vidas y nivel 01 de forma fija —
      los valores no cambian con el tiempo (no hay loop de puntuación).
- [ ] En `/juegos/[id]/jugar`, el botón "SALIR" navega de vuelta a `/juegos/[id]`; PAUSA y FIN
      no producen ningún cambio de estado ni abren ningún modal.
- [ ] `/salon` muestra tabs por cada uno de los 8 juegos; cambiar de tab actualiza el podio
      (top 3) y la tabla de posiciones mostrados.
- [ ] En `/auth`, alternar entre "INICIAR SESIÓN" y "CREAR CUENTA" cambia los campos del
      formulario (aparece "Correo electrónico" solo en Crear Cuenta).
- [ ] Enviar el formulario de `/auth` (con cualquier dato) navega a `/` y el nav pasa a mostrar
      el nombre de usuario en vez del botón "Iniciar Sesión".
- [ ] Con un usuario logueado, `/salon` muestra la fila "TU MEJOR MARCA EN [JUEGO]" adicional;
      sin usuario logueado, esa fila no aparece.
- [ ] Pulsar "Jugar como invitado" en `/auth` navega a `/` sin dejar un usuario logueado en el
      nav (replica el comportamiento del prototipo).
- [ ] Recargar la página (F5) después de iniciar sesión hace que el nav vuelva a mostrar
      "Iniciar Sesión" (no hay persistencia).
- [ ] En pantallas ≤ 840px de ancho, el botón hamburguesa abre/cierra el panel de navegación
      móvil con los mismos links.
- [ ] `npm run lint` pasa sin errores nuevos.
- [ ] Ninguna pantalla permite jugar realmente ningún juego (no hay colisiones, física, ni
      lógica de puntuación real en ningún punto de la app).

## Decisiones tomadas y descartadas

- **Reproductor estático puro** (tomada) vs. estático interactivo con modal de fin de juego
  descartado. Se descartó el modal de fin de juego porque el reproductor no es jugable en este
  MVP; construir un modal que nunca se dispara con lógica real habría sido esfuerzo fuera del
  alcance visual pedido.
- **Controles de UI no relacionados al juego (búsqueda, filtros, tabs, menú móvil) funcionales**
  (tomada) vs. decorativos descartado. Son estado puramente local de React sin backend, y
  "todas las pantallas" del MVP implica que su interactividad de UI (no de juego) sí se
  demuestre.
- **Autenticación funcional sin persistencia entre recargas** (tomada) vs. con `localStorage`
  y vs. solo visual, ambos descartados. Se prioriza mantener el nav y el Salón de la Fama
  reactivos al estado de sesión (más fiel al prototipo) sin introducir persistencia de cliente
  todavía, ya que no hay backend real en este MVP.
- **Rutas cortas en español** (`/juegos/[id]`, `/salon`, `/auth`) tomada vs. rutas descriptivas
  más largas (`/biblioteca/[id]`, `/salon-de-la-fama`, `/login`) descartada, por legibilidad y
  brevedad de URL.
- **Datos y contexto en `lib/`** (`lib/games.ts`, `lib/auth-context.tsx`) tomada vs. otras
  ubicaciones (`app/data/`, `data/`) descartadas, siguiendo la convención común de Next.js App
  Router de mantener lógica no-visual fuera de `app/`.
- **`Nav` y footer viven en `app/layout.tsx`** (tomada) vs. repetirlos por página descartada,
  ya que son persistentes entre rutas en el prototipo original (`app.jsx` los renderiza una
  sola vez fuera del router).

## Riesgos identificados

- **APIs de Next.js 16 distintas a las de entrenamiento.** `AGENTS.md` advierte que esta
  versión tiene cambios importantes (ej. posible manejo distinto de `params` en rutas dinámicas
  como `app/juegos/[id]/page.tsx`). Mitigación: revisar `node_modules/next/dist/docs/` antes de
  escribir cada route handler, no asumir la API de memoria.
- **Mezcla de Server/Client Components.** Varias pantallas (Detalle) pueden ser Server
  Components, pero dependen de `useAuth()` (Context, requiere cliente) para condicionar la fila
  "tu mejor marca" en Salón, o para leer el nombre de usuario en el Reproductor. Mitigación:
  aislar el consumo de `useAuth()` en subcomponentes cliente pequeños en vez de marcar toda la
  página como `"use client"`.
- **Tailwind v4 (`@theme inline`) conviviendo con las clases CSS del prototipo.** El prototipo
  usa clases planas (`.card`, `.btn`, `.chip`, etc.) ya portadas literalmente a `globals.css`;
  si se mezclan con utilidades de Tailwind en el JSX podría haber colisiones de especificidad.
  Mitigación: mantener los nombres de clase del prototipo tal cual y usar utilidades de Tailwind
  solo para detalles que el prototipo no cubre, no para reemplazar sus componentes.
