import { AuditLog } from "../models/AuditLog.js";

export async function recordAuditLog({ req, action, entity, entityId, before, after }) {
  try {
    await AuditLog.create({
      actor: req.user?._id,
      action,
      entity,
      entityId,
      before,
      after,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
  } catch (err) {
    // Auditing should never break the primary request
    console.error("[auditLog] failed to record:", err.message);
  }
}
