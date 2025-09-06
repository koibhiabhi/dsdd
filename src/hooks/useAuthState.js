import { onAuthStateChanged, signInAnonymously as anon } from 'firebase/auth'
import { useEffect, useState } from 'react'
import { auth } from '../firebase'

export function useAuthState(){
  const [user, setUser] = useState(null)
  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, setUser)
    return ()=>unsub()
  },[])
  return {
    user,
    async signInAnonymously(){
      if(!auth.currentUser){
        await anon(auth)
      }
    }
  }
}