const express = require('express');
const supabase = require('../config/supabase');
const { protect } = require('../middleware/auth');

const router = express.Router();

// POST /api/feedback (public)
router.post('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .insert(req.body)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ message: 'Thank you for your feedback!', id: data.id });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/feedback (admin)
router.get('/', async (req, res) => {
  try {
    const axios = require('axios');
    const response = await axios.get(`${process.env.SUPABASE_URL}/rest/v1/feedback?select=*&order=created_at.desc`, {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    });

    res.json(response.data || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/feedback/:id (admin – mark as read)
router.put('/:id', protect, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !data) return res.status(404).json({ message: 'Feedback not found' });
    res.json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/feedback/:id (admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const { error } = await supabase
      .from('feedback')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Feedback deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
