import http from 'http';

function runCheck() {
  const req = http.request('http://localhost:5001/api/authenticity/report/app_01', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('STATUS:', res.statusCode);
      try {
        const parsed = JSON.parse(data);
        console.log('REPORT RECEIVED:', parsed.success);
        console.log('RISK LEVEL:', parsed.report?.risk_level);
        console.log('SIGNALS COUNT:', parsed.report?.signals?.length);
        console.log('DISCLAIMER:', parsed.report?.disclaimer);
      } catch (e) {
        console.log('RAW RESPONSE:', data.substring(0, 300));
      }
    });
  });
  req.on('error', err => console.error('Error:', err.message));
  req.end();
}

runCheck();
