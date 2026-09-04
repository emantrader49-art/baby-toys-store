import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    description: String,
    parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
    image: String,
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Category = mongoose.model("Category", categorySchema);
