import https from 'https';
import fs from 'fs';

const CACHE_FILE = '/Users/reikypratama/.gemini/antigravity/brain/6adc70c4-38a8-45b6-9137-6b5cc6912041/scratch/drive_cache.json';
let cache = {};
if (fs.existsSync(CACHE_FILE)) {
  cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
}

function getFolderItems(folderId) {
  return new Promise((resolve) => {
    const req = https.get('https://drive.google.com/drive/folders/' + folderId, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 15000
    }, (res) => {
      let html = '';
      res.on('data', chunk => html += chunk);
      res.on('end', () => {
        const marker = "_DRIVE_ivd'] = '";
        const start = html.indexOf(marker);
        if (start === -1) return resolve(null);
        const strStart = start + marker.length;
        const end = html.indexOf("';", strStart);
        if (end === -1) return resolve(null);
        const raw = html.slice(strStart, end);
        try {
          const unescaped = raw.replace(/\\x([0-9a-fA-F]{2})/g, (m, h) => String.fromCharCode(parseInt(h, 16)));
          const data = JSON.parse(unescaped);
          const items = [];
          if (Array.isArray(data) && Array.isArray(data[0])) {
            for (const item of data[0]) {
              if (Array.isArray(item) && item.length > 3) {
                items.push({
                  id: item[0],
                  name: item[2],
                  mimeType: item[3],
                  size: item[13] || 0
                });
              }
            }
          }
          resolve(items);
        } catch (e) {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
  });
}

async function mapConcurrent(items, concurrency, fn) {
  const results = [];
  let index = 0;
  const workers = Array(concurrency).fill(0).map(async () => {
    while (index < items.length) {
      const i = index++;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

async function main() {
  console.log('🚀 Starting Google Drive Cache Refresh (Fixing 20-item cutoff)...');
  const targetIds = Object.keys(cache).filter(id => Array.isArray(cache[id]) && cache[id].length === 20);
  console.log(`Found ${targetIds.length} folders currently capped at exactly 20 items.`);

  let updatedCount = 0;
  let sameCount = 0;
  let failCount = 0;
  let processed = 0;

  await mapConcurrent(targetIds, 6, async (folderId) => {
    const items = await getFolderItems(folderId);
    processed++;
    if (items) {
      if (items.length > 20) {
        cache[folderId] = items;
        updatedCount++;
      } else {
        sameCount++;
      }
    } else {
      failCount++;
    }

    if (processed % 25 === 0 || processed === targetIds.length) {
      fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
      console.log(`[Progress ${processed}/${targetIds.length}] Updated: ${updatedCount}, Unchanged: ${sameCount}, Failed: ${failCount}`);
    }
  });

  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  console.log(`\n🎉 Refresh Finished! Total updated folders: ${updatedCount}/${targetIds.length}`);
}

main().catch(console.error);
