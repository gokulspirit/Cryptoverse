const searchInput = document.getElementById('searchInput');
const currencySelect = document.getElementById('currencySelect');
const themeToggle = document.getElementById('themeToggle');
const cryptoList = document.getElementById('cryptoList');
const loader = document.getElementById('loader');
const lastUpdated = document.getElementById('lastUpdated');
const modal = document.getElementById('coinModal');
const modalDetails = document.getElementById('modalDetails');
const closeModal = document.getElementById('closeModal');

let currentCurrency = 'usd';
let chart;
let allCoins = [];
let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];

async function fetchCryptoData() {
  loader.style.display = 'block';
  cryptoList.style.display = 'none';
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currentCurrency}&order=market_cap_desc&per_page=100`;
  const res = await fetch(url);
  const data = await res.json();
  allCoins = data;
  loader.style.display = 'none';
  cryptoList.style.display = 'grid';
  lastUpdated.textContent = 'Last Updated: ' + new Date().toLocaleTimeString();
  displayCoins(data);
}

function displayCoins(coins) {
  cryptoList.innerHTML = '';
  const gainers = [...coins].sort((a,b) => b.price_change_percentage_24h - a.price_change_percentage_24h).slice(0,3);
  const losers = [...coins].sort((a,b) => a.price_change_percentage_24h - b.price_change_percentage_24h).slice(0,3);

  coins.forEach(coin => {
    const card = document.createElement('div');
    card.className = 'crypto-card';
    if (gainers.some(c => c.id === coin.id)) card.classList.add('top-gainer');
    if (losers.some(c => c.id === coin.id)) card.classList.add('top-loser');

    const isWatch = watchlist.includes(coin.id);
    const star = isWatch ? '★' : '☆';

    card.innerHTML = `
      <h3>${coin.name} (${coin.symbol.toUpperCase()})</h3>
      <img src="${coin.image}" alt="${coin.name}">
      <p>Price: ${formatCurrency(coin.current_price)}</p>
      <p>24h Change: <span style="color:${coin.price_change_percentage_24h > 0 ? 'limegreen':'red'}">${coin.price_change_percentage_24h.toFixed(2)}%</span></p>
      <button onclick="viewDetails('${coin.id}')">View</button>
      <button onclick="toggleWatchlist('${coin.id}')">${star} Watchlist</button>
    `;
    cryptoList.appendChild(card);
  });
}

function formatCurrency(value) {
  return (currentCurrency === 'usd' ? '$' : '₹') + value.toLocaleString();
}

async function viewDetails(id) {
  const [coinData, chartData] = await Promise.all([
    fetch(`https://api.coingecko.com/api/v3/coins/${id}`).then(r => r.json()),
    fetch(`https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=${currentCurrency}&days=7`).then(r => r.json())
  ]);

  modalDetails.innerHTML = `
    <h2>${coinData.name}</h2>
    <img src="${coinData.image.large}" width="60">
    <p><strong>Current Price:</strong> ${formatCurrency(coinData.market_data.current_price[currentCurrency])}</p>
    <p><strong>Market Cap:</strong> ${formatCurrency(coinData.market_data.market_cap[currentCurrency])}</p>
    <p><strong>High 24h:</strong> ${formatCurrency(coinData.market_data.high_24h[currentCurrency])}</p>
    <p><strong>Low 24h:</strong> ${formatCurrency(coinData.market_data.low_24h[currentCurrency])}</p>
  `;

  const ctx = document.getElementById('priceChart').getContext('2d');
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: chartData.prices.map(p => new Date(p[0]).toLocaleDateString()),
      datasets: [{
        label: `${coinData.name} (7d)`,
        data: chartData.prices.map(p => p[1]),
        borderColor: '#58a6ff',
        backgroundColor: 'rgba(88,166,255,0.2)',
        fill: true,
        tension: 0.3
      }]
    }
  });

  modal.style.display = 'flex';
}

function toggleWatchlist(id) {
  if (watchlist.includes(id)) {
    watchlist = watchlist.filter(i => i !== id);
  } else {
    watchlist.push(id);
  }
  localStorage.setItem('watchlist', JSON.stringify(watchlist));
  displayCoins(allCoins);
}

currencySelect.addEventListener('change', () => {
  currentCurrency = currencySelect.value;
  fetchCryptoData();
});

searchInput.addEventListener('input', () => {
  const filtered = allCoins.filter(coin =>
    coin.name.toLowerCase().includes(searchInput.value.toLowerCase())
  );
  displayCoins(filtered);
});

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('light-mode');
});

closeModal.addEventListener('click', () => modal.style.display = 'none');
window.addEventListener('click', (e) => {
  if (e.target === modal) modal.style.display = 'none';
});

fetchCryptoData();
setInterval(fetchCryptoData, 60000);
