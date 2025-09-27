'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const router = useRouter()
  const next = useSearchParams().get('next') || '/dashboard'

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabaseBrowser().auth.signInWithOtp({ email })
    if (error) {
      alert(error.message)
      return
    }
    alert('Magic link sent. Check your email.')
    router.push(next)
  }

  return (
    <main className="mx-auto mt-24 max-w-sm space-y-4">
      <h1 className="text-2xl font-bold">Sign in</h1>
      <form onSubmit={submit} className="space-y-3">
        <input
          className="w-full rounded border p-2"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          required
        />
        <button className="w-full rounded bg-black p-2 text-white">Send magic link</button>
      </form>
    </main>
  )
}