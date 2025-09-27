import { supabaseServer } from '@/lib/supabase'

interface TransactionRecord {
  type: string
  amount: number
  status: string
  created_at: string
}

interface InvestmentPlan {
  id: string
  name: string
  plan_group: string
  daily_roi_min: number
  daily_roi_max: number
  min_amount: number
  max_amount?: number
  is_active: boolean
}

export default async function Dashboard() {
  const supabase = await supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  const uid = user?.id

  const [{ data: plans }, { data: tx }] = await Promise.all([
    supabase.from('investment_plans').select('*').eq('is_active', true),
    supabase.from('transactions')
      .select('type, amount, status, created_at')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(10)
  ])

  const approved = (t?: TransactionRecord[] | null) => (t||[]).filter(x=>x.status==='approved')
  const dep = approved(tx).filter(x=>x.type==='deposit').reduce((a,b)=>a+Number(b.amount),0)
  const pay = approved(tx).filter(x=>x.type==='payout').reduce((a,b)=>a+Number(b.amount),0)
  const wd  = approved(tx).filter(x=>x.type==='withdrawal').reduce((a,b)=>a+Number(b.amount),0)
  const balance = dep + pay - wd

  return (
    <main className="p-6 space-y-8">
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border p-4">
          <div className="text-sm text-gray-500">Account Balance</div>
          <div className="text-3xl font-bold">₦{balance.toLocaleString()}</div>
        </div>
        <div className="rounded-2xl border p-4">
          <div className="text-sm text-gray-500">Deposits (approved)</div>
          <div className="text-2xl font-semibold">₦{dep.toLocaleString()}</div>
        </div>
        <div className="rounded-2xl border p-4">
          <div className="text-sm text-gray-500">Withdrawals (approved)</div>
          <div className="text-2xl font-semibold">₦{wd.toLocaleString()}</div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">Active Plans</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(plans as InvestmentPlan[]||[]).map((p)=>(
            <form key={p.id} action={`/api/invest/${p.id}`} method="post" className="rounded-2xl border p-4 space-y-2">
              <div className="font-semibold">{p.name}</div>
              <div className="text-sm text-gray-500 capitalize">{p.plan_group}</div>
              <div className="text-sm">ROI: {(p.daily_roi_min*100).toFixed(1)}% – {(p.daily_roi_max*100).toFixed(1)}% daily</div>
              <input
                name="amount"
                type="number"
                min={p.min_amount}
                max={p.max_amount||undefined}
                placeholder="Amount"
                className="mt-2 w-full rounded border p-2"
                required
              />
              <button className="w-full rounded bg-black p-2 text-white">Invest</button>
            </form>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">Recent Transactions</h2>
        <div className="overflow-x-auto rounded-2xl border">
          <table className="min-w-full text-sm">
            <thead><tr className="bg-gray-50">
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Amount</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Date</th>
            </tr></thead>
            <tbody>
              {(tx as TransactionRecord[]||[]).map((t)=>(
                <tr key={t.created_at} className="border-t">
                  <td className="p-3 capitalize">{t.type}</td>
                  <td className="p-3">₦{Number(t.amount).toLocaleString()}</td>
                  <td className="p-3 capitalize">{t.status}</td>
                  <td className="p-3">{new Date(t.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="max-w-md">
        <h2 className="mb-3 text-xl font-bold">Request Withdrawal</h2>
        <form action="/api/withdraw" method="post" className="space-y-3">
          <input name="amount" type="number" min="1" className="w-full rounded border p-2" placeholder="Amount" required />
          <input name="destination" className="w-full rounded border p-2" placeholder="Wallet/Bank details" required />
          <button className="w-full rounded bg-black p-2 text-white">Submit</button>
        </form>
      </section>
    </main>
  )
}