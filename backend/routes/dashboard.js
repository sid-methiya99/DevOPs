const express = require('express');
const Note = require('../models/Note');
const Task = require('../models/Task');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Get dashboard overview
router.get('/overview', auth, async (req, res) => {
  try {
    // Get counts
    const totalNotes = await Note.countDocuments({ author: req.user._id });
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

    // Get recent notes
    const recentNotes = await Note.find({ author: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('author', 'firstName lastName username');

    // Get recent tasks
    const recentTasks = await Task.find({ author: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('author', 'firstName lastName username');

    // Get upcoming tasks
    const upcomingTasks = await Task.find({
      author: req.user._id,
      dueDate: { $gte: new Date() },
      status: { $ne: 'completed' }
    })
      .sort({ dueDate: 1 })
      .limit(5)
      .populate('author', 'firstName lastName username');

    // Get pinned notes
    const pinnedNotes = await Note.find({ 
      author: req.user._id, 
      isPinned: true 
    })
      .sort({ updatedAt: -1 })
      .limit(3)
      .populate('author', 'firstName lastName username');

    res.json({
      overview: {
        totalNotes,
        totalTasks,
        completedTasks,
        overdueTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      },
      recentNotes,
      recentTasks,
      upcomingTasks,
      pinnedNotes
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard overview' });
  }
});

// Get activity feed
router.get('/activity', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    // Get recent notes and tasks combined
    const recentNotes = await Note.find({ author: req.user._id })
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .populate('author', 'firstName lastName username');

    const recentTasks = await Task.find({ author: req.user._id })
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .populate('author', 'firstName lastName username');

    // Combine and sort by updatedAt
    const activity = [...recentNotes, ...recentTasks]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, limit * 1);

    res.json({
      activity,
      currentPage: page,
      totalItems: activity.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activity feed' });
  }
});

// Get search results
router.get('/search', auth, async (req, res) => {
  try {
    const { q: query, type, page = 1, limit = 10 } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    let results = [];

    if (!type || type === 'notes') {
      const notes = await Note.find({
        author: req.user._id,
        $text: { $search: query }
      })
        .sort({ score: { $meta: 'textScore' } })
        .limit(limit * 1)
        .populate('author', 'firstName lastName username');
      
      results.push(...notes.map(note => ({ ...note.toObject(), type: 'note' })));
    }

    if (!type || type === 'tasks') {
      const tasks = await Task.find({
        author: req.user._id,
        $text: { $search: query }
      })
        .sort({ score: { $meta: 'textScore' } })
        .limit(limit * 1)
        .populate('author', 'firstName lastName username');
      
      results.push(...tasks.map(task => ({ ...task.toObject(), type: 'task' })));
    }

    // Sort combined results by relevance score
    results.sort((a, b) => {
      const scoreA = a.score || 0;
      const scoreB = b.score || 0;
      return scoreB - scoreA;
    });

    res.json({
      results: results.slice(0, limit * 1),
      query,
      totalResults: results.length,
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get statistics
router.get('/stats', auth, async (req, res) => {
  try {
    // Notes statistics
    const notesStats = await Note.aggregate([
      { $match: { author: req.user._id } },
      {
        $group: {
          _id: null,
          totalNotes: { $sum: 1 },
          pinnedNotes: { $sum: { $cond: ['$isPinned', 1, 0] } },
          publicNotes: { $sum: { $cond: ['$isPublic', 1, 0] } },
          avgReadCount: { $avg: '$readCount' }
        }
      }
    ]);

    // Tasks statistics
    const tasksStats = await Task.aggregate([
      { $match: { author: req.user._id } },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          completedTasks: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          overdueTasks: {
            $sum: {
              $cond: [
                { $and: [{ $lt: ['$dueDate', new Date()] }, { $ne: ['$status', 'completed'] }] },
                1,
                0
              ]
            }
          },
          avgEstimatedTime: { $avg: '$estimatedTime' },
          avgActualTime: { $avg: '$actualTime' }
        }
      }
    ]);

    // Monthly activity
    const currentYear = new Date().getFullYear();
    const monthlyActivity = await Promise.all([
      Note.aggregate([
        { $match: { author: req.user._id, createdAt: { $gte: new Date(currentYear, 0, 1) } } },
        {
          $group: {
            _id: { $month: '$createdAt' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Task.aggregate([
        { $match: { author: req.user._id, createdAt: { $gte: new Date(currentYear, 0, 1) } } },
        {
          $group: {
            _id: { $month: '$createdAt' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.json({
      notes: notesStats[0] || {
        totalNotes: 0,
        pinnedNotes: 0,
        publicNotes: 0,
        avgReadCount: 0
      },
      tasks: tasksStats[0] || {
        totalTasks: 0,
        completedTasks: 0,
        overdueTasks: 0,
        avgEstimatedTime: 0,
        avgActualTime: 0
      },
      monthlyActivity: {
        notes: monthlyActivity[0],
        tasks: monthlyActivity[1]
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
