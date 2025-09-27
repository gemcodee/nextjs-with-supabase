import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export async function GET() {
  const supabase = await supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ role: null })

  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (error) return NextResponse.json({ role: null })
  return NextResponse.json({ role: data.role })
}