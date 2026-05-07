import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/hooks/useAuth'
import { router } from '@/routes/router'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:            1000 * 60 * 5,  // 5 minutos — evita refetches innecesarios
      gcTime:               1000 * 60 * 10, // 10 minutos — libera memoria de queries viejas
      refetchOnWindowFocus: false,
      retry:                1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            style: {
              background: '#1a1d21',
              color: '#e8eaee',
              border: '1px solid #262931',
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  )
}
