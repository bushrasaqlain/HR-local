const connection = require('./connection');
const https = require('https');
const csv = require('csv-parser');

const results = [];

// GitHub raw CSV link for countries
const url = "https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/csv/countries.csv";

https.get(url, (res) => {
  res.pipe(csv({ separator: ',' }))
    .on('data', (row) => {
      // In countries.csv, the column is lowercase "name"
      const country = row.name?.trim();

      if (country) {
        results.push([country]);
      }
    })
    .on('end', () => {
      if (results.length) {
        const query = 'INSERT INTO countries (name) VALUES ?';
        connection.query(query, [results], (err, res) => {
          if (err) throw err;
          console.log(`✅ Inserted ${res.affectedRows} rows into countries table.`);
          connection.end();
        });
      } else {
        console.log('⚠️ No valid data found in CSV.');
        connection.end();
      }
    });
}).on('error', (err) => {
  console.error("❌ Error fetching CSV:", err);
});
