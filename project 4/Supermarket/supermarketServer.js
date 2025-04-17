

if (process.argv.length !== 3) {
    console.error("Usage supermarketServer.js jsonFile");
    process.exit(1);
  }
// Import required modules
const express = require("express");  // Framework for creating a web server
const fs = require('fs');            // File system module to handle file operations
const Filepath = require("path");    // Path module to handle and transform file paths
const Parser = require("body-parser");  // Middleware to parse incoming request bodies

// Define ServerConfig class to encapsulate the port number
class ServerConfig {
    #port;  // Private variable to store the port number

    constructor(port) {
        this.#port = port;
    }

    getPort() {
        return this.#port;
    }
}

// Initialize server configuration with port number
const config = new ServerConfig(5000);  // Port number for the server

// Initialize an Express application
const Expapp = express();

// Middleware to parse URL-encoded data from the body of HTTP requests
Expapp.use(Parser.urlencoded({ extended: false }));

// Read data from file specified in command line arguments and parse it as JSON
const filename = process.argv[2].toString();  // Get filename from command line arguments
const filecontents = fs.readFileSync(filename, 'utf-8');  // Read file contents
const JSONdata = JSON.parse(filecontents);  // Parse JSON data
const itemsList = JSONdata.itemsList;  // Access the itemsList array from parsed data

// Set up the view engine and views directory
Expapp.set("views", Filepath.resolve(__dirname, "templates"));  // Define the directory for template files
Expapp.set("view engine", "ejs");  // Use EJS as the template engine

// Define routes for handling HTTP GET and POST requests

// Route for the home page
Expapp.get("/", (request, response) => { 
    response.render("index");  // Render the index.ejs template
});

// Route for displaying the catalog of items
Expapp.get("/catalog", (request, response) => {
    response.render("displayItems", { itemsTable: HTMLList(itemsList) });  // Render table of items
});

// Route for the order form page
Expapp.get("/order", (request, response) => {
    response.render("placeOrder", { items: dropdown(itemsList) });  // Render dropdown of items
});



// Route for handling order form submission and confirmation
Expapp.post("/order", (request, response) => { 
    response.render("orderConfirmation", {
        name: request.body.name,                   // Customer name
        email: request.body.email,                 // Customer email
        delivery: request.body.delivery,           // Delivery option
        orderTable: calculateTotal(request.body.itemsSelected, itemsList)  // Table with selected items and total cost
    });
});

// Helper function to create an HTML table from items list
function HTMLList(list) {
    let table = "<table border=\"2\">";
    table += "<tr><th>Item</th><th>Cost</th></tr>";
    list.forEach(item => {
      table += `<tr><th>${item.name}</th><th>${item.cost.toFixed(2)}</th></tr>`;
    });
    table += "</table>"
    return table;  // Return the completed HTML table
}

// Helper function to create an HTML select dropdown from items list
function dropdown(list) {
    return list.map(element => `<option value="${element.name}">${element.name}</option>`).join('');
}

// Helper function to calculate the total cost for selected items and create a table for order confirmation
function calculateTotal(selected, list) {
    let table = "<table border='1'><tr><th>Item</th><th>Cost</th></tr>";
    let total = 0;
    String(selected).split(",").forEach(name => {
        const found = list.find(item => item.name === name);
        if (found) {
            total += Number(found.cost);  // Add item cost to total
            table += `<tr><td>${found.name}</td><td>${found.cost}</td></tr>`;
        }
    });
    table += `<tr><td>Total Cost:</td><td>${total}</td></tr>`;  // Add total row to table
    return table + "</table>";  // Return the completed HTML table with total cost
}

// Start the server and listen on the port retrieved from the ServerConfig class
Expapp.listen(config.getPort());

// Start the server and display a prompt in the console
console.log(`Web Server started and running at http://localhost:${config.getPort()}`);
const lastprompt = "Type itemsList or stop to shutdown the server: ";
process.stdout.write(lastprompt);

// Command line input handling for stopping the server or displaying itemsList
process.stdin.setEncoding("utf8");
process.stdin.on('readable', () => {
    let inputCmd = process.stdin.read();
    if (inputCmd !== null) {
        let cmd = inputCmd.trim();
        switch (cmd) {
            case "stop":
                console.log("Shutting down the server");
                process.exit(0);  // Exit the server
                break;
            case "itemsList":
                console.log(itemsList);  // Print items list to the console
                break;
            default:
                console.log(`Invalid command: ${cmd}`);
                break;
        }
        process.stdout.write(lastprompt);  // Show prompt again after handling command
        process.stdin.resume();
    }
});
