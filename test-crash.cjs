const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Launching headless browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Listen for console logs
  page.on('console', msg => {
    console.log(`[BROWSER LOG]: ${msg.text()}`);
  });

  // Listen for unhandled errors
  page.on('pageerror', err => {
    console.error(`❌ [BROWSER RUNTIME ERROR]:`, err.toString());
  });

  try {
    console.log('🌐 Navigating to https://alhewari-salon.vercel.app/...');
    await page.goto('https://alhewari-salon.vercel.app/', {
      waitUntil: 'networkidle2',
      timeout: 10000
    });
    console.log('✨ Navigation complete. Closing browser.');
  } catch (err) {
    console.error('⚠️ Navigation encountered an error:', err.message);
  } finally {
    await browser.close();
  }
})();
