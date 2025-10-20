import fs from "fs"
import path from "path"

const DATA_DIR = path.resolve("./data")
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

const FILES = {
  users:        path.join(DATA_DIR, "users.json"),
  pets:         path.join(DATA_DIR, "pets.json"),
  accessories:  path.join(DATA_DIR, "accessories.json"),
  inventory:    path.join(DATA_DIR, "inventory.json"),
  tasks:        path.join(DATA_DIR, "tasks.json"),
}

function readJSON(p, fallback = []) {
  try { return JSON.parse(fs.readFileSync(p, "utf-8")) } catch { return fallback }
}
function writeJSON(p, val) {
  fs.writeFileSync(p, JSON.stringify(val, null, 2))
}

// seed
if (!fs.existsSync(FILES.users)) {
  writeJSON(FILES.users, [
    { id: "1", email: "demo@petquest.test", password: "password", role: "indv", name: "Demo User" }
  ])
}
if (!fs.existsSync(FILES.pets)) {
  writeJSON(FILES.pets, [
    { id: "pet1", userId: "1", name: "Mochi", type: "cat", equipped: [] },
    { id: "pet2", userId: "1", name: "Boba",  type: "dog", equipped: [] },
  ])
}
if (!fs.existsSync(FILES.accessories)) {
  writeJSON(FILES.accessories, [
    { id: "acc1", name: "Red Bow",     slot: "head", price: 10 },
    { id: "acc2", name: "Cool Shades", slot: "eyes", price: 15 },
    { id: "acc3", name: "Blue Scarf",  slot: "neck", price: 12 },
    { id: "acc4", name: "Gold Collar", slot: "neck", price: 25 },
  ])
}
if (!fs.existsSync(FILES.inventory)) {
  writeJSON(FILES.inventory, [{ userId: "1", accessories: ["acc1"], coins: 100 }])
}
if (!fs.existsSync(FILES.tasks)) {
  writeJSON(FILES.tasks, [
    { id: "t1", userId: "1", title: "Feed Mochi", date: new Date().toISOString().slice(0,10), done: false }
  ])
}

// inventory helpers
function getInventory(userId) {
  const all = readJSON(FILES.inventory)
  let rec = all.find(r => r.userId === userId)
  if (!rec) { rec = { userId, accessories: [], coins: 100 }; all.push(rec); writeJSON(FILES.inventory, all) }
  return rec
}
function saveInventory(rec) {
  const all = readJSON(FILES.inventory)
  const i = all.findIndex(r => r.userId === rec.userId)
  if (i === -1) all.push(rec); else all[i] = rec
  writeJSON(FILES.inventory, all)
}

export const DB = {
  FILES,
  readJSON, writeJSON,
  getInventory, saveInventory,
}
