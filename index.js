/**
 * @fileoverview Fichier principal pour le serveur web utilisant Express.
 * @module index
 */

import express from "express";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

app.use(bodyParser.json());

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["formateur", "etudiant"]),
});

/**
 * Middleware pour authentifier les requêtes utilisant JWT.
 * @function
 * @param {Object} req - L'objet de requête.
 * @param {Object} res - L'objet de réponse.
 * @param {Function} next - La fonction next pour passer au middleware suivant.
 */
const authenticateJWT = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(403).send("Access Denied");
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).send("Invalid Token");
    console.log("middleware :", user);
    req.user = user;
    next();
  });
};

/**
 * Route pour l'inscription d'un nouvel utilisateur.
 * @name POST/auth/signup
 * @function
 * @param {Object} req - L'objet de requête.
 * @param {Object} res - L'objet de réponse.
 */
app.post("/auth/signup", async (req, res) => {
  try {
    const { name, email, password, role } = userSchema.parse(req.body);
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, role]
    );
    res.status(201).send("User registered successfully");
  } catch (err) {
    res.status(400).send(err.message);
  }
});

/**
 * Route pour la connexion d'un utilisateur.
 * @name POST/auth/login
 * @function
 * @param {Object} req - L'objet de requête.
 * @param {Object} res - L'objet de réponse.
 */
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).send("Invalid email or password");
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "1h",
    });
    res.status(200).json({ token });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * Route pour créer une nouvelle session.
 * Accessible uniquement aux formateurs.
 * @name POST/sessions
 * @function
 * @param {Object} req - L'objet de requête.
 * @param {Object} res - L'objet de réponse.
 */
app.post("/sessions", authenticateJWT, async (req, res) => {
  if (req.user.role !== "formateur") {
    return res.status(403).send("Access Denied");
  }

  const { title, date } = req.body;
  const formateur_id = req.user.id;
  console.log(formateur_id);
  try {
    await db.query(
      "INSERT INTO sessions (title, date, formateur_id) VALUES (?, ?, ?)",
      [title, date, formateur_id]
    );
    res.status(201).send("Session created successfully");
  } catch (err) {
    res.status(400).send(err.message);
  }
});

/**
 * Route pour récupérer toutes les sessions.
 * @name GET/sessions
 * @function
 * @param {Object} req - L'objet de requête.
 * @param {Object} res - L'objet de réponse.
 */
app.get("/sessions", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM sessions");
    if (rows.length === 0) {
      return res.status(404).send("Session not found");
    }
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * Route pour récupérer une session par ID.
 * @name GET/sessions/:id
 * @function
 * @param {Object} req - L'objet de requête.
 * @param {Object} res - L'objet de réponse.
 */
app.get("/sessions/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query("SELECT * FROM sessions WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).send("Session not found");
    }
    res.status(200).json(rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * Route pour mettre à jour une session par ID.
 * Accessible uniquement aux formateurs.
 * @name PUT/sessions/:id
 * @function
 * @param {Object} req - L'objet de requête.
 * @param {Object} res - L'objet de réponse.
 */
app.put("/sessions/:id", authenticateJWT, async (req, res) => {
  if (req.user.role !== "formateur") {
    return res.status(403).send("Access Denied");
  }

  const { id } = req.params;
  const { title, date } = req.body;
  try {
    await db.query("UPDATE sessions SET title = ?, date = ? WHERE id = ?", [
      title,
      date,
      id,
    ]);
    res.status(200).send("Session updated successfully");
  } catch (err) {
    res.status(400).send(err.message);
  }
});

/**
 * Route pour supprimer une session par ID.
 * Accessible uniquement aux formateurs.
 * @name DELETE/sessions/:id
 * @function
 * @param {Object} req - L'objet de requête.
 * @param {Object} res - L'objet de réponse.
 */
app.delete("/sessions/:id", authenticateJWT, async (req, res) => {
  if (req.user.role !== "formateur") {
    return res.status(403).send("Access Denied");
  }

  const { id } = req.params;
  try {
    await db.query("DELETE FROM sessions WHERE id = ?", [id]);
    res.status(200).send("Session deleted successfully");
  } catch (err) {
    res.status(400).send(err.message);
  }
});

/**
 * Route pour marquer la présence d'un étudiant à une session.
 * Accessible uniquement aux étudiants.
 * @name POST/sessions/:id/emargement
 * @function
 * @param {Object} req - L'objet de requête.
 * @param {Object} res - L'objet de réponse.
 */
app.post("/sessions/:id/emargement", authenticateJWT, async (req, res) => {
  if (req.user.role !== "etudiant") {
    return res.status(403).send("Access Denied");
  }

  const { id } = req.params;
  const status = req.body.status;
  const etudiant_id = req.user.id;
  try {
    await db.query(
      "INSERT INTO emargement (session_id, etudiant_id, status) VALUES (?, ?, ?)",
      [id, etudiant_id, status]
    );
    res.status(201).send("Attendance marked successfully");
  } catch (err) {
    res.status(400).send(err.message);
  }
});

/**
 * Route pour récupérer la liste des présences pour une session.
 * Accessible uniquement aux formateurs.
 * @name GET/sessions/:id/emargement
 * @function
 * @param {Object} req - L'objet de requête.
 * @param {Object} res - L'objet de réponse.
 */
app.get("/sessions/:id/emargement", authenticateJWT, async (req, res) => {
  if (req.user.role !== "formateur") {
    return res.status(403).send("Access Denied");
  }

  const { id } = req.params;
  try {
    const [rows] = await db.query(
      "SELECT * FROM emargement WHERE session_id = ?",
      [id]
    );
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * Démarre le serveur sur le port spécifié.
 * @function
 */
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
