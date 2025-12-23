const galleryGrid = document.getElementById('galleryGrid');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const modalImage = document.getElementById('modalImage');
const modalCreator = document.getElementById('modalCreator');
const modalMedium = document.getElementById('modalMedium');
const modalGrade = document.getElementById('modalGrade');
const modalSize = document.getElementById('modalSize');
const modalConcept = document.getElementById('modalConcept');
const modalStory = document.getElementById('modalStory');
const modalContact = document.getElementById('modalContact');
const modalClose = document.getElementById('modalClose');
const viewFullBtn = document.getElementById('viewFullBtn');
const fullview = document.getElementById('fullview');
const fullviewImage = document.getElementById('fullviewImage');
const fullviewClose = document.getElementById('fullviewClose');
const dataUrl = '../data/works.json';
let currentImg = '';
let initialId = '';
const params = new URLSearchParams(window.location.search);
initialId = params.get('id') || '';

function openModal(card) {
  modalTitle.textContent = card.dataset.title || '';
  currentImg = card.dataset.img || '';
  modalImage.src = currentImg;
  modalImage.alt = card.dataset.title || 'artwork';
  modalCreator.textContent = card.dataset.creator || '-';
  modalMedium.textContent = card.dataset.medium || '-';
  modalGrade.textContent = card.dataset.grade || '-';
  modalSize.textContent = card.dataset.size || '-';
  modalConcept.textContent = `作品理念：${card.dataset.concept || ''}`;
  modalStory.textContent = `創作故事：${card.dataset.story || ''}`;
  modalContact.textContent = `聯絡方式：${card.dataset.contact || ''}`;
  modal.classList.add('active');
  if (card.dataset.id) {
    const url = new URL(window.location);
    url.searchParams.set('id', card.dataset.id);
    window.history.replaceState({}, '', url);
  }
}

function closeModal() {
  modal.classList.remove('active');
  const url = new URL(window.location);
  url.searchParams.delete('id');
  window.history.replaceState({}, '', url);
}

modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (event) => {
  if (event.target === modal) closeModal();
});

document.addEventListener('keyup', (event) => {
  if (event.key === 'Escape') closeModal();
});

function openFullview() {
  if (!currentImg) return;
  fullviewImage.src = currentImg;
  fullviewImage.alt = modalTitle.textContent || 'artwork';
  fullview.classList.add('active');
}

function closeFullview() {
  fullview.classList.remove('active');
}

viewFullBtn.addEventListener('click', openFullview);
modalImage.addEventListener('click', openFullview);
fullviewClose.addEventListener('click', closeFullview);
fullview.addEventListener('click', (event) => {
  if (event.target === fullview) closeFullview();
});

document.addEventListener('keyup', (event) => {
  if (event.key === 'Escape') closeFullview();
});

function createCard(work) {
  const card = document.createElement('article');
  card.className = 'art-card';
  card.style.setProperty('--card-img', `url('${work.image}')`);
  const cardId = work.id || slugify(work.title || '');
  card.dataset.id = cardId;
  card.dataset.img = work.image;
  card.dataset.title = work.title;
  card.dataset.creator = work.creator;
  card.dataset.medium = work.medium;
  card.dataset.grade = work.grade;
  card.dataset.size = work.size;
  card.dataset.concept = work.concept;
  card.dataset.story = work.story;
  card.dataset.contact = work.contact;

  const overlay = document.createElement('div');
  overlay.className = 'card-overlay';

  const title = document.createElement('h3');
  title.textContent = work.title;

  const desc = document.createElement('p');
  desc.textContent = work.concept;

  overlay.appendChild(title);
  overlay.appendChild(desc);
  card.appendChild(overlay);

  card.addEventListener('click', () => openModal(card));
  return card;
}

function renderWorks(list) {
  galleryGrid.innerHTML = '';
  let targetCard = null;
  list.forEach((work) => {
    const card = createCard(work);
    galleryGrid.appendChild(card);
    if (initialId && (work.id === initialId || card.dataset.id === initialId)) {
      targetCard = card;
    }
  });
  if (targetCard) {
    openModal(targetCard);
  }
}

async function loadWorks() {
  try {
    const response = await fetch(dataUrl);
    if (!response.ok) throw new Error('資料載入失敗');
    const works = await response.json();
    renderWorks(works);
  } catch (error) {
    console.error(error);
    galleryGrid.innerHTML = '<p style="color:#fff;">無法載入作品資料，請稍後再試。</p>';
  }
}

loadWorks();
initLights();
initPhotoWall();

function initLights() {
  const lights = document.querySelectorAll('.lights span');
  if (!lights.length) return;
  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function randomizePosition(light) {
    const x = rand(6, 94).toFixed(1) + '%';
    const y = rand(8, 92).toFixed(1) + '%';
    light.style.setProperty('--x', x);
    light.style.setProperty('--y', y);
  }

  lights.forEach((light) => {
    light.style.setProperty('--speed', '3s');
    light.style.setProperty('--delay', '0s');
    randomizePosition(light);
    light.addEventListener('animationiteration', () => {
      randomizePosition(light);
    });
  });
}
function initPhotoWall() {
  const wall = document.getElementById('photoWall');
  if (!wall) return;
  const wallSection = wall.closest('.photo-wall-section') || wall;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isSmallScreen = window.matchMedia('(max-width: 640px)').matches;
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const saveData = connection && connection.saveData;
  const deviceMemory = navigator.deviceMemory || 4;
  let items = [];
  let cycleId = null;
  let isVisible = true;
  let wallImages = [];
  let readyImages = [];
  let isPreloading = false;
  const useBlobCache = true;
  const blobCache = new Map();
  let changeRatio = 0;
  let intervalMs = 0;
  const poolSize = 50;
  let poolIndex = 0;

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function nextFromPool(images) {
    if (!images.length) return '';
    const src = images[poolIndex % images.length];
    poolIndex += 1;
    return src;
  }

  function setItemImage(item, images, fade) {
    const src = nextFromPool(images);
    if (!src) return;
    if (!fade) {
      item.style.setProperty('--img', `url("${src}")`);
      return;
    }
    item.classList.add('is-fading');
    window.setTimeout(() => {
      item.style.setProperty('--img', `url("${src}")`);
      item.classList.remove('is-fading');
    }, 400);
  }

  function setItemLayout(item) {
    const rotate = rand(-5, 5).toFixed(1);
    const z = Math.floor(rand(1, 10));
    const shapeRoll = Math.random();
    let colSpan = 1;
    let rowSpan = 1;

    if (shapeRoll < 0.28) {
      colSpan = 2;
      rowSpan = 1;
    } else if (shapeRoll < 0.56) {
      colSpan = 1;
      rowSpan = 2;
    } else if (shapeRoll < 0.68) {
      colSpan = 2;
      rowSpan = 2;
    }

    item.style.setProperty('--rot', `${rotate}deg`);
    item.style.zIndex = z;
    item.style.gridColumn = `span ${colSpan}`;
    item.style.gridRow = `span ${rowSpan}`;
  }

  function pickPool(images, size) {
    const copy = images.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, Math.min(size, copy.length));
  }

  function preloadImages(list) {
    if (isPreloading) return;
    isPreloading = true;
    readyImages = [];
    const queue = list.slice();
    const concurrency = saveData || deviceMemory <= 4 ? 3 : 5;

    function loadNext() {
      if (!queue.length) return;
      const src = queue.shift();
      if (useBlobCache && !blobCache.has(src)) {
        fetch(src, { cache: 'force-cache' })
          .then((response) => (response.ok ? response.blob() : null))
          .then((blob) => {
            if (!blob) return;
            const objectUrl = URL.createObjectURL(blob);
            blobCache.set(src, objectUrl);
            readyImages.push(objectUrl);
          })
          .catch(() => {})
          .finally(loadNext);
        return;
      }

      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        readyImages.push(src);
        loadNext();
      };
      img.onerror = () => {
        loadNext();
      };
      img.src = src;
      if (img.decode) {
        img.decode().catch(() => {});
      }
    }

    for (let i = 0; i < concurrency; i += 1) {
      loadNext();
    }
  }

  function stopCycle() {
    if (cycleId) {
      clearInterval(cycleId);
      cycleId = null;
    }
  }

  function startCycle() {
    if (cycleId || prefersReduced || changeRatio <= 0) return;
    cycleId = window.setInterval(() => {
      if (!isVisible) return;
      const total = items.length;
      if (!total) return;
      const changeCount = Math.max(1, Math.round(total * changeRatio));
      const picked = new Set();
      while (picked.size < changeCount) {
        picked.add(Math.floor(Math.random() * total));
      }
      picked.forEach((idx) => setItemImage(items[idx], wallImages, true));
    }, intervalMs);
  }

  function initWall(images) {
    if (!Array.isArray(images) || !images.length) return;
    const pool = pickPool(images, poolSize);
    const maxCount = prefersReduced || saveData
      ? 18
      : (deviceMemory <= 4 || isSmallScreen ? 24 : 36);
    const count = Math.min(maxCount, pool.length);
    changeRatio = prefersReduced
      ? 0
      : (saveData || deviceMemory <= 4 || isSmallScreen ? 0.12 : 0.18);
    intervalMs = saveData ? 7000 : 4500;

    wall.innerHTML = '';
    items = [];
    wallImages = pool;
    poolIndex = 0;
    preloadImages(wallImages);
    for (let i = 0; i < count; i += 1) {
      const item = document.createElement('span');
      item.className = 'photo-item';
      setItemLayout(item);
      setItemImage(item, wallImages, false);
      wall.appendChild(item);
      items.push(item);
    }

    startCycle();
  }

  function loadImages() {
    fetch('../data/first_page_images.json', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : []))
      .then(initWall)
      .catch((error) => {
        console.error(error);
      });
  }

  const defer = window.requestIdleCallback
    ? window.requestIdleCallback
    : (fn) => window.setTimeout(fn, 60);
  defer(loadImages);

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0].isIntersecting;
        if (!isVisible) {
          stopCycle();
        } else {
          startCycle();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(wallSection);
  }

  document.addEventListener('visibilitychange', () => {
    isVisible = !document.hidden;
    if (!isVisible) {
      stopCycle();
    } else {
      startCycle();
    }
  });

  window.addEventListener('beforeunload', () => {
    blobCache.forEach((url) => URL.revokeObjectURL(url));
    blobCache.clear();
  });
}
function slugify(text) {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'work';
}
