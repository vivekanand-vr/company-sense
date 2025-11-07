import { Router, Request, Response } from 'express';
import { ApolloService } from '../services/apollo.service';
import { config } from '../lib/config';
import axios from 'axios';

const router = Router();

// Debug endpoint to test Apollo API directly
router.get('/test-apollo', async (req: Request, res: Response) => {
  try {
    const domain = req.query.domain as string || 'amberstudent.com';
    
    console.log('=== APOLLO DEBUG TEST ===');
    console.log('API Key from config:', config.apollo.apiKey ? `${config.apollo.apiKey.substring(0, 8)}...` : 'MISSING');
    console.log('Testing domain:', domain);
    
    // Test 1: Direct axios call (same as test-apollo.js)
    console.log('\n--- Test 1: Direct Axios Call ---');
    try {
      const directOptions = {
        method: 'GET',
        url: 'https://api.apollo.io/api/v1/organizations/enrich',
        headers: {
          'accept': 'application/json',
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json',
          'x-api-key': config.apollo.apiKey
        },
        params: {
          domain: domain
        },
        timeout: 30000
      };
      
      console.log('Direct request config:', {
        url: directOptions.url,
        method: directOptions.method,
        headers: Object.keys(directOptions.headers),
        params: directOptions.params
      });
      
      const directResponse = await axios.request(directOptions);
      console.log('✅ Direct call SUCCESS:', directResponse.status);
      console.log('Direct response org name:', directResponse.data?.organization?.name);
      
    } catch (directError: any) {
      console.log('❌ Direct call FAILED:', directError.response?.status, directError.response?.statusText);
      console.log('Direct error data:', directError.response?.data);
    }
    
    // Test 2: Using ApolloService
    console.log('\n--- Test 2: Apollo Service Call ---');
    try {
      const apolloService = new ApolloService();
      const serviceResult = await apolloService.enrichOrganization(domain);
      
      if (serviceResult) {
        console.log('✅ Service call SUCCESS');
        console.log('Service response org name:', serviceResult.name);
      } else {
        console.log('❌ Service call returned null');
      }
      
    } catch (serviceError: any) {
      console.log('❌ Service call FAILED:', serviceError.message);
    }
    
    res.json({
      status: 'debug complete',
      message: 'Check console for debug output'
    });
    
  } catch (error: any) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;