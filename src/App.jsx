import { Routes, Route } from 'react-router-dom'
import { useAuth } from './hooks/useAuth.jsx'
import Spinner from './components/ui/Spinner.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Layout from './components/Layout.jsx'
import LoginPage from './pages/LoginPage.jsx'
import MainPage from './pages/MainPage.jsx'
import UsersPage from './pages/UsersPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

export default function App() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<MainPage />} />
        <Route path="board/:boardId" element={<MainPage />} />
        <Route path="users" element={<UsersPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
