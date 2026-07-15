import { useState, useEffect } from 'react'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import LoginPage from './pages/LoginPage'
import RecordPage from './pages/RecordPage'
import UserManagePage from './pages/UserManagePage'
import TeamPage from './pages/TeamPage'
import AgentStaffPage from './pages/AgentStaffPage'
import DashboardPage from './pages/DashboardPage'
import FileCenterPage from './pages/FileCenterPage'
import ClientPage from './pages/ClientPage'
import RankingsPage from './pages/RankingsPage'
import AppLayout from './components/AppLayout'
import { getUser } from './services/authService'
import { onJwtExpired } from './utils/api'

export default function App() {
  const [user, setUser] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState('records')

  useEffect(() => {
    const saved = getUser()
    if (saved) {
      setUser(saved)
      if (saved.role === 'client') setCurrentPage('client_orders')
    }
    onJwtExpired(() => setUser(null))
  }, [])

  const renderPage = () => {
    if (user?.role === 'client') return <ClientPage />
    if (currentPage === 'dashboard' && user?.role === 'director') return <DashboardPage />
    if (currentPage === 'users' && user?.role === 'director') return <UserManagePage />
    if (currentPage === 'team' && (user?.role === 'agent_1' || user?.role === 'agent_2')) return <TeamPage />
    if (currentPage === 'staff' && (user?.role === 'agent_1' || user?.role === 'agent_2')) return <AgentStaffPage />
    if (currentPage === 'rankings') return <RankingsPage />
    if (currentPage === 'files') return <FileCenterPage user={user} />
    return <RecordPage />
  }

  if (user) {
    return (
      <ConfigProvider locale={zhCN}>
        <AppLayout
          onLogout={() => setUser(null)}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          userRole={user.role}
        >
          {renderPage()}
        </AppLayout>
      </ConfigProvider>
    )
  }

  return (
    <ConfigProvider locale={zhCN}>
      <LoginPage onLogin={(u) => setUser(u)} />
    </ConfigProvider>
  )
}
