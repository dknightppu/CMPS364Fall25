import express, { Request, Response } from "express";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const uri = process.env.MONGODB_URI as string;
const dbName = process.env.DB_NAME as string;

const client = new MongoClient(uri);
app.use(express.json());

// Home route
app.get("/", (req: Request, res: Response) => {
  res.send("✅ MongoDB API is running!");
});

// GET all documents
app.get("/grails", async (req: Request, res: Response) => {
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection("grails");
    const sneakers = await collection.find().toArray();
    res.status(200).json(sneakers);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving sneakers", error });
  } finally {
    await client.close();
  }
});

// GET by ID
app.get("/grails/:id", async (req: Request, res: Response) => {
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection("grails");

    const id = parseInt(req.params.id);
    const sneaker = await collection.findOne({ _id: { $eq: id } as any });

    if (!sneaker) {
      res.status(404).json({ message: "Sneaker not found" });
    } else {
      res.status(200).json(sneaker);
    }
  } catch (error) {
    res.status(500).json({ message: "Error fetching sneaker by ID", error });
  } finally {
    await client.close();
  }
});

// POST new sneaker
app.post("/grails", async (req: Request, res: Response) => {
  const sneaker = req.body;
  console.log("📦 Incoming sneaker data:", sneaker);

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection("grails");

    const result = await collection.insertOne(sneaker);
    console.log("✅ Insert result:", result);

    res.status(201).json({
      message: "✅ New sneaker added successfully!",
      insertedId: result.insertedId,
    });
  } catch (err) {
    console.error("❌ Error inserting sneaker:", err);
    res.status(500).json({ error: "❌ Could not create new sneaker" });
  } finally {
    await client.close();
  }
});

// DELETE all sneakers (purge)
app.delete("/grails", async (req: Request, res: Response) => {
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection("grails");

    const result = await collection.deleteMany({});
    res.status(200).json({
      message: "🗑️ Purge completed",
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error("Error deleting documents:", error);
    res.status(500).json({ error: "❌ Could not purge documents" });
  } finally {
    await client.close();
  }
});


// Catch-all route (MOVED TO BOTTOM)
app.use((req, res) => {
  res.status(404).send(`Route not found: ${req.originalUrl}`);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
