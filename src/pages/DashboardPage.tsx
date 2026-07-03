import { useState, useEffect, useRef } from 'react'
import { Table, Card, Statistic, Row, Col, Tag, Empty, Spin } from 'antd'
import { TeamOutlined, ShoppingCartOutlined, DollarOutlined, CalendarOutlined } from '@ant-design/icons'
import { Column } from '@ant-design/charts'
import dayjs from 'dayjs'

const SUPABASE_URL = 'https://mxywcwjiltmhyiueatfu.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14eXdjd2ppbHRtaHlpdWVhdGZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MDI1MzYsImV4cCI6MjA5ODQ3ODUzNn0.K2J9Aw0jJSGipOgjjGx7CHK8-iQ-SCzS5JSxOMRxpW8'

interface UserInfo {
  id: string
  username: string
  role: string
  parent_id: string | null
}

interface RecordInfo {
  id: string
  customer_name: string
  amount: number
  record_date: string
  user_id: string
}

interface TeamStats {
  agentId: string
  agentName: string
  memberCount: number
  orderCount: number
  totalAmount: number
}

interface MemberStats {
  userId: string
  username: string
  orderCount: number
  totalAmount: number
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserInfo[]>([])
  const [records, setRecords] = useState<RecordInfo[]>([])
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true

    const loadData = async () => {
      try {
        const token = localStorage.getItem('access_token')
        const headers: {[key: string]: string} = {
          'apikey': SUPABASE_ANON_KEY,
          ...(token ? { 'Authorization': 'Bearer ' + token } : {}),
        }

        const [usersRes, recordsRes] = await Promise.all([
          fetch(SUPABASE_URL + '/rest/v1/users?select=id,username,role,parent_id', { headers }),
          fetch(SUPABASE_URL + '/rest/v1/records?select=id,amount,record_date,user_id', { headers }),
        ])

        if (!mountedRef.current) return

        if (usersRes.ok) {
          const u = await usersRes.json()
          setUsers(u)
        }
        if (recordsRes.ok) {
          const r = await recordsRes.json()
          setRecords(r)
        }
      } catch (e) {
        console.error('Dashboard load error:', e)
      } finally {
        if (mountedRef.current) setLoading(false)
      }
    }

    loadData()
    return () => { mountedRef.current = false }
  }, [])

  // Build user name map
  const userNameMap: {[key: string]: string} = {}
  users.forEach(u => { userNameMap[u.id] = u.username })

  // Get agent_1 list
  const agent1List = users.filter(u => u.role === 'agent_1')

  // Stats
  const totalCount = records.length
  const totalAmount = records.reduce((s, r) => s + (r.amount || 0), 0)
  const monthStart = dayjs().startOf('month').format('YYYY-MM-DD')
  const monthCount = records.filter(r => r.record_date >= monthStart).length

  // Team stats: group records by agent_1
  const teamStats: TeamStats[] = agent1List.map(a => {
    const memberIds = [a.id, ...users.filter(u => u.parent_id === a.id).map(u => u.id)]
    const teamRecords = records.filter(r => memberIds.includes(r.user_id))
    return {
      agentId: a.id,
      agentName: a.username,
      memberCount: memberIds.length,
      orderCount: teamRecords.length,
      totalAmount: teamRecords.reduce((s, r) => s + (r.amount || 0), 0),
    }
  }).sort((a, b) => b.totalAmount - a.totalAmount)

  // Member stats for expanded rows
  const getMemberStats = (agentId: string): MemberStats[] => {
    const memberIds = users.filter(u => u.parent_id === agentId).map(u => u.id)
    const allIds = [agentId, ...memberIds]
    return allIds.map(uid => {
      const memberRecords = records.filter(r => r.user_id === uid)
      return {
        userId: uid,
        username: userNameMap[uid] || uid,
        orderCount: memberRecords.length,
        totalAmount: memberRecords.reduce((s, r) => s + (r.amount || 0), 0),
      }
    })
  }

  // Chart data
  const chartData = teamStats
    .filter(t => t.totalAmount > 0)
    .map(t => ({
      agent: t.agentName,
      amount: t.totalAmount,
    }))

  // Expanded row columns
  const expandedColumns = [
    { title: '\u6210\u5458', dataIndex: 'username', width: 120 },
    { title: '\u8ba2\u5355\u6570', dataIndex: 'orderCount', width: 100 },
    { title: '\u91d1\u989d', dataIndex: 'totalAmount', width: 150, render: (v: number) => v.toFixed(2) },
  ]

  // Main table columns
  const columns = [
    { title: '\u6392\u540d', key: 'rank', width: 80, render: (_: any, __: any, i: number) => i + 1 },
    { title: '\u4e00\u7ea7\u4ee3\u7406', dataIndex: 'agentName', width: 120 },
    { title: '\u56e2\u961f\u4eba\u6570', dataIndex: 'memberCount', width: 100 },
    { title: '\u603b\u8ba2\u5355\u6570', dataIndex: 'orderCount', width: 100 },
    { title: '\u603b\u91d1\u989d', dataIndex: 'totalAmount', width: 150, render: (v: number) => v.toFixed(2) },
  ]

  return (
    <div style={{ padding: '16px 24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <h2 style={{ margin: '0 0 16px 0' }}>{'\u56e2\u961f\u4e1a\u7ee9\u770b\u677f'}</h2>

      <Spin spinning={loading}>
        {/* Stats cards */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card size="small" style={{ borderRadius: 8 }}>
              <Statistic
                title={'\u4e00\u7ea7\u4ee3\u7406\u603b\u6570'}
                value={agent1List.length}
                prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ borderRadius: 8 }}>
              <Statistic
                title={'\u603b\u8ba2\u5355\u6570'}
                value={totalCount}
                prefix={<ShoppingCartOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ borderRadius: 8 }}>
              <Statistic
                title={'\u603b\u91d1\u989d'}
                value={totalAmount}
                precision={2}
                prefix={<DollarOutlined style={{ color: '#fa8c16' }} />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ borderRadius: 8 }}>
              <Statistic
                title={'\u672c\u6708\u65b0\u589e'}
                value={monthCount}
                prefix={<CalendarOutlined style={{ color: '#722ed1' }} />}
                valueStyle={{ color: '#722ed1' }}
                suffix={'\u6761'}
              />
            </Card>
          </Col>
        </Row>

        {/* Ranking table */}
        <Card title={'\u56e2\u961f\u4e1a\u7ee9\u6392\u884c'} style={{ marginBottom: 24, borderRadius: 8 }}>
          <Table
            rowKey="agentId"
            columns={columns}
            dataSource={teamStats}
            pagination={false}
            size="middle"
            expandable={{
              expandedRowRender: (record) => (
                <Table
                  rowKey="userId"
                  columns={expandedColumns}
                  dataSource={getMemberStats(record.agentId)}
                  pagination={false}
                  size="small"
                  locale={{ emptyText: '\u6682\u65e0\u6570\u636e' }}
                />
              ),
            }}
          />
        </Card>

        {/* Chart */}
        {chartData.length > 0 && (
          <Card title={'\u5404\u56e2\u961f\u4e1a\u7ee9\u5bf9\u6bd4'} style={{ borderRadius: 8 }}>
            <Column
              data={chartData}
              xField="agent"
              yField="amount"
              label={{
                text: (d: any) => '\uffe5' + (d.amount / 10000).toFixed(1) + '\u4e07',
                textBaseline: 'bottom',
              }}
              columnStyle={{ radius: [4, 4, 0, 0] }}
              color="#1890ff"
              height={300}
            />
          </Card>
        )}
      </Spin>
    </div>
  )
}
