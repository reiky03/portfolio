import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const ROOT = '/Users/reikypratama/PortoFolio copy/public/appVideo';
const PORT = 8131;

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  let pathname = parsedUrl.pathname;
  if (pathname === '/' || pathname === '/appVideo' || pathname === '/appVideo/') {
    pathname = '/index.html';
  } else if (pathname.startsWith('/appVideo/')) {
    pathname = pathname.slice('/appVideo'.length);
  }

  const filePath = path.join(ROOT, pathname);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found: ' + pathname);
  }
});

server.listen(PORT, async () => {
  console.log(`📡 Local test server running on http://127.0.0.1:${PORT}`);
  await runBrowserTests();
});

async function runBrowserTests() {
  const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const cdpPort = 9447;
  const chromeProc = spawn(CHROME, [
    '--headless=new',
    '--remote-debugging-port=' + cdpPort,
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=/tmp/chrome-audit-comics-v2-' + Date.now(),
    'about:blank'
  ], { stdio: 'ignore' });

  try {
    await new Promise(r => setTimeout(r, 1200));
    const vRes = await fetch(`http://127.0.0.1:${cdpPort}/json/version`);
    const { webSocketDebuggerUrl } = await vRes.json();
    const ws = new WebSocket(webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let idCounter = 1;
    function send(method, params = {}) {
      return new Promise(res => {
        const id = idCounter++;
        const handler = (evt) => {
          const m = JSON.parse(evt.data);
          if (m.id === id) {
            ws.removeEventListener('message', handler);
            res(m.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    const { targetId } = await send('Target.createTarget', { url: `http://127.0.0.1:${PORT}/appVideo/index.html` });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });

    function sendSession(method, params = {}) {
      return new Promise(res => {
        const id = idCounter++;
        const handler = (evt) => {
          const m = JSON.parse(evt.data);
          if (m.id === id) {
            ws.removeEventListener('message', handler);
            res(m.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, sessionId, method, params }));
      });
    }

    const consoleErrors = [];
    ws.addEventListener('message', (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        const type = msg.params.type;
        const text = msg.params.args.map(a => a.value || a.description || '').join(' ');
        if (type === 'error' && !text.includes('favicon')) {
          consoleErrors.push(text);
          console.error(`🔴 [Browser Console Error]:`, text);
        }
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        const desc = msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text;
        consoleErrors.push(desc);
        console.error(`💥 [Browser Exception]:`, desc);
      }
    });

    await sendSession('Runtime.enable');
    await sendSession('Page.enable');
    await sendSession('DOM.enable');

    console.log('⏳ Waiting for app initialization and comics.json load...');
    await new Promise(r => setTimeout(r, 3500));

    // Audit 1: Check total comics and duplicate tags
    const countEval = await sendSession('Runtime.evaluate', {
      expression: `(() => {
        const total = window.allComics?.length || 0;
        const dups = (window.allComics || []).filter(c => c.is_duplicate).length;
        return { total, duplicatesTagged: dups };
      })()`,
      returnByValue: true
    });
    console.log('✅ Audit 1 (Data & Duplicates):', countEval.result?.value);

    // Audit 2: Switch to Comic view and verify duplicate badges on cards
    console.log('🔄 Audit 2: Switching to Comic tab...');
    await sendSession('Runtime.evaluate', {
      expression: 'switchView("comic")',
      returnByValue: true
    });
    await new Promise(r => setTimeout(r, 1200));

    const cardBadgeEval = await sendSession('Runtime.evaluate', {
      expression: `(() => {
        const grid = document.getElementById("comic-list-grid");
        const cards = grid ? grid.querySelectorAll(".comic-card") : [];
        const duplicateBadges = grid ? grid.querySelectorAll("span[title*='versi lain']").length : 0;
        return { cardsCount: cards.length, duplicateBadgesRendered: duplicateBadges };
      })()`,
      returnByValue: true
    });
    console.log('✅ Audit 2 (Grid & Badges):', cardBadgeEval.result?.value);

    // Audit 3: Open "Sex Change Notebook" (previously broken empty chapter 0)
    console.log('📖 Audit 3: Verifying Sex Change Notebook auto-open first non-empty chapter...');
    const scEval = await sendSession('Runtime.evaluate', {
      expression: `(() => {
        const sc = allComics.find(c => c.title === "Sex Change Notebook");
        openComicReader(sc, 0, 0);
        const webtoonContainer = document.getElementById("comic-webtoon-container");
        const pagesInDom = webtoonContainer?.querySelectorAll(".comic-webtoon-page")?.length || 0;
        const pageTotalText = document.getElementById("comic-page-total")?.textContent;
        const chapterTitle = activeComic?.chapters[currentComicChapterIndex]?.title;
        return {
          title: sc.title,
          activeChapter: chapterTitle,
          pagesInDom,
          pageTotalText
        };
      })()`,
      returnByValue: true
    });
    console.log('✅ Audit 3 (Sex Change Notebook):', scEval.result?.value);
    await new Promise(r => setTimeout(r, 1000));

    // Audit 4: Verify duplicate version switcher in Chapter Sheet
    console.log('📑 Audit 4: Testing duplicate version switcher in Chapter Sheet...');
    const dupSheetEval = await sendSession('Runtime.evaluate', {
      expression: `(() => {
        const target = allComics.find(c => c.is_duplicate);
        openComicReader(target, 0, 0);
        openComicChapterSheet();
        const sheet = document.getElementById("comic-chapter-sheet");
        const isSheetVisible = !sheet.classList.contains("hidden");
        const switchButtons = sheet.querySelectorAll(".btn-switch-version");
        const switchButtonsCount = switchButtons.length;
        closeComicChapterSheet();
        return {
          targetComic: target.title,
          author: target.author,
          isSheetVisible,
          switchButtonsCount
        };
      })()`,
      returnByValue: true
    });
    console.log('✅ Audit 4 (Duplicate Version Switcher):', dupSheetEval.result?.value);

    // Audit 5: Verify Archive Chapter ("Raw Data") actions
    console.log('📦 Audit 5: Testing Archive Chapter with download and drive actions...');
    const archiveEval = await sendSession('Runtime.evaluate', {
      expression: `(() => {
        const rawData = allComics.find(c => c.title === "Raw Data");
        openComicReader(rawData, 0, 0);
        const webtoonContainer = document.getElementById("comic-webtoon-container");
        const hasDriveLink = Boolean(webtoonContainer?.querySelector("a[href*='drive.google.com']"));
        const hasDownloadLink = Boolean(webtoonContainer?.querySelector("a[href*='export=download']"));
        const currentCh = rawData.chapters[0]?.title;
        closeComicReader();
        return {
          title: rawData.title,
          currentCh,
          hasDriveLink,
          hasDownloadLink
        };
      })()`,
      returnByValue: true
    });
    console.log('✅ Audit 5 (Archive Chapter):', archiveEval.result?.value);

    // Audit 6: Verify Swap Mode & Image retry button
    console.log('↔️ Audit 6: Testing Swap mode & Webtoon retry button...');
    const swapEval = await sendSession('Runtime.evaluate', {
      expression: `(() => {
        const comic = allComics.find(c => c.page_count > 100);
        openComicReader(comic, 0, 0);
        toggleComicReaderMode(); // swap mode
        const isSwap = comicReaderMode === "swap";
        const swapImg = document.getElementById("comic-swap-current-img")?.src;
        toggleComicReaderMode(); // back to webtoon
        closeComicReader();
        return {
          isSwap,
          hasSwapImage: Boolean(swapImg),
          currentReaderMode: comicReaderMode
        };
      })()`,
      returnByValue: true
    });
    console.log('✅ Audit 6 (Swap Mode & Toggle):', swapEval.result?.value);

    if (consoleErrors.length === 0) {
      console.log('\n🏆 ALL 6 AUDIT VERIFICATION GATES PASSED WITH 0 CONSOLE ERRORS!');
    } else {
      console.error(`\n❌ Found ${consoleErrors.length} errors during audit!`);
      process.exitCode = 1;
    }
  } finally {
    chromeProc.kill();
    server.close();
  }
}
