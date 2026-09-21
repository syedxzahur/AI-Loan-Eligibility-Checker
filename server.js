/**
 * AI Loan Eligibility Checker - Local Development HTTP Server
 * Supports static file hosting from /public and dynamic /api serverless routes.
 * Zero external npm dependencies needed.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Simple .env file parser for local dev
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.substring(0, eqIdx).trim();
        let val = trimmed.substring(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  });
}

const PORT = parseInt(process.env.PORT, 10) || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

// Map API endpoints to handlers
const API_ROUTES = {
  '/api/ai-advice': require('./api/ai-advice'),
  '/api/save-record': require('./api/save-record'),
  '/api/records': require('./api/records'),
  '/api/health': require('./api/health')
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Check for API Routes
  if (API_ROUTES[pathname]) {
    let bodyData = '';
    req.on('data', (chunk) => { bodyData += chunk; });
    req.on('end', () => {
      req.body = bodyData;
      req.query = parsedUrl.query;
      try {
        API_ROUTES[pathname](req, res);
      } catch (err) {
        console.error('API execution error:', err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
      }
    });
    return;
  }

  // Handle Static Files
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
  
  // Prevent directory traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.statusCode = 403;
    return res.end('Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA routing
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.statusCode = 404;
        return res.end('File Not Found');
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', contentType);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`⚡ AI Loan Eligibility Checker running at:`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`======================================================\n`);
});
