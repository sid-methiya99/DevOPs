# Second Brain - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Docker and Docker Compose installed
- Git installed
- Node.js (for local development)

### 1. Clone and Run with Docker
```bash
# Clone the repository
git clone <your-repo-url>
cd second-brain

# Start the application
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
```

### 2. Local Development Setup
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (in another terminal)
cd frontend
# Open index.html in your browser
# Or serve with a local server:
python -m http.server 3000
```

## 📋 What's Included

### ✅ Complete Application
- **Frontend**: Modern HTML/CSS/JavaScript with responsive design
- **Backend**: Node.js/Express API with MongoDB
- **Database**: MongoDB with proper indexing
- **Authentication**: JWT-based user authentication

### ✅ Four Main Pages
1. **Dashboard**: Overview with statistics and recent activity
2. **Notes**: Create, edit, and organize your thoughts
3. **Tasks**: Manage tasks with priorities and due dates
4. **Profile**: User profile management

### ✅ DevOps Integration
- **Docker**: Containerized application
- **Jenkins**: Automated CI/CD pipeline
- **GitHub**: Version control with webhooks
- **Docker Hub**: Image registry

## 🔄 DevOps Pipeline

### How It Works
1. **Development**: Make changes locally
2. **Git Push**: Push to GitHub
3. **Jenkins Trigger**: Automatic build on push
4. **Docker Build**: Create new Docker images
5. **Deploy**: Update production automatically

### Test the Pipeline
```bash
# Make a change (e.g., change title)
sed -i 's/Second Brain/Third Brain/g' frontend/index.html

# Commit and push
git add .
git commit -m "Change title to Third Brain"
git push origin main

# Watch Jenkins automatically build and deploy!
```

## 🛠️ Features

### Notes Management
- Create, edit, delete notes
- Categorize notes (personal, work, study, etc.)
- Add tags for easy organization
- Search functionality
- Pin important notes

### Task Management
- Create tasks with descriptions
- Set priorities (low, medium, high, urgent)
- Track status (todo, in-progress, review, completed)
- Set due dates
- Add subtasks

### Dashboard
- Overview statistics
- Recent notes and tasks
- Upcoming deadlines
- Activity feed

### User Management
- User registration and login
- Profile management
- Secure authentication with JWT

## 📁 Project Structure
```
second-brain/
├── frontend/                 # HTML/CSS/JS frontend
│   ├── index.html           # Main application
│   ├── styles.css           # Styling
│   └── script.js            # JavaScript functionality
├── backend/                  # Node.js API
│   ├── server.js            # Express server
│   ├── models/              # MongoDB models
│   ├── routes/              # API routes
│   └── middleware/          # Authentication middleware
├── jenkins/                  # CI/CD configuration
│   └── Jenkinsfile          # Jenkins pipeline
├── docker-compose.yml       # Docker orchestration
└── docs/                    # Documentation
```

## 🔧 Configuration

### Environment Variables
```bash
# Backend (.env)
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/second-brain
JWT_SECRET=your-secret-key

# Docker
DOCKER_REGISTRY=your-dockerhub-username
```

### Database Setup
- MongoDB automatically initializes with proper indexes
- Collections: users, notes, tasks
- Text search enabled on notes and tasks

## 🚀 Deployment

### Production Deployment
```bash
# Using Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# Using Jenkins Pipeline
# Automatically deploys on git push to main branch
```

### Manual Deployment
```bash
# Build images
docker build -t second-brain-backend ./backend
docker build -t second-brain-frontend ./frontend

# Run containers
docker run -d -p 5000:5000 second-brain-backend
docker run -d -p 3000:80 second-brain-frontend
```

## 🔍 Monitoring

### Health Checks
- Backend: `http://localhost:5000/health`
- Frontend: `http://localhost:3000/health`

### Logs
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 🛡️ Security

### Authentication
- JWT tokens for API access
- Password hashing with bcrypt
- Protected routes with middleware

### Docker Security
- Non-root user containers
- Minimal base images
- Health checks enabled

## 📈 Scaling

### Horizontal Scaling
```yaml
# docker-compose.yml
services:
  backend:
    deploy:
      replicas: 3
```

### Load Balancing
- Nginx reverse proxy included
- Health checks for backend services
- Static file serving optimized

## 🐛 Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check if ports are available
netstat -tulpn | grep :3000
netstat -tulpn | grep :5000

# Check Docker containers
docker-compose ps
docker-compose logs
```

#### Database Connection Issues
```bash
# Check MongoDB container
docker-compose logs mongodb

# Test connection
docker-compose exec backend node -e "
const mongoose = require('mongoose');
mongoose.connect('mongodb://mongodb:27017/second-brain')
  .then(() => console.log('Connected'))
  .catch(err => console.error(err));
"
```

#### Jenkins Pipeline Fails
- Check Jenkins logs
- Verify Docker Hub credentials
- Ensure all required plugins are installed

## 📚 Next Steps

1. **Customize**: Modify the UI and add features
2. **Deploy**: Set up Jenkins and Docker Hub
3. **Monitor**: Add logging and monitoring
4. **Scale**: Implement load balancing and clustering
5. **Secure**: Add SSL certificates and security headers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Happy coding! 🧠✨**
