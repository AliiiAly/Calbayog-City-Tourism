-- Update coordinates to ACCURATE Calbayog City locations
-- Calbayog City Center: 12.0686°N, 124.5972°E

-- Update Hotels
UPDATE destinations SET location_lat = 12.0680, location_lng = 124.5965 WHERE name = 'Hotel Calbayog';
UPDATE destinations SET location_lat = 12.0550, location_lng = 124.6100 WHERE name = 'Samar Paradise Resort';
UPDATE destinations SET location_lat = 12.1050, location_lng = 124.5450 WHERE name = 'Waterfalls Inn';
UPDATE destinations SET location_lat = 12.0695, location_lng = 124.5980 WHERE name = 'City View Hotel';

-- Update Beaches
UPDATE destinations SET location_lat = 12.0320, location_lng = 124.6250, name = 'Malajog Beach' WHERE name = 'Bangon Beach';
UPDATE destinations SET location_lat = 12.0480, location_lng = 124.6150 WHERE name = 'Mawacat Beach';
UPDATE destinations SET location_lat = 12.0400, location_lng = 124.6200, name = 'Daraga Beach' WHERE name = 'Jubasan Beach';
UPDATE destinations SET location_lat = 12.0250, location_lng = 124.6300, name = 'Pan-as Beach' WHERE name = 'Binalay Beach';

-- Update Waterfalls
UPDATE destinations SET location_lat = 12.1100, location_lng = 124.5400 WHERE name = 'Bangon-Bugtong Falls';
UPDATE destinations SET location_lat = 12.1200, location_lng = 124.5350, name = 'Tarangban Falls' WHERE name = 'Tinago-an Falls';
UPDATE destinations SET location_lat = 12.1150, location_lng = 124.5420 WHERE name = 'Lulugayan Falls';

-- Update Food Places
UPDATE destinations SET location_lat = 12.0670, location_lng = 124.5955 WHERE name = 'Calbayog Seafood Grill';
UPDATE destinations SET location_lat = 12.0700, location_lng = 124.5990 WHERE name = 'Samar Delicacies';

-- Update Nature Spots
UPDATE destinations SET location_lat = 12.0750, location_lng = 124.5850, name = 'Calbayog Zipline Eco Park' WHERE name = 'Calbayog Eco Park';
UPDATE destinations SET location_lat = 12.0900, location_lng = 124.5600, name = 'Mapaso Hot Spring' WHERE name = 'Samar Rainforest Reserve';

-- Update Transport
UPDATE destinations SET location_lat = 12.0727, location_lng = 124.5447, name = 'Calbayog Airport' WHERE name = 'Calbayog City Port';
UPDATE destinations SET location_lat = 12.0660, location_lng = 124.5950, name = 'Calbayog Integrated Bus Terminal' WHERE name = 'Van Terminal';
