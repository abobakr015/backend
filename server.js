import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import Admin from "./models/Admin.js";
import Conversion from "./models/Conversion.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI).then(() => console.log("✅ MongoDB connected"));

// تخزين الأسعار في الذاكرة
let rates = {};

// دالة لتحديث الأسعار
async function updateRates() {
  try {
    const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
    const data = await response.json();
    rates = data.rates;
    console.log("✅ Rates updated:", rates);
  } catch (error) {
    console.error("❌ Failed to update rates:", error.message);
  }
}
setInterval(updateRates, 60 * 1000);
updateRates();

// نقطة جلب الأسعار
app.get("/rates", (req, res) => {
  res.json({
    USD_SYP: rates.SYP,
    USD_TRY: rates.TRY,
    SYP_TRY: rates.TRY / rates.SYP
  });
});

// حاسبة التحويل
app.post("/convert", (req, res) => {
  const { from, to, amount } = req.body;
  if (!rates[from] || !rates[to]) return res.status(400).json({ error: "Invalid currency" });
  const result = (amount / rates[from]) * rates[to];
  res.json({ result });
});

// تسجيل الدخول للأدمن
app.post("/admin/login", async (req, res) => {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ email });
  if (!admin) return res.status(401).json({ success: false, message: "Invalid credentials" });
  const valid = await bcrypt.compare(password, admin.password_hash);
  if (!valid) return res.status(401).json({ success: false, message: "Invalid credentials" });
  const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: "12h" });
  res.json({ success: true, token });
});

// middleware للتحقق من التوكن
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token provided" });
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid token" });
    req.adminId = decoded.id;
    next();
  });
}

// إنشاء أدمن جديد
app.post("/admin/create", authMiddleware, async (req, res) => {
  const { email, password, name, avatar } = req.body;
  const existing = await Admin.findOne({ email });
  if (existing) return res.status(409).json({ success: false, message: "Admin already exists" });
  const hash = await bcrypt.hash(password, 10);
  const newAdmin = new Admin({
    email,
    password_hash: hash,
    name,
    avatar,
    created_by: req.adminId
  });
  await newAdmin.save();
  res.json({ success: true });
});

// بيانات الأدمن الحالي
app.get("/admin/me", authMiddleware, async (req, res) => {
  const admin = await Admin.findById(req.adminId).populate("created_by", "email name");
  res.json(admin);
});

// قائمة كل الأدمن
app.get("/admin/list", authMiddleware, async (req, res) => {
  const admins = await Admin.find().populate("created_by", "email name");
  res.json(admins);
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
