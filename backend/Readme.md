# 🗳️ Online Voting System - Backend

A production-ready backend for an **Online Voting System** built using **Node.js, Express, and MongoDB**.

This system supports secure voter registration, OTP-based authentication, election management, candidate handling, vote casting, and result computation with full audit logging.

---

## 🚀 Features

### 🔐 Authentication & Security

- Register with OTP verification (email + mobile mock)
- Login with password or OTP
- Reset password via OTP
- JWT-based authentication (Access + Refresh tokens)
- Cookie-based session handling
- Password hashing using bcrypt

---

### 👥 User & Voter Management

- Voter registration and verification system
- Admin approval/rejection with reason
- Pending / Approved / Rejected voter filtering
- Voter eligibility control

---

### 🛠️ Admin & Super Admin

- Create admin / super admin
- Change roles dynamically
- Activate / deactivate admin
- Prevent self-deactivation & last super admin protection
- Dashboard summary

---

### 🗳️ Election System

- Create, update, delete elections
- Auto status sync (upcoming / active / ended)
- Publish/unpublish elections
- Voter-type restriction (verified only / all)

---

### 📌 Post Management

- Create posts under elections
- Control max votes per voter
- Order and activate/deactivate posts

---

### 🧑‍💼 Candidate Management

- Add candidates per post
- Approve / reject candidates
- Attach user or independent candidate
- Candidate image upload support

---

### 🗳️ Voting System

- Secure vote casting
- Prevent duplicate voting
- Support multiple posts
- Transaction-based consistency

---

### 📊 Results & Analytics

- Election result summary
- Post-wise result breakdown
- Winner detection
- Vote aggregation (no direct vote exposure)

---

### 📁 File Uploads

- Candidate photo upload (Cloudinary)
- Voter document upload

---

### 📜 Audit Logs

- Track all critical actions:
  - login
  - admin actions
  - voter verification
  - election changes
  - candidate approvals
- Filter logs by:
  - action
  - user
  - date
  - role

---

## 🏗️ Tech Stack

- **Node.js**
- **Express.js**
- **MongoDB + Mongoose**
- **JWT Authentication**
- **Zod (validation)**
- **Multer (file handling)**
- **Cloudinary (media storage)**
- **Nodemailer (email OTP)**
- **Cookie-parser**

---

## 📁 Project Structure

```bash
backend/
├── public/
│   └── temp/
├── src/
│   ├── config/
│   ├── constants/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── validations/
│   ├── app.js
│   └── server.js
├── .env
├── package.json
└── README.md

```
