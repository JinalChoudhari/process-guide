const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "process_guide"
});

db.connect(err => {
  if (err) throw err;
  console.log("Connected to MySQL");
});

// TEST API
app.get("/api/processes", (req, res) => {
  db.query(`
    SELECT 
      process_id AS id,
      title AS name,
      description,
      category,
      created_at
    FROM processes
  `, (err, results) => {
    if (err) {
      console.log("MYSQL ERROR:", err);
      return res.status(500).json(err);
    }
    res.json(results);
  });
});



app.listen(5000, () => {
  console.log("Server running on port 5000");
});
