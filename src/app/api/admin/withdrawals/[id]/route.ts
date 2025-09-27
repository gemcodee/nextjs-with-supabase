import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const supabase = await supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok:false }, { status: 401 })

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') return NextResponse.json({ ok:false }, { status: 403 })

  const form = await req.formData()
  const decision = String(form.get('decision') || '')
  if (!['approved','rejected'].includes(decision)) return NextResponse.json({ ok:false }, { status: 400 })

  const { error } = await supabase.from('withdrawal_requests')
    .update({ status: decision, reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq('id', params.id).eq('status','pending')
  if (error) return NextResponse.json({ ok:false, message: error.message }, { status: 400 })

  if (decision === 'approved') {
    const { data: wr } = await supabase.from('withdrawal_requests').select('user_id, amount').eq('id', params.id).single()
    if (wr) {
      await supabase.from('transactions').insert({
        user_id: wr.user_id, type: 'withdrawal', amount: wr.amount, status: 'approved', meta: { source: 'admin_approval' }
      })
    }
  }

  return NextResponse.redirect(new URL('/admin', req.url))
}