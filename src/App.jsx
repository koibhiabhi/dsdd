import React, { useEffect, useState } from 'react'
import LedgerTable from './components/LedgerTable'
import LedgerEntryForm from './components/LedgerEntryForm'
import PartyLedger from './components/PartyLedger'
import Dashboard from './components/Dashboard'
import { useAuthState } from './hooks/useAuthState'
import { migrateFromOldApp } from './lib/migrations'
import { auth, db } from './firebase'
import { collection, getDocs } from 'firebase/firestore'

export default function App(){
  const { user, signInAnonymously } = useAuthState()
  const [companyId, setCompanyId] = useState('')
  const [companies, setCompanies] = useState([])

  // Auto sign in (anonymous)
  useEffect(()=>{
    signInAnonymously()
  },[])

  // Fetch companies from Firestore
  useEffect(()=>{
    async function fetchCompanies(){
      try {
        const snapshot = await getDocs(collection(db, "companies"))
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        setCompanies(list)

        // If at least one company exists, select the first one by default
        if(list.length > 0 && !companyId){
          setCompanyId(list[0].id)
        }
      } catch (err){
        console.error("Error fetching companies:", err)
      }
    }
    fetchCompanies()
  },[])

  const onMigrate = async ()=>{
    if(!companyId) return alert('Select company')
    await migrateFromOldApp(companyId)
    alert('Migration complete.')
  }

  return (
    <div style={{fontFamily:'ui-sans-serif', padding:16}}>
      <div style={{display:'flex', gap:12, alignItems:'center', marginBottom:12}}>
        <h2 style={{margin:0}}>Tally-like Ledger</h2>
        <select value={companyId} onChange={e=>setCompanyId(e.target.value)}>
          <option value="">-- choose company --</option>
          {companies.map(c => (
            <option key={c.id} value={c.id}>
              {c.name || c.id}
            </option>
          ))}
        </select>
        <button onClick={onMigrate}>Settings → Migrate from Old App</button>
        <div style={{marginLeft:'auto', fontSize:12}}>
          {user ? `Signed in: ${user.uid}` : 'Signing in...'}
        </div>
      </div>

      <Dashboard companyId={companyId} />

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:16}}>
        <div>
          <LedgerEntryForm companyId={companyId} />
        </div>
        <div>
          <PartyLedger companyId={companyId} />
        </div>
      </div>

      <div style={{marginTop:24}}>
        <LedgerTable companyId={companyId} />
      </div>
    </div>
  )
}
