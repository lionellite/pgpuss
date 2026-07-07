const puppeteer = require('puppeteer');

(async () => {
  console.log("Lancement de Puppeteer...");
  try {
    const browser = await puppeteer.launch({
      executablePath: '/usr/bin/chromium',
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-zygote',
      ]
    });
    console.log("✅ Succès ! Chromium a bien démarré.");
    const page = await browser.newPage();
    await page.goto('https://example.com');
    console.log("✅ Navigation réussie.");
    await browser.close();
  } catch (err) {
    console.error("❌ Erreur fatale :", err);
  }
})();
