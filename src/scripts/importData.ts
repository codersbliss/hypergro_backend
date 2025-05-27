import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../config/database';
import Property from '../models/Property';
import User from '../models/User';

// Load environment variables
dotenv.config();

// Create admin user if not exists
const createAdminUser = async () => {
  try {
    console.log('Creating admin user...');
    
    // Check if admin user already exists
    const adminExists = await User.findOne({ email: 'admin@example.com' });
    
    if (adminExists) {
      console.log('Admin user already exists');
      return adminExists;
    }
    
    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
    });
    
    console.log('Admin user created successfully');
    return admin;
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

// Parse date in DD/MM/YYYY format to Date object
const parseDate = (dateString: string): Date => {
  const [day, month, year] = dateString.split('/');
  return new Date(`${year}-${month}-${day}`);
};

// Import data from CSV
const importData = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Create admin user
    const admin = await createAdminUser();
    
    // Check if data already exists
    const propertyCount = await Property.countDocuments();
    
    if (propertyCount > 0) {
      console.log(`Database already has ${propertyCount} properties. Skipping import.`);
      console.log('If you want to reimport, please clear the database first.');
      await disconnectDB();
      process.exit(0);
    }
    
    // Path to CSV file
    const csvFilePath = path.join(__dirname, '../../property_data/property_data.csv');
    
    if (!fs.existsSync(csvFilePath)) {
      console.error(`CSV file not found at: ${csvFilePath}`);
      process.exit(1);
    }
    
    const properties: any[] = [];
    
    // Parse CSV file
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data) => {
        // Transform data
        const property = {
          id: data.id,
          title: data.title,
          type: data.type,
          price: Number(data.price),
          state: data.state,
          city: data.city,
          areaSqFt: Number(data.areaSqFt),
          bedrooms: Number(data.bedrooms),
          bathrooms: Number(data.bathrooms),
          amenities: data.amenities ? data.amenities.split('|') : [],
          furnished: data.furnished,
          availableFrom: parseDate(data.availableFrom),
          listedBy: data.listedBy,
          tags: data.tags ? data.tags.split('|') : [],
          colorTheme: data.colorTheme,
          rating: Number(data.rating),
          isVerified: data.isVerified === 'TRUE',
          listingType: data.listingType,
          createdBy: admin._id,
        };
        
        properties.push(property);
      })
      .on('end', async () => {
        try {
          // Insert properties into database
          await Property.insertMany(properties);
          console.log(`Imported ${properties.length} properties successfully`);
          await disconnectDB();
          process.exit(0);
        } catch (error) {
          console.error('Error importing data:', error);
          await disconnectDB();
          process.exit(1);
        }
      })
      .on('error', async (error) => {
        console.error('Error reading CSV file:', error);
        await disconnectDB();
        process.exit(1);
      });
  } catch (error) {
    console.error('Error in import process:', error);
    await disconnectDB();
    process.exit(1);
  }
};

// Run the import process
importData();