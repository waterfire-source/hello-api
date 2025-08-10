// api/index.js
const axios = require('axios');
const express = require('express');
const app = express();

// Middleware to parse JSON
app.use(express.json());

// IP2Location API configuration - use environment variable for Vercel
const IP2LOCATION_API_KEY = process.env.IP2LOCATION_API_KEY || '66EFBEC8F666B07635A845CF70521B80';
const IP2LOCATION_BASE_URL = 'https://api.ip2location.io/';

// Helper function to get the real IP address
function getClientIP(req) {
  // Check various headers for the real IP address
  const ip = req.headers['x-forwarded-for'] || 
             req.headers['x-real-ip'] || 
             req.connection.remoteAddress || 
             req.socket.remoteAddress || 
             req.connection.socket?.remoteAddress;
  
  // Handle IPv6 localhost format
  if (ip === '::1' || ip === '::ffff:127.0.0.1') return '127.0.0.1';
  
  // Extract the first IP if it's a comma-separated list
  return ip ? ip.split(',')[0].trim() : '127.0.0.1';
}

// Function to get location data from IP2Location
async function getLocationFromIP(ipAddress) {
  try {
    const response = await axios.get(`${IP2LOCATION_BASE_URL}?key=${IP2LOCATION_API_KEY}&ip=${ipAddress}`, { 
      timeout: 10000 
    });
    
    const locationData = response.data;
    console.log('IP2Location response:', locationData);
    
    // Check if we got valid location data
    if (locationData.country_name && locationData.city_name) {
      return {
        success: true,
        data: locationData
      };
    } else {
      return {
        success: false,
        error: 'Invalid location data received'
      };
    }
  } catch (error) {
    console.error('IP2Location API error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Main IP checker endpoint - works with any request
app.post('/api/ip-checker-sample/', async (req, res) => {
  console.log('Received IP check request:', req.body);
  
  try {
    const ipAddress = getClientIP(req);
    console.log('Client IP detected:', ipAddress);
    
    // For local development, always get the public IP
    if (ipAddress === '127.0.0.1' || ipAddress === 'localhost') {
      console.log('Local development detected, fetching public IP...');
      
      try {
        // Get public IP from ipify.org
        const publicIPResponse = await axios.get('https://api.ipify.org?format=json', { timeout: 5000 });
        const publicIP = publicIPResponse.data.ip;
        console.log('Public IP detected:', publicIP);
        
        // Get location data for the public IP using IP2Location
        const locationResult = await getLocationFromIP(publicIP);
        
        if (locationResult.success) {
          const locationData = locationResult.data;
          const address = `${locationData.city_name}, ${locationData.country_name}`;
          
          return res.json({
            message: 'IP location detected successfully',
            address: address,
            ip: publicIP,
            location: {
              city: locationData.city_name,
              country: locationData.country_name,
              region: locationData.region_name,
              latitude: locationData.latitude,
              longitude: locationData.longitude,
              zipCode: locationData.zip_code,
              timezone: locationData.time_zone,
              asn: locationData.asn,
              isProxy: locationData.is_proxy
            },
            timestamp: new Date().toISOString(),
            status: 'success',
            note: 'Location based on your public IP address using IP2Location'
          });
        } else {
          console.log('IP2Location failed for public IP:', locationResult.error);
          throw new Error(`IP2Location failed: ${locationResult.error}`);
        }
      } catch (publicIPError) {
        console.log('Could not get public IP or location:', publicIPError.message);
        
        // Fallback for local development
        return res.json({
          message: 'IP check completed',
          address: 'Local Development',
          ip: ipAddress,
          timestamp: new Date().toISOString(),
          status: 'success',
          note: 'Running locally - could not detect public location'
        });
      }
    }
    
    // For production/real IPs, get actual location
    console.log('Getting location for IP:', ipAddress);
    const locationResult = await getLocationFromIP(ipAddress);
    
    if (locationResult.success) {
      const locationData = locationResult.data;
      const address = `${locationData.city_name}, ${locationData.country_name}`;
      
      return res.json({
        message: 'IP location detected successfully',
        address: address,
        ip: ipAddress,
        location: {
          city: locationData.city_name,
          country: locationData.country_name,
          region: locationData.region_name,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          zipCode: locationData.zip_code,
          timezone: locationData.time_zone,
          asn: locationData.asn,
          isProxy: locationData.is_proxy
        },
        timestamp: new Date().toISOString(),
        status: 'success'
      });
    } else {
      console.log('IP2Location failed:', locationResult.error);
      // If location detection fails, return IP info
      return res.json({
        message: 'IP check completed',
        address: 'Location unavailable',
        ip: ipAddress,
        timestamp: new Date().toISOString(),
        status: 'success',
        note: `Could not determine exact location: ${locationResult.error}`
      });
    }
    
  } catch (error) {
    console.error('Error processing IP check request:', error.message);
    
    // Fallback response
    const ipAddress = getClientIP(req);
    return res.json({
      message: 'IP check completed',
      address: 'Location detection failed',
      ip: ipAddress,
      timestamp: new Date().toISOString(),
      status: 'success',
      note: 'Error occurred while detecting location'
    });
  }
});

// GET endpoint for testing the new endpoint
app.get('/api/ip-checker-sample/', (req, res) => {
  res.json({ 
    message: 'IP Checker API is working!', 
    usage: 'Send any POST request to this endpoint to get IP location data',
    example: 'POST /api/ip-checker-sample/ with any JSON body'
  });
});

// Legacy endpoint for backward compatibility
app.post('/api', async (req, res) => {
  console.log('Legacy endpoint called, redirecting to new endpoint');
  // Redirect to the new endpoint
  req.url = '/api/ip-checker-sample/';
  return app._router.handle(req, res);
});

// GET endpoint for legacy API
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Legacy API endpoint', 
    note: 'This endpoint is deprecated. Use /api/ip-checker-sample/ instead.',
    newEndpoint: '/api/ip-checker-sample/'
  });
});

// Health check endpoint for cron jobs
app.get('/api/health', (req, res) => {
  const healthData = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    ip2location_key: IP2LOCATION_API_KEY ? 'Configured' : 'Missing',
    version: '1.0.0',
    endpoints: {
      'POST /api/ip-checker-sample/': 'Main IP checker endpoint',
      'GET /api/ip-checker-sample/': 'IP checker info',
      'POST /api': 'Legacy endpoint (deprecated)',
      'GET /api/health': 'Health check'
    }
  };
  
  console.log('Health check triggered:', healthData);
  res.json(healthData);
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'IP Checker API is running!',
    endpoints: {
      'POST /api/ip-checker-sample/': 'Send any request to get IP location data',
      'GET /api/ip-checker-sample/': 'Get API information',
      'GET /api/health': 'Health check endpoint',
      'GET /': 'This information'
    },
    documentation: 'Send any POST request to /api/ip-checker-sample/ to get location data'
  });
});

// Start server only if running locally
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Test with: POST /api/ip-checker-sample/ with any JSON body');
    console.log('Using IP2Location API for accurate geolocation data');
  });
}

module.exports = app;
