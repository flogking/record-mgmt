import { useState, useEffect, useRef } from 'react'
import { Table, Button, Space, Modal, message, Empty, Form, Input } from 'antd'
import { PlusOutlined, EyeOutlined, DeleteOutlined, FileOutlined, FilePdfOutlined, PictureOutlined, FileTextOutlined, TableOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { fetchFiles, createFileRecord, deleteFileRecord, uploadFileToStorage } from '../services/fileService'
import type { FileRecord } from '../services/fileService'
import { fetchUsers } from '../services/userService'

interface Props {
  user: {
    id: string
    username: string
    role: string
  }
}

export default function FileCenterPage({ user }: Props) {
  const [files, setFiles] = useState<FileRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [uploading, setUploading] = useState(false)
  const [userNames, setUserNames] = useState<{[key: string]: string}>({})
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    loadData()
    loadUserNames()
    return () => { mountedRef.current = false }
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await fetchFiles()
      if (mountedRef.current) setFiles(data)
    } catch (err: any) {
      if (mountedRef.current) message.error(err.message)
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }

  const loadUserNames = async () => {
    try {
      const users = await fetchUsers()
      const names: {[key: string]: string} = {}
      users.forEach((u: any) => { names[u.id] = u.username })
      if (mountedRef.current) setUserNames(names)
    } catch { /* silent */ }
  }

  const handleUpload = async (values: any) => {
    if (!selectedFile) {
      message.error('请选择文件')
      return
    }
    setUploading(true)
    try {
      const ext = selectedFile.name.split('.').pop() || 'bin'
      const filename = Date.now() + '_' + Math.random().toString(36).slice(2, 10) + '.' + ext
      const fileUrl = await uploadFileToStorage(selectedFile, filename)
      await createFileRecord({
        title: values.title,
        description: values.description || null,
        file_url: fileUrl,
        file_type: selectedFile.type || selectedFile.name.split('.').pop() || null,
        uploaded_by: user.id,
      })
      message.success('上传成功')
      setUploadModalOpen(false)
      form.resetFields()
      setSelectedFile(null)
      loadData()
    } catch (err: any) {
      message.error(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteFileRecord(id)
      message.success('删除成功')
      loadData()
    } catch (err: any) {
      message.error(err.message)
    }
  }

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <FileOutlined style={{ fontSize: 32, color: '#8c8c8c' }} />
    const type = fileType.toLowerCase()
    if (type.includes('pdf')) return <FilePdfOutlined style={{ fontSize: 32, color: '#ff4d4f' }} />
    if (type.includes('image') || ['jpg','jpeg','png','gif','webp'].includes(type)) return <PictureOutlined style={{ fontSize: 32, color: '#1890ff' }} />
    if (type.includes('word') || type.includes('doc')) return <FileTextOutlined style={{ fontSize: 32, color: '#2f54eb' }} />
    if (type.includes('excel') || type.includes('sheet') || ['xls','xlsx','csv'].includes(type)) return <TableOutlined style={{ fontSize: 32, color: '#52c41a' }} />
    return <FileOutlined style={{ fontSize: 32, color: '#8c8c8c' }} />
  }

  const columns: ColumnsType<FileRecord> = [
    {
      title: '文件',
      dataIndex: 'title',
      render: (_: any, record: FileRecord) => (
        <Space align="start">
          {getFileIcon(record.file_type)}
          <div>
            <div style={{ fontWeight: 500 }}>{record.title}</div>
            {record.description && <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.description}</div>}
          </div>
        </Space>
      ),
    },
    {
      title: '上传人',
      dataIndex: 'uploaded_by',
      width: 120,
      render: (v: string) => userNames[v] || v,
    },
    {
      title: '上传时间',
      dataIndex: 'created_at',
      width: 180,
      render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: FileRecord) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => window.open(record.file_url, '_blank')}>
            查看
          </Button>
          {user.role === 'director' && (
            <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => {
              Modal.confirm({
                title: '确认删除',
                content: '确定要删除文件 "' + record.title + '" 吗？',
                onOk: () => handleDelete(record.id),
              })
            }}>
              删除
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: '16px 24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ margin: 0 }}>资料中心</h2>
        {user.role === 'director' && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setUploadModalOpen(true)}>
            上传文件
          </Button>
        )}
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={files}
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t: number) => '共 ' + t + ' 条' }}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: <Empty description="暂无文件" /> }}
        size="middle"
      />

      <Modal
        title="上传文件"
        open={uploadModalOpen}
        onCancel={() => { setUploadModalOpen(false); form.resetFields(); setSelectedFile(null) }}
        onOk={() => form.submit()}
        confirmLoading={uploading}
      >
        <Form form={form} onFinish={handleUpload} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入文件标题" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea placeholder="请输入文件描述（可选）" rows={3} />
          </Form.Item>
          <Form.Item label="文件" required>
            <Input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
