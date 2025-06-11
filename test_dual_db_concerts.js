const http = require('http');

function testDualDatabaseConcerts() {
  console.log('🔄 Testing Concerts API on Both Databases...\n');

  // Check current database type
  const checkCurrentDatabase = () => {
    return new Promise((resolve) => {
      const options = {
        hostname: 'localhost',
        port: 4000,
        path: '/health',
        method: 'GET'
      };

      const req = http.request(options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          try {
            const healthData = JSON.parse(responseData);
            console.log('=== Current Database Status ===');
            console.log('- Current Database:', healthData.currentDatabase);
            console.log('- Migrated:', healthData.migrated);
            console.log('- PostgreSQL:', healthData.services.postgres);
            console.log('- MongoDB:', healthData.services.mongodb);
            resolve(healthData.currentDatabase);
          } catch (e) {
            console.log('Failed to get database info');
            resolve('unknown');
          }
        });
      });

      req.on('error', (error) => {
        console.error('Error checking database:', error.message);
        resolve('unknown');
      });

      req.end();
    });
  };

  // Test concerts API with current database
  const testConcertsAPI = (dbType) => {
    return new Promise((resolve) => {
      const options = {
        hostname: 'localhost',
        port: 4000,
        path: '/api/concerts/upcoming?limit=1',
        method: 'GET'
      };

      console.log(`\n=== Testing /api/concerts/upcoming (${dbType.toUpperCase()}) ===`);
      const req = http.request(options, (res) => {
        console.log('STATUS:', res.statusCode);
        
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          try {
            const data = JSON.parse(responseData);
            
            if (res.statusCode === 200 && data.concerts && data.concerts.length > 0) {
              const concert = data.concerts[0];
              console.log('✅ API Response Success');
              console.log('- Concert Count:', data.concerts.length);
              console.log('- Concert ID Format:', concert.concert_id ? 'PRESENT' : 'MISSING');
              console.log('- Concert Name:', concert.concert_name ? 'PRESENT' : 'MISSING');
              console.log('- Arena Object:', concert.arena ? 'PRESENT' : 'MISSING');
              console.log('- Arena Name:', concert.arena?.arena_name || 'MISSING');
              console.log('- Artists Count:', concert.artists?.length || 0);
              console.log('- Zone Pricing Count:', concert.zone_pricing?.length || 0);
              
              // Test the specific fields that were causing "Concert at undefined"
              const displayName = concert.concert_name || `Concert at ${concert.arena?.arena_name}` || 'Concert';
              console.log('- Frontend Display Name:', displayName);
              
              if (displayName.includes('undefined')) {
                console.log('❌ STILL SHOWS "Concert at undefined"');
                return resolve({ success: false, error: 'undefined in display name' });
              } else {
                console.log('✅ Display name is proper');
                return resolve({ success: true, dbType, concert });
              }
            } else {
              console.log('❌ API Failed or No Concerts');
              console.log('Response:', responseData.substring(0, 200));
              return resolve({ success: false, error: 'API failed or no concerts' });
            }
            
          } catch (e) {
            console.log('❌ JSON Parse Error:', e.message);
            console.log('Raw response:', responseData.substring(0, 200));
            return resolve({ success: false, error: 'JSON parse error' });
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ Request failed:', error.message);
        resolve({ success: false, error: error.message });
      });

      req.end();
    });
  };

  // Switch database via migration
  const switchDatabase = (targetDb) => {
    return new Promise((resolve) => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbi1pZCIsImVtYWlsIjoiYWRtaW5AY29uY2VydC5jb20iLCJ1c2VyVHlwZSI6ImFkbWluIiwiaWF0IjoxNzQ5NjcwNDI1LCJleHAiOjE3NTAwODAwMDB9.invalid'; // Admin token
      
      const options = {
        hostname: 'localhost',
        port: 4000,
        path: '/api/admin/migrate',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };

      console.log(`\n=== Switching to ${targetDb.toUpperCase()} ===`);
      const req = http.request(options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            console.log('✅ Database switched successfully');
            // Wait a bit for the switch to take effect
            setTimeout(() => resolve(true), 2000);
          } else {
            console.log('❌ Failed to switch database');
            console.log('Response:', responseData);
            resolve(false);
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ Migration request failed:', error.message);
        resolve(false);
      });

      req.write(JSON.stringify({ targetDatabase: targetDb }));
      req.end();
    });
  };

  // Run the full test sequence
  async function runTests() {
    try {
      // Test current database
      const currentDb = await checkCurrentDatabase();
      const result1 = await testConcertsAPI(currentDb);
      
      // Determine other database
      const otherDb = currentDb === 'mongodb' ? 'postgresql' : 'mongodb';
      
      // Switch to other database and test
      console.log(`\n📊 Testing on ${otherDb.toUpperCase()}...`);
      const switched = await switchDatabase(otherDb);
      
      if (switched) {
        const result2 = await testConcertsAPI(otherDb);
        
        // Switch back to original database
        await switchDatabase(currentDb);
        
        // Summary
        console.log('\n=== DUAL DATABASE TEST RESULTS ===');
        console.log(`${currentDb.toUpperCase()}:`, result1.success ? '✅ WORKS' : '❌ FAILED');
        console.log(`${otherDb.toUpperCase()}:`, result2.success ? '✅ WORKS' : '❌ FAILED');
        
        if (result1.success && result2.success) {
          console.log('🎉 CONCERTS API WORKS ON BOTH DATABASES!');
        } else {
          console.log('⚠️  ISSUE: API doesn\'t work consistently across databases');
          if (!result1.success) console.log(`- ${currentDb.toUpperCase()} Error:`, result1.error);
          if (!result2.success) console.log(`- ${otherDb.toUpperCase()} Error:`, result2.error);
        }
      } else {
        console.log('❌ Could not switch databases for testing');
      }
      
    } catch (error) {
      console.error('❌ Test execution error:', error);
    }
  }

  runTests();
}

testDualDatabaseConcerts(); 