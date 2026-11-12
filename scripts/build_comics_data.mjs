import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
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

async function listDir(id) {
  if (cache[id]) return cache[id];
  try {
    const { stdout } = await execAsync(`gdrive --json readonly ls "${id}"`, { maxBuffer: 10 * 1024 * 1024 });
    const parsed = JSON.parse(stdout);
    cache[id] = parsed;
    return parsed;
  } catch (err) {
    console.warn(`Failed to list dir ${id}: ${err.message}`);
    return [];
  }
}

async function mapConcurrent(items, concurrency, fn) {
  const results = [];
  let index = 0;
  const workers = Array(concurrency).fill(0).map(async () => {
    while (index < items.length) {
      const i = index++;
      try {
        results[i] = await fn(items[i], i);
      } catch (e) {
        results[i] = null;
      }
    }
  });
  await Promise.all(workers);
  return results;
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
  const authPattern = new RegExp(`^(\\[?${author}\\]?\\s*[-–—:]?\\s*)`, 'i');
  t = t.replace(authPattern, '');
  t = t.replace(/^\s*[-–—:]\s*/, '').trim();
  return t || raw;
}

async function main() {
  console.log('🚀 Starting Google Drive Comic Scanner...');
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

  // List all comic items across all authors
  const allComicItems = [];
  for (const af of authorFolders) {
    const normAuth = normalizeAuthor(af.name);
    const items = await listDir(af.id);
    for (const it of items) {
      if (it.name === '.DS_Store') continue;
      allComicItems.push({
        author: normAuth,
        item: it
      });
    }
  }

  console.log(`Found ${allComicItems.length} comic items. Scanning chapters & pages (concurrency: 6)...`);

  let processedCount = 0;
  const processedComics = await mapConcurrent(allComicItems, 6, async ({ author, item }) => {
    const isFolder = item.mimeType === 'application/vnd.google-apps.folder';
    const isPdf = item.name.toLowerCase().endsWith('.pdf') || item.mimeType === 'application/pdf';

    const comicId = `comic_${item.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)}`;
    const title = cleanTitle(item.name, author);

    if (isPdf) {
      processedCount++;
      return {
        id: comicId,
        drive_folder_id: item.id,
        title,
        author,
        is_pdf: true,
        pdf_file_id: item.id,
        cover_file_id: item.id,
        page_count: 1,
        chapters: [
          {
            id: `${comicId}_ch1`,
            title: 'Full Comic (PDF)',
            is_pdf: true,
            pdf_file_id: item.id,
            page_count: 1,
            pages: []
          }
        ]
      };
    }

    if (isFolder) {
      const contents = await listDir(item.id);
      const subFolders = contents.filter(c => c.mimeType === 'application/vnd.google-apps.folder');
      const directFiles = contents.filter(c => c.mimeType !== 'application/vnd.google-apps.folder' && c.name !== '.DS_Store');

      let chapters = [];

      if (subFolders.length > 0) {
        // Multi-chapter folder: each subfolder is a chapter
        subFolders.sort((a, b) => naturalCompare(a.name, b.name));
        for (let chIdx = 0; chIdx < subFolders.length; chIdx++) {
          const sub = subFolders[chIdx];
          const subContents = await listDir(sub.id);
          const subPdfs = subContents.filter(p => p.name.toLowerCase().endsWith('.pdf'));
          const subImages = subContents
            .filter(p => !p.name.startsWith('.') && (p.mimeType?.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(p.name)))
            .sort((a, b) => naturalCompare(a.name, b.name));

          if (subImages.length > 0) {
            chapters.push({
              id: `${comicId}_ch${chIdx + 1}`,
              title: sub.name,
              is_pdf: false,
              page_count: subImages.length,
              pages: subImages.map(p => ({ id: p.id, name: p.name, size: p.size }))
            });
          } else if (subPdfs.length > 0) {
            for (const sp of subPdfs) {
              chapters.push({
                id: `${comicId}_ch_${sp.id.slice(0, 8)}`,
                title: `${sub.name} - ${sp.name.replace(/\.pdf$/i, '')}`,
                is_pdf: true,
                pdf_file_id: sp.id,
                page_count: 1,
                pages: []
              });
            }
          }
        }
      }

      // Check direct files (images or PDFs)
      const directImages = directFiles
        .filter(p => !p.name.startsWith('.') && (p.mimeType?.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(p.name)))
        .sort((a, b) => naturalCompare(a.name, b.name));

      const directPdfs = directFiles
        .filter(p => p.name.toLowerCase().endsWith('.pdf') || p.mimeType === 'application/pdf')
        .sort((a, b) => naturalCompare(a.name, b.name));

      if (directImages.length > 0) {
        chapters.push({
          id: `${comicId}_ch_main`,
          title: chapters.length > 0 ? 'Main Chapter' : 'Chapter 1',
          is_pdf: false,
          page_count: directImages.length,
          pages: directImages.map(p => ({ id: p.id, name: p.name, size: p.size }))
        });
      }

      if (directPdfs.length > 0) {
        for (const dp of directPdfs) {
          chapters.push({
            id: `${comicId}_pdf_${dp.id.slice(0, 8)}`,
            title: dp.name.replace(/\.pdf$/i, ''),
            is_pdf: true,
            pdf_file_id: dp.id,
            page_count: 1,
            pages: []
          });
        }
      }

      // Filter out comics with 0 chapters
      if (chapters.length === 0) {
        processedCount++;
        return null;
      }

      // Calculate total page count and cover
      const totalPages = chapters.reduce((sum, ch) => sum + ch.page_count, 0);
      const firstImage = chapters.find(ch => !ch.is_pdf && ch.pages?.length > 0)?.pages[0];
      const firstPdf = chapters.find(ch => ch.is_pdf)?.pdf_file_id;
      const coverId = firstImage ? firstImage.id : (firstPdf || item.id);
      const isAllPdf = chapters.every(ch => ch.is_pdf);

      processedCount++;
      if (processedCount % 25 === 0 || processedCount === allComicItems.length) {
        console.log(`[${processedCount}/${allComicItems.length}] Processed "${title}" (${totalPages} pages, ${chapters.length} chapters)`);
        saveCache();
      }

      return {
        id: comicId,
        drive_folder_id: item.id,
        title,
        author,
        is_pdf: isAllPdf,
        pdf_file_id: isAllPdf ? (firstPdf || null) : null,
        cover_file_id: coverId,
        page_count: totalPages,
        chapters
      };
    }

    return null;
  });

  const validComics = processedComics.filter(Boolean);

  // Deduplicate by normalized (author + title)
  const uniqueMap = new Map();
  for (const c of validComics) {
    const key = `${c.author.toLowerCase()}:::${c.title.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, c);
    } else {
      const existing = uniqueMap.get(key);
      if (c.page_count > existing.page_count) {
        uniqueMap.set(key, c);
      }
    }
  }

  const finalComics = Array.from(uniqueMap.values());
  finalComics.sort((a, b) => {
    if (a.author !== b.author) return a.author.localeCompare(b.author);
    return a.title.localeCompare(b.title);
  });

  console.log(`\n🎉 Completed! Exporting ${finalComics.length} unique comics to public/appVideo/comics.json`);

  const outPath = '/Users/reikypratama/PortoFolio copy/public/appVideo/comics.json';
  fs.writeFileSync(outPath, JSON.stringify(finalComics, null, 2));
  saveCache();
  console.log(`Written ${outPath} (${(fs.statSync(outPath).size / 1024).toFixed(1)} KB)`);
}

main().catch(console.error);
