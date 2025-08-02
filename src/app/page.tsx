import { ProtectedRoute } from '@/components/auth'
import { Dashboard } from '@/components/Dashboard'

export default function Home() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  )
}
