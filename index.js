const express = require("express");
const { Pool } = require("pg");
const { MongoClient } = require("mongodb");

const app = express();
const PORT = 3000;

app.use(express.json());

// Postgres connection
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "QAP3",
  password: "wall.11",
  port: 5432,
});

// MongoDB Connection
const mongoUri = "mongodb://localhost:27017";
const mongoClient = new MongoClient(mongoUri);
const mongoDbName = "books";
let booksCollection;

// connect and initialize mongodb and books
async function connectMongoDB() {
  try {
    await mongoClient.connect(); // should allow u to connect i think

    const db = mongoClient.db(mongoDbName);
    booksCollection = db.collection("books");

    // Ensure the collection exists
    await booksCollection.createIndex({ title: 1 }, { unique: true });
    console.log("Books collection ready");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

// table creation
async function createRequiredTable() {
  try {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            description TEXT NOT NULL,
            status VARCHAR(50) NOT NULL);`);
    console.log("Tasks table created successfully");
  } catch (error) {
    console.error("Error creating tasks table..", error);
  }
}

async function initialize() {
  await connectMongoDB();
  await createRequiredTable();
}

// ENDPOINTS

// GET /tasks - Get all tasks
app.get("/tasks", async (request, response) => {
  try {
    const result = await pool.query("SELECT * FROM tasks;");
    response.json(result.rows);
  } catch (error) {
    console.error(error);
    response.status(500).send("Server error");
  }
});

// POST /tasks - Add a new task
app.post("/tasks", async (request, response) => {
  const { description, status } = request.body;

  try {
    const result = await pool.query(
      "INSERT INTO tasks (description, status) VALUES ($1, $2) RETURNING *;",
      [description, status]
    );
    response.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    response.status(500).send("Server error");
  }
});

// PUT /tasks/:id - Update a task's status
app.put("/tasks/:id", async (request, response) => {
  const taskId = parseInt(request.params.id, 10);
  const { status } = request.body;

  try {
    const result = await pool.query(
      "UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *;",
      [status, taskId]
    );

    if (result.rows.length === 0) {
      return response.status(404).send("Task not found");
    }

    response.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    response.status(500).send("Server error");
  }
});

// DELETE /tasks/:id - Delete a task
app.delete("/tasks/:id", async (request, response) => {
  const taskId = parseInt(request.params.id, 10);

  try {
    const result = await pool.query(
      "DELETE FROM tasks WHERE id = $1 RETURNING *;",
      [taskId]
    );
    if (result.rows.length === 0) {
      return response.status(404).send({ error: "Task not found" });
    }

    response.json({
      message: "Task deleted successfully",
      task: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    response.status(500).send("Server error");
  }
});

initialize().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
});
