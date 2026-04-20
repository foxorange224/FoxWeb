const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const PORT = process.env.PORT || 80;
const CACHE_DURATION = 60 * 60 * 24 * 7; // 1 semana en segundos

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.xml': 'application/xml',
  '.txt': 'text/plain'
};

// Cache en memoria para componentes
const componentCache = new Map();

/**
 * Carga un componente desde la carpeta components/
 */
function loadComponent(componentName) {
  if (componentCache.has(componentName)) {
    return componentCache.get(componentName);
  }
  
  const componentPath = path.join(__dirname, 'components', `${componentName}.html`);
  
  try {
    if (fs.existsSync(componentPath)) {
      const content = fs.readFileSync(componentPath, 'utf8');
      componentCache.set(componentName, content);
      return content;
    }
  } catch (err) {
    console.error(`Error cargando componente ${componentName}:`, err.message);
  }
  
  return '';
}

/**
 * Procesa los includes en el HTML: <!--#include file="header.html" -->
 */
function processIncludes(htmlContent) {
  const includeRegex = /<!--#include\s+file="([^"]+)"\s*-->/g;
  let result = htmlContent;
  let match;
  
  while ((match = includeRegex.exec(htmlContent)) !== null) {
    const componentName = match[1].replace('.html', '');
    const componentContent = loadComponent(componentName);
    result = result.replace(match[0], componentContent);
  }
  
  return result;
}

/**
 * Determina el tipo de compresión a usar
 */
function getEncoding(acceptEncoding) {
  if (!acceptEncoding) return null;
  
  if (acceptEncoding.includes('br')) {
    return { type: 'br', encoder: zlib.createBrotliCompress() };
  }
  
  if (acceptEncoding.includes('gzip')) {
    return { type: 'gzip', encoder: zlib.createGzip() };
  }
  
  return null;
}

/**
 * Obtiene headers de cache basados en el tipo de archivo
 */
function getCacheHeaders(ext) {
  const isStatic = ['.css', '.js', '.ico', '.webp', '.png', '.jpg', '.svg', '.woff2', '.ttf'].includes(ext);
  
  // No cachear JS durante desarrollo para evitar problemas
  const isDev = process.env.NODE_ENV !== 'production';
  
  if (isDev && ext === '.js') {
    return {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };
  }
  
  if (isStatic) {
    return {
      'Cache-Control': `public, max-age=${CACHE_DURATION}`,
      'ETag': `"${Date.now()}"`,
      'Expires': new Date(Date.now() + CACHE_DURATION * 1000).toUTCString()
    };
  }
  
  return {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };
}

/**
 * Sirve un archivo con compresión
 */
function serveFile(filePath, res, acceptEncoding) {
  const ext = path.extname(filePath);
  const cacheHeaders = getCacheHeaders(ext);
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Intentar servir 404
        fs.readFile(path.join(__dirname, '404.html'), (err404, content404) => {
          if (err404) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
          } else {
            const encoding = getEncoding(acceptEncoding);
            const contentType = mimeTypes[ext] || 'text/plain';
            
            if (encoding) {
              res.writeHead(200, { 
                'Content-Type': contentType,
                'Content-Encoding': encoding.type,
                ...cacheHeaders
              });
              encoding.encoder.pipe(res);
              encoding.encoder.end(content404);
            } else {
              res.writeHead(200, { 
                'Content-Type': contentType,
                ...cacheHeaders
              });
              res.end(content404);
            }
          }
        });
      } else {
        res.writeHead(500);
        res.end('500 Internal Server Error');
      }
      return;
    }
    
    const contentType = mimeTypes[ext] || 'text/plain';
    let contentToServe = content;
    
    // Procesar includes solo para archivos HTML
    if (ext === '.html') {
      contentToServe = processIncludes(content.toString());
      contentToServe = Buffer.from(contentToServe);
    }
    
    const encoding = getEncoding(acceptEncoding);
    
    if (encoding) {
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Content-Encoding': encoding.type,
        'Vary': 'Accept-Encoding',
        ...cacheHeaders
      });
      
      const compressor = encoding.type === 'br' 
        ? zlib.createBrotliCompress() 
        : zlib.createGzip();
      
      compressor.pipe(res);
      compressor.end(contentToServe);
    } else {
      res.writeHead(200, { 
        'Content-Type': contentType,
        ...cacheHeaders
      });
      res.end(contentToServe);
    }
  });
}

// Servir archivos estáticos con compression
const server = http.createServer((req, res) => {
  const acceptEncoding = req.headers['accept-encoding'] || '';
  
  // Headers de seguridad
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Determinar la ruta del archivo
  let filePath = req.url.split('?')[0];
  
  if (filePath === '/') {
    filePath = '/index.html';
  } else if (!path.extname(filePath)) {
    // Intentar agregar .html
    const htmlPath = path.join(__dirname, filePath + '.html');
    const indexPath = path.join(__dirname, filePath, 'index.html');
    
    if (fs.existsSync(htmlPath)) {
      filePath = filePath + '.html';
    } else if (fs.existsSync(indexPath)) {
      filePath = filePath + '/index.html';
    } else {
      filePath = filePath + '.html';
    }
  }
  
  const fullPath = path.join(__dirname, filePath);
  
  serveFile(fullPath, res, acceptEncoding);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`,_____________________________________________________________,`);
  console.log(`| FoxWeb Servidor Optimizado - Puerto: ${PORT}                    |`);
  console.log(`|                                                              |`);
  console.log(`| Características activadas:                                  |`);
  console.log(`| ✓ Compresión Brotli/Gzip                                     |`);
  console.log(`| ✓ Includes para componentes (header/footer)                 |`);
  console.log(`| ✓ Cache headers para archivos estáticos                      |`);
  console.log(`| ✓ Headers de seguridad                                       |`);
  console.log(`|_____________________________________________________________|`);
  console.log(`| Presione Ctrl+C para Detener                                |`);
  console.log(`|_____________________________________________________________|`);
});
