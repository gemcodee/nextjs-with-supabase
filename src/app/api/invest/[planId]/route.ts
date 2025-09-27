import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export async function POST(req: Request, { params }: { params: { planId: string } }) {
  const supabase = await supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/auth/sign-in', req.url))

  const form = await req.formData()
  const amount = Number(form.get('amount') || 0)

  const { data: plan } = await supabase.from('investment_plans').select('*').eq('id', params.planId).single()
  if (!plan || amount < Number(plan.min_amount) || (plan.max_amount && amount > Number(plan.max_amount)))
    return NextResponse.json({ ok:false, message: 'Invalid amount' }, { status: 400 })

  const { error } = await supabase.from('user_investments').insert({
    user_id: user.id, plan_id: params.planId, amount, status: 'pending'
  })
  if (error) return NextResponse.json({ ok:false, message: error.message }, { status: 400 })

  await supabase.from('transactions').insert({
    user_id: user.id, type: 'deposit', amount, status: 'pending', meta: { reason: 'investment', plan_id: params.planId }
  })

  return NextResponse.redirect(new URL('/dashboard', req.url))
}