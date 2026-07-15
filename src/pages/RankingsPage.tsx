import { useState, useEffect } from 'react'
import { Table, Tabs, Empty, Spin, Tag, Typography } from 'antd'
import { TrophyOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { getUser } from '../services/authService'
import { SUPABASE_URL, SUPABASE_ANON_KEY, authHeaders, authFetchWithTimeout } from '../utils/api'

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
const rankBadgeColors = ['#ffd700', '#c0c0c0', '#cd7f32']

function headers() { return authHeaders() }

async function fetchRankings(startISO: string, endISO: string): Promise<RankingItem[]> {
  const url = SUPABASE_URL
    + '/rest/v1/records?select=user_id,amount,users(username,role)'
    + '&users.role=eq.agent_2'
    + '&created_at=gte.' + startISO
    + '&created_at=lte.' + endISO

  const res = await authFetchWithTimeout(url, { headers: headers() })
  if (!res.ok) return []

  const data = await res.json()

  // Group by user_id
  const map: Record<string, { username: string; totalAmount: number; orderCount: number }> = {}
  for (const r of data) {
    const uid = r.user_id
    const uname = r.users?.username || '未知'
    if (!map[uid]) {
      map[uid] = { username: uname, totalAmount: 0, orderCount: 0 }
    }
    map[uid].totalAmount += r.amount || 0
    map[uid].orderCount += 1
  }

  // Sort by totalAmount desc, then orderCount desc
  const sorted = Object.entries(map)
    .map(([user_id, v]) => ({ user_id, ...v }))
    .sort((a, b) => b.totalAmount - a.totalAmount || b.orderCount - a.orderCount)
    .slice(0, 5)

  return sorted.map((item, idx) => ({
    key: item.user_id,
    rank: idx + 1,
    user_id: item.user_id,
    username: item.username,
    totalAmount: item.totalAmount,
    orderCount: item.orderCount,
  }))
}

function getTodayRange() {
  return {
    start: dayjs().startOf('day').toISOString(),
    end: dayjs().endOf('day').toISOString(),
  }
}

function getLastWeekRange() {
  return {
    start: dayjs().subtract(1, 'week').startOf('week').add(1, 'day').startOf('day').toISOString(),
    end: dayjs().subtract(1, 'week').endOf('week').add(1, 'day').endOf('day').toISOString(),
  }
}

function RankingTable({ data, loading }: { data: RankingItem[]; loading: boolean }) {
  const currentUser = getUser()
  const isAgent2 = currentUser?.role === 'agent_2'
  const isInTop5 = isAgent2 && data.some(d => d.user_id === currentUser.id)
  const isNotInTop5 = isAgent2 && !isInTop5 && data.length > 0

  const columns: ColumnsType<RankingItem> = [
    {
      title: '排名',
      dataIndex: 'rank',
      width: 70,
      render: (v: number) => v <= 3
        ? <span style={{ fontWeight: 700, color: v === 1 ? '#d4a017' : v === 2 ? '#888' : '#a0522d' }}>{v}</span>
        : v,
    },
    {
      title: '代理用户名',
      dataIndex: 'username',
      render: (v: string, record: RankingItem) => {
        const isMe = currentUser && record.user_id === currentUser.id
        return <>{v} {isMe && <Tag color="gold" style={{ marginLeft: 4 }}>我</Tag>}</>
      },
    },
    {
      title: '总金额',
      dataIndex: 'totalAmount',
      width: 120,
      render: (v: number) => v.toFixed(2),
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
          ? <Empty description="暂无数据" style={{ marginTop: 60 }} />
          : <Table
              columns={columns}
              dataSource={data}
              pagination={false}
              size="middle"
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
        <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 8 }}>仅展示前 5 名</Text>
      )}
      {isNotInTop5 && (
        <Text type="warning" style={{ display: 'block', textAlign: 'center', marginTop: 4 }}>
          您当前未进入前 5 名，再接再厉！
        </Text>
      )}
      <style>{`
        .rank-row-1 td { background: ${rankColors[0]} !important; }
        .rank-row-2 td { background: ${rankColors[1]} !important; }
        .rank-row-3 td { background: ${rankColors[2]} !important; }
      `}</style>
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
    {
      key: 'daily',
      label: '日榜',
      children: <RankingTable data={dailyData} loading={loading} />,
    },
    {
      key: 'weekly',
      label: '周榜',
      children: <RankingTable data={weeklyData} loading={loading} />,
    },
  ]

  return (
    <div style={{ padding: '16px 24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <h2 style={{ margin: '0 0 16px 0' }}><TrophyOutlined style={{ color: '#faad14', marginRight: 8 }} />二级代理排行榜</h2>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={items}
      />
    </div>
  )
}