import { useState } from 'react'
import { Layout, Button, Space, Tag, Typography, Tabs, Modal, Form, Input, message } from 'antd'
import { LogoutOutlined, EditOutlined } from '@ant-design/icons'
import { getUser, logout } from '../services/authService'
import { updateUser } from '../services/userService'
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
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  const handleLogout = () => {
    logout()
    onLogout()
  }

  const openEdit = () => {
    form.resetFields()
    if (user) {
      form.setFieldsValue({ username: user.username })
    }
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (!user) return
      setSubmitting(true)

      const formData: any = {}
      if (user.role === 'director' && values.username) {
        formData.username = values.username
      }
      if (values.password) {
        formData.password = values.password
      }

      if (Object.keys(formData).length === 0) {
        message.info('没有需要修改的内容')
        setSubmitting(false)
        return
      }

      await updateUser(user.id, formData)

      // Update localStorage if username changed
      if (formData.username) {
        const saved = JSON.parse(localStorage.getItem('user_info') || '{}')
        saved.username = formData.username
        localStorage.setItem('user_info', JSON.stringify(saved))
      }

      message.success('修改成功')
      setModalOpen(false)

      // Reload page to reflect username change
      if (formData.username) {
        window.location.reload()
      }
    } catch (err: any) {
      if (err instanceof Error) message.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const tabItems = userRole === 'client'
    ? [
        { key: 'client_orders', label: '收单中心' },
        { key: 'rankings', label: '排行榜' },
      ]
    : [
        { key: 'rankings', label: '排行榜' },
        { key: 'records', label: '记录管理' },
        { key: 'files', label: '资料中心' },
        ...(userRole === 'director' ? [
          { key: 'dashboard', label: '业绩看板' },
          { key: 'users', label: '用户管理' },
        ] : []),
        ...(userRole === 'agent_1' ? [
          { key: 'team', label: '团队管理' },
          { key: 'staff', label: '下属管理' },
        ] : []),
      ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        padding: '8px 16px',
        background: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        gap: 8,
        height: 'auto',
        lineHeight: 'unset',
      }}>
        <Text strong style={{ fontSize: 'clamp(14px, 4vw, 18px)', color: '#1890ff', whiteSpace: 'nowrap' }}>{'智能分销系统'}</Text>
        <Space size="middle">
          {user && (
            <>
              <Text>{user.username}</Text>
              <Tag color="blue">{ROLE_LABEL[user.role] || user.role}</Tag>
              <Button icon={<EditOutlined />} onClick={openEdit}>{'修改信息'}</Button>
            </>
          )}
          <Button icon={<LogoutOutlined />} danger onClick={handleLogout}>{'退出登录'}</Button>
        </Space>
      </Header>
      <div style={{ padding: '0 8px', background: '#f5f5f5', overflowX: 'auto' }}>
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

      <Modal
        title={'修改我的信息'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitting}
        destroyOnClose
        width={480}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          {user?.role === 'director' && (
            <Form.Item label="用户名" name="username" rules={[{ required: true, message: '请输入用户名' }]}>
              <Input placeholder="请输入用户名" />
            </Form.Item>
          )}
          <Form.Item label="新密码" name="password">
            <Input.Password placeholder="留空则不修改密码" />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  )
}
