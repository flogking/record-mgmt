import { Layout, Button, Space, Tag, Typography, Tabs } from 'antd'
import { LogoutOutlined } from '@ant-design/icons'
import { getUser, logout } from '../services/authService'
import { ROLE_LABEL } from '../utils/permission'

const { Header, Content } = Layout
const { Text } = Typography

interface Props {
  children: React.ReactNode
  onLogout: () => void
  currentPage: string
  onPageChange: (page: string) => void
  userRole: string
}

export default function AppLayout({ children, onLogout, currentPage, onPageChange, userRole }: Props) {
  const user = getUser()

  const handleLogout = () => {
    logout()
    onLogout()
  }

  const tabItems = [
    { key: 'records', label: '记录管理' },
    { key: 'files', label: '资料中心' },
  ]
  if (userRole === 'director') {
    tabItems.push({ key: 'dashboard', label: '业绩看板' })
    tabItems.push({ key: 'users', label: '用户管理' })
  }
  if (userRole === 'agent_1') {
    tabItems.push({ key: 'team', label: '团队管理' })
    tabItems.push({ key: 'staff', label: '下属管理' })
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 24px',
        background: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      }}>
        <Text strong style={{ fontSize: 18, color: '#1890ff' }}>{'智能分销系统'}</Text>
        <Space size="middle">
          {user && (
            <>
              <Text>{user.username}</Text>
              <Tag color="blue">{ROLE_LABEL[user.role] || user.role}</Tag>
            </>
          )}
          <Button icon={<LogoutOutlined />} danger onClick={handleLogout}>{'退出登录'}</Button>
        </Space>
      </Header>
      <div style={{ padding: '0 24px', background: '#f5f5f5' }}>
        <Tabs
          activeKey={currentPage}
          onChange={onPageChange}
          items={tabItems}
          style={{ marginBottom: 0 }}
        />
      </div>
      <Content style={{ background: '#f5f5f5' }}>
        {children}
      </Content>
    </Layout>
  )
}
