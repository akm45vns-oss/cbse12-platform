/**
 * Security Audit Logging
 * Tracks security-relevant events for monitoring and forensics
 */

const AUDIT_LOG_KEY = "akmedu_audit_log";
const MAX_LOGS = 1000; // Keep last 1000 audit events
const CRITICAL_EVENTS = [
  "LOGIN_SUCCESS",
  "LOGIN_FAILED",
  "ACCOUNT_LOCKED",
  "PASSWORD_CHANGED",
  "PASSWORD_RESET",
  "UNAUTHORIZED_ACCESS_ATTEMPT",
  "SUSPICIOUS_ACTIVITY",
  "SESSION_EXPIRED",
  "PERMISSION_DENIED",
  "DATA_ACCESS",
  "DATA_MODIFICATION",
  "ACCOUNT_DISABLED",
  "SECURITY_ALERT"
];

/**
 * Log a security event
 * @param {string} eventType - Type of event (from CRITICAL_EVENTS)
 * @param {object} details - Event details
 * @param {string} severity - 'low', 'medium', 'high', 'critical'
 */
export function logSecurityEvent(eventType, details = {}, severity = "low") {
  const event = {
    id: generateEventId(),
    timestamp: Date.now(),
    eventType,
    severity,
    userAgent: navigator.userAgent,
    url: window.location.href,
    details,
    ipInfo: null // Client-side won't have IP, server would add this
  };
  
  // Get current user if available
  try {
    const currentUser = localStorage.getItem("akmedu_currentUser");
    if (currentUser) {
      event.username = currentUser;
    }
  } catch (e) {
    // Ignore
  }
  
  // Store locally
  storeAuditLog(event);
  
  // Log to console for developers
  console.log(`[AUDIT LOG - ${severity.toUpperCase()}]`, event);
  
  // For critical events, could send to server
  if (CRITICAL_EVENTS.includes(eventType) && severity === "critical") {
    sendCriticalEventToServer(event).catch(e => {
      console.error("Failed to send critical event to server:", e);
    });
  }
}

/**
 * Store audit event in browser storage
 * @param {object} event - Event to store
 */
function storeAuditLog(event) {
  try {
    const logs = JSON.parse(localStorage.getItem(AUDIT_LOG_KEY) || "[]");
    
    // Add new event
    logs.push(event);
    
    // Keep only the last MAX_LOGS events
    if (logs.length > MAX_LOGS) {
      logs.splice(0, logs.length - MAX_LOGS);
    }
    
    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error("Error storing audit log:", e);
  }
}

/**
 * Retrieve recent audit logs
 * @param {number} limit - Maximum number of logs to return
 * @param {string} filter - Filter by event type (optional)
 * @returns {array} Audit log entries
 */
export function getAuditLogs(limit = 50, filter = null) {
  try {
    const logs = JSON.parse(localStorage.getItem(AUDIT_LOG_KEY) || "[]");
    
    let filtered = logs;
    if (filter) {
      filtered = logs.filter(log => log.eventType === filter);
    }
    
    // Return most recent first
    return filtered.reverse().slice(0, limit);
  } catch (e) {
    console.error("Error retrieving audit logs:", e);
    return [];
  }
}

/**
 * Clear all audit logs
 * WARNING: This erases security history
 */
export function clearAuditLogs() {
  try {
    localStorage.removeItem(AUDIT_LOG_KEY);
    console.warn("Audit logs cleared");
  } catch (e) {
    console.error("Error clearing audit logs:", e);
  }
}

/**
 * Export audit logs for backup/analysis
 * @returns {string} JSON string of all audit logs
 */
export function exportAuditLogs() {
  try {
    const logs = JSON.parse(localStorage.getItem(AUDIT_LOG_KEY) || "[]");
    return JSON.stringify(logs, null, 2);
  } catch (e) {
    console.error("Error exporting audit logs:", e);
    return "{}";
  }
}

/**
 * Log login attempt
 * @param {string} username - Username
 * @param {boolean} success - Whether login was successful
 * @param {string} reason - Reason if failed
 */
export function logLoginAttempt(username, success, reason = null) {
  logSecurityEvent(
    success ? "LOGIN_SUCCESS" : "LOGIN_FAILED",
    { username, reason },
    success ? "low" : "medium"
  );
}

/**
 * Log account lockout
 * @param {string} username - Username
 * @param {number} attempts - Number of failed attempts
 */
export function logAccountLocked(username, attempts) {
  logSecurityEvent(
    "ACCOUNT_LOCKED",
    { username, failedAttempts: attempts },
    "high"
  );
}

/**
 * Log password change
 * @param {string} username - Username
 * @param {boolean} success - Whether change was successful
 */
export function logPasswordChange(username, success, reason = null) {
  logSecurityEvent(
    success ? "PASSWORD_CHANGED" : "PASSWORD_CHANGE_FAILED",
    { username, reason },
    success ? "low" : "medium"
  );
}

/**
 * Log password reset request
 * @param {string} email - Email address
 */
export function logPasswordResetRequest(email) {
  logSecurityEvent(
    "PASSWORD_RESET",
    { email },
    "medium"
  );
}

/**
 * Log unauthorized access attempt
 * @param {string} resource - What resource was accessed
 * @param {string} reason - Why it was denied
 */
export function logUnauthorizedAccess(resource, reason) {
  logSecurityEvent(
    "UNAUTHORIZED_ACCESS_ATTEMPT",
    { resource, reason },
    "high"
  );
}

/**
 * Log suspicious activity
 * @param {string} description - Description of suspicious activity
 * @param {object} context - Additional context
 */
export function logSuspiciousActivity(description, context = {}) {
  logSecurityEvent(
    "SUSPICIOUS_ACTIVITY",
    { description, context },
    "high"
  );
}

/**
 * Log data access (for GDPR/compliance logging)
 * @param {string} dataType - Type of data accessed
 * @param {string} resource - Resource identifier
 */
export function logDataAccess(dataType, resource) {
  logSecurityEvent(
    "DATA_ACCESS",
    { dataType, resource },
    "low"
  );
}

/**
 * Log data modification
 * @param {string} dataType - Type of data modified
 * @param {string} resource - Resource identifier
 * @param {string} operation - What was changed
 */
export function logDataModification(dataType, resource, operation) {
  logSecurityEvent(
    "DATA_MODIFICATION",
    { dataType, resource, operation },
    "medium"
  );
}

/**
 * Generate unique event ID
 * @returns {string} Event ID
 */
function generateEventId() {
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Send critical security event to server for alerting
 * This would be implemented on the backend
 * @param {object} event - Event to send
 */
async function sendCriticalEventToServer(event) {
  try {
    // This is a placeholder - implement endpoint on your server
    // await fetch("/api/security/log-critical-event", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(event)
    // });
    
    console.log("Critical event would be sent to server:", event);
  } catch (e) {
    console.error("Error sending critical event to server:", e);
  }
}

/**
 * Generate security audit report
 * @returns {object} Audit report
 */
export function generateAuditReport() {
  const logs = JSON.parse(localStorage.getItem(AUDIT_LOG_KEY) || "[]");
  
  const report = {
    totalEvents: logs.length,
    generatedAt: new Date().toISOString(),
    eventTypes: {},
    severities: { low: 0, medium: 0, high: 0, critical: 0 },
    recentEvents: logs.slice(-10),
    suspiciousActivity: logs.filter(
      log => ["ACCOUNT_LOCKED", "UNAUTHORIZED_ACCESS_ATTEMPT", "SUSPICIOUS_ACTIVITY"].includes(log.eventType)
    )
  };
  
  // Count event types
  logs.forEach(log => {
    report.eventTypes[log.eventType] = (report.eventTypes[log.eventType] || 0) + 1;
    report.severities[log.severity] = (report.severities[log.severity] || 0) + 1;
  });
  
  return report;
}
