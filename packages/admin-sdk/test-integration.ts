import { AdminAPI } from './src/generated';
import axios from 'axios';

// Test the generated AdminAPI client
async function testAdminAPI() {
  console.log('🧪 Testing generated AdminAPI client...');
  
  const client = new AdminAPI({
    baseURL: 'http://localhost:5001',
    timeout: 5000
  });

  try {
    // Test a simple endpoint that doesn't require auth
    const response = await axios.get('http://localhost:5001/api/health');
    console.log('✅ Backend health check:', response.status);
    
    console.log('✅ AdminAPI client instantiated successfully');
    console.log('📊 Available methods:');
    
    // List some key methods
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(client))
      .filter(name => name.startsWith('AdminController_'))
      .slice(0, 10);
    
    methods.forEach(method => {
      console.log(`  - ${method}`);
    });
    
    if (methods.length > 0) {
      console.log(`  ... and ${Object.getOwnPropertyNames(Object.getPrototypeOf(client)).filter(name => name.startsWith('AdminController_')).length - 10} more admin methods`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Test the generated AdminAPI client
// Run the test
testAdminAPI();

export { testAdminAPI };