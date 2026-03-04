const https = require('https');

const data = JSON.stringify({
  language: 'c++',
  version: '10.2.0',
  files: [{ content: '#include <iostream>\nint main() { std::cout << "Hello World"; return 0; }' }]
});

const options = {
  hostname: 'emkc.org',
  port: 443,
  path: '/api/v2/piston/execute',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  res.on('data', d => {
    process.stdout.write(d);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
