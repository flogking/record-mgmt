import { useState, useEffect, useCallback } from 'react'
import { Table, Button, Space, Popconfirm, Tag, message, Modal, Form, Input, Select } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { getUser } from '../services/authService'
import { fetchUsers, fetchAgent1List, createUser, updateUser, deleteUser } from '../services/userService'
import type { UserInfoWithMeta, CreateUserForm, UpdateUserForm } from '../services/userService'
import { ROLE_LABEL } from '../utils/permission'

export default function UserManagePage() {
  const [users, setUsers] = useState<UserInfoWithMeta[]>([])
  const [agent1List, setAgent1List] = useState<{id: string, username: string}[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserInfoWithMeta | undefined>(undefined)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  const currentUser = getUser()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [userList, agents] = await Promise.all([
        fetchUsers(),
        fetchAgent1List(),
      ])
      setUsers(userList)
      setAgent1List(agents)
    } catch (err: any) {
      message.error(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const openCreate = () => {
    setEditingUser(undefined)
    form.resetFields()
    form.setFieldsValue({ role: 'agent_1' })
    setModalOpen(true)
  }

  const openEdit = (record: UserInfoWithMeta) => {
    setEditingUser(record)
    form.setFieldsValue({
      username: record.username,
      role: record.role,
      parent_id: record.parent_id || undefined,
    })
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      setSubmitting(true)
      if (editingUser) {
        const formData: UpdateUserForm = {
          username: values.username,
          role: values.role,
          parent_id: values.role === 'agent_2' ? (values.parent_id || null) : null,
        }
        if (values.password) formData.password = values.password
        await updateUser(editingUser.id, formData)
        message.success('更新成功')
      } else {
        const formData: CreateUserForm = {
          username: values.username,
          password: values.password,
          role: values.role,
          parent_id: values.role === 'agent_2' ? values.parent_id : undefined,
        }
        await createUser(formData)
        message.success('创建成功')
      }
      setModalOpen(false)
      form.resetFields()
      loadData()
    } catch (err: any) {
      if (err instanceof Error) message.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteUser(id)
      message.success('删除成功')
      loadData()
    } catch (err: any) {
      message.error(err.message)
    }
  }

  const selectedRole = Form.useWatch('role', form)

  const columns: ColumnsType<UserInfoWithMeta> = [
    {
      title: '用户名',
      dataIndex: 'username',
      width: 120,
      render: (v: string) => v === currentUser?.username ? <strong>{v} (当前)</strong> : v,
    },
    {
      title: '角色',
      dataIndex: 'role',
      width: 120,
      render: (v: string) => (
        <Tag color={v === 'director' ? 'red' : v === 'agent_1' ? 'blue' : 'green'}>
          {ROLE_LABEL[v] || v}
        </Tag>
      ),
    },
    {
      title: '上级代理',
      dataIndex: 'parent_id',
      width: 120,
      render: (v: string | null) => {
        if (!v) return '-'
        const parent = users.find(u => u.id === v)
        return parent ? parent.username : v
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 180,
      render: (v: string) => v ? new Date(v).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: UserInfoWithMeta) => {
        if (record.id === currentUser?.id) return <span style={{color:'#999'}}>-</span>
        if (record.role === 'director') return <span style={{color:'#999'}}>-</span>
        return (
          <Space size="small">
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
              编辑
            </Button>
            <Popconfirm title={'确定要删除该用户吗？'} onConfirm={() => handleDelete(record.id)}>
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          </Space>
        )
      },
    },
  ]

  return (
    <div style={{ padding: '16px 24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ margin: 0 }}>{'用户管理'}</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          {'新增用户'}
        </Button>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={users}
        loading={loading}
        pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => '共 ' + t + ' 条' }}
        scroll={{ x: 'max-content' }}
        size="middle"
      />

      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
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
          <Form.Item label={'角色'} name="role" rules={[{ required: true, message: '请选择角色' }]}>
            <Select placeholder={'请选择角色'}>
              <Select.Option value="agent_1">{'一级代理'}</Select.Option>
              <Select.Option value="agent_2">{'二级代理'}</Select.Option>
            </Select>
          </Form.Item>
          {selectedRole === 'agent_2' && (
            <Form.Item label={'上级一级代理'} name="parent_id" rules={[{ required: true, message: '请选择上级代理' }]}>
              <Select placeholder={'请选择上级一级代理'}>
                {agent1List.map(a => (
                  <Select.Option key={a.id} value={a.id}>{a.username}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  )
}
