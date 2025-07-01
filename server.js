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
const jwt = require('jsonwebtoken'); 
function verifyUser(req, res, next) {
  const token = req.cookies['token'];
  const isAPI = req.path.startsWith('/api/');

  if (!token) {
    if (isAPI) return res.status(401).json({ error: 'Missing token' });
    return res.redirect('https://login.croccrm.com/login.html');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    if (isAPI) return res.status(403).json({ error: 'Invalid token' });
    return res.redirect('https://login.croccrm.com/login.html');
  }
}

app.get('/', verifyUser, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});


app.get('/api/deals', verifyUser, async (req, res) => {
  const userId = req.user.id;
  const { data, error } = await supabase
    .from('deals_submitted')
    .select('dealid, business_name, lender_names,  name, creation_date')
    .eq('user_id', userId)
    .order('creation_date', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get('/api/live-replies', async (req, res) => {
  let allReplies = [];

  for (let i = 0; i < 5000; i += 1000) {
    const { data, error } = await supabase
      .from('Live submissions')
      .select('business_name, lender_names, reply_status, reply_body, reply_date')
      .range(i, i + 999);

    if (error) return res.status(500).json({ error: error.message });

    // Only include rows where reply_status is 'replied' (case-insensitive)
    const filtered = data.filter(
      r => typeof r.reply_status === 'string' && r.reply_status.toLowerCase() === 'replied'
    );

    if (filtered.length === 0 && data.length < 1000) break; // No more pages
    allReplies = allReplies.concat(filtered);
  }

  console.log('✅ live-replies fetched (filtered):', allReplies.length);
  res.json(allReplies);
});



app.get('/api/manual-reply-search', async (req, res) => {
  try {
    const { dealid, business_name } = req.query;
    const parsedDealId = parseInt(dealid, 10);

    if (!parsedDealId || !business_name) {
      return res.status(400).json({ message: 'Missing or invalid fields' });
    }

    const { data, error } = await supabase
      .from('deals_submitted')
      .select('*')
      .eq('dealid', parsedDealId)
      .ilike('business_name', `%${business_name}%`);

    console.log('📦 Supabase response:', data);

    if (error) return res.status(500).json({ message: 'Supabase error', error });
    if (!data.length) return res.status(404).json({ message: 'No matching deal found' });

    return res.json({ message: '✅ Deal found', deal: data[0] });
  } catch (err) {
    console.error('💥 Unexpected error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/me', verifyUser, (req, res) => {
  res.json(req.user); // { id, email, role }
});


app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
