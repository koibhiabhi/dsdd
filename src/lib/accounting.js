export const ACCOUNT_TYPES = ['Asset','Liability','Income','Expense','Equity']

export function balance(rows){
  // Debit - Credit convention
  let dr = 0, cr = 0
  for(const r of rows){
    dr += Number(r.debit || 0)
    cr += Number(r.credit || 0)
  }
  return dr - cr
}

export function statusFromAllocations(invoiceTotal, allocated){
  const p = Number(allocated||0)
  const t = Number(invoiceTotal||0)
  if(p <= 0) return 'Pending'
  if(p < t) return 'Partially Paid'
  return 'Paid'
}