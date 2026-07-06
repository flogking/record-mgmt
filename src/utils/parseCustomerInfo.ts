export interface ParseResult {
  name: string
  phone: string
  address: string
}

export function parseCustomerInfo(text: string): ParseResult {
  const result: ParseResult = { name: '', phone: '', address: '' }
  if (!text.trim()) return result

  let remaining = text.trim()

  const phoneRegex = /(\+86[-\s]?)?1[3-9]\d{9}/
  const phoneMatch = remaining.match(phoneRegex)
  if (phoneMatch) {
    result.phone = phoneMatch[0].replace(/\+86[-\s]?/, '').trim()
    remaining = remaining.replace(phoneMatch[0], ' ')
  }

  const addressPattern = /[^，,、\s]*(?:省|市|区|县|镇|乡|路|街|道|号|栋|单元|室|村|组|小区|花园|大厦|广场|巷|弄|号院|号楼).*/
  const addressMatch = remaining.match(addressPattern)
  if (addressMatch) {
    result.address = addressMatch[0].trim()
    remaining = remaining.replace(addressMatch[0], ' ')
  }

  result.name = remaining.replace(/[，,、\s]+/g, '').trim()

  return result
}
