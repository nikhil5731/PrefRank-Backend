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

// colleges = JSON.parse(fs.readFileSync("transformedData.json"));
// ratings = JSON.parse(fs.readFileSync("Ratings.json"));

function filterColleges(colleges, quota, categories, rank, jee) {
  const temp = colleges
    .filter((college) => {
      return (
        college &&
        college["quotas"] &&
        college["quotas"][quota] &&
        college["quotas"][quota][categories] &&
        college["jee"] === jee
      );
    })
    .map((college) => {
      const collegeData = college["quotas"][quota][categories].filter((ele) => {
        return (
          ele["Opening_Rank_2024"] <= rank && ele["Closing_Rank_2024"] >= rank
        );
      });

      if (collegeData.length === 0) {
        return null;
      }

      return {
        institute_name: college["institute_name"],
        departments: collegeData,
        state: college["state"],
        overallRating: college["overallRating"],
        jee: college["jee"],
      };
    })
    .filter((college) => college !== null);

  let filteredColleges = [];

  for (let i = 0; i < temp.length; i++) {
    const institute_name = temp[i]["institute_name"];
    const overallRating = temp[i]["overallRating"];
    const state = temp[i]["state"];
    const jee = temp[i]["jee"];
    const departments = temp[i]["departments"];
    for (let j = 0; j < departments.length; j++) {
      filteredColleges.push({
        institute_name: institute_name,
        State: state,
        jee: jee,
        overallRating: overallRating,
        department: departments[j]["Department"],
        Closing_Rank_2024: departments[j]["Closing_Rank_2024"],
        Opening_Rank_2024: departments[j]["Opening_Rank_2024"],
      });
    }
  }

  return filteredColleges;
}

// API route to get colleges based on filters
app.post("/get-colleges", async (req, res) => {
  try {
    const { quota, categories, rank, jee } = req.body;

    if (!quota || !categories || !rank || !jee === undefined) {
      return res
        .status(400)
        .send({ error: "quota, categories, jee and rank are required" });
    }

    const snapshot = await db.collection("institutes").get();

    if (snapshot.empty) {
      console.log("No documents found in collection.");
      return;
    }

    let collegesDB = [];
    // Iterate through each document
    snapshot.forEach((doc) => {
      collegesDB.push(doc.data());
    });

    const filteredColleges = filterColleges(
      collegesDB,
      quota,
      categories,
      rank,
      jee
    );

    return res.send(filteredColleges);
  } catch (error) {
    console.log(error);
  }
});

app.post("/get-ratings", async (req, res) => {
  try {
    const { colleges } = req.body;

    if (!colleges) {
      return res.status(400).send({ error: "colleges are required" });
    }

    const snapshot = await db.collection("ratings").get();

    if (snapshot.empty) {
      console.log("No documents found in collection.");
      return;
    }

    let ratings = [];
    // Iterate through each document
    snapshot.forEach((doc) => {
      const data = doc.data();
      const instituteName = data.Institute;
      const isExist = colleges.find(
        (item) =>
          item?.split("(")[1]?.split(")")[0].toLowerCase() ===
            instituteName?.split("(")[1]?.split(")")[0].toLowerCase() ||
          item?.split(" (")[0].toLowerCase() ===
            instituteName?.split(" (")[0].toLowerCase()
      );
      if (isExist) {
        ratings.push(data);
      }
    });
    // console.log(colleges.length)

    return res.send(ratings);
  } catch (error) {
    console.log(error);
  }
});

app.get("/", (req, res) => {
  return res.json("HOLA AMIGO!");
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
