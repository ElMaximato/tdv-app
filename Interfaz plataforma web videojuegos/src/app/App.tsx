import { BrowserRouter, Routes, Route } from 'react-router'
import { AuthProvider }    from './hooks/useAuth'
import { Navbar }          from './components/Navbar'
import { Footer }          from './components/Footer'
import { HomePage }        from './pages/HomePage'
import { RankingsPage }    from './pages/RankingsPage'
import { GameDetailPage }  from './pages/GameDetailPage'
import { ConsolePage }     from './pages/ConsolePage'
import { ConsolesPage }    from './pages/ConsolesPage'
import { QuizPage }        from './pages/QuizPage'
import { ProfilePage }     from './pages/ProfilePage'
import { LoginPage }       from './pages/LoginPage'
import { RegisterPage }    from './pages/RegisterPage'
import { VerifyEmailPage } from './pages/VerifyEmailPage'
import { SagasPage }       from './pages/SagasPage'
import { SagaDetailPage }  from './pages/SagaDetailPage'
import { ElitesPage }      from './pages/ElitesPage'
import { NaviSprite }      from './components/NaviSprite'
import { TierlistPage }  from './pages/TierlistPage'

// Admin
import { AdminAuthProvider } from './hooks/useAdminAuth'
import { AdminLayout }       from './admin/AdminLayout'
import { AdminLoginPage }    from './admin/AdminLoginPage'
import { AdminDashboard }    from './admin/AdminDashboard'
import { AdminGames }        from './admin/AdminGames'
import { AdminGameForm }     from './admin/AdminGameForm'
import { AdminReviews }      from './admin/AdminReviews'
import { AdminUsers }        from './admin/AdminUsers'
import { AdminQuiz }         from './admin/AdminQuiz'
import { AdminAudit }        from './admin/AdminAudit'
import { AdminConsoles }     from './admin/AdminConsoles'
import { AdminConsoleForm }  from './admin/AdminConsoleForm'
import { AdminSagasList }    from './admin/AdminSagasList'
import { AdminSagaForm }     from './admin/AdminSagaForm'
import { AdminTierlist } from './admin/AdminTierlist'

function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <Navbar />
      <main className="pb-8">{children}</main>
      <Footer />
      <NaviSprite />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AdminAuthProvider>
          <Routes>

            {/* ── RUTAS PÚBLICAS ── */}
            <Route path="/"              element={<PublicShell><HomePage /></PublicShell>} />
            <Route path="/rankings"      element={<PublicShell><RankingsPage /></PublicShell>} />
            <Route path="/game/:slug"    element={<PublicShell><GameDetailPage /></PublicShell>} />
            <Route path="/consolas"      element={<PublicShell><ConsolesPage /></PublicShell>} />
            <Route path="/console/:slug" element={<PublicShell><ConsolePage /></PublicShell>} />
            <Route path="/quiz"          element={<PublicShell><QuizPage /></PublicShell>} />
            <Route path="/profile"       element={<PublicShell><ProfilePage /></PublicShell>} />
            <Route path="/login"         element={<PublicShell><LoginPage /></PublicShell>} />
            <Route path="/register"      element={<PublicShell><RegisterPage /></PublicShell>} />
            <Route path="/verify-email"  element={<PublicShell><VerifyEmailPage /></PublicShell>} />
            <Route path="/sagas"         element={<PublicShell><SagasPage /></PublicShell>} />
            <Route path="/sagas/:slug"   element={<PublicShell><SagaDetailPage /></PublicShell>} />
            <Route path="/95"            element={<PublicShell><ElitesPage /></PublicShell>} />
            <Route path="/tierlist"      element={<PublicShell><TierlistPage /></PublicShell>} />

            {/* ── RUTAS ADMIN ── */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin"       element={<AdminLayout />}>
              <Route index                  element={<AdminDashboard />} />
              <Route path="games"           element={<AdminGames />} />
              <Route path="games/new"       element={<AdminGameForm />} />
              <Route path="games/:id"       element={<AdminGameForm />} />
              <Route path="reviews"         element={<AdminReviews />} />
              <Route path="consoles/new"    element={<AdminConsoleForm />} />
              <Route path="consoles/:id"    element={<AdminConsoleForm />} />
              <Route path="consoles"        element={<AdminConsoles />} />
              <Route path="sagas"           element={<AdminSagasList />} />
              <Route path="sagas/new"       element={<AdminSagaForm />} />
              <Route path="sagas/:id"       element={<AdminSagaForm />} />
              <Route path="users"           element={<AdminUsers />} />
              <Route path="quiz"            element={<AdminQuiz />} />
              <Route path="audit"           element={<AdminAudit />} />
              <Route path="tierlist"        element={<AdminTierlist />} />
            </Route>

          </Routes>
        </AdminAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}