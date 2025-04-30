import { createClient } from '@supabase/supabase-js';

// Access env variables injected by Vite
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
);

const grid = document.getElementById("dealGrid");

function updateSummaryCards(deals) {
  document.getElementById("totalDeals").textContent = `Total Deals: ${deals.length}`;
  document.getElementById("approvedDeals").textContent = `Approved: ${deals.filter(d => d.status === 'approved').length}`;
  document.getElementById("pendingDeals").textContent = `Pending: ${deals.filter(d => d.status === 'pending').length}`;
}

function renderDeals(deals) {
  grid.innerHTML = "";
  deals.forEach(deal => {
    const card = document.createElement("div");
    card.className = "deal-card flash";
    card.innerHTML = `
      <h3>Business: ${deal.business_name || 'N/A'}</h3>
      <p><strong>Status:</strong> ${deal.status || 'Unknown'}</p>
      <p><strong>Amount:</strong> $${deal.requested_amount?.toLocaleString() || '0'}</p>
      <p><strong>Submitted:</strong> ${new Date(deal.created_at).toLocaleDateString()}</p>
    `;
    grid.appendChild(card);
    setTimeout(() => card.classList.remove("flash"), 1000);
  });
}

async function loadAndRenderDeals() {
  const { data, error } = await supabase
    .from("deals_submitted")
    .select("*")
    .order("created_at", { ascending: false });

  if (!error) {
    renderDeals(data);
    updateSummaryCards(data);
  }
}

loadAndRenderDeals();

// Realtime sync
supabase
  .channel('realtime:deal_submitted')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'deal_submitted' }, payload => {
    console.log("Realtime event:", payload.eventType);
    loadAndRenderDeals();
  })
  .subscribe();
