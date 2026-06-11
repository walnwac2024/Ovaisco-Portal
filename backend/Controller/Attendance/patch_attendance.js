const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'Attendance.js');
let code = fs.readFileSync(filePath, 'utf8');

// 1. resolveShiftForDate
code = code.replace(/async function resolveShiftForDate\(dateStr\)/g, "async function resolveShiftForDate(dateStr, companyId = 1)");
code = code.replace(/WHERE is_active = 1\s+AND \? BETWEEN/g, "WHERE is_active = 1\n      AND company_id = ?\n      AND ? BETWEEN");
code = code.replace(/\[dateStr\]/g, "[companyId, dateStr]");

// fallback query in resolveShiftForDate
code = code.replace(/WHERE is_active = 1\s+ORDER BY/g, "WHERE is_active = 1 AND company_id = ?\n    ORDER BY");
code = code.replace(/LIMIT 1\r?\n\s+`/g, "LIMIT 1\n    `,\n    [companyId]");

// 2. getActiveRule
code = code.replace(/async function getActiveRule\(\)/g, "async function getActiveRule(companyId = 1)");
code = code.replace(/FROM attendance_rules\s+WHERE is_active = 1\s+ORDER BY/g, "FROM attendance_rules\n       WHERE is_active = 1 AND company_id = ?\n       ORDER BY");
code = code.replace(/LIMIT 1`/g, "LIMIT 1`,\n       [companyId]");

// 3. listOffices
code = code.replace(/FROM offices\s+WHERE is_active = 1\s+ORDER BY id ASC`/g, "FROM offices\n       WHERE is_active = 1 AND company_id = ?\n       ORDER BY id ASC`,\n       [req.company_id || 1]");

// 4. getToday
code = code.replace(/const shift = await resolveShiftForDate\(today\);/g, "const shift = await resolveShiftForDate(today, req.company_id || 1);");
code = code.replace(/const rule = await getActiveRule\(\);/g, "const rule = await getActiveRule(req.company_id || 1);");
code = code.replace(/WHERE employee_id = \? AND attendance_date = \?\s+LIMIT 1\s+`,\s+\[employeeId, today\]/g, "WHERE employee_id = ? AND attendance_date = ? AND company_id = ?\n      LIMIT 1\n      `,\n      [employeeId, today, req.company_id || 1]");

// 5. adminMissing
code = code.replace(/WHERE e\.is_active = 1\s+AND \(/g, "WHERE e.is_active = 1 AND e.company_id = ?\n        AND (");
code = code.replace(/\[date\]/g, "[date, req.company_id || 1]");

fs.writeFileSync(filePath, code, 'utf8');
console.log('Attendance.js updated successfully!');
