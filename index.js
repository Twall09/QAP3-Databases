const express = require("express");
const { Pool } = require("pg");

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

createRequiredTable();

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
    res.status(500).send("Server error");
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
    res.status(500).send("Server error");
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
    if (result.rows === 0) {
      return res.status(404).send({ error: "Task not found" });
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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
