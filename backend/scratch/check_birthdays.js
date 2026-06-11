const { pool } = require('../Utils/db');

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

async function findBirthdays() {
    const [rows] = await pool.query("SELECT id, Employee_Name, Date_of_Birth FROM employee_records WHERE is_active = 1");
    const today = rows.filter(e => isBirthdayToday(e.Date_of_Birth));
    console.log("Birthdays today:", JSON.stringify(today, null, 2));
    process.exit(0);
}

findBirthdays();
