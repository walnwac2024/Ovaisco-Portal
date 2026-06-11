# HRM (Human Resource Management) System - Complete Blueprint

## Executive Summary
This is a comprehensive Human Resource Management System built with React (Frontend) and Node.js/Express (Backend), using MySQL database. The system manages all HR operations including employee records, attendance, leave management, performance evaluation, payroll, gamification, news/announcements, and office management with role-based access control.

---

## 🏗️ System Architecture

### Technology Stack

**Frontend:**
- React 19.1.1 with React Router v7
- Tailwind CSS for styling
- Axios for HTTP requests
- Socket.io-client for real-time updates
- Face-API.js for biometric authentication
- React-icons & Lucide-react for UI icons
- Web Vitals, Testing Library

**Backend:**
- Node.js with Express 5.1.0
- MySQL2/Promise for database
- JWT for authentication
- Socket.io for real-time communication
- Express-session with MySQL session store
- Multer for file uploads
- Sharp for image optimization
- Nodemailer for email notifications
- Web-push for push notifications
- CSURF for CSRF protection
- Helmet for security headers
- Bcryptjs for password hashing
- Node-cron for scheduled jobs
- XLSX for Excel export/import

**Database:**
- MySQL 8.0+
- Supporting tables: 40+ entities
- Session-based authentication with JWT tokens

---

## 📊 Database Schema Overview

### Core Tables Structure

**User Management:**
- `employee_records` - Main employee data
  - id, Employee_ID, Employee_Name, Official_Email, password_hash
  - phone, DOB, Qualification, Department, Designation, Station
  - Reporting_Manager, profile_img, is_active, can_login
  - Office_ID, company_id, last_login_timestamp

- `users_roles` - Role assignments
- `role_permissions` - Permission matrix
- `permission_groups` - Permission categories

**Attendance:**
- `attendance` - Daily attendance records
  - Employee_ID, Date, Time_In, Time_Out, Status
  - Office_Location, Biometric_Verified, Check_In_Latitude/Longitude

- `attendance_settings` - Company-specific settings
  - Early_Cutoff, Late_Cutoff, Working_Hours, Grace_Period
  - Geolocation_Radius, Device_Lock_Required

**Leave Management:**
- `leaves` - Leave requests with status tracking
- `leave_types` - Category of leaves (Casual, Sick, Annual, etc.)
- `leave_balance` - Employee leave balance tracking

**Performance:**
- `performance_reviews` - Review records
- `appraisal_cycles` - Annual review periods
- `kpi_tracking` - KPI metrics

**Payroll:**
- `payroll_records` - Salary and compensation
- `allowances` - Various allowances (HRA, DA, etc.)
- `salary_settings` - Payroll configuration

**Additional Modules:**
- `news_posts` - Company announcements
- `news_reactions` - Like/Comment system
- `chat_messages` - Internal messaging
- `chat_read_receipts` - Message read status
- `notifications` - Real-time notifications
- `audit_logs` - Compliance and audit trail
- `office_locations` - Office management
- `office_requisitions` - Office request management
- `gamification_points` - Leaderboard system
- `employee_documents` - Document management (contracts, certificates)
- `settings` - System configuration

---

## 🔐 Authentication & Authorization

### Authentication Flow

1. **Login Process:**
   - Email + Password submission
   - Bcryptjs password verification against stored hash
   - JWT token generation on success
   - Session creation in MySQL session store
   - Session cookie set with secure flags

2. **JWT Token Structure:**
   - Contains: userId, email, role, permissions
   - Secret stored in: `JWT_SECRET` environment variable
   - Used for stateless API verification

3. **Protected Routes:**
   - All routes require authenticated session
   - JWT token in Authorization header: `Bearer <token>`
   - Middleware validates token and checks expiry

### Role-Based Access Control (RBAC)

**Permission System:**
- Granular permission matrix (50+ permissions)
- Roles with assigned permission sets
- Three-tier control: Role → User → Feature Access

**Default Roles:**
- Super Admin - Full system access
- HR Admin - HR operations management
- Manager - Team management & reporting
- Employee - Self-service features
- Finance - Payroll management
- Office Admin - Office operations
- Department Head - Department oversight

**Permission Categories:**
- Employee Management (Create, Read, Update, Delete)
- Attendance Control (Mark, Approve, Report)
- Leave Management (Request, Approve, Reject)
- Performance (Create Reviews, Access Reports)
- Payroll (View, Approve, Generate)
- Settings (System, Branding, Security)
- Audit (View Logs, Export)
- Chat/Notifications (Send, Receive, Manage)

---

## 📁 Backend Project Structure

```
backend/
├── server.js                          # Main Express server entry point
├── package.json                       # Dependencies & scripts
├── .env                               # Environment configuration
├── nodemon.json                       # Development server config
│
├── Utils/                             # Utility functions
│   ├── db.js                         # MySQL connection pool
│   ├── email.js                      # Email service (Nodemailer)
│   ├── AuditUtils.js                # Audit logging
│   ├── FaceService.js                # Biometric/Face API integration
│   ├── imageOptimizer.js             # Sharp image optimization
│   ├── attendanceJob.js              # Cron job for auto-attendance
│   └── security/                     # Security utilities
│       ├── security-bridge.js        # Environment bridge
│       └── vault-run.js              # Vault encryption
│
├── Controller/                        # Business logic by feature
│   ├── UserDeatils/
│   │   ├── Login.js                 # Authentication & user sessions
│   │   ├── Role.js                  # Role management
│   │   ├── BiometricController.js   # Facial recognition
│   │   ├── NotificationController.js # Push notifications
│   │   ├── ChatController.js        # Real-time messaging
│   │   └── BirthdayController.js    # Birthday notifications
│   │
│   ├── Employees/
│   │   ├── Employees.js             # CRUD operations
│   │   └── TimelineController.js    # Employee activity timeline
│   │
│   ├── Attendance/
│   │   ├── Attendance.js            # Check-in/out, reports
│   │   └── AttendanceSettings.js    # Company settings
│   │
│   ├── Leaves/
│   │   └── Leave.js                 # Leave requests & approvals
│   │
│   ├── Performance/
│   │   └── PerformanceController.js # Appraisals & KPIs
│   │
│   ├── Payroll/
│   │   └── PayrollController.js     # Salary & compensation
│   │
│   ├── News/
│   │   └── NewsController.js        # Announcements & posts
│   │
│   ├── Audit/
│   │   └── AuditController.js       # Audit logs & compliance
│   │
│   ├── Office/
│   │   └── OfficeController.js      # Office locations & requisitions
│   │
│   ├── Gamification/
│   │   └── GamificationController.js # Points & leaderboard
│   │
│   ├── Settings/
│   │   ├── SettingsController.js    # Branding & preferences
│   │   └── SystemSettingsController.js # System config
│   │
│   └── SaaS/
│       └── SaaSController.js        # Multi-tenant features
│
├── Routes/
│   ├── Route.js                      # Main router (all endpoints)
│   └── PerformanceRoutes.js         # Performance module routes
│
├── Middleware/
│   ├── uploadMiddleware.js           # Multer file upload handling
│   └── cache.js                      # Response caching
│
├── database/
│   └── migrations/                   # SQL migration files
│       ├── 2024_02_18_detailed_allowances.sql
│       ├── 2024_02_18_minimal_payroll.sql
│       ├── 2026_03_11_granular_permissions.sql
│       ├── 2026_03_11_office_management.sql
│       ├── 2026_04_02_add_title_to_office_requisitions.sql
│       └── run_*.js                  # Migration runners
│
└── uploads/                           # User uploaded files (avatars, documents)
```

---

## 🎨 Frontend Project Structure

```
hrm/src/
├── App.js                             # Main app component with routing
├── index.js                           # React entry point
├── App.css                            # Global styles
├── index.css                          # Tailwind + global styles
│
├── context/                           # Global state management
│   ├── AuthContext.js                # Authentication state & user info
│   └── ThemeContext.js               # Theme (light/dark mode)
│
├── hooks/                             # Custom React hooks
│   ├── useAuth.js                    # Access auth context
│   ├── usePermissions.js             # Check user permissions
│   └── useSocket.js                  # Real-time socket connection
│
├── utils/
│   ├── api.js                        # Axios instance & CSRF setup
│   └── helpers.js                    # Utility functions
│
├── components/
│   ├── common/                       # Reusable UI components
│   │   ├── MainLoader.js             # Loading spinner
│   │   ├── ComingSoon.js             # Coming soon page
│   │   ├── VirtualizedTable.js       # High-performance table
│   │   ├── PWAInstallPrompt.js       # PWA installation
│   │   └── Navigation/               # Header, sidebar, menus
│   │
│   └── pages/
│       ├── ProtectedRoute/           # Auth guard wrapper
│       ├── Layout/                   # Main layout with sidebar
│       ├── DashboardTabsLayout.js    # Tab-based dashboard
│       └── [Other shared page components]
│
├── features/                          # Feature modules (lazy loaded)
│   ├── employees/
│   │   ├── EmployeesPage.js         # Employee list & grid view
│   │   ├── components/
│   │   │   ├── EmployeeViewPage.js  # Employee detail view
│   │   │   ├── EmployeeForm.js      # Create/edit form
│   │   │   └── DocumentManager.js   # Document upload/download
│   │   └── hooks/
│   │
│   ├── attendance/
│   │   ├── AttendancePage.js         # Check-in/out interface
│   │   ├── AdminDailyReport.js       # Admin reporting
│   │   ├── components/
│   │   │   ├── AttendanceSettings.js # Configure attendance rules
│   │   │   ├── BiometricCapture.js  # Face recognition check-in
│   │   │   ├── GeolocationMap.js    # GPS mapping
│   │   │   └── AttendanceCalendar.js
│   │   └── utils/
│   │
│   ├── leave/
│   │   ├── LeavePage.js              # Leave requests & balance
│   │   ├── components/
│   │   │   ├── LeaveRequestForm.js  # Submit request
│   │   │   ├── LeaveApprovalQueue.js # Manager approvals
│   │   │   └── LeaveCalendar.js     # Visual calendar
│   │   └── utils/
│   │
│   ├── performance/
│   │   ├── PerformancePage.js        # KPI & appraisals
│   │   ├── components/
│   │   │   ├── ReviewForm.js        # Create review
│   │   │   ├── KPITracker.js        # KPI metrics
│   │   │   └── GoalSetting.js       # Annual goals
│   │   └── utils/
│   │
│   ├── payroll/
│   │   ├── PayrollPage.js            # Salary structure
│   │   ├── components/
│   │   │   ├── PayrollDetailsView.js # Breakdown view
│   │   │   ├── SalarySettings.js    # Config salary
│   │   │   └── PayslipDownload.js   # Generate payslips
│   │   └── utils/
│   │
│   ├── news/
│   │   ├── NewsPage.js               # Company announcements
│   │   ├── components/
│   │   │   ├── PostCreate.js        # New announcement
│   │   │   ├── PostList.js          # Feed view
│   │   │   └── Reactions.js         # Like/comment UI
│   │   └── utils/
│   │
│   ├── permissions/
│   │   ├── PermissionsPage.js        # Role & permission admin
│   │   ├── components/
│   │   │   ├── RoleMatrix.js        # Permission grid
│   │   │   └── RoleForm.js          # Create/edit role
│   │   └── utils/
│   │
│   ├── audit/
│   │   ├── LogsPage.js               # Audit trail viewer
│   │   ├── components/
│   │   │   ├── LogFilter.js         # Search/filter
│   │   │   └── LogExport.js         # Export CSV/Excel
│   │   └── utils/
│   │
│   ├── settings/
│   │   ├── BrandingPage.js           # Logo, colors, themes
│   │   ├── SystemSettingsPage.js     # General settings
│   │   ├── components/
│   │   │   ├── LogoUpload.js        # Company branding
│   │   │   ├── EmailConfig.js       # Email settings
│   │   │   └── NotificationPrefs.js
│   │   └── utils/
│   │
│   ├── organization/
│   │   ├── OrganizationPage.js       # Org chart & departments
│   │   ├── components/
│   │   │   ├── OrgChart.js          # Visual hierarchy
│   │   │   ├── DepartmentForm.js    # Create department
│   │   │   └── StationManagement.js # Office locations
│   │   └── utils/
│   │
│   ├── office/
│   │   ├── OfficePage.js             # Office management
│   │   ├── components/
│   │   │   ├── OfficeForm.js        # Create/edit office
│   │   │   ├── OfficeRequisitions.js # Request management
│   │   │   └── OfficeMap.js         # Location mapping
│   │   └── utils/
│   │
│   ├── gamification/
│   │   ├── LeaderboardPage.js        # Points leaderboard
│   │   ├── components/
│   │   │   ├── LeaderboardTable.js  # Ranking display
│   │   │   └── AchievementBadges.js
│   │   └── utils/
│   │
│   ├── dashboard/
│   │   ├── DashboardPage.js          # Main dashboard
│   │   ├── components/
│   │   │   ├── StatCards.js         # KPI cards
│   │   │   ├── Charts.js            # Analytics
│   │   │   ├── UpcomingEvents.js    # Calendar
│   │   │   └── QuickActions.js      # Shortcuts
│   │   └── utils/
│   │
│   ├── profile/
│   │   ├── ProfilePage.js            # User profile management
│   │   ├── components/
│   │   │   ├── ProfileForm.js       # Edit details
│   │   │   ├── PasswordChange.js    # Change password
│   │   │   ├── Avatar Upload.js     # Profile picture
│   │   │   └── Preferences.js       # User settings
│   │   └── utils/
│   │
│   ├── reports/
│   │   ├── ReportsPage.js            # Report generation
│   │   ├── components/
│   │   │   ├── ReportBuilder.js     # Custom reports
│   │   │   ├── ExportOptions.js     # PDF/Excel/CSV
│   │   │   └── ScheduleReport.js    # Automated reports
│   │   └── utils/
│   │
│   └── saas/
│       ├── SaaSPage.js               # Multi-tenant features
│       ├── components/
│       │   ├── CompanyManagement.js
│       │   └── SubscriptionManager.js
│       └── utils/
│
├── userdetails/
│   └── Login.js                       # Login page component
│
├── Dashbord/
│   └── Dashbord.js                    # Dashboard main page
│
├── styles/
│   ├── index.css                      # Tailwind & global styles
│   └── custom.css                     # Custom component styles
│
└── assets/
    ├── images/
    ├── icons/
    └── fonts/
```

---

## 🔌 API Endpoints Overview

### Authentication Routes
```
POST   /auth/login              - User login
POST   /auth/logout             - User logout
GET    /auth/me                 - Get current user info
POST   /auth/change-password    - Change password
POST   /auth/heartbeat          - Keep session alive
```

### Employee Management
```
GET    /employees               - List all employees
GET    /employees/:id           - Get employee detail
POST   /employees               - Create new employee
PUT    /employees/:id           - Update employee
DELETE /employees/:id           - Delete employee
GET    /employees/documents/:id - Get employee documents
POST   /employees/:id/avatar    - Upload avatar
```

### Attendance
```
POST   /attendance/checkin      - Mark check-in
POST   /attendance/checkout     - Mark check-out
GET    /attendance/daily        - Get daily reports
GET    /attendance/:id          - Get employee attendance
POST   /attendance/settings     - Configure attendance
```

### Leave Management
```
POST   /leaves/request          - Submit leave request
GET    /leaves/balance/:id      - Get leave balance
GET    /leaves/pending          - Get pending approvals
PUT    /leaves/:id/approve      - Approve leave
PUT    /leaves/:id/reject       - Reject leave
```

### Roles & Permissions
```
GET    /roles                   - List roles
POST   /roles                   - Create role
PUT    /roles/:id               - Update role
GET    /permissions             - List all permissions
GET    /roles/:id/permissions   - Get role permissions
```

### News & Updates
```
GET    /news                    - Get news feed
POST   /news                    - Create news post
POST   /news/:id/react          - Like/react to post
GET    /news/:id/comments       - Get comments
```

### Performance
```
POST   /performance/review      - Create review
GET    /performance/cycles      - Get appraisal cycles
GET    /performance/:id         - Get employee performance
```

### Payroll
```
GET    /payroll/records         - Get salary records
GET    /payroll/:id/payslip     - Generate payslip
POST   /payroll/settings        - Configure salary
```

### Chat & Notifications
```
WS     /socket.io               - WebSocket connection
POST   /notifications/send      - Send notification
GET    /notifications           - Get notifications
POST   /chat/message            - Send message
GET    /chat/rooms              - Get chat rooms
```

### Audit & Reports
```
GET    /audit/logs              - Get audit logs
GET    /reports/export          - Export report data
```

---

## 🔄 Real-Time Features (Socket.io)

### Socket Events

**Server → Client:**
- `notification:new` - New notification alert
- `chat:message` - New message received
- `attendance:update` - Attendance status updated
- `user:online` - User came online
- `user:offline` - User went offline

**Client → Server:**
- `chat:send` - Send chat message
- `user:typing` - User typing indicator
- `notification:read` - Mark notification as read
- `user:status` - Update user online status

---

## 🛡️ Security Features

1. **Authentication:**
   - JWT tokens with expiration
   - Bcryptjs password hashing
   - Session management with MySQL store
   - CSRF protection with csurf

2. **Authorization:**
   - Role-Based Access Control (RBAC)
   - Granular permission matrix
   - Route protection with middleware
   - Feature-level access checks

3. **Data Protection:**
   - HTTPS enforcement (Helmet)
   - CORS with whitelist
   - SQL injection prevention (parameterized queries)
   - Input validation & sanitization
   - Audit logging of all actions

4. **Privacy:**
   - Encrypted sensitive data in vault
   - Secure password reset tokens
   - Biometric data handled separately
   - GDPR-compliant data deletion

---

## 📱 Key Features Implementation

### 1. Attendance System
- **Check-in/Check-out:** Time tracking with timestamps
- **Biometric Verification:** Face recognition using Face-API.js
- **Geolocation:** GPS tracking with radius validation
- **Auto-Attendance:** Cron job for automated marking
- **Reports:** Daily, weekly, monthly attendance reports
- **Settings:** Customizable cut-off times, grace periods, working hours

### 2. Leave Management
- **Request System:** Employees submit leave requests
- **Approval Workflow:** Manager/HR approval process
- **Balance Tracking:** Auto-calculate available leaves
- **Leave Types:** Multiple leave categories (Casual, Sick, Annual, etc.)
- **Calendar View:** Visual representation of leaves

### 3. Performance Management
- **Appraisal Cycles:** Annual/periodic review periods
- **KPI Tracking:** Goal setting and monitoring
- **Review Forms:** Manager and peer reviews
- **Performance History:** Track trends over time

### 4. Payroll System
- **Salary Structure:** Basic + Allowances
- **Payslip Generation:** Monthly salary statements
- **Deductions:** Tax, insurance calculations
- **Salary Settings:** Configure company-wide payroll rules

### 5. Employee Directory
- **Employee Records:** Complete HR information
- **Document Management:** Contracts, certificates, credentials
- **Avatar/Profile:** Employee profiles with pictures
- **Activity Timeline:** Employee lifecycle tracking

### 6. Chat & Notifications
- **Real-time Messaging:** WebSocket-based chat
- **Push Notifications:** Browser and mobile notifications
- **Notification Center:** Centralized notification management
- **Read Receipts:** Track message delivery status

### 7. News & Announcements
- **Feed System:** Company-wide news/announcements
- **Reactions:** Like and comment on posts
- **Search:** Full-text search in news

### 8. Gamification
- **Points System:** Reward employee actions
- **Leaderboard:** Rank employees by points
- **Achievements:** Badge system for milestones

### 9. Role-Based Permissions
- **Granular Controls:** 50+ permission types
- **Dynamic Roles:** Custom role creation
- **Permission Matrix:** Visual permission assignment
- **Audit Trail:** Log all permission changes

---

## 🗄️ Environment Variables (.env)

```
# Server
PORT=5000
NODE_ENV=production

# Database
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASS=yourpassword
DB_NAME=hrm_db

# Security
SESSION_SECRET=your_secret_key
JWT_SECRET=your_jwt_secret
CSRF_SECRET=your_csrf_secret

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=HRM System <no-reply@yourcompany.com>

# Push Notifications (Web Push)
VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key

# Third-party APIs
FACE_API_MODEL_URL=path_to_face_api_models
WHP_GROUP_ID=whatsapp_group_id

# Company
COMPANY_NAME=Your Company
COMPANY_LOGO_URL=https://your-domain.com/logo.png
```

---

## 🚀 Deployment & Setup

### Prerequisites
- Node.js 14+
- MySQL 8.0+
- npm or yarn

### Installation Steps

1. **Clone and Install Dependencies:**
   ```bash
   cd backend && npm install
   cd ../hrm && npm install
   ```

2. **Database Setup:**
   ```bash
   # Run migrations
   node backend/database/migrations/run_detailed_migration.js
   ```

3. **Environment Configuration:**
   - Copy `.env.example` to `.env`
   - Update database credentials
   - Set JWT and session secrets

4. **Start Development:**
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run server
   
   # Terminal 2 - Frontend
   cd hrm && npm start
   ```

5. **Production Build:**
   ```bash
   npm run deploy-safe
   ```

### Docker Setup (Optional)
```dockerfile
# Build multi-stage docker image
# Backend on :5000
# Frontend on :3000
```

---

## 📝 Database Migrations

The system includes versioned migrations:

1. **2024_02_18_detailed_allowances.sql** - Payroll & allowances
2. **2024_02_18_minimal_payroll.sql** - Basic salary structure
3. **2026_03_11_granular_permissions.sql** - Advanced RBAC
4. **2026_03_11_office_management.sql** - Office module
5. **2026_04_02_add_title_to_office_requisitions.sql** - Office enhancements

---

## 📊 Audit & Compliance

- **Audit Logging:** All user actions logged with timestamp and user ID
- **Data Retention:** Configurable retention policies
- **Compliance Reports:** Generate compliance documentation
- **Export Capabilities:** Export all employee/operational data

---

## 🎯 How to Implement for a New Company

### Step 1: Clone the Structure
- Use this exact folder structure for new project
- Keep naming conventions consistent

### Step 2: Database Setup
- Run all migration files in order
- Customize tables as per company policy

### Step 3: Customize Configuration
- Update environment variables
- Configure email service (Gmail SMTP or corporate)
- Set VAPID keys for push notifications
- Configure Face-API models if using biometrics

### Step 4: Branding
- Upload company logo
- Customize colors/themes
- Update email templates

### Step 5: Role & Permissions
- Define company roles
- Assign permissions to roles
- Create role templates

### Step 6: Employee Seeding
- Bulk import employees from Excel
- Assign roles and departments
- Set reporting managers

### Step 7: Configure Policies
- Attendance rules (working hours, grace period)
- Leave policies (types, balances)
- Payroll structure (salary components)

### Step 8: Deploy
- Configure hosting (AWS, Heroku, VPS)
- Set up SSL certificates
- Configure domain
- Enable backups & monitoring

---

## 🔧 Common Customizations

### Adding New Module
1. Create controller in `backend/Controller/ModuleName/`
2. Create routes in `backend/Routes/`
3. Create React component in `frontend/src/features/modulename/`
4. Add permission group for the module
5. Create database migration if needed

### Custom Permissions
1. Add permission in database: `permissions` table
2. Create permission group in `permission_groups`
3. Assign to roles in `users_roles`

### New API Endpoint
1. Create controller method
2. Add route in `Route.js`
3. Add permission check middleware
4. Add audit log entry
5. Create frontend API call

### Database Changes
1. Create migration SQL file in `database/migrations/`
2. Name with date: `YYYY_MM_DD_feature_name.sql`
3. Create runner script: `run_migration.js`
4. Test before deployment

---

## 📈 Scaling Considerations

- **Database Optimization:** Indexed queries, connection pooling
- **Caching:** Session caching with Redis
- **Load Balancing:** Multiple Node instances with nginx
- **CDN:** Static assets on CDN
- **File Storage:** AWS S3 for uploads
- **Message Queue:** Bull/RabbitMQ for async jobs
- **Analytics:** Track key metrics

---

## 🎓 Learning Path for New Developers

1. Understand authentication flow (Login.js)
2. Learn database schema (migrations)
3. Study middleware (permission checking)
4. Explore API endpoints (Route.js)
5. Understand React context (AuthContext)
6. Build new feature end-to-end

---

## 📞 Support & Troubleshooting

### Common Issues
- **Session Mismatch:** Check JWT_SECRET and SESSION_SECRET
- **Permission Denied:** Verify user role in `users_roles`
- **Database Connection:** Check DB credentials in .env
- **CORS Error:** Update CORS whitelist in server.js
- **Face Recognition:** Ensure Face-API models are loaded

---

## 📋 Checklist for New Implementation

- [ ] Database created and migrations run
- [ ] Environment variables configured
- [ ] Email service configured
- [ ] VAPID keys generated for notifications
- [ ] Company branding uploaded
- [ ] Root admin user created
- [ ] Department structure created
- [ ] Roles and permissions defined
- [ ] Employees imported
- [ ] Attendance settings configured
- [ ] Leave policy set
- [ ] Payroll structure defined
- [ ] Email templates updated
- [ ] SSL certificate installed
- [ ] Backups configured
- [ ] Monitoring alerts set
- [ ] User training completed
- [ ] Go-live validation done

---

## Version Information
- **System Version:** 1.0.0
- **React Version:** 19.1.1
- **Node.js:** 14+ recommended
- **MySQL:** 8.0+
- **Last Updated:** April 2026

---

**This blueprint contains all the information needed for an AI to build a similar HRM system for any company. Customize this prompt with your specific requirements and preferences.**
