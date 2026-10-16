# VentureBridge

VentureBridge is a modern, professional MERN stack startup-investor discovery and collaboration platform. It connects entrepreneurs with suitable investors through intelligent matching, enabling meaningful connections without handling actual investments or payments.

## 🌟 Features

### Core Functionality
- **Smart Matching Engine**: Rule-based algorithm matching startups with investors based on industry, funding range, stage, risk, location, and equity compatibility
- **Role-Based Access**: Separate workflows for Entrepreneurs, Investors, and Admins
- **Profile Management**: Comprehensive startup and investor profiles with verification
- **Discovery & Search**: Advanced filtering and search capabilities
- **Collaboration Requests**: Send, accept, reject connection requests
- **Real-Time Chat**: Socket.IO powered messaging between connected users
- **Favourites/Watchlist**: Investors can bookmark interesting startups
- **Notifications**: In-app notification system for all key activities
- **Admin Panel**: Complete user, startup, and report management

### Security & Best Practices
- JWT authentication with HTTP-only cookies
- Password hashing with bcrypt
- Role-based authorization
- Rate limiting
- Input validation
- CORS configuration
- Helmet security headers
- MongoDB injection protection

## 🛠️ Technology Stack

### Frontend
- React.js with Vite
- Tailwind CSS
- Recharts for analytics
- Lucide React icons
- Socket.IO Client for real-time features

### Backend
- Node.js & Express.js
- MongoDB & Mongoose
- JWT authentication
- Socket.IO for real-time chat
- bcryptjs for password hashing

## 📦 Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd venturebridge
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
Copy `.env.example` to `.env` and configure:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/venturebridge
JWT_SECRET=your-secure-random-secret-key-here
CLIENT_URL=http://localhost:5173
ADMIN_EMAIL=admin@venturebridge.local
ADMIN_PASSWORD=change-this-password
```

4. **Start MongoDB**
Ensure MongoDB is running on your system.

5. **Create Admin User**
```bash
npm run seed:admin
```

6. **Seed Demo Data (Optional)**
```bash
npm run seed:data
```

## 🚀 Running the Application

### Development Mode

**Terminal 1 - Start Backend:**
```bash
npm run server:dev
```

**Terminal 2 - Start Frontend:**
```bash
npm run dev
```

The backend API will run on `http://localhost:5000` and the frontend on `http://localhost:5173`.

### Production Build

```bash
npm run build
npm run preview
```

## 🔐 Test Credentials

After running `npm run seed:data`:

**Entrepreneur:**
- Email: `entrepreneur1@example.com`
- Password: `password123`

**Investor:**
- Email: `investor1@example.com`
- Password: `password123`

**Admin:**
- Email: (set in .env)
- Password: (set in .env)

## 📡 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Startups
- `GET /api/startups` - Get all startups (with filters)
- `GET /api/startups/:id` - Get startup by ID
- `GET /api/startups/me/profile` - Get my startup
- `POST /api/startups` - Create startup (entrepreneur only)
- `PUT /api/startups/me/profile` - Update startup
- `DELETE /api/startups/me/profile` - Delete startup

### Investors
- `GET /api/investors` - Get all investors (with filters)
- `GET /api/investors/:id` - Get investor by ID
- `GET /api/investors/me/profile` - Get my investor profile
- `POST /api/investors` - Create investor profile
- `PUT /api/investors/me/profile` - Update investor profile
- `DELETE /api/investors/me/profile` - Delete investor profile

### Matching
- `GET /api/matching/investors` - Get recommended investors (entrepreneur)
- `GET /api/matching/startups` - Get recommended startups (investor)
- `GET /api/matching/startup/:startupId/investor/:investorId` - Get match score

### Collaboration Requests
- `POST /api/requests` - Send collaboration request
- `GET /api/requests/sent` - Get sent requests
- `GET /api/requests/received` - Get received requests
- `PUT /api/requests/:id/accept` - Accept request
- `PUT /api/requests/:id/reject` - Reject request
- `PUT /api/requests/:id/cancel` - Cancel request

### Connections
- `GET /api/connections` - Get all connections
- `GET /api/connections/:id` - Get connection details
- `PUT /api/connections/:id/activity` - Update activity
- `PUT /api/connections/:id/archive` - Archive connection

### Chat
- `GET /api/chat/conversations` - Get all conversations
- `GET /api/chat/conversations/:id` - Get conversation with messages
- `POST /api/chat/messages` - Send message
- `PUT /api/chat/conversations/:conversationId/read` - Mark as read

### Favourites
- `POST /api/favourites` - Add to favourites
- `GET /api/favourites` - Get favourites
- `DELETE /api/favourites/:startupId` - Remove from favourites
- `GET /api/favourites/:startupId/check` - Check if favourite

### Notifications
- `GET /api/notifications` - Get notifications
- `GET /api/notifications/unread/count` - Get unread count
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

### Admin (Admin Only)
- `GET /api/admin/stats` - Platform statistics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:id` - Get user details
- `PUT /api/admin/users/:id/status` - Update user status
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/startups` - Get all startups
- `PUT /api/admin/startups/:id/verification` - Update verification
- `GET /api/admin/reports` - Get reports
- `PUT /api/admin/reports/:id` - Update report status

## 🎯 Matching Algorithm

The platform uses a configurable rule-based matching algorithm:

**Scoring Weights:**
- Industry Match: 30%
- Investment Range Match: 25%
- Startup Stage Match: 15%
- Risk Preference Match: 10%
- Location Match: 10%
- Equity Compatibility: 10%

**Total: 100%**

Match results include:
- Overall match score (0-100%)
- Breakdown of matching factors
- Human-readable explanations

## 📁 Project Structure

```
venturebridge/
├── server/
│   └── src/
│       ├── config/        # Database configuration
│       ├── controllers/   # Request handlers
│       ├── models/        # Mongoose models
│       ├── routes/        # API routes
│       ├── services/      # Business logic
│       ├── middleware/    # Auth, error handling
│       ├── socket/        # Socket.IO handlers
│       ├── scripts/       # Seed scripts
│       └── app.js         # Express app setup
├── src/
│   ├── main.jsx          # React entry point
│   └── styles.css        # Global styles
├── index.html
├── package.json
└── README.md
```

## 🔒 Security Features

- Password hashing with bcrypt (12 rounds)
- JWT tokens with HTTP-only cookies
- Role-based authorization middleware
- Rate limiting (300 requests per 15 minutes)
- Helmet security headers
- CORS configuration
- Input validation
- Duplicate request prevention
- MongoDB injection protection

## 🚧 Development Roadmap

### Phase 1: ✅ Complete
- Authentication & Authorization
- User Management
- Profile Management (Startup & Investor)
- Smart Matching Engine
- Search & Filters
- Collaboration Requests
- Connections
- Real-Time Chat
- Notifications
- Admin Panel

### Phase 2: Future Enhancements
- AI-powered startup analysis
- AI recommendation system
- Email notifications
- File upload (Cloudinary/S3)
- Advanced analytics
- Document management
- Video pitch support
- Multi-language support

## ⚠️ Important Notes

1. **This platform does NOT handle**:
   - Actual investments
   - Payment processing
   - Money transfers
   - Financial transactions

2. **Purpose**: Discovery, matching, and communication platform only

3. **Admin Access**: Create admin user via seed script, not public registration

4. **Production**: Configure proper JWT secrets, database credentials, and CORS settings

## 🤝 Contributing

This is a comprehensive platform. When contributing:
- Follow existing code structure
- Maintain security best practices
- Add tests for new features
- Update API documentation

## 📄 License

[Your License Here]

## 🆘 Support

For issues and questions, please check the API documentation or create an issue in the repository.
