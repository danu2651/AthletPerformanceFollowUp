# APTS v2.0 – Athlete Performance Tracking System

This is an enhanced version (v2.0) of the Athlete Performance Tracking System, focusing on improved usability, modern UI/UX, and real-time performance analytics.

> ⚠️ This version is developed as an improved fork of the original project, introducing a redesigned frontend and enhanced data visualization features.

---

## 🧠 Overview

APTS is a full-stack web application designed to help athletes:

* Track training sessions
* Monitor performance metrics
* Analyze progress over time

Version 2.0 improves both **visual experience** and **data clarity**, making the system more practical for real-world use.

---

## 🛠 Tech Stack

### Frontend

* Next.js 14+ (App Router)
* Tailwind CSS (Styling)
* Framer Motion (Animations)
* Recharts (Charts & Analytics)
* Lucide React (Icons)

### Backend

* Node.js
* Express.js
* PostgreSQL
* JWT Authentication
* Axios (API communication)

---

## 🚀 Features

* 📊 Interactive performance charts (velocity trends)
* 🧮 Core metrics tracking:

  * Distance (KM)
  * Duration
  * Altitude
  * Temperature
* 📍 Route logging (start & end points)
* 📈 Performance comparison (pace variance)
* 📱 Fully responsive UI (mobile + desktop)

---

## ⚙️ Getting Started

Follow these steps to run the project locally.

---

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_FORKED_REPO.git
cd YOUR_FORKED_REPO
```

---

### 2. Setup Environment Variables

Create a `.env` file (in root or backend folder):

```env
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=
PORT=5000
```

---

### 3. Install Dependencies

#### Frontend

```bash
npm install
```

#### Backend (if inside `/backend`)

```bash
cd backend
npm install
cd ..
```

---

### 4. Setup Database

* Make sure PostgreSQL is running
* Run your SQL schema or migration scripts

Example:

```bash
psql -U postgres -d your_database -f database/schema.sql
```

---

### 5. Run the Application

```bash
npm run dev
```

* Frontend → http://localhost:3000
* Backend → http://localhost:5000

---

## 📈 Roadmap

* [x] Modern UI/UX redesign
* [x] Performance analytics dashboard
* [ ] GPS / Map integration
* [ ] Smart insights (AI-based coaching)
* [ ] Mobile app version
* [ ] Wearable integration (smartwatch)

---

## 👨‍💻 Author

Developed by **Dani**
Computer Science Student | Full-Stack Developer

---

## 📌 Notes

This version focuses on improving:

* User experience
* Data visualization
* Real-world usability for athletes

Future updates will include smarter analytics and deeper performance insights.
