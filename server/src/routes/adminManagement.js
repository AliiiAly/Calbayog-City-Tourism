const express = require('express');
const bcrypt = require('bcrypt');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/admin-management - Get all admins
router.get('/', protect, async (req, res) => {
  try {
    const axios = require('axios');
    const response = await axios.get(`${process.env.SUPABASE_URL}/rest/v1/admins?select=id,username,email,name,created_at,updated_at&order=created_at.desc`, {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    });
    res.json(response.data);
  } catch (err) {
    console.error('Get admins error:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin-management/:id - Get single admin
router.get('/:id', protect, async (req, res) => {
  try {
    const axios = require('axios');
    const response = await axios.get(`${process.env.SUPABASE_URL}/rest/v1/admins?id=eq.${req.params.id}&select=id,username,email,name,created_at,updated_at`, {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    });

    if (response.data.length === 0) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.json(response.data[0]);
  } catch (err) {
    console.error('Get admin error:', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin-management - Create new admin
router.post('/', protect, async (req, res) => {
  try {
    const { username, password, email, name, mobile_pin } = req.body;

    if (!username || !password || !email || !name) {
      return res.status(400).json({ message: 'Username, password, email, and name are required' });
    }

    const axios = require('axios');

    // Check if username already exists
    const existingUsername = await axios.get(`${process.env.SUPABASE_URL}/rest/v1/admins?username=eq.${username}&select=id`, {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    });

    if (existingUsername.data.length > 0) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Check if email already exists
    const existingEmail = await axios.get(`${process.env.SUPABASE_URL}/rest/v1/admins?email=eq.${email}&select=id`, {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    });

    if (existingEmail.data.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedMobilePin = mobile_pin ? await bcrypt.hash(mobile_pin, 10) : null;

    const insertResponse = await axios.post(`${process.env.SUPABASE_URL}/rest/v1/admins`, 
      { 
        username, 
        password: hashedPassword, 
        email, 
        name,
        mobile_pin: hashedMobilePin
      },
      {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      }
    );

    const admin = insertResponse.data[0];
    // Don't return password in response
    const { password: _, mobile_pin: __, ...adminData } = admin;
    
    res.status(201).json(adminData);
  } catch (err) {
    console.error('Create admin error:', err);
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin-management/:id - Update admin
router.put('/:id', protect, async (req, res) => {
  try {
    const { username, password, email, name, mobile_pin } = req.body;
    const axios = require('axios');

    // Check if admin exists
    const existingAdmin = await axios.get(`${process.env.SUPABASE_URL}/rest/v1/admins?id=eq.${req.params.id}&select=id`, {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    });

    if (existingAdmin.data.length === 0) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (name) updateData.name = name;
    if (password) updateData.password = await bcrypt.hash(password, 10);
    if (mobile_pin) updateData.mobile_pin = await bcrypt.hash(mobile_pin, 10);

    const updateResponse = await axios.patch(`${process.env.SUPABASE_URL}/rest/v1/admins?id=eq.${req.params.id}`, 
      updateData,
      {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      }
    );

    const admin = updateResponse.data[0];
    // Don't return password in response
    const { password: _, mobile_pin: __, ...adminData } = admin;
    
    res.json(adminData);
  } catch (err) {
    console.error('Update admin error:', err);
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin-management/:id - Delete admin
router.delete('/:id', protect, async (req, res) => {
  try {
    // Prevent deleting yourself
    if (req.params.id === req.admin.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const axios = require('axios');

    // Check if admin exists
    const existingAdmin = await axios.get(`${process.env.SUPABASE_URL}/rest/v1/admins?id=eq.${req.params.id}&select=id`, {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    });

    if (existingAdmin.data.length === 0) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    await axios.delete(`${process.env.SUPABASE_URL}/rest/v1/admins?id=eq.${req.params.id}`, {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    });

    res.json({ message: 'Admin deleted successfully' });
  } catch (err) {
    console.error('Delete admin error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
