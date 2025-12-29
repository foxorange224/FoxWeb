export const config = {
  matcher: '/'
};

export default function middleware(request) {
  const url = new URL(request.url);
  
  // Solo aplicar a la página principal
  if (url.pathname === '/' || url.pathname === '/main.html') {
    const headers = new Headers();
    
    // Headers para forzar cache en CDN
    headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    headers.set('CDN-Cache-Control', 'public, max-age=604800');
    headers.set('Vercel-CDN-Cache-Control', 'public, max-age=604800');
    headers.set('Edge-Cache', 'v=1, max-age=604800');
    
    return new Response(null, {
      headers,
      status: 200
    });
  }
  
  // Para otras rutas, seguir normal
  return new Response(null, {
    headers: new Headers(),
    status: 200
  });
}