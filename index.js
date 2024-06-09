const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const cors = require('cors');

// Initialize Express app
const app = express();

app.use(bodyParser.json());
app.use(cors());

let colleges = [];

colleges = JSON.parse(fs.readFileSync("open&close24.json"));

// API route to get colleges based on filters
app.post("/get-colleges", (req, res) => {
  const { quota, categories, rank } = req.body;

  if (!quota || !categories || rank === undefined) {
    return res
      .status(400)
      .send({ error: "quota, categories, and rank are required" });
  }

  const filteredColleges = colleges.filter((college) => {
    return (
      college.Quota.toLowerCase() === quota.toLowerCase() &&
      college.Categories.toLowerCase() === categories.toLowerCase() &&
      rank >= college.Opening_Rank_2024 &&
      rank <= college.Closing_Rank_2024
    );
  });

  return res.send(filteredColleges);
});
 
// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
