const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const cors = require("cors");
const admin = require("firebase-admin");

// Path to your service account key
const serviceAccount = require("./service.json");

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Initialize Firestore
const db = admin.firestore();

// Initialize Express app
const app = express();

app.use(bodyParser.json());
app.use(cors());

ratings = JSON.parse(fs.readFileSync("Ratings.json"));

function filterColleges(colleges, quota, categories, rank) {
  const temp = colleges
    .filter((college) => {
      return (
        college &&
        college["quotas"] &&
        college["quotas"][quota] &&
        college["quotas"][quota][categories]
      );
    })
    .map((college) => {
      const collegeData = college["quotas"][quota][categories].filter((ele) => {
        return ele["Closing_Rank_2024"] >= rank;
      });

      if (collegeData.length === 0) {
        return null;
      }

      return {
        institute_name: college["institute_name"],
        departments: collegeData.sort(
          (a, b) => a["Opening_Rank_2024"] - b["Opening_Rank_2024"]
        ),
      };
    })
    .filter((college) => college !== null);

  let filteredColleges = [];
  for (let i = 0; i < temp.length; i++) {
    const institute_name = temp[i]["institute_name"];
    const departments = temp[i]["departments"];
    for (let j = 0; j < departments.length; j++) {
      filteredColleges.push({
        institute_name: institute_name,
        department: departments[j]["Department"],
        Opening_Rank_2024: departments[j]["Opening_Rank_2024"],
        Closing_Rank_2024: departments[j]["Closing_Rank_2024"],
      });
    }
  }

  return filteredColleges;
}

// API route to get colleges based on filters
app.post("/get-colleges", async (req, res) => {
  try {
    const { quota, categories, rank } = req.body;

    if (!quota || !categories || rank === undefined) {
      return res
        .status(400)
        .send({ error: "quota, categories, and rank are required" });
    }

    const snapshot = await db.collection("institutes").get();

    if (snapshot.empty) {
      console.log("No documents found in collection.");
      return;
    }

    let colleges = [];
    // Iterate through each document
    snapshot.forEach((doc) => {
      colleges.push(doc.data());
    });

    const filteredColleges = filterColleges(colleges, quota, categories, rank);
    return res.send(filteredColleges);
  } catch (error) {
    console.log(error);
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
