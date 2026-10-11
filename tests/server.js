// Servidor local muy simple (sin dependencias). Uso: node tests/server.js  → http://localhost:8080
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png' };
function start(port) {
  return http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    const file = path.normalize(path.join(root, p));
    if (!file.startsWith(root) || file.includes(`${path.sep}.git`)) { res.writeHead(403); return res.end(); }
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); return res.end('No encontrado'); }
      res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
      res.end(data);
    });
  }).listen(port);
}
module.exports = start;
if (require.main === module) { start(8080); console.log('Dilo Fácil en http://localhost:8080  (Ctrl+C para parar)'); }
