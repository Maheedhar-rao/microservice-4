const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cookieParser());
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



app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
