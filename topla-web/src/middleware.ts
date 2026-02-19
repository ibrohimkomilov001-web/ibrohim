import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const url = request.nextUrl.clone()
  
  // Extract subdomain (support any port for local dev)
  const currentHost = hostname
    .replace(/\.localhost:\d+/, '')
    .replace('.topla.uz', '')
    .replace(/:\d+$/, '')
  
  // Handle subdomain routing
  if (currentHost === 'admin') {
    if (!url.pathname.startsWith('/admin')) {
      url.pathname = `/admin${url.pathname}`
      return NextResponse.rewrite(url)
    }
  } else if (currentHost === 'vendor') {
    if (!url.pathname.startsWith('/vendor')) {
      url.pathname = `/vendor${url.pathname}`
      return NextResponse.rewrite(url)
    }
  }
  
  return NextResponse.next()
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
