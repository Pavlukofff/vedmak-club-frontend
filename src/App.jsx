import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import UsersPage from './pages/UsersPage'
import PublicProfilePage from './pages/PublicProfilePage'
import CabinetPage from './pages/CabinetPage'
import BattlesPage from './pages/BattlesPage'
import BestiaryPage from './pages/BestiaryPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="verify-email" element={<VerifyEmailPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="battles" element={<BattlesPage />} />
        <Route path="bestiary" element={<BestiaryPage />} />
        <Route path="u/:username" element={<PublicProfilePage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="cabinet" element={<CabinetPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
