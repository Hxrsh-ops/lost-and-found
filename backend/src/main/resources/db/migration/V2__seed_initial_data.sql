-- ==============================================================================
-- Lost & Found Hub — Initial Seed Data
-- Version: V2
-- Categories & Campus Location Zones
-- ==============================================================================

-- Seed Categories
INSERT INTO categories (id, name, description, active, created_at, updated_at) VALUES
    ('c1000000-0000-0000-0000-000000000001', 'Electronics', 'Phones, laptops, chargers, headphones, calculators, etc.', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('c1000000-0000-0000-0000-000000000002', 'Bags & Backpacks', 'Backpacks, handbags, duffels, pouches, etc.', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('c1000000-0000-0000-0000-000000000003', 'ID / Cards', 'Student IDs, access badges, bank cards, driver licenses', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('c1000000-0000-0000-0000-000000000004', 'Keys', 'Room keys, vehicle keys, keychains, locker keys', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('c1000000-0000-0000-0000-000000000005', 'Clothing', 'Jackets, sweaters, caps, hoodies, sportswear', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('c1000000-0000-0000-0000-000000000006', 'Books / Stationery', 'Notebooks, textbooks, pencil pouches, calculators, folders', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('c1000000-0000-0000-0000-000000000007', 'Accessories', 'Watches, jewelry, glasses, sunglasses, umbrellas', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('c1000000-0000-0000-0000-000000000008', 'Water Bottles', 'Reusable bottles, flasks, thermoses', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('c1000000-0000-0000-0000-000000000009', 'Documents', 'Certificates, project files, exam tickets, official forms', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('c1000000-0000-0000-0000-000000000010', 'Other', 'Items not covered in standard categories', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (name) DO NOTHING;

-- Seed Location Zones (SRM Ramapuram campus zones)
INSERT INTO location_zones (id, name, description, active, created_at, updated_at) VALUES
    ('d1000000-0000-0000-0000-000000000001', 'Central Library', 'Central library reading halls, digital library, circulation desks', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('d1000000-0000-0000-0000-000000000002', 'Canteen', 'Main food court, cafeteria, juice stalls, seating areas', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('d1000000-0000-0000-0000-000000000003', 'Gym', 'Campus gym, indoor sports complex, fitness centers', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('d1000000-0000-0000-0000-000000000004', 'Academic Block', 'Main academic blocks, lecture halls, departmental corridors', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('d1000000-0000-0000-0000-000000000005', 'Classrooms', 'Floor classrooms, seminar rooms, drawing halls', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('d1000000-0000-0000-0000-000000000006', 'Laboratories', 'Computer labs, electronics labs, mechanical workshops', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('d1000000-0000-0000-0000-000000000007', 'Administrative Block', 'Dean office, student affairs, accounts office, reception', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('d1000000-0000-0000-0000-000000000008', 'Hostels', 'Men and women student residence halls, dining messes, common rooms', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('d1000000-0000-0000-0000-000000000009', 'Other', 'Grounds, parking areas, walkways, gate areas', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (name) DO NOTHING;
