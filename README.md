# Anime App (Web + Mobile)

Monorepo con:
- **Web:** Vite + React + TanStack Router + TanStack Query + i18n (ES/EN)
- **Mobile:** React Native (Expo) + TanStack Query + i18n (ES/EN)
- **API pública:** Jikan (MyAnimeList) `https://api.jikan.moe/v4/...`

## Requisitos

Instalar en la máquina:
- **Git**
- **Node.js** (recomendado LTS)
- **Bun** (package manager y runtime)
- **Android Studio** (para emulador Android) o **Expo Go** en un teléfono (para probar en dispositivo)

## Estructura del repositorio

```

anime-app/
apps/
web/        # Vite + React (web)
mobile/     # Expo (React Native)
packages/     # código compartido
package.json  # workspaces

````

## Instalación (primer uso)

Clonar el repo e instalar dependencias desde la raíz:

```bash
git clone https://github.com/mau671/P1-diseno
cd anime-app
bun install
````

## Ejecutar Web

```bash
cd apps/web
bun run dev
```

* Servidor de desarrollo: el comando muestra la URL local.
* Build de producción:

```bash
cd apps/web
bun run build
```

* Preview del build:

```bash
cd apps/web
bun run preview
```

## Ejecutar Mobile (Expo)

```bash
cd apps/mobile
bun run start
```

Opciones comunes:

* Android (emulador/dispositivo):

```bash
cd apps/mobile
bun run android
```

* iOS (requiere macOS para compilar nativo; en Windows se usa Expo Go para pruebas):

```bash
cd apps/mobile
bun run ios
```

* Web (Expo Web):

```bash
cd apps/mobile
bun run web
```

## i18n (Español / English)

### Web

* Inicialización: `apps/web/src/i18n.ts`
* Traducciones:

  * `apps/web/src/locales/es-419/common.json`
  * `apps/web/src/locales/en-US/common.json`

Regla:

* Agregar claves nuevas en **ambos** archivos (`es-419` y `en-US`).

### Mobile

* i18n usa `i18next` + `react-i18next`.
* Para idioma del dispositivo se usa `expo-localization`.

## Routing (Web)

* Rutas por archivos con TanStack Router:

  * Directorio: `apps/web/src/routes/`
  * Root route: `apps/web/src/routes/__root.tsx`
  * Home (`/`): `apps/web/src/routes/index.tsx`
* Router:

  * `apps/web/src/router.tsx`
  * Archivo generado: `apps/web/src/routeTree.gen.ts` (se genera al correr `bun run dev` en web)

Para crear una ruta nueva:

1. Crear el archivo en `apps/web/src/routes/` (ej. `about.tsx`).
2. Exportar una `Route` con `createFileRoute()`.

## Data Fetching y Cache (TanStack Query)

* Web:

  * Provider en `apps/web/src/main.tsx`
  * Uso en componentes con `useQuery()` / `useMutation()`

* Mobile:

  * Debe existir un `QueryClientProvider` a nivel raíz (por ejemplo en `app/_layout.tsx` si se usa Expo Router, o en el entry principal).

Regla:

* Las consultas deben usar `queryKey` estable y funciones `fetch` que lancen error si el HTTP no es OK.

## Convenciones

* No se guardan llaves privadas ni secretos en el repo.
* La API de Jikan puede tener límites de rate; evitar hacer refetch agresivo en loops.
* Toda UI visible debe quedar en ES/EN (no dejar texto hardcodeado sin traducción).