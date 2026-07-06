import { useState, useEffect, useRef } from 'react'
import { Table, Button, Space, Tag, message, Modal, Form, Input } from 'antd'
import { PlusOutlined, EditOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { getUser } from '../services/authService'
import { createUser, updateUser } from '../services/userService'
import type { UserInfoWithMeta } from '../services/userService'

const SUPABASE_URL = 'https://mxywcwjiltmhyiueatfu.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14eXdjd2ppbHRtaHlpdWVhdGZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MDI1MzYsImV4cCI6MjA5ODQ3ODUzNn0.K2J9Aw0jJSGipOgjjGx7CHK8-iQ-SCzS5JSxOMRxpW8'

export default function AgentStaffPage() {
  const [staff, setStaff] = useState<UserInfoWithMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserInfoWithMeta | undefined>(undefined)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()
  const mountedRef = useRef(true)
  const currentUser = getUser()

  const loadStaff = async () => {
    if (!currentUser) return
    setLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      const res = await fetch(
        SUPABASE_URL + '/rest/v1/users?select=id,username,role,parent_id,created_at&parent_id=eq.' + currentUser.id + '&order=created_at.desc',
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            ...(token ? { 'Authorization': 'Bearer ' + token } : {}),
          },
        }
      )
      if (res.ok && mountedRef.current) {
        setStaff(await res.json())
      }
    } catch (err: any) {
      if (mountedRef.current) message.error(err.message)
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }

  useEffect(() => {
    mountedRef.current = true
    loadStaff()
    return () => { mountedRef.current = false }
  }, [])

  const openCreate = () => {
    setEditingUser(undefined)
    form.resetFields()
    setModalOpen(true)
  }

  const openEdit = (record: UserInfoWithMeta) => {
    setEditingUser(record)
    form.setFieldsValue({ username: record.username })
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)

      if (editingUser) {
        await updateUser(editingUser.id, {
          username: values.username,
          ...(values.password ? { password: values.password } : {}),
        })
        message.success('更新成功')
      } else {
        await createUser({
          username: values.username,
          password: values.password,
          role: 'agent_2',
          parent_id: currentUser?.id,
        })
        message.success('创建成功')
      }

      setModalOpen(false)
      form.resetFields()
      loadStaff()
    } catch (err: any) {
      if (err instanceof Error) message.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const columns: ColumnsType<UserInfoWithMeta> = [
    { title: '用户名', dataIndex: 'username', width: 150 },
    {
      title: '角色', dataIndex: 'role', width: 120,
      render: (v: string) => <Tag color="green">{'分销商'}</Tag>,
    },
    {
      title: '创建时间', dataIndex: 'created_at', width: 200,
      render: (v: string) => v ? new Date(v).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作', key: 'action', width: 100,
      render: (_: any, record: UserInfoWithMeta) => (
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
          {'编辑'}
        </Button>
      ),
    },
  ]

  return (
    <div style={{ padding: '16px 24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ margin: 0 }}>{'下属管理'}</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          {'新增下属'}
        </Button>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={staff}
        loading={loading}
        pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => '共 ' + t + ' 条' }}
        scroll={{ x: 'max-content' }}
        size="middle"
        locale={{ emptyText: '暂无下属，点击“新增下属”添加' }}
      />

      <Modal
        title={editingUser ? '编辑下属' : '新增下属'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => { setModalOpen(false); form.resetFields() }}
        confirmLoading={submitting}
        destroyOnClose
        width={{ xs: '90vw', sm: 480 }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label={'用户名'} name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input placeholder={'请输入用户名'} />
          </Form.Item>
          <Form.Item
            label={'密码'}
            name="password"
            rules={editingUser ? [] : [{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder={editingUser ? '留空则不修改密码' : '请输入密码'} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
