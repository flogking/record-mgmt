import { useState, useEffect, useRef } from 'react'
import { Table, Tag, message, Empty } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { getUser } from '../services/authService'
import { fetchRecords } from '../services/recordService'
import { SUPABASE_URL, SUPABASE_ANON_KEY, authFetchWithTimeout } from '../utils/api'
import type { Record } from '../types/record'


export default function TeamPage() {
  const [records, setRecords] = useState<Record[]>([])
  const [loading, setLoading] = useState(true)
  const [userNames, setUserNames] = useState<{ [key: string]: string }>({})
  const mountedRef = useRef(true)
  const currentUser = getUser()

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
      const names: { [key: string]: string } = {}
      if (currentUser) names[currentUser.id] = currentUser.username
      try {
        const token = localStorage.getItem('access_token')
        const res = await fetch(SUPABASE_URL + '/rest/v1/users?select=id,username', {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
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

  const columns: ColumnsType<Record> = [
    { title: '\u5ba2\u6237\u59d3\u540d', dataIndex: 'customer_name', width: 120 },
    { title: '\u4ea7\u54c1', dataIndex: 'product', width: 120 },
    { title: '\u91d1\u989d', dataIndex: 'amount', width: 100, render: (v: number) => v ? v.toFixed(2) : '-' },
    { title: '\u65e5\u671f', dataIndex: 'record_date', width: 120 },
    { title: '\u5feb\u9012\u5730\u5740', dataIndex: 'shipping_address', width: 180, ellipsis: true },
    { title: '\u65f6\u95f4', dataIndex: 'record_time', width: 100, render: (v: string) => v || '-' },
    { title: '\u5feb\u9012\u5355\u53f7', dataIndex: 'tracking_number', width: 150, render: (v: string | null) => v || '-' },
    { title: '\u5907\u6ce8', dataIndex: 'remark', width: 150, ellipsis: true, render: (v: string | null) => v || '-' },
    {
      title: '\u521b\u5efa\u4eba',
      dataIndex: 'user_id',
      width: 120,
      render: (v: string) => {
        const name = userNames[v]
        if (v === currentUser?.id) return <Tag color="blue">{name || v}</Tag>
        return <Tag color="green">{name || v}</Tag>
      },
    },
    { title: '\u521b\u5efa\u65f6\u95f4', dataIndex: 'created_at', width: 180, render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-' },
  ]

  const ownRecords = records.filter(r => r.user_id === currentUser?.id)
  const subRecords = records.filter(r => r.user_id !== currentUser?.id)
  const ownTotal = ownRecords.reduce((s, r) => s + (r.amount || 0), 0)
  const subTotal = subRecords.reduce((s, r) => s + (r.amount || 0), 0)

  return (
    <div style={{ padding: '16px 24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <h2 style={{ margin: '0 0 16px 0' }}>{'\u56e2\u961f\u7ba1\u7406'}</h2>

      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px', minWidth: 200, background: '#fff', padding: '16px 24px', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <div style={{ color: '#999', fontSize: 14 }}>{'\u6211\u7684\u8bb0\u5f55'}</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', marginTop: 4 }}>{ownRecords.length} {'\u6761'}</div>
          <div style={{ color: '#1890ff', fontSize: 16, marginTop: 2 }}>{'\u00a5'}{ownTotal.toFixed(2)}</div>
        </div>
        <div style={{ flex: '1 1 200px', minWidth: 200, background: '#fff', padding: '16px 24px', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <div style={{ color: '#999', fontSize: 14 }}>{'\u56e2\u961f\u8bb0\u5f55'}</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', marginTop: 4 }}>{subRecords.length} {'\u6761'}</div>
          <div style={{ color: '#52c41a', fontSize: 16, marginTop: 2 }}>{'\u00a5'}{subTotal.toFixed(2)}</div>
        </div>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={records}
        loading={loading}
        pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => '\u5171 ' + t + ' \u6761' }}
        scroll={{ x: 'max-content' }}
        size="middle"
        locale={{ emptyText: <Empty description={'\u6682\u65e0\u56e2\u961f\u8bb0\u5f55'} /> }}
      />
    </div>
  )
}
