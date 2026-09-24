const express = require('express');
const axios = require('axios');
const router = express.Router();

const BASE = () => `${process.env.SUPABASE_URL}/rest/v1`;
const getHeaders = () => ({
  'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
});

// GET /api/notifications?userId=xxx
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;

    // Fetch global notifications (user_id IS NULL) + user-specific if userId provided
    const globalUrl = `${BASE()}/notifications?user_id=is.null&order=created_at.desc&limit=50`;
    const [globalRes] = await Promise.all([axios.get(globalUrl, { headers: getHeaders() })]);
    let notifications = globalRes.data || [];

    if (userId) {
      const userUrl = `${BASE()}/notifications?user_id=eq.${userId}&order=created_at.desc&limit=50`;
      const userRes = await axios.get(userUrl, { headers: getHeaders() });
      const userNotifs = userRes.data || [];
      // Merge and sort by created_at desc, remove duplicates by id
      const merged = [...notifications, ...userNotifs];
      const seen = new Set();
      notifications = merged.filter(n => { if (seen.has(n.id)) return false; seen.add(n.id); return true; })
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 50);
    }

    res.json(notifications);
  } catch (err) {
    console.error('Error fetching notifications:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// GET /api/notifications/unread-count?userId=xxx
router.get('/unread-count', async (req, res) => {
  try {
    const { userId } = req.query;

    // Count global unread
    const globalUrl = `${BASE()}/notifications?user_id=is.null&is_read=eq.false&select=id`;
    const globalRes = await axios.get(globalUrl, { headers: getHeaders() });
    let count = (globalRes.data || []).length;

    // Add user-specific unread if userId provided
    if (userId) {
      const userUrl = `${BASE()}/notifications?user_id=eq.${userId}&is_read=eq.false&select=id`;
      const userRes = await axios.get(userUrl, { headers: getHeaders() });
      count += (userRes.data || []).length;
    }

    res.json({ count });
  } catch (err) {
    console.error('Error fetching unread count:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID is required' });

    const url = `${BASE()}/notifications?user_id=eq.${userId}&is_read=eq.false`;
    const response = await axios.patch(url, { is_read: true }, { headers: getHeaders() });
    res.json(response.data || []);
  } catch (err) {
    console.error('Error marking all as read:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const url = `${BASE()}/notifications?id=eq.${id}`;
    const response = await axios.patch(url, { is_read: true }, { headers: getHeaders() });
    res.json(response.data?.[0] || {});
  } catch (err) {
    console.error('Error marking as read:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// POST /api/notifications
router.post('/', async (req, res) => {
  try {
    const { userId, type, title, message, data: notificationData } = req.body;
    if (!type || !title || !message) return res.status(400).json({ error: 'Missing required fields' });

    if (userId === 'all') {
      // Create a single GLOBAL notification (user_id = null) visible to everyone
      const payload = { user_id: null, type, title, message, data: notificationData || {} };
      const response = await axios.post(`${BASE()}/notifications`, payload, { headers: getHeaders() });
      res.status(201).json({ count: 1, notifications: [response.data?.[0] || response.data] });
    } else {
      const payload = { user_id: userId, type, title, message, data: notificationData || {} };
      const response = await axios.post(`${BASE()}/notifications`, payload, { headers: getHeaders() });
      res.status(201).json(response.data?.[0] || response.data);
    }
  } catch (err) {
    console.error('Error creating notification:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await axios.delete(`${BASE()}/notifications?id=eq.${id}`, { headers: getHeaders() });
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting notification:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// POST /api/notifications/seed — one-time seed of existing content
router.post('/seed', async (req, res) => {
  try {
    const headers = getHeaders();
    const created = [];

    // Fetch existing events
    const eventsRes = await axios.get(`${BASE()}/events?is_active=eq.true&select=id,title,venue,category,start_date,created_at&order=created_at.desc`, { headers });
    for (const e of (eventsRes.data || [])) {
      const payload = {
        user_id: null,
        type: 'event_added',
        title: `Event: ${e.title}`,
        message: `Check out this event: ${e.title}${e.venue ? ' at ' + e.venue : ''}${e.start_date ? ' on ' + new Date(e.start_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}`,
        data: { eventId: e.id, eventTitle: e.title, category: e.category || '', startDate: e.start_date || '' },
        created_at: e.created_at || new Date().toISOString()
      };
      await axios.post(`${BASE()}/notifications`, payload, { headers });
      created.push(e.title);
    }

    // Fetch existing destinations
    const destRes = await axios.get(`${BASE()}/destinations?is_active=eq.true&select=id,name,description,category,created_at&order=created_at.desc`, { headers });
    for (const d of (destRes.data || [])) {
      const payload = {
        user_id: null,
        type: 'destination_added',
        title: `Destination: ${d.name}`,
        message: `Discover this destination: ${d.name}${d.description ? ' - ' + d.description.substring(0, 80) : ''}`,
        data: { destinationId: d.id, destinationName: d.name, category: d.category || '' },
        created_at: d.created_at || new Date().toISOString()
      };
      await axios.post(`${BASE()}/notifications`, payload, { headers });
      created.push(d.name);
    }

    // Fetch existing guides
    const guidesRes = await axios.get(`${BASE()}/guides?is_active=eq.true&select=id,name,created_at&order=created_at.desc`, { headers });
    for (const g of (guidesRes.data || [])) {
      const payload = {
        user_id: null,
        type: 'guide_added',
        title: `Tour Guide: ${g.name}`,
        message: `${g.name} is available as a tour guide in Calbayog.`,
        data: { guideId: g.id, guideName: g.name },
        created_at: g.created_at || new Date().toISOString()
      };
      await axios.post(`${BASE()}/notifications`, payload, { headers });
      created.push(g.name);
    }

    res.json({ success: true, seeded: created.length, items: created });
  } catch (err) {
    console.error('Seed error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Seed failed', details: err.response?.data || err.message });
  }
});

module.exports = router;
