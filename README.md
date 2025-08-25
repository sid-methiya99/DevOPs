# Second Brain App

A comprehensive second brain application with full DevOps integration using Git, GitHub, Jenkins, and Docker.

## 🧠 Features

- **Knowledge Management**: Store and organize your thoughts, ideas, and notes
- **Task Management**: Track your tasks and projects
- **Search & Filter**: Find information quickly with powerful search capabilities
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Real-time Updates**: Changes reflect immediately across all devices

## 🚀 Tech Stack

### Frontend
- React.js with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- Axios for API calls

### Backend
- Node.js with Express
- MongoDB for database
- JWT for authentication
- RESTful API

### DevOps
- Docker for containerization
- Jenkins for CI/CD pipeline
- GitHub for version control
- Docker Hub for image registry

## 📁 Project Structure

```
second-brain/
├── frontend/                 # React frontend application
├── backend/                  # Node.js backend API
├── jenkins/                  # Jenkins pipeline configuration
├── docker/                   # Docker configuration files
├── docs/                     # Documentation
└── scripts/                  # Utility scripts
```

## 🛠️ Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js (for local development)
- Git

### Running with Docker
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

### Local Development
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (in another terminal)
cd frontend
npm install
npm start
```

## 🔄 DevOps Pipeline

1. **Development**: Make changes locally
2. **Git Push**: Push changes to GitHub
3. **Jenkins Trigger**: Automatic build on push
4. **Docker Build**: Create new Docker image
5. **Deploy**: Deploy updated application

## 📝 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile

### Notes
- `GET /api/notes` - Get all notes
- `POST /api/notes` - Create new note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@secondbrain.com or create an issue in the repository.
# Test Jenkins GitHub Integration
