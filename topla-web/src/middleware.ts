import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

  const cspHeader = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://storage.yandexcloud.net https://images.unsplash.com https://*.topla.uz",
    "connect-src 'self' https://api.topla.uz wss://api.topla.uz",
    "frame-src 'self' https://accounts.google.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')

  const hostname = request.headers.get('host') || ''
  const url = request.nextUrl.clone()

  // Extract subdomain (support any port for local dev)
  const currentHost = hostname
    .replace(/\.localhost:\d+/, '')
    .replace('.topla.uz', '')
    .replace(/:\d+$/, '')

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)

  let response: NextResponse

  // Handle subdomain routing
  if (currentHost === 'admin' && !url.pathname.startsWith('/admin')) {
    url.pathname = `/admin${url.pathname}`
    response = NextResponse.rewrite(url, { request: { headers: requestHeaders } })
  } else if (currentHost === 'vendor' && !url.pathname.startsWith('/vendor')) {
    url.pathname = `/vendor${url.pathname}`
    response = NextResponse.rewrite(url, { request: { headers: requestHeaders } })
  } else if (currentHost === 'pickup' && !url.pathname.startsWith('/pickup')) {
    url.pathname = `/pickup${url.pathname}`
    response = NextResponse.rewrite(url, { request: { headers: requestHeaders } })
  } else {
    response = NextResponse.next({ request: { headers: requestHeaders } })
  }

  response.headers.set('Content-Security-Policy', cspHeader)

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
