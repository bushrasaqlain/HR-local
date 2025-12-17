const connection = require('./connection');
const https = require('https');
const csv = require('csv-parser');

const results = [];

https.get("https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/csv/cities.csv", (res) => {
  res.pipe(csv({ separator: ',' }))
    .on('data', (row) => {
      const cityName = row.name?.trim();
      const postalCode = row.state_code?.trim();
      const countryId = row.country_id?.trim();
      if (cityName && countryId && postalCode) {
        results.push([cityName, countryId, postalCode]);
      }
    })
    .on('end', () => {
      if (results.length) {
        const query = 'INSERT INTO cities (name, country_id, postalcode) VALUES ?';
        connection.query(query, [results], (err, res) => {
          if (err) throw err; 
          console.log(`Inserted ${res.affectedRows} rows into cities table.`);
          connection.end();
        });
      } else {
        console.log('⚠️ No valid data found in CSV.');
        connection.end();
      }
    });
}).on('error', (err) => {
  console.error("Error fetching CSV:", err);
});
