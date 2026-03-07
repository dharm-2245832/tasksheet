import { NextResponse } from 'next/server'

export default function proxy(request) {
  const isAuth = request.cookies.get('next-auth.session-token') || request.cookies.get('__Secure-next-auth.session-token')

  if (!isAuth && !request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/api/auth')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}
