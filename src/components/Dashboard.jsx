import React, { useMemo } from 'react'
import { collection, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import { useFirestoreLive } from '../hooks/useFirestoreLive'

export default function Dashboard({ companyId }){
  const q = query(collection(db,'books',companyId,'vouchers'), orderBy('date','desc'))
  const rows = useFirestoreLive(q)

  const totals = useMemo(()=>{
    let purchases=0, sales=0
    rows.forEach(v => {
      const amt = (v.inventoryLines||[]).reduce((s,l)=>s+Number(l.amount||0),0)
      if(v.type==='Purchase') purchases+=amt
      if(v.type==='Sales') sales+=amt
    })
    const profitApprox = sales - (rows.filter(v=>v.type==='Sales').reduce((s,v)=>{
      return s + (v.lines||[]).filter(l=>l.accountCode==='5000').reduce((ss,l)=>ss+Number(l.debit||0),0)
    },0))
    return { purchases, sales, profitApprox }
  },[rows])

  return (
    <div style={{display:'flex', gap:12}}>
      <div style={{padding:12, border:'1px solid #eee', borderRadius:12, minWidth:180}}>
        <div style={{fontSize:12, color:'#666'}}>Purchases</div>
        <div style={{fontSize:20, fontWeight:700}}>{totals.purchases.toLocaleString('en-IN')}</div>
      </div>
      <div style={{padding:12, border:'1px solid #eee', borderRadius:12, minWidth:180}}>
        <div style={{fontSize:12, color:'#666'}}>Sales</div>
        <div style={{fontSize:20, fontWeight:700}}>{totals.sales.toLocaleString('en-IN')}</div>
      </div>
      <div style={{padding:12, border:'1px solid #eee', borderRadius:12, minWidth:220}}>
        <div style={{fontSize:12, color:'#666'}}>Approx. Profit</div>
        <div style={{fontSize:20, fontWeight:700}}>{totals.profitApprox.toLocaleString('en-IN')}</div>
      </div>
    </div>
  )
}