import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export async function POST(req: Request) {
  const supabase = await supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/auth/sign-in', req.url))

  const form = await req.formData()
  const amount = Number(form.get('amount') || 0)
  const destination = String(form.get('destination') || '')

  if (!amount || amount <= 0 || !destination) {
    return NextResponse.json({ ok:false, message: 'Invalid request' }, { status: 400 })
  }

  const { error } = await supabase.from('withdrawal_requests').insert({
    user_id: user.id, amount, destination, status: 'pending'
  })
  if (error) return NextResponse.json({ ok:false, message: error.message }, { status: 400 })

  return NextResponse.redirect(new URL('/dashboard', req.url))
}