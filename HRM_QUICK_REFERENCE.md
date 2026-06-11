# HRM System - Quick AI Reference & Commands

## 🚀 Quick Start for AI-Assisted Development

### Using This System for New Projects

**Copy This Prompt When Starting New Company HRM:**

```
You are building an HRM (Human Resource Management) System similar to a 
proven production system. Here's the complete architecture:

STACK:
- Backend: Node.js + Express 5.1.0, MySQL2, JWT Auth, Socket.io
- Frontend: React 19 + Router v7, Tailwind CSS, Axios, Socket.io-client
- Database: MySQL 8.0+ with 40+ tables
- Real-time: WebSocket via Socket.io for chat/notifications
- Security: JWT + Session auth, RBAC (50+ permissions), Bcryptjs hashing

CORE MODULES:
1. Employee Management - CRUD, documents, avatars, timelines
2. Attendance - Check-in/out, biometric (Face-API), GPS, reports
3. Leave Management - Requests, approvals, balance tracking
4. Performance - Appraisals, KPIs, review cycles
5. Payroll - Salary structure, allowances, payslips
6. Permissions - Dynamic RBAC with granular controls
7. Chat & Notifications - Real-time messaging, push notifications
8. News - Company announcements with reactions/comments
9. Audit - Compliance logging for all actions
10. Office - Location management, requisitions
11. Gamification - Points system and leaderboards
12. Settings - Branding and system configuration

FOLDER STRUCTURE:
Backend: Controller/ (business logic), Routes/ (endpoints), Utils/ (helpers),
Middleware/ (auth/upload), database/ (migrations)
Frontend: features/ (modules), components/ (UI), context/ (state), hooks/ (custom)

KEY FILES:
- Backend: server.js (main), db.js (MySQL pool), Login.js (auth)
- Frontend: App.js (routing), AuthContext.js (state)

AUTHENTICATION:
JWT tokens + MySQL sessions, bcryptjs password hashing, role-based access control

Now build [specific feature/module] following this exact architecture.
```

---

## 🔑 Key Implementation Patterns

### Pattern 1: Creating New API Endpoint

```javascript
// backend/Controller/ModuleName/ModuleController.js
const { pool } = require("../../Utils/db");
const { recordLog } = require("../../Utils/AuditUtils");

const getModuleData = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM table_name WHERE condition = ?",
      [value]
    );
    
    await recordLog({
      action: "Module data retrieved",
      category: "Module",
      status: "Success"
    });
    
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = { getModuleData };
```

### Pattern 2: Adding New Route

```javascript
// In backend/Routes/Route.js
const ModuleController = require("../Controller/ModuleName/ModuleController");

// Add route
router.get("/module/data", ModuleController.getModuleData);
router.post("/module/create", ModuleController.createModule);
```

### Pattern 3: Creating React Feature Component

```javascript
// frontend/src/features/modulename/ModulePage.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const ModulePage = () => {
  const { user, token } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/module/data", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      {data.map((item) => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
};

export default ModulePage;
```

### Pattern 4: Database Migration

```sql
-- database/migrations/2026_04_20_new_feature.sql
CREATE TABLE IF NOT EXISTS new_table (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  field_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employee_records(id) ON DELETE CASCADE
);

ALTER TABLE employee_records ADD COLUMN new_field VARCHAR(100);

CREATE INDEX idx_employee_id ON new_table(employee_id);
```

### Pattern 5: Socket.io Event Handling

```javascript
// Backend: server.js
io.on("connection", (socket) => {
  socket.on("new_message", async (data) => {
    // Save to database
    const [result] = await pool.execute(
      "INSERT INTO chat_messages (from_id, to_id, message) VALUES (?, ?, ?)",
      [data.fromId, data.toId, data.message]
    );
    
    // Broadcast to recipient
    io.to(`user_${data.toId}`).emit("message_received", {
      id: result.insertId,
      from: data.fromId,
      message: data.message,
      timestamp: new Date()
    });
  });
});
```

---

## 🛠️ Common Tasks & Solutions

### Task: Add Permission to Feature

1. Insert in database:
```sql
INSERT INTO permissions (permission_name, category) 
VALUES ('can_export_report', 'Reports');
```

2. Add to role:
```sql
INSERT INTO role_permissions (role_id, permission_id) 
SELECT (SELECT id FROM users_roles WHERE name='HR'), id 
FROM permissions WHERE permission_name='can_export_report';
```

3. Check in backend:
```javascript
if (!user.permissions.includes('can_export_report')) {
  return res.status(403).json({ message: "Access denied" });
}
```

### Task: Add Field to Employee

1. Migration:
```sql
ALTER TABLE employee_records ADD COLUMN employment_type VARCHAR(50);
```

2. Update controller:
```javascript
const updateEmployee = async (req, res) => {
  const { id } = req.params;
  const { employment_type } = req.body;
  await pool.execute(
    "UPDATE employee_records SET employment_type = ? WHERE id = ?",
    [employment_type, id]
  );
  res.json({ message: "Updated" });
};
```

3. Update frontend form

### Task: Create Custom Report

1. Create API endpoint in ReportController
2. Query database with filters
3. Generate Excel/PDF using xlsx or puppeteer
4. Stream file to client
5. Create React component with filters

### Task: Add Real-time Notification

1. Emit Socket event from backend:
```javascript
io.to(`user_${userId}`).emit("notification", { title, message });
```

2. Listen in frontend:
```javascript
socket.on("notification", (data) => {
  showToast(data.message);
});
```

---

## 🗄️ Common SQL Queries

### Get Employee with Role Permissions
```sql
SELECT 
  e.*, 
  u.user_role,
  GROUP_CONCAT(p.permission_name) as permissions
FROM employee_records e
LEFT JOIN users_roles u ON e.id = u.employee_id
LEFT JOIN role_permissions rp ON u.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
WHERE e.id = ?
GROUP BY e.id;
```

### Get Attendance Summary
```sql
SELECT 
  Employee_ID,
  DATE(Date) as AttendanceDate,
  COUNT(*) as Days,
  SUM(CASE WHEN Status='Present' THEN 1 ELSE 0 END) as Present,
  SUM(CASE WHEN Status='Absent' THEN 1 ELSE 0 END) as Absent
FROM attendance
WHERE DATE(Date) BETWEEN ? AND ?
GROUP BY Employee_ID, DATE(Date);
```

### Get Leave Balance
```sql
SELECT 
  e.id,
  e.Employee_Name,
  lt.leave_type,
  lb.total_leaves,
  COALESCE(SUM(CASE WHEN l.status='Approved' THEN l.days ELSE 0 END), 0) as used,
  lb.total_leaves - COALESCE(SUM(CASE WHEN l.status='Approved' THEN l.days ELSE 0 END), 0) as remaining
FROM employee_records e
JOIN leave_types lt ON 1=1
LEFT JOIN leave_balance lb ON e.id = lb.employee_id AND lt.id = lb.leave_type_id
LEFT JOIN leaves l ON e.id = l.employee_id AND lt.id = l.leave_type_id
GROUP BY e.id, lt.id;
```

### Audit Trail for User
```sql
SELECT * FROM audit_logs 
WHERE user_id = ? 
ORDER BY timestamp DESC 
LIMIT 100;
```

---

## 🚀 CLI Commands Reference

```bash
# Backend Setup
cd backend && npm install
npm run server              # Start with nodemon
npm run unlock             # Unlock vault
npm run lock               # Lock vault
npm run deploy-safe        # Deploy (build frontend + lock)

# Frontend Setup
cd hrm && npm install
npm start                  # Start development server
npm run build              # Production build

# Database Migrations
node backend/database/migrations/run_detailed_migration.js
node backend/database/migrations/run_office_migration.js

# Testing
npm test                   # Run test suite

# Debugging
node backend/server.js --inspect  # V8 Inspector
node backend/test_db.js           # Test DB connection
```

---

## 🔐 Environment Variables Quick Reference

```env
PORT=5000
NODE_ENV=production
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASS=password
DB_NAME=hrm_db
SESSION_SECRET=secret
JWT_SECRET=secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=email@gmail.com
EMAIL_PASS=password
VAPID_PUBLIC_KEY=key
VAPID_PRIVATE_KEY=key
```

---

## 📊 Database Entity Relationships

```
employee_records (main)
├── users_roles (many-to-many)
│   └── role_permissions
│       └── permissions
├── attendance (one-to-many)
├── leaves (one-to-many)
├── performance_reviews (one-to-many)
├── payroll_records (one-to-many)
├── employee_documents (one-to-many)
├── audit_logs (one-to-many)
├── chat_messages (one-to-many)
└── notifications (one-to-many)

offices (organization)
├── office_locations (one-to-many)
└── office_requisitions (one-to-many)

news_posts (content)
├── news_reactions (one-to-many)
└── chat_read_receipts (one-to-many)
```

---

## 🔄 Request/Response Pattern

### Standard Success Response
```javascript
res.json({
  success: true,
  data: {},
  message: "Operation successful"
})
```

### Standard Error Response
```javascript
res.status(400).json({
  success: false,
  error: "Error message",
  details: {}
})
```

---

## ✅ Validation Checklist

- [ ] Input validation (null checks, type checking)
- [ ] Permission check (RBAC middleware)
- [ ] Audit log entry (recordLog call)
- [ ] Error handling (try-catch with meaningful messages)
- [ ] Database constraints (foreign keys, indexes)
- [ ] Frontend loading states
- [ ] Error boundaries and user feedback
- [ ] API response format consistency

---

## 📱 WebSocket Event Naming Convention

**Format:** `module:action`

Examples:
- `chat:message_sent`
- `attendance:checked_in`
- `notification:new_alert`
- `user:status_changed`
- `leave:request_approved`

---

## 🎯 Performance Tips

1. Use connection pooling (50 connections)
2. Index frequently queried columns
3. Lazy load React components
4. Implement virtual scrolling for large lists
5. Cache frequently accessed data
6. Compress responses with gzip
7. Use CDN for static assets
8. Optimize images with Sharp
9. Batch database inserts
10. Use prepared statements

---

## 📝 File Naming Conventions

**Backend:**
- Controllers: `[Feature]Controller.js` (e.g., `EmployeesController.js`)
- Routes: `[Feature]Routes.js`
- Models/Utils: `[Feature]Utils.js`

**Frontend:**
- Pages: `[Feature]Page.js`
- Components: `[Feature].js`
- Contexts: `[Feature]Context.js`
- Hooks: `use[Feature].js`

---

## 🔗 API Prefix

All API endpoints are prefixed with `/api` (or configured in axios instance)

Example: `/api/employees`, `/api/attendance/checkin`

---

## 💾 Database Backup Commands

```bash
# Backup
mysqldump -u root -p hrm_db > backup_$(date +%Y%m%d).sql

# Restore
mysql -u root -p hrm_db < backup_20260420.sql
```

---

## 🐛 Common Debugging Commands

```bash
# Check MySQL connection
node backend/test_db.js

# Test JWT token
node backend/api_debug.js

# Verify permissions
node backend/check_role_perms.js

# Check database schema
node backend/dump_schemas.js
```

---

**Use this quick reference when asking AI to build features or modify the HRM system.**
