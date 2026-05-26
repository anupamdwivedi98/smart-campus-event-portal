// Seed script — creates default admin + a few events.
// Safe to run multiple times (uses INSERT IGNORE / ON DUPLICATE KEY).
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('./connection');

async function main() {
  const adminEmail = 'admin@iilm.edu';
  const adminPassword = 'Admin@123';
  const hash = await bcrypt.hash(adminPassword, 10);

  await pool.query(
    `INSERT INTO users (full_name, email, password_hash, role)
     VALUES (?, ?, ?, 'admin')
     ON DUPLICATE KEY UPDATE email = email`,
    ['Portal Admin', adminEmail, hash]
  );

  const events = [
    ['Applied AI & Machine Learning Workshop',
      'Hands-on session exploring predictive modeling and neural network fundamentals for students.',
      'workshop', '2026-05-12', 'Lab 402', 60,
      'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800'],
    ['Modern Web Dev Intensive Bootcamp',
      '3-day immersive bootcamp covering React, Tailwind CSS, and modern frontend tooling.',
      'bootcamp', '2026-05-18', 'Main Auditorium', 120,
      'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=800'],
    ['Smart Campus IoT Challenge',
      'Build innovative connected devices to solve real-world sustainability issues on campus.',
      'hackathon', '2026-06-05', 'Innovation Hub', 80,
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800'],
    ['Startup Pitch Clinic',
      'Refine your business model and practice your pitch deck with feedback from seasoned VCs.',
      'seminar', '2026-06-14', 'Seminar Hall B', 50,
      'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800'],
  ];

  // Only seed events if the table is empty, so user edits are preserved.
  const [rows] = await pool.query('SELECT COUNT(*) AS c FROM events');
  if (rows[0].c === 0) {
    for (const e of events) {
      await pool.query(
        `INSERT INTO events (title, description, category, event_date, location, capacity, image_url)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        e
      );
    }
    console.log(`Seeded ${events.length} events.`);
  } else {
    console.log('Events table already has rows — skipping event seed.');
  }

  console.log('\n✓ Seed complete.');
  console.log('  Admin login:');
  console.log('    email:    admin@iilm.edu');
  console.log('    password: Admin@123');
  console.log('  (change the password after first login)\n');

  await pool.end();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
