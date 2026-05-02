// Controller/UserDeatils/Role.js
const { pool } = require('../../Utils/db');

// Adjusted for employee_records
const BASE_EMP_FIELDS = `
  e.id,
  e.Employee_ID      AS employee_code,
  e.Employee_Name    AS name,
  e.Official_Email   AS email,
  e.Department,
  e.Designations     AS designation,
  e.profile_img,
  e.last_login_at,
  e.Date_of_Birth
`;

// Utility: build tabs from features (super_admin, admin, and hr see all)
function buildTabs(roleName, features) {
  const r = String(roleName || '').toLowerCase();
  const f = new Set(features || []);

  // ✅ super_admin, admin, hr, and developer get all tabs
  const can = (code) => ['super_admin', 'admin', 'hr', 'developer'].includes(r) || f.has(code);

  const tabs = [];
  const add = (key, label, code) => { if (can(code)) tabs.push({ key, label }); };

  add('dashboard', 'Dashboard', 'dashboard_view');
  add('organization', 'Organization', 'org_view');
  add('recruitment', 'Recruitment', 'recruitment_view');
  if (can('employee_view') || can('timeline_view')) {
    tabs.push({ key: 'employee', label: 'Employee' });
  }
  add('timesheet', 'Timesheet', 'timesheet_view');
  add('leave', 'Leave', 'leave_view');
  add('attendance', 'Attendance', 'attendance_view');
  add('performance', 'Performance', 'performance_view');
  add('payroll', 'Payroll', 'payroll_view_own');
  add('reports', 'Reports', 'reports_view');
  add('permissions', 'Permissions', 'permissions_edit');
  add('system_settings', 'Settings', 'branding_view');

  if (r === 'developer') {
    tabs.push({ key: 'saas', label: 'Developer Hub' });
  }

  return tabs;
}

// Helper: get primary role + features from session.user
function getSessionRoleInfo(req) {
  const user = req?.session?.user || {};
  const roles = Array.isArray(user.roles) ? user.roles : (user.role ? [user.role] : []);
  const primaryRole = roles[0] || null;
  const features = user.features || [];
  return { primaryRole, roles, features };
}

// GET /me/menu
async function getMenu(req, res) {
  const { primaryRole, features } = getSessionRoleInfo(req);
  if (!primaryRole) return res.status(401).json({ message: 'Not authenticated' });

  const tabs = buildTabs(primaryRole, features);
  return res.json({ role: primaryRole, tabs });
}

// GET /dashboard
async function getDashboard(req, res) {
  const { primaryRole } = getSessionRoleInfo(req);
  const userId = req?.session?.user?.id;
  const company_id = req.company_id;

  if (!userId || !primaryRole) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const role = String(primaryRole).toLowerCase();

  try {
    // 0. Fetch logged-in user profile — scoped to company
    const [meRows] = await pool.execute(
      `SELECT ${BASE_EMP_FIELDS}
         FROM employee_records e
        WHERE e.id = ? AND e.company_id = ?
        LIMIT 1`,
      [userId, company_id]
    );
    const myProfile = meRows[0] || null;
    const myDept = myProfile?.Department || null;

    // Helper to check if a Date/string matches today
    const isBirthdayToday = (dob) => {
      if (!dob) return false;
      const now = new Date();
      const currentDay = now.getDate();
      const currentMonthIndex = now.getMonth();
      if (dob instanceof Date) {
        return dob.getDate() === currentDay && dob.getMonth() === currentMonthIndex;
      }
      const dobStr = String(dob);
      if (dobStr.includes('-') && dobStr.length > 7 && !isNaN(Date.parse(dobStr))) {
        const d = new Date(dobStr);
        return d.getDate() === currentDay && d.getMonth() === currentMonthIndex;
      }
      const parts = dobStr.split('-');
      if (parts.length < 2) return false;
      const day = parseInt(parts[0], 10);
      const monthStr = parts[1].toLowerCase();
      const months = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
      const birthMonthIndex = months.indexOf(monthStr);
      return day === currentDay && birthMonthIndex === currentMonthIndex;
    };

    const enrichTeamWithBirthdays = (teamList) => {
      return (teamList || []).map(m => ({
        ...m,
        is_birthday_today: isBirthdayToday(m.Date_of_Birth)
      }));
    };

    // Company birthdays — scoped to THIS company
    const getCompanyBirthdays = async () => {
      const [allEmpDOBs] = await pool.query(
        "SELECT id, Employee_Name, Date_of_Birth, profile_img, Department FROM employee_records WHERE is_active = 1 AND company_id = ?",
        [company_id]
      );
      return allEmpDOBs
        .filter(e => e.id !== userId && isBirthdayToday(e.Date_of_Birth))
        .map(e => ({ name: e.Employee_Name, id: e.id, profile_img: e.profile_img, department: e.Department }));
    };

    const isMyBirthday = isBirthdayToday(myProfile?.Date_of_Birth);
    const colleaguesBirthdays = await getCompanyBirthdays();

    // Managers — scoped to THIS company and THIS department (unless they are admin/hr/dev)
    const getManagersList = async (dept) => {
      let query = `SELECT DISTINCT ${BASE_EMP_FIELDS}
         FROM employee_records e
         JOIN users_types ut ON ut.type IN ('manager', 'zone_manager', 'director', 'admin', 'super_admin')
         JOIN employee_user_types eut ON eut.employee_id = e.id AND eut.user_type_id = ut.id
         WHERE e.is_active = 1 AND e.id != ? AND e.company_id = ?`;
      let params = [userId, company_id];

      if (dept) {
        query += " AND e.Department = ?";
        params.push(dept);
      }

      const [mgrRows] = await pool.query(query + " LIMIT 10", params);
      return mgrRows;
    };

    // Filter managers for regular users/managers to their own department
    const managers = await getManagersList((['super_admin', 'admin', 'developer', 'hr'].includes(role)) ? null : myDept);

    // Widget Logic per Role — ALL scoped to company_id
    if (['super_admin', 'admin', 'developer', 'hr'].includes(role)) {
      const [[{ totalEmployees }]] = await pool.query(
        'SELECT COUNT(*) AS totalEmployees FROM employee_records WHERE company_id = ?',
        [company_id]
      );

      const [[{ presentToday }]] = await pool.query(
        "SELECT COUNT(*) as count FROM attendance_daily WHERE attendance_date = CURDATE() AND status IN ('PRESENT', 'LATE') AND company_id = ?",
        [company_id]
      );

      const [[{ lateToday }]] = await pool.query(
        "SELECT COUNT(*) as count FROM attendance_daily WHERE attendance_date = CURDATE() AND status = 'LATE' AND company_id = ?",
        [company_id]
      );

      const [[{ onLeave }]] = await pool.query(
        "SELECT COUNT(*) as count FROM leave_applications WHERE status = 'approved' AND CURDATE() BETWEEN start_date AND end_date AND company_id = ?",
        [company_id]
      );

      let teamQuery = `
        SELECT ${BASE_EMP_FIELDS}, ad.status AS attendance_status
        FROM employee_records e
        LEFT JOIN attendance_daily ad ON ad.employee_id = e.id AND ad.attendance_date = CURDATE()
        WHERE e.is_active = 1 AND e.id != ? AND e.company_id = ?`;
      let teamParams = [userId, company_id];

      if (myDept) {
        teamQuery += " AND e.Department = ?";
        teamParams.push(myDept);
      }

      const [team] = await pool.execute(
        teamQuery + " ORDER BY e.id DESC LIMIT 25",
        teamParams
      );

      const [news] = await pool.query(
        "SELECT n.*, e.Employee_Name as author_name FROM news n LEFT JOIN employee_records e ON n.author_id = e.id WHERE n.is_published = 1 AND (n.company_id = ? OR n.company_id IS NULL) ORDER BY n.created_at DESC LIMIT 5",
        [company_id]
      );

      return res.json({
        role,
        profile: myProfile,
        widgets: {
          totalEmployees,
          presentToday,
          lateToday,
          onLeave,
          recentEmployees: enrichTeamWithBirthdays(team),
          teamRecent: enrichTeamWithBirthdays(team),
          team: enrichTeamWithBirthdays(team),
          managers: enrichTeamWithBirthdays(managers),
          birthdayToday: isMyBirthday,
          colleaguesBirthdays,
          news
        }
      });
    }

    if (role === 'manager' || role === 'zone_manager' || role === 'director') {
      let teamParams = [userId, company_id];

      const [team] = await pool.query(
        `SELECT ${BASE_EMP_FIELDS}, ad.status AS attendance_status, e.Date_of_Birth
         FROM employee_records e
         LEFT JOIN attendance_daily ad ON ad.employee_id = e.id AND ad.attendance_date = CURDATE()
         WHERE e.is_active = 1 AND e.id != ? AND e.company_id = ? ${myDept ? 'AND e.Department = ?' : ''}
         ORDER BY e.id DESC LIMIT 25`,
        myDept ? [...teamParams, myDept] : teamParams
      );

      const [[{ totalEmployees }]] = await pool.query(
        `SELECT COUNT(*) AS totalEmployees FROM employee_records WHERE company_id = ? ${myDept ? 'AND Department = ?' : ''}`,
        myDept ? [company_id, myDept] : [company_id]
      );

      return res.json({
        role,
        profile: myProfile,
        widgets: {
          totalEmployees,
          teamRecent: enrichTeamWithBirthdays(team),
          team: enrichTeamWithBirthdays(team),
          managers: enrichTeamWithBirthdays(managers),
          birthdayToday: isMyBirthday,
          colleaguesBirthdays
        }
      });
    }

    if (role === 'accounts' || role === 'payroll') {
      return res.json({
        role,
        profile: myProfile,
        widgets: {
          payrollPanel: { lastRun: null, pending: 0 },
          birthdayToday: isMyBirthday,
          colleaguesBirthdays
        }
      });
    }

    // Default user — scoped to company and department
    let teamQuery = `SELECT ${BASE_EMP_FIELDS}, ad.status AS attendance_status
       FROM employee_records e
       LEFT JOIN attendance_daily ad ON ad.employee_id = e.id AND ad.attendance_date = CURDATE()
       WHERE e.is_active = 1 AND e.id != ? AND e.company_id = ?`;
    let teamParams = [userId, company_id];

    if (myDept) {
      teamQuery += " AND e.Department = ?";
      teamParams.push(myDept);
    }

    const [team] = await pool.query(
      teamQuery + " ORDER BY e.id DESC LIMIT 25",
      teamParams
    );

    return res.json({
      role,
      profile: myProfile,
      widgets: {
        tips: ['Complete your profile', 'Change your password regularly'],
        birthdayToday: isMyBirthday,
        colleaguesBirthdays,
        team: enrichTeamWithBirthdays(team),
        managers: enrichTeamWithBirthdays(managers)
      }
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function listAllUsers(req, res) {
  const { roles } = getSessionRoleInfo(req);
  const lowerRoles = roles.map(r => String(r).toLowerCase());
  if (
    !lowerRoles.includes("admin") &&
    !lowerRoles.includes("super_admin") &&
    !lowerRoles.includes("hr") &&
    !lowerRoles.includes("developer")
  ) {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT ${BASE_EMP_FIELDS}
         FROM employee_records e
        WHERE e.company_id = ?
        ORDER BY e.id DESC`,
      [req.company_id]
    );
    return res.json(rows);
  } catch (err) {
    console.error('Admin list employees error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { getMenu, getDashboard, listAllUsers };


