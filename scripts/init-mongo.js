// MongoDB initialization script
db = db.getSiblingDB('second-brain');

// Create collections
db.createCollection('users');
db.createCollection('notes');
db.createCollection('tasks');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });

db.notes.createIndex({ "author": 1 });
db.notes.createIndex({ "title": "text", "content": "text", "tags": "text" });
db.notes.createIndex({ "createdAt": -1 });
db.notes.createIndex({ "isPinned": 1 });

db.tasks.createIndex({ "author": 1 });
db.tasks.createIndex({ "title": "text", "description": "text", "tags": "text" });
db.tasks.createIndex({ "status": 1 });
db.tasks.createIndex({ "priority": 1 });
db.tasks.createIndex({ "dueDate": 1 });
db.tasks.createIndex({ "createdAt": -1 });

print('MongoDB initialization completed successfully!');
