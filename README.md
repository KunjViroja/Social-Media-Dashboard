# 🌐 Social Media Dashboard

> A production-ready, full-stack Social Media Dashboard built with the **MERN Stack** — developed as a major internship project demonstrating enterprise-level software engineering practices.

[![Node.js](https://img.shields.io/badge/Node.js-v20-green?logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-v18-blue?logo=react)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb)](https://mongodb.com)
[![Redis](https://img.shields.io/badge/Redis-Cache-red?logo=redis)](https://redis.io)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-RealTime-black?logo=socket.io)](https://socket.io)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](https://docker.com)

---

## ✨ Features

### 🔐 Authentication
- Register / Login / Logout
- JWT Access + Refresh Token strategy
- Email Verification via Resend
- Forgot / Reset Password flow
- Protected Routes

### 👤 User Profiles
- Upload Profile Picture & Cover Image (Cloudinary)
- Bio, Skills, Location, Website
- Followers / Following
- Media Gallery

### 📝 Social Features
- Create / Edit / Delete Posts (Text, Image, Video)
- Like, Comment, Reply (Nested Comments)
- Share & Bookmark Posts
- Follow / Unfollow Users
- Suggested Users
- News Feed & Trending Posts
- Hashtags & Search

### ⚡ Real-Time (Socket.IO)
- Live Messaging with Seen Status
- Typing Indicators
- Online User Presence
- Live Notifications (Likes, Comments, Follows)

### 🔔 Notification System (Redis)
- Like, Comment, Follow, Message, Mention notifications
- Unread count badge
- Mark as read / Mark all read

### 📊 Analytics Dashboard
- Total Users, DAU, Posts, Likes, Comments
- Follower Growth Charts
- Weekly / Monthly Engagement
- Top Posts & Most Active Users

### 🛡️ Admin Panel
- Manage Users (Block / Delete)
- Delete Posts
- View Reports & Analytics

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, Redux Toolkit, Tailwind CSS, Framer Motion |
| **Backend** | Node.js, Express.js, Socket.IO |
| **Database** | MongoDB (Mongoose), Redis |
| **Auth** | JWT (Access + Refresh Tokens), bcrypt |
| **Media** | Cloudinary, Multer |
| **Email** | Resend API |
| **Charts** | Recharts |
| **Deployment** | Docker, Docker Compose |

---

## 📁 Project Structure

```
social-media-dashboard/
├── client/                 # React Frontend (Vite)
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── pages/          # Route-level page components
│       ├── layouts/        # Layout wrappers
│       ├── hooks/          # Custom React hooks
│       ├── services/       # API service layer (Axios)
│       ├── redux/          # Redux store + slices
│       ├── context/        # React context (Socket)
│       └── utils/          # Utility functions
│
├── server/                 # Node.js Backend (Express)
│   └── src/
│       ├── controllers/    # Route handlers
│       ├── routes/         # Express routers
│       ├── models/         # Mongoose schemas
│       ├── middleware/     # Auth, upload, rate limit
│       ├── services/       # Business logic layer
│       ├── socket/         # Socket.IO handlers
│       ├── validators/     # Input validation
│       ├── config/         # DB, Redis, Cloudinary config
│       └── utils/          # Helpers, response wrappers
│
├── docker-compose.yml      # Container orchestration
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v20+
- Docker Desktop
- MongoDB Atlas account
- Cloudinary account
- Resend account

### 1. Clone the repo
```bash
git clone https://github.com/KunjViroja/Social-Media-Dashboard.git
cd Social-Media-Dashboard
```

### 2. Backend Setup
```bash
cd server
npm install
cp .env.example .env
# Fill in your .env values
npm run dev
```

### 3. Frontend Setup
```bash
cd client
npm install
cp .env.example .env
# Fill in your .env values
npm run dev
```

### 4. Run with Docker
```bash
docker-compose up --build
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/users/:username` | Get user profile |
| GET | `/api/posts/feed` | Get news feed |
| POST | `/api/posts` | Create post |
| POST | `/api/posts/:id/like` | Like/Unlike post |
| GET | `/api/messages/conversations` | Get conversations |
| GET | `/api/notifications` | Get notifications |
| GET | `/api/analytics/overview` | Analytics overview |

> Full API documentation in `/server/docs/API.md`

---

## 📸 Screenshots

> Screenshots will be added after UI completion.

---

## 👨‍💻 Author

**Kunj Viroja** — Internship Project @ Codec Technologies

---

## 📄 License

MIT License — feel free to use this as a reference project.
