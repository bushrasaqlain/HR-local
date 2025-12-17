const cron = require("node-cron");
const connection = require("./connection");

// Schedule the cron for automatically changing status to expired 
cron.schedule("* * * * *", () => {

  const query = `
    UPDATE cart
    SET status = 'expire'
    WHERE (NOW() > \`Expire_At\` )
    AND status = 'active'
  `;


  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error updating expired packages:", err);
    } 
  });
});
