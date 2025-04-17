process.stdin.setEncoding("utf8");

const express = require("express");
const http = require("http");
const path = require("path");
const { MongoClient, ServerApiVersion } = require("mongodb");

require("dotenv").config({ path: path.resolve(__dirname, "credentials/.env") });
const uri = `mongodb+srv://${process.env.MONGO_DB_USERNAME}:${process.env.MONGO_DB_PASSWORD}@cluster0.wxtmquv.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });

/* Our database and collection */
const databaseAndCollection = {
  db: process.env.MONGO_DB_NAME,
  collection: process.env.MONGO_COLLECTION,
};

if (process.argv.length !== 3) {
  console.error("Usage summerCampServer.js portNumber");
  process.exit(1);
}

const portNumber = process.argv[2];
const homeURL = `http://localhost:${portNumber}`;

const app = express();
const server = http.createServer(app);

app.set("view engine", "ejs");

app.set("views", path.resolve(__dirname, "templates"));

app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/apply", (req, res) => {
  const URL = { URL: homeURL + "/processApplication" };
  res.render("apply", URL);
});

app.post("/processApplication", async (req, res) => {
  const application = {
    name: req.body.name,
    email: req.body.email,
    gpa: parseFloat(req.body.gpa),
    info: req.body.info,
    date: Date().toString(),
  };

  try {
    await client.connect();
    await insertApplication(client, databaseAndCollection, application);
    res.render("processApplication", application);
  } catch (e) {
    print('here')
    console.error(e);
  } finally {
    await client.close();
  }
});

app.get("/reviewApplication", (req, res) => {
  const URL = { URL: homeURL + "/processReviewApplication" };
  res.render("reviewApplication", URL);
});

app.post("/processReviewApplication", async (req, res) => {
  const email = req.body.email;
  // Retrieve info from mongoDB using email and send it as an object to processApplication
  try {
    await client.connect();
    const application = await lookUpOneApplication(
      client,
      databaseAndCollection,
      email
    );
    if (application) {
      res.render("processApplication", application);
    }
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
});

app.get("/adminGFA", (req, res) => {
  const URL = { URL: homeURL + "/processAdminGFA" };
  res.render("adminGFA", URL);
});

app.post("/processAdminGFA", async (req, res) => {
  const gpa = parseFloat(req.body.gpa);

  try {
    await client.connect();
    const result = await lookUpApplicationsByGPA(
      client,
      databaseAndCollection,
      gpa
    );
    const gfaTable = { gfaTable: generateApplicationTable(result) };
    // render page
    res.render("processAdminGFA", gfaTable);
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
});

app.get("/adminRemove", (req, res) => {
  const URL = { URL: homeURL + "/processAdminRemove" };
  res.render("adminRemove", URL);
});

app.post("/processAdminRemove", async (req, res) => {
  // TODO Retrieve number of applications
  try {
    await client.connect();
    const result = await client
      .db(databaseAndCollection.db)
      .collection(databaseAndCollection.collection)
      .deleteMany({});
    const removed = { removed: result.deletedCount };
    res.render("processAdminRemove", removed);
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
});

server.listen(portNumber, (err) => {
  if (err) {
    process.stdout.write("Starting server failed.");
  } else {
    process.stdout.write(
      `Web server started and running at http://localhost:${
        server.address().port
      }\n`
    );

    const prompt = "Stop to shutdown the server: ";
    process.stdout.write(prompt);

    process.stdin.on("readable", function () {
      let dataInput = process.stdin.read();
      if (dataInput !== null) {
        let command = dataInput.trim();
        if (command === "stop") { 
          process.stdout.write("Shutting down the server\n");
          process.exit(0);
        } else {
          process.stdout.write("Invalid command: " + command + "\n");
          process.stdout.write(prompt);
          process.stdin.resume();
        }
      }
    });
  }
});

async function insertApplication(
  client,
  databaseAndCollection,
  newApplication
) {
  const result = await client
    .db(databaseAndCollection.db)
    .collection(databaseAndCollection.collection)
    .insertOne(newApplication);

  // console.log(`Application entry created with id ${result.insertedId}`);
}

async function lookUpOneApplication(client, databaseAndCollection, email) {
  const filter = { email: email };
  const result = await client
    .db(databaseAndCollection.db)
    .collection(databaseAndCollection.collection)
    .findOne(filter);

  if (result) {
    return result;
  } else {
    console.log(`No application found with email ${email}`);
  }
}

async function lookUpApplicationsByGPA(client, databaseAndCollection, gpa) {
  const filter = { gpa: { $gte: gpa } };
  const cursor = client
    .db(databaseAndCollection.db)
    .collection(databaseAndCollection.collection)
    .find(filter);

  const result = await cursor.toArray();
  return result;
}

function generateApplicationTable(applications) {
  let table = '<table border="2">';
  table += "<tr><th>Name</th><th>GPA</th></tr>";
  applications.forEach((application) => {
    table += `<tr><td>${application.name}</td><td>${application.gpa}</td></tr>`;
  });
  table += "</table>";
  return table;
}
