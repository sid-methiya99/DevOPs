const express = require('express');
const Note = require('../models/Note');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Get all notes for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      category, 
      tags, 
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isPinned
    } = req.query;

    const query = { author: req.user._id };

    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by tags
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }

    // Filter by pinned status
    if (isPinned !== undefined) {
      query.isPinned = isPinned === 'true';
    }

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Always sort pinned notes first
    if (sortBy !== 'isPinned') {
      sortOptions.isPinned = -1;
    }

    const notes = await Note.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('author', 'firstName lastName username');

    const total = await Note.countDocuments(query);

    res.json({
      notes,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalNotes: total
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// Get a single note by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      author: req.user._id
    }).populate('author', 'firstName lastName username');

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Increment read count
    note.readCount += 1;
    note.lastRead = new Date();
    await note.save();

    res.json({ note });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

// Create a new note
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, tags, category, isPublic, color } = req.body;

    const note = new Note({
      title,
      content,
      tags: tags || [],
      category: category || 'personal',
      isPublic: isPublic || false,
      color: color || '#ffffff',
      author: req.user._id
    });

    await note.save();
    await note.populate('author', 'firstName lastName username');

    res.status(201).json({
      message: 'Note created successfully',
      note
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// Update a note
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, content, tags, category, isPublic, color, isPinned } = req.body;

    const note = await Note.findOneAndUpdate(
      {
        _id: req.params.id,
        author: req.user._id
      },
      {
        title,
        content,
        tags,
        category,
        isPublic,
        color,
        isPinned
      },
      { new: true, runValidators: true }
    ).populate('author', 'firstName lastName username');

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({
      message: 'Note updated successfully',
      note
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// Delete a note
router.delete('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      author: req.user._id
    });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// Toggle pin status
router.patch('/:id/pin', auth, async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      author: req.user._id
    });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    note.isPinned = !note.isPinned;
    await note.save();

    res.json({
      message: `Note ${note.isPinned ? 'pinned' : 'unpinned'} successfully`,
      note
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle pin status' });
  }
});

// Get note statistics
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const totalNotes = await Note.countDocuments({ author: req.user._id });
    const pinnedNotes = await Note.countDocuments({ 
      author: req.user._id, 
      isPinned: true 
    });
    const publicNotes = await Note.countDocuments({ 
      author: req.user._id, 
      isPublic: true 
    });

    // Get notes by category
    const categoryStats = await Note.aggregate([
      { $match: { author: req.user._id } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // Get most used tags
    const tagStats = await Note.aggregate([
      { $match: { author: req.user._id } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      totalNotes,
      pinnedNotes,
      publicNotes,
      categoryStats,
      tagStats
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch note statistics' });
  }
});

module.exports = router;
