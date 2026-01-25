import React from "react"
import ReactDOM from "react-dom/client"
import "./index.css"

import "./i18n"

import { QueryClient } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister"
import { RouterProvider } from "@tanstack/react-router"
import { router } from "./router"
import { ThemeProvider } from "./components/theme-provider"
import { ThemeColorInitializer } from "./components/theme-color-initializer"
import { AuthProvider } from "./context/auth-context"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60 * 4,
      gcTime: 1000 * 60 * 60 * 24 * 7,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      retry: (failureCount) => {
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => {
        // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (max)
        return Math.min(1000 * Math.pow(2, attemptIndex), 30000);
      },
    },
  },
})

const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'web-app-query-cache',
})

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <ThemeColorInitializer />
      <AuthProvider> 
        <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
          <RouterProvider router={router} />
          <ReactQueryDevtools initialIsOpen={false} />
        </PersistQueryClientProvider>
      </AuthProvider> 
    </ThemeProvider>
  </React.StrictMode>,
)
