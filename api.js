/**
 * API service for fetching crypto news and market data
 * Using CryptoCompare's public API
 */

const BASE_URL = 'https://min-api.cryptocompare.com/data';
const NEWS_URL = `${BASE_URL}/v2/news/?lang=EN`;
const PRICE_URL = `${BASE_URL}/pricemultifull`;

// For a simple demo, we can use the API without a key for limited requests.
// In a real app, you'd want to store this in an environment variable.
const API_KEY = process.env.API_KEY; 

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
    // Try CryptoCompare first
    let cryptoCompareUrl = NEWS_URL;
    if (category !== 'ALL') {
      cryptoCompareUrl += `&categories=${category.toLowerCase()}`;
    }
    
    const data = await fetchData(cryptoCompareUrl);
    
    // If CryptoCompare fails or returns error (due to missing API key), try RSS fallback
    if (!data || !data.Data || data.Data.length === 0) {
      console.log('CryptoCompare failed or returned no data, falling back to RSS...');
      return await this.getRSSNews(category);
    }
    
    return data.Data;
  },

  /**
   * Fetch news from RSS feeds as a fallback
   */
  async getRSSNews(category = 'ALL') {
    const feeds = {
      'ALL': 'https://cointelegraph.com/rss',
      'BITCOIN': 'https://cointelegraph.com/rss/tag/bitcoin',
      'ETHEREUM': 'https://cointelegraph.com/rss/tag/ethereum',
      'ALTCOIN': 'https://cointelegraph.com/rss/tag/altcoin',
      'BLOCKCHAIN': 'https://cointelegraph.com/rss/tag/blockchain',
      'REGULATION': 'https://cointelegraph.com/rss/tag/regulation'
    };

    const rssUrl = feeds[category] || feeds['ALL'];
    const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
    
    try {
      const response = await fetch(proxyUrl);
      const data = await response.json();
      
      if (data.status === 'ok') {
        return data.items.map(item => ({
          id: item.guid,
          imageurl: item.thumbnail || item.enclosure?.link || 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?q=80&w=800&auto=format&fit=crop',
          title: item.title,
          body: item.description.replace(/<[^>]*>/g, '').substring(0, 200) + '...',
          categories: item.categories ? item.categories.join('|') : category,
          source: data.feed.title || 'Crypto News',
          source_info: { img: data.feed.image || '' },
          published_on: Math.floor(new Date(item.pubDate).getTime() / 1000),
          url: item.link
        }));
      }
    } catch (error) {
      console.error('RSS Fetch error:', error);
    }
    
    return [];
  },

  /**
   * Search news by query
   */
  filterNews(news, query) {
    if (!query) return news;
    const q = query.toLowerCase();
    return news.filter(item => 
      (item.title && item.title.toLowerCase().includes(q)) || 
      (item.body && item.body.toLowerCase().includes(q))
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
