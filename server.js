const express = require('express');

const { createClient } = require('@supabase/supabase-js');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cookieParser());
app.use(express.json());
app.use(express.static(path.join(__dirname)));


const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

function verifyUser(req, res, next) {
  const token = req.cookies['token'];
  if (!token) return res.redirect('https://login.croccrm.com');

  try {
    jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.redirect('https://login.croccrm.com');
  }
}
app.get('/', verifyUser, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});


app.get('/api/deals', async (req, res) => {
  const { data, error } = await supabase.from('deals_submitted').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get('/api/live-replies', async (req, res) => {
  const { data, error } = await supabase
    .from('Live submissions')
    .select('business_name, lender_names, reply_status, reply_body, reply_date');

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get('/api/manual-reply-search', async (req, res) => {
  console.log('🛠 Query received:', req.query);
  const { dealid, business_name } = req.body;
  if (!dealid || !business_name) return res.status(400).json({ message: 'Missing fields' });

  const { data: deals, error } = await supabase
    .from('deals_submitted')
    .select('*')
    .eq('dealid', dealid)
    .eq('business_name', business_name);

  if (error || !deals?.length) {
    return res.status(404).json({ message: 'Deal not found' });
  }

  const deal = deals[0];
  const replies = await searchReplies(deal); // reuse from fetchReplies.js

  if (replies.length > 0) {
    await updateLiveSubmission(deal, replies[0]); // reuse from fetchReplies.js
    return res.json({ message: '✅ Reply saved successfully.' });
  } else {
    return res.json({ message: '⏳ No reply found.' });
  }
});


app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
