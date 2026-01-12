# Agent Guide - Mobile Application

## Project Information

This is a mobile application built with:
- **Framework**: React Native + Expo
- **Runtime**: Bun
- **Navigation**: Expo Router with tab navigation
- **Language**: TypeScript
- **State Management**: TanStack Query (React Query)
- **Internationalization**: i18next + react-i18next
- **Backend**: Firebase
- **Storage**: AsyncStorage

## Project Structure

```
apps/mobile/
├── app/                        # Routes and screens (file-based routing)
│   ├── (tabs)/                # Tab navigation group
│   │   ├── _layout.tsx        # Tab navigation layout
│   │   ├── index.tsx          # Home screen
│   │   ├── calendar.tsx       # Calendar screen
│   │   └── settings.tsx       # Settings screen
│   ├── _layout.tsx            # Root layout
│   ├── i18n.ts                # i18next configuration
│   ├── locales/               # Translation files
│   │   ├── en-US/
│   │   │   └── common.json    # English translations
│   │   └── es-419/
│   │       └── common.json    # Spanish translations
│   ├── config/                # Configurations
│   │   └── firebase.ts        # Firebase configuration
│   └── modal.tsx              # Example modal screen
├── components/                # Reusable components
│   ├── ui/                    # Basic UI components
│   │   ├── collapsible.tsx
│   │   └── icon-symbol.tsx
│   ├── themed-text.tsx
│   ├── themed-view.tsx
│   └── ...
├── hooks/                     # Custom hooks
│   ├── use-color-scheme.ts
│   └── use-theme-color.ts
├── constants/                 # Constants and themes
│   └── theme.ts
└── assets/                    # Images and static resources
    └── images/
```

## Main Navigation

The app uses 3 main screens in the tab navigation:

1. **Home** (`index.tsx`)
   - Icon: `house.fill`
   - Route: `/`

2. **Calendar** (`calendar.tsx`)
   - Icon: `calendar`
   - Route: `/calendar`

3. **Settings** (`settings.tsx`)
   - Icon: `gearshape.fill`
   - Route: `/settings`

## Internationalization (i18n)

### Configuration

The app uses **i18next** for internationalization, configured in `app/i18n.ts`:

- **Supported Languages**: 
  - `es-419` - Spanish (Latin America) - Default/Fallback
  - `en-US` - English (United States)
- **Namespace**: `common` (single namespace)
- **Storage**: AsyncStorage (persists user language preference)
- **Detection Order**:
  1. Saved language in AsyncStorage (key: `lng`)
  2. Device locale via `expo-localization`
  3. Fallback to `es-419`

### Translation Files

Located in `app/locales/[locale]/common.json`:

```json
{
  "nav": {
    "home": "Home",
    "calendar": "Calendar",
    "settings": "Settings"
  },
  "common": {
    "loading": "Loading...",
    "error": "Error"
  },
  "settings": {
    "title": "Settings",
    "language": {
      "title": "Language",
      "es-419": "Spanish (Latin America)",
      "en-US": "English (United States)"
    }
  }
}
```

### Usage in Components

```tsx
import { useTranslation } from 'react-i18next';

export default function MyScreen() {
  const { t, i18n } = useTranslation();

  // Get translation
  const title = t('settings.title');

  // Change language
  const changeLanguage = async (lang: string) => {
    await i18n.changeLanguage(lang);
  };

  // Get current language
  const currentLang = i18n.language;

  return (
    <ThemedView>
      <ThemedText>{title}</ThemedText>
    </ThemedView>
  );
}
```

### Language Detection

The app automatically detects the user's language:
1. Checks AsyncStorage for saved preference
2. Falls back to device locale (via `expo-localization`)
3. Maps device locale to supported locales (es → es-419, en → en-US)
4. Uses es-419 as final fallback

## Useful Commands

```bash
# Start development server
bun start

# Run on Android
bun android

# Run on iOS
bun ios

# Run on web
bun web

# Linting
bun lint

# Reset project
bun reset-project
```

## Code Patterns

### Screen Components

Screen components should follow this pattern:

```tsx
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function MyScreen() {
  const { t } = useTranslation();

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">{t('myscreen.title')}</ThemedText>
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

### Themed Components

- Use `ThemedView` instead of `View` for theme support
- Use `ThemedText` instead of `Text` for theme support
- Themed components automatically adapt to light/dark mode

### Icons

Icons use the `IconSymbol` component which supports:
- iOS SF Symbols
- Android Material Icons
- Web fallback icons

```tsx
<IconSymbol size={28} name="calendar" color={color} />
```

## Firebase Configuration

Firebase configuration is located in `app/config/firebase.ts`. Make sure you have the correct environment variables configured.

## Custom Hooks

- `useColorScheme()`: Detects system color scheme (light/dark)
- `useThemeColor()`: Gets colors from current theme

## Important Notes

1. **File-based Routing**: Expo Router uses the file system to define routes. Files in `app/` automatically become routes.

2. **Route Groups**: Parentheses `(tabs)` indicate a route group that doesn't affect the URL but groups related components.

3. **Layouts**: `_layout.tsx` files define the layout for routes in that directory.

4. **Import Alias**: `@/` is used as an alias for the project root.

5. **i18n Initialization**: The i18n configuration must be imported in `app/_layout.tsx` before rendering any components.

6. **Locale Codes**: Use BCP 47 language tags (`es-419`, `en-US`) consistent with the web app.

## Dependencies

Key packages:
- `i18next` - Internationalization framework
- `react-i18next` - React bindings for i18next
- `expo-localization` - Device locale detection
- `@react-native-async-storage/async-storage` - Persistent storage

## Next Steps Suggestions

- Implement real content in Home, Calendar, and Settings screens
- Connect to Firebase for authentication and data
- Add more translations as features are developed
- Add additional navigation as needed
- Implement global state management if necessary
- Add unit and integration tests
- Sync translation keys with web app for consistency
