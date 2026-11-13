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
  let t = (raw || '').trim();
  t = t.replace(/\.pdf$/i, '');
  t = t.replace(/\.(zip|rar|7z|cbz|cbr)$/i, '');
  t = t.replace(/\s*\(\d+\)$/, '').trim();

  // Strip leading bracketed author/creator tags: "[Ackerman] ", "[FTL] ", "［ytsnow］", "[SP_XXX]", "[SuperHeather]"
  t = t.replace(/^(\[|［)[^\]］]+(\]|］)[-_ :–—]*/i, '');

  // Strip known author prefixes: "Ackerman - ", "TGTrinity_-_", "PBSHoney2 - ", "FTL - ", "SP_XXX "
  t = t.replace(/^(ackerman|midoriko(\s*kobayashi)?|teysia|tgtrinity|pbshoney\s*\d*|tom\s*reynolds|ftl|lite|ytsnow|zis|sp\s*_?\s*xxx|double_?a4)[-_ :–—]+/i, '');
  t = t.replace(/^[-_ :–—]+/, '').replace(/[-_ :–—]+$/, '').trim();

  // Handle FaceApp encoding glitch: "FaceAppБ─⌠Vol.1..." or "《換臉APP》–Vol.1..."
  const faceAppMatch = t.match(/^(FaceApp|《換臉APP》)/i);
  if (faceAppMatch) return faceAppMatch[1];

  // Handle Phantom Season 2: "Phantom 1-8 - Season 2" -> "Phantom - Season 2"
  const phantomS2 = t.match(/^Phantom(?:\s*\d+\s*-\s*\d+)?[-_ :–—]*(Season\s*\d+)/i);
  if (phantomS2) return `Phantom - ${phantomS2[1]}`;

  // Replace snake_case underscores with spaces if applicable
  if (t.includes('_')) {
    t = t.replace(/_+/g, ' ').trim();
  }

  return t || raw;
}

function extractSeriesAndChapter(cleanT) {
  let s = cleanT.trim();
  if (s.includes('_')) s = s.replace(/_+/g, ' ').trim();

  // If title has "Season X", keep "Season X" in the series title!
  const hasSeason = s.match(/(.*?[-_ :–—]*Season\s*\d+)(.*)/i);
  if (hasSeason) {
    const seriesPrefix = hasSeason[1].trim();
    const rest = hasSeason[2].trim();
    if (!rest) {
      return { seriesTitle: seriesPrefix, chapterTitle: 'Chapter 1', chapterNum: 1 };
    }
    const chM = rest.match(/[-_ :–—]*(?:Chapter|Ch\.?|Part|Eps?\.?|\b)\s*(\d+)/i);
    return {
      seriesTitle: seriesPrefix,
      chapterTitle: chM ? `Chapter ${chM[1]}` : 'Chapter 1',
      chapterNum: chM ? parseInt(chM[1], 10) : 1
    };
  }

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
  const partMatch = s.match(/^(.*?)[-_ :–—]*(?:Part|Eps?\.?|Volume|Vol\.?)\s*(\d+(?:\s*-\s*\d+)?)$/i);
  if (partMatch && partMatch[1].length >= 2) {
    return {
      seriesTitle: partMatch[1].trim().replace(/[-_ :–—]+$/, '').trim(),
      chapterTitle: `Part ${partMatch[2].trim()}`,
      chapterNum: parseFloat(partMatch[2]) || 0
    };
  }

  // Chapter: "Title Chapter 1" or "Title Ch. 2"
  const chMatch = s.match(/^(.*?)[-_ :–—]*(?:Chapter|Ch\.?)\s*(\d+(?:\s*-\s*\d+)?)$/i);
  if (chMatch && chMatch[1].length >= 2) {
    return {
      seriesTitle: chMatch[1].trim().replace(/[-_ :–—]+$/, '').trim(),
      chapterTitle: `Chapter ${chMatch[2].trim()}`,
      chapterNum: parseFloat(chMatch[2]) || 0
    };
  }

  // Range: "Title 1-10", "Title 1-6", "Title 1-7"
  const rangeMatch = s.match(/^(.*?)[-_ :–—]*(\d+\s*-\s*\d+)$/i);
  if (rangeMatch && rangeMatch[1].length >= 2) {
    return {
      seriesTitle: rangeMatch[1].trim().replace(/[-_ :–—]+$/, '').trim(),
      chapterTitle: `Chapter ${rangeMatch[2].trim()}`,
      chapterNum: parseFloat(rangeMatch[2]) || 0
    };
  }

  // Ending number: "Title 01", "Title 2", "Title 41", "Title 42"
  const numEndMatch = s.match(/^(.*?[a-zA-Z\u4e00-\u9fa5]{3,}.*?)[-_ :–—]+0*(\d{1,3})$/);
  if (numEndMatch) {
    return {
      seriesTitle: numEndMatch[1].trim().replace(/[-_ :–—]+$/, '').trim(),
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
  let c = (chTitle || '').trim().replace(/\s*\(\d+\)$/, '').trim();
  c = c.replace(/\.(zip|rar|7z|cbz|cbr|pdf)$/i, '');
  // Strip bracketed author or any tag at start
  c = c.replace(/^(\[|［)[^\]］]+(\]|］)[-_ :–—]*/i, '');
  // Strip author prefix
  c = c.replace(/^(ackerman|midoriko(\s*kobayashi)?|teysia|tgtrinity|pbshoney\s*\d*|tom\s*reynolds|ftl|lite|ytsnow|zis|sp\s*_?\s*xxx|double_?a4)[-_ :–—]+/i, '');
  // Strip series title if present
  if (seriesTitle) {
    const esc = seriesTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    c = c.replace(new RegExp(`^${esc}[-_ :–—]*`, 'i'), '');
    // Also handle generic "Phantom Season 2" or "Season 2"
    c = c.replace(/^(?:Phantom|Season\s*\d+)[-_ :–—]*/i, '');
  }
  c = c.replace(/^[-_ :–—]+/, '').replace(/[-_ :–—]+$/, '').trim();

  // If now it is just a number: "8", "08", "10"
  if (/^\d+$/.test(c)) {
    return `Chapter ${parseInt(c, 10)}`;
  }
  // Range: "1-2", "1-7"
  if (/^\d+\s*-\s*\d+$/.test(c)) {
    return `Chapter ${c}`;
  }
  // "Chapter 2", "Ch 2", "Part 2"
  const m = c.match(/^(?:Chapter|Ch\.?|Part|Eps?\.?)\s*(\d+(?:\.\d+)?)$/i);
  if (m) {
    return `Chapter ${parseFloat(m[1])}`;
  }
  if (c.includes('_')) c = c.replace(/_+/g, ' ').trim();
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

function computeChapterRange(s, uniqueChapters) {
  const orig = s.original_title || '';
  const rawRangeMatch = orig.match(/(?:^|[-_ :–—]+)(\d+\s*-\s*\d+)(?:\.|$)/i) || 
                        orig.match(/\b(?:Part|Ch\.?|Eps?\.?|Vol\.?)\s*(\d+\s*-\s*\d+)/i);

  if (!uniqueChapters || uniqueChapters.length === 0) return '1 Ch';

  if (uniqueChapters.length === 1) {
    const chTitle = uniqueChapters[0].title || '';
    const mRange = chTitle.match(/(\d+\s*-\s*\d+)/);
    if (mRange) return `Ch. ${mRange[1].replace(/\s+/g, '')}`;
    if (rawRangeMatch) return `Ch. ${rawRangeMatch[1].replace(/\s+/g, '')}`;
    if (/^chapter\s*\d+$/i.test(chTitle)) return chTitle.replace(/^chapter\s*/i, 'Ch. ');
    return '1 Ch';
  }

  const nums = [];
  let isPart = false;
  for (const ch of uniqueChapters) {
    if (/part/i.test(ch.title)) isPart = true;
    const m = ch.title.match(/(?:Chapter|Part|Ch\.?|Eps?\.?|\b)\s*(\d+(?:\.\d+)?)/i);
    if (m) nums.push(parseFloat(m[1]));
  }

  if (nums.length >= 2) {
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    const prefix = isPart ? 'Part' : 'Ch.';
    if (min !== max) {
      if (rawRangeMatch) {
        const rawParts = rawRangeMatch[1].split('-').map(x => parseInt(x.trim(), 10));
        if (rawParts[0] <= min && rawParts[1] >= max) {
          return `${prefix} ${rawParts[0]}-${rawParts[1]}`;
        }
      }
      return `${prefix} ${min}-${max}`;
    }
  }

  if (rawRangeMatch) {
    return `Ch. ${rawRangeMatch[1].replace(/\s+/g, '')}`;
  }

  return `${uniqueChapters.length} Ch`;
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
          original_title: it.name.replace(/\.pdf$/i, '').trim(),
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
    const chRange = computeChapterRange(s, uniqueChapters);

    result.push({
      id: s.id,
      folder_id: s.folder_id,
      title: s.title,
      original_title: s.original_title || s.title,
      author: s.author,
      chapter_range: chRange,
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
            chapter_range: o.chapter_range,
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
