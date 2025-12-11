require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const Book = require("./models/Book");

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// DB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("DB Error:", err));

// Simple home route (optional UI later)
app.get("/", (req, res) => {
  res.send("📚 Library Book Tracker API is running");
});

/* 1) ADD BOOK
   Body example:
   {
     "title": "1984",
     "author": "George Orwell",
     "genre": "Fiction",
     "publicationYear": 1949,
     "available": true
   }
*/
app.post("/books", async (req, res) => {
  try {
    const { title, author, genre, publicationYear, available } = req.body;

    const newBook = await Book.create({
      title,
      author,
      genre,
      publicationYear,
      available
    });

    res.status(201).json({
      message: "✅ New book added",
      book: newBook
    });
  } catch (err) {
    console.error("Error adding book:", err);
    res.status(500).json({ error: "Error adding book" });
  }
});

// 2) QUERY ALL BOOKS
app.get("/books", async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (err) {
    console.error("Error fetching books:", err);
    res.status(500).json({ error: "Error fetching books" });
  }
});

// 3) FIND BOOKS BY GENRE (e.g. /books/genre/Fiction)
app.get("/books/genre/:genre", async (req, res) => {
  try {
    const genre = req.params.genre;
    const books = await Book.find({ genre });

    res.json(books);
  } catch (err) {
    console.error("Error fetching by genre:", err);
    res.status(500).json({ error: "Error fetching by genre" });
  }
});

// 4) SEARCH BOOK BY TITLE (e.g. /books/title/1984)
app.get("/books/title/:title", async (req, res) => {
  try {
    const title = req.params.title;
    const book = await Book.findOne({ title });

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.json(book);
  } catch (err) {
    console.error("Error searching by title:", err);
    res.status(500).json({ error: "Error searching by title" });
  }
});

// 5) UPDATE BOOK DETAILS – UPDATE GENRE (and optionally availability)
app.put("/books/:id", async (req, res) => {
  try {
    const { genre, available, publicationYear, title, author } = req.body;

    const result = await Book.updateOne(
      { _id: req.params.id },
      {
        $set: {
          ...(genre && { genre }),
          ...(typeof available === "boolean" && { available }),
          ...(publicationYear && { publicationYear }),
          ...(title && { title }),
          ...(author && { author })
        }
      }
    );

    res.json(result); // matches expected { acknowledged, matchedCount, modifiedCount }
  } catch (err) {
    console.error("Error updating book:", err);
    res.status(500).json({ error: "Error updating book" });
  }
});

// 6) DELETE A BOOK
app.delete("/books/:id", async (req, res) => {
  try {
    const result = await Book.deleteOne({ _id: req.params.id });
    res.json(result); // { acknowledged, deletedCount }
  } catch (err) {
    console.error("Error deleting book:", err);
    res.status(500).json({ error: "Error deleting book" });
  }
});

// 7) ADD AVAILABILITY FIELD TO ALL EXISTING BOOKS (one-time helper)
// Call: POST /books/fix-availability
app.post("/books/fix-availability", async (req, res) => {
  try {
    const result = await Book.updateMany(
      { available: { $exists: false } },
      { $set: { available: true } }
    );

    res.json(result);
  } catch (err) {
    console.error("Error adding availability:", err);
    res.status(500).json({ error: "Error adding availability" });
  }
});

// 8) SEARCH BOOKS PUBLISHED BEFORE A YEAR (e.g. /books/before/1989)
app.get("/books/before/:year", async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    const books = await Book.find({ publicationYear: { $lt: year } });

    res.json(books);
  } catch (err) {
    console.error("Error fetching books before year:", err);
    res.status(500).json({ error: "Error fetching books" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
