import {
  collection, getDocs, doc, setDoc, addDoc, serverTimestamp, query, where,
} from 'firebase/firestore'
import { db } from '../firebase'
import { v4 as uuid } from 'uuid'

// New schema paths
// books/{companyId}/accounts
// books/{companyId}/parties
// books/{companyId}/vouchers

const MASTER_ACCOUNTS = [
  { code:'1000', name:'Inventory', type:'Asset' },
  { code:'1100', name:'Accounts Receivable', type:'Asset' },
  { code:'1200', name:'Cash', type:'Asset' },
  { code:'1210', name:'Bank', type:'Asset' },
  { code:'2000', name:'Accounts Payable', type:'Liability' },
  { code:'4000', name:'Sales', type:'Income' },
  { code:'5000', name:'COGS', type:'Expense' },
  { code:'3000', name:'Equity', type:'Equity' },
]

async function ensureMasterAccounts(companyId){
  const col = collection(db,'books',companyId,'accounts')
  for(const a of MASTER_ACCOUNTS){
    await setDoc(doc(col, a.code), { ...a, createdAt: serverTimestamp() }, { merge:true })
  }
}

async function ensurePartyAccount(companyId, partyName){
  const partiesCol = collection(db,'books',companyId,'parties')
  const snap = await getDocs(partiesCol)
  const existing = snap.docs.find(d => (d.data().name||'').trim().toLowerCase() === (partyName||'').trim().toLowerCase())
  if(existing) return existing.ref
  // create party with linked account under AR/AP later decided by voucher type
  const refId = uuid()
  const ref = doc(partiesCol, refId)
  await setDoc(ref, { name: partyName, createdAt: serverTimestamp() })
  return ref
}

function legacyKey(companyId, entryId){
  return `${companyId}::legacy::${entryId}`
}

export async function migrateFromOldApp(companyId){
  await ensureMasterAccounts(companyId)

  // Read old data
  const companiesRef = collection(db, 'companies')
  const matsSnap = await getDocs(collection(db,'companies',companyId,'materials'))
  const matMap = {}
  matsSnap.forEach(m => matMap[m.id] = m.data())

  const entSnap = await getDocs(collection(db,'companies',companyId,'entries'))

  // Create vouchers
  const vouchersCol = collection(db,'books',companyId,'vouchers')

  for(const docSnap of entSnap.docs){
    const e = docSnap.data()
    const id = docSnap.id
    const key = legacyKey(companyId, id)

    // Skip if already migrated
    // (by recording a doc with same id under vouchers)
    // We can't force IDs for addDoc, so use setDoc with known id:
    const vRef = doc(vouchersCol, key)
    const exists = (await getDocs(query(vouchersCol, where('legacyRefId','==', key)))).size > 0
    if(exists) continue

    const mat = matMap[e.materialId] || {}
    const qty = Number(e.bags || 0)
    const rate = Number(e.pricePerBag || 0)
    const amount = Number(e.totalValue || (qty * rate) || 0)
    const costTotal = Number(e.costTotal || 0)
    const partyName = (e.party || '').trim() || 'Unknown'

    const partyRef = await ensurePartyAccount(companyId, partyName)

    const base = {
      legacyRefId: key,
      date: e.createdAt || new Date(),
      narration: e.note || '',
      type: (e.type === 'purchase') ? 'Purchase' : 'Sales',
      partyName,
      inventoryLines: [{
        materialId: e.materialId,
        materialName: mat.name || '',
        qtyBags: qty,
        ratePerBag: rate || null,
        amount: amount,
      }],
      lines: [],
      createdAt: serverTimestamp(),
    }

    if(e.type === 'purchase'){
      // DR Inventory, CR Accounts Payable (party)
      base.lines.push({ accountCode:'1000', accountName:'Inventory', debit: amount, credit: 0 })
      base.lines.push({ accountCode:'2000', accountName:'Accounts Payable', debit: 0, credit: amount, party: partyName })
    } else if(e.type === 'sale'){
      // DR Accounts Receivable, CR Sales
      base.lines.push({ accountCode:'1100', accountName:'Accounts Receivable', debit: amount, credit: 0, party: partyName })
      base.lines.push({ accountCode:'4000', accountName:'Sales', debit: 0, credit: amount })
      // Record COGS: DR COGS, CR Inventory (using costTotal)
      const c = costTotal || 0
      if(c > 0){
        base.lines.push({ accountCode:'5000', accountName:'COGS', debit: c, credit: 0 })
        base.lines.push({ accountCode:'1000', accountName:'Inventory', debit: 0, credit: c })
      }
    }

    await setDoc(vRef, base) // idempotent for a given legacyRefId
  }
}