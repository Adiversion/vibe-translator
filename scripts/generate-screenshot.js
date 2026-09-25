const path = require('path');
const fs = require('fs');

async function renderScreenshot() {
  let playwright = null;
  try {
    playwright = require('playwright');
  } catch (_) {
    playwright = require('D:/ReturnPilot V4.0 mv3 safe/ReturnPilot-GST-Assistant/node_modules/playwright');
  }

  const { chromium } = playwright;
  const rootDir = path.resolve(__dirname, '..');
  const htmlPath = path.join(rootDir, 'store-assets', 'screenshot-1.html');
  const outPngPath = path.join(rootDir, 'store-assets', 'screenshot-1.png');
  const brainArtifactPath = 'C:/Users/Anadi/.gemini/antigravity-cli/brain/c9bda325-4069-4f32-b67f-2f2e6042281f/screenshot-1.png';

  console.log('🚀 Launching Chromium to render pixel-perfect 1280x800 Web Store screenshot...');
  const browser = await chromium.launch({
    args: ['--font-render-hinting=medium', '--enable-font-antialiasing']
  });

  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1
  });

  const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');
  await page.goto(fileUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  await page.screenshot({
    path: outPngPath,
    type: 'png'
  });

  // Also copy to brain artifact folder for immediate user viewing
  try {
    fs.copyFileSync(outPngPath, brainArtifactPath);
  } catch (_) {}

  await browser.close();
  const sizeKb = (fs.statSync(outPngPath).size / 1024).toFixed(1);
  console.log(`✨ Screenshot rendered successfully: ${outPngPath} (${sizeKb} KB)`);
}

renderScreenshot().catch(err => {
  console.error('✖ Failed to render screenshot:', err);
  process.exit(1);
});
