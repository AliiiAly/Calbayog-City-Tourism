const express = require('express');
const supabase = require('../config/supabase');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/events
router.get('/', async (req, res) => {
  try {
    const { category, upcoming, featured } = req.query;
    let queryParams = ['select=*', 'is_active=eq.true'];

    if (category && category !== 'All') {
      queryParams.push(`category=eq.${category}`);
    }
    if (featured === 'true') {
      queryParams.push('featured=eq.true');
    }
    if (upcoming === 'true') {
      // Use start_date if available, fallback to date
      queryParams.push(`start_date=gte.${new Date().toISOString().split('T')[0]}`);
    }
    queryParams.push('order=start_date.asc');

    const axios = require('axios');
    const response = await axios.get(`${process.env.SUPABASE_URL}/rest/v1/events?${queryParams.join('&')}`, {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    });

    // Map snake_case to camelCase for client
    const mapped = (response.data || []).map(e => ({
      _id: e.id,
      id: e.id,
      title: e.title,
      description: e.description,
      short_description: e.short_description,
      image: e.image,
      startDate: e.start_date || e.date,
      endDate: e.end_date || e.date,
      venue: e.venue || e.location,
      organizer: e.organizer,
      contact: e.contact,
      category: e.category,
      isFree: e.is_free,
      ticketPrice: e.ticket_price,
      featured: e.featured,
      is_active: e.is_active,
      created_at: e.created_at,
      updated_at: e.updated_at
    }));

    res.json(mapped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/events/:id
router.get('/:id', async (req, res) => {
  try {
    const axios = require('axios');
    const id = req.params.id;
    const response = await axios.get(`${process.env.SUPABASE_URL}/rest/v1/events?id=eq.${id}&select=*`, {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    });
    const data = Array.isArray(response.data) ? response.data[0] : response.data;
    if (!data) return res.status(404).json({ message: 'Event not found' });
    res.json(data);
  } catch (err) {
    console.error('[GET /events/:id] error:', err.response?.data || err.message);
    res.status(500).json({ message: err.response?.data?.message || err.message });
  }
});

// POST /api/events (admin)
router.post('/', protect, async (req, res) => {
  try {
    console.log('[POST /events] payload:', JSON.stringify(req.body, null, 2));
    
    // Map camelCase to snake_case for database columns
    const dbPayload = {
      title: req.body.title,
      description: req.body.description,
      short_description: req.body.short_description,
      image: req.body.image,
      date: req.body.startDate || req.body.date, // fallback to old column
      time: req.body.time,
      location: req.body.venue || req.body.location, // fallback to old column
      organizer: req.body.organizer,
      contact_phone: req.body.contact?.phone,
      contact_email: req.body.contact?.email,
      tags: req.body.tags,
      is_active: true,
      // New columns (will be ignored if they don't exist yet)
      category: req.body.category,
      start_date: req.body.startDate,
      end_date: req.body.endDate,
      venue: req.body.venue,
      is_free: req.body.isFree,
      ticket_price: req.body.ticketPrice,
      featured: req.body.featured,
      contact: req.body.contact
    };
    
    // Remove undefined values
    Object.keys(dbPayload).forEach(key => dbPayload[key] === undefined && delete dbPayload[key]);
    
    const axios = require('axios');
    const response = await axios.post(
      `${process.env.SUPABASE_URL}/rest/v1/events?select=*`,
      dbPayload,
      {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      }
    );
    console.log('[POST /events] response:', response.data);
    const created = Array.isArray(response.data) ? response.data[0] : response.data;
    res.status(201).json(created);
  } catch (err) {
    console.error('[POST /events] error:', err.response?.data || err.message);
    res.status(400).json({
      message: err.response?.data?.message || err.message,
      details: err.response?.data
    });
  }
});

// PUT /api/events/:id (admin)
router.put('/:id', protect, async (req, res) => {
  try {
    const axios = require('axios');
    const id = req.params.id;

    const dbPayload = {
      title: req.body.title,
      description: req.body.description,
      short_description: req.body.short_description,
      image: req.body.image,
      date: req.body.startDate || req.body.date,
      location: req.body.venue || req.body.location,
      organizer: req.body.organizer,
      category: req.body.category,
      start_date: req.body.startDate,
      end_date: req.body.endDate,
      venue: req.body.venue,
      is_free: req.body.isFree,
      ticket_price: req.body.ticketPrice,
      featured: req.body.featured,
    };
    Object.keys(dbPayload).forEach(key => dbPayload[key] === undefined && delete dbPayload[key]);

    const headers = {
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    };

    await axios.patch(`${process.env.SUPABASE_URL}/rest/v1/events?id=eq.${id}`, dbPayload, { headers });

    const getRes = await axios.get(`${process.env.SUPABASE_URL}/rest/v1/events?id=eq.${id}&select=*`, { headers });
    const updated = Array.isArray(getRes.data) ? getRes.data[0] : null;
    if (!updated) return res.status(404).json({ message: 'Event not found after update' });
    res.json(updated);
  } catch (err) {
    console.error('[PUT /events] error:', err.response?.data || err.message);
    res.status(400).json({ message: err.response?.data?.message || err.message });
  }
});

// DELETE /api/events/:id (admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const axios = require('axios');
    const id = req.params.id;
    await axios.delete(`${process.env.SUPABASE_URL}/rest/v1/events?id=eq.${id}`, {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    });
    res.json({ message: 'Event deleted' });
  } catch (err) {
    console.error('[DELETE /events] error:', err.response?.data || err.message);
    res.status(500).json({ message: err.response?.data?.message || err.message });
  }
});

module.exports = router;
