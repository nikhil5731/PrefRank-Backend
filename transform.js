const fs = require("fs");
const admin = require("firebase-admin");

// Path to your service account key
const serviceAccount = require("./service.json");

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Initialize Firestore
const db = admin.firestore();
const data = JSON.parse(fs.readFileSync("./jsonFiles/open&close24.json"));
const transformedData = JSON.parse(
  fs.readFileSync("./jsonFiles/transformedData.json")
);
const states = JSON.parse(fs.readFileSync("./jsonFiles/States.json"));
const ratingData = JSON.parse(fs.readFileSync("./jsonFiles/Ratings.json"));

async function uploadData() {
  const batch = db.batch();

  ratingData.forEach((college) => {
    const docRef = db.collection("ratings").doc(college.Institute); // Automatically generate an ID
    batch.set(docRef, college);
  });

  await batch.commit();
  console.log("Data successfully uploaded to Firestore!");
}

// const ratingData = JSON.parse(fs.readFileSync("Ratings.json"));
const getOverallRating = (instituteName) => {
  const instituteRating = ratingData.find(
    (item) =>
      item.Institute.split("(")[1]?.split(")")[0].toLowerCase() ===
        instituteName.split("(")[1]?.split(")")[0].toLowerCase() ||
      item.Institute.split(" (")[0].toLowerCase() ===
        instituteName.split(" (")[0].toLowerCase()
  );
  return instituteRating ? instituteRating["Overall Rating"] : null;
};

const getState = (instituteName) => {
  const instituteState = states.find(
    (item) =>
      item.Institute.split("(")[1]?.split(")")[0].toLowerCase() ===
        instituteName.split("(")[1]?.split(")")[0].toLowerCase() ||
      item.Institute.split(" (")[0].toLowerCase() ===
        instituteName.split(" (")[0].toLowerCase()
  );
  return instituteState ? instituteState["State"] : null;
};

const convertData = () => {
  const transformedData = [];

  data.forEach((entry) => {
    const {
      Institute,
      Quota,
      Categories,
      Opening_Rank_2024,
      Closing_Rank_2024,
      Department,
      Jee,
    } = entry;

    let instituteEntry = transformedData.find(
      (item) => item.institute_name === Institute
    );
    if (!instituteEntry) {
      instituteEntry = {
        institute_name: Institute,
        quotas: {},
        state: getState(Institute),
        overallRating: getOverallRating(Institute),
        jee: Jee,
      };
      transformedData.push(instituteEntry);
    }

    if (!instituteEntry.quotas[Quota]) {
      instituteEntry.quotas[Quota] = {};
    }

    if (!instituteEntry.quotas[Quota][Categories]) {
      instituteEntry.quotas[Quota][Categories] = [];
    }
    instituteEntry.quotas[Quota][Categories].push({
      Opening_Rank_2024: Opening_Rank_2024,
      Closing_Rank_2024: Closing_Rank_2024,
      Department: Department,
    });
  });

  fs.writeFileSync(
    "./jsonFiles/transformedData.json",
    JSON.stringify(transformedData, null, 4)
  );

  console.log("Transformed data has been saved to transformedData.json");
};

// uploadData().catch(console.error);
// convertData();

// console.log(ratingData)
