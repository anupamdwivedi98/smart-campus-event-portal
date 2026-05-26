# 🎓 Smart Campus Event Portal

> A full-stack campus event management platform that enables students to discover, register, and manage university events while providing administrators with centralized event and registration management.

![Node.js](https://img.shields.io/badge/Node.js-Backend-green)
![Express.js](https://img.shields.io/badge/Express.js-Framework-black)
![MySQL](https://img.shields.io/badge/MySQL-Database-blue)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow)
![GitHub](https://img.shields.io/badge/GitHub-Version_Control-lightgrey)

---

## 📖 Overview

Smart Campus Event Portal is a full-stack web application designed to streamline campus event management. Students can browse events, create accounts, register for activities, and track participation, while administrators can manage events and monitor registrations through a dedicated dashboard.

The project demonstrates real-world software engineering concepts including authentication, database integration, REST APIs, session management, and role-based access control.

---

## ✨ Key Features

### 🔐 Authentication & Security
- Student signup and login system
- Secure password hashing with bcrypt
- Session-based authentication
- Protected routes and middleware authorization

### 🎯 Event Management
- Create and manage campus events
- Event categorization (Workshop, Hackathon, Seminar, Bootcamp)
- Capacity management
- Event scheduling and descriptions

### 📝 Registration System
- Student event registration workflow
- Registration tracking
- Duplicate registration prevention
- Registration status management

### 👨‍💼 Admin Dashboard
- Administrator-only access
- View all registrations
- Monitor participation records
- Manage event data efficiently

### ⚡ Interactive Experience
- AJAX-powered operations
- Dynamic event search
- Responsive user interface
- Real-time user feedback

---

## 🏗️ System Architecture

```text
Client (HTML/CSS/JS)
        │
        ▼
Express.js Server
        │
        ▼
Authentication Middleware
        │
        ▼
REST API Routes
        │
        ▼
MySQL Database
```

---

## 🛠️ Tech Stack

### Backend
- Node.js
- Express.js
- MySQL
- Express Session
- bcryptjs

### Frontend
- HTML5
- CSS3
- JavaScript (ES6)

### Database
- MySQL Server

### Development Tools
- Git
- GitHub
- VS Code

---

## 📂 Project Structure

```text
smart-campus-event-portal
│
├── db/
│   ├── connection.js
│   ├── init.js
│   └── schema.sql
│
├── middleware/
│   └── auth.js
│
├── routes/
│   ├── auth.js
│   ├── events.js
│   └── registrations.js
│
├── public/
│   ├── assets/
│   ├── css/
│   ├── js/
│   └── index.html
│
├── server.js
├── package.json
└── .gitignore
```

---

## 🚀 Getting Started

### 1️⃣ Clone Repository

```bash
git clone https://github.com/anupamdwivedi98/smart-campus-event-portal.git
cd smart-campus-event-portal
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Create Database

```sql
CREATE DATABASE iilm_events;
```

### 4️⃣ Import Schema

```bash
mysql -u root -p iilm_events < db/schema.sql
```

### 5️⃣ Configure Environment Variables

Create a `.env` file:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=iilm_events
SESSION_SECRET=your_secret_key
```

### 6️⃣ Seed Initial Data

```bash
npm run init-db
```

### 7️⃣ Run Application

```bash
npm start
```

Open:

```text
http://localhost:3000
```

---

## 🔑 Demo Admin Credentials

```text
Email    : admin@iilm.edu
Password : Admin@123
```

---

## 🎯 Software Engineering Concepts Demonstrated

- RESTful API Development
- Authentication & Authorization
- Session Management
- Middleware Design
- Database Schema Design
- CRUD Operations
- Client–Server Architecture
- AJAX Integration
- Secure Password Storage
- Full-Stack Development

---

## 📈 Future Enhancements

- Email Notifications
- QR Code Check-in System
- Event Analytics Dashboard
- Cloud Deployment
- Attendance Tracking
- Role-based Permission Levels
- Admin Reporting Module

---

## 👨‍💻 Author

**Anupam Dwivedi**

- GitHub: https://github.com/anupamdwivedi98

---

## ⭐ If you found this project useful, consider giving it a star.
