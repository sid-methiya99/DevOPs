const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Note title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Note content is required'],
    maxlength: [10000, 'Content cannot exceed 10000 characters']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  category: {
    type: String,
    enum: ['personal', 'work', 'study', 'ideas', 'journal', 'other'],
    default: 'personal'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  color: {
    type: String,
    default: '#ffffff',
    match: [/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color']
  },
  attachments: [{
    filename: String,
    url: String,
    type: String,
    size: Number
  }],
  readCount: {
    type: Number,
    default: 0
  },
  lastRead: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for search functionality
noteSchema.index({ 
  title: 'text', 
  content: 'text', 
  tags: 'text' 
});

// Virtual for excerpt (first 150 characters)
noteSchema.virtual('excerpt').get(function() {
  return this.content.length > 150 
    ? this.content.substring(0, 150) + '...' 
    : this.content;
});

// Ensure virtual fields are serialized
noteSchema.set('toJSON', { virtuals: true });
noteSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Note', noteSchema);
