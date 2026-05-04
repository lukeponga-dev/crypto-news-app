/**
 * API service for fetching crypto news and market data
 * Using CryptoCompare's public API
 */

const BASE_URL = 'https://min-api.cryptocompare.com/data';
const NEWS_URL = `${BASE_URL}/v2/news/?lang=EN`;
const PRICE_URL = `${BASE_URL}/pricemultifull`;

// For a simple demo, we can use the API without a key for limited requests.
// In a real app, you'd want to store this in an environment variable.
const API_KEY = ''; 

async function fetchData(url) {
  try {
    const headers = API_KEY ? { 'Authorization': `Apikey ${API_KEY}` } : {};
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    return null;
  }
}

export const NewsAPI = {
  /**
   * Fetch latest news articles
   * @param {string} category Optional category filter
   */
  async getLatestNews(category = 'ALL') {
    let url = NEWS_URL;
    if (category !== 'ALL') {
      url += `&categories=${category.toLowerCase()}`;
    }
    
    const data = await fetchData(url);
    return (data && Array.isArray(data.Data)) ? data.Data : [];
  },

  /**
   * Search news by query (Client side filtering for simplicity or use API search if available)
   * CryptoCompare doesn't have a direct "search" in the news v2 endpoint, so we filter locally
   */
  filterNews(news, query) {
    if (!query) return news;
    const q = query.toLowerCase();
    return news.filter(item => 
      item.title.toLowerCase().includes(q) || 
      item.body.toLowerCase().includes(q)
    );
  }
};

export const MarketAPI = {
  /**
   * Fetch top coin prices
   */
  async getTopPrices() {
    const symbols = 'BTC,ETH,SOL,BNB,XRP,ADA,DOGE';
    const url = `${PRICE_URL}?fsyms=${symbols}&tsyms=USD`;
    
    const data = await fetchData(url);
    if (!data || !data.RAW) return [];
    
    return Object.keys(data.RAW).map(symbol => {
      const info = data.RAW[symbol].USD;
      return {
        symbol,
        price: info.PRICE,
        change24h: info.CHANGEPCT24HOUR,
        mktcap: info.MKTCAP
      };
    });
  }
};
