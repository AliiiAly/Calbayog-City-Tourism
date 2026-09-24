const axios = require('axios');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials in environment variables');
}

// Simple Supabase REST API wrapper using axios
const supabase = {
  from: (table) => {
    let queryParams = [];
    
    return {
      select: (columns = '*') => {
        queryParams.push(`select=${columns}`);
        return {
          eq: (field, value) => {
            queryParams.push(`${field}=eq.${value}`);
            return {
              order: (field2, options) => {
                queryParams.push(`order=${field2}.${options.ascending ? 'asc' : 'desc'}`);
                return {
                  or: (condition) => {
                    queryParams.push(`or=${condition}`);
                    return {
                      single: async () => {
                        const url = `${supabaseUrl}/rest/v1/${table}?${queryParams.join('&')}`;
                        const response = await axios.get(url, {
                          headers: {
                            'apikey': supabaseKey,
                            'Authorization': `Bearer ${supabaseKey}`,
                            'Prefer': 'return=representation'
                          }
                        });
                        return { data: response.data[0] || null, error: null };
                      }
                    };
                  },
                  then: async (resolve) => {
                    const url = `${supabaseUrl}/rest/v1/${table}?${queryParams.join('&')}`;
                    const response = await axios.get(url, {
                      headers: {
                        'apikey': supabaseKey,
                        'Authorization': `Bearer ${supabaseKey}`
                      }
                    });
                    return resolve({ data: response.data, error: null });
                  }
                };
              },
              single: async () => {
                const url = `${supabaseUrl}/rest/v1/${table}?${queryParams.join('&')}`;
                const response = await axios.get(url, {
                  headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Prefer': 'return=representation'
                  }
                });
                return { data: response.data[0] || null, error: null };
              },
              then: async (resolve) => {
                const url = `${supabaseUrl}/rest/v1/${table}?${queryParams.join('&')}`;
                const response = await axios.get(url, {
                  headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`
                  }
                });
                return resolve({ data: response.data, error: null });
              }
            };
          },
          gte: (field, value) => {
            queryParams.push(`${field}=gte.${value}`);
            return {
              order: (field2, options) => {
                queryParams.push(`order=${field2}.${options.ascending ? 'asc' : 'desc'}`);
                return {
                  then: async (resolve) => {
                    const url = `${supabaseUrl}/rest/v1/${table}?${queryParams.join('&')}`;
                    const response = await axios.get(url, {
                      headers: {
                        'apikey': supabaseKey,
                        'Authorization': `Bearer ${supabaseKey}`
                      }
                    });
                    return resolve({ data: response.data, error: null });
                  }
                };
              }
            };
          },
          limit: (limit) => {
            queryParams.push(`limit=${limit}`);
            return {
              then: async (resolve) => {
                const url = `${supabaseUrl}/rest/v1/${table}?${queryParams.join('&')}`;
                const response = await axios.get(url, {
                  headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`
                  }
                });
                return resolve({ data: response.data, error: null });
              }
            };
          },
          order: (orderField, options) => {
            queryParams.push(`order=${orderField}.${options?.ascending ? 'asc' : 'desc'}`);
            return {
              then: async (resolve) => {
                const url = `${supabaseUrl}/rest/v1/${table}?${queryParams.join('&')}`;
                const response = await axios.get(url, {
                  headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`
                  }
                });
                return resolve({ data: response.data, error: null });
              }
            };
          },
          then: async (resolve) => {
            const url = `${supabaseUrl}/rest/v1/${table}?${queryParams.join('&')}`;
            const response = await axios.get(url, {
              headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
              }
            });
            return resolve({ data: response.data, error: null });
          }
        };
      },
      insert: (data) => ({
        select: () => ({
          single: async () => {
            const response = await axios.post(`${supabaseUrl}/rest/v1/${table}`, data, {
              headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
              }
            });
            return { data: response.data[0] || null, error: null };
          }
        })
      }),
      update: (data) => ({
        eq: (field, value) => ({
          select: () => ({
            single: async () => {
              const response = await axios.patch(`${supabaseUrl}/rest/v1/${table}?${field}=eq.${value}`, data, {
                headers: {
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${supabaseKey}`,
                  'Content-Type': 'application/json',
                  'Prefer': 'return=representation'
                }
              });
              return { data: response.data[0] || null, error: null };
            }
          })
        })
      })
    };
  },
  insert: (table) => (data) => ({
    select: () => ({
      single: async () => {
        const response = await axios.post(`${supabaseUrl}/rest/v1/${table}`, data, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        });
        return { data: response.data[0] || null, error: null };
      }
    })
  }),
  update: (data) => ({
    eq: (field, value) => ({
      select: () => ({
        single: async () => {
          const response = await axios.patch(`${supabaseUrl}/rest/v1/${table}?${field}=eq.${value}`, data, {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            }
          });
          return { data: response.data[0] || null, error: null };
        }
      })
    })
  }),
  delete: (table) => () => ({
    eq: (field, value) => ({
      then: async (resolve) => {
        await axios.delete(`${supabaseUrl}/rest/v1/${table}?${field}=eq.${value}`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        });
        return resolve({ error: null });
      }
    })
  })
};

module.exports = supabase;
