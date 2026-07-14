import { useState, useEffect, useRef } from 'react'
import { Table, Button, Space, Popconfirm, message, Card, Statistic, Row, Col, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, ShoppingCartOutlined, DollarOutlined, CalendarOutlined, FieldTimeOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { getUser } from '../services/authService'
import { fetchRecords, createRecord, updateRecord, deleteRecord } from '../services/recordService'
import type { Record } from '../types/record'
import type { RecordFormData } from '../services/recordService'
import RecordFormModal from '../components/RecordFormModal'
import { canEditRow } from '../utils/permission'
import { exportToExcel } from '../utils/exportExcel'
import { fetchUsers } from '../services/userService'
import { SUPABASE_URL, SUPABASE_ANON_KEY, authFetchWithTimeout } from '../utils/api'

export default function RecordPage() {
  const [records, setRecords] = useState<Record[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<Record | undefined>(undefined)
  const [submitting, setSubmitting] = useState(false)
  const [userNames, setUserNames] = useState<{[key: string]: string}>({})
  const mountedRef = useRef(true)

  const user = getUser()

  useEffect(() => {
    mountedRef.current = true
    setLoading(true)

    const loadData = async () => {
      try {
        const data = await fetchRecords()
        if (mountedRef.current) setRecords(data)
      } catch (err: any) {
        if (mountedRef.current) message.error(err.message)
      } finally {
        if (mountedRef.current) setLoading(false)
      }
    }

    const loadNames = async () => {
      const names: {[key: string]: string} = {}
      if (user) names[user.id] = user.username
      try {
        const token = localStorage.getItem('access_token')
        const res = await fetch('https://mxywcwjiltmhyiueatfu.supabase.co/rest/v1/users?select=id,username', {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14eXdjd2ppbHRtaHlpdWVhdGZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MDI1MzYsImV4cCI6MjA5ODQ3ODUzNn0.K2J9Aw0jJSGipOgjjGx7CHK8-iQ-SCzS5JSxOMRxpW8',
            ...(token ? { 'Authorization': 'Bearer ' + token } : {}),
          },
        })
        if (res.ok && mountedRef.current) {
          const users = await res.json()
          users.forEach((u: any) => { names[u.id] = u.username })
        }
      } catch { /* silent */ }
      if (mountedRef.current) setUserNames(names)
    }

    loadData()
    loadNames()
    return () => { mountedRef.current = false }
  }, [])

  // 统计计算
  const totalCount = records.length
  const totalAmount = records.reduce((s, r) => s + (r.amount || 0), 0)
  const today = dayjs().format('YYYY-MM-DD')
  const monthStart = dayjs().startOf('month').format('YYYY-MM-DD')
  const monthCount = records.filter(r => r.record_date >= monthStart).length
  const todayCount = records.filter(r => r.record_date === today).length

  const handleCreate = async (formData: RecordFormData) => {
    setSubmitting(true)
    try {
      await createRecord(formData)
      message.success('创建成功')
      setModalOpen(false)
      setLoading(true)
      fetchRecords().then(d => { if (mountedRef.current) { setRecords(d); setLoading(false) } }).catch(() => { if (mountedRef.current) setLoading(false) })
    } catch (err: any) {
      message.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (formData: RecordFormData) => {
    if (!editingRecord) return
    setSubmitting(true)
    try {
      await updateRecord(editingRecord.id, formData)
      message.success('更新成功')
      setModalOpen(false)
      setEditingRecord(undefined)
      setLoading(true)
      fetchRecords().then(d => { if (mountedRef.current) { setRecords(d); setLoading(false) } }).catch(() => { if (mountedRef.current) setLoading(false) })
    } catch (err: any) {
      message.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteRecord(id)
      message.success('删除成功')
      setLoading(true)
      fetchRecords().then(d => { if (mountedRef.current) { setRecords(d); setLoading(false) } }).catch(() => { if (mountedRef.current) setLoading(false) })
    } catch (err: any) {
      message.error(err.message)
    }
  }

  const openCreate = () => {
    setEditingRecord(undefined)
    setModalOpen(true)
  }

  const openEdit = (record: Record) => {
    setEditingRecord(record)
    setModalOpen(true)
  }

  const columns: ColumnsType<Record> = [
    { title: '客户姓名', dataIndex: 'customer_name', width: 120 },
    { title: '联系电话', dataIndex: 'phone', width: 130, render: (v: string | null) => v || '-' },
    { title: '业务', dataIndex: 'business_type', width: 80, render: (v: string | null) => v || '-' },
    { title: '产品', dataIndex: 'product', width: 120 },
    { title: '金额', dataIndex: 'amount', width: 100, render: (v: number) => v ? v.toFixed(2) : '-' },
    { title: '日期', dataIndex: 'record_date', width: 120 },
    { title: '快递地址', dataIndex: 'shipping_address', width: 180, ellipsis: true },
    { title: '时间', dataIndex: 'record_time', width: 100, render: (v: string) => v || '-' },
    { title: '快递单号', dataIndex: 'tracking_number', width: 150, render: (v: string | null) => v || '-' },
    { title: '备注', dataIndex: 'remark', width: 150, ellipsis: true, render: (v: string | null) => v || '-' },
    { title: '创建人', dataIndex: 'user_id', width: 120, render: (v: string) => <Tag>{userNames[v] || v}</Tag> },
    { title: '创建时间', dataIndex: 'created_at', width: 180, render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-' },
    ...(user
      ? [{
          title: '操作',
          key: 'action',
          width: 150,
          fixed: 'right' as const,
          render: (_: any, record: Record) => {
            if (!user || !canEditRow(user, record.user_id)) return null
            return (
              <Space size="small">
                <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
                  {'编辑'}
                </Button>
                <Popconfirm title={'确定要删除这条记录吗？'} onConfirm={() => handleDelete(record.id)}>
                  <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                    {'删除'}
                  </Button>
                </Popconfirm>
              </Space>
            )
          },
        }]
      : []),
  ]

  
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

  const handleExport = async () => {
    if (records.length === 0) {
      message.warning('\u6682\u65e0\u6570\u636e\u53ef\u5bfc\u51fa')
      return
    }
    try {
      const users = await fetchUsers()
      const userMap: Record<string, string> = {}
      users.forEach((u: any) => { userMap[u.id] = u.username })
      const recordsWithCreator = records.map((r: any) => ({
        ...r,
        creator_name: userMap[r.user_id] || r.user_id,
      }))
      exportToExcel(recordsWithCreator)
      message.success('\u5bfc\u51fa\u6210\u529f')
    } catch (err: any) {
      message.error(err.message)
    }
  }

  return (
    <div style={{ padding: '16px 24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ margin: 0 }}>{'记录管理'}</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            {'新增记录'}
          </Button>
          {!isMobile && <Button type="primary" onClick={handleExport}>{'导出 Excel'}</Button>}
        </div>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small" style={{ borderRadius: 8 }}>
            <Statistic
              title={'总订单数'}
              value={totalCount}
              prefix={<ShoppingCartOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ borderRadius: 8 }}>
            <Statistic
              title={'总金额'}
              value={totalAmount}
              precision={2}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ borderRadius: 8 }}>
            <Statistic
              title={'本月新增'}
              value={monthCount}
              prefix={<CalendarOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
              suffix={'条'}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ borderRadius: 8 }}>
            <Statistic
              title={'今日新增'}
              value={todayCount}
              prefix={<FieldTimeOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
              suffix={'条'}
            />
          </Card>
        </Col>
      </Row>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={records}
        loading={loading}
        pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => '共 ' + t + ' 条' }}
        scroll={{ x: 'max-content' }}
        size="middle"
      />

      <RecordFormModal
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditingRecord(undefined) }}
        onSubmit={editingRecord ? handleUpdate : handleCreate}
        initialValues={editingRecord}
      />
    </div>
  )
}
