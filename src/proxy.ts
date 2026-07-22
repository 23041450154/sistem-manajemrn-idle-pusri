import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { normalizeRole, homePathForRole } from './lib/roles'
import type { Role } from './lib/roles'

const PUBLIC_PATHS = ['/login', '/forgot-password']


export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('token')?.value
  const userCookie = request.cookies.get('user')?.value

  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  )

  // Redirect ke login jika tidak ada token dan bukan public path
  if (!token && !isPublicPath) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Jika sudah login tapi akses halaman public, arahkan ke dashboard
  if (token && isPublicPath) {
    let homeUrl = '/'
    if (userCookie) {
      try {
        const user = JSON.parse(userCookie)
        const role = normalizeRole(user?.role)
        homeUrl = homePathForRole(role)
      } catch (e) {}
    }
    return NextResponse.redirect(new URL(homeUrl, request.url))
  }

  // Cek RBAC
  if (token && userCookie && !isPublicPath) {
    try {
      const user = JSON.parse(userCookie)
      const role = normalizeRole(user?.role)

      // Redirect dari halaman root / ke dashboard role masing-masing
      if (pathname === '/') {
        return NextResponse.redirect(new URL(homePathForRole(role), request.url))
      }

      // Cek perlindungan path berdasarkan role secara eksplisit
      let isAllowed = true;

      if (pathname.startsWith('/admin') && role !== 'ADMIN') {
        isAllowed = false;
      } else if (pathname.startsWith('/rendal') && role !== 'RENDAL_PEMELIHARAAN') {
        isAllowed = false;
      } else if (pathname.startsWith('/inspeksi') && role !== 'INSPEKSI_TEKNIK') {
        isAllowed = false;
      } else if (pathname.startsWith('/manajer') && role !== 'MANAJER_RENDAL') {
        isAllowed = false;
      } else if (pathname.startsWith('/unit-kerja') && role !== 'UNIT_KERJA_OPERASI') {
        isAllowed = false;
      }

      if (!isAllowed) {
        return NextResponse.redirect(new URL(homePathForRole(role), request.url));
      }
    } catch (e) {
      // JSON cookie user rusak, paksa login
      const loginUrl = new URL('/login', request.url)
      const response = NextResponse.redirect(loginUrl)
      response.cookies.delete('token')
      response.cookies.delete('user')
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.webp$|.*\\.jpg$|.*\\.jpeg$).*)'],
}
