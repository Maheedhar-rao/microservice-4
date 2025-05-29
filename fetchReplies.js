import dotenv from 'dotenv';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';
import { extractReplyBody } from './utils/extractBody.js'; // You can customize this
dotenv.config();

// Supabase setup
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Gmail setup
const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });
const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

async function fetchUnrepliedDeals() {
  const { data, error } = await supabase
    .from('deals_submitted')
    .select('deal_id, business_name, lender_names, message_id');

  if (error) {
    console.error('❌ Error fetching deals:', error);
    return [];
  }

  const { data: liveSubs } = await supabase
    .from('Live submissions')
    .select('deal_id, reply_body, reply_date');

  const repliedIds = new Set(liveSubs?.filter(d => d.reply_body || d.reply_date).map(d => d.deal_id));

  return data.filter(deal => !repliedIds.has(deal.deal_id));
}

async function searchReplies(deal) {
  const messageIdQuery = `rfc822msgid:${deal.message_id}`;
  let results = [];

  try {
    const threadSearch = await gmail.users.messages.list({
      userId: 'me',
      q: `in:inbox ${messageIdQuery}`
    });

    for (const msg of threadSearch.data.messages || []) {
      const msgData = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'full'
      });

      const headers = msgData.data.payload.headers;
      const subject = headers.find(h => h.name === 'Subject')?.value || '';
      const inReplyTo = headers.find(h => h.name === 'In-Reply-To')?.value || '';
      const from = headers.find(h => h.name === 'From')?.value || '';
      const date = headers.find(h => h.name === 'Date')?.value || '';

      const isReply = inReplyTo || subject.toLowerCase().includes(deal.business_name.toLowerCase());

      if (isReply) {
        const body = extractReplyBody(msgData.data);
        if (body && body.length > 10) {
          results.push({
            reply_body: body,
            reply_date: new Date(date).toISOString(),
            from,
            subject
          });
        }
      }
    }
  } catch (err) {
    console.error(`❌ Error searching Gmail for deal ${deal.deal_id}:`, err.message);
  }

  return results;
}

async function updateLiveSubmission(deal, reply) {
  const { error } = await supabase
    .from('Live submissions')
    .update({
      reply_body: reply.reply_body,
      reply_date: reply.reply_date,
      reply_status: null,
      classified: false
    })
    .eq('deal_id', deal.deal_id);

  if (error) {
    console.error(`❌ Error updating deal ${deal.deal_id}:`, error.message);
  } else {
    console.log(`✅ Reply saved for ${deal.business_name} (${deal.deal_id})`);
  }
}

async function run() {
  const deals = await fetchUnrepliedDeals();
  console.log(`🔍 Processing ${deals.length} deals...`);

  for (const deal of deals) {
    const replies = await searchReplies(deal);
    if (replies.length) {
      await updateLiveSubmission(deal, replies[0]); // Just take the first valid reply
    } else {
      console.log(`⏳ No reply found for ${deal.business_name} (${deal.deal_id})`);
    }
  }
}

run();
