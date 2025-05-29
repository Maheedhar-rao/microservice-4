async function loadStatusPage() {
  const businessName = new URLSearchParams(window.location.search).get('business');
  if (!businessName) {
    document.getElementById('businessTitle').textContent = "No business specified.";
    return;
  }

  const res = await fetch('/api/live-replies');
  const replies = await res.json();

  const filtered = replies.filter(r =>
    r.business_name?.trim().toLowerCase() === businessName.trim().toLowerCase()
  );

  document.getElementById('businessTitle').textContent = businessName;

  const allLenders = [...new Set(filtered.flatMap(r =>
    (r.lender_names || '').split(',').map(l => l.trim().toLowerCase())
  ))];

  const approvals = filtered.filter(r => r.reply_status?.toLowerCase().includes('approval'));
  const declines = filtered.filter(r => r.reply_status?.toLowerCase().includes('decline'));
  const others = filtered.filter(r =>
    !r.reply_status?.toLowerCase().includes('approval') &&
    !r.reply_status?.toLowerCase().includes('decline')
  );

  const statusText = filtered.length === allLenders.length
    ? '✅ Deal received feedback from all submitted lenders'
    : '⏳ Deal pending feedback';
  document.getElementById('dealStatus').textContent = statusText;

  const approvalsList = document.getElementById('approvalsList');
  const declinesList = document.getElementById('declinesList');
  const otherRepliesList = document.getElementById('otherRepliesList');

  approvalsList.innerHTML = approvals.length
    ? approvals.map(r =>
        `<div class="reply"><p><strong>${r.lender_names}</strong></p><p>${r.reply_body || ''}</p></div>`
      ).join('')
    : '<p>No approvals yet.</p>';

  declinesList.innerHTML = declines.length
    ? declines.map(r =>
        `<div class="reply"><p><strong>${r.lender_names}</strong></p><p>${r.reply_body || ''}</p></div>`
      ).join('')
    : '<p>No declines yet.</p>';

  if (others.length > 0) {
    document.getElementById('otherRepliesSection').style.display = 'block';
    otherRepliesList.innerHTML = others.map(r =>
      `<div class="reply"><p><strong>${r.lender_names}</strong></p><p>${r.reply_body || ''}</p></div>`
    ).join('');
  }
}

loadStatusPage();
setInterval(loadStatusPage, 3 * 60 * 1000);
