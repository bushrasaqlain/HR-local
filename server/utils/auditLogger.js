// server/utils/auditLogger.js
const connection = require("../connection");

function logAudit({ tableName, entityType, entityId, action, data, changedBy }, callback) {
  if (!tableName) {
    console.error("❌ No table name provided for audit log.");
    if (callback) callback(new Error("Table name required"));
    return;
  }

  const auditQuery = `
    INSERT INTO ${tableName}
      (entity_type, entity_id, action, data, changed_by)
    VALUES (?, ?, ?, ?, ?)
  `;

  connection.query(
    auditQuery,
    [
      entityType,
      entityId,
      action, // e.g. "add" | "update" | "delete"
      JSON.stringify(data),
      changedBy || null,
    ],
    (err, result) => {
      if (err) {
        console.error("❌ Audit log insert failed:", err);
        if (callback) callback(err);
        return;
      }
      if (callback) callback(null, result);
    }
  );
}

module.exports = logAudit;