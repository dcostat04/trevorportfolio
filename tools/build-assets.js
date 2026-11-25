// Regenerates the link-preview image (og.png) and the downloadable resume PDF
// from the live pages. Run after editing data/profile.json:
//   node tools/build-assets.js
// Needs Node and Playwright with Chromium.
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png' };

const server = http.createServer((req, res) => {
  const file = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!file.startsWith(root) || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

const card = `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@500;700&family=Newsreader:opsz,wght@6..72,400&display=swap">
<style>
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;background:#fff;color:#121419;font-family:"Schibsted Grotesk",Arial,sans-serif;padding:72px 84px;display:flex;flex-direction:column;justify-content:space-between;border-top:14px solid #2340c9}
.k{font-size:26px;color:#4f5563}.k b{color:#121419}
h1{font-size:68px;line-height:1.06;letter-spacing:-.035em;font-weight:700;max-width:16ch}
h1 em{font-style:normal;color:#2340c9}
.f{display:flex;justify-content:space-between;align-items:baseline;font-size:24px;color:#4f5563;border-top:2px solid #121419;padding-top:22px}
.f b{color:#121419}
</style></head><body>
<p class="k"><b>Trevor D'Costa</b> · Product · Mumbai</p>
<h1>I build the systems a business runs on, and then I make sure people <em>actually use them.</em></h1>
<p class="f"><span><b>Icestasy</b> · SHC Growth Partners · Barclays</span><span>Open to PM roles</span></p>
</body></html>`;

(async () => {
  await new Promise(r => server.listen(0, r));
  const base = `http://localhost:${server.address().port}/`;
  const browser = await chromium.launch();
  try {
    const og = await browser.newPage({ viewport: { width: 1200, height: 630 } });
    await og.setContent(card, { waitUntil: 'networkidle' });
    await og.screenshot({ path: path.join(root, 'og.png') });

    const cv = await browser.newPage();
    await cv.goto(base + 'resume.html', { waitUntil: 'networkidle' });
    await cv.waitForSelector('#resume .job');
    await cv.pdf({ path: path.join(root, 'Trevor-DCosta-Resume.pdf'), format: 'A4', printBackground: true });
    console.log('Wrote og.png and Trevor-DCosta-Resume.pdf');
  } finally {
    await browser.close(); server.close();
  }
})();
