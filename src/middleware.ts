import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const config = { matcher: ['/dashboard/:path*', '/admin/:path*'] }

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname
  const cookie = req.headers.get('cookie') || ''

  // Ask our API for the current user role (also indicates if logged in)
  const roleRes = await fetch(new URL('/api/me/role', req.url), {
    headers: { cookie }
  })
  const { role } = await roleRes.json()

  // If not logged in, our API returns role=null
  const loggedIn = role !== null

  if (!loggedIn) {
    const url = new URL('/auth/sign-in', req.url)
    url.searchParams.set('next', path)
    return NextResponse.redirect(url)
  }

  if (path.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}