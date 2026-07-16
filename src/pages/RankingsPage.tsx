import { useState, useEffect } from 'react'
import { Tabs, Empty, Spin, Tag, Typography, Button, Modal } from 'antd'
import { TrophyOutlined, EyeOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { getUser } from '../services/authService'
import { SUPABASE_URL, authHeaders, authFetchWithTimeout } from '../utils/api'
import { getRankStyle, getRandomQuote } from '../utils/rankingConstants'

const { Text } = Typography

interface RankingItem {
  key: string
  rank: number
  user_id: string
  username: string
  totalAmount: number
  orderCount: number
}

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

function RankCard({ item, quote }: { item: RankingItem; quote: string }) {
  const currentUser = getUser()
  const isMe = currentUser && item.user_id === currentUser.id
  const style = getRankStyle(item.rank)

  return (
    <div
      style={{
        background: style.bg,
        color: style.textColor,
        border: style.border || 'none',
        borderRadius: 12,
        padding: '16px 20px',
        marginBottom: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        position: 'relative',
        overflow: 'hidden',
      }}
      className={item.rank <= 3 ? 'glow-card' : ''}
    >
      {/* 排名徽章 */}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: item.rank <= 3 ? 'rgba(255,255,255,0.9)' : '#f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          fontWeight: 700,
          flexShrink: 0,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        {item.rank}
      </div>

      {/* 左侧信息 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 2 }}>
          {style.emoji} {style.title}
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          {item.username}
          {isMe && <Tag color="gold" size="small">我</Tag>}
        </div>
        <div style={{ fontSize: 13, opacity: 0.7, marginTop: 2 }}>
          {item.orderCount} 单战绩
        </div>
      </div>

      {/* 右侧金额 + 文案 */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>
          ¥{item.totalAmount.toFixed(2)}
        </div>
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4, maxWidth: 160 }}>
          {quote}
        </div>
      </div>
    </div>
  )
}

function RankingsList({ data, loading }: { data: RankingItem[]; loading: boolean }) {
  const currentUser = getUser()
  const isInTop5 = currentUser && data.some(d => d.user_id === currentUser.id)
  const isNotInTop5 = currentUser?.role === 'agent_2' && !isInTop5 && data.length > 0
  const [gapModalOpen, setGapModalOpen] = useState(false)

  // 为每个卡片生成随机文案（固定本次渲染）
  const quotes = data.map(() => getRandomQuote())

  // 计算差距
  const fifthItem = data[4]
  const myItem = currentUser ? data.find(d => d.user_id === currentUser.id) : undefined
  const amountGap = fifthItem && myItem ? fifthItem.totalAmount - myItem.totalAmount : 0
  const orderGap = fifthItem && myItem ? fifthItem.orderCount - myItem.orderCount : 0

  return (
    <div>
      <Spin spinning={loading}>
        {data.length === 0 ? (
          <Empty description="暂无数据" style={{ marginTop: 60 }} />
        ) : (
          <>
            {data.map((item, idx) => (
              <RankCard key={item.key} item={item} quote={quotes[idx]} />
            ))}
          </>
        )}
      </Spin>

      {isNotInTop5 && fifthItem && (
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            padding: '16px 20px',
            marginTop: 16,
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
            😤 你距离第 5 名还差 ¥{amountGap.toFixed(2)}
          </div>
          <div style={{ fontSize: 14, color: '#666', marginBottom: 12 }}>
            💪 再努力一把，明天销管榜必有你一席之地！
          </div>
          <Button type="primary" icon={<EyeOutlined />} onClick={() => setGapModalOpen(true)}>
            查看差距
          </Button>
        </div>
      )}

      {/* 差距弹窗 */}
      <Modal
        title="📊 差距分析"
        open={gapModalOpen}
        onOk={() => setGapModalOpen(false)}
        onCancel={() => setGapModalOpen(false)}
        okText="知道了，冲！"
        cancelText="关闭"
      >
        {fifthItem && myItem && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 16, marginBottom: 16 }}>
              你和第 5 名 <strong>{fifthItem.username}</strong> 的差距：
            </div>
            <div style={{ fontSize: 18, color: '#ff4d4f', fontWeight: 600, marginBottom: 8 }}>
              💰 金额：还差 ¥{amountGap.toFixed(2)}
            </div>
            <div style={{ fontSize: 18, color: '#1890ff', fontWeight: 600, marginBottom: 16 }}>
              📦 订单：还差 {orderGap} 单
            </div>
            <div style={{ fontSize: 14, color: '#666', background: '#f6ffed', padding: 12, borderRadius: 8 }}>
              🚀 加油！每多一单，离榜更进一步！
            </div>
          </div>
        )}
      </Modal>

      <style>{`
        @keyframes glow {
          0%, 100% { box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
          50% { box-shadow: 0 4px 20px rgba(255, 193, 7, 0.3); }
        }
        .glow-card {
          animation: glow 2s ease-in-out infinite;
        }
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
    { key: 'daily', label: '🚀 今日销管', children: <RankingsList data={dailyData} loading={loading} /> },
    { key: 'weekly', label: '🔥 上周销管', children: <RankingsList data={weeklyData} loading={loading} /> },
  ]

  return (
    <div style={{ padding: '16px 24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <h2 style={{ margin: '0 0 16px 0', fontSize: 20 }}>
        <TrophyOutlined style={{ color: '#faad14', marginRight: 8 }} />🏆 销管榜
      </h2>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={items} />
    </div>
  )
}
