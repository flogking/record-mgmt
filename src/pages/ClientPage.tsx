import { useState, useEffect, useRef } from 'react'
import { Table, Button, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { fetchRecords, createRecord, type RecordFormData } from '../services/recordService'
import { exportToExcel } from '../utils/exportExcel'
import type { Record } from '../types/record'
import RecordFormModal from '../components/RecordFormModal'

export default function ClientPage() {
  const [records, setRecords] = useState<Record[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const mountedRef = useRef(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await fetchRecords()
      if (mountedRef.current) setRecords(data)
    } catch (err: any) {
      if (mountedRef.current) message.error(err.message)
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }

  useEffect(() => {
    mountedRef.current = true
    loadData()
    return () => { mountedRef.current = false }
  }, [])

  const handleCreate = async (formData: RecordFormData) => {
    setSubmitting(true)
    try {
      await createRecord(formData)
      message.success('创建成功')
      setModalOpen(false)
      loadData()
    } catch (err: any) {
      message.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const columns: ColumnsType<Record> = [
    { title: '客户姓名', dataIndex: 'customer_name', width: 120 },
    { title: '业务', dataIndex: 'business_type', width: 80, render: (v: string | null) => v || '-' },
    { title: '产品', dataIndex: 'product', width: 120 },
    { title: '金额', dataIndex: 'amount', width: 100, render: (v: number) => v ? v.toFixed(2) : '-' },
    { title: '日期', dataIndex: 'record_date', width: 120 },
    { title: '快递地址', dataIndex: 'shipping_address', width: 180, ellipsis: true },
    { title: '时间', dataIndex: 'record_time', width: 100, render: (v: string) => v || '-' },
    { title: '快递单号', dataIndex: 'tracking_number', width: 150, render: (v: string | null) => v || '-' },
    { title: '备注', dataIndex: 'remark', width: 150, ellipsis: true, render: (v: string | null) => v || '-' },
    { title: '创建时间', dataIndex: 'created_at', width: 180, render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-' },
  ]

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

  const handleExport = () => {
    if (records.length === 0) {
      message.warning('暂无数据可导出')
      return
    }
    exportToExcel(records)
    message.success('导出成功')
  }

  return (
    <div style={{ padding: '16px 24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ margin: 0 }}>{'收单中心'}</h2>
        <Button type="primary" onClick={() => setModalOpen(true)}>{'新增记录'}</Button>
        {!isMobile && <Button type="primary" onClick={handleExport}>{'导出 Excel'}</Button>}
      </div>
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
        onCancel={() => setModalOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  )
}
