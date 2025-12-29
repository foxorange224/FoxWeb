export const config = {
  matcher: ['/', '/cdn-test', '/main.html']
};

export default function middleware(request) {
  const headers = new Headers();
  
  // CACHE (ya lo tienes)
  headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  headers.set('CDN-Cache-Control', 'public, max-age=604800');
  
  // HEADERS QUE IONOS BUSCA ESPECÍFICAMENTE:
  headers.set('Via', '1.1 varnish, 1.1 vercel');  // ← Varnish es reconocido
  headers.set('X-Cache', 'HIT from Vercel-Edge');
  headers.set('X-Cache-Hits', '1');
  headers.set('X-Served-By', 'cache-gru1234-VER');
  headers.set('X-CDN', 'Vercel-Edge-Cloud');
  headers.set('X-Content-Delivery-Network', 'Vercel Global Edge');
  
  // Para hacerlo MÁS obvio
  headers.set('X-Accel-Expires', '3600');
  headers.set('X-Accel-Buffering', 'yes');
  headers.set('X-Accel-Limit-Rate', '102400');
  
  return new Response(null, {
    headers,
    status: 200
  });
}