const cron = require("node-cron");
const connection = require("./connection");

// Schedule the cron for automatically changing status to expired 
cron.schedule("* * * * *", () => {

});
