const path = require('path');
const fs = require('fs');

const testPath = path.join(__dirname, 'Controller', 'Office', 'OfficeController.js');
console.log('Target Path:', testPath);
console.log('Exists:', fs.existsSync(testPath));

try {
    const Office = require('./Controller/Office/OfficeController');
    console.log('Require successful!');
} catch (e) {
    console.log('Require failed:', e.message);
    console.log('Stack:', e.stack);
}
