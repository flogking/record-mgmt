export interface ExportRecord {
  customer_name: string
  phone: string | null
  business_type: string | null
  product: string
  amount: number
  record_date: string
  shipping_address: string
  tracking_number: string | null
  remark: string | null
  created_at: string
  creator_name?: string
}

export async function exportToExcel(records: ExportRecord[], fileName = '收单记录.xlsx') {
  if (!records || records.length === 0) return
  const XLSX = await import('xlsx')

  const data = records.map(r => ({
    '客户姓名': r.customer_name,
    '联系电话': r.phone || '',
    '业务': r.business_type || '',
    '产品号码': r.product,
    '金额': r.amount,
    '日期': r.record_date,
    '快递地址': r.shipping_address,
    '快递单号': r.tracking_number || '',
    '备注': r.remark || '',
    '创建人': r.creator_name || '',
    '创建时间': r.created_at,
  }))

  const sheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, '收单记录')
  XLSX.writeFile(workbook, fileName)
}
