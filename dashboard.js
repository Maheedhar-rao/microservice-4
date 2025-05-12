async function fetchAndRenderDeals() {
  const res = await fetch('/api/deals');
  const deals = await res.json();

  const container = document.getElementById('deals-container');
  container.innerHTML = deals.map((deal, index) => {
    const sortedLenders = deal.lender_names
      ? deal.lender_names.split(',').map(name => name.trim()).sort().join(', ')
      : 'N/A';

    return `
      <div class="card">
        <h3>${deal.business_name}</h3>
        <p><strong>Submitted:</strong> ${new Date(deal.creation_date).toLocaleString()}</p>
        <p><strong>Lenders:</strong><br/> ${sortedLenders}</p>

        <div id="extra-${index}" class="extra-info" style="display: none;">
          <p><strong>Deal ID:</strong> ${deal.dealid || 'N/A'}</p>
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

fetchAndRenderDeals();
setInterval(fetchAndRenderDeals, 180000);
