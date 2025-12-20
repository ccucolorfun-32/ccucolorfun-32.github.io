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

function initLights() {
  const lights = document.querySelectorAll('.lights span');
  if (!lights.length) return;
  const hues = [10, 28, 50, 110, 140, 190, 220, 300, 340];

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function randomizeLight(light, initial) {
    const x = rand(6, 94).toFixed(1) + '%';
    const y = rand(8, 92).toFixed(1) + '%';
    const size = Math.round(rand(100, 180)) + 'px';
    const hue = hues[Math.floor(rand(0, hues.length))];
    const speed = rand(5.5, 9.5).toFixed(2) + 's';
    const delay = initial ? (-rand(0, 6)).toFixed(2) + 's' : '0s';

    light.style.setProperty('--x', x);
    light.style.setProperty('--y', y);
    light.style.setProperty('--size', size);
    light.style.setProperty('--hue', hue);
    light.style.setProperty('--speed', speed);
    light.style.setProperty('--delay', delay);
  }

  lights.forEach((light) => {
    randomizeLight(light, true);
    light.addEventListener('animationiteration', () => randomizeLight(light, false));
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
