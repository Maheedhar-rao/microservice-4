let allDeals = [];

async function fetchAndRenderDeals() {
  const res = await fetch('/api/deals');
  const deals = await res.json();

  // Sort by latest submission (descending)
  allDeals = deals.sort((a, b) => new Date(b.creation_date) - new Date(a.creation_date));
  renderDeals(allDeals);
}

function renderDeals(deals) {
  const container = document.getElementById('deals-container');
  container.innerHTML = deals.map((deal, index) => {
  const sortedLenders = deal.lender_names
  ? deal.lender_names
      .split(',')
      .map(name => name.trim())
      .sort()
      .map(name => `<span class="lender">${name}</span>`)
      .join('<br>')
  : 'N/A';


    return `
      <div class="card">
        <h3>${deal.business_name}</h3>
        <p><strong>Deal ID:</strong> ${deal.dealid || 'N/A'}</p>
          <p><strong>Submitted:</strong> ${new Date(deal.creation_date).toLocaleString()}</p>

        <div id="extra-${index}" class="extra-info" style="display: none;">
          <p><strong>Lenders:</strong><br/> ${sortedLenders}</p>
        </div>

        <button class="toggle-btn" onclick="toggleExtra(${index})">Show More</button>
      </div>
    `;
  }).join('');
}

function toggleExtra(index) {
  const extra = document.getElementById(`extra-${index}`);
  const btn = extra.nextElementSibling;
  const isVisible = extra.style.display === 'block';
  extra.style.display = isVisible ? 'none' : 'block';
  btn.textContent = isVisible ? 'Show More' : 'Show Less';
}

window.filterDeals = function () {
  const query = document.getElementById('searchInput').value.trim();

  if (!query) {
    renderDeals(allDeals);
    return;
  }

  const filtered = allDeals.filter(deal =>
    deal.dealid && deal.dealid.toString().includes(query)
  );

  renderDeals(filtered);
};



function goBack() {
  window.location.href = 'dashboard.html';
}

fetchAndRenderDeals();
setInterval(fetchAndRenderDeals, 180000);
