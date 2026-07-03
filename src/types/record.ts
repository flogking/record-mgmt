export interface Record {
  id: string
  customer_name: string
  product: string
  amount: number
  record_date: string
  shipping_address: string
  record_time: string
  tracking_number: string | null
  remark: string | null
  user_id: string
  created_at: string
}