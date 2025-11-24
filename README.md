# Personal Blog SPA

A beautiful, responsive Single Page Application personal blog built with vanilla JavaScript, Express.js, and MongoDB.

## Features

- 🎨 Beautiful mint-to-peach gradient design
- 📱 Fully responsive layout (mobile, tablet, desktop)
- 🔐 User authentication with JWT tokens
- 📸 Upload photos and documents
- 🎯 Filter and sort content
- 🌙 Dark/light mode toggle
- 💾 MongoDB data persistence

## Tech Stack

- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT + bcrypt

## Installation

### 1. Prerequisites

- Node.js (v14+)
- MongoDB running locally or Atlas connection string
- npm or yarn

### 2. Setup

```bash
# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env
```

### 3. Configure .env

Edit `.env` with your settings:

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/personal-blog
ACCESS_KEY=102258
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
SESSION_SECRET=your-session-secret-key-change-this
```

### 4. Start MongoDB

Make sure MongoDB is running:

```bash
# Windows
mongod

# macOS (if installed via Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### 5. Run the Server

```bash
# Development with auto-reload
npm run dev

# Production
npm start
```

The server will start at `http://localhost:3000`

## Usage

### First Time Setup

1. Open `http://localhost:3000` in your browser
2. Click **Register** to create a new account
3. Fill in:
   - **Username**: (min 3 characters)
   - **Email**: Your email address
   - **Password**: (min 6 characters)
   - **Confirm Password**: Must match
   - **Access Key**: `102258` (default, change in .env)
4. Click **Create Account**

### Managing Your Blog

1. **Edit Profile**:
   - Upload a profile picture
   - Change your name, bio, and status

2. **Upload Content**:
   - Select photos or documents
   - Add title and description
   - Click Upload

3. **View Public Blog**:
   - See your profile and all content
   - Filter by type or sort by date
   - Click content to view in lightbox

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify` - Verify JWT token
- `POST /api/auth/logout` - Logout

### Profile

- `GET /api/profile` - Get profile data
- `PUT /api/profile` - Update profile (authenticated)

### Posts

- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create post (authenticated)
- `DELETE /api/posts/:id` - Delete post (authenticated)

## Database Schema

### Users
```
{
  _id: ObjectId,
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  createdAt: Date
}
```

### Profile
```
{
  _id: ObjectId,
  name: String,
  bio: String,
  status: String,
  image: String (base64)
}
```

### Posts
```
{
  _id: ObjectId,
  type: String (image|document),
  title: String,
  description: String,
  file: String (base64),
  originalFilename: String,
  createdAt: Date
}
```

## Troubleshooting

### MongoDB Connection Error
- Make sure MongoDB is running
- Check MONGODB_URI in .env
- Try: `node test-connection.js` to test connection

### 500 Error on Register
- Check server console for detailed error
- Verify .env file exists and has all variables
- Make sure bcryptjs is installed: `npm install`

### CORS Error
- CORS is enabled in server.js
- Make sure you're accessing from `http://localhost:3000`

## Security Notes

⚠️ **For Development Only**

- Change `JWT_SECRET` in production
- Change `SESSION_SECRET` in production
- Change `ACCESS_KEY` for user registration
- Hash passwords in database (already done with bcrypt)
- Use HTTPS in production
- Set `cookie.secure: true` in session config for HTTPS

## Project Structure

```
.
├── models/               # MongoDB schemas
│   ├── User.js
│   ├── Profile.js
│   └── Post.js
├── app.js               # Frontend SPA application
├── server.js            # Express backend
├── styles.css           # Frontend styles
├── index.html           # Frontend HTML
├── package.json         # Dependencies
└── .env                 # Environment variables
```

## Development

### Run with auto-reload
```bash
npm run dev
```

### Test MongoDB connection
```bash
node test-connection.js
```

## License

ISC

## Support

If you encounter issues:
1. Check the console in browser (F12)
2. Check server console for backend errors
3. Verify MongoDB is running
4. Verify .env file is configured correctly
