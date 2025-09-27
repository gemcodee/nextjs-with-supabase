import { supabaseServer } from '@/lib/supabase'

interface WithdrawalRequest {
  id: string
  user_id: string
  amount: number
  destination: string
  status: string
  created_at: string
}

export default async function Admin() {
  const supabase = await supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') return <main className="p-6">Not authorized.</main>

  const { data: reqs } = await supabase.from('withdrawal_requests')
    .select('id, user_id, amount, destination, status, created_at')
    .eq('status','pending')
    .order('created_at', { ascending: true })

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Admin – Withdrawal Approvals</h1>
      <div className="space-y-3">
        {(reqs as WithdrawalRequest[]||[]).map((r)=>(
          <form key={r.id} action={`/api/admin/withdrawals/${r.id}`} method="post"
                className="flex items-center justify-between rounded-2xl border p-4">
            <div>
              <div className="font-semibold">₦{Number(r.amount).toLocaleString()}</div>
              <div className="text-sm text-gray-500">{r.destination}</div>
            </div>
            <div className="space-x-2">
              <button name="decision" value="approved" className="rounded bg-black px-3 py-2 text-white">Approve</button>
              <button name="decision" value="rejected" className="rounded border px-3 py-2">Reject</button>
            </div>
          </form>
        ))}
      </div>
    </main>
  )
}