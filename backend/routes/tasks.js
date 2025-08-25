const express = require('express');
const Task = require('../models/Task');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Get all tasks for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      status, 
      priority, 
      category, 
      tags, 
      sortBy = 'createdAt',
      sortOrder = 'desc',
      dueDate
    } = req.query;

    const query = { author: req.user._id };

    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by priority
    if (priority) {
      query.priority = priority;
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

    // Filter by due date
    if (dueDate) {
      const date = new Date(dueDate);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      query.dueDate = { $gte: date, $lt: nextDay };
    }

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const tasks = await Task.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('author', 'firstName lastName username');

    const total = await Task.countDocuments(query);

    res.json({
      tasks,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalTasks: total
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get a single task by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      author: req.user._id
    }).populate('author', 'firstName lastName username');

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ task });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// Create a new task
router.post('/', auth, async (req, res) => {
  try {
    const { 
      title, 
      description, 
      status, 
      priority, 
      category, 
      tags, 
      dueDate, 
      estimatedTime,
      subtasks,
      isRecurring,
      recurringPattern
    } = req.body;

    const task = new Task({
      title,
      description,
      status: status || 'todo',
      priority: priority || 'medium',
      category: category || 'personal',
      tags: tags || [],
      dueDate: dueDate ? new Date(dueDate) : null,
      estimatedTime,
      subtasks: subtasks || [],
      isRecurring: isRecurring || false,
      recurringPattern: recurringPattern || 'daily',
      author: req.user._id
    });

    await task.save();
    await task.populate('author', 'firstName lastName username');

    res.status(201).json({
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update a task
router.put('/:id', auth, async (req, res) => {
  try {
    const { 
      title, 
      description, 
      status, 
      priority, 
      category, 
      tags, 
      dueDate, 
      estimatedTime,
      actualTime,
      subtasks,
      isRecurring,
      recurringPattern
    } = req.body;

    const updateData = {
      title,
      description,
      status,
      priority,
      category,
      tags,
      estimatedTime,
      actualTime,
      subtasks,
      isRecurring,
      recurringPattern
    };

    if (dueDate) {
      updateData.dueDate = new Date(dueDate);
    }

    const task = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        author: req.user._id
      },
      updateData,
      { new: true, runValidators: true }
    ).populate('author', 'firstName lastName username');

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({
      message: 'Task updated successfully',
      task
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete a task
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      author: req.user._id
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Update task status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;

    const task = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        author: req.user._id
      },
      { status },
      { new: true, runValidators: true }
    ).populate('author', 'firstName lastName username');

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({
      message: 'Task status updated successfully',
      task
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task status' });
  }
});

// Add note to task
router.post('/:id/notes', auth, async (req, res) => {
  try {
    const { content } = req.body;

    const task = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        author: req.user._id
      },
      {
        $push: { notes: { content } }
      },
      { new: true, runValidators: true }
    ).populate('author', 'firstName lastName username');

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({
      message: 'Note added successfully',
      task
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add note' });
  }
});

// Get task statistics
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const totalTasks = await Task.countDocuments({ author: req.user._id });
    const completedTasks = await Task.countDocuments({ 
      author: req.user._id, 
      status: 'completed' 
    });
    const overdueTasks = await Task.countDocuments({
      author: req.user._id,
      dueDate: { $lt: new Date() },
      status: { $ne: 'completed' }
    });

    // Get tasks by status
    const statusStats = await Task.aggregate([
      { $match: { author: req.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get tasks by priority
    const priorityStats = await Task.aggregate([
      { $match: { author: req.user._id } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    // Get tasks by category
    const categoryStats = await Task.aggregate([
      { $match: { author: req.user._id } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    res.json({
      totalTasks,
      completedTasks,
      overdueTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      statusStats,
      priorityStats,
      categoryStats
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch task statistics' });
  }
});

module.exports = router;
