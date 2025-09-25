import http from 'http';

const options = {
  hostname: 'localhost',
  port: 10000,
  path: '/',
  method: 'POST',
  headers: {
    'Transfer-Encoding': 'chunked',
    'Content-Type': 'text/plain'
  }
};

const req = http.request(options, (res) => {
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log('Response:', chunk);
  });
  res.on('end', () => {
    console.log('No more data in response.');
  });
});

// Send chunks "1", "2", "3", "4"
['1', '2', '3', '4'].forEach((data) => {
  req.write(data);
});

req.end();
