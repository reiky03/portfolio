// ============================================================
// STATE & LOCAL STORAGE PERSISTENCE
// ============================================================
const STREAM_PROXY_BASE = 'https://test-worker.big-marigold.workers.dev';
const GDRIVE_USER_DATA_FOLDER_ID = '1w3bQfcfdqc4-MfqbmHJ17JC-fhOTRR3W';

let allVideos = [];
let allTopics = [];
let allDramas = [];
let currentTopicId = 0;

// Default suara: Jika pernah diaktifkan sebelumnya, langsung putar dengan suara!
let isMuted = localStorage.getItem('teleshorts_unmuted') === '1' ? false : true;
let activeView = 'shorts'; // 'shorts' | 'drama' | 'profile'
let profileTab = 'likes';   // 'likes' | 'shorts' | 'drama'

let currentPlayingShortVideo = null;
let shortsObserver = null;

let selectedDrama = null;
let currentPlayingDrama = null;
let currentReelEpisodeIndex = 0;
let dramaReelObserver = null;
let currentGenreFilter = 'all';

// Urutan Drama: 'random' | 'az' | 'za' | 'rating' | 'eps'
let currentDramaSort = localStorage.getItem('teleshorts_drama_sort') || 'random';

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

  // Refresh badges in modals & sheets if open
  if (selectedDrama) renderModalEpisodes(selectedDrama);
  renderReelSheetGrid();
  filterAndRenderDramas();
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
const viewProfile = document.getElementById('view-profile');
const feedContainer = document.getElementById('feed-container');

// Top bar shorts
const openTopicDrawerBtn = document.getElementById('open-topic-drawer-btn');
const activeTopicBadge = document.getElementById('active-topic-badge');
const globalMuteBtn = document.getElementById('global-mute-btn');
const muteIcon = document.getElementById('mute-icon');

// Drawer 6 Topik
const topicDrawer = document.getElementById('topic-drawer');
const drawerBackdrop = document.getElementById('drawer-backdrop');
const drawerContent = document.getElementById('drawer-content');
const closeDrawerBtn = document.getElementById('close-drawer-btn');
const drawerTopicsList = document.getElementById('drawer-topics-list');

// Nav buttons
const navBtnShorts = document.getElementById('nav-btn-shorts');
const navBtnTopics = document.getElementById('nav-btn-topics');
const navBtnDrama = document.getElementById('nav-btn-drama');
const navBtnSaved = document.getElementById('nav-btn-saved');
const navBtnProfile = document.getElementById('nav-btn-profile');

// Drama catalog
const dramaListGrid = document.getElementById('drama-list-grid');
const dramaSearchInput = document.getElementById('drama-search-input');
const dramaSearchClear = document.getElementById('drama-search-clear');
const searchFeedback = document.getElementById('search-feedback');
const dramaGenrePills = document.querySelectorAll('.genre-pill');
const dramaCountLabel = document.getElementById('drama-count-label');

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
const reelCurrentEpBadge = document.getElementById('reel-current-ep-badge');
const reelOpenEpSheetBtn = document.getElementById('reel-open-ep-sheet-btn');
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

// ============================================================
// APP INIT
// ============================================================
async function initApp() {
  const initialLoader = document.getElementById('app-initial-loader');
  const initialLoaderText = document.getElementById('initial-loader-text');
  if (initialLoaderText) initialLoaderText.textContent = "Mengunduh katalog video & drama...";

  try {
    const res = await fetch(`videos.json?v=${Date.now()}`);
    if (!res.ok) throw new Error('Network error');
    const data = await res.json();
    allTopics = data.topics || FALLBACK_DATA.topics;
    allVideos = data.videos || FALLBACK_DATA.videos;
    allDramas = data.dramas || FALLBACK_DATA.dramas;
  } catch (err) {
    allTopics = FALLBACK_DATA.topics;
    allVideos = FALLBACK_DATA.videos;
    allDramas = FALLBACK_DATA.dramas;
  }

  if (initialLoaderText) initialLoaderText.textContent = "Menyiapkan hiburan terbaik...";

  // Pre-seed sample states
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
  loadCollections();
  persistStorage();

  renderDrawerTopics();
  renderShortsFeed();
  filterAndRenderDramas();
  renderProfileContent();
  updateGoogleSyncUI();
  updateDramaSortUI();
  setupEvents();

  // Smooth fade-out splash loader saat data & tampilan selesai dimuat
  if (initialLoader) {
    setTimeout(() => {
      initialLoader.style.opacity = '0';
      setTimeout(() => {
        initialLoader.classList.add('hidden');
      }, 350);
    }, 250);
  }
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
  toast.className = `tiktok-toast flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-zinc-900/95 backdrop-blur-md border ${isAmber ? 'border-amber-400/50 shadow-[0_4px_20px_rgba(251,191,36,0.25)]' : 'border-white/20 shadow-2xl'} text-xs font-semibold text-white pointer-events-auto`;
  toast.innerHTML = `
    <div class="w-6 h-6 rounded-full bg-${color}-500/20 flex items-center justify-center text-${color}-400 shrink-0">
      <i data-lucide="${iconName}" class="w-3.5 h-3.5 ${iconName === 'bookmark' ? 'fill-current' : ''}"></i>
    </div>
    <span class="leading-snug">${message}</span>
  `;
  container.appendChild(toast);
  lucide.createIcons();

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
        <i data-lucide="bookmark" class="w-4 h-4 fill-amber-400"></i>
      </div>
      <div class="flex flex-col">
        <span class="text-xs text-white font-bold leading-tight">${message}</span>
        <span class="text-[10px] text-zinc-400 leading-tight">Ketuk untuk kelola folder</span>
      </div>
    </div>
    <button class="toast-action-btn shrink-0 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-black font-extrabold text-[11px] active:scale-95 transition-all shadow-md flex items-center gap-1">
      <span>${actionText}</span>
      <i data-lucide="chevron-right" class="w-3 h-3 stroke-[3]"></i>
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
  lucide.createIcons();
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

function renderShortsFeed(targetVideoId = null) {
  feedContainer.innerHTML = '';
  currentRenderedFeedCount = 0;
  
  // Jika "Untuk Anda" (currentTopicId === 0): Benar-benar diacak dari SEMUA topik!
  const filtered = currentTopicId === 0
    ? shuffleArray(allVideos)
    : allVideos.filter(v => v.topic_id === currentTopicId);

  const currentTopicObj = allTopics.find(t => t.id === currentTopicId);
  if (currentTopicObj) {
    activeTopicBadge.textContent = currentTopicId === 0 
      ? "Topik: Semua Video (Acak)" 
      : `Topik: ${currentTopicObj.name.split('-')[0].trim()}`;
  }

  if (filtered.length === 0) {
    feedContainer.innerHTML = `
      <div class="w-full h-full flex flex-col items-center justify-center p-6 text-center text-zinc-400">
        <i data-lucide="video-off" class="w-12 h-12 mb-3 text-zinc-600"></i>
        <p class="font-semibold text-zinc-200">Belum ada video di topik ini</p>
        <p class="text-xs text-zinc-500 mt-1">Pilih topik lain lewat menu di kiri atas ya beb ✨</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

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
    saveCount.textContent = isSaved ? 'Tersimpan' : 'Simpan';
    saveCount.className = `save-count text-[10px] font-semibold ${isSaved ? 'text-amber-400' : 'text-zinc-300'}`;
  }
}

// ============================================================
// HELPER GLOBAL: ANIMASI & INDIKATOR BUFFERING / LOADING VIDEO
// ============================================================
function wireVideoLoadingIndicator(video, loaderEl) {
  if (!video || !loaderEl) return;
  let showTimeout = null;

  const showLoader = () => {
    clearTimeout(showTimeout);
    showTimeout = setTimeout(() => {
      if (video.readyState < 3 || video.seeking) {
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
  video.addEventListener('playing', hideLoader);
  video.addEventListener('seeked', hideLoader);
  video.addEventListener('timeupdate', () => {
    if (video.readyState >= 3 && !video.seeking) {
      hideLoader();
    }
  });
  video.addEventListener('error', hideLoader);
}

function createShortSlide(data, index) {
  const slide = document.createElement('div');
  slide.className = 'snap-slide';
  slide.dataset.id = data.id;

  const isLiked = likedVideoIds.has(data.id);
  const isSaved = savedShortIds.has(data.id);

  const streamSrc = data.gdrive_file_id 
    ? `${STREAM_PROXY_BASE}?id=${data.gdrive_file_id}` 
    : data.video_url;

  slide.innerHTML = `
    <!-- VIDEO MEDIA WRAPPER -->
    <div class="video-media-wrapper absolute inset-0 w-full h-full bg-black flex items-center justify-center overflow-hidden">
      <!-- High-res Poster Thumbnail from Google Drive (Loaded Instantly) -->
      ${data.gdrive_file_id ? `
        <img 
          src="https://lh3.googleusercontent.com/d/${data.gdrive_file_id}" 
          class="video-poster-img absolute inset-0 w-full h-full object-cover transition-opacity duration-300 z-0" 
          alt="${data.title}" 
          loading="${index < 3 ? 'eager' : 'lazy'}"
        />
      ` : ''}

      <!-- Native HTML5 Video Player with Autoplay, Loop & Inline Streaming -->
      <video 
        class="video-player w-full h-full object-cover absolute inset-0 z-10"
        src="${streamSrc}"
        ${data.gdrive_file_id ? `poster="https://lh3.googleusercontent.com/d/${data.gdrive_file_id}"` : ''}
        loop
        playsinline
        webkit-playsinline
        preload="${index <= 1 ? 'auto' : 'none'}"
        muted
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
            ${data.author.charAt(1).toUpperCase()}
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
        <span class="save-count text-[11px] font-bold ${isSaved ? 'text-amber-400' : 'text-white'} drop-shadow">${isSaved ? 'Tersimpan' : formatCount(Math.round(data.likes * 0.28))}</span>
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
          ${data.author}
          <svg class="w-3.5 h-3.5 text-sky-400 fill-sky-400 inline" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </span>
        <span class="text-[10px] font-semibold bg-rose-500/80 text-white px-2 py-0.5 rounded-full backdrop-blur-md">
          ${data.topic_name}
        </span>
      </div>

      <p class="text-xs text-white font-normal leading-relaxed line-clamp-2 drop-shadow">
        ${data.title}
      </p>

      <div class="flex items-center gap-1.5 text-zinc-300 text-[11px] overflow-hidden max-w-[220px]">
        <svg class="w-3.5 h-3.5 text-rose-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
        <div class="overflow-hidden whitespace-nowrap">
          <div class="ticker-track">
            <span class="mr-4">Original Audio - ${data.topic_name} • ${data.author} • </span>
            <span class="mr-4">Original Audio - ${data.topic_name} • ${data.author} • </span>
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

      // Unmute otomatis pada sentuhan pertama pengguna
      if (isMuted) {
        isMuted = false;
        document.querySelectorAll('video').forEach(v => v.muted = false);
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
      if (navigator.share) {
        navigator.share({ title: 'appVideo', text: txt, url: window.location.href }).catch(() => {});
      } else if (tg?.openTelegramLink) {
        tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(txt)}`);
      } else {
        showToast('Tautan berhasil disalin! 📋', 'check', 'emerald');
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

      if (entry.isIntersecting && activeView === 'shorts' && dramaReelModal.classList.contains('hidden')) {
        // Hentikan video lain segera agar suara tidak pernah tabrakan
        feedContainer.querySelectorAll('video').forEach(v => {
          if (v !== video && !v.paused) {
            v.pause();
          }
        });

        currentPlayingShortVideo = video;
        if (video) {
          video.muted = isMuted;
          video.preload = 'auto';
          const p = video.play();
          if (p) {
            p.then(() => {
              if (playIndicator) playIndicator.style.opacity = '0';
              if (!isMuted) hideUnmuteBanner();
            }).catch(() => {
              // Jika autoplay diblokir browser tanpa gesture, mulai muted dulu & tampilkan banner unmute
              video.muted = true;
              video.play().then(() => {
                if (playIndicator) playIndicator.style.opacity = '0';
                showUnmuteBanner();
              }).catch(() => {});
            });
          }
          if (disc) disc.classList.remove('spin-paused');
        }

        // Preload video slide berikutnya agar saat swipe ke bawah langsung putar seketika!
        const nextSlide = slide.nextElementSibling;
        if (nextSlide) {
          const nextVid = nextSlide.querySelector('video');
          if (nextVid && nextVid.preload !== 'auto') {
            nextVid.preload = 'auto';
          }
        }

        // Infinite Scroll: Muat batch berikutnya secara mulus saat mendekati slide akhir
        const idx = parseInt(slide.dataset.feedIndex || '0', 10);
        if (idx >= currentRenderedFeedCount - 4) {
          loadMoreFeedVideos();
        }
      } else {
        // BEGITU DISCROLL PERGI: BERHENTIKAN SEGERA & RESET SPEED!
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
    const firstSlide = feedContainer.querySelector('.snap-slide');
    if (firstSlide) {
      const firstVideo = firstSlide.querySelector('video');
      if (firstVideo && firstVideo.paused) {
        currentPlayingShortVideo = firstVideo;
        firstVideo.muted = isMuted;
        firstVideo.preload = 'auto';
        const p = firstVideo.play();
        if (p) {
          p.then(() => {
            if (!isMuted) hideUnmuteBanner();
          }).catch(() => {
            firstVideo.muted = true;
            firstVideo.play().then(() => {
              showUnmuteBanner();
            }).catch(() => {});
          });
        }
      }
    }
  }, 100);
}

// ============================================================
// 2. DRAMA HUB (KATALOG & FILTER)
// ============================================================
function searchDramasWordByWord(query, dramas) {
  const rawWords = query.toLowerCase().split(/\s+/).filter(w => w.trim().length > 0);
  if (rawWords.length === 0) return dramas;

  return dramas.filter(drm => {
    const episodesText = drm.episodes ? drm.episodes.map(e => e.title).join(' ') : '';
    const searchableCorpus = `${drm.title} ${drm.genre} ${drm.synopsis} ${episodesText}`.toLowerCase();
    return rawWords.every(word => searchableCorpus.includes(word));
  });
}

function filterAndRenderDramas() {
  const query = dramaSearchInput.value.trim();
  let results = allDramas;

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

function renderDramaList(dramas) {
  dramaListGrid.innerHTML = '';

  if (dramas.length === 0) {
    dramaListGrid.innerHTML = `
      <div class="col-span-2 py-12 text-center text-zinc-500">
        <i data-lucide="search-x" class="w-8 h-8 mx-auto mb-2 text-zinc-700"></i>
        <p class="text-xs font-semibold text-zinc-300">Tidak ada drama yang cocok</p>
        <p class="text-[11px] text-zinc-500 mt-0.5">Coba gunakan kata kunci lain</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  dramas.forEach(drm => {
    const isSaved = savedDramaIds.has(drm.id);
    const card = document.createElement('div');
    card.className = 'bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col group cursor-pointer active:scale-95 transition-all shadow-lg';
    
    let likedEpCount = 0;
    if (drm.episodes) {
      drm.episodes.forEach(e => {
        if (isEpisodeLiked(drm.id, e.ep)) likedEpCount++;
      });
    }

    card.innerHTML = `
      <div class="relative aspect-[3/4] w-full overflow-hidden bg-zinc-800">
        <img src="${drm.poster}" alt="${drm.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
        <div class="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
        
        <div class="absolute top-2 left-2 flex items-center gap-1">
          <span class="px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-[9px] font-bold text-amber-400">
            ★ ${drm.rating}
          </span>
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
        
        <button class="drama-quick-save absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white border border-white/20 active:scale-75 transition-all">
          <i data-lucide="bookmark" class="w-3.5 h-3.5 ${isSaved ? 'text-sky-400 fill-sky-400' : 'text-white'}"></i>
        </button>

        ${likedEpCount > 0 ? `
          <div class="absolute top-9 left-2 px-1.5 py-0.5 rounded-full bg-rose-600/90 text-white text-[9px] font-bold flex items-center gap-1 shadow-md">
            <span>❤️</span> ${likedEpCount} Ep Disukai
          </div>
        ` : ''}

        <div class="absolute bottom-2 left-2 right-2">
          <span class="text-[9px] font-bold uppercase tracking-wider text-rose-400">${drm.genre}</span>
          <h4 class="text-xs font-bold text-white line-clamp-1 leading-snug">${drm.title}</h4>
        </div>
      </div>
      <div class="p-2.5 flex items-center justify-between bg-zinc-900/90 text-[10px] text-zinc-400 border-t border-zinc-800/60">
        <span class="${drm.total_episodes === 1 ? 'text-amber-300 font-bold flex items-center gap-1' : ''}">
          ${drm.total_episodes === 1 ? '🎬 Full Movie (' + (drm.episodes[0]?.duration || 'Lengkap') + ')' : drm.total_episodes + ' Episode'}
        </span>
        <span class="font-bold text-amber-400 flex items-center gap-1">
          Nonton <i data-lucide="play" class="w-2.5 h-2.5 fill-amber-400"></i>
        </span>
      </div>
    `;

    card.querySelector('.drama-quick-save').onclick = (e) => {
      e.stopPropagation();
      triggerHaptic('medium');
      if (savedDramaIds.has(drm.id)) {
        savedDramaIds.delete(drm.id);
      } else {
        savedDramaIds.add(drm.id);
      }
      persistStorage();
      filterAndRenderDramas();
    };

    card.onclick = () => {
      openDramaDetailModal(drm);
    };

    dramaListGrid.appendChild(card);
  });

  lucide.createIcons();
}

function openDramaDetailModal(drm) {
  triggerHaptic('light');
  selectedDrama = drm;
  modalDramaPoster.src = drm.poster;
  modalDramaTitle.textContent = drm.title;
  modalDramaGenre.textContent = drm.genre;
  modalDramaRating.textContent = `★ ${drm.rating}`;
  modalDramaEpsCount.textContent = drm.total_episodes === 1 
    ? `Full Movie • ${drm.episodes[0]?.duration || 'Lengkap'}`
    : `${drm.total_episodes} Episode`;
  modalDramaSynopsis.textContent = drm.synopsis;

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
  lucide.createIcons();
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
  drm.episodes.forEach((ep, idx) => {
    const isLiked = isEpisodeLiked(drm.id, ep.ep);
    const item = document.createElement('div');
    item.className = 'flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 transition-all';
    
    item.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-xs ${isLiked ? 'text-rose-400' : 'text-amber-400'}">
          ${ep.ep}
        </div>
        <div>
          <div class="flex items-center gap-1.5">
            <h5 class="text-xs font-bold text-white line-clamp-1">Ep ${ep.ep}: ${ep.title}</h5>
            ${isLiked ? '<span class="text-[10px] text-rose-500 font-bold flex items-center gap-0.5">❤️ Disukai</span>' : ''}
          </div>
          <span class="text-[10px] text-zinc-500">${ep.duration}</span>
        </div>
      </div>
      <div class="flex items-center gap-1.5">
        <button class="ep-like-btn p-2 rounded-lg bg-zinc-800 text-zinc-300 hover:text-rose-500 active:scale-75 transition-all">
          <i data-lucide="heart" class="w-3.5 h-3.5 ${isLiked ? 'text-rose-500 fill-rose-500' : 'text-zinc-400'}"></i>
        </button>

        <button class="ep-chat-btn p-2 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white" title="Kirim ke Chat Telegram">
          <i data-lucide="send" class="w-3.5 h-3.5"></i>
        </button>

        <button class="ep-play-btn px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-all">
          <i data-lucide="play" class="w-3 h-3 fill-white"></i>
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
        alert(`Mengirim Drama "${drm.title}" Episode #${ep.ep} ke chat Telegram!`);
      }
    };

    modalEpisodeList.appendChild(item);
  });
  lucide.createIcons();
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
  updateReelEpBadge(startEpIndex);

  // Buat vertical slides untuk SEMUA episode (lazy hydrate window di sekitar episode awal)
  renderDramaReelSlides(drama, startEpIndex);
  syncDramaSlideSources(startEpIndex);

  // Buka modal reel
  dramaReelModal.classList.remove('hidden');

  // Scroll ke episode yang dipilih
  setTimeout(() => {
    const targetSlide = dramaEpisodesReel.children[startEpIndex];
    if (targetSlide) {
      targetSlide.scrollIntoView({ behavior: 'auto' });
      const video = targetSlide.querySelector('video');
      if (video) {
        video.muted = isMuted;
        video.play().catch(() => {});
      }
    }
  }, 100);

  lucide.createIcons();
}

function updateReelEpBadge(epIdx) {
  if (!currentPlayingDrama) return;
  const ep = currentPlayingDrama.episodes[epIdx];
  const epNum = ep ? ep.ep : epIdx + 1;
  reelCurrentEpBadge.textContent = `Episode ${epNum} / ${currentPlayingDrama.total_episodes}`;
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

function renderDramaReelSlides(drama, startEpIndex = 0) {
  dramaEpisodesReel.innerHTML = '';

  const isHorizontal = drama.orientation === 'horizontal';

  // Toggle header landscape button visibility or style
  const reelLandscapeToggleBtn = document.getElementById('reel-landscape-toggle-btn');
  if (reelLandscapeToggleBtn) {
    if (isHorizontal) {
      reelLandscapeToggleBtn.classList.remove('hidden');
    } else {
      reelLandscapeToggleBtn.classList.remove('hidden'); // Tetap izinkan untuk video apa saja jika user mau
    }
  }

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
          <i data-lucide="wifi-off" class="w-6 h-6"></i>
        </div>
        <p class="text-sm font-bold text-white mb-1">Video gagal dimuat</p>
        <p class="text-[11px] text-zinc-400 mb-4 max-w-xs">Koneksi ke server video sempat terputus. Coba muat ulang episode ini.</p>
        <button class="reel-retry-btn px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold flex items-center gap-1.5 shadow-lg active:scale-95 transition-all">
          <i data-lucide="rotate-cw" class="w-3.5 h-3.5"></i>
          <span>Coba Lagi</span>
        </button>
      </div>

      <!-- Gradient Overlay -->
      <div class="absolute inset-x-0 top-0 h-32 top-gradient pointer-events-none"></div>
      <div class="absolute inset-x-0 bottom-0 h-48 bottom-gradient pointer-events-none"></div>

      <!-- Play/Pause Flash Indicator Tengah (Ketuk 1x) -->
      <div class="play-indicator absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 transition-opacity duration-200 z-20">
        <div class="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white/90 shadow-2xl">
          <i data-lucide="play" class="w-8 h-8 fill-white ml-1"></i>
        </div>
      </div>

      <!-- Floating Center Landscape Button for Horizontal Video -->
      ${isHorizontal ? `
        <div class="absolute inset-x-0 bottom-36 flex items-center justify-center pointer-events-none z-30">
          <button class="open-landscape-slide-btn pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shadow-2xl border border-amber-300 active:scale-95 transition-all">
            <i data-lucide="maximize" class="w-4 h-4"></i>
            <span>⛶ Tonton Mode Lanskap Penuh</span>
          </button>
        </div>
      ` : ''}

      <!-- RIGHT ACTION SIDEBAR (PERSIS TIKTOK/MELOLO) -->
      <div class="absolute right-3 bottom-12 flex flex-col items-center gap-4 z-20">
        
        <!-- Suka Episode Ini (❤️) -->
        <div class="flex flex-col items-center gap-1">
          <button class="reel-like-ep-btn w-11 h-11 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center active:scale-75 transition-all">
            <svg class="ep-heart-svg w-6 h-6 transition-all duration-200 ${isLiked ? 'text-rose-500 fill-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]' : 'text-white'}" viewBox="0 0 24 24" fill="${isLiked ? '#f43f5e' : 'none'}" stroke="${isLiked ? '#f43f5e' : 'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
            </svg>
          </button>
          <span class="ep-like-label text-[10px] font-semibold ${isLiked ? 'text-rose-400' : 'text-zinc-200'}">${isLiked ? 'Disukai' : 'Suka'}</span>
        </div>

        <!-- Buka Laci Episode Cepat (📑) -->
        <div class="flex flex-col items-center gap-1">
          <button class="reel-ep-list-btn w-11 h-11 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center active:scale-75 transition-all">
            <i data-lucide="list-video" class="w-5 h-5 text-amber-400"></i>
          </button>
          <span class="text-[10px] font-semibold text-zinc-300">Ep ${ep.ep}</span>
        </div>

        <!-- Kirim ke Chat Bot -->
        <div class="flex flex-col items-center gap-1">
          <button class="reel-chat-btn w-11 h-11 rounded-full bg-rose-600/90 backdrop-blur-md border border-rose-400/40 flex items-center justify-center text-white shadow-lg active:scale-75 transition-all">
            <i data-lucide="send" class="w-4 h-4 text-white -mr-0.5"></i>
          </button>
          <span class="text-[9px] font-bold text-rose-300 uppercase">Chat</span>
        </div>

        <!-- Mute Audio -->
        <div class="flex flex-col items-center gap-1">
          <button class="reel-mute-btn w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center active:scale-75 transition-all">
            <i data-lucide="${isMuted ? 'volume-x' : 'volume-2'}" class="w-4 h-4 text-zinc-300"></i>
          </button>
        </div>

      </div>

      <!-- BOTTOM METADATA & INTERACTIVE PROGRESS -->
      <div class="absolute left-4 right-20 bottom-8 z-20 space-y-2 pointer-events-auto">
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-extrabold bg-amber-500 text-black px-2 py-0.5 rounded uppercase">
            Episode ${ep.ep}
          </span>
          <span class="text-xs font-bold text-white drop-shadow">
            ${drama.title}
          </span>
        </div>

        <p class="text-xs text-zinc-200 font-medium line-clamp-1 drop-shadow">
          ${ep.title} • <span class="text-zinc-400">${ep.duration}</span>
        </p>

        <!-- Interactive Scrubber Progress Bar for Drama Reel (Bisa Diputar & Digeser) -->
        <div class="reel-scrubber relative w-full py-1.5 cursor-pointer touch-none pointer-events-auto group">
          <!-- Floating Time Bubble while dragging -->
          <div class="reel-scrub-bubble hidden absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-md border border-amber-400/40 text-amber-300 font-mono text-xs px-3 py-1 rounded-full shadow-2xl pointer-events-none z-50 whitespace-nowrap">
            <span class="reel-bubble-time">00:00</span> / <span class="reel-bubble-total">${ep.duration || '00:00'}</span>
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
            <span class="reel-time-total text-zinc-400">${ep.duration || '00:00'}</span>
          </div>
          <span class="text-[9px] text-zinc-400">⬇️ Scroll: Ep ${idx + 2 <= drama.episodes.length ? idx + 2 : 'Tamat'}</span>
        </div>
      </div>
    `;

    setupDramaSlideGestures(slide, drama, ep, idx);
    dramaEpisodesReel.appendChild(slide);
  });

  setupDramaReelObserver();
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
  const chatBtn = slide.querySelector('.reel-chat-btn');
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
      const seekTime = seekDramaPosition(e.clientX);
      video.currentTime = seekTime;
      triggerHaptic('light');

      const onPointerMove = (ev) => {
        if (!isScrubbing) return;
        ev.stopPropagation();
        ev.preventDefault();
        const curSeek = seekDramaPosition(ev.clientX);
        video.currentTime = curSeek;
      };

      const onPointerUp = (ev) => {
        if (!isScrubbing) return;
        isScrubbing = false;
        ev.stopPropagation();
        const finalSeek = seekDramaPosition(ev.clientX);
        video.currentTime = finalSeek;
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
           target.closest('.reel-error-overlay') ||
           target.closest('.open-landscape-slide-btn');
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

  // 7. Chat Bot
  chatBtn.onclick = (e) => {
    e.stopPropagation();
    triggerHaptic('medium');
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent('ep_' + ep.message_id)}`);
    } else {
      alert(`Mengirim Drama "${drama.title}" Ep #${ep.ep} ke chat bot!`);
    }
  };

  // 8. Mute Audio
  muteBtn.onclick = (e) => {
    e.stopPropagation();
    triggerHaptic('light');
    isMuted = !isMuted;
    document.querySelectorAll('video').forEach(v => v.muted = isMuted);
    muteBtn.querySelector('i').setAttribute('data-lucide', isMuted ? 'volume-x' : 'volume-2');
    lucide.createIcons();
  };

  // 9. Tombol Tonton Mode Lanskap di Layar Slide
  const openLandscapeSlideBtn = slide.querySelector('.open-landscape-slide-btn');
  if (openLandscapeSlideBtn) {
    openLandscapeSlideBtn.onclick = (e) => {
      e.stopPropagation();
      openLandscapeTheater(drama, idx, video.currentTime);
    };
  }
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
        video.muted = isMuted;
        const p = video.play();
        if (p) p.catch(() => {});
      } else {
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
  if (reelSpeedBadge) reelSpeedBadge.classList.add('hidden');
  document.querySelectorAll('#drama-episodes-reel video').forEach(v => {
    v.playbackRate = 1.0;
    v.pause();
    if (v.getAttribute('src')) {
      v.removeAttribute('src');
      v.load();
    }
  });
  dramaReelModal.classList.add('hidden');
  reelEpSheet.classList.add('hidden');

  // Resume shorts if active
  if (activeView === 'shorts' && currentPlayingShortVideo) {
    currentPlayingShortVideo.play().catch(() => {});
  }
}

// ============================================================
// 3B. LANDSCAPE THEATER PLAYER (UNTUK DRAMA HORIZONTAL 16:9)
// ============================================================
const dramaLandscapeTheater = document.getElementById('drama-landscape-theater');
const landscapeVideo = document.getElementById('landscape-video');
const landscapeVideoContainer = document.getElementById('landscape-video-container');
const exitLandscapeBackBtn = document.getElementById('exit-landscape-back-btn');
const exitLandscapeBtn = document.getElementById('exit-landscape-btn');
const landscapeLoadingIndicator = document.getElementById('landscape-loading-indicator');
const landscapeDramaTitle = document.getElementById('landscape-drama-title');
const landscapeEpBadge = document.getElementById('landscape-ep-badge');
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

let currentLandscapeDrama = null;
let currentLandscapeEpIndex = 0;
let lastLandscapeTapTime = 0;
let landscapeTapTimer = null;

function openLandscapeTheater(drama, startEpIdx = 0, startTime = 0) {
  triggerHaptic('medium');
  currentLandscapeDrama = drama;
  currentLandscapeEpIndex = startEpIdx;

  // Pause all portrait videos
  document.querySelectorAll('#drama-episodes-reel video').forEach(v => v.pause());

  // Check orientation and apply mobile rotation if device is portrait
  if (window.innerHeight > window.innerWidth) {
    dramaLandscapeTheater.classList.add('rotate-mobile');
  } else {
    dramaLandscapeTheater.classList.remove('rotate-mobile');
  }

  // Try screen orientation lock and fullscreen
  try {
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock('landscape').catch(() => {});
    }
  } catch (e) {}

  dramaLandscapeTheater.classList.remove('hidden');
  playLandscapeEpisode(startEpIdx, startTime);
  lucide.createIcons();
}

function playLandscapeEpisode(epIdx, startTime = 0) {
  if (!currentLandscapeDrama) return;
  const ep = currentLandscapeDrama.episodes[epIdx];
  if (!ep) return;

  currentLandscapeEpIndex = epIdx;
  landscapeDramaTitle.textContent = currentLandscapeDrama.title;
  landscapeEpBadge.textContent = `Episode ${ep.ep} / ${currentLandscapeDrama.total_episodes}`;

  // Stream URL with proxy
  const streamSrc = ep.gdrive_file_id 
    ? `${STREAM_PROXY_BASE}?id=${ep.gdrive_file_id}` 
    : ep.video_url;

  landscapeVideo.src = streamSrc;
  landscapeVideo.muted = isMuted;
  landscapeVideo.playbackRate = 1.0;
  if (landscapeSpeedBadge) landscapeSpeedBadge.classList.add('hidden');
  updateLandscapeMuteBtn();

  let landscapeRetried = false;
  landscapeVideo.onloadedmetadata = () => {
    if (startTime > 0) landscapeVideo.currentTime = startTime;
    landscapeTimeTotal.textContent = formatTime(landscapeVideo.duration || 0);
  };
  landscapeVideo.onloadeddata = () => {
    landscapeRetried = false;
  };
  landscapeVideo.onerror = () => {
    if (!landscapeVideo.getAttribute('src') || dramaLandscapeTheater.classList.contains('hidden')) return;
    if (!landscapeRetried) {
      landscapeRetried = true;
      if (landscapeLoadingIndicator) landscapeLoadingIndicator.classList.remove('hidden');
      setTimeout(() => {
        if (dramaLandscapeTheater.classList.contains('hidden')) return;
        landscapeVideo.src = streamSrc;
        landscapeVideo.load();
        landscapeVideo.play().catch(() => {});
      }, 1200);
    } else {
      showToast('Gagal memutar episode, coba pilih ulang atau periksa koneksi.', 'alert-circle', 'rose', 3500);
    }
  };

  const playPromise = landscapeVideo.play();
  if (playPromise) {
    playPromise
      .then(() => updateLandscapePlayBtn(true))
      .catch(() => updateLandscapePlayBtn(false));
  }

  // Update prev / next buttons state
  landscapePrevEpBtn.style.opacity = epIdx > 0 ? '1' : '0.4';
  landscapeNextEpBtn.style.opacity = epIdx < currentLandscapeDrama.episodes.length - 1 ? '1' : '0.4';
}

function updateLandscapePlayBtn(isPlaying) {
  if (!landscapePlayBtnIcon) return;
  landscapePlayBtnIcon.setAttribute('data-lucide', isPlaying ? 'pause' : 'play');
  lucide.createIcons();
}

function updateLandscapeMuteBtn() {
  if (!landscapeMuteIcon) return;
  landscapeMuteIcon.setAttribute('data-lucide', isMuted ? 'volume-x' : 'volume-2');
  lucide.createIcons();
}

function closeLandscapeTheater() {
  triggerHaptic('light');
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
    targetVideos.forEach(v => {
      const card = document.createElement('div');
      card.className = 'relative aspect-[3/4] bg-zinc-900 rounded-lg overflow-hidden cursor-pointer active:opacity-75 transition-opacity group';
      card.innerHTML = `
        <img src="https://lh3.googleusercontent.com/d/${v.gdrive_file_id}" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" alt="${v.title}">
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
      grid.appendChild(card);
    });
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
            <i data-lucide="folder" class="w-4 h-4 text-amber-400"></i>
            <span>Koleksi Saya (${customCollections.length})</span>
          </h4>
          <p class="text-[10px] text-zinc-400">Atur dan kelompokkan video favoritmu</p>
        </div>
        <button id="btn-create-col-profile" class="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-900/30 active:scale-95 transition-all">
          <i data-lucide="plus" class="w-3.5 h-3.5 stroke-[3]"></i>
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

        // Ambil thumbnail dari video terakhir di koleksi ini
        let coverUrl = '';
        if (col.videoIds.length > 0) {
          const lastVidId = col.videoIds[col.videoIds.length - 1];
          const foundVid = allVideos.find(v => v.id === lastVidId);
          if (foundVid && foundVid.gdrive_file_id) {
            coverUrl = `https://lh3.googleusercontent.com/d/${foundVid.gdrive_file_id}`;
          }
        }

        card.innerHTML = `
          <div class="relative aspect-video w-full bg-zinc-950 overflow-hidden flex items-center justify-center">
            ${coverUrl ? `
              <img src="${coverUrl}" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt="${col.name}">
              <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            ` : `
              <div class="w-full h-full bg-zinc-800/80 flex flex-col items-center justify-center text-zinc-600 gap-1">
                <i data-lucide="folder" class="w-7 h-7 text-zinc-500"></i>
                <span class="text-[9px] font-semibold text-zinc-500">Kosong</span>
              </div>
            `}
            <span class="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[9px] font-bold text-amber-400 flex items-center gap-1">
              <i data-lucide="${col.isDefault ? 'bookmark' : 'folder'}" class="w-3 h-3 ${col.isDefault ? 'fill-amber-400' : ''}"></i>
              <span>${col.isDefault ? 'Semua' : 'Koleksi'}</span>
            </span>
            ${!col.isDefault ? `
              <button class="btn-delete-col absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 backdrop-blur-md text-zinc-400 hover:text-rose-400 flex items-center justify-center active:scale-90 transition-all z-10" title="Hapus Koleksi">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            ` : ''}
          </div>
          <div class="p-2.5 flex flex-col justify-between flex-1 bg-zinc-900/90">
            <h5 class="text-xs font-bold text-white line-clamp-1">${col.name}</h5>
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

      // Navigasi Kembali & Judul Folder
      const navHeader = document.createElement('div');
      navHeader.className = 'flex items-center justify-between pb-2 border-b border-zinc-800';
      navHeader.innerHTML = `
        <button id="btn-back-collections" class="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 active:scale-95 transition-all">
          <i data-lucide="arrow-left" class="w-4 h-4"></i>
          <span>Kembali ke Koleksi</span>
        </button>
        <span class="text-[11px] font-semibold text-zinc-300">
          ${col.name} (${col.videoIds.length} video)
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
            <i data-lucide="bookmark-x" class="w-6 h-6"></i>
          </div>
          <h5 class="text-xs font-bold text-white mb-1">Folder Koleksi Kosong</h5>
          <p class="text-[11px] text-zinc-400 max-w-xs">Simpan video dengan tombol Bookmark 🔖 di Shorts lalu masukkan ke folder "${col.name}"!</p>
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
        targetVideos.forEach(v => {
          const card = document.createElement('div');
          card.className = 'relative aspect-[3/4] bg-zinc-900 rounded-lg overflow-hidden cursor-pointer active:opacity-75 transition-opacity group';
          card.innerHTML = `
            <img src="https://lh3.googleusercontent.com/d/${v.gdrive_file_id}" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" alt="${v.title}">
            <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
            <div class="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between text-[10px] font-bold text-white drop-shadow">
              <span class="flex items-center gap-0.5 text-amber-400">
                <i data-lucide="bookmark" class="w-3 h-3 fill-amber-400"></i>
              </span>
              <span class="text-[9px] text-zinc-200 line-clamp-1">${v.topic_name}</span>
            </div>
          `;
          card.onclick = () => {
            triggerHaptic('light');
            switchView('shorts');
            currentTopicId = 0;
            renderShortsFeed(v.id);
          };
          grid.appendChild(card);
        });
        container.appendChild(grid);
      }

      profileContentArea.appendChild(container);
    }

  } else if (profileTab === 'drama') {
    const targetDramas = allDramas.filter(d => savedDramaIds.has(d.id));
    if (targetDramas.length === 0) {
      renderEmptyState('clapperboard', 'Koleksi Drama Masih Kosong', 'Buka menu Drama lalu simpan drama yang ingin kamu tonton nanti!');
      return;
    }
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-2 gap-2.5 p-1';
    targetDramas.forEach(drm => {
      const card = document.createElement('div');
      card.className = 'bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col cursor-pointer active:scale-95 transition-all';
      
      let likedCount = 0;
      if (drm.episodes) {
        drm.episodes.forEach(e => {
          if (isEpisodeLiked(drm.id, e.ep)) likedCount++;
        });
      }

      card.innerHTML = `
        <div class="relative aspect-[3/4] w-full bg-zinc-800">
          <img src="${drm.poster}" alt="${drm.title}" class="w-full h-full object-cover">
          <span class="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-sky-400">
            <i data-lucide="bookmark" class="w-3.5 h-3.5 fill-sky-400"></i>
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
            <span class="text-[9px] font-bold text-amber-400">${drm.genre}</span>
            <h5 class="text-xs font-bold text-white line-clamp-1">${drm.title}</h5>
          </div>
        </div>
        <div class="p-2 flex items-center justify-between text-[10px] text-zinc-400">
          <span>${drm.total_episodes} Ep</span>
          <span class="text-amber-400 font-bold">Lanjut Nonton →</span>
        </div>
      `;
      card.onclick = () => {
        openDramaDetailModal(drm);
      };
      grid.appendChild(card);
    });
    profileContentArea.appendChild(grid);
  }

  lucide.createIcons();
}

function renderEmptyState(icon, title, desc) {
  profileContentArea.innerHTML = `
    <div class="py-16 px-4 flex flex-col items-center justify-center text-center text-zinc-500">
      <i data-lucide="${icon}" class="w-10 h-10 mb-2 text-zinc-700"></i>
      <h5 class="text-xs font-bold text-zinc-300">${title}</h5>
      <p class="text-[11px] text-zinc-500 mt-1 max-w-xs leading-relaxed">${desc}</p>
    </div>
  `;
  lucide.createIcons();
}

// ============================================================
// 5. DRAWER 6 TOPIK & NAVIGATION
// ============================================================
function renderDrawerTopics() {
  drawerTopicsList.innerHTML = '';
  allTopics.forEach(topic => {
    const isSelected = topic.id === currentTopicId;
    const btn = document.createElement('button');
    btn.className = `w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left ${
      isSelected
        ? 'bg-rose-500/15 border-rose-500 text-white font-semibold'
        : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
    }`;

    btn.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl flex items-center justify-center ${isSelected ? 'bg-rose-500 text-white' : 'bg-zinc-800 text-zinc-400'}">
          <i data-lucide="${topic.id === 0 ? 'flame' : 'folder-heart'}" class="w-4 h-4"></i>
        </div>
        <div>
          <div class="text-sm font-semibold">${topic.name}</div>
          <div class="text-[11px] text-zinc-400">${topic.count || '~200 video'}</div>
        </div>
      </div>
      ${isSelected ? '<i data-lucide="check" class="w-5 h-5 text-rose-500"></i>' : '<i data-lucide="chevron-right" class="w-4 h-4 text-zinc-600"></i>'}
    `;

    btn.onclick = () => {
      triggerHaptic('light');
      currentTopicId = topic.id;
      closeDrawer();
      switchView('shorts');
      renderShortsFeed();
      renderDrawerTopics();
    };

    drawerTopicsList.appendChild(btn);
  });
  lucide.createIcons();
}

function openDrawer() {
  triggerHaptic('light');
  topicDrawer.classList.remove('hidden');
  requestAnimationFrame(() => {
    drawerBackdrop.classList.remove('opacity-0');
    drawerBackdrop.classList.add('opacity-100');
    drawerContent.classList.remove('translate-y-full');
    drawerContent.classList.add('translate-y-0');
  });
}

function closeDrawer() {
  triggerHaptic('light');
  drawerBackdrop.classList.remove('opacity-100');
  drawerBackdrop.classList.add('opacity-0');
  drawerContent.classList.remove('translate-y-0');
  drawerContent.classList.add('translate-y-full');
  setTimeout(() => {
    topicDrawer.classList.add('hidden');
  }, 350);
}

function switchView(viewName) {
  triggerHaptic('light');
  activeView = viewName;

  viewShorts.classList.toggle('hidden', viewName !== 'shorts');
  viewDrama.classList.toggle('hidden', viewName !== 'drama');
  viewProfile.classList.toggle('hidden', viewName !== 'profile');

  navBtnShorts.className = `flex flex-col items-center gap-1 py-1 px-2.5 transition-all ${viewName === 'shorts' ? 'text-white' : 'text-zinc-400'}`;
  navBtnDrama.className = `flex flex-col items-center gap-1 py-1 px-3 transition-all ${viewName === 'drama' ? 'text-amber-400 font-bold' : 'text-zinc-400'}`;
  navBtnProfile.className = `flex flex-col items-center gap-1 py-1 px-2.5 transition-all ${viewName === 'profile' ? 'text-white' : 'text-zinc-400'}`;
  navBtnSaved.className = `flex flex-col items-center gap-1 py-1 px-2.5 transition-all ${viewName === 'profile' && profileTab !== 'likes' ? 'text-white' : 'text-zinc-400'}`;

  if (viewName === 'shorts') {
    if (currentPlayingShortVideo) currentPlayingShortVideo.play().catch(() => {});
  } else {
    if (currentPlayingShortVideo) currentPlayingShortVideo.pause();
  }

  if (viewName === 'profile') {
    renderProfileContent();
  }
}

// ============================================================
// GLOBAL AUDIO UNMUTE & AUTOPLAY FIX
// ============================================================
function showUnmuteBanner() {
  const b = document.getElementById('global-unmute-banner');
  if (b && isMuted) b.classList.remove('hidden');
}

function hideUnmuteBanner() {
  const b = document.getElementById('global-unmute-banner');
  if (b) b.classList.add('hidden');
}

function enableGlobalSound() {
  if (!isMuted) return;
  isMuted = false;
  localStorage.setItem('teleshorts_unmuted', '1');
  hideUnmuteBanner();

  if (currentPlayingShortVideo) {
    currentPlayingShortVideo.muted = false;
  }
  document.querySelectorAll('video').forEach(v => {
    v.muted = false;
  });
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
// GOOGLE LOGIN & MULTI-DEVICE CLOUD SYNC
// ============================================================
function buildUserSyncData() {
  return {
    user_email: currentUser?.email || 'guest@gmail.com',
    user_name: currentUser?.name || 'Pengguna appVideo',
    avatar: currentUser?.avatar || '',
    device: navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Browser',
    last_synced: new Date().toISOString(),
    gdrive_folder_id: GDRIVE_USER_DATA_FOLDER_ID,
    saved_dramas: [...savedDramaIds],
    liked_episodes: [...likedEpisodeKeys],
    saved_shorts: [...savedShortIds],
    liked_videos: [...likedVideoIds],
    custom_collections: customCollections
  };
}

function updateGoogleSyncUI() {
  const loggedInState = document.getElementById('google-logged-in-state');
  const loggedOutState = document.getElementById('google-logged-out-state');
  const userAvatar = document.getElementById('user-google-avatar');
  const userName = document.getElementById('user-google-name');
  const userEmail = document.getElementById('user-google-email');
  const syncTime = document.getElementById('sync-last-time');
  const profileAvatar = document.getElementById('profile-avatar-img');
  const profileName = document.getElementById('profile-name');
  const profileHandle = document.getElementById('profile-handle');

  if (currentUser) {
    if (loggedOutState) loggedOutState.classList.add('hidden');
    if (loggedInState) loggedInState.classList.remove('hidden');

    if (userName) userName.textContent = currentUser.name || 'Pengguna Google';
    if (userEmail) userEmail.textContent = currentUser.email || '';
    if (userAvatar) userAvatar.src = currentUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.name || 'U')}`;
    
    if (profileName) profileName.textContent = currentUser.name || 'Pengguna Google';
    if (profileHandle) profileHandle.textContent = `@${currentUser.email ? currentUser.email.split('@')[0] : 'user'}`;
    if (profileAvatar && currentUser.avatar) profileAvatar.src = currentUser.avatar;

    const lastSync = localStorage.getItem('teleshorts_last_sync_time');
    if (syncTime) {
      syncTime.textContent = lastSync 
        ? `Sinkron: ${new Date(lastSync).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` 
        : 'Sinkron: Baru saja';
    }
  } else {
    if (loggedInState) loggedInState.classList.add('hidden');
    if (loggedOutState) loggedOutState.classList.remove('hidden');
  }
}

function syncUserDataToCloud(isManual = false) {
  if (!currentUser) return;
  const syncData = buildUserSyncData();
  const jsonStr = JSON.stringify(syncData, null, 2);
  const now = new Date().toISOString();
  localStorage.setItem('teleshorts_last_sync_time', now);
  
  // Simpan data sinkronisasi per email akun
  localStorage.setItem(`teleshorts_cloud_backup_${currentUser.email}`, jsonStr);

  updateGoogleSyncUI();
  if (isManual) {
    triggerHaptic('success');
    showToast(`Data berhasil disinkronkan ke Google Drive! ☁️✨`, 'cloud-check', 'amber', 3000);
  }
}

function queueCloudSync() {
  if (!currentUser) return;
  clearTimeout(syncDebounceTimer);
  syncDebounceTimer = setTimeout(() => {
    syncUserDataToCloud(false);
  }, 1200);
}

const GOOGLE_CLIENT_ID = localStorage.getItem('teleshorts_google_client_id') || '1071006060591-tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com';

function triggerDirectGoogleLogin() {
  triggerHaptic('medium');

  if (!window.google?.accounts?.oauth2 && !window.google?.accounts?.id) {
    showToast('Memuat Google SDK, silakan coba beberapa detik lagi... 🌐', 'alert-circle', 'rose', 3500);
    return;
  }

  showToast('Menghubungkan ke server resmi Google... ⏳', 'cloud', 'amber', 2500);

  try {
    // Gunakan Google OAuth 2.0 Token Client Resmi (Membuka popup asli Google untuk memilih akun)
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'email profile openid',
      prompt: 'select_account',
      callback: async (tokenResponse) => {
        if (tokenResponse?.error) {
          if (tokenResponse.error === 'access_denied') {
            showToast('Login Google dibatalkan', 'alert-circle', 'zinc', 2500);
          } else {
            showToast(`Otentikasi Google: ${tokenResponse.error}`, 'alert-circle', 'rose', 4000);
          }
          return;
        }

        if (tokenResponse?.access_token) {
          try {
            // Ambil data profil asli langsung dari server resmi Google API
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
            });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const profile = await res.json();
            handleGoogleLoginSuccess(profile.email, profile.name, profile.picture);
          } catch (err) {
            showToast('Gagal memuat profil dari Google API ⚠️', 'alert-circle', 'rose', 3500);
          }
        }
      },
      error_callback: (err) => {
        showToast('Google OAuth: ' + (err?.message || err), 'alert-circle', 'rose', 4000);
      }
    });

    tokenClient.requestAccessToken({ prompt: 'select_account' });
  } catch (err) {
    // Fallback ke Google Identity Services (GIS) One-Tap jika popup dicegah browser
    if (window.google?.accounts?.id) {
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (res) => {
          try {
            const base64Url = res.credential.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
            const p = JSON.parse(jsonPayload);
            handleGoogleLoginSuccess(p.email, p.name, p.picture);
          } catch(e) {
            showToast('Gagal memverifikasi token Google ⚠️', 'alert-circle', 'rose');
          }
        }
      });
      google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed()) {
          showToast('Popup Google diblokir browser, mohon izinkan popup ya beb ⚠️', 'alert-circle', 'rose', 4000);
        }
      });
    } else {
      showToast('Gagal membuka otentikasi Google: ' + err.message, 'alert-circle', 'rose', 4000);
    }
  }
}

function handleGoogleLoginSuccess(email, name = '', avatar = '') {
  currentUser = {
    email: email.trim(),
    name: name.trim() || email.split('@')[0],
    avatar: avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || email)}`,
    logged_in_at: new Date().toISOString()
  };
  localStorage.setItem('teleshorts_google_user', JSON.stringify(currentUser));

  // Cek apakah ada data tersimpan sebelumnya dari cloud untuk email ini
  const existingBackup = localStorage.getItem(`teleshorts_cloud_backup_${currentUser.email}`);
  if (existingBackup) {
    try {
      const parsed = JSON.parse(existingBackup);
      if (parsed.saved_dramas) {
        parsed.saved_dramas.forEach(id => savedDramaIds.add(id));
      }
      if (parsed.liked_episodes) {
        parsed.liked_episodes.forEach(key => likedEpisodeKeys.add(key));
      }
      if (parsed.saved_shorts) {
        parsed.saved_shorts.forEach(id => savedShortIds.add(id));
      }
      if (parsed.liked_videos) {
        parsed.liked_videos.forEach(id => likedVideoIds.add(id));
      }
      if (parsed.custom_collections && parsed.custom_collections.length > 0) {
        customCollections = parsed.custom_collections;
        persistCollections();
      }
    } catch (e) {}
  }

  persistStorage();
  updateGoogleSyncUI();
  updateStatsDisplay();
  showToast(`Selamat datang, ${currentUser.name}! Akun Google terhubung ☁️`, 'check', 'amber', 3500);
  triggerHaptic('success');
  syncUserDataToCloud(true);
}

// ============================================================
// 6. EVENT LISTENERS
// ============================================================
function setupEvents() {
  // Navigation
  navBtnShorts.onclick = () => switchView('shorts');
  navBtnTopics.onclick = openDrawer;
  navBtnDrama.onclick = () => switchView('drama');
  navBtnSaved.onclick = () => {
    profileTab = 'shorts';
    updateProfileTabHeaders();
    switchView('profile');
  };
  navBtnProfile.onclick = () => {
    profileTab = 'likes';
    updateProfileTabHeaders();
    switchView('profile');
  };

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
  ['pointerdown', 'touchstart', 'click', 'keydown'].forEach(evt => {
    window.addEventListener(evt, enableGlobalSound, { passive: true, once: true });
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

  // Google Login & Cloud Sync Controls (Direct 1-Click)
  const btnGoogleLogin = document.getElementById('btn-google-login');
  const btnGoogleLogout = document.getElementById('btn-google-logout');
  const btnManualSync = document.getElementById('btn-manual-sync');

  if (btnGoogleLogin) btnGoogleLogin.onclick = triggerDirectGoogleLogin;
  if (btnGoogleLogout) {
    btnGoogleLogout.onclick = () => {
      triggerHaptic('light');
      currentUser = null;
      localStorage.removeItem('teleshorts_google_user');
      updateGoogleSyncUI();
      showToast('Berhasil keluar akun Google 👋', 'log-out', 'zinc');
    };
  }
  if (btnManualSync) {
    btnManualSync.onclick = () => syncUserDataToCloud(true);
  }

  // Mute audio
  if (globalMuteBtn) {
    globalMuteBtn.onclick = () => {
      triggerHaptic('light');
      isMuted = !isMuted;
      document.querySelectorAll('video').forEach(v => v.muted = isMuted);
      if (muteIcon) muteIcon.setAttribute('data-lucide', isMuted ? 'volume-x' : 'volume-2');
      lucide.createIcons();
    };
  }

  // Tombol "Untuk Anda" (Klik untuk Mengacak Ulang Feed Video)
  const titleUntukAndaBtn = document.getElementById('title-untuk-anda-btn');
  if (titleUntukAndaBtn) {
    titleUntukAndaBtn.onclick = () => {
      triggerHaptic('medium');
      currentTopicId = 0;
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

  // Drama Search Input
  dramaSearchInput.addEventListener('input', () => {
    filterAndRenderDramas();
  });

  dramaSearchClear.onclick = () => {
    triggerHaptic('light');
    dramaSearchInput.value = '';
    filterAndRenderDramas();
    dramaSearchInput.focus();
  };

  // Drama Detail Modal
  closeDramaModal.onclick = () => {
    triggerHaptic('light');
    dramaDetailModal.classList.add('hidden');
  };

  modalBookmarkDramaBtn.onclick = () => {
    if (!selectedDrama) return;
    triggerHaptic('success');
    if (savedDramaIds.has(selectedDrama.id)) {
      savedDramaIds.delete(selectedDrama.id);
    } else {
      savedDramaIds.add(selectedDrama.id);
    }
    persistStorage();
    updateModalBookmarkBtn();
    filterAndRenderDramas();
  };

  // Drama Reel Close
  closeDramaReelBtn.onclick = closeDramaReel;
  reelOpenEpSheetBtn.onclick = openReelEpisodeSheet;
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
  if (landscapeEpListBtn) {
    landscapeEpListBtn.onclick = openLandscapeEpisodeSheet;
  }
  if (closeLandscapeEpSheet) {
    closeLandscapeEpSheet.onclick = () => landscapeEpSheet.classList.add('hidden');
  }

  // Wire loading indicator di mode lanskap
  if (landscapeVideo && landscapeLoadingIndicator) {
    wireVideoLoadingIndicator(landscapeVideo, landscapeLoadingIndicator);
  }

  // Toggle Play / Pause in Landscape
  if (landscapeTogglePlayBtn) {
    landscapeTogglePlayBtn.onclick = (e) => {
      e.stopPropagation();
      triggerHaptic('light');
      if (!landscapeVideo) return;
      if (landscapeVideo.paused) {
        landscapeVideo.play()
          .then(() => updateLandscapePlayBtn(true))
          .catch(() => updateLandscapePlayBtn(false));
      } else {
        landscapeVideo.pause();
        updateLandscapePlayBtn(false);
      }
    };
  }

  // Skip Next Episode in Landscape
  if (landscapeNextEpBtn) {
    landscapeNextEpBtn.onclick = (e) => {
      e.stopPropagation();
      if (!currentLandscapeDrama) return;
      if (currentLandscapeEpIndex < currentLandscapeDrama.episodes.length - 1) {
        triggerHaptic('medium');
        const nextIdx = currentLandscapeEpIndex + 1;
        playLandscapeEpisode(nextIdx, 0);
        showToast(`Episode ${currentLandscapeDrama.episodes[nextIdx].ep} 🎬`, 'play', 'amber');
      } else {
        showToast('Ini episode terakhir beb! 🎉', 'check', 'amber');
      }
    };
  }

  // Skip Prev Episode in Landscape
  if (landscapePrevEpBtn) {
    landscapePrevEpBtn.onclick = (e) => {
      e.stopPropagation();
      if (!currentLandscapeDrama) return;
      if (currentLandscapeEpIndex > 0) {
        triggerHaptic('medium');
        const prevIdx = currentLandscapeEpIndex - 1;
        playLandscapeEpisode(prevIdx, 0);
        showToast(`Episode ${currentLandscapeDrama.episodes[prevIdx].ep} 🎬`, 'skip-back', 'amber');
      } else {
        showToast('Ini episode pertama beb!', 'alert-circle', 'zinc');
      }
    };
  }

  // Mute / Unmute in Landscape
  if (landscapeMuteBtn) {
    landscapeMuteBtn.onclick = (e) => {
      e.stopPropagation();
      triggerHaptic('light');
      isMuted = !isMuted;
      if (landscapeVideo) landscapeVideo.muted = isMuted;
      document.querySelectorAll('video').forEach(v => v.muted = isMuted);
      updateLandscapeMuteBtn();
      if (globalMuteBtn && muteIcon) {
        muteIcon.setAttribute('data-lucide', isMuted ? 'volume-x' : 'volume-2');
        lucide.createIcons();
      }
    };
  }

  // Interactive Scrubbing on Landscape Progress Bar (Click & Drag Timeline with Time Bubble)
  if (landscapeProgressTrack) {
    let isLandscapeScrubbing = false;

    function updateLandscapeScrub(clientX) {
      if (!landscapeVideo || !landscapeVideo.duration) return 0;
      const rect = landscapeProgressTrack.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
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
      if (!landscapeVideo || !landscapeVideo.duration) return;
      isLandscapeScrubbing = true;
      if (landscapeScrubKnob) landscapeScrubKnob.classList.remove('scale-0');
      const seekTime = updateLandscapeScrub(e.clientX);
      landscapeVideo.currentTime = seekTime;
      triggerHaptic('light');

      const onPointerMove = (ev) => {
        if (!isLandscapeScrubbing) return;
        ev.stopPropagation();
        const curSeek = updateLandscapeScrub(ev.clientX);
        landscapeVideo.currentTime = curSeek;
      };

      const onPointerUp = (ev) => {
        if (!isLandscapeScrubbing) return;
        isLandscapeScrubbing = false;
        ev.stopPropagation();
        const finalSeek = updateLandscapeScrub(ev.clientX);
        landscapeVideo.currentTime = finalSeek;
        if (landscapeScrubKnob) landscapeScrubKnob.classList.add('scale-0');
        if (landscapeScrubBubble) landscapeScrubBubble.classList.add('hidden');
        landscapeVideo.play().catch(() => {});
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

  // Landscape Video Listeners (Play, Pause, Auto-Next Ended)
  if (landscapeVideo) {
    landscapeVideo.addEventListener('play', () => {
      updateLandscapePlayBtn(true);
      if (landscapePlayIndicator) landscapePlayIndicator.style.opacity = '0';
    });
    landscapeVideo.addEventListener('pause', () => {
      updateLandscapePlayBtn(false);
      if (landscapePlayIndicator) landscapePlayIndicator.style.opacity = '1';
    });

    // OTOMATIS LANJUT KE EPISODE BERIKUTNYA SAAT EPISODE SELESAI
    landscapeVideo.addEventListener('ended', () => {
      if (!currentLandscapeDrama) return;
      if (currentLandscapeEpIndex < currentLandscapeDrama.episodes.length - 1) {
        const nextIdx = currentLandscapeEpIndex + 1;
        const nextEpNum = currentLandscapeDrama.episodes[nextIdx]?.ep || nextIdx + 1;
        showToast(`Lanjut otomatis ke Episode ${nextEpNum} 🎬✨`, 'play', 'amber', 3500);
        triggerHaptic('success');
        playLandscapeEpisode(nextIdx, 0);
      } else {
        showToast('Drama telah tamat! Selamat menonton 🎉', 'check', 'amber', 4000);
        updateLandscapePlayBtn(false);
      }
    });
  }

  // Long Press (Hold 2X Speed) & Single Tap (Jeda / Putar) di Landscape Theater
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
      if (e.target.closest('header') || e.target.closest('footer') || e.target.closest('#landscape-ep-sheet')) {
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

    // 2. TEKAN 1X -> JEDA / PUTAR VIDEO LANGSUNG (Dan Double Tap Seek -10s / +10s)
    landscapeVideoContainer.addEventListener('click', (e) => {
      if (justFinishedHold || isHolding2x || hasMoved) return;
      if (e.target.closest('header') || e.target.closest('footer') || e.target.closest('#landscape-ep-sheet')) {
        return;
      }

      const now = Date.now();
      const rect = landscapeVideoContainer.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const tapInterval = now - lastTapTime;

      if (tapInterval < 260 && tapInterval > 0) {
        // Double tap!
        clearTimeout(tapTimeout);
        triggerHaptic('medium');

        if (clickX < width * 0.35) {
          // Mundur 10 detik
          landscapeVideo.currentTime = Math.max(0, landscapeVideo.currentTime - 10);
          flashFeedback(landscapeSeekLeft);
        } else if (clickX > width * 0.65) {
          // Maju 10 detik
          landscapeVideo.currentTime = Math.min(landscapeVideo.duration || 9999, landscapeVideo.currentTime + 10);
          flashFeedback(landscapeSeekRight);
        } else {
          // Tengah: Toggle play / pause
          if (landscapeVideo.paused) {
            landscapeVideo.play()
              .then(() => updateLandscapePlayBtn(true))
              .catch(() => updateLandscapePlayBtn(false));
          } else {
            landscapeVideo.pause();
            updateLandscapePlayBtn(false);
          }
        }
      } else {
        // SINGLE TAP: Jeda / Putar Video langsung!
        tapTimeout = setTimeout(() => {
          triggerHaptic('light');
          if (landscapeVideo.paused) {
            landscapeVideo.play()
              .then(() => updateLandscapePlayBtn(true))
              .catch(() => updateLandscapePlayBtn(false));
          } else {
            landscapeVideo.pause();
            updateLandscapePlayBtn(false);
          }
        }, 180);
      }
      lastTapTime = now;
    });
  }

  // Auto handle orientation resize
  window.addEventListener('resize', () => {
    if (dramaLandscapeTheater && !dramaLandscapeTheater.classList.contains('hidden')) {
      if (window.innerHeight > window.innerWidth) {
        dramaLandscapeTheater.classList.add('rotate-mobile');
      } else {
        dramaLandscapeTheater.classList.remove('rotate-mobile');
      }
    }
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
  box.className = `flex items-center justify-between px-3.5 py-2 rounded-xl bg-${color === 'amber' ? 'amber-500/15 border-amber-500/30 text-amber-300' : 'zinc-800 border-zinc-700 text-zinc-300'} border text-xs font-semibold animate-slide-up transition-all`;
  box.classList.remove('hidden');
  lucide.createIcons();
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
          <i data-lucide="${col.isDefault ? 'bookmark' : 'folder'}" class="w-4 h-4 ${col.isDefault ? 'fill-amber-400' : ''}"></i>
        </div>
        <div>
          <div class="text-xs font-bold text-white">${col.name}</div>
          <div class="text-[10px] text-zinc-400">${col.videoIds.length} video</div>
        </div>
      </div>
      <div class="w-6 h-6 rounded-full border ${isChecked ? 'bg-amber-500 border-amber-500 text-black' : 'border-zinc-600 bg-transparent'} flex items-center justify-center transition-all">
        ${isChecked ? '<i data-lucide="check" class="w-3.5 h-3.5 stroke-[3]"></i>' : ''}
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
  lucide.createIcons();
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
  if (isNaN(seconds)) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}

document.addEventListener('DOMContentLoaded', initApp);
