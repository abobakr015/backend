import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  name: { type: String, default: "Admin" },
  avatar: { type: String, default: "https://ui-avatars.com/api/?name=Admin" },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model("Admin", adminSchema);
