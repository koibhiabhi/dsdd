import React, { useMemo, useState } from 'react'
import { collection, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import { useFirestoreLive } from '../hooks/useFirestoreLive'
import { balance } from '../lib/accounting'

export default function PartyLedger({ companyId }){
  const [party, setParty] = useState('')

  if (!companyId) return null

  const q = query(
    collection(db,'books',companyId,'vouchers'),
    orderBy('date','asc')
  )
  const rows = useFirestoreLive(q)

  const parties = useMemo(()=>{
    const set = new Set()
    rows.forEach(r => r.partyName && set.add(r.partyName))
    return Array.from(set).sort()
  },[rows])

  const partyRows = useMemo(()=>{
    if(!party) return []
    return rows.filter(r => (r.partyName||'') === party)
  },[rows,party])

  const partyBalance = useMemo(()=>{
    const postings = []
    partyRows.forEach(v => {
      (v.lines||[]).forEach(l => {
        if(l.party === party && (l.accountCode==='1100' || l.accountCode==='2000')){
          postings.push({ debit: Number(l.debit||0), credit: Number(l.credit||0) })
        }
      })
    })
    return balance(postings)
  },[partyRows, party])

  return (
    <div style={{border:'1px solid #ddd', borderRadius:12, padding:12}}>
      <div style={{display:'flex', gap:8, alignItems:'center'}}>
        <div style={{fontWeight:700}}>Party Ledger</div>
        <select value={party} onChange={e=>setParty(e.target.value)}>
          <option value="">-- choose party --</option>
          {parties.map(p => <option key={p}>{p}</option>)}
        </select>
        {party && <div>Balance (Dr-Cr): <b>{partyBalance.toLocaleString('en-IN')}</b></div>}
      </div>

      {party && (
        <div style={{maxHeight:260, overflow:'auto', marginTop:8}}>
          <table width="100%" cellPadding="6">
            <thead>
              <tr><th align="left">Date</th><th>Type</th><th align="right">Debit</th><th align="right">Credit</th><th align="left">Narration</th></tr>
            </thead>
            <tbody>
              {partyRows.map(v => {
                const dr = v.lines?.filter(l=>l.party===party).reduce((s,l)=>s+Number(l.debit||0),0) || 0
                const cr = v.lines?.filter(l=>l.party===party).reduce((s,l)=>s+Number(l.credit||0),0) || 0
                return (
                  <tr key={v.id}>
                    <td>{(v.date?.toDate?.() || new Date(v.date)).toLocaleDateString('en-IN')}</td>
                    <td>{v.type}</td>
                    <td align="right">{dr?dr.toLocaleString('en-IN'):''}</td>
                    <td align="right">{cr?cr.toLocaleString('en-IN'):''}</td>
                    <td>{v.narration||''}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
