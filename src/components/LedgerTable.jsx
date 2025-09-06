import React, { useMemo, useState } from 'react'
import { collection, deleteDoc, doc, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import { useFirestoreLive } from '../hooks/useFirestoreLive'

export default function LedgerTable({ companyId }){
  if (!companyId) return null

  const q = query(
    collection(db, 'books', companyId, 'vouchers'),
    orderBy('date','desc')
  )
  const rows = useFirestoreLive(q)
  const [search, setSearch] = useState('')

  const filtered = useMemo(()=>{
    const s = search.trim().toLowerCase()
    if(!s) return rows
    return rows.filter(r=> JSON.stringify(r).toLowerCase().includes(s))
  },[rows,search])

  async function remove(id){
    if(!confirm('Delete voucher?')) return
    await deleteDoc(doc(db,'books',companyId,'vouchers',id))
  }

  return (
    <div style={{border:'1px solid #eee', borderRadius:12}}>
      <div style={{display:'flex', alignItems:'center', padding:8, gap:8}}>
        <div style={{fontWeight:700}}>Vouchers</div>
        <input placeholder="Search all…" value={search} onChange={e=>setSearch(e.target.value)} style={{flex:1}}/>
      </div>
      <div style={{maxHeight:420, overflow:'auto', fontSize:14}}>
        <table width="100%" cellPadding="6">
          <thead style={{position:'sticky', top:0, background:'#fafafa'}}>
            <tr>
              <th align="left">Date</th>
              <th align="left">Type</th>
              <th align="left">Party</th>
              <th align="right">Amount</th>
              <th align="left">Status</th>
              <th align="left">Narration</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(v=>{
              const amt = (v.inventoryLines||[]).reduce((s,l)=>s+Number(l.amount||0),0)
              return (
                <tr key={v.id}>
                  <td>{(v.date?.toDate?.() || new Date(v.date)).toLocaleDateString('en-IN')}</td>
                  <td>{v.type}</td>
                  <td>{v.partyName||'-'}</td>
                  <td align="right">{amt.toLocaleString('en-IN')}</td>
                  <td>{v.status||'Pending'}</td>
                  <td>{v.narration||''}</td>
                  <td><button onClick={()=>remove(v.id)}>Delete</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
