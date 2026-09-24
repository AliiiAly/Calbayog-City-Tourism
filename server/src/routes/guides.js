const express = require('express');
const supabase = require('../config/supabase');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { available } = req.query;
    let queryParams = ['select=*', 'is_active=eq.true'];

    // Note: is_available column doesn't exist in schema, filter on frontend if needed
    if (available === 'true') {
      // Filter will be applied on frontend since column doesn't exist
    }
    queryParams.push('order=name.asc');

    const axios = require('axios');
    const response = await axios.get(`${process.env.SUPABASE_URL}/rest/v1/guides?${queryParams.join('&')}`, {
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

router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('guides')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ message: 'Guide not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('guides')
      .insert(req.body)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const axios = require('axios');
    const id = req.params.id;
    console.log('[PUT /guides] id:', id);

    const headers = {
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    };

    // First verify the guide exists
    const checkRes = await axios.get(
      `${process.env.SUPABASE_URL}/rest/v1/guides?id=eq.${id}&select=id,name`,
      { headers }
    );
    console.log('[PUT /guides] existing guide check:', JSON.stringify(checkRes.data));

    if (!Array.isArray(checkRes.data) || checkRes.data.length === 0) {
      return res.status(404).json({ message: `Guide ${id} not found in database` });
    }

    // Perform the update
    const patchRes = await axios.patch(
      `${process.env.SUPABASE_URL}/rest/v1/guides?id=eq.${id}`,
      req.body,
      { headers: { ...headers, 'Prefer': 'return=minimal' } }
    );
    console.log('[PUT /guides] patch status:', patchRes.status);

    // Fetch the updated guide
    const getRes = await axios.get(
      `${process.env.SUPABASE_URL}/rest/v1/guides?id=eq.${id}&select=*`,
      { headers }
    );
    console.log('[PUT /guides] updated guide:', getRes.data?.length, 'rows');

    const guide = Array.isArray(getRes.data) ? getRes.data[0] : null;
    if (!guide) {
      return res.status(404).json({ message: 'Guide not found after update' });
    }
    res.json(guide);
  } catch (err) {
    console.error('[PUT /guides] error:', err.response?.data || err.message);
    res.status(400).json({
      message: err.response?.data?.message || err.message,
      details: err.response?.data
    });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    console.log('DELETE /guides/:id - ID:', req.params.id);
    
    const { error } = await supabase
      .delete('guides')()
      .eq('id', req.params.id)
      .then(() => ({ error: null }));

    if (error) {
      console.error('Supabase delete error:', error);
      throw error;
    }
    console.log('Delete successful');
    res.json({ message: 'Guide deleted' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
