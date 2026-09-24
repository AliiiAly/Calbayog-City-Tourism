const bcrypt = require('bcrypt');
const supabase = require('../config/supabase');

const seedAdmin = async () => {
  try {
    const { data: existingAdmin, error } = await supabase
      .from('admins')
      .select('id')
      .eq('username', 'admin')
      .single();

    if (existingAdmin) {
      console.log('✓ Admin already exists. Skipping seed.');
      return;
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);

    const { error: insertError } = await supabase
      .insert('admins')({
        username: 'admin',
        password: hashedPassword,
        email: 'admin@calbayog.gov.ph',
        name: 'Super Admin',
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    console.log('✓ Default admin created:');
    console.log('  Username: admin');
    console.log('  Password: admin123');
    console.log('  Email: admin@calbayog.gov.ph');
    console.log('  ⚠️  Change this password after first login!');
  } catch (err) {
    console.error('✗ Error seeding admin:', err.message);
  }
};

const seedDestinations = async () => {
  try {
    const { data: existingDestinations, error } = await supabase
      .from('destinations')
      .select('id')
      .limit(1);

    if (existingDestinations && existingDestinations.length > 0) {
      console.log('✓ Destinations already exist. Skipping seed.');
      return;
    }

    const destinations = [
      // Hotels
      {
        name: 'Ciriaco Hotel and Resort',
        category: 'Hotels',
        description: 'A premier hotel in Calbayog City offering comfortable accommodations, event facilities, and a restaurant. Perfect for tourists and business travelers.',
        short_description: 'Premier hotel with comfortable accommodations and event facilities.',
        images: [],
        location_lat: 12.0744,
        location_lng: 124.0050,
        location_address: 'Ciriaco Avenue, Calbayog City, Samar',
        contact_phone: '+63 912 345 6789',
        contact_email: 'info@ciriacohotel.com',
        contact_facebook: 'ciriacohotel',
        opening_hours: '24/7',
        entrance_fee: 'Room rates start at PHP 1,500',
        tips: ['Book in advance for peak seasons', 'Check for promos on their Facebook page'],
        tags: ['hotel', 'resort', 'accommodation', 'events'],
        featured: true,
        is_active: true,
      },
      {
        name: 'GV Hotel Calbayog',
        category: 'Hotels',
        description: 'Affordable and clean hotel accommodation in the heart of Calbayog City. Offers air-conditioned rooms with free WiFi and parking.',
        short_description: 'Affordable hotel with clean rooms and free WiFi.',
        images: [],
        location_lat: 12.0720,
        location_lng: 124.0080,
        location_address: 'National Highway, Calbayog City, Samar',
        contact_phone: '+63 933 456 7890',
        contact_email: 'gvhotelcalbayog@gmail.com',
        opening_hours: '24/7',
        entrance_fee: 'Room rates start at PHP 800',
        tips: ['Budget-friendly option', 'Near city center'],
        tags: ['hotel', 'budget', 'accommodation'],
        featured: false,
        is_active: true,
      },
      {
        name: 'Waterfront Hotel',
        category: 'Hotels',
        description: 'Scenic hotel located near the waterfront with beautiful views of Calbayog Bay. Features a restaurant and conference facilities.',
        short_description: 'Scenic waterfront hotel with bay views.',
        images: [],
        location_lat: 12.0680,
        location_lng: 124.0020,
        location_address: 'Waterfront Road, Calbayog City, Samar',
        contact_phone: '+63 917 234 5678',
        contact_email: 'waterfrontcalbayog@gmail.com',
        opening_hours: '24/7',
        entrance_fee: 'Room rates start at PHP 2,000',
        tips: ['Great for sunset views', 'Restaurant on-site'],
        tags: ['hotel', 'waterfront', 'restaurant'],
        featured: true,
        is_active: true,
      },
      {
        name: 'Samar House Inn',
        category: 'Hotels',
        description: 'Cozy inn offering home-like atmosphere with personalized service. Located in a quiet area of Calbayog City.',
        short_description: 'Cozy inn with home-like atmosphere.',
        images: [],
        location_lat: 12.0760,
        location_lng: 124.0100,
        location_address: 'Samar Street, Calbayog City, Samar',
        contact_phone: '+63 918 345 6789',
        opening_hours: '24/7',
        entrance_fee: 'Room rates start at PHP 1,200',
        tips: ['Quiet location', 'Personalized service'],
        tags: ['hotel', 'inn', 'budget'],
        featured: false,
        is_active: true,
      },
      // Beaches
      {
        name: 'Malajog Beach',
        category: 'Beaches',
        description: 'The most famous beach in Calbayog City, known for its golden sand and clear waters. A popular destination for swimming and picnics.',
        short_description: 'Famous golden sand beach with clear waters.',
        images: [],
        location_lat: 12.0500,
        location_lng: 124.0200,
        location_address: 'Malajog, Calbayog City, Samar',
        contact_phone: '+63 919 456 7890',
        opening_hours: '6:00 AM - 6:00 PM',
        entrance_fee: 'PHP 20 per person',
        tips: ['Best visited early morning', 'Bring sun protection', 'Cottages available for rent'],
        tags: ['beach', 'swimming', 'picnic', 'golden sand'],
        featured: true,
        is_active: true,
      },
      {
        name: 'Bagong Silang Beach',
        category: 'Beaches',
        description: 'A serene beach perfect for relaxation and family outings. Features a long stretch of sandy shoreline and calm waters.',
        short_description: 'Serene beach perfect for family outings.',
        images: [],
        location_lat: 12.0450,
        location_lng: 124.0250,
        location_address: 'Bagong Silang, Calbayog City, Samar',
        contact_phone: '+63 920 567 8901',
        opening_hours: '6:00 AM - 6:00 PM',
        entrance_fee: 'PHP 15 per person',
        tips: ['Great for families', 'Less crowded than Malajog', 'Bring your own food'],
        tags: ['beach', 'family', 'relaxation'],
        featured: false,
        is_active: true,
      },
      {
        name: 'Mawacat Beach',
        category: 'Beaches',
        description: 'Hidden gem beach with rocky formations and natural pools. Ideal for adventure seekers and nature lovers.',
        short_description: 'Hidden gem with rocky formations and natural pools.',
        images: [],
        location_lat: 12.0400,
        location_lng: 124.0300,
        location_address: 'Mawacat, Calbayog City, Samar',
        opening_hours: '6:00 AM - 5:00 PM',
        entrance_fee: 'Free',
        tips: ['Wear sturdy footwear', 'Bring water and snacks', 'Best during low tide'],
        tags: ['beach', 'adventure', 'nature', 'rock formations'],
        featured: false,
        is_active: true,
      },
      {
        name: 'Binaliw Beach',
        category: 'Beaches',
        description: 'Pristine beach with white sand and crystal clear waters. A perfect spot for snorkeling and beach camping.',
        short_description: 'Pristine white sand beach great for snorkeling.',
        images: [],
        location_lat: 12.0350,
        location_lng: 124.0350,
        location_address: 'Binaliw, Calbayog City, Samar',
        opening_hours: '24/7',
        entrance_fee: 'Free',
        tips: ['Bring snorkeling gear', 'Camping allowed', 'No facilities - bring everything'],
        tags: ['beach', 'snorkeling', 'camping', 'white sand'],
        featured: true,
        is_active: true,
      },
      // Waterfalls
      {
        name: 'Bangon-Bangon Falls',
        category: 'Waterfalls',
        description: 'One of the most beautiful waterfalls in Calbayog, featuring a stunning cascade into a natural pool. Perfect for swimming and trekking.',
        short_description: 'Stunning waterfall with natural swimming pool.',
        images: [],
        location_lat: 12.0900,
        location_lng: 124.0150,
        location_address: 'Bangon-Bangon, Calbayog City, Samar',
        contact_phone: '+63 921 678 9012',
        opening_hours: '8:00 AM - 5:00 PM',
        entrance_fee: 'PHP 30 per person',
        tips: ['Trekking shoes recommended', 'Guide available for hire', 'Best after rainy season'],
        tags: ['waterfall', 'swimming', 'trekking', 'nature'],
        featured: true,
        is_active: true,
      },
      {
        name: 'Tinago Falls',
        category: 'Waterfalls',
        description: 'Hidden waterfall surrounded by lush forest. The trek to reach it is an adventure in itself, rewarding visitors with a pristine natural paradise.',
        short_description: 'Hidden waterfall reached through forest trek.',
        images: [],
        location_lat: 12.0950,
        location_lng: 124.0200,
        location_address: 'Tinago, Calbayog City, Samar',
        opening_hours: '7:00 AM - 4:00 PM',
        entrance_fee: 'PHP 25 per person',
        tips: ['Local guide recommended', 'Slippery trail - be careful', 'Bring water'],
        tags: ['waterfall', 'adventure', 'trekking', 'hidden gem'],
        featured: false,
        is_active: true,
      },
      {
        name: 'Panghugan Falls',
        category: 'Waterfalls',
        description: 'Multi-tiered waterfall with several natural pools at different levels. Great for cliff jumping and swimming.',
        short_description: 'Multi-tiered waterfall perfect for cliff jumping.',
        images: [],
        location_lat: 12.0850,
        location_lng: 124.0250,
        location_address: 'Panghugan, Calbayog City, Samar',
        opening_hours: '8:00 AM - 5:00 PM',
        entrance_fee: 'PHP 20 per person',
        tips: ['Cliff jumping at your own risk', 'Life jacket recommended', 'Best during summer'],
        tags: ['waterfall', 'cliff jumping', 'swimming', 'adventure'],
        featured: false,
        is_active: true,
      },
      // Food
      {
        name: 'Calbayog Seafood Restaurant',
        category: 'Food',
        description: 'Popular restaurant serving fresh seafood dishes and local Samar cuisine. Known for their grilled fish and kinilaw.',
        short_description: 'Fresh seafood and local Samar cuisine.',
        images: [],
        location_lat: 12.0730,
        location_lng: 124.0060,
        location_address: 'Rizal Avenue, Calbayog City, Samar',
        contact_phone: '+63 922 789 0123',
        opening_hours: '10:00 AM - 9:00 PM',
        entrance_fee: 'PHP 200-500 per person',
        tips: ['Try their kinilaw', 'Best for lunch and dinner', 'Reservations recommended on weekends'],
        tags: ['restaurant', 'seafood', 'local cuisine'],
        featured: true,
        is_active: true,
      },
      {
        name: 'Native Delicacies',
        category: 'Food',
        description: 'Local eatery serving traditional Samar delicacies and home-cooked meals. Famous for their binagol and moron.',
        short_description: 'Traditional Samar delicacies and home-cooked meals.',
        images: [],
        location_lat: 12.0710,
        location_lng: 124.0090,
        location_address: 'Market area, Calbayog City, Samar',
        opening_hours: '7:00 AM - 7:00 PM',
        entrance_fee: 'PHP 50-150 per person',
        tips: ['Must try binagol and moron', 'Affordable prices', 'Cash only'],
        tags: ['food', 'local delicacies', 'affordable'],
        featured: false,
        is_active: true,
      },
      // Nature
      {
        name: 'Calbayog Zipline',
        category: 'Nature',
        description: 'Experience the thrill of ziplining over scenic landscapes of Calbayog. One of the longest ziplines in Samar.',
        short_description: 'Thrilling zipline adventure over scenic landscapes.',
        images: [],
        location_lat: 12.0800,
        location_lng: 124.0180,
        location_address: 'Zipline Station, Calbayog City, Samar',
        contact_phone: '+63 923 890 1234',
        opening_hours: '8:00 AM - 5:00 PM',
        entrance_fee: 'PHP 300 per ride',
        tips: ['Wear comfortable clothes', 'Closed shoes required', 'Weight limit applies'],
        tags: ['adventure', 'zipline', 'nature', 'thrill'],
        featured: true,
        is_active: true,
      },
      {
        name: 'Jumangi Park',
        category: 'Nature',
        description: 'Eco-tourism park featuring gardens, walking trails, and picnic areas. Perfect for family outings and nature walks.',
        short_description: 'Eco-tourism park with gardens and walking trails.',
        images: [],
        location_lat: 12.0770,
        location_lng: 124.0120,
        location_address: 'Jumangi, Calbayog City, Samar',
        contact_phone: '+63 924 901 2345',
        opening_hours: '6:00 AM - 6:00 PM',
        entrance_fee: 'PHP 50 per person',
        tips: ['Great for families', 'Bring picnic mat', 'Best visited in morning'],
        tags: ['park', 'nature', 'family', 'picnic'],
        featured: false,
        is_active: true,
      },
      // Transport
      {
        name: 'Calbayog Van Terminal',
        category: 'Transport',
        description: 'Main transportation hub for vans and buses traveling to and from Calbayog City. Connects to major cities in Samar and Leyte.',
        short_description: 'Main transportation hub for vans and buses.',
        images: [],
        location_lat: 12.0750,
        location_lng: 124.0030,
        location_address: 'Van Terminal, Calbayog City, Samar',
        contact_phone: '+63 925 012 3456',
        opening_hours: '24/7',
        entrance_fee: 'Fares vary by destination',
        tips: ['Early trips recommended', 'Book ahead during holidays', 'Vans leave when full'],
        tags: ['transport', 'van terminal', 'bus terminal'],
        featured: false,
        is_active: true,
      },
      {
        name: 'Tricycle Terminal',
        category: 'Transport',
        description: 'City tricycle terminal for getting around Calbayog City proper. Affordable and convenient mode of local transportation.',
        short_description: 'City tricycle terminal for local transportation.',
        images: [],
        location_lat: 12.0725,
        location_lng: 124.0075,
        location_address: 'City Center, Calbayog City, Samar',
        opening_hours: '24/7',
        entrance_fee: 'PHP 10-50 per ride',
        tips: ['Negotiate price for special trips', 'Share rides to save money', 'Available everywhere in city'],
        tags: ['transport', 'tricycle', 'local transport'],
        featured: false,
        is_active: true,
      },
    ];

    const { error: insertError } = await supabase
      .from('destinations')
      .insert(destinations);

    if (insertError) {
      throw insertError;
    }

    console.log(`✓ Created ${destinations.length} destinations`);
  } catch (err) {
    console.error('✗ Error seeding destinations:', err.message);
  }
};

const seedAll = async () => {
  await seedAdmin();
  await seedDestinations();
};

module.exports = seedAll;
