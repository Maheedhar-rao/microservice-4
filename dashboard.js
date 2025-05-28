let allDeals = [];
let liveReplies = [];

async function fetchAndRenderDeals() {
  const res = await fetch('/api/deals');
  const deals = await res.json();

  const replyRes = await fetch('/api/live-replies');
  liveReplies = await replyRes.json();

  allDeals = deals.map(deal => {
    const repliesForDeal = liveReplies.filter(
      r => r.business_name?.trim().toLowerCase() === deal.business_name?.trim().toLowerCase()
    );

    const submittedLenders = (deal.lender_names || "")
      .split(',')
      .map(name => name.trim().toLowerCase())
      .filter(Boolean);

    const repliedLenders = repliesForDeal
      .map(r => r.lender_names?.split(',').map(n => n.trim().toLowerCase()))
      .flat()
      .filter(Boolean);

    const allMatched = submittedLenders.every(l => new Set(repliedLenders).has(l));

    return {
      ...deal,
      hasReplies: repliesForDeal.length > 0,
      allLendersReplied: allMatched
    };
  });

  // sort by newest created_at by default
  allDeals.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Apply saved search filter
  const savedQuery = localStorage.getItem('dealSearchQuery');
  if (savedQuery) {
    document.getElementById('searchInput').value = savedQuery;
    const filtered = allDeals.filter(deal =>
      deal.dealid && deal.dealid.toString().includes(savedQuery)
    );
    renderDeals(filtered);
  } else {
    renderDeals(allDeals);
  }
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

    const dealLink = deal.hasReplies
      ? `<a href="status.html?business=${encodeURIComponent(deal.business_name)}" class="underline">${deal.business_name}</a>`
      : `${deal.business_name}`;

    const status = deal.hasReplies
      ? deal.allLendersReplied
        ? '✅ Deal received feedback from all submitted lenders'
        : '⏳ Deal pending feedback'
      : '';

    return `
      <div class="card">
        <h3>${dealLink}</h3>
        <p><strong>Deal ID:</strong> ${deal.dealid || 'N/A'}</p>
        <p><strong>Submitted:</strong> ${deal.created_at || 'N/A'}</p>

        <p><strong>Status:</strong> ${status}</p>

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
  localStorage.setItem('dealSearchQuery', query);
  if (!query) {
    renderDeals(allDeals);
    return;
  }

  const filtered = allDeals.filter(deal =>
    deal.dealid && deal.dealid.toString().includes(query)
  );

  renderDeals(filtered);
};

window.clearFilter = function () {
  localStorage.removeItem('dealSearchQuery');
  document.getElementById('searchInput').value = '';
  renderDeals(allDeals);
};

window.applySort = function () {
  const sortBy = document.getElementById('sortSelect').value;
  let sortedDeals = [...allDeals];

  switch (sortBy) {
    case 'dealid':
      sortedDeals.sort((a, b) => Number(a.dealid) - Number(b.dealid));
      break;
    case 'submission_id':
      sortedDeals.sort((a, b) => (a.submission_id || '').localeCompare(b.submission_id || ''));
      break;
    case 'created_at':
      sortedDeals.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      break;
    case 'status':
      sortedDeals.sort((a, b) => {
        const statusA = a.hasReplies
          ? (a.allLendersReplied ? 'complete' : 'pending')
          : 'none';
        const statusB = b.hasReplies
          ? (b.allLendersReplied ? 'complete' : 'pending')
          : 'none';
        return statusA.localeCompare(statusB);
      });
      break;
    default:
      sortedDeals.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      break;
  }

  renderDeals(sortedDeals);
};

function goBack() {
  window.location.href = 'dashboard.html';
}

// Initial fetch + periodic refresh
fetchAndRenderDeals();
setInterval(fetchAndRenderDeals, 180000);
