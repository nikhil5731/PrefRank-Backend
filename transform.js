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
const combined = JSON.parse(fs.readFileSync("./jsonFiles/combined.json"));
const transformedData = JSON.parse(
  fs.readFileSync("./jsonFiles/transformedData.json")
);
const transformedData2 = JSON.parse(
  fs.readFileSync("./jsonFiles/transformedData2.json")
);
const transformedData3 = JSON.parse(
  fs.readFileSync("./jsonFiles/transformedData3.json")
);
const states = JSON.parse(fs.readFileSync("./jsonFiles/States.json"));
const ratingData = JSON.parse(fs.readFileSync("./jsonFiles/Ratings.json"));
const news = JSON.parse(fs.readFileSync("./jsonFiles/news.json"));
const newsUpdated = JSON.parse(fs.readFileSync("./jsonFiles/updatedNews.json"));
const review = JSON.parse(fs.readFileSync("./jsonFiles/review.json"));
const scholarships = JSON.parse(
  fs.readFileSync("./jsonFiles/scholarships.json")
);

async function uploadData() {
  const batch = db.batch();

  transformedData3.forEach((college) => {
    const docRef = db.collection("cutoffs").doc(college.institute_name); // Automatically generate an ID
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
      Opening_Rank_2018,
      Closing_Rank_2018,
      Opening_Rank_2019,
      Closing_Rank_2019,
      Opening_Rank_2020,
      Closing_Rank_2020,
      Opening_Rank_2021,
      Closing_Rank_2021,
      Opening_Rank_2022,
      Closing_Rank_2022,
      Opening_Rank_2023,
      Closing_Rank_2023,
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
        // state: getState(Institute),
        // overallRating: getOverallRating(Institute),
        // jee: Jee,
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
      Opening_Rank_2018: Opening_Rank_2018,
      Closing_Rank_2018: Closing_Rank_2018,
      Opening_Rank_2019: Opening_Rank_2019,
      Closing_Rank_2019: Closing_Rank_2019,
      Opening_Rank_2020: Opening_Rank_2020,
      Closing_Rank_2020: Closing_Rank_2020,
      Opening_Rank_2021: Opening_Rank_2021,
      Closing_Rank_2021: Closing_Rank_2021,
      Opening_Rank_2022: Opening_Rank_2022,
      Closing_Rank_2022: Closing_Rank_2022,
      Opening_Rank_2023: Opening_Rank_2023,
      Closing_Rank_2023: Closing_Rank_2023,
      // Opening_Rank_2024: Opening_Rank_2024,
      // Closing_Rank_2024: Closing_Rank_2024,
      Department: Department,
    });
  });

  fs.writeFileSync(
    "./jsonFiles/transformedData3.json",
    JSON.stringify(transformedData, null, 4)
  );

  console.log("Transformed data has been saved to transformedData.json");
};

const mergeData = () => {
  let count = 0;
  const temp = newsUpdated.map((ele1) => {
    let mergedElement = { ...ele1, quota: null };
    transformedData2.forEach((ele2) => {
      if (
        ele1.Institute.replace(/,/g, "")
          ?.split("(")[1]
          ?.split(")")[0]
          .toLowerCase() ===
          ele2.institute_name
            .replace(/,/g, "")
            ?.split("(")[1]
            ?.split(")")[0]
            .toLowerCase() ||
        ele1.Institute.replace(/,/g, "")?.split(" (")[0].toLowerCase() ===
          ele2.institute_name.replace(/,/g, "")?.split(" (")[0].toLowerCase() ||
        ele1.Institute.replace(/,/g, "") ===
          ele2.institute_name.replace(/,/g, "") ||
        ele1.Institute?.replace(/,/g, "").includes(
          ele2?.institute_name.replace(/,/g, "")
        ) ||
        ele2.Institute?.replace(/,/g, "").includes(
          ele1?.institute_name.replace(/,/g, "")
        )
      ) {
        count++;
        mergedElement = {
          ...ele1,
          quota: ele2["quotas"],
        };
      }
    });
    return mergedElement;
  });

  console.log(count);

  // fs.writeFileSync(
  //   "./jsonFiles/updatedNews.json",
  //   JSON.stringify(temp, null, 4)
  // );
};

const findNulls = () => {
  let count = 0;
  combined.map((element) => {
    if (element.Placements == null) {
      count++;
    }
  });
  console.log(count);
};

uploadData().catch(console.error);
// convertData();
// mergeData();
// findNulls()

// console.log(ratingData)
