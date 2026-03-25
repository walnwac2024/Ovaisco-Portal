/// server.js
const express = require("express");
const session = require("express-session");
const MySQLStoreFactory = require("express-mysql-session")(session);
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const dotenv = require("dotenv");
const csurf = require("csurf");
const path = require("path");
const fs = require("fs");

dotenv.config();

const app = express();
const http = require("http");
const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow localhost 3000 and propeople.cloud
      const allowed = [
        "http://localhost:3000",
        "http://propeople.cloud",
        "https://propeople.cloud",
        "http://api.propeople.cloud",
        "https://api.propeople.cloud"
      ];
      if (!origin || allowed.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true
  }
});

// Make io accessible in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});


// Enable gzip compression for all responses
app.use(compression());

const routes = require("./Routes/Route");
const { initAttendanceJob } = require("./Utils/attendanceJob");
// Initialize background jobs
initAttendanceJob();

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const log = `${new Date().toISOString()} - ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)\n`;
    fs.appendFile(path.join(__dirname, "debug_requests.log"), log, (err) => {
      if (err) console.error("Failed to append to log:", err);
    });
  });
  next();
});

const isProd = process.env.NODE_ENV === "production";

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://propeople.cloud",
  "https://propeople.cloud",
  "http://api.propeople.cloud",
  "https://api.propeople.cloud"
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "x-csrf-token",
  ],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static Routes
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/chat", express.static(path.join(__dirname, "uploads/chat")));

app.set("trust proxy", 1);

const sessionStore = new MySQLStoreFactory({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  createDatabaseTable: true,
  clearExpired: true,
  checkExpirationInterval: 15 * 60 * 1000,
  expiration: 7 * 24 * 60 * 60 * 1000,
  schema: {
    tableName: "sessions",
    columnNames: { session_id: "session_id", expires: "expires", data: "data" },
  },
});

app.use(
  session({
    name: "sid",
    secret: process.env.SESSION_SECRET || "change_this_secret",
    resave: false,
    saveUninitialized: true,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
      domain: isProd ? ".propeople.cloud" : undefined,
    },
  })
);

const csrfProtection = csurf({ cookie: false });

app.get("/api/v1/csrf", (req, res, next) => {
  csrfProtection(req, res, (err) => {
    if (err) return next(err);
    res.json({ csrfToken: req.csrfToken() });
  });
});

app.use("/api/v1", (req, res, next) => {
  if (req.method === "OPTIONS") return next();

  const publicPaths = [
    "/auth/login",
    "/auth/logout",
    "/auth/heartbeat",
    "/login",
    "/news/whatsapp/",
  ];

  const isPublic = publicPaths.some((p) => req.path.startsWith(p));
  if (isPublic) return next();

  // Exempt specific routes from CSRF
  // Using originalUrl to be safe as req.path might vary by mount point
  const pathForCsrf = req.originalUrl || req.url;
  const isExempt =
    (req.method === "PATCH" && pathForCsrf.includes("/notifications/") && pathForCsrf.endsWith("/read")) ||
    pathForCsrf.includes("/attendance/punch") ||
    pathForCsrf.includes("/attendance/amt-sync") ||
    pathForCsrf.includes("/payroll/lock-salary") ||
    pathForCsrf.includes("/push/subscribe") ||
    pathForCsrf.includes("/push/unsubscribe");

  if (isExempt) {
    return next();
  }

  csrfProtection(req, res, next);
});


app.use("/api/v1", routes);

const buildPath = path.join(__dirname, "../hrm/build");
app.use(express.static(buildPath));

app.use((req, res) => {
  if (req.path.startsWith("/api/v1")) {
    return res.status(404).json({ message: "API endpoint not found" });
  }
  res.sendFile(path.join(buildPath, "index.html"), (err) => {
    if (err) {
      res.status(404).send("HRM Build not found.");
    }
  });
});

app.use((err, req, res, next) => {
  if (err.code === "EBADCSRFTOKEN") {
    console.error(`[CSRF ERROR] ${req.method} ${req.path} - Invalid token from ${req.ip}`);
    return res.status(403).json({
      message: "Invalid CSRF token",
      details: "Token mismatch or session expired. Please refresh the page.",
      path: req.path
    });
  }

  // Handle Multer errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "File too large. Maximum size allowed is 10MB." });
  }
  if (err.name === "MulterError") {
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }

  // Enhanced logging for other 500 errors
  const errorDetails = `${new Date().toISOString()} - ERROR 500 - ${req.method} ${req.path}\nStack: ${err.stack}\n\n`;
  fs.appendFile(path.join(__dirname, "debug_requests.log"), errorDetails, (logErr) => {
    if (logErr) console.error("Failed to write to log file:", logErr);
  });

  console.error(err);
  return res.status(500).json({ message: "Server error" });
});

const port = Number(process.env.PORT || 5000);
const host = "0.0.0.0";

// Auto-migrate: add new payroll columns if missing
const { pool } = require('./Utils/db');
(async () => {
  // Wait a moment for everything to settle
  await new Promise(r => setTimeout(r, 2000));
  try {
    const [columns] = await pool.execute("DESCRIBE payroll_base_settings");
    const existingColumns = columns.map(c => c.Field);

    if (!existingColumns.includes('food_deduction')) {
      await pool.execute("ALTER TABLE payroll_base_settings ADD COLUMN food_deduction DECIMAL(10,2) DEFAULT 0");
      console.log("✅ Added food_deduction to payroll_base_settings");
    }
    if (!existingColumns.includes('health_deduction')) {
      await pool.execute("ALTER TABLE payroll_base_settings ADD COLUMN health_deduction DECIMAL(10,2) DEFAULT 0");
      console.log("✅ Added health_deduction to payroll_base_settings");
    }

    // Auto-migrate: Add missing permissions
    const permissions = [
      { module: 'News', action: 'View News', code: 'news_view' },
      { module: 'News', action: 'Manage News', code: 'news_manage' },
      { module: 'News', action: 'Post Reactions', code: 'news_react' },
      { module: 'News', action: 'Post Comments', code: 'news_comment' },
      { module: 'News', action: 'Manage Comments', code: 'news_manage_comments' },
      { module: 'Timeline', action: 'View Timeline', code: 'timeline_view' },
      { module: 'Timeline', action: 'Manage Events', code: 'timeline_manage' },
      { module: 'Branding', action: 'View Branding', code: 'branding_view' },
      { module: 'Branding', action: 'Manage Branding', code: 'branding_manage' },
      { module: 'Attendance', action: 'View All Attendance', code: 'attendance_view_all' },
      { module: 'Attendance', action: 'Manage Settings', code: 'attendance_manage_settings' },
      { module: 'Attendance', action: 'Attendance Audit', code: 'attendance_audit' },
      { module: 'Audit', action: 'View Logs', code: 'audit_view' },
      { module: 'WhatsApp', action: 'Manage Integration', code: 'whatsapp_manage' },
      { module: 'Permissions', action: 'Manage Roles', code: 'permissions_edit' }
    ];

    for (const p of permissions) {
      const [existing] = await pool.execute("SELECT id FROM permissions WHERE code = ?", [p.code]);
      if (existing.length === 0) {
        await pool.execute(
          "INSERT INTO permissions (module, action, code) VALUES (?, ?, ?)",
          [p.module, p.action, p.code]
        );
        console.log(`✅ Auto-inserted missing permission: ${p.code}`);
      }
    }

    console.log("✅ Payroll and Permissions schema verification done.");
  } catch (e) {
    console.warn("⚠️ Migration error:", e.message);
  }
})();

server.listen(port, host, () => {
  console.log(`Server listening on http://${host}:${port}`);
});
