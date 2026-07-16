import { useState, useEffect } from 'react'
import { Modal, Form, Input, DatePicker, TimePicker, InputNumber, Button, Divider, Select, message } from 'antd'
import dayjs from 'dayjs'
import type { Record } from '../types/record'
import type { RecordFormData } from '../services/recordService'
import { parseCustomerInfo } from '../utils/parseCustomerInfo'

interface Props {
  open: boolean
  onCancel: () => void
  onSubmit: (data: RecordFormData) => void
  initialValues?: Record
  submitting?: boolean
}

export default function RecordFormModal({ open, onCancel, onSubmit, initialValues, submitting }: Props) {
  const [form] = Form.useForm()
  const [parseText, setParseText] = useState('')
  const businessType = Form.useWatch('business_type', form)
  const isRenewal = businessType === '续费'

  useEffect(() => {
    if (open) {
      if (initialValues) {
        form.setFieldsValue({
          customer_name: initialValues.customer_name,
          product: initialValues.product,
          amount: initialValues.amount,
          record_date: initialValues.record_date ? dayjs(initialValues.record_date) : null,
          shipping_address: initialValues.shipping_address,
          record_time: initialValues.record_time ? dayjs(initialValues.record_time, 'HH:mm') : null,
          tracking_number: initialValues.tracking_number || '',
          phone: initialValues.phone || '',
          business_type: initialValues.business_type || undefined,
          remark: initialValues.remark || '',
        })
      } else {
        form.resetFields()
        form.setFieldsValue({
          record_date: dayjs(),
        })
      }
      setParseText('')
    }
  }, [open, initialValues])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      const formData: RecordFormData = {
        customer_name: values.customer_name,
        product: values.product,
        amount: values.amount,
        record_date: values.record_date.format('YYYY-MM-DD'),
        shipping_address: isRenewal ? null : (values.shipping_address || null),
        record_time: values.record_time ? values.record_time.format('HH:mm') : null,
        tracking_number: isRenewal ? null : (values.tracking_number || null),
        phone: isRenewal ? null : (values.phone || null),
        business_type: values.business_type || null,
        remark: values.remark || null,
      }
      onSubmit(formData)
    } catch {
      // validation failed
    }
  }

  const handleParse = () => {
    if (!parseText.trim()) {
      message.warning('请先粘贴客户信息')
      return
    }
    const result = parseCustomerInfo(parseText)
    const updates: any = {}
    if (result.name) updates.customer_name = result.name
    if (result.phone) updates.phone = result.phone
    if (result.address) updates.shipping_address = result.address
    if (Object.keys(updates).length > 0) {
      form.setFieldsValue(updates)
      message.success('识别成功')
    } else {
      message.warning('未能识别出有效信息')
    }
  }

  const isEdit = !!initialValues

  return (
    <Modal
      title={isEdit ? '编辑记录' : '新增记录'}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={submitting}
      destroyOnClose
      width={600}
    >
      {!isEdit && (
        <>
          <div style={{ marginBottom: 12 }}>
            <Input.TextArea
              rows={3}
              placeholder="粘贴客户信息到这里..."
              value={parseText}
              onChange={(e) => setParseText(e.target.value)}
            />
            <Button type="primary" style={{ marginTop: 8 }} onClick={handleParse}>
              识别并填充
            </Button>
          </div>
          <Divider />
        </>
      )}

      <Form form={form} layout="vertical">
        <Form.Item label="客户姓名" name="customer_name" rules={[{ required: true, message: '请输入客户姓名' }]}>
          <Input placeholder="请输入客户姓名" />
        </Form.Item>
        <Form.Item label="业务" name="business_type">
          <Select placeholder="请选择业务类型" allowClear>
            <Select.Option value="办卡">办卡</Select.Option>
            <Select.Option value="续费">续费</Select.Option>
          </Select>
        </Form.Item>
        {!isRenewal && (
        <Form.Item label="联系电话" name="phone">
          <Input placeholder="请输入联系电话" />
        </Form.Item>
        )}
        <Form.Item label="产品号码" name="product" rules={[{ required: true, message: '请输入产品号码' }]}>
          <Input placeholder="请输入产品名称" />
        </Form.Item>
        <Form.Item label="金额" name="amount" rules={[{ required: true, message: '请输入金额' }]}>
          <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="请输入金额" />
        </Form.Item>
        <Form.Item label="日期" name="record_date" rules={[{ required: true, message: '请选择日期' }]}>
          <DatePicker style={{ width: '100%' }} placeholder="请选择日期" />
        </Form.Item>
        <Form.Item label="时间" name="record_time">
          <TimePicker style={{ width: '100%' }} format="HH:mm" placeholder="请选择时间" />
        </Form.Item>
        {!isRenewal && (
        <Form.Item label="快递地址" name="shipping_address">
          <Input.TextArea rows={3} placeholder="请输入快递地址" />
        </Form.Item>
        )}
        {!isRenewal && (
        <Form.Item label="快递单号" name="tracking_number">
          <Input placeholder="请输入快递单号（选填）" />
        </Form.Item>
        )}
        <Form.Item label="备注" name="remark">
          <Input.TextArea rows={2} placeholder="请输入备注（选填）" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
