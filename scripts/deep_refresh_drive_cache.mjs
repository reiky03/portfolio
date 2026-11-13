import https from 'https';
import fs from 'fs';

const CACHE_FILE = '/Users/reikypratama/.gemini/antigravity/brain/6adc70c4-38a8-45b6-9137-6b5cc6912041/scratch/drive_cache.json';
let cache = {};
if (fs.existsSync(CACHE_FILE)) {
  cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
}

let clientVersion = 'drive.web-frontend_20261109.13_p0';
let serverToken = 'CAMSFxUUmrS-NbK-BOSJBacGh_othO_eAR0H';

async function refreshTokens() {
  return new Promise((resolve) => {
    https.get('https://drive.google.com/drive/folders/14g1mRS64P3MscBtNuNL92OPq9TIm2hNn', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
      timeout: 10000
    }, (res) => {
      let html = '';
      res.on('data', c => html += c);
      res.on('end', () => {
        const m = html.match(/"drive_main","([^"]+)",null,"([^"]+)"/);
        if (m) {
          clientVersion = m[1];
          serverToken = m[2];
          console.log(`[Token Refresh] Client: ${clientVersion}, Server: ${serverToken}`);
        }
        resolve();
      });
    }).on('error', () => resolve());
  });
}

function fetchPage(folderId, token = '') {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify([
      [null, null, null, null, 0, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, null, null, [4, 1, 1], null, null, null, null, null, null, null, null, null, null, [[1]], null, null, null, null, null, null, null, [[folderId, 0]]],
      [50, token, [2, 5]]
    ]);

    const req = https.request('https://drivefrontend-pa.clients6.google.com/v1/items:list?key=AIzaSyC1qbk75NzWBvSaDh6KnsjjA9pIrP4lYIE', {
      method: 'POST',
      headers: {
        'content-type': 'application/json+protobuf',
        'x-goog-drive-client-version': clientVersion,
        'x-goog-fieldmask': 'items(id,title,mime_type,file_size),continuation_token',
        'X-Server-Token': serverToken,
        'x-goog-ext-472780938-jspb': 'W1sxMDIsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCwxLFsiQ0wtUnJwbVVoSmdERlRMbmNBSWRfRDQ1c3ciLCIzQjhCMThFQy05Q0FGLTQxMTctOEE5Ni02MkYwNTdGRUI3OEYiXSwxLFsyXV1d',
        'x-goog-ext-477772811-jspb': 'WyJDTC1ScnBtVWhKZ0RGVExuY0FJZF9ENDVzdyIsIjNCOEIxOEVDLTlDQUYtNDExNy04QTk2LTYyRjA1N0ZFQjc4RiJd',
        'Referer': 'https://drive.google.com/',
        'Origin': 'https://drive.google.com',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 15000
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 100)}`));
        }
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.write(payload);
    req.end();
  });
}

async function fetchAllFolderItems(folderId) {
  let allItems = [];
  let token = '';
  let page = 1;

  while (true) {
    try {
      const res = await fetchPage(folderId, token);
      const rawItems = res[0] || [];
      const items = rawItems.map(it => ({
        id: it[0],
        name: it[2],
        mimeType: it[3],
        size: it[13] || 0
      }));

      allItems.push(...items);
      token = res[1];
      if (!token) break;
      page++;
      // Gentle pause between pages of same folder
      if (page > 10) await new Promise(r => setTimeout(r, 50));
    } catch (err) {
      if (err.message.includes('HTTP 400') || err.message.includes('HTTP 403')) {
        await refreshTokens();
        try {
          const retryRes = await fetchPage(folderId, token);
          const rawItems = retryRes[0] || [];
          allItems.push(...rawItems.map(it => ({
            id: it[0],
            name: it[2],
            mimeType: it[3],
            size: it[13] || 0
          })));
          token = retryRes[1];
          if (!token) break;
        } catch (retryErr) {
          console.error(`[Error] Retry failed for folder ${folderId}: ${retryErr.message}`);
          break;
        }
      } else {
        console.error(`[Error] Failed page ${page} of folder ${folderId}: ${err.message}`);
        break;
      }
    }
  }

  // Deduplicate by ID
  const seen = new Set();
  const deduped = [];
  for (const it of allItems) {
    if (!seen.has(it.id)) {
      seen.add(it.id);
      deduped.push(it);
    }
  }
  return deduped;
}

async function mapConcurrent(items, concurrency, fn) {
  let index = 0;
  const workers = Array(concurrency).fill(0).map(async () => {
    while (index < items.length) {
      const i = index++;
      await fn(items[i], i);
    }
  });
  await Promise.all(workers);
}

async function main() {
  console.log('🚀 Starting Deep Pagination Refresh for Google Drive Cache...');
  await refreshTokens();

  // Find all folders needing pagination check
  const targetIds = Object.keys(cache).filter(id => {
    const list = cache[id];
    if (!Array.isArray(list)) return false;
    return list.length === 20 || (list.length >= 50 && list.length % 50 === 0);
  });

  console.log(`Found ${targetIds.length} candidate folders capped at 20 or multiples of 50.`);

  let processed = 0;
  let expandedCount = 0;
  let sameCount = 0;
  let totalNewPages = 0;
  const newSubfolders = new Set();

  const CONCURRENCY = 6;

  await mapConcurrent(targetIds, CONCURRENCY, async (folderId) => {
    const oldLen = cache[folderId].length;
    const items = await fetchAllFolderItems(folderId);
    processed++;

    if (items.length > oldLen) {
      const diff = items.length - oldLen;
      expandedCount++;
      totalNewPages += diff;
      cache[folderId] = items;
      console.log(`[+${diff} items] Folder ${folderId}: ${oldLen} -> ${items.length} items`);
      
      // Check for undiscovered subfolders
      for (const it of items) {
        if (it.mimeType === 'application/vnd.google-apps.folder' && !cache[it.id]) {
          newSubfolders.add(it.id);
        }
      }
    } else if (items.length > 0) {
      cache[folderId] = items;
      sameCount++;
    }

    if (processed % 20 === 0 || processed === targetIds.length) {
      fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
      console.log(`[Progress ${processed}/${targetIds.length}] Expanded: ${expandedCount} (+${totalNewPages} items), Unchanged: ${sameCount}, New Subfolders found: ${newSubfolders.size}`);
    }
  });

  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  console.log(`\n🎉 Phase 1 Complete! Expanded ${expandedCount} folders with +${totalNewPages} new items.`);

  // Phase 2: If any new subfolders were discovered, fetch them too!
  if (newSubfolders.size > 0) {
    console.log(`\n🔍 Phase 2: Processing ${newSubfolders.size} newly discovered subfolders...`);
    const subfolderIds = Array.from(newSubfolders);
    let subProcessed = 0;

    await mapConcurrent(subfolderIds, CONCURRENCY, async (folderId) => {
      const items = await fetchAllFolderItems(folderId);
      subProcessed++;
      cache[folderId] = items;
      if (subProcessed % 20 === 0 || subProcessed === subfolderIds.length) {
        fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
        console.log(`[Subfolders Progress ${subProcessed}/${subfolderIds.length}]`);
      }
    });

    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
    console.log(`\n🎉 Phase 2 Complete! All new subfolders cached.`);
  }

  // Summary stats
  let totalItems = 0;
  for (const id in cache) {
    if (Array.isArray(cache[id])) totalItems += cache[id].length;
  }
  console.log(`\n📊 Final Cache Stats: ${Object.keys(cache).length} folders, ${totalItems} total items cached.`);
}

main().catch(console.error);
