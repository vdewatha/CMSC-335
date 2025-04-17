// Set the encoding for the standard input to UTF-8
process.stdin.setEncoding("utf8");

// Import required modules
const express = require("express");
const http = require("http");
const path = require("path");
const { MongoClient, ServerApiVersion } = require("mongodb");

// Load environment variables from the credentials.env file
require("dotenv").config({ path: path.resolve(__dirname, "credentials.env") });

// MongoDB connection URI and client initialization
const uri = "mongodb+srv://USERNAME:PASSWORD@cluster0.9d9ug.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });

// Define database and collection names from environment variables
const databaseAndCollection = {
  db: "CMSC335DB",
  collection: "campApplicants",
};

// Ensure the correct number of command-line arguments
if (process.argv.length !== 3) {
  console.error("Usage: summerCampServer.js portNumber");
  process.exit(1);
}

// Get the port number from command-line arguments
const portNumber = process.argv[2];
const homeURL = `http://localhost:${portNumber}`;

// Create an Express application and HTTP server
const app = express();
const server = http.createServer(app);

// Configure the app to use EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.resolve(__dirname, "templates"));

// Middleware to parse URL-encoded data
app.use(express.urlencoded({ extended: true }));

// Route to render the homepage
app.get("/", (req, res) => {
  res.render("index");
});

// Route to render the application form
app.get("/apply", (req, res) => {
  const URL = { URL: homeURL + "/processApplication" };
  res.render("apply", URL);
});

// Route to process and save application data
app.post("/processApplication", async (req, res) => {
  const application = {
    name: req.body.name,
    email: req.body.email,
    gpa: parseFloat(req.body.gpa),
    info: req.body.info,
    date: Date().toString(),
  };

  try {
    // Connect to MongoDB and save the application
    await client.connect();
    await insertApplication(client, databaseAndCollection, application);
    res.render("processApplication", application);
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
});

// Route to render the review application form
app.get("/reviewApplication", (req, res) => {
  const URL = { URL: homeURL + "/processReviewApplication" };
  res.render("reviewApplication", URL);
});

// Route to retrieve and display application data based on email
app.post("/processReviewApplication", async (req, res) => {
  const email = req.body.email;

  try {
    await client.connect();
    const application = await lookUpOneApplication(client, databaseAndCollection, email);
    if (application) {
      res.render("processApplication", application);
    }
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
});

// Route to render the GPA filter form for admin
app.get("/adminGFA", (req, res) => {
  const URL = { URL: homeURL + "/processAdminGFA" };
  res.render("adminGFA", URL);
});

// Route to process GPA filter and display results
app.post("/processAdminGFA", async (req, res) => {
  const gpa = parseFloat(req.body.gpa);

  try {
    await client.connect();
    const result = await lookUpApplicationsByGPA(client, databaseAndCollection, gpa);
    const gfaTable = { gfaTable: generateApplicationTable(result) };
    res.render("processAdminGFA", gfaTable);
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
});

// Route to render the form to remove all applications
app.get("/adminRemove", (req, res) => {
  const URL = { URL: homeURL + "/processAdminRemove" };
  res.render("adminRemove", URL);
});

// Route to remove all applications from the database
app.post("/processAdminRemove", async (req, res) => {
  try {
    await client.connect();
    const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).deleteMany({});
    const removed = { removed: result.deletedCount };
    res.render("processAdminRemove", removed);
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
});

// Start the server and set up shutdown commands
server.listen(portNumber, (err) => {
  if (err) {
    process.stdout.write("Starting server failed.");
  } else {
    process.stdout.write(`Web server started and running at ${homeURL}\n`);
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
        }
      }
    });
  }
});

// Function to insert a new application into the database
async function insertApplication(client, databaseAndCollection, newApplication) {
  const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(newApplication);
}

// Function to find one application based on email
async function lookUpOneApplication(client, databaseAndCollection, email) {
  const filter = { email: email };
  const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).findOne(filter);
  return result || console.log(`No application found with email ${email}`);
}

// Function to find applications with GPA greater than or equal to a specified value
async function lookUpApplicationsByGPA(client, databaseAndCollection, gpa) {
  const filter = { gpa: { $gte: gpa } };
  const cursor = client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).find(filter);
  return await cursor.toArray();
}

// Helper function to generate an HTML table from applications
function generateApplicationTable(applications) {
  let table = '<table border="2">';
  table += "<tr><th>Name</th><th>GPA</th></tr>";
  applications.forEach((application) => {
    table += `<tr><td>${application.name}</td><td>${application.gpa}</td></tr>`;
  });
  table += "</table>";
  return table;
}
