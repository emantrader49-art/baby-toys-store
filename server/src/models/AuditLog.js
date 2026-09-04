import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId },
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed,
    ip: String,
    userAgent: String,
  },
  { timestamps: true }
);

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
