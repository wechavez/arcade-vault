# Spec 02 — Pantalla de Inicio

**Estado:** Implementado
**Dependencias:** Spec 01 (`01-mvp-visual.md`) — reutiliza `lib/games.ts`, `components/nav.tsx` y los
tokens de diseño ya portados en `app/globals.css`; no la modifica en su comportamiento existente.
**Fecha:** 2026-07-28

## Objetivo

Agregar la pantalla de Inicio del prototipo `home-about` como una ruta nueva (`/inicio`) en Arcade
Vault, con su hero, features, preview de juegos, stats, actividad en vivo y pricing/FAQ, y conectar
el Nav (link "Inicio", logo apuntando a `/inicio`) sin tocar la Biblioteca ni implementar la
pantalla Acerca de.

## Alcance

### Dentro del alcance

- Ruta nueva `/inicio` (`app/inicio/page.tsx`) que renderiza la pantalla de Inicio migrada 1:1 desde
  `home.jsx`:
  - Hero con `FloatingSilhouettes` decorativas, eyebrow, título, subtítulo y CTAs
    "▶ EXPLORAR JUEGOS" (→ `/`) y "✦ CREAR CUENTA" (→ `/auth`).
  - Sección "¿Por qué Arcade Vault?" (4 feature cards con animación reveal-on-scroll).
  - Sección "Juegos disponibles ahora": rail con los primeros 6 juegos de `GAMES` (`lib/games.ts`)
    vía `MiniCard`, cada uno enlazando a `/juegos/[id]`; botón "VER TODOS LOS JUEGOS →" (→ `/`).
  - Sección de stats (3 bloques: juegos, partidas, ranking).
  - Sección "Actividad en Vivo": ticker de puntuaciones recientes + top 5 jugadores, con datos
    estáticos hardcodeados como en el prototipo; link "VER SALÓN →" (→ `/salon`).
  - Sección Pricing: card de plan único + FAQ estático (sin formulario ni lógica de pago).
  - CTA final "INSERTAR MONEDA →" (→ `/`).
  - Animación reveal-on-scroll (`IntersectionObserver`, clase `.reveal`/`.in`) igual que el
    prototipo.
- Actualización de `components/nav.tsx`:
  - Agregar link "Inicio" → `/inicio` (versión desktop y panel móvil).
  - Cambiar el destino del logo "ARCADE VAULT" de `/` a `/inicio`.
  - Extender `isActive` para reconocer `/inicio`.
- Migración a `app/globals.css` de las clases CSS que usa `home.jsx` desde
  `references/templates/home-about/styles.css` (hero, siluetas, feature-grid, mini-rail/mini-card,
  stats, activity/ticker/top-list, pricing/faq, CTA final, utilidades `.reveal`/`.in`). Las clases
  ya portadas en la spec 01 (`.kicker`, `.section-head`, `.section-title`, `.section-rule`, `.btn`,
  etc.) se reutilizan sin duplicarlas.

### Fuera del alcance

- La pantalla "Acerca de" (`about.jsx`) — spec futura; su link no aparece en el Nav todavía.
- Cualquier cambio a la Biblioteca: se mantiene intacta en `/`, sin mover archivos ni tocar su
  comportamiento.
- Datos reales o dinámicos para el ticker, el top-5 de jugadores o las stats ("12+ JUEGOS", "MILES
  DE PARTIDAS"): siguen siendo valores estáticos, no conectados a `lib/games.ts` ni a ningún
  backend.
- Formulario de contacto (pertenece a Acerca de).
- Metadata/SEO específico para `/inicio` (usa el `metadata` global ya definido en
  `app/layout.tsx`).
- Pruebas automatizadas (no hay test runner configurado en el proyecto).

## Modelo de datos

El Home no introduce ningún módulo nuevo en `lib/`. La única data "nueva" son las listas estáticas
de la sección "Actividad en Vivo", que viven como constantes locales dentro de
`components/home.tsx` (no exportadas, no compartidas), tipadas para TypeScript estricto:

```ts
// components/home.tsx — constantes locales, no exportadas

interface TickerEntry {
  player: string;
  game: string;
  score: number;
  time: string;   // p.ej. "hace 2 min"
  color: "cyan" | "magenta" | "yellow" | "green";
}

interface TopPlayerEntry {
  rank: number;
  player: string;
  score: number;
}

const RECENT_SCORES: TickerEntry[];   // mismos 7 valores que el prototipo (NEONFOX, PX_KAI, ...)
const TOP_PLAYERS_TODAY: TopPlayerEntry[]; // mismos 5 valores que el prototipo
```

El rail de "Juegos disponibles ahora" no introduce datos nuevos: reutiliza `GAMES` de
`lib/games.ts` tal cual (`GAMES.slice(0, 6)`), leyendo los campos `title`, `cat` y `cover` ya
existentes en la interfaz `Game`.

## Plan de implementación

1. Portar a `app/globals.css` las clases CSS que usa `home.jsx` desde
   `references/templates/home-about/styles.css` (hero, `.home-silos`/`.silo`,
   `.feature-grid`/`.feature-card`, `.mini-rail`/`.mini-card`, `.home-stats`/`.stat-*`,
   `.activity-grid`/`.ticker`/`.top-list`, `.pricing-grid`/`.price-card`/`.pricing-faq`,
   `.home-final`, utilidades `.reveal`/`.in`), incluyendo los modificadores de color dinámicos
   (`cyan`/`magenta`/`yellow`/`green`) y variantes (`top1`/`top2`/`top3`). Sin crear todavía
   ninguna ruta ni componente — el proyecto sigue compilando y viéndose igual que antes.
2. Crear `components/home.tsx` (`"use client"`) migrando `home.jsx`: hook de reveal-on-scroll
   (`useEffect` + `IntersectionObserver`), `FloatingSilhouettes`, `FeatureIcon`, `MiniCard`, y las
   constantes `RECENT_SCORES`/`TOP_PLAYERS_TODAY` del modelo de datos. Toda navegación
   (`onClick={() => navigate(...)}` en el prototipo) se reemplaza por `next/link` hacia las rutas
   correspondientes (`/`, `/auth`, `/salon`, `/juegos/[id]`); el rail de juegos lee `GAMES` desde
   `lib/games.ts`.
3. Crear `app/inicio/page.tsx` que renderiza `<Home />`.
4. Actualizar `components/nav.tsx`: agregar el link "Inicio" → `/inicio` (desktop y panel móvil),
   cambiar el `href` del logo de `/` a `/inicio`, y extender `isActive` para reconocer `/inicio`.
5. Pasada final: `npm run dev`, revisión visual de `/inicio` en desktop y móvil (siluetas del hero,
   animaciones reveal al hacer scroll, rail de juegos, ticker, pricing/FAQ), verificar que todos
   los CTAs navegan a la ruta correcta, confirmar que `/` (Biblioteca) sigue funcionando sin
   cambios, y `npm run lint`.

## Criterios de aceptación

- [x] `npm run dev` levanta la app y `/inicio` muestra la pantalla de Inicio (hero, features, rail
      de juegos, stats, actividad en vivo, pricing/FAQ, CTA final) en vez de un 404.
- [x] El hero de `/inicio` muestra las siluetas decorativas flotantes y el texto/CTAs del
      prototipo ("▶ EXPLORAR JUEGOS", "✦ CREAR CUENTA").
- [x] El botón "▶ EXPLORAR JUEGOS" del hero y "VER TODOS LOS JUEGOS →" navegan a `/` (Biblioteca).
- [x] Los botones "✦ CREAR CUENTA" y "EMPEZAR GRATIS →" navegan a `/auth`; "INSERTAR MONEDA →"
      (CTA final) navega a `/` (Biblioteca), igual que en el prototipo y la sección Alcance.
- [x] La sección "Juegos disponibles ahora" muestra los primeros 6 juegos de `GAMES` (mismo orden
      que `lib/games.ts`); hacer click en una mini-card navega a `/juegos/[id]` del juego
      correspondiente.
- [x] Las secciones marcadas con la clase `reveal` en el prototipo (features, mini-rail, stats,
      activity, pricing, CTA final) aparecen con la animación de entrada al hacer scroll (se
      agrega la clase `in` vía `IntersectionObserver`), igual que en el prototipo.
- [x] El link "VER SALÓN →" de la sección "Actividad en Vivo" navega a `/salon`.
- [x] En el Nav (desktop y menú móvil) aparece un link "Inicio" que navega a `/inicio` y se marca
      activo cuando la ruta actual es `/inicio`.
- [x] El link "Acerca de" NO aparece en el Nav.
- [x] Hacer click en el logo "ARCADE VAULT" del Nav navega a `/inicio` (en vez de `/`).
- [x] En pantallas ≤ 840px, el menú móvil (hamburguesa) incluye el link "Inicio" y funciona igual
      que el resto de links existentes.
- [x] `npm run lint` pasa sin errores nuevos.
- [x] La Biblioteca en `/` sigue funcionando exactamente igual que antes de esta spec (búsqueda,
      filtros, grid) — su comportamiento y contenido no se modifican.

## Decisiones tomadas y descartadas

- **Ruta dedicada `/inicio`** (tomada) vs. Home como nueva raíz `/` con Biblioteca movida a
  `/biblioteca` (descartada). Cambio más chico y aislado que no reabre ni modifica la spec 01 ya
  implementada.
- **Logo del Nav apunta a `/inicio`** (tomada) vs. se queda apuntando a `/` (descartada). Se trata
  `/inicio` como la "home" conceptual del sitio, aunque la ruta raíz técnica siga siendo la
  Biblioteca.
- **Nav agrega "Inicio" y omite "Acerca de"** (tomada) vs. agregar ambos links aunque About no
  exista (descartada). Evita un link roto a una ruta que hoy no existe (404) hasta que se
  implemente una spec para Acerca de.
- **Ticker y top-5 de "Actividad en Vivo" hardcodeados igual que el prototipo** (tomada) vs.
  derivados de `lib/games.ts`/`seededScores` (descartada). Fiel al prototipo (que tampoco los
  deriva), sin ampliar el alcance con lógica de agregación no pedida.
- **CSS: solo se portan las clases que usa `home.jsx`** (tomada) vs. portar `styles.css` completo
  incluyendo clases de about y clases sin uso aparente (`.gp-*`, `.cabinet`, `.dp-*`, etc.)
  (descartada). Mantiene `globals.css` acotado al alcance real de esta spec; el resto se porta
  junto con la futura spec de Acerca de.

## Riesgos identificados

- **Porteo incompleto de CSS al filtrar "solo lo que usa `home.jsx`".** Varias clases se arman por
  interpolación (`"feature-card " + f.c`, `"tick-row"` con `top1`/`top2`/`top3` condicionales,
  colores `cyan`/`magenta`/`yellow`/`green` como modificadores), por lo que un grep superficial de
  nombres literales en el JSX puede omitir reglas CSS que solo aparecen combinadas
  (`.feature-card.cyan`, `.top-row.top1`, etc.). Mitigación: revisar `styles.css` sección por
  sección (no solo grep) para cada bloque de `home.jsx`, no solo los nombres de clase estáticos.
- **`IntersectionObserver` en un Client Component de Next.js 16.** El hook de reveal-on-scroll
  requiere `"use client"` y corre solo en el navegador; hay que verificar en
  `node_modules/next/dist/docs/` (por la advertencia de `AGENTS.md` sobre APIs distintas a las de
  entrenamiento) que no haya cambios relevantes en cómo Next 16 maneja efectos en componentes
  cliente dentro de App Router antes de asumir el comportamiento clásico de React.
