const express = require('express');
const { protect } = require('../middleware/auth');
const router = express.Router();

const getHeaders = () => ({
  'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json'
});

// GET /api/getting-there
router.get('/', async (req, res) => {
  try {
    const axios = require('axios');
    const { category } = req.query;
    let url = `${process.env.SUPABASE_URL}/rest/v1/getting_there?select=*&order=created_at.asc`;
    if (category) url += `&category=eq.${category}`;
    const response = await axios.get(url, { headers: getHeaders() });
    res.json(response.data || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/getting-there
router.post('/', protect, async (req, res) => {
  try {
    const axios = require('axios');
    const { category } = req.body;
    let payload = { category };

    if (category === 'land') {
      payload.origin = req.body.origin;
      payload.steps = req.body.steps;
      payload.total_fare = req.body.total_fare;
      payload.duration = req.body.duration;
    } else if (category === 'local') {
      payload.mode = req.body.mode;
      payload.description = req.body.description;
      payload.icon = req.body.icon;
    }

    Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

    const response = await axios.post(
      `${process.env.SUPABASE_URL}/rest/v1/getting_there?select=*`,
      payload,
      { headers: { ...getHeaders(), 'Prefer': 'return=representation' } }
    );
    const created = Array.isArray(response.data) ? response.data[0] : response.data;
    res.status(201).json(created);
  } catch (err) {
    console.error('[POST /getting-there]', err.response?.data || err.message);
    res.status(400).json({ message: err.response?.data?.message || err.message });
  }
});

// PUT /api/getting-there/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const axios = require('axios');
    const id = req.params.id;
    const { category } = req.body;
    let payload = { category };

    if (category === 'land') {
      payload.origin = req.body.origin;
      payload.steps = req.body.steps;
      payload.total_fare = req.body.total_fare;
      payload.duration = req.body.duration;
    } else if (category === 'local') {
      payload.mode = req.body.mode;
      payload.description = req.body.description;
      payload.icon = req.body.icon;
    }

    Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

    await axios.patch(
      `${process.env.SUPABASE_URL}/rest/v1/getting_there?id=eq.${id}`,
      payload,
      { headers: { ...getHeaders(), 'Prefer': 'return=minimal' } }
    );

    const getRes = await axios.get(
      `${process.env.SUPABASE_URL}/rest/v1/getting_there?id=eq.${id}&select=*`,
      { headers: getHeaders() }
    );
    const updated = Array.isArray(getRes.data) ? getRes.data[0] : null;
    if (!updated) return res.status(404).json({ message: 'Entry not found' });
    res.json(updated);
  } catch (err) {
    console.error('[PUT /getting-there]', err.response?.data || err.message);
    res.status(400).json({ message: err.response?.data?.message || err.message });
  }
});

// DELETE /api/getting-there/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const axios = require('axios');
    await axios.delete(
      `${process.env.SUPABASE_URL}/rest/v1/getting_there?id=eq.${req.params.id}`,
      { headers: getHeaders() }
    );
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
