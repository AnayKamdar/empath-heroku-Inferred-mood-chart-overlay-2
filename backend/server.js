const express = require("express");
const session = require("express-session");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require('path');
const mysql = require("mysql");
require("dotenv").config();

// Routes
const userRoutes = require("./routes/users/users");
const journalRoutes = require("./routes/journals/journals");
const clientRoutes = require("./routes/clients/clients");
const theripistRoutes = require("./routes/therapists/therapists");
const passwordRecoveryRoutes = require("./routes/performPasswordReset/performPasswordReset");
const appleHealthRoutes = require("./routes/appleHealth/appleHealth");
const summaryFeedbackRoutes = require("./routes/summaryFeedback/feedback");

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(cookieParser());

app.use(cors({ origin: [process.env.FRONT_END_URL, process.env.DOMAIN_END_URL], credentials: true }));

app.use(express.static(path.join(__dirname, "../frontend/build")));

app.use(
  session({
    resave: false,
    saveUninitialized: false,
    secret: "session",
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      sameSite: "none",
      secure: true,
    },
  })
);

app.use((err, req, res, next) => {
  console.error("Error occurred:", err.message);
  console.error("Stack trace:", err.stack);
  // Optionally log other properties of the error object
  if (err.customProperty) console.error("Custom property:", err.customProperty);

  res.status(500).send("Something went wrong!");
});

app.use((req, res, next) => {
  console.log("Request received!");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  next();
});

// Mount routes
app.use("/api/users", userRoutes);
app.use("/api/journals", journalRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/therapists", theripistRoutes);
app.use("/api/passwordRecovery", passwordRecoveryRoutes);
app.use("/api/appleHealth", appleHealthRoutes);
app.use("/api/summaryFeedback", summaryFeedbackRoutes);

// MySQL connection pool
const pool = require("./db");

// Check connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error("Error getting a connection:", err);
    return;
  }

  connection.query("SELECT NOW()", (err, results) => {
    if (err) {
      console.error("Error querying the database:", err);
    } else {
      console.log(
        "Connected to the database. Current date:",
        results[0]["NOW()"]
      );
    }

    connection.release();
  });
});

// Fallback route should be last
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build/index.html"));
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
