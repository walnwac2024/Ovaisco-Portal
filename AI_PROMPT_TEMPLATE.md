# AI Prompt Template - Build HRM System for New Company

## How to Use This

Copy the entire section below and paste it directly into any AI chat (like Claude, GPT, etc.) to get it to build an HRM system for your new company.

---

## 📋 PROMPT TO PASTE INTO AI

```
I need you to build a complete Human Resource Management (HRM) System for a new company.

THIS IS THE ARCHITECTURE & PATTERNS YOU MUST FOLLOW:

=== TECHNOLOGY STACK ===
Backend:
- Node.js with Express 5.1.0 (API server)
- MySQL 8.0+ database with mysql2/promise
- JWT authentication + Express sessions
- Socket.io for real-time features
- Multer for file uploads
- Sharp for image optimization
- Nodemailer for emails
- Bcryptjs for password hashing
- CSURF for CSRF protection
- Helmet for security headers

Frontend:
- React 19.1.1 with React Router v7
- Tailwind CSS for styling
- Axios for API calls
- Socket.io-client for real-time updates
- Face-API.js for biometric features (optional)
- React-icons & Lucide-react for UI
- React-toastify for notifications

=== FOLDER STRUCTURE ===

Backend (node_modules & package.json in root):
- server.js (main entry point)
- Routes/
  - Route.js (main router with all endpoints)
- Controller/ (business logic organized by feature)
  - UserDeatils/Login.js, Role.js, etc.
  - Employees/Employees.js
  - Attendance/Attendance.js, AttendanceSettings.js
  - Leaves/Leave.js
  - Performance/PerformanceController.js
  - Payroll/PayrollController.js
  - News/NewsController.js
  - Permissions/
  - Audit/AuditController.js
  - Office/OfficeController.js
  - Gamification/GamificationController.js
  - Settings/SettingsController.js
- Middleware/
  - uploadMiddleware.js
  - cache.js
- Utils/
  - db.js (MySQL pool)
  - email.js (Nodemailer setup)
  - AuditUtils.js (logging)
- database/
  - migrations/ (SQL files)

Frontend:
- src/
  - App.js (main routing)
  - context/
    - AuthContext.js (global auth state)
    - ThemeContext.js
  - components/
    - pages/ (shared page components)
    - common/ (reusable UI components)
  - features/ (feature modules - lazy loaded)
    - employees/
    - attendance/
    - leave/
    - performance/
    - payroll/
    - news/
    - permissions/
    - audit/
    - settings/
    - organization/
    - office/
    - gamification/
    - profile/
    - reports/
  - hooks/ (custom React hooks)
  - utils/ (helper functions)

=== DATABASE SCHEMA SUMMARY ===

Core Tables:
- employee_records (main employee data)
- users_roles (role assignments)
- role_permissions (permission matrix)
- permissions (permission list)
- attendance (daily check-in/out)
- attendance_settings (company rules)
- leaves (leave requests)
- leave_types (leave categories)
- leave_balance (employee balances)
- performance_reviews (appraisals)
- payroll_records (salary info)
- news_posts (announcements)
- chat_messages (messaging)
- notifications (alerts)
- audit_logs (compliance logs)
- office_locations (office management)
- employee_documents (file storage metadata)
- gamification_points (leaderboard)
- settings (system config)

=== AUTHENTICATION FLOW ===

1. User submits email + password
2. Backend validates against employee_records.password_hash (bcryptjs)
3. If valid: Generate JWT token, create MySQL session
4. Return JWT token to frontend
5. Frontend stores in localStorage/session
6. All subsequent API calls include: Authorization: Bearer <token>
7. Backend validates JWT before processing request
8. All actions logged to audit_logs

=== KEY ENDPOINTS ===

Auth:
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me
POST /api/auth/change-password

Employees:
GET /api/employees
GET /api/employees/:id
POST /api/employees
PUT /api/employees/:id
DELETE /api/employees/:id

Attendance:
POST /api/attendance/checkin
POST /api/attendance/checkout
GET /api/attendance/daily
GET /api/attendance/:id

Leaves:
POST /api/leaves/request
GET /api/leaves/balance/:id
PUT /api/leaves/:id/approve

Roles & Permissions:
GET /api/roles
POST /api/roles
GET /api/permissions
PUT /api/roles/:id/permissions

News:
GET /api/news
POST /api/news
POST /api/news/:id/react

Performance:
POST /api/performance/review
GET /api/performance/:id

Payroll:
GET /api/payroll/records
GET /api/payroll/:id/payslip
POST /api/payroll/settings

Chat & Notifications:
WS /socket.io
POST /api/chat/message
GET /api/notifications

=== IMPORTANT PATTERNS ===

1. Every endpoint must check user permissions
2. Every data modification must create audit log
3. Database queries use parameterized statements (prevent SQL injection)
4. All errors caught with try-catch
5. Response format: { success: true/false, data: {}, message: "" }
6. Frontend uses lazy loading for code splitting
7. Real-time updates via Socket.io events
8. File uploads validated (size, type)
9. Images optimized with Sharp before storage
10. Sensitive fields never in JWT payload

=== ROLE-BASED ACCESS CONTROL ===

Permission Categories:
- Employee Management (Create, Read, Update, Delete, Manage)
- Attendance (Check-in, Approve, Reports)
- Leave Management (Request, Approve, Manage)
- Performance (Create, Read, Approve)
- Payroll (View, Approve, Generate)
- Permissions (Manage Roles, Assign Permissions)
- Settings (System, Branding)
- Audit (View Logs, Export)
- News (Post, Moderate)
- Office Management (Create, Update)

Default Roles:
- Super Admin (all permissions)
- HR Admin (HR operations)
- Manager (team management)
- Employee (self-service)
- Finance (payroll)
- Office Admin (office operations)

=== SOCKET.IO REAL-TIME EVENTS ===

Server to Client:
- notification:new
- chat:message
- attendance:updated
- user:online
- user:offline

Client to Server:
- chat:send
- user:typing
- notification:read
- user:status

=== SPECIAL FEATURES ===

1. Attendance:
   - Check-in/out with timestamps
   - Optional biometric (Face-API.js)
   - GPS location tracking
   - Auto-attendance via cron job
   - Daily reports

2. Leave:
   - Request workflow
   - Manager approval
   - Balance auto-calculation
   - Multiple leave types
   - Calendar visualization

3. Performance:
   - Appraisal cycles
   - KPI tracking
   - Manager reviews
   - Performance history

4. Payroll:
   - Salary structure (Basic + Allowances)
   - Monthly payslips
   - Tax calculation
   - Deductions

5. Chat:
   - Real-time messaging
   - Read receipts
   - Typing indicators
   - Room-based conversations

6. Gamification:
   - Points system
   - Leaderboard
   - Achievement badges

7. News:
   - Company announcements
   - Like/react system
   - Comments
   - Full-text search

8. Audit:
   - All user actions logged
   - Timestamp + user tracking
   - Compliance reports
   - Export capabilities

=== ENVIRONMENT VARIABLES ===

PORT=5000
NODE_ENV=production
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=yourpassword
DB_NAME=hrm_db
SESSION_SECRET=your_secret
JWT_SECRET=your_jwt_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=email@gmail.com
EMAIL_PASS=app_password
VAPID_PUBLIC_KEY=your_key
VAPID_PRIVATE_KEY=your_key

=== SETUP INSTRUCTIONS ===

1. Create folder structure
2. Run: npm init -y in backend
3. Install: npm install (backend dependencies)
4. Create database: mysql -u root -p
5. Create schema: CREATE DATABASE hrm_db;
6. Run migrations: node migrations/run_migration.js
7. Create .env file with variables above
8. Create src folder in React (frontend)
9. Install: npm install (frontend dependencies)
10. Start backend: npm run server
11. Start frontend: npm start

=== NOW BUILD ===

Build [SPECIFY WHAT TO BUILD]:
- Full system from scratch
- Specific module: [name module]
- Feature: [describe feature]
- Database schema
- API endpoint
- React component
- [OTHER]

CUSTOMIZATION FOR NEW COMPANY:
- Company name: [enter company name]
- Number of employees: [enter number]
- Primary industry: [enter industry]
- Special requirements: [list requirements]
- Budget constraints: [list constraints]
- Timeline: [enter timeline]

Please structure your response as:
1. File/folder structure to create
2. Database schema SQL
3. Backend code (controllers, routes)
4. Frontend code (components, hooks)
5. Environment setup instructions
6. Deployment checklist

Start building now!
```

---

## 🎯 How to Customize the Prompt

Before pasting into AI, fill in these sections:

### Section 1: What to Build
Replace `[SPECIFY WHAT TO BUILD]` with one of:
- "Build the complete HRM system from scratch for a new company"
- "Build just the Attendance module"
- "Build the Payroll system with salary structure"
- "Build the Leave Management module with approvals"
- "Build the Employee Directory with document management"

### Section 2: Company Details
Fill in:
- Company name: "XYZ Corporation"
- Number of employees: "500"
- Primary industry: "Technology / Manufacturing / Retail"
- Special requirements: "Biometric attendance", "Multi-office support", etc.
- Budget constraints: "Open source only", "Minimal third-party APIs"
- Timeline: "ASAP", "2 weeks", "1 month"

### Section 3: Additional Customizations
Add any company-specific needs like:
- Multiple office locations
- Multi-currency payroll
- Custom leave types
- Industry-specific reports
- Integration with existing systems

---

## 📝 Example - Ready to Use

Here's an example with a company filled in:

```
I need you to build a complete Human Resource Management (HRM) System 
for ABC Manufacturing Corp, a 200-person manufacturing company.

[PASTE THE FULL PROMPT ABOVE]

BUILD FOR THIS COMPANY:
- Company name: ABC Manufacturing Corp
- Number of employees: 200
- Primary industry: Manufacturing
- Special requirements: 
  * Multi-shift attendance tracking
  * Biometric punch clock integration
  * Compliance reporting for labor regulations
  * Integration with existing payroll system
- Budget: Open source, no paid SaaS
- Timeline: 6 weeks

SPECIFIC MODULES TO PRIORITIZE:
1. Attendance with shift management
2. Payroll with compliance reports
3. Leave with shift coverage planning
4. Performance management for factory workers

Let me know if you need clarification on any requirements.
```

---

## 🔄 Follow-up Prompts After Initial Build

After the AI builds the initial system, you can use these follow-up prompts:

### Add New Module
```
Now add [MODULE_NAME] module to this HRM system following the same patterns.
It should have:
- Database schema
- API endpoints
- React components
- Permission checks
- Audit logging
```

### Fix Issue
```
The [FEATURE] is not working. [DESCRIBE ISSUE]

Here's the current code: [PASTE CODE]

Fix this following the system architecture patterns.
```

### Add Feature
```
Add [FEATURE_NAME] to the [MODULE_NAME] module.

Details:
- [Requirement 1]
- [Requirement 2]
- [Requirement 3]

Provide:
1. Database changes
2. API endpoint code
3. React component code
```

### Optimize Code
```
Optimize this code for performance and security:
[PASTE CODE]

Consider:
- Database query optimization
- Caching strategies
- Security vulnerabilities
- Code reusability
```

---

## 💡 Pro Tips

1. **Be Specific:** Instead of "build attendance," say "build attendance with biometric face recognition and GPS tracking"

2. **Provide Context:** Include info about your company size, structure, and requirements

3. **Ask for Explanations:** If AI builds something, ask "Explain how this [code] works"

4. **Test as You Go:** Build one module at a time, test it, then move to next

5. **Use the Quick Reference:** When AI builds code, refer it to HRM_QUICK_REFERENCE.md for patterns

6. **Iterate:** Ask AI to improve, refactor, or add features incrementally

7. **Version Control:** Put everything in Git as you build

8. **Document:** Ask AI to add comments and documentation as it codes

---

## 📊 Recommended Build Order

For a new company, build in this order:

1. **Project Setup** - Folders, package.json, .env
2. **Database Schema** - Run migrations
3. **Authentication** - Login, JWT, sessions
4. **Employee Management** - CRUD operations
5. **Attendance** - Check-in/checkout
6. **Leave Management** - Requests and approvals
7. **Roles & Permissions** - RBAC system
8. **Payroll** - Salary structure
9. **Performance** - Reviews and KPIs
10. **Chat & Notifications** - Real-time features
11. **News** - Announcements
12. **Reports & Audit** - Analytics and compliance
13. **Office Management** - Multi-office support
14. **Gamification** - Points and leaderboard
15. **Settings & Branding** - Customization

---

## ✅ Quality Checklist

After AI builds code, verify:

- [ ] Follows folder structure exactly
- [ ] Uses parameterized SQL queries
- [ ] Has JWT/permission checks
- [ ] Creates audit log entries
- [ ] Has proper error handling (try-catch)
- [ ] Response format is consistent
- [ ] Frontend uses lazy loading
- [ ] Components are reusable
- [ ] No hardcoded values
- [ ] Environment variables used
- [ ] Comments explain complex logic
- [ ] No SQL injection vulnerabilities
- [ ] Async/await properly implemented
- [ ] Loading/error states in UI
- [ ] Mobile responsive

---

**Now you have everything needed to build a complete HRM system for any company using AI!**

Just copy the main prompt, customize it, and paste into any AI chat. The AI will follow your exact architecture and patterns.
