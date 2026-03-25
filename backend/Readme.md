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

# ⚙️ Installation

> `git clone https://github.com/PK-PUSHPAM/Online-Voting-System`  
> `cd backend`  
> `npm install`

# ▶️ Run Server

> `npm run dev`

## Server runs on:

- http://localhost:5000

# 🔑 Environment Variables

## Create .env file:

```
    PORT=5000
    NODE_ENV=development

    MONGODB_URI=your_mongodb_uri

    ACCESS_TOKEN_SECRET=your_access_secret
    ACCESS_TOKEN_EXPIRY=1d

    REFRESH_TOKEN_SECRET=your_refresh_secret
    REFRESH_TOKEN_EXPIRY=7d

    CORS_ORIGIN=http://localhost:5173

    # 📱 SMS (Development Mode)
    SMS_PROVIDER=mock
    OTP_MESSAGE_TEMPLATE=Your OTP is {{otp}}

    # 📧 Email (OTP)
    EMAIL_USER=yourgmail@gmail.com
    EMAIL_PASS=your_google_app_password

    # ☁️ Cloudinary
    CLOUDINARY_CLOUD_NAME=your_cloud
    CLOUDINARY_API_KEY=your_key
    CLOUDINARY_API_SECRET=your_secret
```

# 🔐 Roles

| Role  |     | Permissions                     |
| ----- | --- | ------------------------------- |
| Voter |     | Register, vote, view elections  |
| Admin |     | Verify voters, manage elections |
| Super |     | Admin Full system control       |

# 🔗 API Base URL

    http://localhost:5000/api/v1

# 📡 API Overview

### Auth

    POST /auth/send-otp
    POST /auth/register
    POST /auth/login
    POST /auth/login-with-otp
    POST /auth/reset-password
    GET /auth/me
    POST /auth/logout

### Users

    GET /users/pending-voters
    GET /users/all-voters
    GET /users/voter/:id
    PATCH /users/approve-voter/:id
    PATCH /users/reject-voter/:id

### Admin

    GET /admin/dashboard-summary
    POST /admin/create-admin
    PATCH /admin/update-status/:id
    PATCH /admin/change-role/:id
    GET /admin/all-admins
    GET /admin/audit-logs

### Elections

    POST /elections
    GET /elections
    GET /elections/:id
    PATCH /elections/:id
    DELETE /elections/:id

### Posts

    POST /posts
    GET /posts/election/:id
    PATCH /posts/:id
    DELETE /posts/:id

### Candidates

    POST /candidates
    GET /candidates/post/:id
    PATCH /candidates/:id
    PATCH /candidates/approve/:id
    DELETE /candidates/:id

### Votes

    POST /votes
    GET /votes/my
    GET /votes/election/:id

### Results

    GET /results/election/:id
    GET /results/election/:id/post/:id

### Uploads

    POST /uploads/candidate-photo
    POST /uploads/voter-document

# 🧪 Development Notes

    Mobile OTP → mock mode
    Email OTP → real working
    Use Postman for testing
    Use MongoDB Compass for DB inspection

# ⚠️ Important

    Do NOT expose .env
    Always hash passwords
    Use App Password for Gmail
    Rotate API keys if leaked

# 🚀 Future Improvements

    Rate limiting (anti-spam OTP)
    Multi-provider SMS fallback
    Real-time vote analytics
    WebSocket updates
    Admin UI dashboard charts
    Deployment (Docker + CI/CD)

# 👨‍💻 Author

    Pushpam
    B.Tech CSE
    Online Voting System Project

# ⭐ Support

- If you like this project, consider giving it a ⭐ on GitHub.
