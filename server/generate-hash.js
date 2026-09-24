const bcrypt = require('bcryptjs');

const password = 'admin123';
const saltRounds = 10;

const hash = bcrypt.hashSync(password, saltRounds);
console.log('Password:', password);
console.log('Hash:', hash);
