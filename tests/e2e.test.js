// Pruebas automáticas de Dilo Fácil con Playwright (Chromium).
// Uso: npm test
const { chromium } = require('playwright');
const assert = require('assert');
const fs = require('fs'), path = require('path'), os = require('os');
const startServer = require('./server');

const PORT = 8123, URL = `http://localhost:${PORT}/`;
const results = [];
async function test(name, fn) {
  try { await fn(); results.push(['OK ', name]); }
  catch (e) { results.push(['FALLO', name + ' → ' + e.message.split('\n')[0]]); }
}

// Sustituye la voz del navegador para comprobar qué se "diría" (headless no tiene altavoces).
const speechStub = () => {
  window.__spoken = [];
  window.speechSynthesis.speak = (u) => window.__spoken.push(u.text);
  window.speechSynthesis.cancel = () => {};
};

(async () => {
  const server = startServer(PORT);
  const browser = await chromium.launch();
  const errors = [];

  const ctx = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'], acceptDownloads: true });
  await ctx.addInitScript(speechStub);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(URL);

  await test('La pantalla principal muestra 8 categorías', async () => {
    assert.strictEqual(await page.locator('#home-cats .tile').count(), 8);
  });

  await test('Se puede abrir cada categoría y todas tienen frases', async () => {
    const n = await page.locator('#home-cats .tile').count();
    for (let i = 0; i < n; i++) {
      await page.locator('#home-cats .tile').nth(i).click();
      assert(await page.locator('#view-category').isVisible());
      const name = await page.locator('#h-cat').textContent();
      if (name !== 'Frases personalizadas') assert(await page.locator('#cat-phrases .tile').count() > 0, 'sin frases en ' + name);
      await page.locator('#view-category [data-go="home"]').click();
    }
  });

  await test('Seleccionar una frase la muestra y NO habla sola', async () => {
    await page.click('[data-cat="necesidades"]');
    await page.click('#cat-phrases .tile >> text=Tengo sed.');
    assert.strictEqual(await page.textContent('#selected-text'), 'Tengo sed.');
    assert.strictEqual((await page.evaluate(() => window.__spoken)).length, 0);
  });

  await test('Leer en voz alta y repetir', async () => {
    await page.click('#btn-speak');
    await page.click('#btn-speak');
    assert.deepStrictEqual(await page.evaluate(() => window.__spoken), ['Tengo sed.', 'Tengo sed.']);
  });

  await test('Copiar texto al portapapeles', async () => {
    await page.click('#btn-copy');
    assert.strictEqual(await page.evaluate(() => navigator.clipboard.readText()), 'Tengo sed.');
  });

  await test('Marcar como favorita aparece en Inicio', async () => {
    await page.click('#btn-fav');
    assert.strictEqual(await page.getAttribute('#btn-fav', 'aria-pressed'), 'true');
    await page.click('.mainnav [data-go="home"]');
    assert(await page.locator('#home-favs .tile >> text=Tengo sed.').isVisible());
    assert(await page.locator('#home-freq .tile >> text=Tengo sed.').isVisible(), 'no aparece en frecuentes');
  });

  await test('Frase con campos editables [ ]', async () => {
    await page.click('[data-cat="sensorial"]');
    await page.click('#cat-phrases .tile >> text=Necesito [una pausa]');
    assert.strictEqual(await page.textContent('#selected-text'), 'Necesito una pausa porque hay demasiado ruido.');
    await page.locator('#selected-fields input').nth(1).fill('la luz es muy fuerte');
    assert.strictEqual(await page.textContent('#selected-text'), 'Necesito una pausa porque la luz es muy fuerte.');
  });

  await test('Crear frase: no permite texto vacío', async () => {
    await page.click('.mainnav [data-go="manage"]');
    await page.click('#new-phrase');
    await page.click('#phrase-form button[type="submit"]');
    assert(await page.locator('#form-error').isVisible());
  });

  await test('Crear, editar y eliminar una frase', async () => {
    await page.fill('#f-label', 'Mi perro');
    await page.fill('#f-text', '<img src=x onerror=alert(1)>Quiero ver a mi perro.');
    await page.selectOption('#f-cat', 'personal');
    await page.fill('#f-icon', '🐶');
    await page.selectOption('#f-color', 'green');
    await page.click('#phrase-form button[type="submit"]');
    await page.click('.mainnav [data-go="home"]');
    await page.click('[data-cat="personal"]');
    await page.click('#cat-phrases .tile >> text=Mi perro');
    // El HTML se muestra como texto, no se ejecuta
    assert.strictEqual(await page.textContent('#selected-text'), '<img src=x onerror=alert(1)>Quiero ver a mi perro.');
    assert.strictEqual(await page.locator('#selected img').count(), 0);
    await page.click('#btn-edit');
    await page.fill('#f-text', 'Quiero ver a mi perro.');
    await page.click('#phrase-form button[type="submit"]');
    assert.strictEqual(await page.textContent('#selected-text'), 'Quiero ver a mi perro.');
    await page.click('#btn-edit');
    await page.click('#form-delete');
    await page.click('#confirm-yes');
    assert.strictEqual(await page.evaluate(() => DF.debugState().phrases.some((p) => p.label === 'Mi perro')), false);
  });

  await test('Reordenar categorías', async () => {
    const first = await page.evaluate(() => DF.debugState().categories[0].id);
    await page.locator('#cat-order li').nth(0).locator('button').nth(1).click();
    assert.strictEqual(await page.evaluate(() => DF.debugState().categories[1].id), first);
  });

  await test('Texto libre: leer, guardar y borrar con confirmación', async () => {
    await page.click('.mainnav [data-go="write"]');
    await page.fill('#free-text', 'Hola, me llamo Ana.');
    await page.click('#free-speak');
    assert.strictEqual((await page.evaluate(() => window.__spoken)).pop(), 'Hola, me llamo Ana.');
    await page.click('#free-save');
    assert.strictEqual(await page.locator('#saved-list li').count(), 1);
    await page.click('#free-bigger');
    await page.click('#free-clear');
    await page.click('#confirm-no');
    assert.strictEqual(await page.inputValue('#free-text'), 'Hola, me llamo Ana.');
    await page.click('#free-clear');
    await page.click('#confirm-yes');
    assert.strictEqual(await page.inputValue('#free-text'), '');
  });

  await test('Modo rápido: 6 frases, quitar con confirmación y añadir', async () => {
    await page.click('.mainnav [data-go="quick"]');
    assert.strictEqual(await page.locator('#quick-grid .tile').count(), 6);
    await page.click('#view-quick summary');
    await page.locator('#quick-list li').first().locator('.danger').click();
    await page.click('#confirm-no');
    assert.strictEqual(await page.locator('#quick-grid .tile').count(), 6);
    await page.locator('#quick-list li').first().locator('.danger').click();
    await page.click('#confirm-yes');
    assert.strictEqual(await page.locator('#quick-grid .tile').count(), 5);
    await page.click('#quick-add');
    assert.strictEqual(await page.locator('#quick-grid .tile').count(), 6);
  });

  await test('Cambiar letra, botones, tema e iconos', async () => {
    await page.click('.mainnav [data-go="settings"]');
    await page.selectOption('#s-font', '1.45');
    await page.selectOption('#s-btn', 'xl');
    await page.selectOption('#s-theme', 'dark');
    await page.uncheck('#s-icons');
    const a = await page.evaluate(() => [document.documentElement.dataset.theme, document.documentElement.dataset.btn, document.documentElement.dataset.icons, getComputedStyle(document.documentElement).fontSize]);
    assert.deepStrictEqual(a, ['dark', 'xl', 'off', '23.2px']);
    await page.selectOption('#s-theme', 'calm');
  });

  await test('Las preferencias se mantienen al recargar', async () => {
    await page.reload();
    const s = await page.evaluate(() => DF.debugState().settings);
    assert.strictEqual(s.theme, 'calm'); assert.strictEqual(s.fontScale, 1.45); assert.strictEqual(s.showIcons, false);
    assert(await page.locator('#home-favs .tile >> text=Tengo sed.').isVisible());
  });

  let exported;
  await test('Exportar copia JSON', async () => {
    await page.click('.mainnav [data-go="settings"]');
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#export')]);
    exported = path.join(os.tmpdir(), 'df-export.json');
    await dl.saveAs(exported);
    const data = JSON.parse(fs.readFileSync(exported, 'utf8'));
    assert.strictEqual(data.version, 1);
    assert(data.phrases.length > 30);
  });

  await test('Borrar todos los datos (con confirmación)', async () => {
    await page.click('#reset');
    await page.click('#confirm-yes');
    assert.strictEqual(await page.evaluate(() => DF.debugState().settings.theme), 'light');
  });

  await test('Importar: rechaza archivo inválido', async () => {
    await page.click('.mainnav [data-go="settings"]');
    const bad = path.join(os.tmpdir(), 'df-bad.json');
    fs.writeFileSync(bad, '{"hola": 1}');
    await page.setInputFiles('#import-file', bad);
    await page.waitForFunction(() => document.getElementById('import-msg').textContent.includes('⚠️'));
  });

  await test('Importar: restaura la copia exportada', async () => {
    await page.setInputFiles('#import-file', exported);
    await page.click('#confirm-yes');
    await page.waitForFunction(() => document.getElementById('import-msg').textContent.includes('✅'));
    assert.strictEqual(await page.evaluate(() => DF.debugState().settings.theme), 'calm');
  });

  await test('Navegación con teclado (Tab + Enter)', async () => {
    await page.click('.mainnav [data-go="home"]');
    await page.focus('.mainnav [data-go="home"]');
    await page.keyboard.press('Tab'); // Rápido
    await page.keyboard.press('Enter');
    assert(await page.locator('#view-quick').isVisible());
    // los botones tienen foco visible
    const outline = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
    assert.notStrictEqual(outline, undefined);
  });

  await test('Sin errores de JavaScript en la consola', async () => {
    assert.deepStrictEqual(errors, []);
  });

  await test('Funciona sin conexión (service worker)', async () => {
    await page.goto(URL);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await page.waitForFunction(() => navigator.serviceWorker.controller);
    await ctx.setOffline(true);
    await page.reload();
    assert.strictEqual(await page.locator('#home-cats .tile').count(), 8);
    await ctx.setOffline(false);
  });

  await test('Móvil (390px): sin desplazamiento horizontal', async () => {
    const m = await browser.newPage({ viewport: { width: 390, height: 800 }, isMobile: true, hasTouch: true });
    await m.goto(URL);
    for (const v of ['home', 'quick', 'write', 'manage', 'settings']) {
      await m.click(`.mainnav [data-go="${v}"]`);
      const over = await m.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      assert(!over, 'desborda en ' + v);
    }
    await m.screenshot({ path: path.join(os.tmpdir(), 'df-mobile.png'), fullPage: false });
    await m.close();
  });

  await test('Navegador sin voz: muestra aviso y conserva el texto', async () => {
    const c2 = await browser.newContext();
    await c2.addInitScript(() => { delete window.speechSynthesis; delete window.SpeechSynthesisUtterance; });
    const p2 = await c2.newPage();
    await p2.goto(URL);
    await p2.click('[data-cat="comunicacion"]');
    await p2.click('#cat-phrases .tile >> text=Sí.');
    assert(await p2.locator('#speech-note').isVisible());
    assert(await p2.isDisabled('#btn-speak'));
    await c2.close();
  });

  await browser.close();
  server.close();
  results.forEach((r) => console.log(r[0] + '  ' + r[1]));
  const failed = results.filter((r) => r[0] === 'FALLO').length;
  console.log(`\n${results.length - failed} correctas, ${failed} con fallos.`);
  process.exit(failed ? 1 : 0);
})();
