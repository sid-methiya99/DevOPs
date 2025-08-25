# DevOps Setup Guide for Second Brain

This guide will help you set up the complete DevOps pipeline for the Second Brain application using Git, GitHub, Jenkins, and Docker.

## Prerequisites

- Git installed on your machine
- GitHub account
- Jenkins server (local or cloud)
- Docker and Docker Compose installed
- Docker Hub account
- Node.js and npm (for local development)

## 1. Git and GitHub Setup

### Initialize Git Repository
```bash
# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Second Brain application"

# Add GitHub remote (replace with your repository URL)
git remote add origin https://github.com/yourusername/second-brain.git

# Push to GitHub
git push -u origin main
```

### GitHub Repository Setup
1. Create a new repository on GitHub
2. Enable GitHub Actions (optional, for additional CI/CD)
3. Set up branch protection rules for `main` branch
4. Add collaborators if needed

## 2. Docker Setup

### Build and Test Docker Images Locally
```bash
# Build backend image
cd backend
docker build -t second-brain-backend:latest .

# Build frontend image
cd ../frontend
docker build -t second-brain-frontend:latest .

# Test with docker-compose
cd ..
docker-compose up -d
```

### Docker Hub Setup
1. Create a Docker Hub account
2. Create repositories for your images:
   - `second-brain-backend`
   - `second-brain-frontend`

### Push Images to Docker Hub
```bash
# Login to Docker Hub
docker login

# Tag images
docker tag second-brain-backend:latest yourusername/second-brain-backend:latest
docker tag second-brain-frontend:latest yourusername/second-brain-frontend:latest

# Push images
docker push yourusername/second-brain-backend:latest
docker push yourusername/second-brain-frontend:latest
```

## 3. Jenkins Setup

### Install Jenkins
1. Install Jenkins on your server or use Jenkins cloud service
2. Install required plugins:
   - Docker Pipeline
   - Git
   - GitHub
   - Credentials Binding
   - Pipeline

### Configure Jenkins Credentials
1. Go to Jenkins > Manage Jenkins > Credentials
2. Add Docker Hub credentials:
   - Kind: Username with password
   - ID: `dockerhub-credentials`
   - Username: Your Docker Hub username
   - Password: Your Docker Hub password/token

### Create Jenkins Pipeline
1. Create a new Pipeline job in Jenkins
2. Configure the pipeline to use the Jenkinsfile from your repository
3. Set up webhook from GitHub to trigger builds automatically

### Pipeline Configuration
```groovy
// In Jenkins job configuration
Pipeline script from SCM
SCM: Git
Repository URL: https://github.com/yourusername/second-brain.git
Branch: main
Script Path: jenkins/Jenkinsfile
```

## 4. Automated Deployment

### Webhook Setup
1. In your GitHub repository, go to Settings > Webhooks
2. Add webhook:
   - Payload URL: `http://your-jenkins-url/github-webhook/`
   - Content type: `application/json`
   - Events: Just the push event

### Environment Variables
Set these environment variables in Jenkins:
```bash
DOCKER_REGISTRY=your-dockerhub-username
DOCKER_IMAGE_BACKEND=second-brain-backend
DOCKER_IMAGE_FRONTEND=second-brain-frontend
```

## 5. Production Deployment

### Server Setup
1. Install Docker and Docker Compose on your production server
2. Clone your repository
3. Set up environment variables
4. Configure SSL certificates (optional)

### Deployment Script
Create a deployment script:
```bash
#!/bin/bash
# deploy.sh

# Pull latest changes
git pull origin main

# Pull latest Docker images
docker-compose pull

# Stop existing containers
docker-compose down

# Start new containers
docker-compose up -d

# Health check
sleep 30
curl -f http://localhost/health || exit 1
```

## 6. Monitoring and Logging

### Health Checks
The application includes health check endpoints:
- Backend: `http://localhost:5000/health`
- Frontend: `http://localhost/health`

### Logging
```bash
# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 7. Testing the Pipeline

### Manual Testing
1. Make a change to your code
2. Commit and push to GitHub
3. Verify Jenkins pipeline runs automatically
4. Check that Docker images are built and pushed
5. Verify deployment works correctly

### Example Change Test
```bash
# Change the title in the HTML file
sed -i 's/Second Brain/Third Brain/g' frontend/index.html

# Commit and push
git add .
git commit -m "Change title to Third Brain"
git push origin main

# Watch Jenkins pipeline
# Verify the change appears in production
```

## 8. Troubleshooting

### Common Issues

#### Jenkins Pipeline Fails
- Check Jenkins logs
- Verify credentials are correct
- Ensure Docker is installed on Jenkins server
- Check network connectivity

#### Docker Build Fails
- Verify Dockerfile syntax
- Check if all required files are present
- Ensure Docker daemon is running

#### Deployment Fails
- Check if ports are available
- Verify environment variables
- Check Docker Compose configuration
- Review application logs

### Debug Commands
```bash
# Check container status
docker-compose ps

# View container logs
docker-compose logs [service-name]

# Access container shell
docker-compose exec [service-name] sh

# Check network connectivity
docker network ls
docker network inspect second-brain_second-brain-network
```

## 9. Security Considerations

### Environment Variables
- Never commit sensitive data to Git
- Use Jenkins credentials for secrets
- Use environment-specific configuration files

### Docker Security
- Run containers as non-root users
- Use specific image tags instead of `latest`
- Regularly update base images
- Scan images for vulnerabilities

### Network Security
- Use internal Docker networks
- Expose only necessary ports
- Implement proper firewall rules
- Use HTTPS in production

## 10. Scaling Considerations

### Horizontal Scaling
```yaml
# docker-compose.yml
services:
  backend:
    deploy:
      replicas: 3
    environment:
      - NODE_ENV=production
```

### Load Balancing
- Use Nginx as reverse proxy
- Implement health checks
- Configure proper session handling

### Database Scaling
- Use MongoDB replica sets
- Implement connection pooling
- Consider read replicas for heavy read workloads

## 11. Backup and Recovery

### Database Backup
```bash
# Create backup script
#!/bin/bash
docker-compose exec mongodb mongodump --out /backup/$(date +%Y%m%d_%H%M%S)
```

### Application Backup
- Backup Docker volumes
- Backup configuration files
- Implement automated backup scheduling

## 12. Performance Optimization

### Docker Optimization
- Use multi-stage builds
- Optimize image layers
- Use .dockerignore files
- Implement proper caching

### Application Optimization
- Enable gzip compression
- Implement proper caching headers
- Use CDN for static assets
- Optimize database queries

This setup provides a complete DevOps pipeline that automatically builds, tests, and deploys your Second Brain application whenever you push changes to GitHub.
