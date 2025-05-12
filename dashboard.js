window.onload = async () => {
  const res = await fetch('/api/deals');
  const deals = await res.json();

  const container = document.getElementById('deals-container');
  container.innerHTML = deals.map(deal => `
    <div class="card">
      <h3>${deal.business_name}</h3>
      <p><strong>Lender(s):</strong> ${deal.lender_names}</p>
      <p><strong>Deal ID:</strong> ${deal.dealid || 'N/A'}</p>
      <p><strong>File:</strong> ${deal.filename || 'N/A'}</p>
      <p><strong>Submitted:</strong> ${new Date(deal.creation_date).toLocaleString()}</p>
    </div>
  `).join('');
};
