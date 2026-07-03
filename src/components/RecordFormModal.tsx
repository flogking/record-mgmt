import { useEffect } from 'react'
import { Modal, Form, Input, InputNumber, DatePicker, TimePicker, message } from 'antd'
import dayjs from 'dayjs'
import type { Record } from '../types/record'
import type { RecordFormData } from '../services/recordService'

interface Props {
  open: boolean
  onCancel: () => void
  onSubmit: (values: RecordFormData) => Promise<void>
  initialValues?: Record
}

export default function RecordFormModal({ open, onCancel, onSubmit, initialValues }: Props) {
  const [form] = Form.useForm()

  useEffect(() => {
    if (open) {
      if (initialValues) {
        form.setFieldsValue({
          customer_name: initialValues.customer_name,
          product: initialValues.product,
          amount: initialValues.amount,
          record_date: initialValues.record_date ? dayjs(initialValues.record_date) : null,
          shipping_address: initialValues.shipping_address,
          record_time: initialValues.record_time ? dayjs(initialValues.record_time, 'HH:mm:ss') : null,
          tracking_number: initialValues.tracking_number,
          remark: initialValues.remark,
        })
      } else {
        form.resetFields()
      }
    }
  }, [open, initialValues, form])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      const formData: RecordFormData = {
        customer_name: values.customer_name,
        product: values.product,
        amount: values.amount,
        record_date: values.record_date ? values.record_date.format('YYYY-MM-DD') : '',
        shipping_address: values.shipping_address,
        record_time: values.record_time ? values.record_time.format('HH:mm:ss') : '',
        tracking_number: values.tracking_number || null,
        remark: values.remark || null,
      }
      await onSubmit(formData)
      form.resetFields()
    } catch (err) {
      if (err instanceof Error) message.error(err.message)
    }
  }

  return (
    <Modal
      title={initialValues ? '编辑记录' : '新增记录'}
      open={open}
      onOk={handleOk}
      onCancel={() => { form.resetFields(); onCancel() }}
      destroyOnClose
      width={600}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item label='客户姓名' name='customer_name' rules={[{ required: true, message: '请输入客户姓名' }]}>
          <Input placeholder='请输入客户姓名' />
        </Form.Item>
        <Form.Item label='产品' name='product' rules={[{ required: true, message: '请输入产品' }]}>
          <Input placeholder='请输入产品' />
        </Form.Item>
        <Form.Item label='金额' name='amount' rules={[{ required: true, message: '请输入金额' }]}>
          <InputNumber placeholder='请输入金额' min={0} precision={2} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label='日期' name='record_date' rules={[{ required: true, message: '请选择日期' }]}>
          <DatePicker style={{ width: '100%' }} format='YYYY-MM-DD' />
        </Form.Item>
        <Form.Item label='快递地址' name='shipping_address' rules={[{ required: true, message: '请输入快递地址' }]}>
          <Input placeholder='请输入快递地址' />
        </Form.Item>
        <Form.Item label='时间' name='record_time' rules={[{ required: true, message: '请选择时间' }]}>
          <TimePicker style={{ width: '100%' }} format='HH:mm:ss' />
        </Form.Item>
        <Form.Item label='快递单号' name='tracking_number'>
          <Input placeholder='请输入快递单号（选填）' />
        </Form.Item>
        <Form.Item label='备注' name='remark'>
          <Input.TextArea rows={3} placeholder='请输入备注（选填）' />
        </Form.Item>
      </Form>
    </Modal>
  )
}
