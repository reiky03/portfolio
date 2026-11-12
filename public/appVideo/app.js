// ============================================================
// STATE, SAFE RENDERING & MEDIA HELPERS
// ============================================================
const STREAM_PROXY_BASE = 'https://test-worker.big-marigold.workers.dev';
const GDRIVE_USER_DATA_FOLDER_ID = '1w3bQfcfdqc4-MfqbmHJ17JC-fhOTRR3W';
const DEFAULT_CLOUD_SYNC_ENDPOINT = 'https://script.google.com/macros/s/AKfycbw-Ieo4sptsXWwM8PkhNED2XMMsGXSwqLDKCX_JqIW3qVeppcp9NH2ay_bby_4aYEAbGw/exec';

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function thumbUrl(gdriveFileId, width = 480) {
  return gdriveFileId ? `https://lh3.googleusercontent.com/d/${gdriveFileId}=w${width}` : '';
}

const SVG_ICONS = {
  'sparkles': '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>',
  'bookmark': '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>',
  'bookmark-x': '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z"/><path d="m14.5 7.5-5 5"/><path d="m9.5 7.5 5 5"/>',
  'heart': '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  'heart-off': '<line x1="2" y1="2" x2="22" y2="22"/><path d="M16.5 16.5 12 21l-7-7c-1.5-1.45-3-3.2-3-5.5a5.5 5.5 0 0 1 2.14-4.35"/><path d="M8.76 3.1c1.15.22 2.13.78 3.24 1.9 1.5-1.5 2.74-2 4.5-2A5.5 5.5 0 0 1 22 8.5c0 2.12-1.3 3.78-2.67 5.17"/>',
  'chevron-right': '<path d="m9 18 6-6-6-6"/>',
  'arrow-left': '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  'arrow-right': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  'play': '<polygon points="6 3 20 12 6 21 6 3"/>',
  'pause': '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
  'skip-back': '<polygon points="19 20 9 12 19 4 19 20"/><line x1="5" x2="5" y1="19" y2="5"/>',
  'skip-forward': '<polygon points="5 4 15 12 5 20 5 4"/><line x1="19" x2="19" y1="5" y2="19"/>',
  'volume-2': '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>',
  'volume-x': '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/>',
  'wifi-off': '<path d="M12 20h.01"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/><path d="M5 12.859a10 10 0 0 1 5.17-2.69"/><path d="M19 12.859a10 10 0 0 0-2.007-1.523"/><path d="M2 8.82a15 15 0 0 1 4.177-2.643"/><path d="M22 8.82a15 15 0 0 0-11.288-3.764"/><path d="m2 2 20 20"/>',
  'rotate-cw': '<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>',
  'maximize': '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
  'minimize': '<path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>',
  'list-video': '<path d="M12 12H3"/><path d="M16 6H3"/><path d="M12 18H3"/><path d="m16 12 5 3-5 3v-6Z"/>',
  'send': '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  'folder': '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  'folder-heart': '<path d="M11 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v1.5"/><path d="M13.9 17.45c-1.2-1.2-1.14-2.8-.2-3.73a2.43 2.43 0 0 1 3.44 0l.36.34.34-.34a2.43 2.43 0 0 1 3.45-.01c.95.95 1 2.53-.2 3.74L17.5 21Z"/>',
  'plus': '<path d="M5 12h14"/><path d="M12 5v14"/>',
  'trash-2': '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
  'check': '<path d="M20 6 9 17l-5-5"/>',
  'clapperboard': '<path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z"/><path d="m6.2 5.3 3.1 3.9"/><path d="m12.4 3.4 3.1 4"/><path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
  'video-off': '<path d="M10.66 6H14a2 2 0 0 1 2 2v2.5l5.248-3.062A.5.5 0 0 1 22 7.87v8.196"/><path d="M16 16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2"/><path d="m2 2 20 20"/>',
  'search-x': '<path d="m13.5 8.5-5 5"/><path d="m8.5 8.5 5 5"/><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  'flame': '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  'alert-circle': '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>',
  'cloud': '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
  'cloud-check': '<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="m9 15 2 2 4-4"/>',
  'log-out': '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
  'arrow-down-up': '<path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/>',
  'smartphone': '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
  'mail': '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  'copy': '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  'download': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
  'upload': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
  'link': '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  'refresh-cw': '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  'lock': '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  'unlock': '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
  'shuffle': '<path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"/><path d="m18 2 4 4-4 4"/><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/><path d="m18 14 4 4-4 4"/>',
  'book-open': '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  'scroll': '<path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/>',
  'layers': '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>'
};

function iconSvg(name, cls = 'w-4 h-4') {
  const paths = SVG_ICONS[name] || SVG_ICONS['sparkles'];
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
}

function playVideoSafely(video, onPlaying = null) {
  if (!video) return;
  video.muted = isMuted;
  const p = video.play();
  if (p && typeof p.then === 'function') {
    p.then(() => {
      if (!isMuted && !video.muted) {
        awaitingAudioUnlock = false;
        hideUnmuteBanner();
      }
      if (onPlaying) onPlaying(true);
    }).catch((err) => {
      if (err && err.name === 'AbortError') {
        if (onPlaying) onPlaying(false);
        return;
      }
      if (!video.muted) {
        video.muted = true;
        awaitingAudioUnlock = true;
        showUnmuteBanner();
        video.play()
          .then(() => {
            showUnmuteBanner();
            if (onPlaying) onPlaying(true);
          })
          .catch(() => {
            if (onPlaying) onPlaying(false);
          });
      } else if (onPlaying) {
        onPlaying(false);
      }
    });
  }
}

let allVideos = [];
let allTopics = [];
let allDramas = [];
let allAdultVideos = [];
let currentTopicId = 0;
let isTopicShuffled = localStorage.getItem('teleshorts_topic_shuffle') !== '0';

function getAllCatalogMedia() {
  return [...allDramas, ...allAdultVideos];
}

// Default suara aktif kecuali user secara eksplisit menekan Mute ('0');
// jika browser memblokir autoplay bersuara sebelum ketukan pertama, awaitingAudioUnlock menandakan butuh 1x ketukan.
let isMuted = localStorage.getItem('teleshorts_unmuted') === '0';
let awaitingAudioUnlock = false;
let pendingAudioVerifyUntil = 0;
let activeView = 'shorts'; // 'shorts' | 'drama' | 'adult18' | 'profile'
let profileTab = 'likes';   // 'likes' | 'shorts' | 'drama'

let currentPlayingShortVideo = null;
let shortsObserver = null;

let selectedDrama = null;
let currentPlayingDrama = null;
let currentReelEpisodeIndex = 0;
let dramaReelObserver = null;
let currentGenreFilter = 'all';
let currentAdultCategoryFilter = 'all';

// Urutan Drama, 18+ & Komik
let currentDramaSort = localStorage.getItem('teleshorts_drama_sort') || 'random';
let currentAdultSort = localStorage.getItem('teleshorts_adult_sort') || 'random';
let currentComicSort = localStorage.getItem('teleshorts_comic_sort') || 'random';
let currentComicAuthor = 'all';
let allComics = [];
let activeComic = null;
let currentComicChapterIndex = 0;
let currentComicPageIndex = 0;
let comicReaderMode = localStorage.getItem('teleshorts_comic_mode') || 'webtoon'; // 'webtoon' | 'swap'
let comicReaderOrientation = localStorage.getItem('teleshorts_comic_orientation') || 'portrait'; // 'portrait' | 'landscape'
let isComicScrubbing = false;
let comicScrubbingTimer = null;
let comicScrollRaf = null;
let isComicInitializing = false;
let comicSwapZoomLevel = 1;
let lastSwapTapTime = 0;

// Akun Google & Cloud Sync
let currentUser = JSON.parse(localStorage.getItem('teleshorts_google_user') || 'null');
let syncDebounceTimer = null;

// Sets in LocalStorage
let likedVideoIds = new Set(JSON.parse(localStorage.getItem('teleshorts_likes') || '[]'));
let savedShortIds = new Set(JSON.parse(localStorage.getItem('teleshorts_saved_shorts') || '[]'));
let savedDramaIds = new Set(JSON.parse(localStorage.getItem('teleshorts_saved_dramas') || '[]'));

// Melolo-style per-episode like storage: Set of "dramaId_ep_X" (e.g. "drm_1_ep_1")
let likedEpisodeKeys = new Set(JSON.parse(localStorage.getItem('teleshorts_liked_episodes') || '[]'));

// TikTok-style Custom Collections storage
let customCollections = [];
let currentViewingCollectionId = null;
let currentManagingVideoId = null;

function loadCollections() {
  try {
    const raw = localStorage.getItem('teleshorts_custom_collections');
    if (raw) customCollections = JSON.parse(raw);
  } catch (e) {
    customCollections = [];
  }
  let defaultCol = customCollections.find(c => c.id === 'col_default');
  if (!defaultCol) {
    defaultCol = {
      id: 'col_default',
      name: 'Semua Tersimpan',
      videoIds: Array.from(savedShortIds),
      isDefault: true,
      createdAt: 0
    };
    customCollections.unshift(defaultCol);
  } else {
    savedShortIds.forEach(id => {
      if (!defaultCol.videoIds.includes(id)) defaultCol.videoIds.push(id);
    });
  }
  persistCollections();
}

function persistCollections() {
  localStorage.setItem('teleshorts_custom_collections', JSON.stringify(customCollections));
  savedShortIds.clear();
  customCollections.forEach(col => {
    col.videoIds.forEach(vid => savedShortIds.add(vid));
  });
  localStorage.setItem('teleshorts_saved_shorts', JSON.stringify(Array.from(savedShortIds)));
  updateStatsDisplay();
  queueCloudSync();
}

function createNewCollection(name, initialVideoId = null) {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const colId = 'col_' + Date.now();
  const newCol = {
    id: colId,
    name: trimmed,
    videoIds: initialVideoId ? [initialVideoId] : [],
    isDefault: false,
    createdAt: Date.now()
  };
  customCollections.push(newCol);
  if (initialVideoId) {
    savedShortIds.add(initialVideoId);
    const def = customCollections.find(c => c.id === 'col_default');
    if (def && !def.videoIds.includes(initialVideoId)) {
      def.videoIds.push(initialVideoId);
    }
  }
  persistCollections();
  return newCol;
}

function deleteCollection(colId) {
  if (colId === 'col_default') return false;
  customCollections = customCollections.filter(c => c.id !== colId);
  persistCollections();
  return true;
}

function toggleVideoInCollection(colId, videoId) {
  const col = customCollections.find(c => c.id === colId);
  if (!col) return false;
  const idx = col.videoIds.indexOf(videoId);
  if (idx > -1) {
    col.videoIds.splice(idx, 1);
  } else {
    col.videoIds.push(videoId);
  }

  const isPresentInAny = customCollections.some(c => c.videoIds.includes(videoId));
  const def = customCollections.find(c => c.id === 'col_default');
  if (isPresentInAny) {
    if (def && !def.videoIds.includes(videoId)) def.videoIds.push(videoId);
    savedShortIds.add(videoId);
  } else {
    if (def) def.videoIds = def.videoIds.filter(id => id !== videoId);
    savedShortIds.delete(videoId);
  }
  persistCollections();
  return col.videoIds.includes(videoId);
}

function persistStorage() {
  localStorage.setItem('teleshorts_likes', JSON.stringify([...likedVideoIds]));
  localStorage.setItem('teleshorts_saved_shorts', JSON.stringify([...savedShortIds]));
  localStorage.setItem('teleshorts_saved_dramas', JSON.stringify([...savedDramaIds]));
  localStorage.setItem('teleshorts_liked_episodes', JSON.stringify([...likedEpisodeKeys]));
  updateStatsDisplay();
  queueCloudSync();
}

function isEpisodeLiked(dramaId, epNum) {
  return likedEpisodeKeys.has(`${dramaId}_ep_${epNum}`);
}

function toggleEpisodeLike(dramaId, epNum, heartIconEl = null, labelEl = null) {
  const key = `${dramaId}_ep_${epNum}`;
  const isNowLiked = !likedEpisodeKeys.has(key);

  if (isNowLiked) {
    likedEpisodeKeys.add(key);
    triggerHaptic('success');
  } else {
    likedEpisodeKeys.delete(key);
    triggerHaptic('light');
  }

  persistStorage();

  if (heartIconEl) {
    if (heartIconEl.tagName && heartIconEl.tagName.toLowerCase() === 'svg') {
      heartIconEl.setAttribute('fill', isNowLiked ? '#f43f5e' : 'none');
      heartIconEl.setAttribute('stroke', isNowLiked ? '#f43f5e' : 'currentColor');
    }
    heartIconEl.classList.toggle('text-rose-500', isNowLiked);
    heartIconEl.classList.toggle('fill-rose-500', isNowLiked);
    heartIconEl.classList.toggle('text-white', !isNowLiked);
  }
  if (labelEl) {
    labelEl.textContent = isNowLiked ? 'Disukai' : 'Suka';
    labelEl.classList.toggle('text-rose-400', isNowLiked);
    labelEl.classList.toggle('text-zinc-200', !isNowLiked);
  }

  // Refresh badges only for open containers + update single drama card in-place
  if (selectedDrama && selectedDrama.id === dramaId && dramaDetailModal && !dramaDetailModal.classList.contains('hidden')) {
    renderModalEpisodes(selectedDrama);
  }
  if (reelEpSheet && !reelEpSheet.classList.contains('hidden')) {
    renderReelSheetGrid();
  }
  const targetDrm = getAllCatalogMedia().find(d => d.id === dramaId);
  if (targetDrm) {
    let likedEpCount = 0;
    if (targetDrm.episodes) {
      targetDrm.episodes.forEach(e => {
        if (isEpisodeLiked(targetDrm.id, e.ep)) likedEpCount++;
      });
    }
    [dramaListGrid, adult18ListGrid].forEach(grid => {
      const card = grid?.querySelector(`[data-drama-id="${dramaId}"]`);
      const badgeEl = card?.querySelector('.drama-liked-ep-badge');
      if (badgeEl) {
        if (likedEpCount > 0) {
          badgeEl.classList.remove('hidden');
          badgeEl.innerHTML = `<span>❤️</span> ${likedEpCount} ${targetDrm.total_episodes === 1 ? 'Disukai' : 'Ep Disukai'}`;
        } else {
          badgeEl.classList.add('hidden');
        }
      }
    });
  }
}

function syncCatalogBookmarkIcons(itemId, isSaved) {
  [dramaListGrid, adult18ListGrid].forEach(grid => {
    const btn = grid?.querySelector(`[data-drama-id="${itemId}"] .drama-quick-save`);
    if (btn) {
      btn.innerHTML = iconSvg('bookmark', `w-3.5 h-3.5 ${isSaved ? 'text-sky-400 fill-sky-400' : 'text-white'}`);
    }
  });
}

// ============================================================
// TELEGRAM WEBAPP SDK
// ============================================================
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  if (tg.setHeaderColor) tg.setHeaderColor('#000000');
  if (tg.setBackgroundColor) tg.setBackgroundColor('#000000');

  const tgUser = tg.initDataUnsafe?.user;
  if (tgUser) {
    const displayName = tgUser.first_name + (tgUser.last_name ? ' ' + tgUser.last_name : '');
    const username = tgUser.username ? '@' + tgUser.username : '@' + tgUser.first_name.toLowerCase();
    
    document.getElementById('profile-name').textContent = displayName;
    document.getElementById('profile-handle').textContent = username;
    document.getElementById('profile-display-name').querySelector('span').textContent = username;
    if (tgUser.photo_url) {
      document.getElementById('profile-avatar-img').src = tgUser.photo_url;
    }
  }
}

function triggerHaptic(type = 'light') {
  try {
    if (tg?.HapticFeedback) {
      if (type === 'light') tg.HapticFeedback.impactOccurred('light');
      else if (type === 'medium') tg.HapticFeedback.impactOccurred('medium');
      else if (type === 'success') tg.HapticFeedback.notificationOccurred('success');
    }
  } catch (e) {}
}

// ============================================================
// FALLBACK DATA
// ============================================================
const FALLBACK_DATA = {
  topics: [
    { id: 0, name: "🔥 Semua Video (Untuk Anda)", count: "Semua Kategori" },
    { id: 1, name: "✨ Topik 1 - Tren Viral", count: "~200 video" },
    { id: 2, name: "🎭 Topik 2 - Drama & Cerita", count: "~200 video" },
    { id: 3, name: "🎬 Topik 3 - Sinematik & Estetik", count: "~200 video" },
    { id: 4, name: "🍿 Topik 4 - Momen Seru & Santai", count: "~200 video" },
    { id: 5, name: "🌟 Topik 5 - Lucu & Hewan", count: "~200 video" },
    { id: 6, name: "⚡ Topik 6 - Musik & Vibes Malam", count: "~200 video" }
  ],
  videos: [
    {
      id: "vid_101",
      topic_id: 1,
      topic_name: "Topik 1",
      title: "Vibe santai sore hari di pepohonan rindang ✨ #shorts #vibes",
      author: "@channel_kamu",
      likes: 1420,
      shares: 89,
      video_url: "https://assets.mixkit.co/videos/preview/mixkit-vertical-view-of-trees-under-a-sunny-sky-41485-large.mp4",
      message_id: 101
    },
    {
      id: "vid_102",
      topic_id: 2,
      topic_name: "Topik 2",
      title: "Momen kembang api dramatis yang bikin takjub 🎭 #drama #epic",
      author: "@channel_kamu",
      likes: 2840,
      shares: 312,
      video_url: "https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-sparkler-at-night-42898-large.mp4",
      message_id: 102
    },
    {
      id: "vid_103",
      topic_id: 3,
      topic_name: "Topik 3",
      title: "Lampu kota malam hari dari jalanan pegunungan 🎬 #citylights",
      author: "@channel_kamu",
      likes: 980,
      shares: 45,
      video_url: "https://assets.mixkit.co/videos/preview/mixkit-going-down-a-curved-highway-down-a-mountain-41576-large.mp4",
      message_id: 103
    },
    {
      id: "vid_104",
      topic_id: 4,
      topic_name: "Topik 4",
      title: "Pemandangan pantai ombak tenang di senja hari 🌊 #chill",
      author: "@channel_kamu",
      likes: 3540,
      shares: 520,
      video_url: "https://assets.mixkit.co/videos/preview/mixkit-waves-coming-to-the-beach-5016-large.mp4",
      message_id: 104
    },
    {
      id: "vid_105",
      topic_id: 5,
      topic_name: "Topik 5",
      title: "Kucing belang lucu lagi asik bermain bola bulu 🐱 #cat #cute",
      author: "@channel_kamu",
      likes: 5600,
      shares: 870,
      video_url: "https://assets.mixkit.co/videos/preview/mixkit-little-tabby-cat-playing-with-a-scratching-post-43180-large.mp4",
      message_id: 105
    },
    {
      id: "vid_106",
      topic_id: 6,
      topic_name: "Topik 6",
      title: "Gemerlap bintang jatuh di langit malam ⚡ #universe #stars",
      author: "@channel_kamu",
      likes: 4120,
      shares: 630,
      video_url: "https://assets.mixkit.co/videos/preview/mixkit-stars-in-the-night-sky-40432-large.mp4",
      message_id: 106
    }
  ],
  dramas: []
};

// ============================================================
// DOM ELEMENTS
// ============================================================
const viewShorts = document.getElementById('view-shorts');
const viewDrama = document.getElementById('view-drama');
const viewAdult18 = document.getElementById('view-adult18');
const viewProfile = document.getElementById('view-profile');
const feedContainer = document.getElementById('feed-container');

// Top bar shorts
const openTopicDrawerBtn = document.getElementById('open-topic-drawer-btn');
const activeTopicBadge = document.getElementById('active-topic-badge');
const topicShuffleBtn = document.getElementById('topic-shuffle-btn');
const globalMuteBtn = document.getElementById('global-mute-btn');
const muteIcon = document.getElementById('mute-icon');

// Drawer Topik
const topicDrawer = document.getElementById('topic-drawer');
const drawerBackdrop = document.getElementById('drawer-backdrop');
const drawerContent = document.getElementById('drawer-content');
const closeDrawerBtn = document.getElementById('close-drawer-btn');
const drawerTopicsList = document.getElementById('drawer-topics-list');
const drawerTopicsTitle = document.getElementById('drawer-topics-title');

// Nav buttons
const navBtnShorts = document.getElementById('nav-btn-shorts');
const navBtnTopics = document.getElementById('nav-btn-topics');
const navTopicsLabel = document.getElementById('nav-topics-label');
const navBtnComic = document.getElementById('nav-btn-comic');
const navBtnDrama = document.getElementById('nav-btn-drama');
const navBtnAdult18 = document.getElementById('nav-btn-adult18');
const navAdult18Badge = document.getElementById('nav-adult18-badge');
const navBtnProfile = document.getElementById('nav-btn-profile');

// Comic catalog & elements
const viewComic = document.getElementById('view-comic');
const comicListGrid = document.getElementById('comic-list-grid');
const comicSearchInput = document.getElementById('comic-search-input');
const comicSearchClear = document.getElementById('comic-search-clear');
const comicSearchFeedback = document.getElementById('comic-search-feedback');
const comicAuthorPills = document.getElementById('comic-author-pills');
const comicCountLabel = document.getElementById('comic-count-label');
const comicSortBtn = document.getElementById('comic-sort-btn');
const comicSortLabel = document.getElementById('comic-sort-label');
const comicSortSheet = document.getElementById('comic-sort-sheet');
const closeComicSortBtn = document.getElementById('close-comic-sort-btn');
const comicSortBackdrop = document.getElementById('comic-sort-backdrop');
const comicSortOptions = document.querySelectorAll('.comic-sort-option');

// Comic Reader Modal elements
const comicReaderModal = document.getElementById('comic-reader-modal');
const closeComicReaderBtn = document.getElementById('close-comic-reader-btn');
const comicReaderTitle = document.getElementById('comic-reader-title');
const comicReaderSubtitle = document.getElementById('comic-reader-subtitle');
const comicOrientationBtn = document.getElementById('comic-orientation-btn');
const comicOrientationIcon = document.getElementById('comic-orientation-icon');
const comicOrientationLabel = document.getElementById('comic-orientation-label');
const comicModeToggleBtn = document.getElementById('comic-mode-toggle-btn');
const comicModeIcon = document.getElementById('comic-mode-icon');
const comicModeLabel = document.getElementById('comic-mode-label');
const comicChapterBtn = document.getElementById('comic-chapter-btn');
const comicChapterLabel = document.getElementById('comic-chapter-label');
const comicReaderHeader = document.getElementById('comic-reader-header');
const comicReaderFooter = document.getElementById('comic-reader-footer');
const comicWebtoonContainer = document.getElementById('comic-webtoon-container');
const comicSwapContainer = document.getElementById('comic-swap-container');
const comicSwapCurrentImg = document.getElementById('comic-swap-current-img');
const comicPdfContainer = document.getElementById('comic-pdf-container');
const comicPdfFrame = document.getElementById('comic-pdf-frame');
const comicReaderLoader = document.getElementById('comic-reader-loader');
const comicPageNow = document.getElementById('comic-page-now');
const comicPageTotal = document.getElementById('comic-page-total');
const comicMultiChapterActions = document.getElementById('comic-multi-chapter-actions');
const comicFooterChapterBtn = document.getElementById('comic-footer-chapter-btn');
const comicFooterChapterLabel = document.getElementById('comic-footer-chapter-label');
const comicNextChapterBtn = document.getElementById('comic-next-chapter-btn');
const comicNextChapterLabel = document.getElementById('comic-next-chapter-label');
const comicPageSlider = document.getElementById('comic-page-slider');
const comicPrevPageBtn = document.getElementById('comic-prev-page-btn');
const comicNextPageBtn = document.getElementById('comic-next-page-btn');
const comicPrevChapterBtn = document.getElementById('comic-prev-chapter-btn');
const comicPrevChapterLabel = document.getElementById('comic-prev-chapter-label');
const comicFooterModeBtn = document.getElementById('comic-footer-mode-btn');
const comicFooterModeIcon = document.getElementById('comic-footer-mode-icon');
const comicFooterModeLabel = document.getElementById('comic-footer-mode-label');
const comicChapterSheet = document.getElementById('comic-chapter-sheet');
const comicChapterSheetBackdrop = document.getElementById('comic-chapter-sheet-backdrop');
const comicChapterList = document.getElementById('comic-chapter-list');
const comicTotalChaptersBadge = document.getElementById('comic-total-chapters-badge');
const comicSwapTapPrev = document.getElementById('comic-swap-tap-prev');
const comicSwapTapMenu = document.getElementById('comic-swap-tap-menu');
const comicSwapTapNext = document.getElementById('comic-swap-tap-next');
const comicSwapPageWrapper = document.getElementById('comic-swap-page-wrapper');

// Drama catalog
const dramaListGrid = document.getElementById('drama-list-grid');
const dramaSearchInput = document.getElementById('drama-search-input');
const dramaSearchClear = document.getElementById('drama-search-clear');
const searchFeedback = document.getElementById('search-feedback');
const dramaGenrePills = document.querySelectorAll('.genre-pill');
const dramaCountLabel = document.getElementById('drama-count-label');

// 18+ catalog (iQOO)
const adult18ListGrid = document.getElementById('adult18-list-grid');
const adult18SearchInput = document.getElementById('adult18-search-input');
const adult18SearchClear = document.getElementById('adult18-search-clear');
const adult18SearchFeedback = document.getElementById('adult18-search-feedback');
const adult18CategoryPills = document.querySelectorAll('.adult18-pill');
const adult18CountLabel = document.getElementById('adult18-count-label');
const adult18SortBtn = document.getElementById('adult18-sort-btn');
const adult18SortLabel = document.getElementById('adult18-sort-label');

// Drama detail modal
const dramaDetailModal = document.getElementById('drama-detail-modal');
const closeDramaModal = document.getElementById('close-drama-modal');
const modalDramaPoster = document.getElementById('modal-drama-poster');
const modalDramaGenre = document.getElementById('modal-drama-genre');
const modalDramaTitle = document.getElementById('modal-drama-title');
const modalDramaRating = document.getElementById('modal-drama-rating');
const modalDramaEpsCount = document.getElementById('modal-drama-eps-count');
const modalDramaSynopsis = document.getElementById('modal-drama-synopsis');
const modalStartWatchBtn = document.getElementById('modal-start-watch-btn');
const modalLandscapeWatchBtn = document.getElementById('modal-landscape-watch-btn');
const modalBookmarkDramaBtn = document.getElementById('modal-bookmark-drama-btn');
const modalBookmarkLabel = document.getElementById('modal-bookmark-label');
const modalEpisodeList = document.getElementById('modal-episode-list');

// DramaBox Vertical Reel Player Elements
const dramaReelModal = document.getElementById('drama-reel-modal');
const closeDramaReelBtn = document.getElementById('close-drama-reel-btn');
const reelDramaTitle = document.getElementById('reel-drama-title');
const reelAdultBadge = document.getElementById('reel-adult-badge');
const reelCurrentEpBadge = document.getElementById('reel-current-ep-badge');
const reelSpeedBadge = document.getElementById('reel-speed-badge');
const reelSeekLeft = document.getElementById('reel-seek-left');
const reelSeekRight = document.getElementById('reel-seek-right');
const dramaEpisodesReel = document.getElementById('drama-episodes-reel');
const reelEpSheet = document.getElementById('reel-ep-sheet');
const closeReelEpSheet = document.getElementById('close-reel-ep-sheet');
const reelSheetGrid = document.getElementById('reel-sheet-grid');

// Profile elements
const statLikesCount = document.getElementById('stat-likes-count');
const statShortsCount = document.getElementById('stat-shorts-count');
const statDramaCount = document.getElementById('stat-drama-count');
const profileTabLikes = document.getElementById('profile-tab-likes');
const profileTabShorts = document.getElementById('profile-tab-shorts');
const profileTabDrama = document.getElementById('profile-tab-drama');
const tabLikesNum = document.getElementById('tab-likes-num');
const tabShortsNum = document.getElementById('tab-shorts-num');
const tabDramaNum = document.getElementById('tab-drama-num');
const profileContentArea = document.getElementById('profile-content-area');

function updateTopicCountLabels() {
  const realCount = allTopics.filter(t => t.id !== 0).length;
  if (navTopicsLabel) navTopicsLabel.textContent = `Topik (${realCount})`;
  if (drawerTopicsTitle) drawerTopicsTitle.textContent = `Kategori ${realCount} Topik Video`;
}

// ============================================================
// APP INIT
// ============================================================
async function initApp() {
  if (window.lucide?.createIcons) {
    window.lucide.createIcons();
  }
  syncMuteButtonsUI();

  const initialLoader = document.getElementById('app-initial-loader');
  const initialLoaderText = document.getElementById('initial-loader-text');
  if (initialLoaderText) initialLoaderText.textContent = "Mengunduh katalog video & drama...";

  try {
    const res = await fetch('videos.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error('Network error');
    const data = await res.json();
    allTopics = data.topics || FALLBACK_DATA.topics;
    allVideos = data.videos || FALLBACK_DATA.videos;
    allDramas = data.dramas || FALLBACK_DATA.dramas;
    allAdultVideos = data.adult_videos || [];
  } catch (err) {
    allTopics = FALLBACK_DATA.topics;
    allVideos = FALLBACK_DATA.videos;
    allDramas = FALLBACK_DATA.dramas;
    allAdultVideos = [];
  }

  try {
    const resComics = await fetch('comics.json?v=4.1.0', { cache: 'no-cache' });
    if (resComics.ok) {
      allComics = await resComics.json();
    }
  } catch (err) {
    allComics = [];
  }

  // Precompute searchable lowercase corpus per drama and 18+ item once at startup
  getAllCatalogMedia().forEach(d => {
    const eps = d.episodes ? d.episodes.map(e => e.title || '').join(' ') : '';
    d._searchCorpus = `${d.title || ''} ${d.category || ''} ${d.genre || ''} ${d.quality || ''} ${d.synopsis || ''} ${eps}`.toLowerCase();
  });

  if (initialLoaderText) initialLoaderText.textContent = "Menyiapkan hiburan terbaik...";

  // Pre-seed sample states only on first visit
  if (!localStorage.getItem('teleshorts_seeded_v1')) {
    if (likedVideoIds.size === 0 && allVideos.length > 0) {
      likedVideoIds.add(allVideos[0].id);
      likedVideoIds.add(allVideos[1].id);
    }
    if (savedShortIds.size === 0 && allVideos.length > 2) {
      savedShortIds.add(allVideos[2].id);
    }
    if (savedDramaIds.size === 0 && allDramas.length > 0) {
      savedDramaIds.add(allDramas[0].id);
    }
    if (likedEpisodeKeys.size === 0 && allDramas.length > 0) {
      likedEpisodeKeys.add(`${allDramas[0].id}_ep_1`);
    }
    localStorage.setItem('teleshorts_seeded_v1', '1');
  }
  loadCollections();
  processSyncEndpointHashIfPresent();
  persistStorage();

  // Critical path first: Shorts feed, UI states, event bindings
  renderShortsFeed();
  updateTopicCountLabels();
  if (dramaCountLabel) dramaCountLabel.textContent = `${allDramas.length} Drama`;
  if (adult18CountLabel) adult18CountLabel.textContent = `${allAdultVideos.length} Video`;
  updateGoogleSyncUI();
  updateTopicShuffleUI();
  updateDramaSortUI();
  updateAdultSortUI();
  updateComicSortUI();
  setupEvents();

  // Sinkronisasi otomatis di latar belakang jika akun sudah login
  if (currentUser) {
    setTimeout(() => {
      syncUserDataToCloud(false, { pullFirst: true });
    }, 120);
  }

  // Fade out splash loader immediately on next animation frame
  if (initialLoader) {
    requestAnimationFrame(() => {
      initialLoader.style.opacity = '0';
      setTimeout(() => {
        initialLoader.classList.add('hidden');
      }, 280);
    });
  }

  // Defer off-screen views so cold startup stays fast & smooth
  setTimeout(() => {
    renderDrawerTopics();
    filterAndRenderDramas();
    filterAndRenderAdult18();
    renderComicAuthorPills();
    filterAndRenderComics();
    if (activeView === 'profile') renderProfileContent();
  }, 0);
}

// ============================================================
// HELPER SHUFFLE (ACAK VIDEO UNTUK ANDA)
// ============================================================
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const TOAST_COLOR_CLASSES = {
  rose: 'bg-rose-500/20 text-rose-400',
  amber: 'bg-amber-500/20 text-amber-400',
  emerald: 'bg-emerald-500/20 text-emerald-400',
  zinc: 'bg-zinc-700/40 text-zinc-300',
  sky: 'bg-sky-500/20 text-sky-400'
};

// Toast notification helper ala TikTok (Posisi di bawah di atas navbar, z-[100] interaktif)
function showToast(message, iconName = 'sparkles', color = 'rose', durationMs = 2400) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed bottom-[76px] inset-x-0 max-w-[480px] mx-auto z-[100] flex flex-col items-center pointer-events-none gap-2 px-4 transition-all duration-300';
    document.body.appendChild(container);
  }
  // Hapus toast lama agar tidak menumpuk
  container.querySelectorAll('.tiktok-toast').forEach(t => t.remove());

  const toast = document.createElement('div');
  const isAmber = color === 'amber';
  const badgeCls = TOAST_COLOR_CLASSES[color] || TOAST_COLOR_CLASSES.rose;
  toast.className = `tiktok-toast flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-zinc-900/95 backdrop-blur-md border ${isAmber ? 'border-amber-400/50 shadow-[0_4px_20px_rgba(251,191,36,0.25)]' : 'border-white/20 shadow-2xl'} text-xs font-semibold text-white pointer-events-auto`;
  toast.innerHTML = `
    <div class="w-6 h-6 rounded-full ${badgeCls} flex items-center justify-center shrink-0">
      ${iconSvg(iconName, `w-3.5 h-3.5 ${iconName === 'bookmark' ? 'fill-current' : ''}`)}
    </div>
    <span class="leading-snug">${escapeHtml(message)}</span>
  `;
  container.appendChild(toast);

  const dismiss = () => {
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 200);
  };

  setTimeout(dismiss, durationMs);
}

function showToastWithAction(message, actionText, actionCallback, durationMs = 4500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed bottom-[76px] inset-x-0 max-w-[480px] mx-auto z-[100] flex flex-col items-center pointer-events-none gap-2 px-4 transition-all duration-300';
    document.body.appendChild(container);
  }
  
  // Hapus toast aksi lama agar tidak menumpuk
  container.querySelectorAll('.tiktok-action-toast').forEach(t => t.remove());

  const toast = document.createElement('div');
  toast.className = 'tiktok-toast tiktok-action-toast flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-zinc-900/95 backdrop-blur-md border border-amber-400/50 text-xs font-semibold text-white shadow-[0_8px_30px_rgba(251,191,36,0.3)] pointer-events-auto cursor-pointer transition-all duration-200 w-full max-w-[340px]';
  toast.innerHTML = `
    <div class="flex items-center gap-2.5">
      <div class="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0 shadow-sm">
        ${iconSvg('bookmark', 'w-4 h-4 fill-amber-400')}
      </div>
      <div class="flex flex-col">
        <span class="text-xs text-white font-bold leading-tight">${escapeHtml(message)}</span>
        <span class="text-[10px] text-zinc-400 leading-tight">Ketuk untuk kelola folder</span>
      </div>
    </div>
    <button class="toast-action-btn shrink-0 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-black font-extrabold text-[11px] active:scale-95 transition-all shadow-md flex items-center gap-1">
      <span>${escapeHtml(actionText)}</span>
      ${iconSvg('chevron-right', 'w-3 h-3 stroke-[3]')}
    </button>
  `;

  let dismissTimer = null;
  const dismiss = () => {
    if (dismissTimer) clearTimeout(dismissTimer);
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 200);
  };

  const btn = toast.querySelector('.toast-action-btn');
  if (btn) {
    btn.onclick = (e) => {
      e.stopPropagation();
      dismiss();
      if (actionCallback) actionCallback();
    };
  }
  toast.onclick = () => {
    dismiss();
    if (actionCallback) actionCallback();
  };
  container.appendChild(toast);
  dismissTimer = setTimeout(() => dismiss(), durationMs);
}

// Global Toggle Play / Pause Helper dengan Visual Indicator
function togglePlayback(video, playIndicator) {
  if (!video) return;
  triggerHaptic('light');
  if (video.paused) {
    video.play()
      .then(() => {
        if (playIndicator) playIndicator.style.opacity = '0';
      })
      .catch(() => {});
  } else {
    video.pause();
    if (playIndicator) playIndicator.style.opacity = '1';
  }
}

// ============================================================
// 1. SHORTS FEED & PLAYER (BERANDA) - VIRTUAL INFINITE BATCHING
// ============================================================
let currentFeedVideos = [];
let currentRenderedFeedCount = 0;
const FEED_BATCH_SIZE = 12;

function updateTopicShuffleUI() {
  if (!topicShuffleBtn) return;
  if (isTopicShuffled) {
    topicShuffleBtn.innerHTML = `${iconSvg('shuffle', 'w-3 h-3')}<span>Acak</span>`;
    topicShuffleBtn.className = 'flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-amber-500 text-black border border-amber-300 text-[11px] font-extrabold shadow-lg active:scale-95 transition-all shrink-0 whitespace-nowrap';
    topicShuffleBtn.title = 'Urutan acak aktif (ketuk untuk tampil urut)';
    topicShuffleBtn.setAttribute('aria-pressed', 'true');
  } else {
    topicShuffleBtn.innerHTML = `${iconSvg('arrow-down-up', 'w-3 h-3 text-zinc-300')}<span>Urut</span>`;
    topicShuffleBtn.className = 'flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-zinc-200 text-[11px] font-bold active:scale-95 transition-all shrink-0 whitespace-nowrap';
    topicShuffleBtn.title = 'Urutan normal (ketuk untuk tampil acak)';
    topicShuffleBtn.setAttribute('aria-pressed', 'false');
  }
}

function renderShortsFeed(targetVideoId = null) {
  if (currentPlayingShortVideo) {
    currentPlayingShortVideo.pause();
    currentPlayingShortVideo = null;
  }
  feedContainer.innerHTML = '';
  currentRenderedFeedCount = 0;

  const topicVideos = currentTopicId === 0
    ? allVideos
    : allVideos.filter(v => v.topic_id === currentTopicId);

  const filtered = isTopicShuffled
    ? shuffleArray(topicVideos)
    : [...topicVideos];

  const currentTopicObj = allTopics.find(t => t.id === currentTopicId);
  if (currentTopicObj) {
    activeTopicBadge.textContent = currentTopicId === 0
      ? "Topik: Semua Video"
      : `Topik: ${currentTopicObj.name.split('-')[0].trim()}`;
  }

  if (filtered.length === 0) {
    feedContainer.innerHTML = `
      <div class="w-full h-full flex flex-col items-center justify-center p-6 text-center text-zinc-400">
        ${iconSvg('video-off', 'w-12 h-12 mb-3 text-zinc-600')}
        <p class="font-semibold text-zinc-200">Belum ada video di topik ini</p>
        <p class="text-xs text-zinc-500 mt-1">Pilih topik lain lewat menu di kiri atas ya beb ✨</p>
      </div>
    `;
    return;
  }

  currentPlayingShortVideo = null;
  currentFeedVideos = filtered;

  // Jika targetVideoId dipanggil (misal dari Koleksi / Pencarian), posisikan di depan
  // agar video langsung terbuka dan berputar tanpa jeda / lag!
  if (targetVideoId) {
    const targetIdx = currentFeedVideos.findIndex(v => v.id === targetVideoId);
    if (targetIdx > 0) {
      const [targetItem] = currentFeedVideos.splice(targetIdx, 1);
      currentFeedVideos.unshift(targetItem);
    }
  }

  // Muat batch pertama (12 video) saja agar memory super ringan & performa maksimal
  loadMoreFeedVideos(FEED_BATCH_SIZE);
  setupShortsObserver();
  feedContainer.scrollTop = 0;
}

function syncShortSlideSources(centerIdx) {
  if (!feedContainer) return;
  const slides = feedContainer.children;
  for (let idx = 0; idx < slides.length; idx++) {
    const slide = slides[idx];
    const video = slide.querySelector('video');
    if (!video || !video.dataset.src) continue;
    const dist = Math.abs(idx - centerIdx);
    const hasSrc = Boolean(video.getAttribute('src'));

    if (dist <= 1) {
      if (!hasSrc) {
        video.src = video.dataset.src;
      }
      video.preload = (idx === centerIdx || idx === centerIdx + 1) ? 'auto' : 'metadata';
    } else if (dist > 2 && hasSrc) {
      if (currentPlayingShortVideo === video) currentPlayingShortVideo = null;
      video.pause();
      video.playbackRate = 1.0;
      video.removeAttribute('src');
      video.load();
    }
  }
}

function loadMoreFeedVideos(count = FEED_BATCH_SIZE) {
  if (currentRenderedFeedCount >= currentFeedVideos.length) return;
  const nextBatch = currentFeedVideos.slice(currentRenderedFeedCount, currentRenderedFeedCount + count);
  const frag = document.createDocumentFragment();
  nextBatch.forEach((videoData, idx) => {
    const globalIdx = currentRenderedFeedCount + idx;
    const slide = createShortSlide(videoData, globalIdx);
    slide.dataset.feedIndex = globalIdx;
    frag.appendChild(slide);
    if (shortsObserver) {
      shortsObserver.observe(slide);
    }
  });
  feedContainer.appendChild(frag);
  currentRenderedFeedCount += nextBatch.length;
}

function updateLikeButtonUI(slide, isLiked) {
  const heartSvg = slide.querySelector('.heart-svg');
  if (!heartSvg) return;
  if (isLiked) {
    heartSvg.setAttribute('fill', '#f43f5e');
    heartSvg.setAttribute('stroke', '#f43f5e');
    heartSvg.classList.add('text-rose-500', 'fill-rose-500', 'drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]');
    heartSvg.classList.remove('text-white');
  } else {
    heartSvg.setAttribute('fill', 'none');
    heartSvg.setAttribute('stroke', 'currentColor');
    heartSvg.classList.remove('text-rose-500', 'fill-rose-500', 'drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]');
    heartSvg.classList.add('text-white');
  }
}

function updateSaveButtonUI(slide, isSaved) {
  const saveSvg = slide.querySelector('.save-svg');
  const saveCount = slide.querySelector('.save-count');
  if (saveSvg) {
    if (isSaved) {
      saveSvg.setAttribute('fill', '#fbbf24');
      saveSvg.setAttribute('stroke', '#fbbf24');
      saveSvg.classList.add('text-amber-400', 'fill-amber-400', 'drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]');
      saveSvg.classList.remove('text-white');
    } else {
      saveSvg.setAttribute('fill', 'none');
      saveSvg.setAttribute('stroke', 'currentColor');
      saveSvg.classList.remove('text-amber-400', 'fill-amber-400', 'drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]');
      saveSvg.classList.add('text-white');
    }
  }
  if (saveCount) {
    saveCount.textContent = isSaved ? 'Tersimpan' : (saveCount.dataset.defaultLabel || 'Simpan');
    saveCount.className = `save-count text-[11px] font-bold drop-shadow ${isSaved ? 'text-amber-400' : 'text-white'}`;
  }
}

// ============================================================
// HELPER GLOBAL: ANIMASI & INDIKATOR BUFFERING / LOADING VIDEO
// ============================================================
function wireVideoLoadingIndicator(video, loaderEl) {
  if (!video || !loaderEl) return;
  let showTimeout = null;

  const showLoader = () => {
    if (!video.getAttribute('src') && !video.currentSrc) return;
    clearTimeout(showTimeout);
    showTimeout = setTimeout(() => {
      if ((video.getAttribute('src') || video.currentSrc) && (video.readyState < 3 || video.seeking)) {
        loaderEl.classList.remove('hidden');
      }
    }, 120);
  };

  const hideLoader = () => {
    clearTimeout(showTimeout);
    loaderEl.classList.add('hidden');
  };

  video.addEventListener('loadstart', showLoader);
  video.addEventListener('waiting', showLoader);
  video.addEventListener('seeking', showLoader);

  video.addEventListener('canplay', hideLoader);
  video.addEventListener('canplaythrough', hideLoader);
  video.addEventListener('playing', hideLoader);
  video.addEventListener('seeked', hideLoader);
  video.addEventListener('emptied', hideLoader);
  video.addEventListener('timeupdate', () => {
    if (video.readyState >= 3 && !video.seeking) {
      hideLoader();
    }
  });
  video.addEventListener('error', hideLoader);
}

function createShortSlide(data, index) {
  const slide = document.createElement('div');
  slide.className = index === 0 ? 'snap-slide' : 'snap-slide slide-paused';
  slide.dataset.id = data.id;

  const isLiked = likedVideoIds.has(data.id);
  const isSaved = savedShortIds.has(data.id);

  const streamSrc = data.gdrive_file_id 
    ? `${STREAM_PROXY_BASE}?id=${data.gdrive_file_id}` 
    : data.video_url;
  const posterSrc = thumbUrl(data.gdrive_file_id, 480);
  const hydrateNow = index <= 1;
  const safeTitle = escapeHtml(data.title);
  const safeAuthor = escapeHtml(data.author);
  const safeTopic = escapeHtml(data.topic_name);
  const defaultSaveLabel = formatCount(Math.round((data.likes || 0) * 0.28));

  slide.innerHTML = `
    <!-- VIDEO MEDIA WRAPPER -->
    <div class="video-media-wrapper absolute inset-0 w-full h-full bg-black flex items-center justify-center overflow-hidden">
      <!-- Optimized Thumbnail from Google Drive (w480 for fast initial load) -->
      ${posterSrc ? `
        <img 
          src="${posterSrc}" 
          class="video-poster-img absolute inset-0 w-full h-full object-contain transition-opacity duration-300 z-0" 
          alt="${safeTitle}" 
          loading="${index < 2 ? 'eager' : 'lazy'}"
          decoding="async"
        />
      ` : ''}

      <!-- Native HTML5 Video Player with Windowed Lazy Hydration -->
      <video 
        class="video-player fit-contain w-full h-full object-contain absolute inset-0 z-10"
        data-src="${streamSrc}"
        ${hydrateNow ? `src="${streamSrc}"` : ''}
        ${posterSrc ? `poster="${posterSrc}"` : ''}
        loop
        playsinline
        webkit-playsinline
        preload="${hydrateNow ? 'auto' : 'none'}"
        ${isMuted ? 'muted' : ''}
      ></video>

      <!-- Video Buffering / Loading Indicator for Short -->
      <div class="short-loading-indicator hidden absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] z-25 pointer-events-none transition-opacity duration-200">
        <div class="relative w-14 h-14 flex items-center justify-center">
          <div class="absolute inset-0 rounded-full border-2 border-rose-500/25 animate-ping"></div>
          <div class="w-12 h-12 rounded-full border-3 border-rose-500/30 border-t-rose-500 animate-spin"></div>
          <svg class="w-5 h-5 text-rose-400 absolute" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </div>
        <span class="mt-3 text-xs font-semibold text-zinc-200 tracking-wide drop-shadow">Memuat video...</span>
      </div>
    </div>

    <!-- TOUCH DETECTOR GESTURE LAYER (Z-20: CAPTURES TAP / DOUBLE TAP / LONG PRESS) -->
    <div class="touch-gesture-layer absolute inset-0 z-20 pointer-events-auto"></div>

    <!-- GRADIENTS OVERLAY (Sleek Vignette ala TikTok) -->
    <div class="absolute inset-x-0 top-0 h-28 top-gradient pointer-events-none z-20"></div>
    <div class="absolute inset-x-0 bottom-0 h-64 bottom-gradient pointer-events-none z-20"></div>

    <!-- PLAY/PAUSE FLASH INDICATOR -->
    <div class="play-indicator absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 transition-all duration-200 z-30">
      <div class="w-16 h-16 rounded-full bg-black/55 backdrop-blur-md flex items-center justify-center text-white/95 shadow-2xl scale-95 transition-transform">
        <svg class="w-8 h-8 fill-white ml-1" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      </div>
    </div>

    <!-- 2X SPEED FLOATING BADGE (Tampil saat layar ditekan tahan) -->
    <div class="speed-badge-2x hidden absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-black/80 backdrop-blur-md border border-amber-400/50 text-amber-300 px-4 py-1.5 rounded-full font-black text-xs shadow-2xl flex items-center gap-2 pointer-events-none speed-badge">
      <svg class="w-4 h-4 fill-amber-400" viewBox="0 0 24 24"><polygon points="13 19 22 12 13 5 13 19"/><polygon points="2 19 11 12 2 5 2 19"/></svg>
      <span class="tracking-widest">2X KECEPATAN</span>
    </div>

    <!-- RIGHT ACTION SIDEBAR (PERSIS TIKTOK / DOUYIN ASLI GAMBAR 2) -->
    <div class="absolute right-2.5 bottom-[90px] flex flex-col items-center gap-4 z-30 pointer-events-auto">
      <!-- Avatar with (+) follow button -->
      <div class="relative mb-1 cursor-pointer active:scale-90 transition-transform">
        <div class="w-11 h-11 rounded-full p-[2px] bg-gradient-to-tr from-rose-500 via-pink-400 to-amber-300 shadow-md">
          <div class="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center font-black text-xs text-white">
            ${escapeHtml((data.author || '@U').charAt(1) || 'U').toUpperCase()}
          </div>
        </div>
        <div class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center text-white text-xs font-black shadow-md border-2 border-black">
          +
        </div>
      </div>

      <!-- Like (❤️) with Inline SVG for instant, flawless toggle -->
      <div class="flex flex-col items-center gap-1">
        <button class="like-btn w-12 h-12 flex items-center justify-center active:scale-75 transition-all" aria-label="Suka">
          <svg class="heart-svg w-8 h-8 transition-all duration-200 ${isLiked ? 'text-rose-500 fill-rose-500 drop-shadow-[0_0_12px_rgba(244,63,94,0.9)]' : 'text-white'}" viewBox="0 0 24 24" fill="${isLiked ? '#f43f5e' : 'none'}" stroke="${isLiked ? '#f43f5e' : 'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
          </svg>
        </button>
        <span class="like-count text-[11px] font-bold text-white drop-shadow">${formatCount(data.likes + (isLiked ? 1 : 0))}</span>
      </div>

      <!-- Bookmark (🔖) -->
      <div class="flex flex-col items-center gap-1">
        <button class="save-btn w-12 h-12 flex items-center justify-center active:scale-75 transition-all" aria-label="Simpan">
          <svg class="save-svg w-7 h-7 transition-all duration-200 ${isSaved ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.9)]' : 'text-white'}" viewBox="0 0 24 24" fill="${isSaved ? '#fbbf24' : 'none'}" stroke="${isSaved ? '#fbbf24' : 'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
          </svg>
        </button>
        <span class="save-count text-[11px] font-bold ${isSaved ? 'text-amber-400' : 'text-white'} drop-shadow" data-default-label="${defaultSaveLabel}">${isSaved ? 'Tersimpan' : defaultSaveLabel}</span>
      </div>

      <!-- Share (↗️) -->
      <div class="flex flex-col items-center gap-1">
        <button class="share-btn w-12 h-12 flex items-center justify-center text-white active:scale-75 transition-all" aria-label="Bagikan">
          <svg class="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        </button>
        <span class="text-[11px] font-bold text-white drop-shadow">${formatCount(data.shares)}</span>
      </div>

      <!-- Spinning Music Vinyl Disc -->
      <div class="music-disc w-10 h-10 rounded-full bg-gradient-to-tr from-zinc-800 via-zinc-950 to-zinc-900 border-2 border-zinc-700/70 p-1.5 flex items-center justify-center shadow-xl spin-disc mt-1">
        <div class="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-rose-500 to-amber-400 border border-white/50"></div>
      </div>
    </div>

    <!-- BOTTOM METADATA (LEFT STACK) -->
    <div class="absolute left-4 right-20 bottom-[90px] z-30 space-y-2 pointer-events-auto">
      <div class="flex items-center gap-2">
        <span class="text-xs font-black text-white drop-shadow flex items-center gap-1">
          ${safeAuthor}
          <svg class="w-3.5 h-3.5 text-sky-400 fill-sky-400 inline" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </span>
        <span class="text-[10px] font-semibold bg-rose-500/80 text-white px-2 py-0.5 rounded-full backdrop-blur-md">
          ${safeTopic}
        </span>
      </div>

      <p class="text-xs text-white font-normal leading-relaxed line-clamp-2 drop-shadow">
        ${safeTitle}
      </p>

      <div class="flex items-center gap-1.5 text-zinc-300 text-[11px] overflow-hidden max-w-[220px]">
        <svg class="w-3.5 h-3.5 text-rose-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
        <div class="overflow-hidden whitespace-nowrap">
          <div class="ticker-track">
            <span class="mr-4">Original Audio - ${safeTopic} • ${safeAuthor} • </span>
            <span class="mr-4">Original Audio - ${safeTopic} • ${safeAuthor} • </span>
          </div>
        </div>
      </div>
    </div>

    <!-- TIKTOK DURATION SCRUBBER BAR (PERSIS GAMBAR 2: BISA DITEKAN & DIGESER) -->
    <div class="short-scrubber absolute inset-x-0 bottom-[68px] z-30 h-6 flex flex-col justify-end pointer-events-auto cursor-pointer group">
      <!-- Floating Time Bubble while dragging -->
      <div class="scrub-bubble hidden absolute -top-8 left-1/2 -translate-x-1/2 bg-black/85 backdrop-blur-md border border-white/20 text-white font-mono text-[11px] px-2.5 py-0.5 rounded-full shadow-2xl pointer-events-none">
        <span class="scrub-time-now">00:00</span> / <span class="scrub-time-total">00:00</span>
      </div>
      
      <!-- Progress Bar Track -->
      <div class="scrub-track w-full h-[2.5px] group-hover:h-[4.5px] bg-white/25 transition-all relative">
        <div class="scrub-fill bg-white h-full w-0 relative">
          <!-- Knob Handle (Visible on active/hover/drag) -->
          <div class="scrub-knob absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-md scale-0 group-hover:scale-100 transition-transform"></div>
        </div>
      </div>
    </div>
  `;

  setupShortSlideGestures(slide, data);
  return slide;
}

function setupShortSlideGestures(slide, data) {
  const video = slide.querySelector('video');
  const posterImg = slide.querySelector('.video-poster-img');
  const playIndicator = slide.querySelector('.play-indicator');
  const speedBadge = slide.querySelector('.speed-badge-2x');
  const disc = slide.querySelector('.music-disc');
  const likeBtn = slide.querySelector('.like-btn');
  const likeCount = slide.querySelector('.like-count');
  const saveBtn = slide.querySelector('.save-btn');
  const shareBtn = slide.querySelector('.share-btn');
  const touchLayer = slide.querySelector('.touch-gesture-layer');
  const loaderEl = slide.querySelector('.short-loading-indicator');

  // Scrubber elements
  const scrubber = slide.querySelector('.short-scrubber');
  const scrubTrack = slide.querySelector('.scrub-track');
  const scrubFill = slide.querySelector('.scrub-fill');
  const scrubKnob = slide.querySelector('.scrub-knob');
  const scrubBubble = slide.querySelector('.scrub-bubble');
  const scrubTimeNow = slide.querySelector('.scrub-time-now');
  const scrubTimeTotal = slide.querySelector('.scrub-time-total');

  let isScrubbing = false;
  let is2xSpeed = false;
  let longPressTimer = null;
  let startX = 0;
  let startY = 0;
  let lastTapTime = 0;
  let singleTapTimer = null;

  // Video buffering / loading indicator
  if (video && loaderEl) {
    wireVideoLoadingIndicator(video, loaderEl);
  }

  // 1. Video playback events
  if (video) {
    video.addEventListener('loadedmetadata', () => {
      if (scrubTimeTotal && video.duration) {
        scrubTimeTotal.textContent = formatTime(video.duration);
      }
    });

    video.addEventListener('timeupdate', () => {
      if (isScrubbing) return;
      const cur = video.currentTime;
      const dur = video.duration || 1;
      if (scrubFill) scrubFill.style.width = ((cur / dur) * 100) + '%';
      if (scrubTimeTotal && video.duration && (scrubTimeTotal.textContent === '00:00' || scrubTimeTotal.textContent === '')) {
        scrubTimeTotal.textContent = formatTime(video.duration);
      }
    });

    video.addEventListener('playing', () => {
      if (posterImg) posterImg.style.opacity = '0';
      if (playIndicator) playIndicator.style.opacity = '0';
      if (disc) disc.classList.remove('spin-paused');
    });

    video.addEventListener('pause', () => {
      if (!isScrubbing && playIndicator) {
        playIndicator.style.opacity = '1';
      }
      if (disc) disc.classList.add('spin-paused');
    });

    video.addEventListener('ended', () => {
      video.currentTime = 0;
      video.play().catch(() => {});
    });
  }

  // 2. Interactive Scrubber (Drag/Seek Duration - Persis Gambar 2)
  if (scrubber && video) {
    function seekToPosition(clientX) {
      const rect = scrubTrack.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      if (scrubFill) scrubFill.style.width = (pct * 100) + '%';
      const dur = video.duration || 1;
      const seekTime = pct * dur;
      if (scrubTimeNow) scrubTimeNow.textContent = formatTime(seekTime);
      if (scrubTimeTotal) scrubTimeTotal.textContent = formatTime(dur);
      if (scrubBubble) {
        scrubBubble.style.left = `${pct * 100}%`;
      }
      return seekTime;
    }

    scrubber.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      isScrubbing = true;
      if (scrubBubble) scrubBubble.classList.remove('hidden');
      if (scrubKnob) scrubKnob.classList.remove('scale-0');
      seekToPosition(e.clientX);

      const onPointerMove = (ev) => {
        if (!isScrubbing) return;
        ev.preventDefault();
        seekToPosition(ev.clientX);
      };

      const onPointerUp = (ev) => {
        if (!isScrubbing) return;
        const seekTime = seekToPosition(ev.clientX);
        video.currentTime = seekTime;
        isScrubbing = false;
        if (scrubBubble) scrubBubble.classList.add('hidden');
        if (scrubKnob) scrubKnob.classList.add('scale-0');
        video.play().catch(() => {});
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    });
  }

  // 3. Touch Gesture Layer: Single Tap (Pause/Play), Double Tap (Love), Long Press (2X Speed)
  if (touchLayer && video) {
    touchLayer.addEventListener('pointerdown', (e) => {
      startX = e.clientX;
      startY = e.clientY;

      longPressTimer = setTimeout(() => {
        is2xSpeed = true;
        video.playbackRate = 2.0;
        if (speedBadge) speedBadge.classList.remove('hidden');
        triggerHaptic('medium');
      }, 260);
    });

    touchLayer.addEventListener('pointermove', (e) => {
      const dx = Math.abs(e.clientX - startX);
      const dy = Math.abs(e.clientY - startY);
      if (dx > 10 || dy > 10) {
        clearTimeout(longPressTimer);
      }
    });

    touchLayer.addEventListener('pointerup', (e) => {
      clearTimeout(longPressTimer);

      if (is2xSpeed) {
        is2xSpeed = false;
        video.playbackRate = 1.0;
        if (speedBadge) speedBadge.classList.add('hidden');
        return; // Jangan picu tap biasa
      }

      const dx = Math.abs(e.clientX - startX);
      const dy = Math.abs(e.clientY - startY);
      if (dx > 12 || dy > 12) return; // User sedang swipe ganti video

      // Unmute otomatis pada sentuhan pertama tanpa menjeda video yang sedang menunggu suara
      if (isMuted) {
        setGlobalMuted(false);
        return;
      }
      if (awaitingAudioUnlock || video.muted) {
        unlockActiveVideoSound(video);
        return;
      }

      const currentTime = Date.now();
      const tapInterval = currentTime - lastTapTime;

      if (tapInterval < 300 && tapInterval > 0) {
        // DOUBLE TAP -> LOVE ❤️
        clearTimeout(singleTapTimer);
        triggerDoubleTapLike(slide, e.clientX, e.clientY);
        if (!likedVideoIds.has(data.id)) {
          likedVideoIds.add(data.id);
          updateLikeButtonUI(slide, true);
          if (likeBtn) {
            likeBtn.classList.remove('animate-heart-pop');
            void likeBtn.offsetWidth;
            likeBtn.classList.add('animate-heart-pop');
          }
          if (likeCount) likeCount.textContent = formatCount(data.likes + 1);
          persistStorage();
          showToast('Disukai ❤️', 'heart', 'rose');
          triggerHaptic('success');
        }
      } else {
        // SINGLE TAP -> JEDA / PUTAR (Persis TikTok)
        singleTapTimer = setTimeout(() => {
          if (video.paused) {
            video.play().catch(() => {});
            if (playIndicator) playIndicator.style.opacity = '0';
            if (disc) disc.classList.remove('spin-paused');
          } else {
            video.pause();
            if (playIndicator) playIndicator.style.opacity = '1';
            if (disc) disc.classList.add('spin-paused');
          }
          triggerHaptic('light');
        }, 250);
      }
      lastTapTime = currentTime;
    });

    touchLayer.addEventListener('pointercancel', () => {
      clearTimeout(longPressTimer);
      if (is2xSpeed) {
        is2xSpeed = false;
        video.playbackRate = 1.0;
        if (speedBadge) speedBadge.classList.add('hidden');
      }
    });
  }

  // 4. Action buttons
  if (likeBtn) {
    likeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      likeBtn.classList.remove('animate-heart-pop');
      void likeBtn.offsetWidth;

      if (likedVideoIds.has(data.id)) {
        likedVideoIds.delete(data.id);
        updateLikeButtonUI(slide, false);
        if (likeCount) likeCount.textContent = formatCount(data.likes);
        showToast('Batal menyukai 🤍', 'heart', 'zinc');
        triggerHaptic('light');
      } else {
        likedVideoIds.add(data.id);
        updateLikeButtonUI(slide, true);
        likeBtn.classList.add('animate-heart-pop');
        if (likeCount) likeCount.textContent = formatCount(data.likes + 1);
        showToast('Disukai ❤️', 'heart', 'rose');
        triggerHaptic('success');
      }
      persistStorage();
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      saveBtn.classList.remove('animate-bookmark-pop');
      void saveBtn.offsetWidth;

      if (savedShortIds.has(data.id)) {
        savedShortIds.delete(data.id);
        customCollections.forEach(col => {
          col.videoIds = col.videoIds.filter(vid => vid !== data.id);
        });
        persistCollections();
        updateSaveButtonUI(slide, false);
        showToast('Dihapus dari Koleksi 🗑️', 'bookmark', 'zinc');
        triggerHaptic('light');
      } else {
        savedShortIds.add(data.id);
        const def = customCollections.find(c => c.id === 'col_default');
        if (def && !def.videoIds.includes(data.id)) {
          def.videoIds.push(data.id);
        }
        persistCollections();
        updateSaveButtonUI(slide, true);
        saveBtn.classList.add('animate-bookmark-pop');
        showToastWithAction(
          'Tersimpan di Koleksi 🔖', 
          'Kelola', 
          () => openManageCollectionsModal(data.id)
        );
        triggerHaptic('success');
      }
    });

    let savePressTimer = null;
    saveBtn.addEventListener('pointerdown', () => {
      savePressTimer = setTimeout(() => {
        openManageCollectionsModal(data.id);
      }, 450);
    });
    saveBtn.addEventListener('pointerup', () => clearTimeout(savePressTimer));
    saveBtn.addEventListener('pointercancel', () => clearTimeout(savePressTimer));
  }

  if (shareBtn) {
    shareBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      triggerHaptic('medium');
      const txt = `Tonton video seru "${data.title}" di appVideo!`;
      const url = window.location.href;
      const copyShareFallback = () => {
        navigator.clipboard?.writeText(url).catch(() => {});
        showToast('Tautan berhasil disalin! 📋', 'check', 'emerald');
      };
      if (navigator.share) {
        navigator.share({ title: 'appVideo', text: txt, url }).catch((err) => {
          if (err?.name !== 'AbortError') copyShareFallback();
        });
      } else if (tg?.openTelegramLink) {
        tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(txt)}`);
      } else {
        copyShareFallback();
      }
    });
  }
}

function triggerDoubleTapLike(slide, clientX, clientY) {
  triggerHaptic('medium');
  const heart = document.createElement('div');
  heart.className = 'burst-heart z-40';
  const rect = slide.getBoundingClientRect();
  heart.style.left = `${clientX - rect.left}px`;
  heart.style.top = `${clientY - rect.top}px`;
  heart.innerHTML = `
    <svg class="w-24 h-24 text-rose-500 fill-rose-500 drop-shadow-[0_0_20px_rgba(244,63,94,0.9)]" viewBox="0 0 24 24">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
  `;
  slide.appendChild(heart);
  setTimeout(() => heart.remove(), 750);
}

function setupShortsObserver() {
  if (shortsObserver) shortsObserver.disconnect();

  shortsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const slide = entry.target;
      const video = slide.querySelector('video');
      const disc = slide.querySelector('.music-disc');
      const playIndicator = slide.querySelector('.play-indicator');
      const idx = parseInt(slide.dataset.feedIndex || '0', 10);

      if (entry.isIntersecting && activeView === 'shorts' && dramaReelModal.classList.contains('hidden')) {
        // Hentikan video aktif sebelumnya agar suara tidak pernah tabrakan
        if (currentPlayingShortVideo && currentPlayingShortVideo !== video && !currentPlayingShortVideo.paused) {
          currentPlayingShortVideo.pause();
        }

        syncShortSlideSources(idx);
        slide.classList.remove('slide-paused');
        currentPlayingShortVideo = video;
        if (video) {
          if (!video.getAttribute('src') && video.dataset.src) {
            video.src = video.dataset.src;
          }
          video.preload = 'auto';
          playVideoSafely(video, (ok) => {
            if (ok && playIndicator) playIndicator.style.opacity = '0';
          });
          if (disc) disc.classList.remove('spin-paused');
        }

        // Infinite Scroll: Muat batch berikutnya secara mulus saat mendekati slide akhir
        if (idx >= currentRenderedFeedCount - 4) {
          loadMoreFeedVideos();
        }
      } else {
        // BEGITU DISCROLL PERGI: BERHENTIKAN SEGERA, RESET SPEED & PAUSE ANIMASI OFF-SCREEN!
        slide.classList.add('slide-paused');
        if (video) {
          video.pause();
          video.playbackRate = 1.0;
        }
        if (disc) disc.classList.add('spin-paused');
      }
    });
  }, { root: feedContainer, threshold: 0.6 });

  document.querySelectorAll('#feed-container .snap-slide').forEach(slide => shortsObserver.observe(slide));

  // Putar otomatis video pertama langsung tanpa harus discroll dulu!
  setTimeout(() => {
    if (activeView !== 'shorts' || !dramaReelModal.classList.contains('hidden')) return;
    const firstSlide = feedContainer.querySelector('.snap-slide');
    if (firstSlide) {
      firstSlide.classList.remove('slide-paused');
      const firstVideo = firstSlide.querySelector('video');
      if (firstVideo && firstVideo.paused) {
        if (!firstVideo.getAttribute('src') && firstVideo.dataset.src) {
          firstVideo.src = firstVideo.dataset.src;
        }
        syncShortSlideSources(0);
        currentPlayingShortVideo = firstVideo;
        firstVideo.preload = 'auto';
        playVideoSafely(firstVideo);
      }
    }
  }, 80);
}

// ============================================================
// 2. DRAMA HUB & 18+ HUB (KATALOG & FILTER TERPADU)
// ============================================================
function searchDramasWordByWord(query, items) {
  const rawWords = query.toLowerCase().split(/\s+/).filter(w => w.trim().length > 0);
  if (rawWords.length === 0) return items;

  return items.filter(drm => {
    const searchableCorpus = drm._searchCorpus || `${drm.title} ${drm.category || ''} ${drm.genre} ${drm.synopsis}`.toLowerCase();
    return rawWords.every(word => searchableCorpus.includes(word));
  });
}

function getAdultSortLabel(sortType) {
  switch (sortType) {
    case 'duration_desc': return 'Terlama';
    case 'hd': return 'Resolusi HD';
    case 'az': return 'Abjad A - Z';
    case 'za': return 'Abjad Z - A';
    default: return 'Acak';
  }
}

function updateAdultSortUI() {
  if (adult18SortLabel) adult18SortLabel.textContent = getAdultSortLabel(currentAdultSort);
}

function filterAndRenderAdult18() {
  if (!adult18ListGrid) return;
  const query = (adult18SearchInput?.value || '').trim();
  let results = [...allAdultVideos];

  if (currentAdultCategoryFilter !== 'all') {
    if (currentAdultCategoryFilter === 'hd') {
      results = results.filter(d => d.quality === '1080p' || d.quality === '720p');
    } else {
      results = results.filter(d => d.category === currentAdultCategoryFilter);
    }
  }

  if (query.length > 0) {
    adult18SearchClear?.classList.remove('hidden');
    results = searchDramasWordByWord(query, results);
    const words = query.split(/\s+/).filter(Boolean);
    if (adult18SearchFeedback) {
      adult18SearchFeedback.classList.remove('hidden');
      adult18SearchFeedback.textContent = `Mencari: "${words.join('", "')}" • Ditemukan: ${results.length} video`;
    }
  } else {
    adult18SearchClear?.classList.add('hidden');
    adult18SearchFeedback?.classList.add('hidden');
  }

  if (currentAdultSort === 'az') {
    results.sort((a, b) => a.title.localeCompare(b.title, 'id', { sensitivity: 'base' }));
  } else if (currentAdultSort === 'za') {
    results.sort((a, b) => b.title.localeCompare(a.title, 'id', { sensitivity: 'base' }));
  } else if (currentAdultSort === 'duration_desc') {
    results.sort((a, b) => (b.duration_sec || 0) - (a.duration_sec || 0));
  } else if (currentAdultSort === 'hd') {
    const rank = q => (q === '1080p' ? 3 : q === '720p' ? 2 : q === '480p' ? 1 : 0);
    results.sort((a, b) => rank(b.quality) - rank(a.quality) || (b.duration_sec || 0) - (a.duration_sec || 0));
  }

  if (adult18CountLabel) adult18CountLabel.textContent = `${results.length} Video`;
  renderCatalogGrid(adult18ListGrid, results, 'Tidak ada video 18+ yang cocok', 'Coba gunakan kata kunci atau kategori lain');
}

function filterAndRenderDramas() {
  const query = dramaSearchInput.value.trim();
  let results = [...allDramas];

  if (currentGenreFilter !== 'all') {
    const f = currentGenreFilter.toLowerCase();
    results = allDramas.filter(d => {
      const g = (d.genre || '').toLowerCase();
      if (f === '18+' || f === '18') {
        return d.age_rating === '18+' || g.includes('18+');
      }
      if (f === 'romantis') {
        return g.includes('romantis') || g.includes('romance');
      }
      if (f === 'drama populer') {
        return parseFloat(d.rating || 0) >= 4.7;
      }
      if (f.includes('thriller') || f.includes('aksi')) {
        return g.includes('thriller') || g.includes('aksi') || g.includes('action') || g.includes('misteri') || g.includes('mystery');
      }
      if (f === 'petualangan') {
        return g.includes('petualangan') || g.includes('adventure') || g.includes('martial arts');
      }
      if (f === 'fantasi') {
        return g.includes('fantasi') || g.includes('fantasy');
      }
      if (f === 'komedi') {
        return g.includes('komedi') || g.includes('comedy');
      }
      if (f === 'ceo') {
        return g.includes('ceo');
      }
      return g.includes(f);
    });
  }

  if (query.length > 0) {
    dramaSearchClear.classList.remove('hidden');
    results = searchDramasWordByWord(query, results);
    const words = query.split(/\s+/).filter(Boolean);
    searchFeedback.classList.remove('hidden');
    searchFeedback.textContent = `Mencari kata: "${words.join('", "')}" • Ditemukan: ${results.length} drama`;
  } else {
    dramaSearchClear.classList.add('hidden');
    searchFeedback.classList.add('hidden');
  }

  // Pengurutan (Sort Filter): Abjad A-Z, Z-A, Rating, Episode, atau Acak
  if (currentDramaSort === 'az') {
    results.sort((a, b) => a.title.localeCompare(b.title, 'id', { sensitivity: 'base' }));
  } else if (currentDramaSort === 'za') {
    results.sort((a, b) => b.title.localeCompare(a.title, 'id', { sensitivity: 'base' }));
  } else if (currentDramaSort === 'rating') {
    results.sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0));
  } else if (currentDramaSort === 'eps') {
    results.sort((a, b) => (b.total_episodes || 0) - (a.total_episodes || 0));
  }

  dramaCountLabel.textContent = `${results.length} Drama`;
  renderDramaList(results);
}

function isAdult18Item(item) {
  return Boolean(item && (item.source === 'iQOO' || String(item.id || '').startsWith('ph_')));
}

function renderCatalogGrid(gridEl, items, emptyTitle = 'Tidak ada yang cocok', emptyDesc = 'Coba gunakan kata kunci lain') {
  if (!gridEl) return;
  gridEl.innerHTML = '';

  if (items.length === 0) {
    gridEl.innerHTML = `
      <div class="col-span-2 py-12 text-center text-zinc-500">
        ${iconSvg('search-x', 'w-8 h-8 mx-auto mb-2 text-zinc-700')}
        <p class="text-xs font-semibold text-zinc-300">${escapeHtml(emptyTitle)}</p>
        <p class="text-[11px] text-zinc-500 mt-0.5">${escapeHtml(emptyDesc)}</p>
      </div>
    `;
    return;
  }

  const frag = document.createDocumentFragment();
  items.forEach(drm => {
    const isSaved = savedDramaIds.has(drm.id);
    const isAdultItem = isAdult18Item(drm);
    const card = document.createElement('div');
    card.dataset.dramaId = drm.id;
    card.className = 'bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col group cursor-pointer active:scale-95 transition-all shadow-lg';

    let likedEpCount = 0;
    if (drm.episodes) {
      drm.episodes.forEach(e => {
        if (isEpisodeLiked(drm.id, e.ep)) likedEpCount++;
      });
    }

    const safeTitle = escapeHtml(drm.title);
    const safeGenre = escapeHtml(isAdultItem ? (drm.category || '18+ iQOO') : drm.genre);
    const durationText = isAdultItem
      ? (drm.duration || drm.episodes?.[0]?.duration || 'Lengkap')
      : (drm.episodes?.[0]?.duration || drm.duration || 'Lengkap');
    const epFooter = isAdultItem
      ? ('⏱ ' + escapeHtml(durationText) + (drm.total_episodes > 1 ? ` (${drm.total_episodes} Part)` : ''))
      : (drm.total_episodes === 1
          ? '🎬 Full Movie (' + escapeHtml(durationText) + ')'
          : drm.total_episodes + ' Episode');

    const topMetricBadge = isAdultItem
      ? `<span class="px-1.5 py-0.5 rounded bg-black/65 backdrop-blur-md text-[9px] font-black ${drm.quality === '1080p' ? 'text-emerald-400' : 'text-amber-400'}">${escapeHtml(drm.quality || 'HD')}</span>`
      : `<span class="px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-[9px] font-bold text-amber-400">★ ${escapeHtml(drm.rating || '4.9')}</span>`;

    card.innerHTML = `
      <div class="relative aspect-[3/4] w-full overflow-hidden bg-zinc-800">
        <img src="${drm.poster}" alt="${safeTitle}" loading="lazy" decoding="async" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
        <div class="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent"></div>

        <div class="absolute top-2 left-2 flex items-center gap-1">
          ${topMetricBadge}
          <span class="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-black tracking-wider shadow flex items-center gap-0.5">
            🔞 18+
          </span>
        </div>

        ${drm.orientation === 'horizontal' ? `
          <span class="absolute top-2 right-10 px-1.5 py-0.5 rounded bg-amber-500 text-black text-[9px] font-black flex items-center gap-0.5 shadow">
            ⛶ 16:9 Lanskap
          </span>
        ` : `
          <span class="absolute top-2 right-10 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-zinc-300 text-[9px] font-bold">
            📱 Vertikal
          </span>
        `}

        <button class="drama-quick-save absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white border border-white/20 active:scale-75 transition-all" aria-label="Simpan Koleksi">
          ${iconSvg('bookmark', `w-3.5 h-3.5 ${isSaved ? 'text-sky-400 fill-sky-400' : 'text-white'}`)}
        </button>

        <div class="drama-liked-ep-badge ${likedEpCount > 0 ? '' : 'hidden'} absolute top-9 left-2 px-1.5 py-0.5 rounded-full bg-rose-600/90 text-white text-[9px] font-bold flex items-center gap-1 shadow-md">
          <span>❤️</span> ${likedEpCount} ${isAdultItem ? 'Disukai' : 'Ep Disukai'}
        </div>

        <div class="absolute bottom-2 left-2 right-2">
          <span class="text-[9px] font-bold uppercase tracking-wider text-rose-400">${safeGenre}</span>
          <h4 class="text-xs font-bold text-white ${isAdultItem ? 'line-clamp-2' : 'line-clamp-1'} leading-snug">${safeTitle}</h4>
        </div>
      </div>
      <div class="p-2.5 flex items-center justify-between bg-zinc-900/90 text-[10px] text-zinc-400 border-t border-zinc-800/60">
        <span class="${(drm.total_episodes === 1 || isAdultItem) ? 'text-amber-300 font-bold flex items-center gap-1' : ''}">
          ${epFooter}
        </span>
        <span class="font-bold text-amber-400 flex items-center gap-1">
          Nonton ${iconSvg('play', 'w-2.5 h-2.5 fill-amber-400')}
        </span>
      </div>
    `;

    const quickSaveBtn = card.querySelector('.drama-quick-save');
    quickSaveBtn.onclick = (e) => {
      e.stopPropagation();
      triggerHaptic('medium');
      const nowSaved = !savedDramaIds.has(drm.id);
      if (nowSaved) {
        savedDramaIds.add(drm.id);
        showToast(isAdultItem ? 'Video 18+ disimpan ke profil ✓' : 'Drama disimpan ke profil ✓', 'bookmark', 'amber', 1800);
      } else {
        savedDramaIds.delete(drm.id);
        showToast('Dihapus dari tersimpan', 'bookmark', 'zinc', 1800);
      }
      syncCatalogBookmarkIcons(drm.id, nowSaved);
      persistStorage();
    };

    card.onclick = () => {
      openDramaDetailModal(drm);
    };

    frag.appendChild(card);
  });
  gridEl.appendChild(frag);
}

function renderDramaList(dramas) {
  renderCatalogGrid(dramaListGrid, dramas, 'Tidak ada drama yang cocok', 'Coba gunakan kata kunci lain');
}

function openDramaDetailModal(drm) {
  triggerHaptic('light');
  selectedDrama = drm;
  const isAdultItem = isAdult18Item(drm);
  modalDramaPoster.src = drm.poster;
  modalDramaTitle.textContent = drm.title;
  modalDramaGenre.textContent = drm.genre;
  modalDramaRating.textContent = drm.quality ? `★ ${drm.rating || '4.9'} • ${drm.quality}` : `★ ${drm.rating || '4.9'}`;
  modalDramaEpsCount.textContent = drm.total_episodes === 1 
    ? `${isAdultItem ? 'Full Video' : 'Full Movie'} • ${drm.episodes[0]?.duration || drm.duration || 'Lengkap'}`
    : (isAdultItem ? `${drm.total_episodes} Part HD • ${drm.duration || 'Lengkap'}` : `${drm.total_episodes} Episode`);
  modalDramaSynopsis.textContent = drm.synopsis;

  const modalStartWatchLabel = document.getElementById('modal-start-watch-label');
  if (modalStartWatchLabel) {
    modalStartWatchLabel.textContent = drm.total_episodes === 1
      ? 'Putar Video'
      : (isAdultItem ? 'Mulai Nonton (Part 1)' : 'Mulai Nonton (Ep 1)');
  }

  updateModalBookmarkBtn();
  renderModalEpisodes(drm);

  modalStartWatchBtn.onclick = () => {
    dramaDetailModal.classList.add('hidden');
    openDramaReel(drm, 0); // Mulai nonton dari Ep 1
  };

  if (modalLandscapeWatchBtn) {
    if (drm.orientation === 'horizontal') {
      modalLandscapeWatchBtn.classList.remove('hidden');
      modalLandscapeWatchBtn.onclick = () => {
        dramaDetailModal.classList.add('hidden');
        openLandscapeTheater(drm, 0, 0);
      };
    } else {
      modalLandscapeWatchBtn.classList.add('hidden');
    }
  }

  dramaDetailModal.classList.remove('hidden');
}

function updateModalBookmarkBtn() {
  if (!selectedDrama) return;
  const isSaved = savedDramaIds.has(selectedDrama.id);
  if (isSaved) {
    modalBookmarkLabel.textContent = 'Tersimpan ✓';
    modalBookmarkDramaBtn.classList.add('border-sky-500', 'bg-sky-500/15', 'text-sky-400');
  } else {
    modalBookmarkLabel.textContent = 'Simpan';
    modalBookmarkDramaBtn.classList.remove('border-sky-500', 'bg-sky-500/15', 'text-sky-400');
  }
}

function renderModalEpisodes(drm) {
  modalEpisodeList.innerHTML = '';
  const isAdultItem = isAdult18Item(drm);
  const frag = document.createDocumentFragment();
  drm.episodes.forEach((ep, idx) => {
    const isLiked = isEpisodeLiked(drm.id, ep.ep);
    const epLabel = isAdultItem ? `Part ${ep.ep}` : `Ep ${ep.ep}`;
    const item = document.createElement('div');
    item.className = 'flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 transition-all';
    
    item.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-xs ${isLiked ? 'text-rose-400' : 'text-amber-400'}">
          ${ep.ep}
        </div>
        <div>
          <div class="flex items-center gap-1.5">
            <h5 class="text-xs font-bold text-white line-clamp-1">${epLabel}: ${escapeHtml(ep.title)}</h5>
            ${isLiked ? '<span class="text-[10px] text-rose-500 font-bold flex items-center gap-0.5">❤️ Disukai</span>' : ''}
          </div>
          <span class="text-[10px] text-zinc-500">${escapeHtml(ep.duration)}</span>
        </div>
      </div>
      <div class="flex items-center gap-1.5">
        <button class="ep-like-btn p-2 rounded-lg bg-zinc-800 text-zinc-300 hover:text-rose-500 active:scale-75 transition-all" aria-label="Suka Episode">
          ${iconSvg('heart', `w-3.5 h-3.5 ${isLiked ? 'text-rose-500 fill-rose-500' : 'text-zinc-400'}`)}
        </button>

        <button class="ep-chat-btn p-2 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white" title="Kirim ke Chat Telegram" aria-label="Bagikan Episode">
          ${iconSvg('send', 'w-3.5 h-3.5')}
        </button>

        <button class="ep-play-btn px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-all">
          ${iconSvg('play', 'w-3 h-3 fill-white')}
          <span>Nonton</span>
        </button>
      </div>
    `;

    item.querySelector('.ep-like-btn').onclick = (e) => {
      e.stopPropagation();
      toggleEpisodeLike(drm.id, ep.ep);
    };

    item.querySelector('.ep-play-btn').onclick = () => {
      dramaDetailModal.classList.add('hidden');
      openDramaReel(drm, idx);
    };

    item.querySelector('.ep-chat-btn').onclick = () => {
      triggerHaptic('medium');
      if (tg?.openTelegramLink) {
        tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent('ep_' + ep.message_id)}`);
      } else {
        navigator.clipboard?.writeText(`${drm.title} - Ep ${ep.ep}: ${window.location.href}`).catch(() => {});
        showToast(`Info Ep #${ep.ep} "${drm.title}" disalin! 📋`, 'send', 'amber');
      }
    };

    frag.appendChild(item);
  });
  modalEpisodeList.appendChild(frag);
}

// ============================================================
// 3. DRAMABOX VERTICAL EPISODE REEL PLAYER (SCROLL = GANTI EPISODE!)
// ============================================================
function openDramaReel(drama, startEpIndex = 0) {
  triggerHaptic('success');
  currentPlayingDrama = drama;
  currentReelEpisodeIndex = startEpIndex;

  // Pause shorts
  if (currentPlayingShortVideo) currentPlayingShortVideo.pause();

  reelDramaTitle.textContent = drama.title;
  if (reelAdultBadge) {
    reelAdultBadge.classList.toggle('hidden', !isAdult18Item(drama));
  }
  updateReelEpBadge(startEpIndex);

  // Buat vertical slides untuk semua episode tanpa mengaktifkan observer dulu (cegah ep 1 sempat autoplay)
  renderDramaReelSlides(drama, startEpIndex, false);

  // Buka modal reel & posisikan langsung ke episode terpilih sebelum observer & playback dimulai
  dramaReelModal.classList.remove('hidden');
  const targetSlide = dramaEpisodesReel.children[startEpIndex];
  if (targetSlide) {
    targetSlide.scrollIntoView({ behavior: 'auto' });
  }
  syncDramaSlideSources(startEpIndex);
  setupDramaReelObserver();

  requestAnimationFrame(() => {
    const activeSlide = dramaEpisodesReel.children[startEpIndex];
    if (activeSlide) {
      activeSlide.scrollIntoView({ behavior: 'auto' });
      const video = activeSlide.querySelector('video');
      if (video) playVideoSafely(video);
    }
  });
}

function updateReelEpBadge(epIdx) {
  if (!currentPlayingDrama) return;
  const ep = currentPlayingDrama.episodes[epIdx];
  const epNum = ep ? ep.ep : epIdx + 1;
  reelCurrentEpBadge.textContent = currentPlayingDrama.total_episodes === 1
    ? (ep?.duration || currentPlayingDrama.duration || 'Full Video')
    : `${epNum} / ${currentPlayingDrama.total_episodes}`;
}

function syncDramaSlideSources(centerIdx) {
  if (!dramaEpisodesReel) return;
  const slides = Array.from(dramaEpisodesReel.children);
  slides.forEach((slide, idx) => {
    const video = slide.querySelector('video');
    if (!video || !video.dataset.src) return;
    const dist = Math.abs(idx - centerIdx);
    const hasSrc = Boolean(video.getAttribute('src'));

    if (dist <= 2) {
      if (!hasSrc) {
        video.src = video.dataset.src;
      }
      video.preload = idx === centerIdx || idx === centerIdx + 1 ? 'auto' : 'metadata';
    } else if (dist > 5 && hasSrc) {
      video.pause();
      video.removeAttribute('src');
      video.load();
    }
  });
}

function renderDramaReelSlides(drama, startEpIndex = 0, initObserver = true) {
  dramaEpisodesReel.innerHTML = '';

  const isHorizontal = drama.orientation === 'horizontal';

  // Toggle header landscape button visibility or style
  const reelLandscapeToggleBtn = document.getElementById('reel-landscape-toggle-btn');
  if (reelLandscapeToggleBtn) {
    reelLandscapeToggleBtn.classList.remove('hidden'); // Tetap izinkan untuk video apa saja jika user mau
  }

  const frag = document.createDocumentFragment();
  const safeDramaTitle = escapeHtml(drama.title);

  drama.episodes.forEach((ep, idx) => {
    const slide = document.createElement('div');
    slide.className = `snap-slide ${isHorizontal ? 'horizontal-drama' : ''}`;
    slide.dataset.index = idx;
    slide.dataset.ep = ep.ep;

    const isLiked = isEpisodeLiked(drama.id, ep.ep);

    const streamSrc = ep.gdrive_file_id 
      ? `${STREAM_PROXY_BASE}?id=${ep.gdrive_file_id}` 
      : ep.video_url;
    const shouldHydrateNow = Math.abs(idx - startEpIndex) <= 2;
    const safeEpTitle = escapeHtml(ep.title);
    const safeDuration = escapeHtml(ep.duration || '00:00');

    slide.innerHTML = `
      <video 
        class="video-player ${isHorizontal ? 'fit-contain' : ''}"
        data-src="${streamSrc}"
        ${shouldHydrateNow ? `src="${streamSrc}"` : ''}
        playsinline
        webkit-playsinline
        preload="${idx === startEpIndex || idx === startEpIndex + 1 ? 'auto' : 'metadata'}"
        ${isMuted ? 'muted' : ''}
      ></video>

      <!-- Video Buffering / Loading Indicator for Drama Slide -->
      <div class="reel-loading-indicator hidden absolute inset-0 flex flex-col items-center justify-center bg-black/45 backdrop-blur-[2px] z-25 pointer-events-none transition-opacity duration-200">
        <div class="relative w-14 h-14 flex items-center justify-center">
          <div class="absolute inset-0 rounded-full border-2 border-amber-400/25 animate-ping"></div>
          <div class="w-12 h-12 rounded-full border-3 border-amber-400/30 border-t-amber-400 animate-spin"></div>
          <svg class="w-5 h-5 text-amber-400 absolute" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 8 6 4-6 4Z"/></svg>
        </div>
        <span class="mt-3 text-xs font-semibold text-zinc-200 tracking-wide drop-shadow">Memuat episode...</span>
      </div>

      <!-- Error / Retry Overlay for Drama Slide -->
      <div class="reel-error-overlay hidden absolute inset-0 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm z-30 px-6 text-center">
        <div class="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-400 mb-3">
          ${iconSvg('wifi-off', 'w-6 h-6')}
        </div>
        <p class="text-sm font-bold text-white mb-1">Video gagal dimuat</p>
        <p class="text-[11px] text-zinc-400 mb-4 max-w-xs">Koneksi ke server video sempat terputus. Coba muat ulang episode ini.</p>
        <button class="reel-retry-btn px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold flex items-center gap-1.5 shadow-lg active:scale-95 transition-all">
          ${iconSvg('rotate-cw', 'w-3.5 h-3.5')}
          <span>Coba Lagi</span>
        </button>
      </div>

      <!-- Gradient Overlay -->
      <div class="absolute inset-x-0 top-0 h-32 top-gradient pointer-events-none"></div>
      <div class="absolute inset-x-0 bottom-0 h-48 bottom-gradient pointer-events-none"></div>

      <!-- Play/Pause Flash Indicator Tengah (Ketuk 1x) -->
      <div class="play-indicator absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 transition-opacity duration-200 z-20">
        <div class="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white/90 shadow-2xl">
          ${iconSvg('play', 'w-8 h-8 fill-white ml-1')}
        </div>
      </div>

      <!-- RIGHT ACTION SIDEBAR (PERSIS TIKTOK/MELOLO) -->
      <div class="absolute right-3 bottom-12 flex flex-col items-center gap-4 z-20">
        
        <!-- Suka Episode Ini (❤️) -->
        <div class="flex flex-col items-center gap-1">
          <button class="reel-like-ep-btn w-11 h-11 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center active:scale-75 transition-all" aria-label="Suka Episode">
            <svg class="ep-heart-svg w-6 h-6 transition-all duration-200 ${isLiked ? 'text-rose-500 fill-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]' : 'text-white'}" viewBox="0 0 24 24" fill="${isLiked ? '#f43f5e' : 'none'}" stroke="${isLiked ? '#f43f5e' : 'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
            </svg>
          </button>
          <span class="ep-like-label text-[10px] font-semibold ${isLiked ? 'text-rose-400' : 'text-zinc-200'}">${isLiked ? 'Disukai' : 'Suka'}</span>
        </div>

        <!-- Buka Laci Episode Cepat (📑) -->
        <div class="flex flex-col items-center gap-1">
          <button class="reel-ep-list-btn w-11 h-11 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center active:scale-75 transition-all" aria-label="Daftar Episode">
            ${iconSvg('list-video', 'w-5 h-5 text-amber-400')}
          </button>
          <span class="text-[10px] font-semibold text-zinc-300">Ep ${ep.ep}</span>
        </div>

        <!-- Mode Lanskap -->
        <div class="flex flex-col items-center gap-1">
          <button class="reel-landscape-slide-btn w-11 h-11 rounded-full bg-black/50 backdrop-blur-md border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-lg active:scale-75 transition-all" aria-label="Mode Lanskap" title="Mode Lanskap">
            ${iconSvg('maximize', 'w-5 h-5 text-amber-400')}
          </button>
          <span class="text-[10px] font-semibold text-amber-300">Lanskap</span>
        </div>

        <!-- Mute Audio -->
        <div class="flex flex-col items-center gap-1">
          <button class="reel-mute-btn w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center active:scale-75 transition-all" aria-label="Toggle Suara">
            ${iconSvg(isMuted ? 'volume-x' : 'volume-2', 'w-4 h-4 text-zinc-300')}
          </button>
        </div>

      </div>

      <!-- BOTTOM METADATA & INTERACTIVE PROGRESS -->
      <div class="absolute left-4 right-20 bottom-8 z-20 space-y-2 pointer-events-auto">
        <div class="flex items-center gap-2 min-w-0">
          <span class="text-[10px] font-extrabold bg-amber-500 text-black min-w-[22px] text-center px-1.5 py-0.5 rounded shrink-0">
            ${ep.ep}
          </span>
          <span class="text-xs font-bold text-white drop-shadow truncate">
            ${safeDramaTitle}
          </span>
        </div>

        <p class="text-xs text-zinc-200 font-medium line-clamp-1 drop-shadow">
          ${safeEpTitle} • <span class="text-zinc-400">${safeDuration}</span>
        </p>

        <!-- Interactive Scrubber Progress Bar for Drama Reel (Bisa Diputar & Digeser) -->
        <div class="reel-scrubber relative w-full py-1.5 cursor-pointer touch-none pointer-events-auto group">
          <!-- Floating Time Bubble while dragging -->
          <div class="reel-scrub-bubble hidden absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-md border border-amber-400/40 text-amber-300 font-mono text-xs px-3 py-1 rounded-full shadow-2xl pointer-events-none z-50 whitespace-nowrap">
            <span class="reel-bubble-time">00:00</span> / <span class="reel-bubble-total">${safeDuration}</span>
          </div>

          <!-- Progress Track -->
          <div class="reel-scrub-track w-full h-1.5 group-hover:h-3 group-active:h-3 bg-white/25 rounded-full transition-all relative flex items-center">
            <div class="reel-progress-fill bg-amber-400 h-full rounded-full w-0 relative pointer-events-none">
              <!-- Knob Handle -->
              <div class="reel-scrub-knob absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 bg-amber-300 border-2 border-white rounded-full shadow-md scale-0 group-hover:scale-100 group-active:scale-100 transition-transform"></div>
            </div>
          </div>
        </div>

        <div class="text-[10px] text-zinc-400 flex items-center justify-between font-mono">
          <div class="flex items-center gap-1 font-semibold text-zinc-300">
            <span class="reel-time-now text-amber-300">00:00</span>
            <span>/</span>
            <span class="reel-time-total text-zinc-400">${safeDuration}</span>
          </div>
          <span class="text-[9px] text-zinc-400">⬇️ Scroll: Ep ${idx + 2 <= drama.episodes.length ? idx + 2 : 'Tamat'}</span>
        </div>
      </div>
    `;

    setupDramaSlideGestures(slide, drama, ep, idx);
    frag.appendChild(slide);
  });

  dramaEpisodesReel.appendChild(frag);
  if (initObserver) setupDramaReelObserver();
}

function setupDramaSlideGestures(slide, drama, ep, idx) {
  const video = slide.querySelector('video');
  const loaderEl = slide.querySelector('.reel-loading-indicator');
  const errorOverlay = slide.querySelector('.reel-error-overlay');
  const retryBtn = slide.querySelector('.reel-retry-btn');
  const playIndicator = slide.querySelector('.play-indicator');
  const likeBtn = slide.querySelector('.reel-like-ep-btn');
  const heartIcon = slide.querySelector('.ep-heart-svg');
  const likeLabel = slide.querySelector('.ep-like-label');
  const epListBtn = slide.querySelector('.reel-ep-list-btn');
  const landscapeSlideBtn = slide.querySelector('.reel-landscape-slide-btn');
  const muteBtn = slide.querySelector('.reel-mute-btn');

  // Interactive Scrubber Elements
  const scrubber = slide.querySelector('.reel-scrubber');
  const scrubTrack = slide.querySelector('.reel-scrub-track');
  const progressFill = slide.querySelector('.reel-progress-fill');
  const scrubKnob = slide.querySelector('.reel-scrub-knob');
  const scrubBubble = slide.querySelector('.reel-scrub-bubble');
  const bubbleTime = slide.querySelector('.reel-bubble-time');
  const bubbleTotal = slide.querySelector('.reel-bubble-total');
  const timeNowEl = slide.querySelector('.reel-time-now');
  const timeTotalEl = slide.querySelector('.reel-time-total');

  let isScrubbing = false;
  let longPressTimer = null;
  let isHolding2x = false;
  let justFinishedHold = false;
  let startX = 0;
  let startY = 0;
  let hasMoved = false;
  let lastTapTime = 0;
  let singleTapTimer = null;

  // Video Buffering / Loading Indicator & Auto-Retry Error Handling
  let autoRetried = false;
  if (video && loaderEl) {
    wireVideoLoadingIndicator(video, loaderEl);
  }
  if (video) {
    const hideError = () => {
      if (errorOverlay) errorOverlay.classList.add('hidden');
      autoRetried = false;
    };
    video.addEventListener('loadeddata', hideError);
    video.addEventListener('canplay', hideError);
    video.addEventListener('playing', hideError);
    video.addEventListener('error', () => {
      if (!video.getAttribute('src')) return;
      if (!autoRetried) {
        autoRetried = true;
        if (loaderEl) loaderEl.classList.remove('hidden');
        setTimeout(() => {
          if (dramaReelModal.classList.contains('hidden')) return;
          const src = video.dataset.src;
          if (!src) return;
          video.src = src;
          video.load();
          video.play().catch(() => {});
        }, 1200);
        return;
      }
      if (loaderEl) loaderEl.classList.add('hidden');
      if (errorOverlay) errorOverlay.classList.remove('hidden');
    });
  }
  if (retryBtn && video) {
    retryBtn.onclick = (e) => {
      e.stopPropagation();
      triggerHaptic('medium');
      if (errorOverlay) errorOverlay.classList.add('hidden');
      if (loaderEl) loaderEl.classList.remove('hidden');
      autoRetried = true;
      const src = video.dataset.src;
      if (src) {
        video.src = src;
        video.load();
        video.muted = isMuted;
        video.play().catch(() => {});
      }
    };
  }

  // 1. Duration & Progress Bar Updates
  if (video) {
    video.addEventListener('loadedmetadata', () => {
      if (timeTotalEl && video.duration) {
        timeTotalEl.textContent = formatTime(video.duration);
      }
      if (bubbleTotal && video.duration) {
        bubbleTotal.textContent = formatTime(video.duration);
      }
    });

    video.addEventListener('timeupdate', () => {
      if (isScrubbing) return;
      const cur = video.currentTime;
      const dur = video.duration || 1;
      if (progressFill) progressFill.style.width = `${(cur / dur) * 100}%`;
      if (timeNowEl) timeNowEl.textContent = formatTime(cur);
      if (timeTotalEl && video.duration && (timeTotalEl.textContent === '00:00' || timeTotalEl.textContent === '')) {
        timeTotalEl.textContent = formatTime(video.duration);
      }
    });

    video.addEventListener('play', () => {
      if (playIndicator) playIndicator.style.opacity = '0';
    });

    video.addEventListener('pause', () => {
      if (playIndicator) playIndicator.style.opacity = '1';
    });

    // 2. Auto-next episode saat video habis
    video.addEventListener('ended', () => {
      if (idx < drama.episodes.length - 1) {
        const nextSlide = dramaEpisodesReel.children[idx + 1];
        if (nextSlide) {
          nextSlide.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  }

  // 3. Interactive Scrubber (Drag / Seek Timeline)
  if (scrubber && video) {
    function seekDramaPosition(clientX) {
      if (!scrubTrack) return 0;
      const rect = scrubTrack.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      if (progressFill) progressFill.style.width = `${pct * 100}%`;
      const dur = video.duration || 1;
      const seekTime = pct * dur;
      if (timeNowEl) timeNowEl.textContent = formatTime(seekTime);
      if (bubbleTime) bubbleTime.textContent = formatTime(seekTime);
      if (bubbleTotal && video.duration) bubbleTotal.textContent = formatTime(video.duration);
      if (scrubBubble) {
        scrubBubble.style.left = `${pct * 100}%`;
        scrubBubble.classList.remove('hidden');
      }
      return seekTime;
    }

    scrubber.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      e.preventDefault();
      isScrubbing = true;
      if (scrubKnob) scrubKnob.classList.remove('scale-0');
      seekDramaPosition(e.clientX);
      triggerHaptic('light');

      const onPointerMove = (ev) => {
        if (!isScrubbing) return;
        ev.stopPropagation();
        ev.preventDefault();
        seekDramaPosition(ev.clientX);
      };

      const onPointerUp = (ev) => {
        if (!isScrubbing) return;
        isScrubbing = false;
        ev.stopPropagation();
        const finalSeek = seekDramaPosition(ev.clientX);
        if (Number.isFinite(video.duration) && video.duration > 0) {
          video.currentTime = finalSeek;
        }
        if (scrubKnob) scrubKnob.classList.add('scale-0');
        if (scrubBubble) scrubBubble.classList.add('hidden');
        video.play().catch(() => {});
        triggerHaptic('light');
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    });
  }

  // 4. TAHAN LAYAR -> 2X SPEED (Long Press Hold)
  function isInteractiveTarget(target) {
    return target.closest('button') || 
           target.closest('.z-20') || 
           target.closest('.reel-scrubber') ||
           target.closest('.reel-error-overlay');
  }

  slide.addEventListener('pointerdown', (e) => {
    if (isInteractiveTarget(e.target)) return;
    startX = e.clientX;
    startY = e.clientY;
    hasMoved = false;

    clearTimeout(longPressTimer);
    longPressTimer = setTimeout(() => {
      isHolding2x = true;
      video.playbackRate = 2.0;
      if (reelSpeedBadge) reelSpeedBadge.classList.remove('hidden');
      triggerHaptic('medium');
    }, 250);
  });

  slide.addEventListener('pointermove', (e) => {
    const dx = Math.abs(e.clientX - startX);
    const dy = Math.abs(e.clientY - startY);
    if (dx > 10 || dy > 10) {
      hasMoved = true;
      clearTimeout(longPressTimer);
    }
  });

  const stopLongPress = () => {
    clearTimeout(longPressTimer);
    if (isHolding2x) {
      isHolding2x = false;
      justFinishedHold = true;
      video.playbackRate = 1.0;
      if (reelSpeedBadge) reelSpeedBadge.classList.add('hidden');
      triggerHaptic('light');
      setTimeout(() => { justFinishedHold = false; }, 250);
    }
  };

  slide.addEventListener('pointerup', stopLongPress);
  slide.addEventListener('pointercancel', stopLongPress);
  slide.addEventListener('pointerleave', stopLongPress);

  // 4. TEKAN 1X -> JEDA / PUTAR VIDEO LANGSUNG
  function flashSeek(el) {
    if (!el) return;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 600);
  }

  slide.addEventListener('click', (e) => {
    if (justFinishedHold || isHolding2x || hasMoved) return;
    if (isInteractiveTarget(e.target)) return;

    const currentTime = Date.now();
    const tapLength = currentTime - lastTapTime;
    const rect = slide.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;

    if (tapLength < 260 && tapLength > 0) {
      // Double Tap: Mundur 10s (kiri) / Maju 10s (kanan) / Jeda (tengah)
      clearTimeout(singleTapTimer);
      if (clickX < width * 0.35) {
        triggerHaptic('medium');
        video.currentTime = Math.max(0, video.currentTime - 10);
        flashSeek(reelSeekLeft);
      } else if (clickX > width * 0.65) {
        triggerHaptic('medium');
        video.currentTime = Math.min(video.duration || 1000, video.currentTime + 10);
        flashSeek(reelSeekRight);
      } else {
        togglePlayback(video, playIndicator);
      }
    } else {
      // SINGLE TAP: Jeda / Putar Video!
      singleTapTimer = setTimeout(() => {
        togglePlayback(video, playIndicator);
      }, 180);
    }
    lastTapTime = currentTime;
  });

  // 5. Sukai Episode Ini (Melolo Style)
  likeBtn.onclick = (e) => {
    e.stopPropagation();
    toggleEpisodeLike(drama.id, ep.ep, heartIcon, likeLabel);
  };

  // 6. Buka Laci Episode Cepat
  epListBtn.onclick = (e) => {
    e.stopPropagation();
    triggerHaptic('light');
    openReelEpisodeSheet();
  };

  // 7. Tombol Mode Lanskap di Sidebar Kanan Slide
  if (landscapeSlideBtn) {
    landscapeSlideBtn.onclick = (e) => {
      e.stopPropagation();
      openLandscapeTheater(drama, idx, video.currentTime);
    };
  }

  // 8. Mute Audio (Null-safe inline SVG toggle)
  muteBtn.onclick = (e) => {
    e.stopPropagation();
    triggerHaptic('light');
    setGlobalMuted(!isMuted);
  };
}

function setupDramaReelObserver() {
  if (dramaReelObserver) dramaReelObserver.disconnect();

  dramaReelObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const video = entry.target.querySelector('video');
      const idx = parseInt(entry.target.dataset.index, 10);

      if (entry.isIntersecting && !dramaReelModal.classList.contains('hidden')) {
        currentReelEpisodeIndex = idx;
        updateReelEpBadge(idx);
        syncDramaSlideSources(idx);
        if (video) playVideoSafely(video);
      } else if (video) {
        video.pause();
        if (video.readyState > 0) video.currentTime = 0;
      }
    });
  }, { root: dramaEpisodesReel, threshold: 0.65 });

  document.querySelectorAll('#drama-episodes-reel .snap-slide').forEach(slide => {
    dramaReelObserver.observe(slide);
  });
}

// In-Reel Quick Episode Sheet
function openReelEpisodeSheet() {
  renderReelSheetGrid();
  reelEpSheet.classList.remove('hidden');
}

function renderReelSheetGrid() {
  if (!currentPlayingDrama) return;
  reelSheetGrid.innerHTML = '';

  currentPlayingDrama.episodes.forEach((ep, idx) => {
    const isCurrent = idx === currentReelEpisodeIndex;
    const isLiked = isEpisodeLiked(currentPlayingDrama.id, ep.ep);

    const btn = document.createElement('button');
    btn.className = `p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 active:scale-95 transition-all ${
      isCurrent
        ? 'bg-amber-500 text-black border-amber-400 font-bold shadow-lg'
        : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
    }`;

    btn.innerHTML = `
      <span class="text-xs font-bold">Ep ${ep.ep}</span>
      <span class="text-[9px] ${isCurrent ? 'text-black/80' : 'text-zinc-500'}">${isLiked ? '❤️ Disukai' : ep.duration}</span>
    `;

    btn.onclick = () => {
      reelEpSheet.classList.add('hidden');
      syncDramaSlideSources(idx);
      const targetSlide = dramaEpisodesReel.children[idx];
      if (targetSlide) {
        targetSlide.scrollIntoView({ behavior: 'smooth' });
      }
    };

    reelSheetGrid.appendChild(btn);
  });
}

function closeDramaReel() {
  triggerHaptic('light');
  if (dramaReelObserver) {
    dramaReelObserver.disconnect();
    dramaReelObserver = null;
  }
  if (reelSpeedBadge) reelSpeedBadge.classList.add('hidden');
  document.querySelectorAll('#drama-episodes-reel video').forEach(v => {
    v.playbackRate = 1.0;
    v.pause();
    if (v.getAttribute('src')) {
      v.removeAttribute('src');
      v.load();
    }
  });
  dramaEpisodesReel.innerHTML = '';
  reelSheetGrid.innerHTML = '';
  dramaReelModal.classList.add('hidden');
  reelEpSheet.classList.add('hidden');

  // Resume shorts if active
  if (activeView === 'shorts' && currentPlayingShortVideo) {
    playVideoSafely(currentPlayingShortVideo);
  }
}

// ============================================================
// 3B. LANDSCAPE THEATER PLAYER (UNTUK DRAMA HORIZONTAL 16:9)
// ============================================================
const dramaLandscapeTheater = document.getElementById('drama-landscape-theater');
const landscapeHeader = document.getElementById('landscape-header');
const landscapeVideo = document.getElementById('landscape-video');
const landscapeVideoContainer = document.getElementById('landscape-video-container');
const exitLandscapeBackBtn = document.getElementById('exit-landscape-back-btn');
const exitLandscapeBtn = document.getElementById('exit-landscape-btn');
const landscapeLoadingIndicator = document.getElementById('landscape-loading-indicator');
const landscapeDramaTitle = document.getElementById('landscape-drama-title');
const landscapeAdultBadge = document.getElementById('landscape-adult-badge');
const landscapeEpBadge = document.getElementById('landscape-ep-badge');
const landscapeLockBtn = document.getElementById('landscape-lock-btn');
const landscapeUnlockPill = document.getElementById('landscape-unlock-pill');
const landscapeUnlockBtn = document.getElementById('landscape-unlock-btn');
const landscapeFitBtn = document.getElementById('landscape-fit-btn');
const landscapeEpListBtn = document.getElementById('landscape-ep-list-btn');
const landscapePlayIndicator = document.getElementById('landscape-play-indicator');
const landscapeSeekLeft = document.getElementById('landscape-seek-left');
const landscapeSeekRight = document.getElementById('landscape-seek-right');
const landscapeFooter = document.getElementById('landscape-footer');
const landscapeTimeNow = document.getElementById('landscape-time-now');
const landscapeTimeTotal = document.getElementById('landscape-time-total');
const landscapeProgressTrack = document.getElementById('landscape-progress-track');
const landscapeProgressFill = document.getElementById('landscape-progress-fill');
const landscapeScrubBubble = document.getElementById('landscape-scrub-bubble');
const landscapeBubbleTime = document.getElementById('landscape-bubble-time');
const landscapeBubbleTotal = document.getElementById('landscape-bubble-total');
const landscapeScrubKnob = document.getElementById('landscape-scrub-knob');
const landscapePrevEpBtn = document.getElementById('landscape-prev-ep-btn');
const landscapeTogglePlayBtn = document.getElementById('landscape-toggle-play-btn');
const landscapePlayBtnIcon = document.getElementById('landscape-play-btn-icon');
const landscapeNextEpBtn = document.getElementById('landscape-next-ep-btn');
const landscapeMuteBtn = document.getElementById('landscape-mute-btn');
const landscapeMuteIcon = document.getElementById('landscape-mute-icon');
const landscapeEpSheet = document.getElementById('landscape-ep-sheet');
const closeLandscapeEpSheet = document.getElementById('close-landscape-ep-sheet');
const landscapeSheetGrid = document.getElementById('landscape-sheet-grid');
const landscapeSpeedBadge = document.getElementById('landscape-speed-badge');

const LANDSCAPE_IDLE_HIDE_MS = 2800;
let currentLandscapeDrama = null;
let currentLandscapeEpIndex = 0;
let lastLandscapeTapTime = 0;
let landscapeTapTimer = null;
let landscapeFitMode = 'contain'; // 'contain' (Pas) | 'cover' (Penuh)
let landscapeControlsTimer = null;
let isLandscapeScrubbing = false;
let isLandscapeLocked = false;
let landscapeUnlockHintTimer = null;

function syncLandscapeViewport() {
  if (!dramaLandscapeTheater || dramaLandscapeTheater.classList.contains('hidden')) return;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (vh > vw) {
    dramaLandscapeTheater.style.setProperty('--theater-vw', `${vw}px`);
    dramaLandscapeTheater.style.setProperty('--theater-vh', `${vh}px`);
    dramaLandscapeTheater.classList.add('rotate-mobile');
  } else {
    dramaLandscapeTheater.style.removeProperty('--theater-vw');
    dramaLandscapeTheater.style.removeProperty('--theater-vh');
    dramaLandscapeTheater.classList.remove('rotate-mobile');
  }
}

function getEffectiveLandscapeCover() {
  return landscapeFitMode === 'cover';
}

function applyLandscapeVideoFit() {
  if (!landscapeVideo) return;
  const useCover = getEffectiveLandscapeCover();
  landscapeVideo.classList.toggle('object-cover', useCover);
  landscapeVideo.classList.toggle('object-contain', !useCover);
  if (landscapeFitBtn) {
    landscapeFitBtn.innerHTML = `${iconSvg(useCover ? 'maximize' : 'minimize', 'w-3.5 h-3.5 text-amber-300')}<span>${useCover ? 'Penuh' : 'Pas'}</span>`;
    landscapeFitBtn.className = useCover
      ? 'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 backdrop-blur-md border border-amber-400/50 text-amber-300 text-xs font-bold active:scale-95 transition-all'
      : 'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-xs font-bold active:scale-95 transition-all';
  }
}

function isLandscapeControlsHidden() {
  return Boolean(dramaLandscapeTheater && dramaLandscapeTheater.classList.contains('landscape-controls-hidden'));
}

function clearLandscapeControlsTimer() {
  if (landscapeControlsTimer) {
    clearTimeout(landscapeControlsTimer);
    landscapeControlsTimer = null;
  }
}

function hideLandscapeControls() {
  if (!dramaLandscapeTheater || dramaLandscapeTheater.classList.contains('hidden')) return false;
  if (!landscapeVideo || landscapeVideo.paused || landscapeVideo.ended) return false;
  if (isLandscapeScrubbing) return false;
  if (landscapeEpSheet && !landscapeEpSheet.classList.contains('hidden')) return false;
  clearLandscapeControlsTimer();
  dramaLandscapeTheater.classList.add('landscape-controls-hidden');
  return true;
}

function clearLandscapeUnlockHintTimer() {
  if (landscapeUnlockHintTimer) {
    clearTimeout(landscapeUnlockHintTimer);
    landscapeUnlockHintTimer = null;
  }
}

function revealLandscapeUnlockHint(autoHideMs = 2400) {
  if (!landscapeUnlockPill || !isLandscapeLocked) return;
  clearLandscapeUnlockHintTimer();
  landscapeUnlockPill.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
  landscapeUnlockPill.classList.add('opacity-100');
  if (autoHideMs > 0) {
    landscapeUnlockHintTimer = setTimeout(() => {
      if (!landscapeUnlockPill) return;
      landscapeUnlockPill.classList.remove('opacity-100');
      landscapeUnlockPill.classList.add('opacity-0', 'pointer-events-none');
    }, autoHideMs);
  }
}

function setLandscapeLocked(locked) {
  isLandscapeLocked = Boolean(locked);
  clearLandscapeUnlockHintTimer();
  if (dramaLandscapeTheater) {
    dramaLandscapeTheater.classList.toggle('landscape-locked', isLandscapeLocked);
  }
  if (landscapeLockBtn) {
    landscapeLockBtn.innerHTML = iconSvg(isLandscapeLocked ? 'unlock' : 'lock', 'w-4 h-4');
  }
  if (isLandscapeLocked) {
    clearLandscapeControlsTimer();
    if (landscapeEpSheet) landscapeEpSheet.classList.add('hidden');
    revealLandscapeUnlockHint(2200);
  } else {
    if (landscapeUnlockPill) {
      landscapeUnlockPill.classList.add('hidden', 'opacity-0', 'pointer-events-none');
      landscapeUnlockPill.classList.remove('opacity-100');
    }
    showLandscapeControls(true);
  }
}

function resetLandscapeControlsTimer(delay = LANDSCAPE_IDLE_HIDE_MS) {
  clearLandscapeControlsTimer();
  if (isLandscapeLocked) return;
  if (!dramaLandscapeTheater || dramaLandscapeTheater.classList.contains('hidden')) return;
  if (!landscapeVideo || landscapeVideo.paused || landscapeVideo.ended) return;
  if (isLandscapeScrubbing) return;
  if (landscapeEpSheet && !landscapeEpSheet.classList.contains('hidden')) return;
  landscapeControlsTimer = setTimeout(() => {
    hideLandscapeControls();
  }, delay);
}

function showLandscapeControls(autoSchedule = true) {
  if (!dramaLandscapeTheater || isLandscapeLocked) return;
  dramaLandscapeTheater.classList.remove('landscape-controls-hidden');
  if (autoSchedule) {
    resetLandscapeControlsTimer();
  } else {
    clearLandscapeControlsTimer();
  }
}

function getLandscapeNormalizedAxis(rect, clientX, clientY) {
  if (dramaLandscapeTheater && dramaLandscapeTheater.classList.contains('rotate-mobile')) {
    return (clientY - rect.top) / Math.max(1, rect.height);
  }
  return (clientX - rect.left) / Math.max(1, rect.width);
}

function toggleLandscapePlayState() {
  if (!landscapeVideo || isLandscapeLocked) return;
  if (landscapeVideo.paused) {
    landscapeVideo.play()
      .then(() => {
        updateLandscapePlayBtn(true);
        resetLandscapeControlsTimer();
      })
      .catch(() => updateLandscapePlayBtn(false));
  } else {
    landscapeVideo.pause();
    updateLandscapePlayBtn(false);
    showLandscapeControls(false);
  }
}

function openLandscapeTheater(drama, startEpIdx = 0, startTime = 0) {
  triggerHaptic('medium');
  currentLandscapeDrama = drama;
  currentLandscapeEpIndex = startEpIdx;
  landscapeFitMode = 'contain';
  setLandscapeLocked(false);

  // Pause all portrait videos
  document.querySelectorAll('#drama-episodes-reel video').forEach(v => v.pause());

  dramaLandscapeTheater.classList.remove('hidden');
  syncLandscapeViewport();
  showLandscapeControls(false);
  applyLandscapeVideoFit();

  try {
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock('landscape').catch(() => {});
    }
  } catch (e) {}

  playLandscapeEpisode(startEpIdx, startTime);
}

function playLandscapeEpisode(epIdx, startTime = 0) {
  if (!currentLandscapeDrama) return;
  const activeDrama = currentLandscapeDrama;
  const ep = activeDrama.episodes[epIdx];
  if (!ep) return;

  currentLandscapeEpIndex = epIdx;
  landscapeDramaTitle.textContent = activeDrama.title;
  if (landscapeAdultBadge) {
    landscapeAdultBadge.classList.toggle('hidden', !isAdult18Item(activeDrama));
  }
  landscapeEpBadge.textContent = activeDrama.total_episodes === 1
    ? (ep.duration || activeDrama.duration || 'Full Video')
    : `${ep.ep} / ${activeDrama.total_episodes}`;

  // Stream URL with proxy
  const streamSrc = ep.gdrive_file_id 
    ? `${STREAM_PROXY_BASE}?id=${ep.gdrive_file_id}` 
    : ep.video_url;

  landscapeVideo.src = streamSrc;
  landscapeVideo.muted = isMuted;
  landscapeVideo.playbackRate = 1.0;
  if (landscapeSpeedBadge) landscapeSpeedBadge.classList.add('hidden');
  updateLandscapeMuteBtn();
  applyLandscapeVideoFit();
  showLandscapeControls(true);

  let landscapeRetried = false;
  landscapeVideo.onloadedmetadata = () => {
    applyLandscapeVideoFit();
    if (startTime > 0 && Number.isFinite(landscapeVideo.duration) && startTime < landscapeVideo.duration) {
      landscapeVideo.currentTime = startTime;
    }
    landscapeTimeTotal.textContent = formatTime(landscapeVideo.duration || 0);
  };
  landscapeVideo.onloadeddata = () => {
    landscapeRetried = false;
  };
  landscapeVideo.onerror = () => {
    if (!landscapeVideo.getAttribute('src') || dramaLandscapeTheater.classList.contains('hidden')) return;
    if (currentLandscapeDrama !== activeDrama || currentLandscapeEpIndex !== epIdx) return;
    if (!landscapeRetried) {
      landscapeRetried = true;
      if (landscapeLoadingIndicator) landscapeLoadingIndicator.classList.remove('hidden');
      setTimeout(() => {
        if (dramaLandscapeTheater.classList.contains('hidden')) return;
        if (currentLandscapeDrama !== activeDrama || currentLandscapeEpIndex !== epIdx) return;
        landscapeVideo.src = streamSrc;
        landscapeVideo.load();
        playVideoSafely(landscapeVideo, (ok) => {
          updateLandscapePlayBtn(ok);
          if (ok) resetLandscapeControlsTimer();
        });
      }, 1200);
    } else {
      showToast('Gagal memutar episode, coba pilih ulang atau periksa koneksi.', 'alert-circle', 'rose', 3500);
    }
  };

  playVideoSafely(landscapeVideo, (ok) => {
    updateLandscapePlayBtn(ok);
    if (ok) resetLandscapeControlsTimer();
  });

  // Update prev / next buttons state
  landscapePrevEpBtn.style.opacity = epIdx > 0 ? '1' : '0.4';
  landscapeNextEpBtn.style.opacity = epIdx < activeDrama.episodes.length - 1 ? '1' : '0.4';
}

function updateLandscapePlayBtn(isPlaying) {
  if (!landscapeTogglePlayBtn) return;
  landscapeTogglePlayBtn.innerHTML = iconSvg(isPlaying ? 'pause' : 'play', 'w-5 h-5 fill-black');
}

function updateLandscapeMuteBtn() {
  if (!landscapeMuteBtn) return;
  landscapeMuteBtn.innerHTML = iconSvg(isMuted ? 'volume-x' : 'volume-2', 'w-5 h-5');
}

function closeLandscapeTheater() {
  triggerHaptic('light');
  setLandscapeLocked(false);
  clearLandscapeControlsTimer();
  dramaLandscapeTheater.classList.remove('landscape-controls-hidden');
  if (landscapeSpeedBadge) landscapeSpeedBadge.classList.add('hidden');
  const savedTime = landscapeVideo ? landscapeVideo.currentTime : 0;
  if (landscapeVideo) {
    landscapeVideo.playbackRate = 1.0;
    landscapeVideo.pause();
    landscapeVideo.removeAttribute('src');
    landscapeVideo.load();
  }

  dramaLandscapeTheater.classList.add('hidden');
  dramaLandscapeTheater.classList.remove('rotate-mobile');
  dramaLandscapeTheater.style.removeProperty('--theater-vw');
  dramaLandscapeTheater.style.removeProperty('--theater-vh');

  try {
    if (screen.orientation && screen.orientation.unlock) {
      screen.orientation.unlock();
    }
  } catch (e) {}

  // Sync back to portrait reel if reel is currently open
  if (currentLandscapeDrama && !dramaReelModal.classList.contains('hidden')) {
    currentReelEpisodeIndex = currentLandscapeEpIndex;
    updateReelEpBadge(currentLandscapeEpIndex);
    syncDramaSlideSources(currentLandscapeEpIndex);
    const targetSlide = dramaEpisodesReel.children[currentLandscapeEpIndex];
    if (targetSlide) {
      targetSlide.scrollIntoView({ behavior: 'auto' });
      const v = targetSlide.querySelector('video');
      if (v) {
        v.currentTime = savedTime;
        v.muted = isMuted;
        v.play().catch(() => {});
      }
    }
  }
}

// In-Landscape Episode Sheet Drawer
function openLandscapeEpisodeSheet() {
  if (!currentLandscapeDrama) return;
  showLandscapeControls(false);
  landscapeSheetGrid.innerHTML = '';

  currentLandscapeDrama.episodes.forEach((ep, idx) => {
    const isCurrent = idx === currentLandscapeEpIndex;
    const btn = document.createElement('button');
    btn.className = `p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 active:scale-95 transition-all ${
      isCurrent
        ? 'bg-amber-500 border-amber-400 text-black font-extrabold shadow-lg'
        : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
    }`;

    btn.innerHTML = `
      <span class="text-xs font-bold">Ep ${ep.ep}</span>
    `;

    btn.onclick = () => {
      landscapeEpSheet.classList.add('hidden');
      triggerHaptic('medium');
      playLandscapeEpisode(idx, 0);
    };

    landscapeSheetGrid.appendChild(btn);
  });

  landscapeEpSheet.classList.remove('hidden');
}

// ============================================================
// 4. PROFILE & STATS
// ============================================================
function updateStatsDisplay() {
  const likesCount = likedVideoIds.size;
  const shortsCount = savedShortIds.size;
  const dramaCount = savedDramaIds.size;

  statLikesCount.textContent = likesCount;
  statShortsCount.textContent = shortsCount;
  statDramaCount.textContent = dramaCount;

  tabLikesNum.textContent = likesCount;
  tabShortsNum.textContent = shortsCount;
  tabDramaNum.textContent = dramaCount;

  if (activeView === 'profile') {
    renderProfileContent();
  }
}

function renderProfileContent() {
  profileContentArea.innerHTML = '';

  if (profileTab === 'likes') {
    const targetVideos = allVideos.filter(v => likedVideoIds.has(v.id));
    if (targetVideos.length === 0) {
      renderEmptyState('heart-off', 'Belum Ada Video Disukai', 'Ketuk Love ❤️ 2x saat menonton video Shorts untuk menyukai!');
      return;
    }
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-3 gap-1 p-1';
    const frag = document.createDocumentFragment();
    targetVideos.forEach(v => {
      const card = document.createElement('div');
      card.className = 'relative aspect-[3/4] bg-zinc-900 rounded-lg overflow-hidden cursor-pointer active:opacity-75 transition-opacity group';
      card.innerHTML = `
        <img src="${thumbUrl(v.gdrive_file_id, 480)}" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" decoding="async" alt="${escapeHtml(v.title)}">
        <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
        <div class="absolute bottom-1.5 left-1.5 flex items-center gap-1 text-[10px] font-bold text-white drop-shadow">
          <svg class="w-3.5 h-3.5 text-rose-500 fill-rose-500 drop-shadow" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          <span>${formatCount(v.likes)}</span>
        </div>
      `;
      card.onclick = () => {
        triggerHaptic('light');
        switchView('shorts');
        currentTopicId = 0;
        renderShortsFeed(v.id);
      };
      frag.appendChild(card);
    });
    grid.appendChild(frag);
    profileContentArea.appendChild(grid);

  } else if (profileTab === 'shorts') {
    // ============================================================
    // TIKTOK-STYLE CUSTOM COLLECTIONS
    // ============================================================
    if (currentViewingCollectionId === null) {
      // 1. DIRECTORY KOLEKSI TIKTOK (LIST SEMUA FOLDER KOLEKSI)
      const container = document.createElement('div');
      container.className = 'p-3 space-y-4';

      // Header Buat Koleksi Baru
      const topBar = document.createElement('div');
      topBar.className = 'flex items-center justify-between pb-1';
      topBar.innerHTML = `
        <div>
          <h4 class="text-xs font-bold text-white flex items-center gap-1.5">
            ${iconSvg('folder', 'w-4 h-4 text-amber-400')}
            <span>Koleksi Saya (${customCollections.length})</span>
          </h4>
          <p class="text-[10px] text-zinc-400">Atur dan kelompokkan video favoritmu</p>
        </div>
        <button id="btn-create-col-profile" class="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-900/30 active:scale-95 transition-all">
          ${iconSvg('plus', 'w-3.5 h-3.5 stroke-[3]')}
          <span>Buat Koleksi</span>
        </button>
      `;
      topBar.querySelector('#btn-create-col-profile').onclick = () => {
        openCreateCollectionModal();
      };
      container.appendChild(topBar);

      // Grid Folder Koleksi
      const colGrid = document.createElement('div');
      colGrid.className = 'grid grid-cols-2 gap-3';

      customCollections.forEach(col => {
        const card = document.createElement('div');
        card.className = 'relative bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden cursor-pointer active:scale-95 transition-all group flex flex-col';
        const safeColName = escapeHtml(col.name);

        // Ambil thumbnail dari video terakhir di koleksi ini
        let coverUrl = '';
        if (col.videoIds.length > 0) {
          const lastVidId = col.videoIds[col.videoIds.length - 1];
          const foundVid = allVideos.find(v => v.id === lastVidId);
          if (foundVid && foundVid.gdrive_file_id) {
            coverUrl = thumbUrl(foundVid.gdrive_file_id, 480);
          }
        }

        card.innerHTML = `
          <div class="relative aspect-video w-full bg-zinc-950 overflow-hidden flex items-center justify-center">
            ${coverUrl ? `
              <img src="${coverUrl}" loading="lazy" decoding="async" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt="${safeColName}">
              <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            ` : `
              <div class="w-full h-full bg-zinc-800/80 flex flex-col items-center justify-center text-zinc-600 gap-1">
                ${iconSvg('folder', 'w-7 h-7 text-zinc-500')}
                <span class="text-[9px] font-semibold text-zinc-500">Kosong</span>
              </div>
            `}
            <span class="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[9px] font-bold text-amber-400 flex items-center gap-1">
              ${iconSvg(col.isDefault ? 'bookmark' : 'folder', `w-3 h-3 ${col.isDefault ? 'fill-amber-400' : ''}`)}
              <span>${col.isDefault ? 'Semua' : 'Koleksi'}</span>
            </span>
            ${!col.isDefault ? `
              <button class="btn-delete-col absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 backdrop-blur-md text-zinc-400 hover:text-rose-400 flex items-center justify-center active:scale-90 transition-all z-10" title="Hapus Koleksi" aria-label="Hapus Koleksi">
                ${iconSvg('trash-2', 'w-3.5 h-3.5')}
              </button>
            ` : ''}
          </div>
          <div class="p-2.5 flex flex-col justify-between flex-1 bg-zinc-900/90">
            <h5 class="text-xs font-bold text-white line-clamp-1">${safeColName}</h5>
            <div class="flex items-center justify-between text-[10px] text-zinc-400 mt-1">
              <span>${col.videoIds.length} video</span>
              <span class="text-amber-400 font-semibold flex items-center gap-0.5">Buka →</span>
            </div>
          </div>
        `;

        const delBtn = card.querySelector('.btn-delete-col');
        if (delBtn) {
          delBtn.onclick = (e) => {
            e.stopPropagation();
            if (confirm(`Hapus koleksi "${col.name}"? Video di dalamnya tetap tersimpan di koleksi utama.`)) {
              deleteCollection(col.id);
              showToast(`Koleksi "${col.name}" dihapus`, 'trash-2', 'zinc');
              renderProfileContent();
            }
          };
        }

        card.onclick = () => {
          triggerHaptic('light');
          currentViewingCollectionId = col.id;
          renderProfileContent();
        };

        colGrid.appendChild(card);
      });

      container.appendChild(colGrid);
      profileContentArea.appendChild(container);

    } else {
      // 2. TAMPILAN DALAM FOLDER KOLEKSI (DETAIL ISI VIDEO)
      const col = customCollections.find(c => c.id === currentViewingCollectionId);
      if (!col) {
        currentViewingCollectionId = null;
        renderProfileContent();
        return;
      }

      const container = document.createElement('div');
      container.className = 'p-3 space-y-3';
      const safeColName = escapeHtml(col.name);

      // Navigasi Kembali & Judul Folder
      const navHeader = document.createElement('div');
      navHeader.className = 'flex items-center justify-between pb-2 border-b border-zinc-800';
      navHeader.innerHTML = `
        <button id="btn-back-collections" class="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 active:scale-95 transition-all">
          ${iconSvg('arrow-left', 'w-4 h-4')}
          <span>Kembali ke Koleksi</span>
        </button>
        <span class="text-[11px] font-semibold text-zinc-300">
          ${safeColName} (${col.videoIds.length} video)
        </span>
      `;
      navHeader.querySelector('#btn-back-collections').onclick = () => {
        triggerHaptic('light');
        currentViewingCollectionId = null;
        renderProfileContent();
      };
      container.appendChild(navHeader);

      const targetVideos = allVideos.filter(v => col.videoIds.includes(v.id));
      if (targetVideos.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'flex flex-col items-center justify-center py-16 text-center px-4';
        emptyState.innerHTML = `
          <div class="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-3">
            ${iconSvg('bookmark-x', 'w-6 h-6')}
          </div>
          <h5 class="text-xs font-bold text-white mb-1">Folder Koleksi Kosong</h5>
          <p class="text-[11px] text-zinc-400 max-w-xs">Simpan video dengan tombol Bookmark 🔖 di Shorts lalu masukkan ke folder "${safeColName}"!</p>
          <button id="btn-explore-shorts-empty" class="mt-4 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold text-xs active:scale-95 transition-all shadow-lg shadow-rose-900/30">
            Jelajahi Shorts 🎬
          </button>
        `;
        const exploreBtn = emptyState.querySelector('#btn-explore-shorts-empty');
        if (exploreBtn) {
          exploreBtn.onclick = () => switchView('shorts');
        }
        container.appendChild(emptyState);
      } else {
        const grid = document.createElement('div');
        grid.className = 'grid grid-cols-3 gap-1';
        const frag = document.createDocumentFragment();
        targetVideos.forEach(v => {
          const card = document.createElement('div');
          card.className = 'relative aspect-[3/4] bg-zinc-900 rounded-lg overflow-hidden cursor-pointer active:opacity-75 transition-opacity group';
          card.innerHTML = `
            <img src="${thumbUrl(v.gdrive_file_id, 480)}" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" decoding="async" alt="${escapeHtml(v.title)}">
            <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
            <div class="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between text-[10px] font-bold text-white drop-shadow">
              <span class="flex items-center gap-0.5 text-amber-400">
                ${iconSvg('bookmark', 'w-3 h-3 fill-amber-400')}
              </span>
              <span class="text-[9px] text-zinc-200 line-clamp-1">${escapeHtml(v.topic_name)}</span>
            </div>
          `;
          card.onclick = () => {
            triggerHaptic('light');
            switchView('shorts');
            currentTopicId = 0;
            renderShortsFeed(v.id);
          };
          frag.appendChild(card);
        });
        grid.appendChild(frag);
        container.appendChild(grid);
      }

      profileContentArea.appendChild(container);
    }

  } else if (profileTab === 'drama') {
    const targetDramas = getAllCatalogMedia().filter(d => savedDramaIds.has(d.id));
    if (targetDramas.length === 0) {
      renderEmptyState('clapperboard', 'Koleksi Drama & 18+ Kosong', 'Buka menu Drama atau 18+ lalu simpan judul favoritmu!');
      return;
    }
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-2 gap-2.5 p-1';
    const frag = document.createDocumentFragment();
    targetDramas.forEach(drm => {
      const card = document.createElement('div');
      card.className = 'bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col cursor-pointer active:scale-95 transition-all';
      
      let likedCount = 0;
      if (drm.episodes) {
        drm.episodes.forEach(e => {
          if (isEpisodeLiked(drm.id, e.ep)) likedCount++;
        });
      }

      const footerCount = drm.total_episodes === 1
        ? escapeHtml(drm.episodes?.[0]?.duration || drm.duration || 'Full Video')
        : `${drm.total_episodes} Ep`;

      card.innerHTML = `
        <div class="relative aspect-[3/4] w-full bg-zinc-800">
          <img src="${drm.poster}" alt="${escapeHtml(drm.title)}" loading="lazy" decoding="async" class="w-full h-full object-cover">
          <span class="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-sky-400">
            ${iconSvg('bookmark', 'w-3.5 h-3.5 fill-sky-400')}
          </span>
          <div class="absolute top-1.5 left-1.5 flex items-center gap-1">
            <span class="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-black tracking-wider shadow">🔞 18+</span>
            ${likedCount > 0 ? `
              <div class="px-1.5 py-0.5 rounded-full bg-rose-600/90 text-white text-[9px] font-bold flex items-center gap-0.5">
                <span>❤️</span> ${likedCount}
              </div>
            ` : ''}
          </div>
          <div class="absolute bottom-1.5 left-1.5 right-1.5">
            <span class="text-[9px] font-bold text-amber-400">${escapeHtml(drm.category || drm.genre)}</span>
            <h5 class="text-xs font-bold text-white line-clamp-1">${escapeHtml(drm.title)}</h5>
          </div>
        </div>
        <div class="p-2 flex items-center justify-between text-[10px] text-zinc-400">
          <span>${footerCount}</span>
          <span class="text-amber-400 font-bold">Lanjut Nonton →</span>
        </div>
      `;
      card.onclick = () => {
        openDramaDetailModal(drm);
      };
      frag.appendChild(card);
    });
    grid.appendChild(frag);
    profileContentArea.appendChild(grid);
  }
}

function renderEmptyState(icon, title, desc) {
  profileContentArea.innerHTML = `
    <div class="py-16 px-4 flex flex-col items-center justify-center text-center text-zinc-500">
      ${iconSvg(icon, 'w-10 h-10 mb-2 text-zinc-700')}
      <h5 class="text-xs font-bold text-zinc-300">${escapeHtml(title)}</h5>
      <p class="text-[11px] text-zinc-500 mt-1 max-w-xs leading-relaxed">${escapeHtml(desc)}</p>
    </div>
  `;
}

// ============================================================
// 5. DRAWER 6 TOPIK & NAVIGATION
// ============================================================
function renderDrawerTopics() {
  drawerTopicsList.innerHTML = '';
  const frag = document.createDocumentFragment();
  allTopics.forEach(topic => {
    const isSelected = topic.id === currentTopicId;
    const isIqoo = topic.device === 'iQOO' || /iqoo/i.test(topic.name || '');
    const btn = document.createElement('button');
    btn.className = `w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left ${
      isSelected
        ? 'bg-rose-500/15 border-rose-500 text-white font-semibold'
        : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
    }`;

    const topicIcon = topic.id === 0 ? 'flame' : (isIqoo ? 'smartphone' : 'folder-heart');

    btn.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl flex items-center justify-center ${isSelected ? 'bg-rose-500 text-white' : (isIqoo ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-700/40' : 'bg-zinc-800 text-zinc-400')}">
          ${iconSvg(topicIcon, 'w-4 h-4')}
        </div>
        <div>
          <div class="text-sm font-semibold">${escapeHtml(topic.name)}</div>
          <div class="text-[11px] text-zinc-400">${escapeHtml(topic.count || '~200 video')}</div>
        </div>
      </div>
      ${isSelected ? iconSvg('check', 'w-5 h-5 text-rose-500') : iconSvg('chevron-right', 'w-4 h-4 text-zinc-600')}
    `;

    btn.onclick = () => {
      triggerHaptic('light');
      currentTopicId = topic.id;
      closeDrawer();
      switchView('shorts');
      renderShortsFeed();
      renderDrawerTopics();
    };

    frag.appendChild(btn);
  });
  drawerTopicsList.appendChild(frag);
}

let topicDrawerCloseTimer = null;

function openDrawer() {
  triggerHaptic('light');
  clearTimeout(topicDrawerCloseTimer);
  topicDrawer.classList.remove('hidden');
  requestAnimationFrame(() => {
    drawerBackdrop.classList.remove('opacity-0');
    drawerBackdrop.classList.add('opacity-100');
    drawerContent.classList.remove('translate-y-full');
    drawerContent.classList.add('translate-y-0');
  });
}

// ============================================================
// 2C. COMIC HUB & DUAL-MODE READER (WEBTOON & SWAP)
// ============================================================

function getComicSortLabel(sort) {
  switch (sort) {
    case 'az': return 'Abjad A - Z';
    case 'za': return 'Abjad Z - A';
    case 'pages': return 'Halaman Terbanyak';
    default: return 'Acak';
  }
}

function updateComicSortUI() {
  if (comicSortLabel) comicSortLabel.textContent = getComicSortLabel(currentComicSort);
  comicSortOptions?.forEach(opt => {
    const isAct = opt.dataset.sort === currentComicSort;
    opt.classList.toggle('bg-emerald-950/40', isAct);
    opt.classList.toggle('border-emerald-500/40', isAct);
    opt.classList.toggle('text-white', isAct);
    opt.classList.toggle('bg-zinc-900', !isAct);
    opt.classList.toggle('border-zinc-800', !isAct);
    opt.classList.toggle('text-zinc-300', !isAct);
    opt.querySelector('.sort-check')?.classList.toggle('hidden', !isAct);
  });
}

function openComicSortSheet() {
  comicSortSheet?.classList.remove('hidden');
}

function closeComicSortSheet() {
  comicSortSheet?.classList.add('hidden');
}

function renderComicAuthorPills() {
  if (!comicAuthorPills) return;
  comicAuthorPills.innerHTML = '';

  const authors = ['all', ...new Set(allComics.map(c => c.author))].filter(Boolean);
  const frag = document.createDocumentFragment();

  authors.forEach(auth => {
    const btn = document.createElement('button');
    const isAct = auth === currentComicAuthor;
    btn.className = `author-pill px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap active:scale-95 transition-all ${isAct ? 'bg-emerald-500 text-black shadow-sm font-bold' : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white'}`;
    btn.textContent = auth === 'all' ? 'Semua Kreator' : auth;
    btn.onclick = () => {
      currentComicAuthor = auth;
      renderComicAuthorPills();
      filterAndRenderComics();
      triggerHaptic('light');
    };
    frag.appendChild(btn);
  });

  comicAuthorPills.appendChild(frag);
}

function filterAndRenderComics() {
  if (!comicListGrid) return;
  const query = (comicSearchInput?.value || '').trim();
  let results = [...allComics];

  if (currentComicAuthor !== 'all') {
    results = results.filter(c => c.author === currentComicAuthor);
  }

  if (query.length > 0) {
    comicSearchClear?.classList.remove('hidden');
    const rawWords = query.toLowerCase().split(/\s+/).filter(Boolean);
    results = results.filter(c => {
      const corpus = `${c.title} ${c.author}`.toLowerCase();
      return rawWords.every(w => corpus.includes(w));
    });
    if (comicSearchFeedback) {
      comicSearchFeedback.classList.remove('hidden');
      comicSearchFeedback.textContent = `Mencari: "${query}" • Ditemukan: ${results.length} komik`;
    }
  } else {
    comicSearchClear?.classList.add('hidden');
    comicSearchFeedback?.classList.add('hidden');
  }

  if (currentComicSort === 'az') {
    results.sort((a, b) => a.title.localeCompare(b.title, 'id', { sensitivity: 'base' }));
  } else if (currentComicSort === 'za') {
    results.sort((a, b) => b.title.localeCompare(a.title, 'id', { sensitivity: 'base' }));
  } else if (currentComicSort === 'pages') {
    results.sort((a, b) => (b.page_count || 0) - (a.page_count || 0));
  }

  if (comicCountLabel) {
    comicCountLabel.textContent = `${results.length} Komik`;
  }

  renderComicList(results);
}

function renderComicList(items) {
  if (!comicListGrid) return;
  comicListGrid.innerHTML = '';

  if (items.length === 0) {
    comicListGrid.innerHTML = `
      <div class="col-span-2 py-12 text-center text-zinc-500">
        ${iconSvg('book-open', 'w-8 h-8 mx-auto mb-2 text-zinc-700')}
        <p class="text-xs font-semibold text-zinc-300">Komik tidak ditemukan</p>
        <p class="text-[11px] text-zinc-500 mt-0.5">Coba gunakan nama kreator atau kata kunci lain</p>
      </div>
    `;
    return;
  }

  const frag = document.createDocumentFragment();
  items.forEach(c => {
    const card = document.createElement('div');
    card.className = 'comic-card group relative rounded-2xl overflow-hidden bg-zinc-900/90 border border-zinc-800/80 hover:border-emerald-500/50 transition-all duration-300 flex flex-col cursor-pointer active:scale-98 shadow-lg shadow-black/40';

    const posterUrl = thumbUrl(c.cover_file_id, 480);
    const safeTitle = escapeHtml(c.title);
    const safeAuthor = escapeHtml(c.author);
    const chCount = c.chapters_count || c.chapters?.length || 1;
    const isMulti = c.is_multi_chapter || chCount > 1;
    const isPdf = c.is_pdf;

    card.innerHTML = `
      <div class="relative w-full aspect-[3/4] bg-zinc-950 overflow-hidden">
        ${posterUrl ? `
          <img 
            src="${posterUrl}" 
            referrerpolicy="no-referrer"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
            alt="${safeTitle}" 
            loading="lazy" 
            decoding="async"
            onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.classList.remove('hidden');"
          />
        ` : ''}
        <div class="${posterUrl ? 'hidden' : ''} absolute inset-0 flex flex-col items-center justify-center p-3 text-center bg-zinc-950 text-zinc-500">
          ${iconSvg('book-open', 'w-8 h-8 text-emerald-500/40 mb-1')}
          <span class="text-[10px] text-zinc-400 font-semibold line-clamp-2">${safeTitle}</span>
        </div>

        <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none"></div>

        <!-- Badges -->
        <div class="absolute top-2 left-2 flex items-center gap-1">
          <span class="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-emerald-400 font-bold text-[9px]">
            ${escapeHtml(safeAuthor)}
          </span>
          ${isPdf ? `
            <span class="px-1.5 py-0.5 rounded-md bg-rose-600/80 text-white font-bold text-[8px]">PDF</span>
          ` : ''}
        </div>

        <div class="absolute bottom-2 right-2 flex items-center gap-1">
          <span class="px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-md border border-white/10 text-zinc-300 font-mono text-[9px]">
            ${c.page_count} Hlm
          </span>
          ${isMulti ? `
            <span class="px-1.5 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono text-[9px] flex items-center gap-0.5">
              ${iconSvg('layers', 'w-2.5 h-2.5')}
              <span>${chCount} Ch</span>
            </span>
          ` : ''}
        </div>
      </div>

      <div class="p-2.5 flex-1 flex flex-col justify-between">
        <h3 class="text-xs font-bold text-white leading-snug line-clamp-2 group-hover:text-emerald-400 transition-colors">
          ${safeTitle}
        </h3>
        <p class="text-[10px] text-zinc-500 mt-1 truncate flex items-center justify-between">
          <span>By ${safeAuthor}</span>
          ${isMulti ? `<span class="text-emerald-500/80 font-semibold text-[9px]">${chCount} Chapter</span>` : ''}
        </p>
      </div>
    `;

    card.onclick = () => {
      openComicReader(c, 0, 0);
      triggerHaptic('light');
    };

    frag.appendChild(card);
  });

  comicListGrid.appendChild(frag);
}

// ============================================================
// COMIC READER (DUAL-MODE: WEBTOON SCROLL & HORIZONTAL SWAP)
// ============================================================
function syncComicOrientation() {
  if (!comicReaderModal || comicReaderModal.classList.contains('hidden')) return;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const isLandscape = comicReaderOrientation === 'landscape';

  if (comicOrientationLabel) {
    comicOrientationLabel.textContent = isLandscape ? 'Potret' : 'Lanskap';
  }
  if (comicOrientationIcon) {
    comicOrientationIcon.innerHTML = iconSvg(isLandscape ? 'smartphone' : 'rotate-cw', 'w-3.5 h-3.5 text-zinc-400');
  }

  if (isLandscape && vh > vw) {
    comicReaderModal.style.setProperty('--theater-vw', `${vw}px`);
    comicReaderModal.style.setProperty('--theater-vh', `${vh}px`);
    comicReaderModal.classList.add('rotate-mobile');
  } else {
    comicReaderModal.style.removeProperty('--theater-vw');
    comicReaderModal.style.removeProperty('--theater-vh');
    comicReaderModal.classList.remove('rotate-mobile');
  }
}

function toggleComicReaderOrientation() {
  comicReaderOrientation = comicReaderOrientation === 'portrait' ? 'landscape' : 'portrait';
  localStorage.setItem('teleshorts_comic_orientation', comicReaderOrientation);
  syncComicOrientation();
  showToast(comicReaderOrientation === 'landscape' ? 'Mode Orientasi: Lanskap 🔄' : 'Mode Orientasi: Potret 📱', 'book-open', 'emerald');
  triggerHaptic('light');
}

function updateComicHeaderAndFooterInfo() {
  if (!activeComic) return;
  const currentChapter = activeComic.chapters?.[currentComicChapterIndex];
  const totalChapters = activeComic.chapters?.length || 1;
  const isMulti = activeComic.is_multi_chapter || totalChapters > 1;

  // Header info
  if (comicReaderTitle) comicReaderTitle.textContent = activeComic.title;
  if (comicReaderSubtitle) {
    comicReaderSubtitle.textContent = isMulti 
      ? `${activeComic.author} • ${currentChapter?.title || `Ch. ${currentComicChapterIndex + 1}`}`
      : activeComic.author;
  }

  // Top chapter button
  if (comicChapterBtn) {
    comicChapterBtn.classList.toggle('hidden', !isMulti);
  }
  if (comicChapterLabel) {
    comicChapterLabel.textContent = currentChapter?.title || `Ch. ${currentComicChapterIndex + 1}`;
  }

  // Footer chapter bar & Next/Prev Chapter buttons
  if (comicMultiChapterActions) {
    comicMultiChapterActions.classList.toggle('hidden', !isMulti);
  }
  if (comicFooterChapterBtn) {
    comicFooterChapterBtn.classList.toggle('hidden', !isMulti);
  }
  if (comicFooterChapterLabel) {
    comicFooterChapterLabel.textContent = `Ch. ${currentComicChapterIndex + 1} / ${totalChapters}`;
  }

  if (comicPrevChapterBtn) {
    const hasPrev = currentComicChapterIndex > 0;
    comicPrevChapterBtn.classList.toggle('hidden', !hasPrev);
    if (hasPrev && comicPrevChapterLabel) {
      comicPrevChapterLabel.textContent = `Ch. ${currentComicChapterIndex}`;
    }
  }

  if (comicNextChapterBtn) {
    const hasNext = currentComicChapterIndex < totalChapters - 1;
    comicNextChapterBtn.classList.toggle('hidden', !hasNext);
    if (hasNext && comicNextChapterLabel) {
      comicNextChapterLabel.textContent = `Next Ch. ${currentComicChapterIndex + 2}`;
    }
  }

  // Single Chapter Quick Mode Button in footer
  if (comicFooterModeBtn) {
    comicFooterModeBtn.classList.toggle('hidden', isMulti);
  }
}

function openComicReader(comic, chapterIdx = 0, pageIdx = 0) {
  if (!comic) return;
  activeComic = comic;
  currentComicChapterIndex = Math.max(0, Math.min(chapterIdx, (comic.chapters?.length || 1) - 1));
  currentComicPageIndex = pageIdx || 0;
  isComicInitializing = true;
  resetSwapZoom();

  if (comicReaderModal) {
    comicReaderModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  // Reset scroll and container DOM immediately
  if (comicWebtoonContainer) {
    comicWebtoonContainer.innerHTML = '';
    comicWebtoonContainer.scrollTop = 0;
  }

  if (comicPageSlider) {
    comicPageSlider.value = String(currentComicPageIndex + 1);
  }
  if (comicPageNow) {
    comicPageNow.textContent = `Hal. ${currentComicPageIndex + 1}`;
  }

  syncComicOrientation();
  updateComicReaderModeUI();
  updateComicHeaderAndFooterInfo();
  renderCurrentComicChapter();
  showComicReaderControls();

  // Ensure scroll is pinned at top after render, then release initialization gate
  requestAnimationFrame(() => {
    if (comicWebtoonContainer) comicWebtoonContainer.scrollTop = 0;
    setTimeout(() => {
      isComicInitializing = false;
    }, 400);
  });
}

function closeComicReader() {
  isComicInitializing = true;
  if (comicReaderModal) {
    comicReaderModal.classList.add('hidden');
    comicReaderModal.classList.remove('rotate-mobile');
    document.body.style.overflow = '';
  }
  if (comicWebtoonContainer) {
    comicWebtoonContainer.scrollTop = 0;
    comicWebtoonContainer.innerHTML = '';
  }
  if (comicPdfFrame) comicPdfFrame.src = '';
  resetSwapZoom();
  currentComicPageIndex = 0;
  if (comicPageSlider) comicPageSlider.value = '1';
  if (comicPageNow) comicPageNow.textContent = 'Hal. 1';
  activeComic = null;
  triggerHaptic('light');
}

function updateComicReaderModeUI() {
  const isWebtoon = comicReaderMode === 'webtoon';
  if (comicModeLabel) {
    comicModeLabel.textContent = isWebtoon ? 'Webtoon' : 'Swap';
  }
  if (comicModeIcon) {
    comicModeIcon.innerHTML = iconSvg(isWebtoon ? 'scroll' : 'book-open', 'w-3.5 h-3.5 text-emerald-400');
  }
  if (comicFooterModeLabel) {
    comicFooterModeLabel.textContent = isWebtoon ? 'Webtoon' : 'Swap';
  }
  if (comicFooterModeIcon) {
    comicFooterModeIcon.innerHTML = iconSvg(isWebtoon ? 'scroll' : 'book-open', 'w-3 h-3 text-emerald-400');
  }
}

function toggleComicReaderMode() {
  comicReaderMode = comicReaderMode === 'webtoon' ? 'swap' : 'webtoon';
  localStorage.setItem('teleshorts_comic_mode', comicReaderMode);
  updateComicReaderModeUI();
  const chapter = activeComic?.chapters?.[currentComicChapterIndex];
  if (chapter && !chapter.is_pdf) {
    renderCurrentComicChapter();
  }
  showToast(`Mode: ${comicReaderMode === 'webtoon' ? 'Webtoon (Gulir)' : 'Swap (Geser)'} 📖`, 'book-open', 'emerald');
  triggerHaptic('light');
}

function renderCurrentComicChapter() {
  if (!activeComic) return;
  const chapter = activeComic.chapters?.[currentComicChapterIndex];
  if (!chapter) return;

  updateComicHeaderAndFooterInfo();

  const isPdf = chapter.is_pdf || activeComic.is_pdf;

  if (isPdf) {
    if (comicPdfContainer) comicPdfContainer.classList.remove('hidden');
    if (comicWebtoonContainer) comicWebtoonContainer.classList.add('hidden');
    if (comicSwapContainer) comicSwapContainer.classList.add('hidden');
    if (comicPdfFrame) {
      const pdfId = chapter.pdf_file_id || activeComic.pdf_file_id;
      comicPdfFrame.src = `https://drive.google.com/file/d/${pdfId}/preview`;
    }
    if (comicPageNow) comicPageNow.textContent = 'Mode PDF';
    if (comicPageTotal) comicPageTotal.textContent = '';
    if (comicPageSlider) comicPageSlider.parentElement.classList.add('hidden');
    return;
  }

  // Normal Image Chapter
  if (comicPdfContainer) {
    comicPdfContainer.classList.add('hidden');
    if (comicPdfFrame) comicPdfFrame.src = '';
  }
  if (comicPageSlider) comicPageSlider.parentElement.classList.remove('hidden');

  const pages = chapter.pages || [];
  const totalPages = pages.length;

  currentComicPageIndex = Math.max(0, Math.min(currentComicPageIndex, Math.max(0, totalPages - 1)));

  if (comicPageTotal) comicPageTotal.textContent = `/ ${totalPages}`;
  if (comicPageNow) comicPageNow.textContent = `Hal. ${currentComicPageIndex + 1}`;
  if (comicPageSlider) {
    comicPageSlider.min = '1';
    comicPageSlider.max = String(Math.max(1, totalPages));
    comicPageSlider.value = String(currentComicPageIndex + 1);
  }

  if (comicReaderMode === 'webtoon') {
    renderWebtoonPages(pages);
  } else {
    renderSwapPage(pages);
  }
}

function renderWebtoonPages(pages) {
  if (!comicWebtoonContainer) return;
  if (comicSwapContainer) comicSwapContainer.classList.add('hidden');
  comicWebtoonContainer.classList.remove('hidden');
  comicWebtoonContainer.innerHTML = '';
  comicWebtoonContainer.scrollTop = 0;

  const frag = document.createDocumentFragment();
  pages.forEach((p, idx) => {
    const pageWrapper = document.createElement('div');
    // Natural aspect ratio: container fits cleanly without forced width stretching
    pageWrapper.className = 'comic-webtoon-page w-full max-w-[720px] flex flex-col items-center justify-center my-2 bg-zinc-950 min-h-[320px] relative transition-all';
    pageWrapper.dataset.pageIndex = String(idx);

    const imgUrl = `https://lh3.googleusercontent.com/d/${p.id}=w1200`;
    const fallbackUrl = `https://drive.google.com/thumbnail?id=${p.id}&sz=w1200`;

    // Visual placeholder while image is fetching
    const skeleton = document.createElement('div');
    skeleton.className = 'w-full max-w-[480px] h-[320px] rounded-xl bg-zinc-900/60 border border-zinc-800/40 flex flex-col items-center justify-center text-zinc-500 animate-pulse transition-opacity';
    skeleton.innerHTML = `
      <div class="w-7 h-7 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin mb-2"></div>
      <span class="text-[11px] font-mono font-medium text-zinc-400">Memuat Halaman ${idx + 1}...</span>
    `;
    pageWrapper.appendChild(skeleton);

    const img = document.createElement('img');
    // max-w-full and h-auto object-contain preserves natural aspect ratio (portrait or landscape)
    img.className = 'max-w-full h-auto object-contain select-none transition-opacity duration-200 opacity-0 shadow-md';
    img.referrerPolicy = 'no-referrer';
    img.src = imgUrl;
    img.alt = `Halaman ${idx + 1}`;
    img.loading = idx < 3 ? 'eager' : 'lazy';
    img.decoding = 'async';

    img.onload = () => {
      skeleton.remove();
      pageWrapper.classList.remove('min-h-[320px]');
      img.classList.remove('opacity-0');
      img.classList.add('opacity-100');
    };

    img.onerror = () => {
      if (img.src !== fallbackUrl) {
        img.src = fallbackUrl;
      } else {
        skeleton.classList.remove('animate-pulse');
        skeleton.innerHTML = `<span class="text-[11px] text-zinc-500">Halaman ${idx + 1} sedang diproses</span>`;
      }
    };

    pageWrapper.appendChild(img);
    frag.appendChild(pageWrapper);
  });

  // End-of-chapter Navigation Card (Prev / Next Chapter)
  if (activeComic && activeComic.chapters?.length > 1) {
    const hasNext = currentComicChapterIndex < activeComic.chapters.length - 1;
    const hasPrev = currentComicChapterIndex > 0;
    const nextCard = document.createElement('div');
    nextCard.className = 'w-full max-w-[480px] p-6 text-center my-6 flex flex-col items-center justify-center gap-3 border-t border-zinc-900 pt-8';
    
    let buttonsHtml = '';
    if (hasNext) {
      const nextCh = activeComic.chapters[currentComicChapterIndex + 1];
      buttonsHtml += `
        <button id="webtoon-next-chapter-cta" class="w-full px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-emerald-500/20">
          <span>Lanjut ke ${escapeHtml(nextCh.title)}</span>
          ${iconSvg('arrow-right', 'w-4 h-4')}
        </button>
      `;
    }
    if (hasPrev) {
      const prevCh = activeComic.chapters[currentComicChapterIndex - 1];
      buttonsHtml += `
        <button id="webtoon-prev-chapter-cta" class="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-semibold text-[11px] flex items-center justify-center gap-1.5 active:scale-95 transition-all">
          ${iconSvg('arrow-left', 'w-3.5 h-3.5')}
          <span>Kembali ke ${escapeHtml(prevCh.title)}</span>
        </button>
      `;
    }

    nextCard.innerHTML = `
      <p class="text-xs text-zinc-400">Akhir dari ${escapeHtml(activeComic.chapters[currentComicChapterIndex].title)}</p>
      <div class="flex flex-col items-center gap-2 w-full max-w-xs">
        ${buttonsHtml}
      </div>
    `;

    const nextBtnEl = nextCard.querySelector('#webtoon-next-chapter-cta');
    if (nextBtnEl) nextBtnEl.onclick = goToNextComicChapter;
    const prevBtnEl = nextCard.querySelector('#webtoon-prev-chapter-cta');
    if (prevBtnEl) prevBtnEl.onclick = goToPrevComicChapter;

    frag.appendChild(nextCard);
  }

  comicWebtoonContainer.appendChild(frag);

  // Scroll to current page if > 0
  if (currentComicPageIndex > 0) {
    setTimeout(() => {
      const targetEl = comicWebtoonContainer.querySelector(`div[data-page-index="${currentComicPageIndex}"]`);
      targetEl?.scrollIntoView({ behavior: 'auto', block: 'start' });
    }, 50);
  }
}

function onComicWebtoonScroll() {
  if (isComicInitializing || isComicScrubbing || comicReaderMode !== 'webtoon' || !comicWebtoonContainer) return;
  if (comicScrollRaf) cancelAnimationFrame(comicScrollRaf);
  comicScrollRaf = requestAnimationFrame(() => {
    const pages = comicWebtoonContainer.querySelectorAll('.comic-webtoon-page');
    if (!pages.length) return;

    const scrollTop = comicWebtoonContainer.scrollTop;
    const clientH = comicWebtoonContainer.clientHeight;
    const scrollH = comicWebtoonContainer.scrollHeight;

    let activeIdx = 0;

    // Boundary 1: Pin at Page 1 when scrolled near top
    if (scrollTop <= 40) {
      activeIdx = 0;
    }
    // Boundary 2: Pin at last page when scrolled near bottom
    else if (scrollTop + clientH >= scrollH - 40) {
      activeIdx = pages.length - 1;
    }
    // In-between: calculate based on viewport center probe
    else {
      const cRect = comicWebtoonContainer.getBoundingClientRect();
      const probeY = cRect.top + Math.min(220, cRect.height * 0.35);
      for (let i = 0; i < pages.length; i++) {
        const r = pages[i].getBoundingClientRect();
        if (r.top <= probeY) {
          activeIdx = i;
        } else {
          break;
        }
      }
    }

    if (activeIdx !== currentComicPageIndex) {
      currentComicPageIndex = activeIdx;
      if (comicPageNow) comicPageNow.textContent = `Hal. ${activeIdx + 1}`;
      if (comicPageSlider) comicPageSlider.value = String(activeIdx + 1);
    }
  });
}

function renderSwapPage(pages) {
  if (!comicSwapContainer) return;
  if (comicWebtoonContainer) comicWebtoonContainer.classList.add('hidden');
  comicSwapContainer.classList.remove('hidden');
  resetSwapZoom();

  const page = pages[currentComicPageIndex];
  if (!page || !comicSwapCurrentImg) return;

  comicSwapCurrentImg.referrerPolicy = 'no-referrer';
  const imgUrl = `https://lh3.googleusercontent.com/d/${page.id}=w1200`;
  const fallbackUrl = `https://drive.google.com/thumbnail?id=${page.id}&sz=w1200`;

  comicSwapCurrentImg.src = imgUrl;
  comicSwapCurrentImg.onerror = () => {
    if (comicSwapCurrentImg.src !== fallbackUrl) comicSwapCurrentImg.src = fallbackUrl;
  };

  if (comicPageNow) comicPageNow.textContent = `Hal. ${currentComicPageIndex + 1}`;
  if (comicPageSlider) comicPageSlider.value = String(currentComicPageIndex + 1);
  if (comicPrevPageBtn) comicPrevPageBtn.disabled = currentComicPageIndex <= 0 && currentComicChapterIndex <= 0;
  if (comicNextPageBtn) {
    const totalChapters = activeComic?.chapters?.length || 1;
    comicNextPageBtn.disabled = currentComicPageIndex >= pages.length - 1 && currentComicChapterIndex >= totalChapters - 1;
  }
}

function prevComicPage() {
  if (comicReaderMode === 'webtoon') {
    if (currentComicPageIndex > 0) {
      currentComicPageIndex--;
      const targetEl = comicWebtoonContainer?.querySelector(`div[data-page-index="${currentComicPageIndex}"]`);
      targetEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (comicPageNow) comicPageNow.textContent = `Hal. ${currentComicPageIndex + 1}`;
      if (comicPageSlider) comicPageSlider.value = String(currentComicPageIndex + 1);
      triggerHaptic('light');
    } else if (currentComicChapterIndex > 0) {
      goToPrevComicChapter();
    }
  } else {
    prevSwapPage();
  }
}

function nextComicPage() {
  if (comicReaderMode === 'webtoon') {
    const chapter = activeComic?.chapters?.[currentComicChapterIndex];
    const totalPages = chapter?.pages?.length || 0;
    if (currentComicPageIndex < totalPages - 1) {
      currentComicPageIndex++;
      const targetEl = comicWebtoonContainer?.querySelector(`div[data-page-index="${currentComicPageIndex}"]`);
      targetEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (comicPageNow) comicPageNow.textContent = `Hal. ${currentComicPageIndex + 1}`;
      if (comicPageSlider) comicPageSlider.value = String(currentComicPageIndex + 1);
      triggerHaptic('light');
    } else if (currentComicChapterIndex < (activeComic?.chapters?.length || 1) - 1) {
      goToNextComicChapter();
    }
  } else {
    nextSwapPage();
  }
}

function nextSwapPage() {
  const chapter = activeComic?.chapters?.[currentComicChapterIndex];
  if (!chapter || chapter.is_pdf) return;
  const pages = chapter.pages || [];
  if (currentComicPageIndex < pages.length - 1) {
    currentComicPageIndex++;
    renderSwapPage(pages);
    triggerHaptic('light');
  } else if (currentComicChapterIndex < (activeComic.chapters.length - 1)) {
    goToNextComicChapter();
  }
}

function prevSwapPage() {
  const chapter = activeComic?.chapters?.[currentComicChapterIndex];
  if (!chapter || chapter.is_pdf) return;
  const pages = chapter.pages || [];
  if (currentComicPageIndex > 0) {
    currentComicPageIndex--;
    renderSwapPage(pages);
    triggerHaptic('light');
  } else if (currentComicChapterIndex > 0) {
    currentComicChapterIndex--;
    const prevChapterPages = activeComic.chapters[currentComicChapterIndex]?.pages || [];
    currentComicPageIndex = Math.max(0, prevChapterPages.length - 1);
    renderCurrentComicChapter();
    showToast(`Kembali ke ${activeComic.chapters[currentComicChapterIndex].title} 📖`, 'book-open', 'emerald');
    triggerHaptic('medium');
  }
}

function toggleSwapZoom() {
  if (!comicSwapPageWrapper || !comicSwapCurrentImg) return;
  if (comicSwapZoomLevel === 1) {
    comicSwapZoomLevel = 1.75;
    comicSwapPageWrapper.style.transform = 'scale(1.75)';
    comicSwapPageWrapper.style.cursor = 'zoom-out';
    showToast('Zoom 1.75x 🔍', 'zoom-in', 'emerald');
  } else {
    resetSwapZoom();
    showToast('Zoom 1x 🔍', 'zoom-out', 'zinc');
  }
  triggerHaptic('light');
}

function resetSwapZoom() {
  comicSwapZoomLevel = 1;
  if (comicSwapPageWrapper) {
    comicSwapPageWrapper.style.transform = 'scale(1)';
    comicSwapPageWrapper.style.cursor = '';
  }
}

function goToNextComicChapter() {
  if (!activeComic) return;
  if (currentComicChapterIndex < activeComic.chapters.length - 1) {
    currentComicChapterIndex++;
    currentComicPageIndex = 0;
    renderCurrentComicChapter();
    showToast(`Lanjut ke ${activeComic.chapters[currentComicChapterIndex].title} 📖`, 'book-open', 'emerald');
    triggerHaptic('medium');
  }
}

function goToPrevComicChapter() {
  if (!activeComic) return;
  if (currentComicChapterIndex > 0) {
    currentComicChapterIndex--;
    currentComicPageIndex = 0;
    renderCurrentComicChapter();
    showToast(`Kembali ke ${activeComic.chapters[currentComicChapterIndex].title} 📖`, 'book-open', 'emerald');
    triggerHaptic('medium');
  }
}

function toggleComicReaderControls() {
  const isHidden = comicReaderHeader?.classList.contains('-translate-y-full');
  if (isHidden) {
    showComicReaderControls();
  } else {
    hideComicReaderControls();
  }
}

function showComicReaderControls() {
  comicReaderHeader?.classList.remove('-translate-y-full');
  comicReaderFooter?.classList.remove('translate-y-full');
}

function hideComicReaderControls() {
  comicReaderHeader?.classList.add('-translate-y-full');
  comicReaderFooter?.classList.add('translate-y-full');
}

function openComicChapterSheet() {
  if (!activeComic || !comicChapterSheet) return;
  comicChapterSheet.classList.remove('hidden');
  if (comicTotalChaptersBadge) {
    comicTotalChaptersBadge.textContent = `${activeComic.chapters.length} Chapter`;
  }
  if (comicChapterList) {
    comicChapterList.innerHTML = '';
    const frag = document.createDocumentFragment();
    activeComic.chapters.forEach((ch, idx) => {
      const btn = document.createElement('button');
      const isCur = idx === currentComicChapterIndex;
      btn.className = `w-full p-3 rounded-2xl flex items-center justify-between text-left text-xs font-semibold ${isCur ? 'bg-emerald-950/60 border border-emerald-500/50 text-white shadow-sm' : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-700'} transition-all`;
      btn.innerHTML = `
        <div class="flex items-center gap-2.5 min-w-0">
          <span class="text-emerald-400 font-bold">${idx + 1}.</span>
          <span class="truncate">${escapeHtml(ch.title)}</span>
        </div>
        <span class="text-[10px] text-zinc-500 font-mono shrink-0">${ch.is_pdf ? 'PDF' : `${ch.page_count} Hlm`}</span>
      `;
      btn.onclick = () => {
        currentComicChapterIndex = idx;
        currentComicPageIndex = 0;
        closeComicChapterSheet();
        renderCurrentComicChapter();
        triggerHaptic('light');
      };
      frag.appendChild(btn);
    });
    comicChapterList.appendChild(frag);
  }
}

function closeComicChapterSheet() {
  comicChapterSheet?.classList.add('hidden');
}

function closeDrawer() {
  triggerHaptic('light');
  clearTimeout(topicDrawerCloseTimer);
  drawerBackdrop.classList.remove('opacity-100');
  drawerBackdrop.classList.add('opacity-0');
  drawerContent.classList.remove('translate-y-0');
  drawerContent.classList.add('translate-y-full');
  topicDrawerCloseTimer = setTimeout(() => {
    topicDrawer.classList.add('hidden');
  }, 350);
}

function switchView(viewName) {
  triggerHaptic('light');
  activeView = viewName;

  viewShorts.classList.toggle('hidden', viewName !== 'shorts');
  viewDrama.classList.toggle('hidden', viewName !== 'drama');
  viewAdult18?.classList.toggle('hidden', viewName !== 'adult18');
  viewComic?.classList.toggle('hidden', viewName !== 'comic');
  viewProfile.classList.toggle('hidden', viewName !== 'profile');

  navBtnShorts.className = `flex flex-col items-center gap-1 py-1 px-2.5 transition-all ${viewName === 'shorts' ? 'text-white' : 'text-zinc-400'}`;
  if (navBtnComic) {
    navBtnComic.className = `flex flex-col items-center gap-1 py-1 px-2.5 transition-all relative ${viewName === 'comic' ? 'text-emerald-400 font-bold' : 'text-zinc-400 hover:text-white'}`;
  }
  navBtnDrama.className = `flex flex-col items-center gap-1 py-1 px-3 transition-all ${viewName === 'drama' ? 'text-amber-400 font-bold' : 'text-zinc-400'}`;
  if (navBtnAdult18) {
    navBtnAdult18.className = `flex flex-col items-center gap-1 py-1 px-2.5 transition-all relative ${viewName === 'adult18' ? 'text-white font-bold' : 'text-zinc-400 hover:text-rose-400'}`;
  }
  if (navAdult18Badge) {
    navAdult18Badge.className = viewName === 'adult18'
      ? 'px-1.5 py-0.5 rounded-md border border-rose-400 bg-rose-600 text-white text-[10px] font-black tracking-tight leading-none shadow-lg shadow-rose-600/40 transition-all'
      : 'px-1.5 py-0.5 rounded-md border border-rose-500/60 bg-rose-600/20 text-rose-400 text-[10px] font-black tracking-tight leading-none transition-all';
  }
  navBtnProfile.className = `flex flex-col items-center gap-1 py-1 px-2.5 transition-all ${viewName === 'profile' ? 'text-white' : 'text-zinc-400'}`;

  if (viewName === 'shorts') {
    if (currentPlayingShortVideo) currentPlayingShortVideo.play().catch(() => {});
  } else {
    if (currentPlayingShortVideo) currentPlayingShortVideo.pause();
  }

  if (viewName === 'profile') {
    renderProfileContent();
  } else if (viewName === 'comic') {
    filterAndRenderComics();
  }
}

// ============================================================
// GLOBAL AUDIO UNMUTE & AUTOPLAY FIX
// ============================================================
function getActiveAudibleVideo() {
  if (dramaLandscapeTheater && !dramaLandscapeTheater.classList.contains('hidden')) {
    return landscapeVideo;
  }
  if (dramaReelModal && !dramaReelModal.classList.contains('hidden')) {
    const activeSlide = dramaEpisodesReel?.children[currentReelEpisodeIndex];
    return activeSlide ? activeSlide.querySelector('video') : null;
  }
  if (activeView === 'shorts') {
    return currentPlayingShortVideo || feedContainer?.querySelector('.snap-slide video') || null;
  }
  return null;
}

function showUnmuteBanner() {
  const b = document.getElementById('global-unmute-banner');
  if (b && (isMuted || awaitingAudioUnlock)) b.classList.remove('hidden');
}

function hideUnmuteBanner() {
  const b = document.getElementById('global-unmute-banner');
  if (b) b.classList.add('hidden');
}

function syncMuteButtonsUI() {
  const iconName = isMuted ? 'volume-x' : 'volume-2';
  if (globalMuteBtn) {
    globalMuteBtn.innerHTML = iconSvg(iconName, 'w-4 h-4 text-white');
  }
  updateLandscapeMuteBtn();
  document.querySelectorAll('#drama-episodes-reel .reel-mute-btn').forEach(btn => {
    btn.innerHTML = iconSvg(iconName, 'w-4 h-4 text-zinc-300');
  });
}

function unlockActiveVideoSound(targetVideo = null) {
  const activeVid = targetVideo || getActiveAudibleVideo();
  if (isMuted) return;
  if (!activeVid) {
    awaitingAudioUnlock = false;
    pendingAudioVerifyUntil = 0;
    hideUnmuteBanner();
    return;
  }

  activeVid.muted = false;
  awaitingAudioUnlock = false;
  hideUnmuteBanner();
  pendingAudioVerifyUntil = Date.now() + 400;

  if (activeVid.paused && !activeVid.ended) {
    const p = activeVid.play();
    if (p && typeof p.then === 'function') {
      p.then(() => {
        pendingAudioVerifyUntil = 0;
      }).catch((err) => {
        if (err && err.name === 'AbortError') return;
        activeVid.muted = true;
        awaitingAudioUnlock = true;
        pendingAudioVerifyUntil = 0;
        showUnmuteBanner();
        activeVid.play().catch(() => {});
      });
    } else {
      pendingAudioVerifyUntil = 0;
    }
    return;
  }

  // Video sedang berjalan (sebelumnya fallback muted): verifikasi browser tidak otomatis menjeda setelah unmute
  setTimeout(() => {
    if (isMuted) return;
    if (activeVid.paused && !activeVid.ended && activeVid === getActiveAudibleVideo()) {
      activeVid.muted = true;
      awaitingAudioUnlock = true;
      showUnmuteBanner();
      activeVid.play().catch(() => {});
    } else {
      pendingAudioVerifyUntil = 0;
    }
  }, 90);
}

function setGlobalMuted(muted, persist = true) {
  isMuted = Boolean(muted);
  if (persist) {
    localStorage.setItem('teleshorts_unmuted', isMuted ? '0' : '1');
  }
  if (isMuted) {
    awaitingAudioUnlock = false;
    document.querySelectorAll('video').forEach(v => {
      v.muted = true;
    });
    hideUnmuteBanner();
  } else {
    document.querySelectorAll('video').forEach(v => {
      v.muted = false;
    });
    unlockActiveVideoSound();
  }
  syncMuteButtonsUI();
}

function enableGlobalSound() {
  if (isMuted) {
    setGlobalMuted(false, true);
    return;
  }
  const activeVid = getActiveAudibleVideo();
  if (awaitingAudioUnlock || (activeVid && activeVid.muted)) {
    unlockActiveVideoSound(activeVid);
  }
}

// ============================================================
// DRAMA HUB SORT LOGIC
// ============================================================
function getDramaSortLabel(sortType) {
  switch (sortType) {
    case 'az': return 'Abjad A - Z';
    case 'za': return 'Abjad Z - A';
    case 'rating': return 'Rating Tertinggi';
    case 'eps': return 'Episode Terbanyak';
    default: return 'Acak';
  }
}

function updateDramaSortUI() {
  const lbl = document.getElementById('drama-sort-label');
  if (lbl) lbl.textContent = getDramaSortLabel(currentDramaSort);

  document.querySelectorAll('.drama-sort-option').forEach(opt => {
    const check = opt.querySelector('.sort-check');
    const isSelected = opt.dataset.sort === currentDramaSort;
    if (check) {
      if (isSelected) {
        check.classList.remove('hidden');
        opt.classList.add('border-amber-500/50', 'bg-amber-500/10');
      } else {
        check.classList.add('hidden');
        opt.classList.remove('border-amber-500/50', 'bg-amber-500/10');
      }
    }
  });
}

function openDramaSortSheet() {
  const sheet = document.getElementById('drama-sort-sheet');
  if (sheet) {
    updateDramaSortUI();
    sheet.classList.remove('hidden');
    triggerHaptic('light');
  }
}

function closeDramaSortSheet() {
  const sheet = document.getElementById('drama-sort-sheet');
  if (sheet) sheet.classList.add('hidden');
}

// ============================================================
// EMAIL-ONLY LOGIN & AUTOMATIC SYNCHRONIZATION ENGINE
// ============================================================
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SYNC_ENDPOINT_ALLOWLIST = /^https:\/\/(script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec|[a-z0-9-]+\.[a-z0-9-]+\.workers\.dev\/?.*)$/i;
let isRemoteSyncBusy = false;
let pendingRemoteSync = null;

function normalizeEmail(raw) {
  return String(raw || '').trim().toLowerCase();
}

function isValidEmail(raw) {
  return EMAIL_PATTERN.test(normalizeEmail(raw));
}

function deriveUserAvatar(name, email) {
  const seed = encodeURIComponent(name || email || 'appVideo');
  return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}`;
}

function isValidSyncEndpoint(url) {
  return typeof url === 'string' && SYNC_ENDPOINT_ALLOWLIST.test(url.trim());
}

function getCloudSyncEndpoint() {
  const stored = (localStorage.getItem('teleshorts_sync_endpoint') || '').trim();
  if (isValidSyncEndpoint(stored)) return stored;
  return isValidSyncEndpoint(DEFAULT_CLOUD_SYNC_ENDPOINT) ? DEFAULT_CLOUD_SYNC_ENDPOINT.trim() : '';
}

function processSyncEndpointHashIfPresent() {
  const h = window.location.hash || '';
  if (!h.startsWith('#drive-sync=')) return false;
  try {
    const candidate = decodeURIComponent(h.slice('#drive-sync='.length)).trim();
    if (isValidSyncEndpoint(candidate)) {
      localStorage.setItem('teleshorts_sync_endpoint', candidate);
      try {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      } catch (e) {}
      setTimeout(() => {
        showToast('Sinkronisasi Google Drive terhubung otomatis ✓', 'cloud-check', 'emerald', 3200);
      }, 450);
      return true;
    }
  } catch (e) {}
  return false;
}

function buildUserSyncData() {
  const cleanCollections = customCollections.map(c => ({
    id: String(c.id || ''),
    name: String(c.name || 'Koleksi'),
    videoIds: Array.isArray(c.videoIds) ? [...c.videoIds] : [],
    isDefault: Boolean(c.isDefault),
    createdAt: Number(c.createdAt) || 0
  }));

  return {
    app: 'appVideo',
    version: 2,
    user_email: currentUser?.email || '',
    user_name: currentUser?.name || 'Pengguna appVideo',
    avatar: currentUser?.avatar || '',
    device: navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Browser',
    last_synced: new Date().toISOString(),
    gdrive_folder_id: GDRIVE_USER_DATA_FOLDER_ID,
    liked_videos: [...likedVideoIds],
    saved_shorts: [...savedShortIds],
    saved_dramas: [...savedDramaIds],
    liked_episodes: [...likedEpisodeKeys],
    custom_collections: cleanCollections
  };
}

function sanitizeSyncPayload(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Format sinkronisasi tidak valid.');
  }
  const strList = (val) => (
    Array.isArray(val)
      ? [...new Set(val.filter(x => typeof x === 'string' && x.trim().length > 0 && x.length <= 140).map(x => x.trim()))]
      : []
  );

  const rawEmail = raw.user_email || raw.email || raw.e || '';
  const email = isValidEmail(rawEmail) ? normalizeEmail(rawEmail) : '';
  const rawName = raw.user_name || raw.name || raw.n || '';
  const name = typeof rawName === 'string' && rawName.trim() ? rawName.trim().slice(0, 80) : (email ? email.split('@')[0] : '');

  const rawCols = Array.isArray(raw.custom_collections) ? raw.custom_collections : (Array.isArray(raw.cc) ? raw.cc : []);
  const custom_collections = rawCols
    .filter(c => c && typeof c === 'object' && !Array.isArray(c))
    .slice(0, 60)
    .map((c, idx) => ({
      id: typeof c.id === 'string' && c.id.trim() ? c.id.trim().slice(0, 80) : `col_imp_${Date.now()}_${idx}`,
      name: typeof c.name === 'string' && c.name.trim() ? c.name.trim().slice(0, 80) : 'Koleksi',
      videoIds: strList(c.videoIds),
      isDefault: Boolean(c.isDefault) || c.id === 'col_default',
      createdAt: Number.isFinite(Number(c.createdAt)) ? Number(c.createdAt) : 0
    }));

  return {
    user_email: email,
    user_name: name,
    liked_videos: strList(raw.liked_videos ?? raw.lv),
    saved_shorts: strList(raw.saved_shorts ?? raw.ss),
    saved_dramas: strList(raw.saved_dramas ?? raw.sd),
    liked_episodes: strList(raw.liked_episodes ?? raw.le),
    custom_collections
  };
}

function mergeCollectionsList(targetCols, incomingCols) {
  const next = targetCols.map(c => ({ ...c, videoIds: [...(c.videoIds || [])] }));
  incomingCols.forEach(inc => {
    const match = next.find(c => (c.isDefault && inc.isDefault) || c.id === inc.id || (!inc.isDefault && c.name.toLowerCase() === inc.name.toLowerCase()));
    if (match) {
      inc.videoIds.forEach(vid => {
        if (!match.videoIds.includes(vid)) match.videoIds.push(vid);
      });
    } else {
      next.push({
        id: inc.id,
        name: inc.name,
        videoIds: [...inc.videoIds],
        isDefault: Boolean(inc.isDefault),
        createdAt: Number(inc.createdAt) || Date.now()
      });
    }
  });
  return next;
}

function saveStorageWithoutSyncLoop() {
  localStorage.setItem('teleshorts_likes', JSON.stringify([...likedVideoIds]));
  localStorage.setItem('teleshorts_saved_shorts', JSON.stringify([...savedShortIds]));
  localStorage.setItem('teleshorts_saved_dramas', JSON.stringify([...savedDramaIds]));
  localStorage.setItem('teleshorts_liked_episodes', JSON.stringify([...likedEpisodeKeys]));
  localStorage.setItem('teleshorts_custom_collections', JSON.stringify(customCollections));
}

function refreshAllSyncedViews() {
  updateStatsDisplay();
  filterAndRenderDramas();
  filterAndRenderAdult18();
  if (activeView === 'profile') renderProfileContent();
  updateGoogleSyncUI();
}

function applySanitizedSyncData(parsed, merge = true) {
  if (!merge) {
    likedVideoIds.clear();
    savedShortIds.clear();
    savedDramaIds.clear();
    likedEpisodeKeys.clear();
    customCollections = [{
      id: 'col_default',
      name: 'Semua Tersimpan',
      videoIds: [],
      isDefault: true,
      createdAt: 0
    }];
  }

  parsed.liked_videos.forEach(id => likedVideoIds.add(id));
  parsed.saved_shorts.forEach(id => savedShortIds.add(id));
  parsed.saved_dramas.forEach(id => savedDramaIds.add(id));
  parsed.liked_episodes.forEach(key => likedEpisodeKeys.add(key));

  if (parsed.custom_collections.length > 0) {
    customCollections = mergeCollectionsList(customCollections, parsed.custom_collections);
  }
  const defCol = customCollections.find(c => c.id === 'col_default');
  if (defCol) {
    savedShortIds.forEach(id => {
      if (!defCol.videoIds.includes(id)) defCol.videoIds.push(id);
    });
  }
  saveStorageWithoutSyncLoop();
  updateStatsDisplay();
}

function updateGoogleSyncUI() {
  const loggedInState = document.getElementById('google-logged-in-state');
  const loggedOutState = document.getElementById('google-logged-out-state');
  const userAvatar = document.getElementById('user-google-avatar');
  const userName = document.getElementById('user-google-name');
  const userEmail = document.getElementById('user-google-email');
  const syncTime = document.getElementById('sync-last-time');
  const storageMode = document.getElementById('sync-storage-mode');
  const profileAvatar = document.getElementById('profile-avatar-img');
  const profileName = document.getElementById('profile-name');
  const profileHandle = document.getElementById('profile-handle');

  if (currentUser) {
    if (loggedOutState) loggedOutState.classList.add('hidden');
    if (loggedInState) loggedInState.classList.remove('hidden');

    if (userName) userName.textContent = currentUser.name || 'Pengguna Email';
    if (userEmail) userEmail.textContent = currentUser.email || '';
    if (userAvatar) userAvatar.src = currentUser.avatar || deriveUserAvatar(currentUser.name, currentUser.email);

    if (profileName) profileName.textContent = currentUser.name || 'Pengguna Email';
    if (profileHandle) profileHandle.textContent = `@${currentUser.email ? currentUser.email.split('@')[0] : 'user'}`;
    if (profileAvatar && currentUser.avatar) profileAvatar.src = currentUser.avatar;

    const lastSync = localStorage.getItem('teleshorts_last_sync_time');
    if (syncTime) {
      syncTime.textContent = lastSync
        ? `Sinkron: ${new Date(lastSync).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
        : 'Sinkron: Baru saja';
    }
    if (storageMode) {
      const hasRemote = Boolean(getCloudSyncEndpoint());
      storageMode.textContent = hasRemote ? 'Google Drive Aktif' : 'Otomatis di Perangkat';
      storageMode.className = hasRemote ? 'text-emerald-400 font-semibold' : 'text-zinc-500 font-medium';
    }
  } else {
    if (loggedInState) loggedInState.classList.add('hidden');
    if (loggedOutState) loggedOutState.classList.remove('hidden');

    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (tgUser) {
      const displayName = tgUser.first_name + (tgUser.last_name ? ' ' + tgUser.last_name : '');
      const username = tgUser.username ? '@' + tgUser.username : '@' + tgUser.first_name.toLowerCase();
      if (profileName) profileName.textContent = displayName;
      if (profileHandle) profileHandle.textContent = username;
      if (profileAvatar && tgUser.photo_url) profileAvatar.src = tgUser.photo_url;
    } else {
      if (profileName) profileName.textContent = 'Mommy Video';
      if (profileHandle) profileHandle.textContent = '@teleuser';
      if (profileAvatar) profileAvatar.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';
    }
  }
}

async function pullRemoteCloudBackup(email) {
  const endpoint = getCloudSyncEndpoint();
  const normEmail = normalizeEmail(email);
  if (!endpoint || !isValidEmail(normEmail)) return false;
  try {
    const res = await fetch(`${endpoint}?email=${encodeURIComponent(normEmail)}`, { cache: 'no-store' });
    if (!res.ok) return false;
    const payload = await res.json();
    if (!currentUser || normalizeEmail(currentUser.email) !== normEmail) return false;
    if (payload && payload.found && payload.data) {
      const sanitized = sanitizeSyncPayload(payload.data);
      applySanitizedSyncData(sanitized, true);
      const mergedStr = JSON.stringify(buildUserSyncData());
      localStorage.setItem(`teleshorts_cloud_backup_${normEmail}`, mergedStr);
      localStorage.setItem('teleshorts_last_sync_time', new Date().toISOString());
      refreshAllSyncedViews();
      return true;
    }
  } catch (e) {}
  return false;
}

function pushRemoteCloudBackup(syncData, useKeepalive = false) {
  const endpoint = getCloudSyncEndpoint();
  if (!endpoint || !syncData?.user_email) return Promise.resolve(false);
  return fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(syncData),
    keepalive: Boolean(useKeepalive)
  }).then(r => r.ok).catch(() => false);
}

function syncUserDataToCloud(isManual = false, opts = {}) {
  if (!currentUser) return;
  clearTimeout(syncDebounceTimer);
  syncDebounceTimer = null;

  const normEmail = normalizeEmail(currentUser.email);
  const syncData = buildUserSyncData();
  const jsonStr = JSON.stringify(syncData);
  localStorage.setItem('teleshorts_last_sync_time', syncData.last_synced);
  localStorage.setItem(`teleshorts_cloud_backup_${normEmail}`, jsonStr);
  updateGoogleSyncUI();

  const endpoint = getCloudSyncEndpoint();
  if (!endpoint) {
    if (isManual) {
      triggerHaptic('success');
      const totalSaved = likedVideoIds.size + savedShortIds.size + savedDramaIds.size;
      showToast(`Data akun diperbarui & tersinkron (${totalSaved} item) ✓`, 'cloud-check', 'amber', 2800);
    }
    return;
  }

  if (isRemoteSyncBusy) {
    if (opts.keepalive) {
      pendingRemoteSync = null;
      pushRemoteCloudBackup(syncData, true);
    } else {
      pendingRemoteSync = {
        email: normEmail,
        pullFirst: Boolean(pendingRemoteSync?.pullFirst || isManual || opts.pullFirst)
      };
    }
  } else {
    isRemoteSyncBusy = true;
    const shouldPull = Boolean(isManual || opts.pullFirst);
    const task = shouldPull
      ? pullRemoteCloudBackup(normEmail).then(() => {
          if (!currentUser || normalizeEmail(currentUser.email) !== normEmail) return false;
          return pushRemoteCloudBackup(buildUserSyncData(), opts.keepalive);
        })
      : pushRemoteCloudBackup(syncData, opts.keepalive);

    Promise.resolve(task)
      .then((ok) => {
        if (ok && currentUser && normalizeEmail(currentUser.email) === normEmail) {
          localStorage.setItem('teleshorts_last_sync_time', new Date().toISOString());
        }
      })
      .finally(() => {
        isRemoteSyncBusy = false;
        if (currentUser) updateGoogleSyncUI();
        const queued = pendingRemoteSync;
        pendingRemoteSync = null;
        if (queued && currentUser && normalizeEmail(currentUser.email) === queued.email) {
          syncUserDataToCloud(false, { pullFirst: queued.pullFirst });
        }
      });
  }

  if (isManual) {
    triggerHaptic('success');
    const totalSaved = likedVideoIds.size + savedShortIds.size + savedDramaIds.size;
    showToast(`Data akun diperbarui & tersinkron (${totalSaved} item) ✓`, 'cloud-check', 'amber', 2800);
  }
}

function queueCloudSync() {
  if (!currentUser) return;
  clearTimeout(syncDebounceTimer);
  syncDebounceTimer = setTimeout(() => {
    syncUserDataToCloud(false);
  }, 350);
}

function flushPendingCloudSync() {
  if (currentUser && syncDebounceTimer) {
    syncUserDataToCloud(false, { keepalive: true });
  }
}

function handleEmailLogin(email, name = '', avatar = '') {
  const errEl = document.getElementById('login-email-error');
  const normEmail = normalizeEmail(email);
  if (!isValidEmail(normEmail)) {
    if (errEl) {
      errEl.textContent = 'Masukkan alamat email yang valid (contoh: nama@gmail.com).';
      errEl.classList.remove('hidden');
    }
    showToast('Email tidak valid, coba periksa kembali ⚠️', 'alert-circle', 'rose', 2800);
    return false;
  }
  if (errEl) {
    errEl.textContent = '';
    errEl.classList.add('hidden');
  }

  const prevEmail = currentUser?.email ? normalizeEmail(currentUser.email) : '';
  const lastOwnerEmail = localStorage.getItem('teleshorts_last_email') || '';
  if (prevEmail && prevEmail !== normEmail) {
    syncUserDataToCloud(false);
  }

  const displayName = String(name || '').trim() || normEmail.split('@')[0];
  currentUser = {
    email: normEmail,
    name: displayName,
    avatar: avatar || deriveUserAvatar(displayName, normEmail),
    logged_in_at: new Date().toISOString()
  };
  localStorage.setItem('teleshorts_google_user', JSON.stringify(currentUser));
  localStorage.setItem('teleshorts_last_email', normEmail);

  const existingBackup = localStorage.getItem(`teleshorts_cloud_backup_${normEmail}`);
  const switchingAccounts = Boolean((prevEmail && prevEmail !== normEmail) || (lastOwnerEmail && lastOwnerEmail !== normEmail));
  if (existingBackup) {
    try {
      const parsed = sanitizeSyncPayload(JSON.parse(existingBackup));
      applySanitizedSyncData(parsed, !switchingAccounts);
    } catch (e) {}
  } else if (switchingAccounts) {
    applySanitizedSyncData({ liked_videos: [], saved_shorts: [], saved_dramas: [], liked_episodes: [], custom_collections: [] }, false);
  } else {
    saveStorageWithoutSyncLoop();
  }

  syncUserDataToCloud(false, { pullFirst: true });
  refreshAllSyncedViews();

  triggerHaptic('success');
  showToast(`Masuk sebagai ${normEmail} — Sinkronisasi otomatis aktif ✓`, 'cloud-check', 'amber', 3200);
  return true;
}

function handleGoogleLoginSuccess(email, name = '', avatar = '') {
  return handleEmailLogin(email, name, avatar);
}

// ============================================================
// 6. EVENT LISTENERS
// ============================================================
function setupEvents() {
  // Navigation
  navBtnShorts.onclick = () => switchView('shorts');
  if (navBtnComic) navBtnComic.onclick = () => switchView('comic');
  if (navBtnTopics) navBtnTopics.onclick = openDrawer;
  navBtnDrama.onclick = () => switchView('drama');
  if (navBtnAdult18) {
    navBtnAdult18.onclick = () => switchView('adult18');
  }
  navBtnProfile.onclick = () => {
    updateProfileTabHeaders();
    switchView('profile');
  };

  // Comic Search & Clear
  if (comicSearchInput) {
    comicSearchInput.oninput = () => {
      filterAndRenderComics();
    };
  }
  if (comicSearchClear) {
    comicSearchClear.onclick = () => {
      if (comicSearchInput) comicSearchInput.value = '';
      filterAndRenderComics();
      triggerHaptic('light');
    };
  }

  // Comic Sort
  if (comicSortBtn) comicSortBtn.onclick = openComicSortSheet;
  if (closeComicSortBtn) closeComicSortBtn.onclick = closeComicSortSheet;
  if (comicSortBackdrop) comicSortBackdrop.onclick = closeComicSortSheet;
  comicSortOptions?.forEach(opt => {
    opt.onclick = () => {
      currentComicSort = opt.dataset.sort;
      localStorage.setItem('teleshorts_comic_sort', currentComicSort);
      updateComicSortUI();
      closeComicSortSheet();
      triggerHaptic('light');
      showToast(`Urutan: ${getComicSortLabel(currentComicSort)} 🔀`, 'arrow-down-up', 'emerald');
      filterAndRenderComics();
    };
  });

  // Comic Reader Controls
  if (closeComicReaderBtn) closeComicReaderBtn.onclick = closeComicReader;
  if (comicOrientationBtn) comicOrientationBtn.onclick = toggleComicReaderOrientation;
  if (comicModeToggleBtn) comicModeToggleBtn.onclick = toggleComicReaderMode;
  if (comicChapterBtn) comicChapterBtn.onclick = openComicChapterSheet;
  if (comicFooterChapterBtn) comicFooterChapterBtn.onclick = openComicChapterSheet;
  if (comicPrevChapterBtn) comicPrevChapterBtn.onclick = goToPrevComicChapter;
  if (comicNextChapterBtn) comicNextChapterBtn.onclick = goToNextComicChapter;
  if (comicFooterModeBtn) comicFooterModeBtn.onclick = toggleComicReaderMode;
  if (comicChapterSheetBackdrop) comicChapterSheetBackdrop.onclick = closeComicChapterSheet;

  // Reader Slider
  if (comicPageSlider) {
    comicPageSlider.oninput = (e) => {
      const pageNum = parseInt(e.target.value, 10);
      const targetIdx = Math.max(0, pageNum - 1);
      currentComicPageIndex = targetIdx;
      if (comicPageNow) comicPageNow.textContent = `Hal. ${pageNum}`;

      if (comicReaderMode === 'webtoon') {
        isComicScrubbing = true;
        const el = comicWebtoonContainer?.querySelector(`div[data-page-index="${targetIdx}"]`);
        el?.scrollIntoView({ behavior: 'auto', block: 'start' });
        clearTimeout(comicScrubbingTimer);
        comicScrubbingTimer = setTimeout(() => {
          isComicScrubbing = false;
        }, 300);
      } else {
        const chapter = activeComic?.chapters?.[currentComicChapterIndex];
        if (chapter && !chapter.is_pdf) {
          renderSwapPage(chapter.pages || []);
        }
      }
    };
  }

  if (comicPrevPageBtn) comicPrevPageBtn.onclick = prevComicPage;
  if (comicNextPageBtn) comicNextPageBtn.onclick = nextComicPage;

  // Swap Tap Zones
  if (comicSwapTapPrev) comicSwapTapPrev.onclick = prevComicPage;
  if (comicSwapTapNext) comicSwapTapNext.onclick = nextComicPage;
  if (comicSwapTapMenu) {
    comicSwapTapMenu.onclick = () => {
      const now = Date.now();
      if (now - lastSwapTapTime < 300) {
        lastSwapTapTime = 0;
        toggleSwapZoom();
      } else {
        lastSwapTapTime = now;
        setTimeout(() => {
          if (Date.now() - lastSwapTapTime >= 280 && lastSwapTapTime !== 0) {
            toggleComicReaderControls();
            lastSwapTapTime = 0;
          }
        }, 285);
      }
    };
  }

  // Horizontal Swipe Gestures on Swap Mode
  if (comicSwapContainer) {
    let touchStartX = 0;
    let touchStartY = 0;
    comicSwapContainer.addEventListener('pointerdown', (e) => {
      touchStartX = e.clientX;
      touchStartY = e.clientY;
    });
    comicSwapContainer.addEventListener('pointerup', (e) => {
      const dx = e.clientX - touchStartX;
      const dy = Math.abs(e.clientY - touchStartY);
      if (Math.abs(dx) > 40 && dy < 60) {
        if (dx < 0) {
          nextComicPage();
        } else {
          prevComicPage();
        }
      }
    });
  }

  // Scroll and Tap in Webtoon container
  if (comicWebtoonContainer) {
    comicWebtoonContainer.addEventListener('scroll', onComicWebtoonScroll, { passive: true });
    comicWebtoonContainer.onclick = (e) => {
      if (e.target.tagName === 'IMG' || e.target === comicWebtoonContainer) {
        toggleComicReaderControls();
      }
    };
  }

  // Drawer
  openTopicDrawerBtn.onclick = openDrawer;
  closeDrawerBtn.onclick = closeDrawer;
  drawerBackdrop.onclick = closeDrawer;

  // Global Unmute Floating Banner & 1-time interaction unmute
  const globalUnmuteBanner = document.getElementById('global-unmute-banner');
  if (globalUnmuteBanner) {
    globalUnmuteBanner.onclick = () => {
      enableGlobalSound();
      triggerHaptic('medium');
      showToast('Suara Diaktifkan 🔊', 'volume-2', 'amber');
    };
  }
  ['click', 'touchend', 'keydown'].forEach(evt => {
    window.addEventListener(evt, () => {
      const activeVid = getActiveAudibleVideo();
      if (!isMuted && (awaitingAudioUnlock || (activeVid && (activeVid.muted || (Date.now() < pendingAudioVerifyUntil && activeVid.paused && !activeVid.ended))))) {
        unlockActiveVideoSound(activeVid);
      }
    }, { passive: true });
  });

  // Drama Sort Button & Bottom Sheet
  const dramaSortBtn = document.getElementById('drama-sort-btn');
  const closeDramaSortBtn = document.getElementById('close-drama-sort-btn');
  const dramaSortSheet = document.getElementById('drama-sort-sheet');
  const dramaSortOptions = document.querySelectorAll('.drama-sort-option');

  if (dramaSortBtn) dramaSortBtn.onclick = openDramaSortSheet;
  if (closeDramaSortBtn) closeDramaSortBtn.onclick = closeDramaSortSheet;
  if (dramaSortSheet) {
    dramaSortSheet.onclick = (e) => {
      if (e.target === dramaSortSheet) closeDramaSortSheet();
    };
  }
  dramaSortOptions.forEach(opt => {
    opt.onclick = () => {
      currentDramaSort = opt.dataset.sort;
      localStorage.setItem('teleshorts_drama_sort', currentDramaSort);
      updateDramaSortUI();
      closeDramaSortSheet();
      triggerHaptic('light');
      showToast(`Urutan: ${getDramaSortLabel(currentDramaSort)} 🔀`, 'arrow-down-up', 'amber');
      filterAndRenderDramas();
    };
  });

  // Email-Only Login & Automatic Sync Controls
  const emailLoginForm = document.getElementById('email-login-form');
  const loginEmailInput = document.getElementById('login-email-input');
  const btnGoogleLogout = document.getElementById('btn-google-logout');
  const btnManualSync = document.getElementById('btn-manual-sync');

  if (emailLoginForm) {
    emailLoginForm.onsubmit = (e) => {
      e.preventDefault();
      handleEmailLogin(loginEmailInput?.value || '');
    };
  }
  if (loginEmailInput) {
    loginEmailInput.addEventListener('input', () => {
      const errEl = document.getElementById('login-email-error');
      if (errEl) errEl.classList.add('hidden');
    });
  }
  if (btnGoogleLogout) {
    btnGoogleLogout.onclick = () => {
      triggerHaptic('light');
      if (currentUser) syncUserDataToCloud(false, { keepalive: true });
      currentUser = null;
      localStorage.removeItem('teleshorts_google_user');
      if (loginEmailInput) loginEmailInput.value = '';
      updateGoogleSyncUI();
      showToast('Berhasil keluar dari akun email 👋', 'log-out', 'zinc');
    };
  }
  if (btnManualSync) {
    btnManualSync.onclick = () => syncUserDataToCloud(true);
  }

  // Real-time cross-tab automatic sync
  window.addEventListener('storage', (e) => {
    if (!currentUser) return;
    const normEmail = normalizeEmail(currentUser.email);
    if (e.key === `teleshorts_cloud_backup_${normEmail}` && e.newValue) {
      try {
        const parsed = sanitizeSyncPayload(JSON.parse(e.newValue));
        applySanitizedSyncData(parsed, false);
        refreshAllSyncedViews();
      } catch (err) {}
    }
  });

  // Share Profile button
  const btnShareProfile = document.getElementById('btn-share-profile');
  if (btnShareProfile) {
    btnShareProfile.onclick = () => {
      triggerHaptic('light');
      const url = window.location.href;
      const copyProfileFallback = () => {
        navigator.clipboard?.writeText(url).catch(() => {});
        showToast('Tautan profil disalin! 📋', 'check', 'emerald');
      };
      if (navigator.share) {
        navigator.share({ title: 'appVideo', text: 'Tonton koleksi drama & video favoritku di appVideo!', url }).catch((err) => {
          if (err?.name !== 'AbortError') copyProfileFallback();
        });
      } else {
        copyProfileFallback();
      }
    };
  }

  // Mute audio
  if (globalMuteBtn) {
    globalMuteBtn.onclick = () => {
      triggerHaptic('light');
      setGlobalMuted(!isMuted);
    };
  }

  // Tombol "Untuk Anda" (Klik untuk Mengacak Ulang Feed Semua Topik)
  const titleUntukAndaBtn = document.getElementById('title-untuk-anda-btn');
  if (titleUntukAndaBtn) {
    titleUntukAndaBtn.onclick = () => {
      triggerHaptic('medium');
      currentTopicId = 0;
      isTopicShuffled = true;
      localStorage.setItem('teleshorts_topic_shuffle', '1');
      updateTopicShuffleUI();
      renderShortsFeed();
      renderDrawerTopics();
    };
  }

  // Tombol Pilihan Acak / Urut di Navbar Atas (berlaku saat membuka topik maupun feed)
  if (topicShuffleBtn) {
    topicShuffleBtn.onclick = () => {
      triggerHaptic('light');
      isTopicShuffled = !isTopicShuffled;
      localStorage.setItem('teleshorts_topic_shuffle', isTopicShuffled ? '1' : '0');
      updateTopicShuffleUI();
      renderShortsFeed();
    };
  }

  // Drama Genre Pills
  dramaGenrePills.forEach(pill => {
    pill.onclick = () => {
      triggerHaptic('light');
      dramaGenrePills.forEach(p => {
        if (p.dataset.genre === '18+') {
          p.className = 'genre-pill px-3 py-1 rounded-full text-[11px] font-bold bg-rose-950/80 border border-rose-600/60 text-rose-300 hover:bg-rose-900/80 whitespace-nowrap active:scale-95 transition-all flex items-center gap-1 shadow-sm';
        } else {
          p.className = 'genre-pill px-3 py-1 rounded-full text-[11px] font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300 whitespace-nowrap active:scale-95 transition-all';
        }
      });
      if (pill.dataset.genre === '18+') {
        pill.className = 'genre-pill px-3 py-1 rounded-full text-[11px] font-black bg-rose-600 text-white shadow-lg shadow-rose-600/40 whitespace-nowrap active:scale-95 transition-all flex items-center gap-1';
      } else {
        pill.className = 'genre-pill px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-500 text-black shadow-sm whitespace-nowrap active:scale-95 transition-all';
      }
      currentGenreFilter = pill.dataset.genre;
      filterAndRenderDramas();
    };
  });

  // Drama Search Input (Debounced 120ms for smooth typing)
  let dramaSearchTimer = null;
  dramaSearchInput.addEventListener('input', () => {
    clearTimeout(dramaSearchTimer);
    dramaSearchTimer = setTimeout(filterAndRenderDramas, 120);
  });

  dramaSearchClear.onclick = () => {
    triggerHaptic('light');
    clearTimeout(dramaSearchTimer);
    dramaSearchInput.value = '';
    filterAndRenderDramas();
    dramaSearchInput.focus();
  };

  // 18+ Category Pills, Search & Sort
  adult18CategoryPills.forEach(pill => {
    pill.onclick = () => {
      triggerHaptic('light');
      adult18CategoryPills.forEach(p => {
        p.className = 'adult18-pill px-3 py-1 rounded-full text-[11px] font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300 whitespace-nowrap active:scale-95 transition-all';
      });
      pill.className = 'adult18-pill px-3 py-1 rounded-full text-[11px] font-bold bg-rose-600 text-white shadow-sm whitespace-nowrap active:scale-95 transition-all';
      currentAdultCategoryFilter = pill.dataset.category;
      filterAndRenderAdult18();
    };
  });

  if (adult18SearchInput) {
    let adultSearchTimer = null;
    adult18SearchInput.addEventListener('input', () => {
      clearTimeout(adultSearchTimer);
      adultSearchTimer = setTimeout(filterAndRenderAdult18, 120);
    });
    if (adult18SearchClear) {
      adult18SearchClear.onclick = () => {
        triggerHaptic('light');
        clearTimeout(adultSearchTimer);
        adult18SearchInput.value = '';
        filterAndRenderAdult18();
        adult18SearchInput.focus();
      };
    }
  }

  if (adult18SortBtn) {
    const sortCycle = ['random', 'duration_desc', 'hd', 'az', 'za'];
    adult18SortBtn.onclick = () => {
      triggerHaptic('light');
      const nextIdx = (sortCycle.indexOf(currentAdultSort) + 1) % sortCycle.length;
      currentAdultSort = sortCycle[nextIdx];
      localStorage.setItem('teleshorts_adult_sort', currentAdultSort);
      updateAdultSortUI();
      showToast(`Urutan 18+: ${getAdultSortLabel(currentAdultSort)} 🔀`, 'arrow-down-up', 'rose');
      filterAndRenderAdult18();
    };
  }

  // Drama Detail Modal
  closeDramaModal.onclick = () => {
    triggerHaptic('light');
    dramaDetailModal.classList.add('hidden');
  };

  modalBookmarkDramaBtn.onclick = () => {
    if (!selectedDrama) return;
    triggerHaptic('success');
    const nowSaved = !savedDramaIds.has(selectedDrama.id);
    if (nowSaved) {
      savedDramaIds.add(selectedDrama.id);
    } else {
      savedDramaIds.delete(selectedDrama.id);
    }
    persistStorage();
    updateModalBookmarkBtn();
    syncCatalogBookmarkIcons(selectedDrama.id, nowSaved);
  };

  // Drama Reel Close
  closeDramaReelBtn.onclick = closeDramaReel;
  closeReelEpSheet.onclick = () => reelEpSheet.classList.add('hidden');

  // Header Landscape Toggle Button in Drama Reel
  const reelLandscapeToggleBtn = document.getElementById('reel-landscape-toggle-btn');
  if (reelLandscapeToggleBtn) {
    reelLandscapeToggleBtn.onclick = () => {
      if (!currentPlayingDrama) return;
      const targetSlide = dramaEpisodesReel.children[currentReelEpisodeIndex];
      const v = targetSlide ? targetSlide.querySelector('video') : null;
      const currentTime = v ? v.currentTime : 0;
      openLandscapeTheater(currentPlayingDrama, currentReelEpisodeIndex, currentTime);
    };
  }

  // ============================================================
  // LANDSCAPE THEATER EVENTS (WIDESCREEN & AUTO-NEXT EPISODES)
  // ============================================================
  if (exitLandscapeBtn) {
    exitLandscapeBtn.onclick = closeLandscapeTheater;
  }
  if (exitLandscapeBackBtn) {
    exitLandscapeBackBtn.onclick = closeLandscapeTheater;
  }
  if (landscapeLockBtn) {
    landscapeLockBtn.onclick = (e) => {
      e.stopPropagation();
      triggerHaptic('light');
      setLandscapeLocked(!isLandscapeLocked);
    };
  }
  if (landscapeUnlockBtn) {
    landscapeUnlockBtn.onclick = (e) => {
      e.stopPropagation();
      triggerHaptic('light');
      setLandscapeLocked(false);
    };
  }
  if (landscapeFitBtn) {
    landscapeFitBtn.onclick = (e) => {
      e.stopPropagation();
      if (isLandscapeLocked) return;
      triggerHaptic('light');
      const nextIsCover = !getEffectiveLandscapeCover();
      landscapeFitMode = nextIsCover ? 'cover' : 'contain';
      applyLandscapeVideoFit();
      showLandscapeControls(true);
    };
  }
  if (landscapeEpListBtn) {
    landscapeEpListBtn.onclick = (e) => {
      e.stopPropagation();
      if (isLandscapeLocked) return;
      openLandscapeEpisodeSheet();
    };
  }
  if (closeLandscapeEpSheet) {
    closeLandscapeEpSheet.onclick = () => {
      landscapeEpSheet.classList.add('hidden');
      resetLandscapeControlsTimer();
    };
  }

  // Keep controls visible while user actively touches/hovers top header or bottom bar
  [landscapeHeader, landscapeFooter].forEach((bar) => {
    if (!bar) return;
    ['pointerdown', 'touchstart', 'pointermove'].forEach((evt) => {
      bar.addEventListener(evt, () => {
        if (!isLandscapeLocked && !isLandscapeControlsHidden()) resetLandscapeControlsTimer();
      }, { passive: true });
    });
  });

  // Wire loading indicator di mode lanskap
  if (landscapeVideo && landscapeLoadingIndicator) {
    wireVideoLoadingIndicator(landscapeVideo, landscapeLoadingIndicator);
  }

  // Toggle Play / Pause in Landscape
  if (landscapeTogglePlayBtn) {
    landscapeTogglePlayBtn.onclick = (e) => {
      e.stopPropagation();
      if (isLandscapeLocked) return;
      triggerHaptic('light');
      toggleLandscapePlayState();
    };
  }

  // Skip Next Episode in Landscape
  if (landscapeNextEpBtn) {
    landscapeNextEpBtn.onclick = (e) => {
      e.stopPropagation();
      if (isLandscapeLocked || !currentLandscapeDrama) return;
      if (currentLandscapeEpIndex < currentLandscapeDrama.episodes.length - 1) {
        triggerHaptic('medium');
        const nextIdx = currentLandscapeEpIndex + 1;
        playLandscapeEpisode(nextIdx, 0);
      } else {
        showLandscapeControls(true);
      }
    };
  }

  // Skip Prev Episode in Landscape
  if (landscapePrevEpBtn) {
    landscapePrevEpBtn.onclick = (e) => {
      e.stopPropagation();
      if (isLandscapeLocked || !currentLandscapeDrama) return;
      if (currentLandscapeEpIndex > 0) {
        triggerHaptic('medium');
        const prevIdx = currentLandscapeEpIndex - 1;
        playLandscapeEpisode(prevIdx, 0);
      } else {
        showLandscapeControls(true);
      }
    };
  }

  // Mute / Unmute in Landscape
  if (landscapeMuteBtn) {
    landscapeMuteBtn.onclick = (e) => {
      e.stopPropagation();
      if (isLandscapeLocked) return;
      triggerHaptic('light');
      setGlobalMuted(!isMuted);
      showLandscapeControls(true);
    };
  }

  // Interactive Scrubbing on Landscape Progress Bar (Click & Drag Timeline with Time Bubble)
  if (landscapeProgressTrack) {
    function updateLandscapeScrub(clientX, clientY) {
      if (!landscapeVideo || !landscapeVideo.duration) return 0;
      const rect = landscapeProgressTrack.getBoundingClientRect();
      const rawAxis = getLandscapeNormalizedAxis(rect, clientX, clientY);
      const pct = Math.max(0, Math.min(1, rawAxis));
      if (landscapeProgressFill) landscapeProgressFill.style.width = `${pct * 100}%`;
      const seekTime = pct * landscapeVideo.duration;
      if (landscapeTimeNow) landscapeTimeNow.textContent = formatTime(seekTime);
      if (landscapeBubbleTime) landscapeBubbleTime.textContent = formatTime(seekTime);
      if (landscapeBubbleTotal && landscapeVideo.duration) landscapeBubbleTotal.textContent = formatTime(landscapeVideo.duration);
      if (landscapeScrubBubble) {
        landscapeScrubBubble.style.left = `${pct * 100}%`;
        landscapeScrubBubble.classList.remove('hidden');
      }
      return seekTime;
    }

    landscapeProgressTrack.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      if (isLandscapeLocked || !landscapeVideo || !landscapeVideo.duration) return;
      isLandscapeScrubbing = true;
      clearLandscapeControlsTimer();
      if (landscapeScrubKnob) landscapeScrubKnob.classList.remove('scale-0');
      const seekTime = updateLandscapeScrub(e.clientX, e.clientY);
      landscapeVideo.currentTime = seekTime;
      triggerHaptic('light');

      const onPointerMove = (ev) => {
        if (!isLandscapeScrubbing) return;
        ev.stopPropagation();
        const curSeek = updateLandscapeScrub(ev.clientX, ev.clientY);
        landscapeVideo.currentTime = curSeek;
      };

      const onPointerUp = (ev) => {
        if (!isLandscapeScrubbing) return;
        isLandscapeScrubbing = false;
        ev.stopPropagation();
        const finalSeek = updateLandscapeScrub(ev.clientX, ev.clientY);
        landscapeVideo.currentTime = finalSeek;
        if (landscapeScrubKnob) landscapeScrubKnob.classList.add('scale-0');
        if (landscapeScrubBubble) landscapeScrubBubble.classList.add('hidden');
        landscapeVideo.play()
          .then(() => resetLandscapeControlsTimer())
          .catch(() => showLandscapeControls(false));
        triggerHaptic('light');
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    });

    // Landscape Video Timeupdate (Only if not currently scrubbing)
    if (landscapeVideo) {
      landscapeVideo.addEventListener('timeupdate', () => {
        if (isLandscapeScrubbing || !landscapeVideo.duration) return;
        const pct = (landscapeVideo.currentTime / landscapeVideo.duration) * 100;
        if (landscapeProgressFill) landscapeProgressFill.style.width = `${pct}%`;
        if (landscapeTimeNow) landscapeTimeNow.textContent = formatTime(landscapeVideo.currentTime);
        if (landscapeTimeTotal && landscapeVideo.duration && (landscapeTimeTotal.textContent === '00:00' || landscapeTimeTotal.textContent === '')) {
          landscapeTimeTotal.textContent = formatTime(landscapeVideo.duration);
        }
      });
    }
  }

  // Landscape Video Listeners (Play, Playing, Waiting/Buffering, Pause, Auto-Next Ended)
  if (landscapeVideo) {
    landscapeVideo.addEventListener('play', () => {
      updateLandscapePlayBtn(true);
      if (landscapePlayIndicator) landscapePlayIndicator.style.opacity = '0';
      if (landscapeVideo.readyState >= 3) resetLandscapeControlsTimer();
    });
    landscapeVideo.addEventListener('playing', () => {
      updateLandscapePlayBtn(true);
      if (landscapePlayIndicator) landscapePlayIndicator.style.opacity = '0';
      resetLandscapeControlsTimer();
    });
    landscapeVideo.addEventListener('waiting', () => {
      // Keep HUD available if user is currently seeing controls while buffering
      if (!isLandscapeControlsHidden()) clearLandscapeControlsTimer();
    });
    landscapeVideo.addEventListener('pause', () => {
      updateLandscapePlayBtn(false);
      if (landscapePlayIndicator) landscapePlayIndicator.style.opacity = '1';
      showLandscapeControls(false);
    });

    // OTOMATIS LANJUT KE EPISODE BERIKUTNYA SAAT EPISODE SELESAI
    landscapeVideo.addEventListener('ended', () => {
      if (!currentLandscapeDrama) return;
      if (currentLandscapeEpIndex < currentLandscapeDrama.episodes.length - 1) {
        const nextIdx = currentLandscapeEpIndex + 1;
        triggerHaptic('success');
        playLandscapeEpisode(nextIdx, 0);
      } else {
        updateLandscapePlayBtn(false);
        showLandscapeControls(false);
      }
    });
  }

  // Long Press (Hold 2X Speed), Single Tap (Auto-Hide HUD Toggle / Resume), & Double Tap (-10s/+10s)
  if (landscapeVideoContainer && landscapeVideo) {
    let longPressTimer = null;
    let isHolding2x = false;
    let justFinishedHold = false;
    let startX = 0;
    let startY = 0;
    let hasMoved = false;
    let lastTapTime = 0;
    let tapTimeout = null;

    const flashFeedback = (el) => {
      if (!el) return;
      el.classList.remove('hidden');
      el.classList.add('flex');
      el.style.opacity = '1';
      setTimeout(() => {
        el.style.opacity = '0';
        setTimeout(() => {
          el.classList.add('hidden');
          el.classList.remove('flex');
        }, 200);
      }, 500);
    };

    // 1. TAHAN LAYAR -> 2X SPEED (Long Press Hold)
    landscapeVideoContainer.addEventListener('pointerdown', (e) => {
      if (isLandscapeLocked) return;
      if (e.target.closest('header') || e.target.closest('footer') || e.target.closest('#landscape-ep-sheet') || e.target.closest('#landscape-unlock-pill')) {
        return;
      }
      startX = e.clientX;
      startY = e.clientY;
      hasMoved = false;

      clearTimeout(longPressTimer);
      longPressTimer = setTimeout(() => {
        isHolding2x = true;
        landscapeVideo.playbackRate = 2.0;
        if (landscapeSpeedBadge) landscapeSpeedBadge.classList.remove('hidden');
        triggerHaptic('medium');
      }, 250);
    });

    landscapeVideoContainer.addEventListener('pointermove', (e) => {
      if (isLandscapeLocked) return;
      if (e.pointerType === 'mouse' && (e.movementX || e.movementY) && !isHolding2x && !isLandscapeScrubbing) {
        showLandscapeControls(true);
      }
      const dx = Math.abs(e.clientX - startX);
      const dy = Math.abs(e.clientY - startY);
      if (dx > 12 || dy > 12) {
        hasMoved = true;
        clearTimeout(longPressTimer);
      }
    });

    const stopLandscapeLongPress = () => {
      clearTimeout(longPressTimer);
      if (isHolding2x) {
        isHolding2x = false;
        justFinishedHold = true;
        landscapeVideo.playbackRate = 1.0;
        if (landscapeSpeedBadge) landscapeSpeedBadge.classList.add('hidden');
        triggerHaptic('light');
        setTimeout(() => { justFinishedHold = false; }, 250);
      }
    };

    landscapeVideoContainer.addEventListener('pointerup', stopLandscapeLongPress);
    landscapeVideoContainer.addEventListener('pointercancel', stopLandscapeLongPress);
    landscapeVideoContainer.addEventListener('pointerleave', stopLandscapeLongPress);

    // 2. TEKAN 1X -> Jeda / Putar Video (atau tampilkan tombol buka kunci jika terkunci) + Double Tap Seek -10s / +10s
    landscapeVideoContainer.addEventListener('click', (e) => {
      if (justFinishedHold || isHolding2x || hasMoved) return;
      if (e.target.closest('header') || e.target.closest('footer') || e.target.closest('#landscape-ep-sheet') || e.target.closest('#landscape-unlock-pill')) {
        return;
      }
      if (isLandscapeLocked) {
        revealLandscapeUnlockHint(2500);
        return;
      }

      const now = Date.now();
      const rect = landscapeVideoContainer.getBoundingClientRect();
      const axisRatio = getLandscapeNormalizedAxis(rect, e.clientX, e.clientY);
      const tapInterval = now - lastTapTime;

      if (tapInterval < 240 && tapInterval > 0 && (axisRatio < 0.30 || axisRatio > 0.70)) {
        // Double tap kiri/kanan -> -10s / +10s
        clearTimeout(tapTimeout);
        triggerHaptic('medium');

        if (axisRatio < 0.30) {
          landscapeVideo.currentTime = Math.max(0, landscapeVideo.currentTime - 10);
          flashFeedback(landscapeSeekLeft);
        } else {
          landscapeVideo.currentTime = Math.min(landscapeVideo.duration || 9999, landscapeVideo.currentTime + 10);
          flashFeedback(landscapeSeekRight);
        }
        if (!isLandscapeControlsHidden()) resetLandscapeControlsTimer();
      } else if (axisRatio >= 0.30 && axisRatio <= 0.70) {
        // Single tap tengah -> langsung Jeda / Putar
        clearTimeout(tapTimeout);
        triggerHaptic('light');
        toggleLandscapePlayState();
      } else {
        // Single tap sisi kiri/kanan -> Jeda / Putar jika bukan double-tap
        tapTimeout = setTimeout(() => {
          triggerHaptic('light');
          toggleLandscapePlayState();
        }, 200);
      }
      lastTapTime = now;
    });
  }

  // Auto handle orientation resize
  window.addEventListener('resize', () => {
    syncLandscapeViewport();
    syncComicOrientation();
  });
  window.addEventListener('orientationchange', () => {
    syncLandscapeViewport();
    syncComicOrientation();
  });

  // Profile Tab Buttons
  profileTabLikes.onclick = () => {
    triggerHaptic('light');
    profileTab = 'likes';
    updateProfileTabHeaders();
    renderProfileContent();
  };
  profileTabShorts.onclick = () => {
    triggerHaptic('light');
    profileTab = 'shorts';
    updateProfileTabHeaders();
    renderProfileContent();
  };
  profileTabDrama.onclick = () => {
    triggerHaptic('light');
    profileTab = 'drama';
    updateProfileTabHeaders();
    renderProfileContent();
  };

  // TikTok Custom Collections Modals
  const backdropCreateCol = document.getElementById('backdrop-create-collection');
  const closeModalCreateCol = document.getElementById('close-modal-create-collection');
  const cancelCreateCol = document.getElementById('cancel-create-collection');
  const submitCreateCol = document.getElementById('submit-create-collection');
  const inputColName = document.getElementById('input-collection-name');
  const colCharCount = document.getElementById('collection-char-count');

  inputColName?.addEventListener('input', () => {
    if (colCharCount) colCharCount.textContent = `${inputColName.value.length}/30`;
  });

  const handleSubmitCreateCol = () => {
    const name = inputColName?.value.trim();
    if (!name) {
      showToast('Beri nama koleksi dulu ya beb! ✨', 'alert-circle', 'rose');
      return;
    }
    const created = createNewCollection(name, pendingVideoIdForNewCol);
    closeCreateCollectionModal();
    showToast(`Koleksi "${created.name}" berhasil dibuat! 📁`, 'check', 'amber');
    triggerHaptic('success');

    if (currentManagingVideoId) {
      renderManageCollectionsList(currentManagingVideoId);
    }
    if (activeView === 'profile' && profileTab === 'shorts') {
      renderProfileContent();
    }
    if (pendingVideoIdForNewCol) {
      const slide = document.querySelector(`.snap-slide[data-id="${pendingVideoIdForNewCol}"]`);
      if (slide) updateSaveButtonUI(slide, true);
    }
  };

  submitCreateCol?.addEventListener('click', handleSubmitCreateCol);
  inputColName?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSubmitCreateCol();
  });

  [backdropCreateCol, closeModalCreateCol, cancelCreateCol].forEach(btn => {
    btn?.addEventListener('click', closeCreateCollectionModal);
  });

  // Manage Collections Bottom Sheet
  const backdropManageCol = document.getElementById('backdrop-manage-collections');
  const btnDoneManageCol = document.getElementById('btn-done-manage-collections');
  const btnCloseManageCol = document.getElementById('btn-close-manage-col');
  const btnQuickNewCol = document.getElementById('btn-quick-new-collection');
  const inlineCreateBox = document.getElementById('inline-create-col-box');
  const inputInlineColName = document.getElementById('input-inline-col-name');
  const btnSubmitInlineCol = document.getElementById('btn-submit-inline-col');
  const btnCancelInlineCol = document.getElementById('btn-cancel-inline-col');

  btnQuickNewCol?.addEventListener('click', () => {
    if (inlineCreateBox) {
      inlineCreateBox.classList.remove('hidden');
      if (inputInlineColName) {
        inputInlineColName.value = '';
        inputInlineColName.focus();
      }
    }
  });

  const handleInlineCreateSubmit = () => {
    const name = inputInlineColName?.value.trim();
    if (!name) {
      showToast('Beri nama koleksi dulu ya beb! ✨', 'alert-circle', 'rose');
      return;
    }
    const created = createNewCollection(name, currentManagingVideoId);
    inlineCreateBox?.classList.add('hidden');
    if (inputInlineColName) inputInlineColName.value = '';
    
    // Tampilkan feedback instan di dalam sheet
    showManageCollectionFeedback(`Koleksi "${created.name}" dibuat & video tersimpan! 📁✨`, 'amber');
    triggerHaptic('success');

    if (currentManagingVideoId) {
      renderManageCollectionsList(currentManagingVideoId);
      const slide = document.querySelector(`.snap-slide[data-id="${currentManagingVideoId}"]`);
      if (slide) updateSaveButtonUI(slide, true);
    }
    if (activeView === 'profile' && profileTab === 'shorts') {
      renderProfileContent();
    }
  };

  btnSubmitInlineCol?.addEventListener('click', handleInlineCreateSubmit);
  inputInlineColName?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleInlineCreateSubmit();
  });
  btnCancelInlineCol?.addEventListener('click', () => {
    inlineCreateBox?.classList.add('hidden');
  });

  btnDoneManageCol?.addEventListener('click', () => {
    const videoId = currentManagingVideoId;
    closeManageCollectionsModal();
    if (videoId) {
      const activeCols = customCollections.filter(c => c.videoIds.includes(videoId));
      if (activeCols.length > 0) {
        const names = activeCols.map(c => c.name).join(', ');
        showToast(`Tersimpan ke Koleksi: ${names} 🔖`, 'bookmark', 'amber', 3000);
      } else {
        showToast('Video dihapus dari semua koleksi 🗑️', 'bookmark', 'zinc', 2500);
      }
      triggerHaptic('success');
    }
  });

  [backdropManageCol, btnCloseManageCol].forEach(btn => {
    btn?.addEventListener('click', closeManageCollectionsModal);
  });

  // Pause active video playback & flush pending sync when app/tab loses visibility or unloads
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      flushPendingCloudSync();
      document.querySelectorAll('video').forEach(v => {
        if (!v.paused) v.pause();
      });
    }
  });
  window.addEventListener('pagehide', flushPendingCloudSync);

  // Keyboard Navigation: Escape and Arrow keys
  document.addEventListener('keydown', (e) => {
    // Escape key closes topmost open sheet/modal/drawer
    if (e.key === 'Escape') {
      const modalCreate = document.getElementById('modal-create-collection');
      const modalManage = document.getElementById('modal-manage-collections');
      const sortSheet = document.getElementById('drama-sort-sheet');
      if (modalCreate && !modalCreate.classList.contains('hidden')) { closeCreateCollectionModal(); return; }
      if (modalManage && !modalManage.classList.contains('hidden')) { closeManageCollectionsModal(); return; }
      if (landscapeEpSheet && !landscapeEpSheet.classList.contains('hidden')) { landscapeEpSheet.classList.add('hidden'); return; }
      if (dramaLandscapeTheater && !dramaLandscapeTheater.classList.contains('hidden')) {
        if (isLandscapeLocked) { setLandscapeLocked(false); return; }
        closeLandscapeTheater();
        return;
      }
      if (reelEpSheet && !reelEpSheet.classList.contains('hidden')) { reelEpSheet.classList.add('hidden'); return; }
      if (dramaReelModal && !dramaReelModal.classList.contains('hidden')) { closeDramaReel(); return; }
      if (dramaDetailModal && !dramaDetailModal.classList.contains('hidden')) { dramaDetailModal.classList.add('hidden'); return; }
      if (sortSheet && !sortSheet.classList.contains('hidden')) { closeDramaSortSheet(); return; }
      if (comicChapterSheet && !comicChapterSheet.classList.contains('hidden')) { closeComicChapterSheet(); return; }
      if (comicSortSheet && !comicSortSheet.classList.contains('hidden')) { closeComicSortSheet(); return; }
      if (comicReaderModal && !comicReaderModal.classList.contains('hidden')) { closeComicReader(); return; }
      if (topicDrawer && !topicDrawer.classList.contains('hidden')) { closeDrawer(); }
      return;
    }

    // Active Comic Reader navigation
    if (comicReaderModal && !comicReaderModal.classList.contains('hidden')) {
      if (e.key === 'ArrowLeft') {
        prevComicPage();
      } else if (e.key === 'ArrowRight') {
        nextComicPage();
      } else if (e.key === 'ArrowUp' && comicReaderMode === 'webtoon' && comicWebtoonContainer) {
        comicWebtoonContainer.scrollBy({ top: -260, behavior: 'smooth' });
      } else if (e.key === 'ArrowDown' && comicReaderMode === 'webtoon' && comicWebtoonContainer) {
        comicWebtoonContainer.scrollBy({ top: 260, behavior: 'smooth' });
      }
    }
  });
}

// ============================================================
// KOLEKSI BARU & MANAGE KOLEKSI MODALS (TIKTOK STYLE)
// ============================================================
let pendingVideoIdForNewCol = null;

function showManageCollectionFeedback(message, color = 'amber') {
  const box = document.getElementById('modal-manage-feedback');
  const txt = document.getElementById('modal-manage-feedback-text');
  if (!box || !txt) return;
  txt.textContent = message;
  box.className = `flex items-center justify-between px-3.5 py-2 rounded-xl ${color === 'amber' ? 'bg-amber-500/15 border-amber-500/30 text-amber-300' : 'bg-zinc-800 border-zinc-700 text-zinc-300'} border text-xs font-semibold animate-slide-up transition-all`;
  box.classList.remove('hidden');
}

function openCreateCollectionModal(initialVideoId = null) {
  pendingVideoIdForNewCol = initialVideoId;
  const modal = document.getElementById('modal-create-collection');
  const input = document.getElementById('input-collection-name');
  const charCount = document.getElementById('collection-char-count');
  if (!modal || !input) return;
  input.value = '';
  if (charCount) charCount.textContent = '0/30';
  modal.classList.remove('hidden');
  input.focus();
  triggerHaptic('light');
}

function closeCreateCollectionModal() {
  const modal = document.getElementById('modal-create-collection');
  if (modal) modal.classList.add('hidden');
  pendingVideoIdForNewCol = null;
}

function openManageCollectionsModal(videoId) {
  currentManagingVideoId = videoId;
  const inlineBox = document.getElementById('inline-create-col-box');
  if (inlineBox) inlineBox.classList.add('hidden');
  const feedbackBox = document.getElementById('modal-manage-feedback');
  if (feedbackBox) feedbackBox.classList.add('hidden');
  renderManageCollectionsList(videoId);
  const modal = document.getElementById('modal-manage-collections');
  if (modal) modal.classList.remove('hidden');
  triggerHaptic('medium');
}

function closeManageCollectionsModal() {
  const modal = document.getElementById('modal-manage-collections');
  if (modal) modal.classList.add('hidden');
  currentManagingVideoId = null;
}

function renderManageCollectionsList(videoId) {
  const list = document.getElementById('collection-checkbox-list');
  if (!list) return;
  list.innerHTML = '';

  customCollections.forEach(col => {
    const isChecked = col.videoIds.includes(videoId);
    const row = document.createElement('div');
    row.className = 'flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer active:scale-98 transition-all';
    row.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center text-amber-400">
          ${iconSvg(col.isDefault ? 'bookmark' : 'folder', `w-4 h-4 ${col.isDefault ? 'fill-amber-400' : ''}`)}
        </div>
        <div>
          <div class="text-xs font-bold text-white">${escapeHtml(col.name)}</div>
          <div class="text-[10px] text-zinc-400">${col.videoIds.length} video</div>
        </div>
      </div>
      <div class="w-6 h-6 rounded-full border ${isChecked ? 'bg-amber-500 border-amber-500 text-black' : 'border-zinc-600 bg-transparent'} flex items-center justify-center transition-all">
        ${isChecked ? iconSvg('check', 'w-3.5 h-3.5 stroke-[3]') : ''}
      </div>
    `;
    row.onclick = () => {
      triggerHaptic('light');
      const isNowSaved = toggleVideoInCollection(col.id, videoId);
      renderManageCollectionsList(videoId);

      const slide = document.querySelector(`.snap-slide[data-id="${videoId}"]`);
      if (slide) {
        updateSaveButtonUI(slide, savedShortIds.has(videoId));
      }

      // Tampilkan feedback instan di dalam bottom sheet
      showManageCollectionFeedback(
        isNowSaved ? `Tersimpan ke "${col.name}" 🔖` : `Dihapus dari "${col.name}" 🗑️`,
        isNowSaved ? 'amber' : 'zinc'
      );
    };
    list.appendChild(row);
  });
}

function updateProfileTabHeaders() {
  [profileTabLikes, profileTabShorts, profileTabDrama].forEach(t => {
    t.className = 'flex-1 py-3 flex items-center justify-center gap-1 text-[11px] font-bold text-zinc-400 border-b-2 border-transparent transition-all';
  });

  if (profileTab === 'likes') {
    profileTabLikes.className = 'flex-1 py-3 flex items-center justify-center gap-1 text-[11px] font-bold text-white border-b-2 border-white transition-all';
  } else if (profileTab === 'shorts') {
    profileTabShorts.className = 'flex-1 py-3 flex items-center justify-center gap-1 text-[11px] font-bold text-white border-b-2 border-white transition-all';
  } else if (profileTab === 'drama') {
    profileTabDrama.className = 'flex-1 py-3 flex items-center justify-center gap-1 text-[11px] font-bold text-white border-b-2 border-white transition-all';
  }
}

function formatCount(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const totalSec = Math.floor(seconds);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}

document.addEventListener('DOMContentLoaded', initApp);
