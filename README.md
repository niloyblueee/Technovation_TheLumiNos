First Time

npm install in one terminal

cd backend and then npm install in another terminal

open xampp, start apache and mysql

create a database called technovation_luminos using php-myadmin or from Shell



TO RUN

cd backend

npm start

another terminal npm run dev




# Technovation TheLumiNos

A modern campus social platform built with React (Vite) and Node.js, featuring comprehensive authentication and user management.

## Features

- 🔐 **Authentication System**
  - User registration and login
  - Google OAuth integration
  - JWT-based authentication
  - Role-based access control (Student, Admin, Manager)

- 🎨 **Modern UI/UX**
  - Beautiful gradient backgrounds
  - Smooth animations with Framer Motion
  - Responsive design
  - Toast notifications

- 🛡️ **Security**
  - Password hashing with bcrypt
  - JWT token authentication
  - Input validation
  - CORS protection

## Tech Stack

### Frontend
- **React 19** with Vite
- **React Router** for navigation
- **Framer Motion** for animations
- **React Hot Toast** for notifications
- **React Icons** for icons
- **Google OAuth** integration

### Backend
- **Node.js** with Express
- **MySQL** database
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Multer** for file uploads
- **Express Validator** for input validation

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MySQL database
- Google OAuth credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Technovation_TheLumiNos
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

4. **Set up environment variables**
   
   **Frontend** (create `.env` file in root):
   ```env
   VITE_GOOGLE_CLIENT_ID=your-google-client-id
   VITE_API_URL=http://localhost:5000
   ```

   **Backend** (create `.env` file in backend folder):
   ```env
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=technovation_luminos
   JWT_SECRET=your-super-secret-jwt-key
   GOOGLE_CLIENT_ID=your-google-client-id
   ```

5. **Set up the database**
   ```bash
   mysql -u root -p < backend/schema.sql
   ```

6. **Start the development servers**
   
   **Backend** (in backend folder):
   ```bash
   npm run dev
   ```
   
   **Frontend** (in root folder):
   ```bash
   npm run dev
   ```

## Project Structure

```
Technovation_TheLumiNos/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── AuthPage.jsx
│   │   │   ├── AuthPage.css
│   │   │   ├── LoginForm.jsx
│   │   │   ├── RegisterForm.jsx
│   │   │   └── AuthForms.css
│   │   └── Dashboard.jsx
│   ├── contexts/
│   │   └── AuthContext.jsx
│   ├── App.jsx
│   └── main.jsx
├── backend/
│   ├── routes/
│   │   └── auth.js
│   ├── server.js
│   ├── schema.sql
│   └── package.json
├── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/google` - Google OAuth login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout
- `POST /api/auth/change-password` - Change password

### Health Check
- `GET /api/health` - API health status

## User Roles

- **Student**: Regular campus users with access to student features
- **Admin**: Administrative users with elevated permissions
- **Manager**: Management users with specific management features

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@technovation.com or create an issue in the repository.