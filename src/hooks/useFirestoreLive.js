import { useEffect, useState } from 'react'
import { onSnapshot, query } from 'firebase/firestore'

export function useFirestoreLive(q){
  const [rows, setRows] = useState([])
  useEffect(()=>{
    if(!q) return
    const unsub = onSnapshot(q, (snap)=>{
      setRows(snap.docs.map(d=>({id:d.id, ...d.data()})))
    })
    return ()=>unsub()
  },[JSON.stringify(q?._queryConstraints||[])]) // simple dep
  return rows
}