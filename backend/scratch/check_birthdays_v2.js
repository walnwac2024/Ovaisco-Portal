const { pool } = require('../Utils/db');

const isBirthdayTodayImproved = (dob) => {
    if (!dob) return false;
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonthIndex = now.getMonth();
    
    // If it's a Date object
    if (dob instanceof Date) {
        return dob.getDate() === currentDay && dob.getMonth() === currentMonthIndex;
    }
    
    const dobStr = String(dob).trim();
    if (!dobStr) return false;

    // Try standard Date parsing (handles YYYY-MM-DD, MM/DD/YYYY, etc.)
    const parsedDate = new Date(dobStr);
    if (!isNaN(parsedDate.getTime())) {
        // Warning: new Date("YYYY-MM-DD") is UTC, while new Date("YYYY/MM/DD") is local.
        // To be safe, we check if the day/month matches in either local or UTC
        const matchesLocal = parsedDate.getDate() === currentDay && parsedDate.getMonth() === currentMonthIndex;
        const matchesUTC = parsedDate.getUTCDate() === currentDay && parsedDate.getUTCMonth() === currentMonthIndex;
        if (matchesLocal || matchesUTC) return true;
    }

    // Try manual parsing for DD-Mon-YY or DD-MM-YYYY
    const parts = dobStr.split(/[-/ ]/);
    if (parts.length < 2) return false;

    let day = parseInt(parts[0], 10);
    let monthPart = parts[1].toLowerCase();
    
    const months = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
    let monthIndex = months.indexOf(monthPart);

    // Handle numeric months (e.g., 05 or 5)
    if (monthIndex === -1 && !isNaN(parseInt(monthPart, 10))) {
        monthIndex = parseInt(monthPart, 10) - 1;
    }

    if (monthIndex === currentMonthIndex && day === currentDay) {
        return true;
    }

    // Handle MM-DD format
    if (parts.length >= 2) {
        let m2 = parseInt(parts[0], 10) - 1;
        let d2 = parseInt(parts[1], 10);
        if (m2 === currentMonthIndex && d2 === currentDay) return true;
    }

    return false;
};

async function checkAll() {
    const [rows] = await pool.query("SELECT id, Employee_Name, Date_of_Birth FROM employee_records");
    const today = rows.filter(e => isBirthdayTodayImproved(e.Date_of_Birth));
    console.log("Matching Birthdays:", JSON.stringify(today, null, 2));
    process.exit(0);
}

checkAll();
