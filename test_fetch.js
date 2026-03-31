const https = require('https');

const options = {
  hostname: 'www.coupang.com',
  port: 443,
  path: '/vp/products/8554972580', // example random id
  method: 'GET',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml'
  }
};

const req = https.request(options, res => {
  let chunks = [];
  res.on('data', d => chunks.push(d));
  res.on('end', () => {
      const html = Buffer.concat(chunks).toString('utf8');
      console.log('Status code:', res.statusCode);
      if (html.includes('판매자로켓')) console.log('FOUND 판매자로켓');
      if (html.includes('로켓배송')) console.log('FOUND 로켓배송');
      console.log('HTML Length:', html.length);
  });
});

req.on('error', error => console.error(error));
req.end();
