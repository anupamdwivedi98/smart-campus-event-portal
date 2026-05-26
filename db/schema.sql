-- IILM Events — MySQL schema
-- Run once:  mysql -u root -p < db/schema.sql
-- Then seed: npm run init-db

CREATE DATABASE IF NOT EXISTS iilm_events
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE iilm_events;

-- Users (students + admins)
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(120) NOT NULL,
  email         VARCHAR(180) NOT NULL UNIQUE,
  student_id    VARCHAR(40)  NULL,
  department    VARCHAR(80)  NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('student','admin') NOT NULL DEFAULT 'student',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Events
CREATE TABLE IF NOT EXISTS events (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(180) NOT NULL,
  description  TEXT NOT NULL,
  category     ENUM('workshop','bootcamp','hackathon','seminar') NOT NULL DEFAULT 'workshop',
  event_date   DATE NOT NULL,
  location     VARCHAR(180) NOT NULL,
  capacity     INT NOT NULL DEFAULT 100,
  image_url    VARCHAR(500) NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_date (event_date)
) ENGINE=InnoDB;

-- Registrations (user <-> event, one registration per pair)
CREATE TABLE IF NOT EXISTS registrations (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  event_id     INT NOT NULL,
  phone        VARCHAR(30) NULL,
  notes        TEXT NULL,
  status       ENUM('pending','confirmed','cancelled') NOT NULL DEFAULT 'confirmed',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_user_event (user_id, event_id)
) ENGINE=InnoDB;

-- Sessions table is auto-created by express-mysql-session on server start.
