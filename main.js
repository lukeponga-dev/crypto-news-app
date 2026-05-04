import { NewsAPI, MarketAPI } from './api.js';

// State management
let allNews = [];
let currentCategory = 'ALL';

// DOM Elements
const newsGrid = document.getElementById('news-grid');
const priceTicker = document.getElementById('price-ticker');
const searchInput = document.getElementById('news-search');
const refreshBtn = document.getElementById('refresh-btn');
const filterBtns = document.querySelectorAll('.filter-btn');

/**
 * Initialize the app
 */
async function init() {
  setupEventListeners();
  registerServiceWorker();
  await Promise.all([
    loadPrices(),
    loadNews()
  ]);
}

/**
 * Register PWA Service Worker
 */
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW registration failed:', err));
    });
  }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Search
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value;
    renderNews(NewsAPI.filterNews(allNews, query));
  });

  // Refresh
  refreshBtn.addEventListener('click', async () => {
    refreshBtn.classList.add('spinning');
    await Promise.all([loadPrices(), loadNews()]);
    refreshBtn.classList.remove('spinning');
  });

  // Filters
  filterBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const category = btn.getAttribute('data-category');
      
      // Update UI
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      currentCategory = category;
      await loadNews(category);
    });
  });
}

/**
 * Load and render prices
 */
async function loadPrices() {
  const prices = await MarketAPI.getTopPrices();
  if (!prices || prices.length === 0) return;

  priceTicker.innerHTML = prices.map(coin => `
    <div class="price-card">
      <span class="symbol">${coin.symbol}/USD</span>
      <span class="price">$${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      <span class="change ${coin.change24h >= 0 ? 'up' : 'down'}">
        ${coin.change24h >= 0 ? '▲' : '▼'} ${Math.abs(coin.change24h).toFixed(2)}%
      </span>
    </div>
  `).join('');
}

/**
 * Load news from API
 */
async function loadNews(category = 'ALL') {
  showLoading();
  allNews = await NewsAPI.getLatestNews(category);
  renderNews(allNews);
}

/**
 * Render news cards to the grid
 */
function renderNews(news) {
  if (!Array.isArray(news) || news.length === 0) {
    newsGrid.innerHTML = `
      <div class="loading-state">
        <p>No news found matching your criteria.</p>
      </div>
    `;
    return;
  }

  newsGrid.innerHTML = news.map(item => `
    <article class="news-card">
      <img src="${item.imageurl}" alt="${item.title}" class="card-image" onerror="this.src='https://images.unsplash.com/photo-1621761191319-c6fb62004040?q=80&w=800&auto=format&fit=crop'">
      <div class="card-content">
        <span class="card-tag">${item.categories.split('|')[0] || 'General'}</span>
        <h3 class="card-title">${item.title}</h3>
        <p class="card-excerpt">${item.body}</p>
        <div class="card-footer">
          <div class="source-info">
            <img src="${item.source_info.img}" alt="${item.source}" width="20" height="20" style="border-radius: 50%" onerror="this.style.display='none'">
            <span>${item.source} • ${formatDate(item.published_on)}</span>
          </div>
          <a href="${item.url}" target="_blank" class="read-more">
            Read <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
          </a>
        </div>
      </div>
    </article>
  `).join('');
}

/**
 * Show loading state
 */
function showLoading() {
  newsGrid.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Fetching the latest crypto pulse...</p>
    </div>
  `;
}

/**
 * Format timestamp
 */
function formatDate(timestamp) {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  return date.toLocaleDateString();
}

// Start the app
init();
