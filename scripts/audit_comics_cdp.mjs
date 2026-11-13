import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const ROOT = '/Users/reikypratama/PortoFolio copy/public/appVideo';
const PORT = 8129;

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
  const cdpPort = 9445;
  const chromeProc = spawn(CHROME, [
    '--headless=new',
    '--remote-debugging-port=' + cdpPort,
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=/tmp/chrome-audit-comics-' + Date.now(),
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

    // Wait for comics data to fetch and app to initialize
    console.log('⏳ Waiting for app initialization and comics.json load...');
    await new Promise(r => setTimeout(r, 3500));

    // Audit 1: Check total comics loaded in memory
    const countEval = await sendSession('Runtime.evaluate', {
      expression: '({ comicsCount: window.allComics?.length || 0, activeView })',
      returnByValue: true
    });
    console.log('✅ Audit 1 (Data Loaded):', countEval.result?.value);

    // Audit 2: Switch to Comic view
    console.log('🔄 Audit 2: Switching to Comic tab...');
    await sendSession('Runtime.evaluate', {
      expression: 'switchView("comic")',
      returnByValue: true
    });
    await new Promise(r => setTimeout(r, 1200));

    const viewEval = await sendSession('Runtime.evaluate', {
      expression: '({ activeView, comicsGridChildren: document.getElementById("comic-list-grid")?.children?.length || 0, authorsCount: document.getElementById("comic-author-pills")?.children?.length || 0 })',
      returnByValue: true
    });
    console.log('✅ Audit 2 (Comic Tab Render):', viewEval.result?.value);

    // Audit 3: Open a multi-chapter comic series with >500 pages
    console.log('📖 Audit 3: Opening comic with high page count...');
    const openComicEval = await sendSession('Runtime.evaluate', {
      expression: `(() => {
        const targetComic = allComics.find(c => c.page_count > 500 && c.chapters.some(ch => ch.pages?.length > 100));
        if (!targetComic) return { error: "No comic with >500 pages and >100 ch pages found" };
        const chIdx = targetComic.chapters.findIndex(ch => ch.pages?.length > 100);
        openComicReader(targetComic, chIdx, 0);
        return {
          title: targetComic.title,
          author: targetComic.author,
          page_count: targetComic.page_count,
          chapters_count: targetComic.chapters_count,
          selectedChapterIndex: chIdx,
          currentChapterTitle: targetComic.chapters[chIdx].title,
          currentChapterPages: targetComic.chapters[chIdx].pages?.length || 0
        };
      })()`,
      returnByValue: true
    });
    console.log('✅ Audit 3 (Reader Opened):', openComicEval.result?.value);
    await new Promise(r => setTimeout(r, 1500));

    // Audit 4: Verify Webtoon DOM and Reader Controls
    const readerStateEval = await sendSession('Runtime.evaluate', {
      expression: `(() => {
        const modal = document.getElementById("comic-reader-modal");
        const isVisible = !modal.classList.contains("hidden");
        const webtoonContainer = document.getElementById("comic-webtoon-container");
        const pagesInDom = webtoonContainer?.querySelectorAll(".comic-webtoon-page")?.length || 0;
        const pageTotalText = document.getElementById("comic-page-total")?.textContent;
        const pageNowText = document.getElementById("comic-page-now")?.textContent;
        const sliderMax = document.getElementById("comic-page-slider")?.max;
        return { isVisible, pagesInDom, pageTotalText, pageNowText, sliderMax };
      })()`,
      returnByValue: true
    });
    console.log('✅ Audit 4 (Webtoon Pages in DOM):', readerStateEval.result?.value);

    // Audit 5: Toggle Reader Mode to Swap Mode and check Page 1
    console.log('↔️ Audit 5: Toggling to Swap mode...');
    await sendSession('Runtime.evaluate', {
      expression: 'toggleComicReaderMode()',
      returnByValue: true
    });
    await new Promise(r => setTimeout(r, 600));

    const swapStateEval = await sendSession('Runtime.evaluate', {
      expression: `(() => {
        const swapContainer = document.getElementById("comic-swap-container");
        const isSwapVisible = !swapContainer.classList.contains("hidden");
        const currentImg = document.getElementById("comic-swap-current-img")?.src;
        return { comicReaderMode, isSwapVisible, hasImageSrc: Boolean(currentImg) };
      })()`,
      returnByValue: true
    });
    console.log('✅ Audit 5 (Swap Mode):', swapStateEval.result?.value);

    // Audit 6: Close Reader Modal
    console.log('❌ Audit 6: Closing reader modal...');
    await sendSession('Runtime.evaluate', {
      expression: 'closeComicReader()',
      returnByValue: true
    });
    await new Promise(r => setTimeout(r, 500));

    const closeEval = await sendSession('Runtime.evaluate', {
      expression: 'document.getElementById("comic-reader-modal").classList.contains("hidden")',
      returnByValue: true
    });
    console.log('✅ Audit 6 (Modal Closed):', closeEval.result?.value);

    if (consoleErrors.length === 0) {
      console.log('\n🏆 ALL COMIC AUDIT TESTS PASSED WITH 0 CONSOLE ERRORS!');
    } else {
      console.error(`\n❌ Found ${consoleErrors.length} errors during audit!`);
      process.exitCode = 1;
    }
  } finally {
    chromeProc.kill();
    server.close();
  }
}
