import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { promisify } from 'util';

const execAsync = promisify(exec);

const CACHE_FILE = '/Users/reikypratama/.gemini/antigravity/brain/6adc70c4-38a8-45b6-9137-6b5cc6912041/scratch/drive_cache.json';
let cache = {};
if (fs.existsSync(CACHE_FILE)) {
  try {
    cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  } catch {}
}

function saveCache() {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

function fetchPublicFolder(folderId) {
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
        } catch {
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

let isGdriveChecked = false;
let isGdriveWorking = false;

async function checkGdrive() {
  if (isGdriveChecked) return isGdriveWorking;
  isGdriveChecked = true;
  try {
    await execAsync(`gdrive --json readonly ls 1VlH132I8cvt-WVwCO1VEGer3DGJ3UmEd --max 1`, { timeout: 3000 });
    isGdriveWorking = true;
    console.log('✅ gdrive CLI is authenticated and operational.');
  } catch {
    isGdriveWorking = false;
    console.log('ℹ️ gdrive CLI not authenticated, using fast public Drive scraper.');
  }
  return isGdriveWorking;
}

async function listDir(id) {
  if (cache[id] && Array.isArray(cache[id]) && cache[id].length > 0) return cache[id];
  const gdriveOk = await checkGdrive();
  if (gdriveOk) {
    try {
      const { stdout } = await execAsync(`gdrive --json readonly ls "${id}" --max 0`, { maxBuffer: 50 * 1024 * 1024 });
      const parsed = JSON.parse(stdout);
      cache[id] = parsed;
      return parsed;
    } catch {}
  }
  const fallback = await fetchPublicFolder(id);
  if (fallback) {
    cache[id] = fallback;
    return fallback;
  }
  return [];
}

function naturalCompare(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

function normalizeAuthor(raw) {
  let a = (raw || 'Lainnya').trim();
  a = a.replace(/\s*\(\d+\)$/, '');
  if (a.toLowerCase().includes('ackerman')) return 'Ackerman';
  if (a.toLowerCase().includes('midoriko')) return 'Midoriko Kobayashi';
  if (a.toLowerCase().includes('teysia')) return 'Teysia';
  if (a.toLowerCase().includes('tgtrinity')) return 'Tgtrinity';
  if (a.toLowerCase().includes('pbshoney')) return 'PbsHoney';
  if (a.toLowerCase().includes('tom reynolds')) return 'Tom Reynolds';
  if (a.toLowerCase().includes('ftl')) return 'FTL';
  if (a.toLowerCase().includes('lite')) return 'Lite';
  if (a.toLowerCase().includes('ytsnow')) return 'Ytsnow';
  if (a.toLowerCase().includes('zis')) return 'ZIS';
  if (a.toLowerCase().includes('sp xxx')) return 'Sp XXX';
  return a;
}

function cleanTitle(raw, author) {
  let t = raw.trim();
  t = t.replace(/\.pdf$/i, '');
  t = t.replace(/\s*\(\d+\)$/, '').trim();
  const authPattern = new RegExp(`^(\\[?${author}\\]?\\s*[-–—:]?\\s*)`, 'i');
  t = t.replace(authPattern, '');
  t = t.replace(/^\s*[-–—:]\s*/, '').trim();
  return t || raw;
}

function extractSeriesAndChapter(cleanT) {
  let s = cleanT.trim();
  
  // Dot pattern: "Title.Part1" or "Title.Part 1"
  const dotPart = s.match(/^(.*?)\.part\s*(\d+)$/i);
  if (dotPart && dotPart[1].length >= 2) {
    return {
      seriesTitle: dotPart[1].trim(),
      chapterTitle: `Part ${dotPart[2].trim()}`,
      chapterNum: parseInt(dotPart[2], 10)
    };
  }

  // Part / Episode / Volume: "Title Part 1" or "Title Part1"
  const partMatch = s.match(/^(.*?)\s*[-–—:]?\s*(?:Part|Eps?\.?|Volume|Vol\.?)\s*(\d+(?:\s*-\s*\d+)?)$/i);
  if (partMatch && partMatch[1].length >= 2) {
    return {
      seriesTitle: partMatch[1].trim().replace(/\s*[-–—:]$/, '').trim(),
      chapterTitle: `Part ${partMatch[2].trim()}`,
      chapterNum: parseFloat(partMatch[2]) || 0
    };
  }

  // Chapter: "Title Chapter 1" or "Title Ch. 2"
  const chMatch = s.match(/^(.*?)\s*[-–—:]?\s*(?:Chapter|Ch\.?)\s*(\d+(?:\s*-\s*\d+)?)$/i);
  if (chMatch && chMatch[1].length >= 2) {
    return {
      seriesTitle: chMatch[1].trim().replace(/\s*[-–—:]$/, '').trim(),
      chapterTitle: `Chapter ${chMatch[2].trim()}`,
      chapterNum: parseFloat(chMatch[2]) || 0
    };
  }

  // Range: "Title 1-10", "Title 1-6", "Title 1-7"
  const rangeMatch = s.match(/^(.*?)\s*[-–—:]?\s*(\d+\s*-\s*\d+)$/i);
  if (rangeMatch && rangeMatch[1].length >= 2) {
    return {
      seriesTitle: rangeMatch[1].trim().replace(/\s*[-–—:]$/, '').trim(),
      chapterTitle: `Chapter ${rangeMatch[2].trim()}`,
      chapterNum: parseFloat(rangeMatch[2]) || 0
    };
  }

  // Ending number: "Title 01", "Title 2", "Title 41", "Title 42"
  const numEndMatch = s.match(/^(.*?[a-zA-Z\u4e00-\u9fa5]{2,}.*?)\s+[-–—]?\s*0*(\d{1,3})$/);
  if (numEndMatch) {
    return {
      seriesTitle: numEndMatch[1].trim().replace(/\s*[-–—:]$/, '').trim(),
      chapterTitle: `Chapter ${numEndMatch[2]}`,
      chapterNum: parseInt(numEndMatch[2], 10)
    };
  }

  return {
    seriesTitle: s,
    chapterTitle: 'Chapter 1',
    chapterNum: 1
  };
}

function cleanChapterTitle(chTitle, seriesTitle) {
  let c = chTitle.trim().replace(/\s*\(\d+\)$/, '').trim();
  const re = new RegExp(`^${seriesTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[-–—:]?\\s*`, 'i');
  c = c.replace(re, '').trim();
  if (/^\d+$/.test(c)) {
    c = `Chapter ${parseInt(c, 10)}`;
  } else if (/^\d+\s*-\s*\d+$/.test(c)) {
    c = `Chapter ${c}`;
  }
  return c || chTitle;
}

function parseChapterSortKey(title) {
  const m = title.match(/(?:Chapter|Part|Ch\.?|Eps?\.?|\b)\s*(\d+(?:\.\d+)?)/i);
  if (m) return parseFloat(m[1]);
  return 9999;
}

async function extractFolderChapters(folderId, folderName, chapterTitle, seriesTitle, depth = 0) {
  const contents = await listDir(folderId);
  const subFolders = contents
    .filter(c => c.mimeType === 'application/vnd.google-apps.folder')
    .sort((a, b) => naturalCompare(a.name, b.name));
  const directFiles = contents
    .filter(c => c.mimeType !== 'application/vnd.google-apps.folder' && c.name !== '.DS_Store');

  const directImages = directFiles
    .filter(p => !p.name.startsWith('.') && (p.mimeType?.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(p.name)))
    .sort((a, b) => naturalCompare(a.name, b.name));

  const directPdfs = directFiles
    .filter(p => p.name.toLowerCase().endsWith('.pdf') || p.mimeType === 'application/pdf')
    .sort((a, b) => naturalCompare(a.name, b.name));

  const directArchives = directFiles
    .filter(p => /\.(zip|rar|7z|cbz|cbr)$/i.test(p.name));

  // Check if there is a "Panels", "Images", "Pages", "Scans" subfolder
  const panelsFolder = subFolders.find(s => /^(panels|images|pages|scans)$/i.test(s.name));
  let bestImages = directImages;
  if (panelsFolder) {
    const panelsContents = await listDir(panelsFolder.id);
    const panelsImages = panelsContents
      .filter(p => !p.name.startsWith('.') && (p.mimeType?.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(p.name)))
      .sort((a, b) => naturalCompare(a.name, b.name));
    if (panelsImages.length > bestImages.length) {
      bestImages = panelsImages;
    }
  }

  // The real subfolders excluding panels folder
  const realSubfolders = subFolders.filter(s => !/^(panels|images|pages|scans)$/i.test(s.name));

  if (realSubfolders.length > 0) {
    const chapters = [];
    if (bestImages.length > 0 && !panelsFolder) {
      chapters.push({
        id: `ch_${folderId.slice(0, 10)}`,
        folder_id: folderId,
        title: cleanChapterTitle(chapterTitle || folderName, seriesTitle),
        is_pdf: false,
        page_count: bestImages.length,
        pages: bestImages.map(p => p.id)
      });
    }

    for (const sub of realSubfolders) {
      const subChapters = await extractFolderChapters(sub.id, sub.name, sub.name, seriesTitle, depth + 1);
      chapters.push(...subChapters);
    }
    return chapters;
  }

  // Leaf folder
  const chapters = [];
  if (bestImages.length > 0) {
    chapters.push({
      id: `ch_${folderId.slice(0, 10)}`,
      folder_id: folderId,
      title: cleanChapterTitle(chapterTitle || folderName, seriesTitle),
      is_pdf: false,
      page_count: bestImages.length,
      pages: bestImages.map(p => p.id)
    });
  } else if (directPdfs.length > 0) {
    for (const dp of directPdfs) {
      chapters.push({
        id: `ch_${dp.id.slice(0, 10)}`,
        folder_id: folderId,
        title: dp.name.replace(/\.pdf$/i, ''),
        is_pdf: true,
        pdf_file_id: dp.id,
        page_count: 1,
        pages: []
      });
    }
  } else if (directArchives.length > 0) {
    for (const da of directArchives) {
      chapters.push({
        id: `ch_${da.id.slice(0, 10)}`,
        folder_id: folderId,
        file_id: da.id,
        title: da.name.replace(/\.(zip|rar|7z|cbz|cbr)$/i, ''),
        is_pdf: false,
        is_archive: true,
        page_count: 0,
        pages: []
      });
    }
  } else if (depth === 0) {
    chapters.push({
      id: `ch_${folderId.slice(0, 10)}`,
      folder_id: folderId,
      title: cleanChapterTitle(chapterTitle || folderName, seriesTitle),
      is_pdf: false,
      is_archive: true,
      page_count: 0,
      pages: []
    });
  }
  return chapters;
}

async function main() {
  console.log('🚀 Starting Google Drive Comic Scanner (Series Grouping)...');
  const komikListId = '1VlH132I8cvt-WVwCO1VEGer3DGJ3UmEd';
  const komikPart2Id = '1rSKe7r8CYwMwaetPgSukIqhA4ukMYxmZ';

  const [list1Authors, list2Authors] = await Promise.all([
    listDir(komikListId),
    listDir(komikPart2Id)
  ]);

  const authorFolders = [
    ...list1Authors.filter(a => a.mimeType === 'application/vnd.google-apps.folder'),
    ...list2Authors.filter(a => a.mimeType === 'application/vnd.google-apps.folder')
  ];

  console.log(`Found ${authorFolders.length} author directories to scan.`);

  const seriesMap = new Map();

  let afIndex = 0;
  for (const af of authorFolders) {
    afIndex++;
    const author = normalizeAuthor(af.name);
    const items = await listDir(af.id);
    console.log(`[Author ${afIndex}/${authorFolders.length}] Scanning ${af.name} (${items.length} items)...`);

    for (const it of items) {
      if (it.name === '.DS_Store') continue;
      const cleanT = cleanTitle(it.name, author);
      const { seriesTitle, chapterTitle, chapterNum } = extractSeriesAndChapter(cleanT);
      const seriesKey = `${author.toLowerCase()}:::${seriesTitle.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

      if (!seriesMap.has(seriesKey)) {
        seriesMap.set(seriesKey, {
          id: `comic_${it.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)}`,
          folder_id: it.id,
          title: seriesTitle,
          author,
          cover_file_id: it.id,
          chapters: []
        });
      }
      const seriesObj = seriesMap.get(seriesKey);

      const isFolder = it.mimeType === 'application/vnd.google-apps.folder';
      const isPdf = it.name.toLowerCase().endsWith('.pdf') || it.mimeType === 'application/pdf';

      if (isPdf) {
        seriesObj.chapters.push({
          id: `ch_${it.id.slice(0, 10)}`,
          folder_id: it.id,
          title: cleanChapterTitle(chapterTitle, seriesTitle),
          is_pdf: true,
          pdf_file_id: it.id,
          page_count: 1,
          pages: []
        });
      } else if (isFolder) {
        const extracted = await extractFolderChapters(it.id, it.name, chapterTitle, seriesTitle);
        seriesObj.chapters.push(...extracted);
      }
    }
  }

  const result = [];
  for (const s of seriesMap.values()) {
    if (s.chapters.length === 0) continue;

    // Deduplicate chapters by normalized title
    const chMap = new Map();
    for (const ch of s.chapters) {
      const chKey = ch.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!chMap.has(chKey)) {
        chMap.set(chKey, ch);
      } else {
        const existing = chMap.get(chKey);
        if (ch.page_count > existing.page_count) {
          chMap.set(chKey, ch);
        }
      }
    }

    const uniqueChapters = Array.from(chMap.values());
    uniqueChapters.sort((a, b) => {
      const keyA = parseChapterSortKey(a.title);
      const keyB = parseChapterSortKey(b.title);
      if (keyA !== keyB) return keyA - keyB;
      return naturalCompare(a.title, b.title);
    });

    if (uniqueChapters.length === 1 && (uniqueChapters[0].title === 'Main Chapter' || uniqueChapters[0].title === '')) {
      uniqueChapters[0].title = 'Chapter 1';
    }

    const totalPages = uniqueChapters.reduce((sum, ch) => sum + ch.page_count, 0);
    const firstImage = uniqueChapters.find(ch => !ch.is_pdf && ch.pages?.length > 0)?.pages[0];
    const firstPdf = uniqueChapters.find(ch => ch.is_pdf)?.pdf_file_id;
    const coverId = firstImage ? (typeof firstImage === 'string' ? firstImage : firstImage.id) : (firstPdf || s.cover_file_id);
    const isAllPdf = uniqueChapters.every(ch => ch.is_pdf);

    result.push({
      id: s.id,
      folder_id: s.folder_id,
      title: s.title,
      author: s.author,
      is_pdf: isAllPdf,
      pdf_file_id: isAllPdf ? (firstPdf || null) : null,
      cover_file_id: coverId,
      page_count: totalPages,
      chapters_count: uniqueChapters.length,
      is_multi_chapter: uniqueChapters.length > 1,
      chapters: uniqueChapters
    });
  }

  result.sort((a, b) => {
    if (a.author !== b.author) return a.author.localeCompare(b.author);
    return a.title.localeCompare(b.title);
  });

  // Tag duplicate series clearly so user knows there are multiple versions
  function cleanForDuplicate(title) {
    return (title || '').toLowerCase()
      .replace(/\[.*?\]|\(.*?\)/g, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();
  }

  const dupGroups = new Map();
  for (const s of result) {
    const k = cleanForDuplicate(s.title);
    if (!k) continue;
    if (!dupGroups.has(k)) dupGroups.set(k, []);
    dupGroups.get(k).push(s);
  }

  let dupCount = 0;
  for (const [k, list] of dupGroups.entries()) {
    if (list.length > 1) {
      dupCount += list.length;
      for (const item of list) {
        item.is_duplicate = true;
        item.duplicate_group = k;
        item.duplicate_count = list.length;
        item.duplicate_badge = `Versi ${item.author}`;
        item.duplicate_others = list
          .filter(o => o.id !== item.id)
          .map(o => ({
            id: o.id,
            title: o.title,
            author: o.author,
            page_count: o.page_count,
            chapters_count: o.chapters_count
          }));
      }
    }
  }
  console.log(`🏷️ Tagged ${dupCount} duplicate/alternative version series across ${dupGroups.size} groups.`);

  console.log(`\n🎉 Completed! Exporting ${result.length} unique comic series to public/appVideo/comics.json`);

  const outPath = '/Users/reikypratama/PortoFolio copy/public/appVideo/comics.json';
  fs.writeFileSync(outPath, JSON.stringify(result));
  saveCache();
  console.log(`Written ${outPath} (${(fs.statSync(outPath).size / 1024).toFixed(1)} KB)`);

  const syncPath = '/Users/reikypratama/Random/comics.json';
  try {
    fs.writeFileSync(syncPath, JSON.stringify(result));
    console.log(`Synced to ${syncPath}`);
  } catch (err) {
    console.warn('Failed to sync to Random:', err.message);
  }
}

main().catch(console.error);
