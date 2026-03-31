const crypto = require('crypto');

const ACCESS_KEY = process.env.COUPANG_PARTNERS_ACCESS_KEY;
const SECRET_KEY = process.env.COUPANG_PARTNERS_SECRET_KEY;

async function generateSignature(method, path, query) {
  const now = new Date();
  const yy = now.getUTCFullYear().toString().substring(2);
  const mm = (now.getUTCMonth() + 1).toString().padStart(2, '0');
  const dd = now.getUTCDate().toString().padStart(2, '0');
  const hh = now.getUTCHours().toString().padStart(2, '0');
  const min = now.getUTCMinutes().toString().padStart(2, '0');
  const ss = now.getUTCSeconds().toString().padStart(2, '0');
  
  const timestamp = `${yy}${mm}${dd}T${hh}${min}${ss}Z`;
  const message = timestamp + method + path + query;
  
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(message).digest('hex');
  return { timestamp, signature };
}

(async () => {
  const method = 'GET';
  const path = '/v2/providers/affiliate_open_api/apis/openapi/v1/products/search';
  const query = `keyword=${encodeURIComponent('여성 니트티')}&limit=1`;
  const url = `https://api-gateway.coupang.com${path}?${query}`;

  const { timestamp, signature } = await generateSignature(method, path, query);
  const authorization = `CEA algorithm=HmacSHA256, access-key=${ACCESS_KEY}, signed-date=${timestamp}, signature=${signature}`;

  const fetch = (await import('node-fetch')).default;
  try {
      const res = await fetch(url, { headers: { Authorization: authorization } });
      const data = await res.json();
      console.log(JSON.stringify(data, null, 2));
  } catch (e) {
      console.log('Fetch failed:', e);
  }
})();
