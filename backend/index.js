import express from "express"
import cors from "cors"
import fs from "fs"
import path from "path"
import "dotenv/config"

const app = express()
app.use(cors())
app.use(express.json())

const DATA_DIR = path.resolve("./data")
const USERS_FILE = path.join(DATA_DIR, "users.json")

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(
    USERS_FILE,
    JSON.stringify([{ id: "1", email: "demo@petquest.test", password: "password", role: "child", name: "Demo Kid" }], null, 2)
  )
}

function readUsers() {
  try { return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8")) } catch { return [] }
}
function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))
}

app.get("/", (_req, res) => res.json({ ok: true, name: "PetQuest API" }))

app.post("/auth/signup", (req, res) => {
  const { email, password, role = "child", name = "" } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: "Email and password required" })
  const users = readUsers()
  if (users.find(u => u.email === email)) return res.status(409).json({ error: "Email already exists" })
  const id = String(Date.now())
  const user = { id, email, password, role, name }
  users.push(user)
  writeUsers(users)
  const token = `demo-${id}`
  res.json({ token, user: { id, email, role, name } })
})

app.post("/auth/login", (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: "Email and password required" })
  const users = readUsers()
  const found = users.find(u => u.email === email && u.password === password)
  if (!found) return res.status(401).json({ error: "Invalid credentials" })
  const token = `demo-${found.id}`
  const { id, role, name } = found
  res.json({ token, user: { id, email, role, name } })
})

app.post("/auth/forgot-password", (req, res) => {
  const { email } = req.body || {}
  if (!email) return res.status(400).json({ error: "Email required" })
  res.json({ ok: true, message: "If that email exists, a reset link was sent." })
})

function auth(req, res, next) {
  const auth = req.headers.authorization || ""
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null
  if (!token || !token.startsWith("demo-")) return res.status(401).json({ error: "Unauthorized" })
  req.userId = token.replace("demo-", "")
  next()
}

app.get("/me", auth, (req, res) => {
  const users = readUsers()
  const u = users.find(x => x.id === req.userId)
  if (!u) return res.status(404).json({ error: "User not found" })
  const { id, email, role, name } = u
  res.json({ id, email, role, name })
})

const port = process.env.PORT || 3000
app.listen(port, () => console.log(`API listening on http://localhost:${port}`))
