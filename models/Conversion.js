import mongoose from "mongoose";

const conversionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
  from_currency: { type: String, required: true },
  to_currency: { type: String, required: true },
  amount: { type: Number, required: true },
  result: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

export default mongoose.model("Conversion", conversionSchema);
