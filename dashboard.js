window.onload = async () => {
  const res = await fetch('/api/deals');
  const deals = await res.json();

  const container = document.getElementById('deals-container');
  container.innerHTML = deals.map(deal => `
    <div class="card">
      <h3>${deal.business_name || 'Untitled'}</h3>
      <p><strong>Amount:</strong> ${deal.amount_requested || 'N/A'}</p>
      <p><strong>Industry:</strong> ${deal.industry || 'N/A'}</p>
      <p><strong>Status:</strong> ${deal.status || 'Pending'}</p>
    </div>
  `).join('');
};
