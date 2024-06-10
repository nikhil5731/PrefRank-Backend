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
const data = JSON.parse(fs.readFileSync("transformedData.json"));

async function uploadData() {
  const batch = db.batch();

  data.forEach((college) => {
    const docRef = db.collection("institutes_new").doc(); // Automatically generate an ID
    batch.set(docRef, college);
  });

  await batch.commit();
  console.log("Data successfully uploaded to Firestore!");
}

// const ratingData = JSON.parse(fs.readFileSync("Ratings.json"));
const getOverallRating = (instituteName) => {
  const instituteRating = ratingData.find((item) =>
    item.Institute.includes(instituteName)
  );
  return instituteRating ? instituteRating["Overall Rating"] : null;
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
    } = entry;

    let instituteEntry = transformedData.find(
      (item) => item.institute_name === Institute
    );
    if (!instituteEntry) {
      instituteEntry = {
        institute_name: Institute,
        quotas: {},
        //   Overall_Rating: getOverallRating(Institute),
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
    "transformedData.json",
    JSON.stringify(transformedData, null, 4)
  );

  console.log("Transformed data has been saved to transformedData.json");
};

uploadData().catch(console.error);
// convertData();
