// ============================================================
// STATE & LOCAL STORAGE PERSISTENCE
// ============================================================
let allVideos = [];
let allTopics = [];
let allDramas = [];
let currentTopicId = 0;
let isMuted = true;
let activeView = 'shorts'; // 'shorts' | 'drama' | 'profile'
let profileTab = 'likes';   // 'likes' | 'shorts' | 'drama'

let currentPlayingShortVideo = null;
let shortsObserver = null;

let selectedDrama = null;
let currentPlayingDrama = null;
let currentReelEpisodeIndex = 0;
let dramaReelObserver = null;
let currentGenreFilter = 'all';

// Sets in LocalStorage
let likedVideoIds = new Set(JSON.parse(localStorage.getItem('teleshorts_likes') || '[]'));
let savedShortIds = new Set(JSON.parse(localStorage.getItem('teleshorts_saved_shorts') || '[]'));
let savedDramaIds = new Set(JSON.parse(localStorage.getItem('teleshorts_saved_dramas') || '[]'));

// Melolo-style per-episode like storage: Set of "dramaId_ep_X" (e.g. "drm_1_ep_1")
let likedEpisodeKeys = new Set(JSON.parse(localStorage.getItem('teleshorts_liked_episodes') || '[]'));

function persistStorage() {
  localStorage.setItem('teleshorts_likes', JSON.stringify([...likedVideoIds]));
  localStorage.setItem('teleshorts_saved_shorts', JSON.stringify([...savedShortIds]));
  localStorage.setItem('teleshorts_saved_dramas', JSON.stringify([...savedDramaIds]));
  localStorage.setItem('teleshorts_liked_episodes', JSON.stringify([...likedEpisodeKeys]));
  updateStatsDisplay();
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
    heartIconEl.classList.toggle('text-rose-500', isNowLiked);
    heartIconEl.classList.toggle('fill-rose-500', isNowLiked);
    heartIconEl.classList.toggle('text-white', !isNowLiked);
  }
  if (labelEl) {
    labelEl.textContent = isNowLiked ? 'Disukai' : 'Suka';
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
  dramas: [
    {
      id: "drm_1",
      title: "Cinta di Balik Hujan",
      genre: "Romantis",
      rating: "4.9",
      total_episodes: 16,
      poster: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80",
      synopsis: "Dua insan yang tak sengaja berteduh di kafe tua saat hujan deras, memulai kisah cinta manis yang penuh misteri masa lalu.",
      episodes: [
        { ep: 1, title: "Payung Biru di Halte", duration: "18 Menit", video_url: "https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-sparkler-at-night-42898-large.mp4", message_id: 501 },
        { ep: 2, title: "Secangkir Kopi Hangat", duration: "20 Menit", video_url: "https://assets.mixkit.co/videos/preview/mixkit-vertical-view-of-trees-under-a-sunny-sky-41485-large.mp4", message_id: 502 },
        { ep: 3, title: "Janji di Bawah Pohon", duration: "19 Menit", video_url: "https://assets.mixkit.co/videos/preview/mixkit-going-down-a-curved-highway-down-a-mountain-41576-large.mp4", message_id: 503 },
        { ep: 4, title: "Surat Tanpa Nama", duration: "21 Menit", video_url: "https://assets.mixkit.co/videos/preview/mixkit-waves-coming-to-the-beach-5016-large.mp4", message_id: 504 }
      ]
    },
    {
      id: "drm_2",
      title: "Misteri Jam Ke-12",
      genre: "Thriller / Aksi",
      rating: "4.8",
      total_episodes: 12,
      poster: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=80",
      synopsis: "Seorang detektif muda menemukan pesan rahasia yang tersembunyi di dalam jam antik setiap tengah malam.",
      episodes: [
        { ep: 1, title: "Detik yang Hilang", duration: "22 Menit", video_url: "https://assets.mixkit.co/videos/preview/mixkit-going-down-a-curved-highway-down-a-mountain-41576-large.mp4", message_id: 505 },
        { ep: 2, title: "Jejak Kaki Basah", duration: "25 Menit", video_url: "https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-sparkler-at-night-42898-large.mp4", message_id: 506 }
      ]
    },
    {
      id: "drm_3",
      title: "Takdir CEO Dingin",
      genre: "Drama Populer",
      rating: "4.95",
      total_episodes: 24,
      poster: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=500&auto=format&fit=crop&q=80",
      synopsis: "CEO perfeksionis yang tidak pernah tersenyum tiba-tiba harus bekerja sama dengan magang ceria yang mengubah dunianya.",
      episodes: [
        { ep: 1, title: "Hari Pertama Wawancara", duration: "15 Menit", video_url: "https://assets.mixkit.co/videos/preview/mixkit-vertical-view-of-trees-under-a-sunny-sky-41485-large.mp4", message_id: 507 },
        { ep: 2, title: "Kopi yang Tumpah", duration: "17 Menit", video_url: "https://assets.mixkit.co/videos/preview/mixkit-waves-coming-to-the-beach-5016-large.mp4", message_id: 508 }
      ]
    },
    {
      id: "drm_4",
      title: "Rembulan Mahameru",
      genre: "Petualangan",
      rating: "4.7",
      total_episodes: 8,
      poster: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=500&auto=format&fit=crop&q=80",
      synopsis: "Ekspedisi persahabatan 5 anak muda mendaki gunung tertinggi demi mengantarkan surat terakhir sahabat mereka.",
      episodes: [
        { ep: 1, title: "Ransel dan Sepatu Usang", duration: "24 Menit", video_url: "https://assets.mixkit.co/videos/preview/mixkit-stars-in-the-night-sky-40432-large.mp4", message_id: 509 }
      ]
    }
  ]
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
  try {
    const res = await fetch('videos.json');
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
  persistStorage();

  renderDrawerTopics();
  renderShortsFeed();
  filterAndRenderDramas();
  renderProfileContent();
  setupEvents();
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

// Toast notification helper ala TikTok
function showToast(message, iconName = 'sparkles', color = 'rose') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed top-14 inset-x-0 z-50 flex flex-col items-center pointer-events-none gap-2 px-4';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = 'tiktok-toast flex items-center gap-2 px-4 py-2.5 rounded-full bg-zinc-900/95 backdrop-blur-md border border-white/20 text-xs font-semibold text-white shadow-2xl';
  toast.innerHTML = `
    <i data-lucide="${iconName}" class="w-4 h-4 text-${color}-400 shrink-0"></i>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  lucide.createIcons();
  setTimeout(() => toast.remove(), 1800);
}

// ============================================================
// 1. SHORTS FEED & PLAYER (BERANDA)
// ============================================================
function renderShortsFeed(targetVideoId = null) {
  feedContainer.innerHTML = '';
  
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

  filtered.forEach((videoData, index) => {
    const slide = createShortSlide(videoData, index);
    feedContainer.appendChild(slide);
  });

  lucide.createIcons();
  setupShortsObserver();

  if (targetVideoId) {
    const targetSlide = feedContainer.querySelector(`[data-id="${targetVideoId}"]`);
    if (targetSlide) {
      targetSlide.scrollIntoView({ behavior: 'smooth' });
      return;
    }
  }
  feedContainer.scrollTop = 0;
}

function createShortSlide(data, index) {
  const slide = document.createElement('div');
  slide.className = 'snap-slide';
  slide.dataset.id = data.id;

  const isLiked = likedVideoIds.has(data.id);
  const isSaved = savedShortIds.has(data.id);

  slide.innerHTML = `
    <!-- VIDEO MEDIA WRAPPER -->
    <div class="video-media-wrapper absolute inset-0 w-full h-full bg-black flex items-center justify-center overflow-hidden">
      <!-- High-res Poster Thumbnail from Google Drive (Loaded Instantly) -->
      ${data.gdrive_file_id ? `
        <img 
          src="https://lh3.googleusercontent.com/d/${data.gdrive_file_id}" 
          class="video-poster-img absolute inset-0 w-full h-full object-cover transition-opacity duration-300" 
          alt="${data.title}" 
          loading="${index < 3 ? 'eager' : 'lazy'}"
        />
      ` : ''}

      <!-- Native HTML5 Video Player with Autoplay & Loop -->
      <video 
        class="video-player w-full h-full object-cover absolute inset-0 z-10"
        src="${data.video_url}"
        ${data.gdrive_file_id ? `poster="https://lh3.googleusercontent.com/d/${data.gdrive_file_id}"` : ''}
        loop
        playsinline
        webkit-playsinline
        preload="${index <= 1 ? 'auto' : 'metadata'}"
        ${isMuted ? 'muted' : ''}
      ></video>
    </div>

    <!-- TOUCH DETECTOR GESTURE LAYER (Z-20: TIKTOK DOUBLE-TAP LIKE & SINGLE-TAP PLAY/PAUSE) -->
    <div class="touch-gesture-layer absolute inset-0 z-20 pointer-events-auto"></div>

    <!-- GRADIENTS OVERLAY -->
    <div class="absolute inset-x-0 top-0 h-32 top-gradient pointer-events-none z-20"></div>
    <div class="absolute inset-x-0 bottom-0 h-48 bottom-gradient pointer-events-none z-20"></div>

    <!-- PLAY/PAUSE FLASH INDICATOR -->
    <div class="play-indicator absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 transition-opacity duration-200 z-40">
      <div class="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white/90 shadow-2xl">
        <i data-lucide="play" class="w-8 h-8 fill-white ml-1"></i>
      </div>
    </div>

    <!-- RIGHT ACTION SIDEBAR (Z-30: HIGH PRIORITY INTERACTION) -->
    <div class="absolute right-3 bottom-8 flex flex-col items-center gap-4 z-30 pointer-events-auto">
      <div class="relative cursor-pointer active:scale-90 transition-transform">
        <div class="w-11 h-11 rounded-full p-[2px] bg-gradient-to-tr from-rose-500 via-pink-400 to-amber-300">
          <div class="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center font-bold text-xs text-white">
            ${data.author.charAt(1).toUpperCase()}
          </div>
        </div>
      </div>

      <!-- Like (❤️) -->
      <div class="flex flex-col items-center gap-1">
        <button class="like-btn w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center active:scale-75 transition-all">
          <i data-lucide="heart" class="heart-icon w-6 h-6 transition-transform ${isLiked ? 'text-rose-500 fill-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]' : 'text-white'}"></i>
        </button>
        <span class="like-count text-[11px] font-semibold text-zinc-200">${formatCount(data.likes + (isLiked ? 1 : 0))}</span>
      </div>

      <!-- Bookmark Shorts (🔖) -->
      <div class="flex flex-col items-center gap-1">
        <button class="save-btn w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center active:scale-75 transition-all">
          <i data-lucide="bookmark" class="save-icon w-5 h-5 transition-transform ${isSaved ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]' : 'text-white'}"></i>
        </button>
        <span class="save-count text-[10px] font-semibold text-zinc-300">${isSaved ? 'Tersimpan' : 'Simpan'}</span>
      </div>

      <!-- Share -->
      <div class="flex flex-col items-center gap-1">
        <button class="share-btn w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-75 transition-all">
          <i data-lucide="share-2" class="w-5 h-5 text-white"></i>
        </button>
        <span class="text-[11px] font-semibold text-zinc-200">${formatCount(data.shares)}</span>
      </div>

      <!-- Chat Bot -->
      <div class="flex flex-col items-center gap-1">
        <button class="bot-view-btn w-12 h-12 rounded-full bg-rose-600/90 backdrop-blur-md border border-rose-400/40 flex items-center justify-center text-white shadow-lg shadow-rose-600/30 active:scale-75 transition-all">
          <i data-lucide="send" class="w-4 h-4 text-white -mr-0.5"></i>
        </button>
        <span class="text-[9px] font-bold tracking-tight text-rose-300 uppercase">Chat</span>
      </div>

      <!-- Music Disc -->
      <div class="music-disc w-10 h-10 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-950 border border-white/20 p-2 flex items-center justify-center shadow-lg spin-disc">
        <div class="w-3 h-3 rounded-full bg-rose-500"></div>
      </div>
    </div>

    <!-- BOTTOM METADATA -->
    <div class="absolute left-4 right-20 bottom-8 z-30 space-y-2 pointer-events-auto">
      <div class="flex items-center gap-2">
        <span class="text-[11px] font-semibold bg-rose-500/80 text-white px-2 py-0.5 rounded-md backdrop-blur-sm">
          ${data.topic_name}
        </span>
        <span class="text-xs font-bold text-white drop-shadow">
          ${data.author}
        </span>
      </div>

      <p class="text-xs text-zinc-100 font-normal leading-relaxed line-clamp-2 drop-shadow">
        ${data.title}
      </p>

      <div class="flex items-center gap-1.5 text-zinc-300 text-[11px] overflow-hidden max-w-[200px]">
        <i data-lucide="music" class="w-3.5 h-3.5 text-rose-400 shrink-0"></i>
        <div class="overflow-hidden whitespace-nowrap">
          <div class="ticker-track">
            <span class="mr-4">Original Audio - ${data.topic_name} #${data.message_id} • </span>
            <span class="mr-4">Original Audio - ${data.topic_name} #${data.message_id} • </span>
          </div>
        </div>
      </div>
    </div>
  `;

  setupShortSlideGestures(slide, data);
  return slide;
}

function setupShortSlideGestures(slide, data) {
  const touchLayer = slide.querySelector('.touch-gesture-layer');
  const video = slide.querySelector('video');
  const playIndicator = slide.querySelector('.play-indicator');
  const likeBtn = slide.querySelector('.like-btn');
  const heartIcon = slide.querySelector('.heart-icon');
  const likeCount = slide.querySelector('.like-count');
  const saveBtn = slide.querySelector('.save-btn');
  const saveIcon = slide.querySelector('.save-icon');
  const saveCount = slide.querySelector('.save-count');
  const shareBtn = slide.querySelector('.share-btn');
  const botViewBtn = slide.querySelector('.bot-view-btn');

  // Fallback seamlessly to Google Drive preview iframe if direct streaming is blocked by browser CORS/CORP
  if (video && data.gdrive_file_id) {
    video.onerror = () => {
      console.warn("Direct video stream blocked, falling back to embedded preview for:", data.id);
      const mediaWrapper = slide.querySelector('.video-media-wrapper');
      if (mediaWrapper && !mediaWrapper.querySelector('iframe')) {
        mediaWrapper.innerHTML = `
          <img src="https://lh3.googleusercontent.com/d/${data.gdrive_file_id}" class="video-poster-img absolute inset-0 w-full h-full object-cover" />
          <iframe class="video-player w-full h-full border-0 absolute inset-0 z-10" src="https://drive.google.com/file/d/${data.gdrive_file_id}/preview" allow="autoplay; fullscreen"></iframe>
        `;
      }
    };
  }

  let lastTapTime = 0;
  let singleTapTimer = null;

  // Single Tap Jeda/Pause, Double Tap Love pada Layer Layar Video
  touchLayer.addEventListener('click', (e) => {
    // Unmute on first user touch automatically
    if (isMuted) {
      isMuted = false;
      document.querySelectorAll('video').forEach(v => v.muted = false);
    }

    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTapTime;

    if (tapLength < 320 && tapLength > 0) {
      clearTimeout(singleTapTimer);
      // Double Tap Like!
      triggerDoubleTapLike(slide, e.clientX, e.clientY);
      if (!likedVideoIds.has(data.id)) {
        likedVideoIds.add(data.id);
        heartIcon.classList.add('text-rose-500', 'fill-rose-500', 'drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]');
        heartIcon.classList.remove('text-white');
        likeBtn.classList.remove('animate-heart-pop');
        void likeBtn.offsetWidth;
        likeBtn.classList.add('animate-heart-pop');
        likeCount.textContent = formatCount(data.likes + 1);
        persistStorage();
        showToast('Disukai ❤️', 'heart', 'rose');
        triggerHaptic('success');
      }
    } else {
      singleTapTimer = setTimeout(() => {
        if (video) togglePlayback(video, playIndicator);
      }, 320);
    }
    lastTapTime = currentTime;
  });

  likeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    likeBtn.classList.remove('animate-heart-pop');
    void likeBtn.offsetWidth;

    if (likedVideoIds.has(data.id)) {
      likedVideoIds.delete(data.id);
      heartIcon.classList.remove('text-rose-500', 'fill-rose-500', 'drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]');
      heartIcon.classList.add('text-white');
      likeCount.textContent = formatCount(data.likes);
      showToast('Batal menyukai 🤍', 'heart', 'zinc');
      triggerHaptic('light');
    } else {
      likedVideoIds.add(data.id);
      heartIcon.classList.add('text-rose-500', 'fill-rose-500', 'drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]');
      heartIcon.classList.remove('text-white');
      likeBtn.classList.add('animate-heart-pop');
      likeCount.textContent = formatCount(data.likes + 1);
      showToast('Disukai ❤️', 'heart', 'rose');
      triggerHaptic('success');
    }
    persistStorage();
  });

  saveBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    saveBtn.classList.remove('animate-bookmark-pop');
    void saveBtn.offsetWidth;

    if (savedShortIds.has(data.id)) {
      savedShortIds.delete(data.id);
      saveIcon.classList.remove('text-amber-400', 'fill-amber-400', 'drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]');
      saveIcon.classList.add('text-white');
      saveCount.textContent = 'Simpan';
      showToast('Dihapus dari Koleksi 🗑️', 'bookmark', 'zinc');
      triggerHaptic('light');
    } else {
      savedShortIds.add(data.id);
      saveIcon.classList.add('text-amber-400', 'fill-amber-400', 'drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]');
      saveIcon.classList.remove('text-white');
      saveBtn.classList.add('animate-bookmark-pop');
      saveCount.textContent = 'Tersimpan';
      showToast('Tersimpan di Koleksi Shorts 🔖', 'bookmark', 'amber');
      triggerHaptic('success');
    }
    persistStorage();
  });

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

  botViewBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    triggerHaptic('medium');
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(data.id)}`);
    } else {
      showToast(`Membuka pesan #${data.message_id} dari bot`, 'send', 'rose');
    }
  });
}

function togglePlayback(video, indicator) {
  triggerHaptic('light');
  if (video.paused) {
    video.play().catch(() => {});
    indicator.style.opacity = '0';
  } else {
    video.pause();
    indicator.style.opacity = '1';
    setTimeout(() => { indicator.style.opacity = '0'; }, 800);
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

      if (entry.isIntersecting && activeView === 'shorts' && dramaReelModal.classList.contains('hidden')) {
        currentPlayingShortVideo = video;
        if (video) {
          video.currentTime = 0;
          video.muted = isMuted;
          const p = video.play();
          if (p) {
            p.catch(() => {
              // Jika browser blokir unmuted autoplay, paksa muted agar video TETAP mulai otomatis!
              video.muted = true;
              video.play().catch(() => {});
            });
          }
          // Pastikan terus berulang (looping) jika tidak discroll
          video.loop = true;
          video.onended = () => {
            video.currentTime = 0;
            video.play().catch(() => {});
          };
        }
        if (disc) disc.classList.remove('spin-paused');
      } else {
        // Begitu discroll pergi: BERHENTIKAN VIDEO SEBELUMNYA SEGERA!
        if (video) {
          video.pause();
          video.currentTime = 0;
        }
        if (disc) disc.classList.add('spin-paused');
      }
    });
  }, { root: feedContainer, threshold: 0.6 });

  document.querySelectorAll('#feed-container .snap-slide').forEach(slide => shortsObserver.observe(slide));
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
  let results = currentGenreFilter === 'all'
    ? allDramas
    : allDramas.filter(d => d.genre.toLowerCase().includes(currentGenreFilter.toLowerCase()));

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
        
        <span class="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-[9px] font-bold text-amber-400">
          ★ ${drm.rating}
        </span>
        
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
        <span>${drm.total_episodes} Episode</span>
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
  modalDramaEpsCount.textContent = `${drm.total_episodes} Episode`;
  modalDramaSynopsis.textContent = drm.synopsis;

  updateModalBookmarkBtn();
  renderModalEpisodes(drm);

  modalStartWatchBtn.onclick = () => {
    dramaDetailModal.classList.add('hidden');
    openDramaReel(drm, 0); // Mulai nonton dari Ep 1
  };

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

  // Buat vertical slides untuk SEMUA episode di drama ini!
  renderDramaReelSlides(drama);

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

function renderDramaReelSlides(drama) {
  dramaEpisodesReel.innerHTML = '';

  drama.episodes.forEach((ep, idx) => {
    const slide = document.createElement('div');
    slide.className = 'snap-slide';
    slide.dataset.index = idx;
    slide.dataset.ep = ep.ep;

    const isLiked = isEpisodeLiked(drama.id, ep.ep);

    slide.innerHTML = `
      <video 
        class="video-player"
        src="${ep.video_url}"
        playsinline
        webkit-playsinline
        preload="${idx <= 1 ? 'auto' : 'metadata'}"
        ${isMuted ? 'muted' : ''}
      ></video>

      <!-- Gradient Overlay -->
      <div class="absolute inset-x-0 top-0 h-32 top-gradient pointer-events-none"></div>
      <div class="absolute inset-x-0 bottom-0 h-48 bottom-gradient pointer-events-none"></div>

      <!-- Play/Pause Flash Indicator Tengah (Ketuk 1x) -->
      <div class="play-indicator absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 transition-opacity duration-200 z-20">
        <div class="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white/90 shadow-2xl">
          <i data-lucide="play" class="w-8 h-8 fill-white ml-1"></i>
        </div>
      </div>

      <!-- RIGHT ACTION SIDEBAR (PERSIS TIKTOK/MELOLO) -->
      <div class="absolute right-3 bottom-12 flex flex-col items-center gap-4 z-20">
        
        <!-- Suka Episode Ini (❤️) -->
        <div class="flex flex-col items-center gap-1">
          <button class="reel-like-ep-btn w-11 h-11 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center active:scale-75 transition-all">
            <i data-lucide="heart" class="ep-heart-icon w-6 h-6 transition-colors ${isLiked ? 'text-rose-500 fill-rose-500' : 'text-white'}"></i>
          </button>
          <span class="ep-like-label text-[10px] font-semibold text-zinc-200">${isLiked ? 'Disukai' : 'Suka'}</span>
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

      <!-- BOTTOM METADATA & PROGRESS -->
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

        <!-- Progress Bar Episode -->
        <div class="w-full bg-white/20 h-1 rounded-full overflow-hidden">
          <div class="reel-progress-fill bg-amber-400 h-full w-0 transition-all duration-100"></div>
        </div>

        <div class="text-[10px] text-zinc-400 flex items-center justify-between font-mono">
          <span class="reel-time-now">00:00</span>
          <span>⬇️ Scroll ke bawah: Episode ${idx + 2 <= drama.episodes.length ? idx + 2 : 'Selesai'}</span>
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
  const playIndicator = slide.querySelector('.play-indicator');
  const likeBtn = slide.querySelector('.reel-like-ep-btn');
  const heartIcon = slide.querySelector('.ep-heart-icon');
  const likeLabel = slide.querySelector('.ep-like-label');
  const epListBtn = slide.querySelector('.reel-ep-list-btn');
  const chatBtn = slide.querySelector('.reel-chat-btn');
  const muteBtn = slide.querySelector('.reel-mute-btn');
  const progressFill = slide.querySelector('.reel-progress-fill');
  const timeNowEl = slide.querySelector('.reel-time-now');

  let longPressTimer = null;
  let is2xSpeed = false;
  let lastTapTime = 0;
  let singleTapTimer = null;

  // 1. Progress Bar Update
  video.addEventListener('timeupdate', () => {
    const cur = video.currentTime;
    const dur = video.duration || 1;
    progressFill.style.width = `${(cur / dur) * 100}%`;
    timeNowEl.textContent = formatTime(cur);
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

  // 3. TAHAN LAYAR -> 2X SPEED (Long Press)
  function startLongPress(e) {
    if (e.target.closest('.z-20')) return;

    longPressTimer = setTimeout(() => {
      is2xSpeed = true;
      video.playbackRate = 2.0;
      reelSpeedBadge.classList.remove('hidden');
      triggerHaptic('medium');
    }, 320);
  }

  function stopLongPress() {
    clearTimeout(longPressTimer);
    if (is2xSpeed) {
      is2xSpeed = false;
      video.playbackRate = 1.0;
      reelSpeedBadge.classList.add('hidden');
      triggerHaptic('light');
    }
  }

  slide.addEventListener('pointerdown', startLongPress);
  slide.addEventListener('pointerup', stopLongPress);
  slide.addEventListener('pointercancel', stopLongPress);
  slide.addEventListener('pointerleave', stopLongPress);

  // 4. TAP (1x Jeda/Pause, 2x Kiri -10s, 2x Kanan +10s)
  slide.addEventListener('click', (e) => {
    if (is2xSpeed) return;
    if (e.target.closest('.z-20')) return;

    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTapTime;
    const rect = slide.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;

    if (tapLength < 320 && tapLength > 0) {
      // DOUBLE TAP!
      clearTimeout(singleTapTimer);
      if (clickX < width * 0.4) {
        // -10s Mundur
        triggerHaptic('medium');
        video.currentTime = Math.max(0, video.currentTime - 10);
        flashSeek(reelSeekLeft);
      } else if (clickX > width * 0.6) {
        // +10s Maju
        triggerHaptic('medium');
        video.currentTime = Math.min(video.duration || 1000, video.currentTime + 10);
        flashSeek(reelSeekRight);
      } else {
        // Tengah: Toggle Pause
        togglePlayback(video, playIndicator);
      }
    } else {
      // SINGLE TAP: Jeda / Pause! (Persis seperti yang diminta!)
      singleTapTimer = setTimeout(() => {
        if (video) togglePlayback(video, playIndicator);
      }, 300);
    }
    lastTapTime = currentTime;
  });

  function flashSeek(el) {
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 600);
  }

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
        video.muted = isMuted;
        const p = video.play();
        if (p) p.catch(() => {});
      } else {
        video.pause();
        video.currentTime = 0;
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
  document.querySelectorAll('#drama-episodes-reel video').forEach(v => {
    v.pause();
    v.currentTime = 0;
  });
  dramaReelModal.classList.add('hidden');
  reelEpSheet.classList.add('hidden');

  // Resume shorts if active
  if (activeView === 'shorts' && currentPlayingShortVideo) {
    currentPlayingShortVideo.play().catch(() => {});
  }
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
    grid.className = 'grid grid-cols-3 gap-1';
    targetVideos.forEach(v => {
      const card = document.createElement('div');
      card.className = 'relative aspect-[3/4] bg-zinc-900 rounded-lg overflow-hidden cursor-pointer active:opacity-75 transition-opacity';
      card.innerHTML = `
        <video src="${v.video_url}#t=0.5" class="w-full h-full object-cover" preload="metadata"></video>
        <div class="absolute inset-0 bg-black/20"></div>
        <div class="absolute bottom-1.5 left-1.5 flex items-center gap-1 text-[10px] font-bold text-white drop-shadow">
          <i data-lucide="heart" class="w-3 h-3 fill-rose-500 text-rose-500"></i>
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
    const targetVideos = allVideos.filter(v => savedShortIds.has(v.id));
    if (targetVideos.length === 0) {
      renderEmptyState('bookmark-x', 'Koleksi Shorts Masih Kosong', 'Simpan video 10 detik favoritmu dengan tombol Bookmark 🔖 di Shorts!');
      return;
    }
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-3 gap-1';
    targetVideos.forEach(v => {
      const card = document.createElement('div');
      card.className = 'relative aspect-[3/4] bg-zinc-900 rounded-lg overflow-hidden cursor-pointer active:opacity-75 transition-opacity';
      card.innerHTML = `
        <video src="${v.video_url}#t=0.5" class="w-full h-full object-cover" preload="metadata"></video>
        <div class="absolute inset-0 bg-black/20"></div>
        <div class="absolute bottom-1.5 left-1.5 flex items-center gap-1 text-[10px] font-bold text-white drop-shadow">
          <i data-lucide="bookmark" class="w-3 h-3 fill-amber-400 text-amber-400"></i>
          <span>${v.topic_name}</span>
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
          ${likedCount > 0 ? `
            <div class="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-rose-600/90 text-white text-[9px] font-bold flex items-center gap-0.5">
              <span>❤️</span> ${likedCount} Disukai
            </div>
          ` : ''}
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
        p.className = 'genre-pill px-3 py-1 rounded-full text-[11px] font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300 whitespace-nowrap active:scale-95 transition-all';
      });
      pill.className = 'genre-pill px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-500 text-black shadow-sm whitespace-nowrap active:scale-95 transition-all';
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
