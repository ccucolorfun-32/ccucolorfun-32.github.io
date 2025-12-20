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

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function pick(images) {
    return images[Math.floor(Math.random() * images.length)];
  }

  function setItemImage(item, images, fade) {
    const src = pick(images);
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
    const rotate = rand(-6, 6).toFixed(1);
    const tx = rand(-6, 6).toFixed(1);
    const ty = rand(-6, 6).toFixed(1);
    const z = Math.floor(rand(1, 10));
    const colSpan = Math.random() < 0.22 ? 2 : 1;
    const rowSpan = Math.random() < 0.28 ? 2 : 1;

    item.style.setProperty('--rot', `${rotate}deg`);
    item.style.setProperty('--tx', `${tx}px`);
    item.style.setProperty('--ty', `${ty}px`);
    item.style.zIndex = z;
    item.style.gridColumn = `span ${colSpan}`;
    item.style.gridRow = `span ${rowSpan}`;
  }

  fetch('../data/first_page_images.json', { cache: 'no-store' })
    .then((response) => (response.ok ? response.json() : []))
    .then((images) => {
      if (!Array.isArray(images) || !images.length) return;
      const count = Math.min(18, images.length);
      wall.innerHTML = '';
      for (let i = 0; i < count; i += 1) {
        const item = document.createElement('span');
        item.className = 'photo-item';
        setItemLayout(item);
        setItemImage(item, images, false);
        wall.appendChild(item);
      }
      setInterval(() => {
        const items = wall.querySelectorAll('.photo-item');
        const total = items.length;
        if (!total) return;
        const changeCount = Math.max(1, Math.round(total * 0.2));
        const indices = Array.from({ length: total }, (_, idx) => idx)
          .sort(() => Math.random() - 0.5)
          .slice(0, changeCount);
        indices.forEach((idx) => setItemImage(items[idx], images, true));
      }, 3000);
    })
    .catch((error) => {
      console.error(error);
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
