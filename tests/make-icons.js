// Genera los iconos PNG a partir de icons/icon.svg (usa Playwright). Uso: node tests/make-icons.js
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const svg = fs.readFileSync(path.join(__dirname, '..', 'icons', 'icon.svg'), 'utf8');
  const browser = await chromium.launch();
  for (const size of [192, 512]) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(`<style>html,body{margin:0}</style>${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}`);
    await page.screenshot({ path: path.join(__dirname, '..', 'icons', `icon-${size}.png`), omitBackground: true });
  }
  await browser.close();
})();
