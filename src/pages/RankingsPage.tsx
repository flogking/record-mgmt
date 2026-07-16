import { useState, useEffect } from 'react'
import { Table, Tabs, Empty, Spin, Tag, Typography } from 'antd'
import { TrophyOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { getUser } from '../services/authService'
import { SUPABASE_URL, authHeaders, authFetchWithTimeout } from '../utils/api'

const { Text } = Typography

interface RankingItem {
  key: string
  rank: number
  user_id: string
  username: string
  totalAmount: number
  orderCount: number
}

const rankColors = ['#fff8e1', '#f5f5f5', '#fff3e0']

function headers() { return authHeaders() }

async function fetchRankings(startISO: string, endISO: string): Promise<RankingItem[]> {
  const res = await authFetchWithTimeout(SUPABASE_URL + '/rest/v1/rpc/get_rankings', {
    method: 'POST',
    headers: { ...headers(), 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
    body: JSON.stringify({ start_time: startISO, end_time: endISO }),
  })
  if (!res.ok) return []
  const data = await res.json()
  return data.map((item: any, idx: number) => ({
    key: item.user_id,
    rank: idx + 1,
    user_id: item.user_id,
    username: item.username,
    totalAmount: parseFloat(item.total_amount) || 0,
    orderCount: parseInt(item.order_count) || 0,
  }))
}

function getTodayRange() {
  return {
    start: dayjs().startOf('day').format('YYYY-MM-DDTHH:mm:ssZ'),
    end: dayjs().endOf('day').format('YYYY-MM-DDTHH:mm:ssZ'),
  }
}

function getLastWeekRange() {
  return {
    start: dayjs().subtract(1, 'week').startOf('week').add(1, 'day').startOf('day').format('YYYY-MM-DDTHH:mm:ssZ'),
    end: dayjs().subtract(1, 'week').endOf('week').add(1, 'day').endOf('day').format('YYYY-MM-DDTHH:mm:ssZ'),
  }
}

function RankingTable({ data, loading }: { data: RankingItem[]; loading: boolean }) {
  const currentUser = getUser()
  const isInTop5 = currentUser && data.some(d => d.user_id === currentUser.id)
  const isNotInTop5 = currentUser?.role === 'agent_2' && !isInTop5 && data.length > 0

  const columns: ColumnsType<RankingItem> = [
    {
      title: '排名',
      dataIndex: 'rank',
      width: 70,
      render: (v: number) => v <= 3
        ? <span style={{ fontWeight: 700, color: v === 1 ? '#d4a017' : v === 2 ? '#888' : '#a0522d', fontSize: 16 }}>{v}</span>
        : v,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      render: (v: string, record: RankingItem) => {
        const isMe = currentUser && record.user_id === currentUser.id
        return <>{v} {isMe && <Tag color='gold' style={{ marginLeft: 4 }}>我</Tag>}</>
      },
    },
    {
      title: '总金额',
      dataIndex: 'totalAmount',
      width: 120,
      render: (v: number) => <span style={{ fontWeight: 600 }}>{v.toFixed(2)}</span>,
    },
    {
      title: '订单数',
      dataIndex: 'orderCount',
      width: 80,
    },
  ]

  return (
    <div>
      <Spin spinning={loading}>
        {data.length === 0
          ? <Empty description='暂无数据' style={{ marginTop: 60 }} />
          : <Table
              columns={columns}
              dataSource={data}
              pagination={false}
              size='middle'
              rowClassName={(record) => {
                const r = record.rank
                if (r <= 3) return 'rank-row-' + r
                return ''
              }}
              style={{ marginBottom: 8 }}
            />
        }
      </Spin>
      {data.length > 0 && (
        <Text type='secondary' style={{ display: 'block', textAlign: 'center', marginTop: 8 }}>仅展示前 5 名</Text>
      )}
      {isNotInTop5 && (
        <Text type='warning' style={{ display: 'block', textAlign: 'center', marginTop: 4 }}>
          您当前未进入前 5 名，再接再厉！
        </Text>
      )}
      <style>{`.rank-row-1 td { background: #fff8e1 !important; } .rank-row-2 td { background: #f5f5f5 !important; } .rank-row-3 td { background: #fff3e0 !important; }`}</style>
    </div>
  )
}

export default function RankingsPage() {
  const [activeTab, setActiveTab] = useState('daily')
  const [dailyData, setDailyData] = useState<RankingItem[]>([])
  const [weeklyData, setWeeklyData] = useState<RankingItem[]>([])
  const [loading, setLoading] = useState(false)

  const loadDaily = async () => {
    setLoading(true)
    try {
      const { start, end } = getTodayRange()
      setDailyData(await fetchRankings(start, end))
    } finally {
      setLoading(false)
    }
  }

  const loadWeekly = async () => {
    setLoading(true)
    try {
      const { start, end } = getLastWeekRange()
      setWeeklyData(await fetchRankings(start, end))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'daily') loadDaily()
    else loadWeekly()
  }, [activeTab])

  const items = [
    { key: 'daily', label: '日榜', children: <RankingTable data={dailyData} loading={loading} /> },
    { key: 'weekly', label: '周榜', children: <RankingTable data={weeklyData} loading={loading} /> },
  ]

  return (
    <div style={{ padding: '16px 24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <h2 style={{ margin: '0 0 16px 0' }}><TrophyOutlined style={{ color: '#faad14', marginRight: 8 }} />排行榜</h2>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={items} />
    </div>
  )
}