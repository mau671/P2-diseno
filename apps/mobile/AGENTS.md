# Guía para Agentes - Aplicación Móvil

## Información del Proyecto

Esta es una aplicación móvil desarrollada con:
- **Framework**: React Native + Expo
- **Entorno de ejecución**: Bun
- **Navegación**: Expo Router con navegación por tabs
- **Lenguaje**: TypeScript
- **Gestión de estado**: TanStack Query (React Query)
- **Backend**: Firebase

## Estructura del Proyecto

```
apps/mobile/
├── app/                        # Rutas y pantallas (file-based routing)
│   ├── (tabs)/                # Grupo de navegación por tabs
│   │   ├── _layout.tsx        # Layout de navegación tabs
│   │   ├── inicio.tsx         # Pantalla de inicio
│   │   ├── calendario.tsx     # Pantalla de calendario
│   │   └── configuracion.tsx  # Pantalla de configuración
│   ├── _layout.tsx            # Layout raíz
│   ├── config/               # Configuraciones
│   │   └── firebase.ts       # Configuración de Firebase
│   └── modal.tsx             # Pantalla modal de ejemplo
├── components/               # Componentes reutilizables
│   ├── ui/                   # Componentes UI básicos
│   │   ├── collapsible.tsx
│   │   └── icon-symbol.tsx
│   ├── themed-text.tsx
│   ├── themed-view.tsx
│   └── ...
├── hooks/                    # Custom hooks
│   ├── use-color-scheme.ts
│   └── use-theme-color.ts
├── constants/                # Constantes y temas
│   └── theme.ts
└── assets/                   # Imágenes y recursos estáticos
    └── images/
```

## Navegación Principal

La aplicación utiliza 3 pantallas principales en la navegación de tabs:

1. **Inicio** (`inicio.tsx`)
   - Icono: `house.fill`
   - Ruta: `/inicio`

2. **Calendario** (`calendario.tsx`)
   - Icono: `calendar`
   - Ruta: `/calendario`

3. **Configuración** (`configuracion.tsx`)
   - Icono: `gearshape.fill`
   - Ruta: `/configuracion`

## Comandos Útiles

```bash
# Iniciar servidor de desarrollo
bun start

# Ejecutar en Android
bun android

# Ejecutar en iOS
bun ios

# Ejecutar en web
bun web

# Linting
bun lint

# Resetear proyecto
bun reset-project
```

## Patrones de Código

### Componentes de Pantalla

Los componentes de pantalla deben seguir este patrón:

```tsx
import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function NombrePantallaScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Título</ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
```

### Componentes Temáticos

- Usar `ThemedView` en lugar de `View` para soporte de temas
- Usar `ThemedText` en lugar de `Text` para soporte de temas
- Los componentes temáticos se adaptan automáticamente al modo claro/oscuro

### Iconos

Los iconos usan el componente `IconSymbol` que soporta:
- iOS SF Symbols
- Android Material Icons
- Web fallback icons

```tsx
<IconSymbol size={28} name="calendar" color={color} />
```

## Configuración de Firebase

La configuración de Firebase se encuentra en `app/config/firebase.ts`. Asegúrate de tener las variables de entorno correctas configuradas.

## Hooks Personalizados

- `useColorScheme()`: Detecta el esquema de color del sistema (light/dark)
- `useThemeColor()`: Obtiene colores del tema actual

## Notas Importantes

1. **File-based Routing**: Expo Router usa el sistema de archivos para definir rutas. Los archivos en `app/` se convierten automáticamente en rutas.

2. **Grupos de Rutas**: Los paréntesis `(tabs)` indican un grupo de rutas que no afecta la URL pero agrupa componentes relacionados.

3. **Layouts**: Los archivos `_layout.tsx` definen el layout para las rutas en ese directorio.

4. **Alias de Importación**: Se usa `@/` como alias para la raíz del proyecto.

## Próximos Pasos Sugeridos

- Implementar contenido real en las pantallas de Inicio, Calendario y Configuración
- Conectar con Firebase para autenticación y datos
- Añadir navegación adicional según sea necesario
- Implementar gestión de estado global si es necesario
- Agregar tests unitarios y de integración
