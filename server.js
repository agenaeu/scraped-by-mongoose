const express = require("express");
const logger = require("morgan");
const mongoose = require("mongoose");
// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
const axios = require('axios');
const cheerio = require('cheerio');

// Require all models
const db = require("./models");

const PORT = 3000;

// Initialize express
const app = express();
// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));


const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

// Routes

// A GET route for scraping the echoJS website
app.get("/scrape", function (req, res) {

    // First, we grab the body of the html with axios
    axios.get("https://www.space.com/science-astronomy").then(function (response) {
        // Then, we load that into cheerio and save it to $ for a shorthand selector
        const $ = cheerio.load(response.data);

        // Save an empty result object  
        let result = {};
       
        // Add the text and href of every link, and save them as properties of the result object
            $("div.pure-u-3-4").each(function (i, element) {
                //console.log(element);
                //console.log($(element).children("a").text());
                //console.log($(element).children("a").attr("href"));
                let title = $(element).children("h2").children("a").text();
                let href = $(element).children("h2").children("a").attr("href");
                let summary = $(element).children("p").text();
               
                result.title = title;
                result.summary = summary;
                result.link = `https://www.space.com/${href}`;
                

            
            

            // Create a new Article using the `result` object built from scraping
            db.Article.create(result)
                .then(function (dbArticle) {
                    // View the added result in the console
                    //console.log(dbArticle);
                })
                .catch(function (err) {
                    // If an error occurred, log it
                    console.log(err);
                });
        });

        // Send a message to the client
        res.send('scrape finished');
    });
});

// Route for getting all Articles from the db
app.get("/articles", function (req, res) {
    // Grab every document in the Articles collection
    db.Article.find({})
        .then(function (dbArticle) {
            // If we were able to successfully find Articles, send them back to the client
            res.json(dbArticle);
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});

// Route for retrieving all Notes from the db
app.get("/note", function (req, res) {
    // Find all Notes
    db.Note.find({})
        .then(function (dbNote) {
            // If all Notes are successfully found, send them back to the client
            res.json(dbNote);
        })
        .catch(function (err) {
            // If an error occurs, send the error back to the client
            res.json(err);
        });
});

// Route for saving a new Note to the db and associating it with a User
app.post("/submit", function (req, res) {
    // Create a new Note in the db
    db.Note.create(req.body)
        .then(function (dbNote) {
            // If a Note was created successfully, find one User (there's only one) and push the new Note's _id to the User's `notes` array
            // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
            // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
            return db.Article.findOneAndUpdate({}, { $push: { note: dbNote._id } }, { new: true });
        })
        .then(function (dbUser) {
            // If the User was updated successfully, send it back to the client
            res.json(dbUser);
        })
        .catch(function (err) {
            // If an error occurs, send it back to the client
            res.json(err);
        });
});

app.get("/populatedArticle", function (req, res) {
    // Find all users
    db.Article.find({})
        // Specify that we want to populate the retrieved users with any associated notes
        .populate("note")
        .then(function (dbArticle) {
            // If able to successfully find and associate all Users and Notes, send them back to the client
            res.json(dbArticle);
        })
        .catch(function (err) {
            // If an error occurs, send it back to the client
            res.json(err);
        });
});


// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function (req, res) {
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    db.Article.findOne({ _id: req.params.id })
        // ..and populate all of the notes associated with it
        .populate("note")
        .then(function (dbArticle) {
            // If we were able to successfully find an Article with the given id, send it back to the client
            res.json(dbArticle);
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});

// Route for saving/updating an Article's associated comment
app.post("/articles/:id", function (req, res) {
    // Create a new note and pass the req.body to the entry
    db.Note.create(req.body)
        .then(function (dbNote) {
            // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
            // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
            // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
            return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
        })
        .then(function (dbArticle) {
            // If we were able to successfully update an Article, send it back to the client
            res.json(dbArticle);
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});

// Start the server
app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});


