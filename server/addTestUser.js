const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./meetings.db');

const firstName = 'Test';
const lastName = 'User';
const email = 'testuser@example.com';
const password = 'testpassword';

bcrypt.hash(password, 10, (err, hash) => {
  if (err) throw err;
  db.run(
    `INSERT INTO users (firstName, lastName, email, password) VALUES (?, ?, ?, ?)`,
    [firstName, lastName, email, hash],
    function (err) {
      if (err) {
        console.error('Error inserting user:', err.message);
      } else {
        console.log('Test user added with email:', email);
      }
      db.close();
    }
  );
});
