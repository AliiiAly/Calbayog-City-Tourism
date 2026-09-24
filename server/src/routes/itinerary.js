const express = require('express');
const supabase = require('../config/supabase');
const { protect } = require('../middleware/auth');
const { sendItineraryRequest } = require('../utils/mailer');

const router = express.Router();

// POST /api/itinerary-requests (public)
router.post('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('itinerary_requests')
      .insert(req.body)
      .select()
      .single();

    if (error) throw error;

    try {
      await sendItineraryRequest(req.body);
    } catch (mailErr) {
      console.error('Email send failed:', mailErr.message);
    }

    res.status(201).json({ message: 'Request submitted successfully', id: data.id });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/itinerary-requests (admin)
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let queryParams = ['select=*'];

    if (status) {
      queryParams.push(`status=eq.${status}`);
    }
    queryParams.push('order=created_at.desc');

    const axios = require('axios');
    const response = await axios.get(`${process.env.SUPABASE_URL}/rest/v1/itinerary_requests?${queryParams.join('&')}`, {
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

// GET /api/itinerary-requests/:id (admin)
router.get('/:id', protect, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('itinerary_requests')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ message: 'Request not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/itinerary-requests/:id (admin – update status/notes)
router.put('/:id', protect, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('itinerary_requests')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !data) return res.status(404).json({ message: 'Request not found' });
    res.json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
