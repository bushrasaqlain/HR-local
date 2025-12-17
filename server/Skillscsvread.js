const connection = require('./connection');
const fs = require('fs');
const csv = require('csv-parser');

const results = [];

// Path to your CSV file
fs.createReadStream("C:\\Users\\dell\\Downloads\\onet_skills_clean.csv")
  .pipe(csv({ separator: ',', }))
  .on('data', (row) => {
    // Adjust this to exactly match the column header in your CSV
    const skillName = row["O*NET-SOC 2019 Title"]?.trim();

    if (skillName) {
      results.push([skillName]);
    }
  })
  .on('end', () => {
    if (results.length) {
      // Insert into your table (id will auto increment)
      const query = 'INSERT INTO skills (name) VALUES ?';
      connection.query(query, [results], (err, res) => {
        if (err) throw err;
        console.log(`Inserted ${res.affectedRows} rows into skills table.`);
        connection.end();
      });
    } else {
      console.log('⚠️ No valid data found in CSV.');
      connection.end();
    }
  });
