import React, { useMemo, useState } from 'react'
import { db } from '../firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

export default function LedgerEntryForm({ companyId }){
  const [type, setType] = useState('Purchase')
  const [party, setParty] = useState('')
  const [material, setMaterial] = useState('')
  const [qty, setQty] = useState('')
  const [rate, setRate] = useState('')
  const [amount, setAmount] = useState('')
  const [narration, setNarration] = useState('')

  const computedAmount = useMemo(()=>{
    const q = Number(qty||0), r = Number(rate||0)
    return q*r
  },[qty,rate])

  async function save(){
    const v = {
      type,
      date: new Date(),
      partyName: party || '',
      narration: narration || '',
      inventoryLines: material ? [{
        materialId: material, qtyBags: Number(qty||0), ratePerBag: rate?Number(rate):null,
        amount: amount?Number(amount):Number(computedAmount||0)
      }] : [],
      lines: [],
      createdAt: serverTimestamp(),
      status: 'Pending',
    }
    const amt = v.inventoryLines[0]?.amount || 0
    if(type==='Purchase'){
      v.lines.push({ accountCode:'1000', accountName:'Inventory', debit: amt, credit: 0 })
      v.lines.push({ accountCode:'2000', accountName:'Accounts Payable', debit: 0, credit: amt, party: v.partyName })
    }else if(type==='Sales'){
      v.lines.push({ accountCode:'1100', accountName:'Accounts Receivable', debit: amt, credit: 0, party: v.partyName })
      v.lines.push({ accountCode:'4000', accountName:'Sales', debit: 0, credit: amt })
    }else if(type==='Receipt'){
      v.lines.push({ accountCode:'1200', accountName:'Cash', debit: amt, credit: 0 })
      v.lines.push({ accountCode:'1100', accountName:'Accounts Receivable', debit: 0, credit: amt, party: v.partyName })
    }else if(type==='Payment'){
      v.lines.push({ accountCode:'2000', accountName:'Accounts Payable', debit: amt, credit: 0, party: v.partyName })
      v.lines.push({ accountCode:'1200', accountName:'Cash', debit: 0, credit: amt })
    }
    await addDoc(collection(db,'books',companyId,'vouchers'), v)
    alert('Saved.')
    setParty(''); setMaterial(''); setQty(''); setRate(''); setAmount(''); setNarration('')
  }

  return (
    <div style={{border:'1px solid #ddd', borderRadius:12, padding:12}}>
      <div style={{fontWeight:700, marginBottom:8}}>New Voucher</div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
        <label>Type
          <select value={type} onChange={e=>setType(e.target.value)}>
            <option>Purchase</option>
            <option>Sales</option>
            <option>Receipt</option>
            <option>Payment</option>
            <option>Journal</option>
          </select>
        </label>
        <label>Party
          <input value={party} onChange={e=>setParty(e.target.value)} placeholder="Supplier/Customer"/>
        </label>
        <label>Material
          <input value={material} onChange={e=>setMaterial(e.target.value)} placeholder="materialId (optional)"/>
        </label>
        <label>Qty (bags)
          <input value={qty} onChange={e=>setQty(e.target.value)} type="number" step="0.01"/>
        </label>
        <label>Rate / bag
          <input value={rate} onChange={e=>setRate(e.target.value)} type="number" step="0.01"/>
        </label>
        <label>Amount
          <input value={amount} onChange={e=>setAmount(e.target.value)} type="number" step="0.01" placeholder={computedAmount}/>
        </label>
        <label style={{gridColumn:'1 / span 2'}}>Narration
          <input value={narration} onChange={e=>setNarration(e.target.value)} />
        </label>
      </div>
      <div style={{display:'flex', justifyContent:'flex-end', marginTop:8}}>
        <button onClick={save}>Save</button>
      </div>
    </div>
  )
}