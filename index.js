const connection = require("./server/connection");
const app = require("./server/app");
connection.connect((err) => {
    if (err) {
        console.log("Database Connection Error" + JSON.stringify(err, undefined, 2));
    } else {
        console.log("Connection Successfully");
        // Start your Express app
        const PORT = process.env.PORT || 8080;
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    }
});
