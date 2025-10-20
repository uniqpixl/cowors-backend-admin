import axios, { 
  AxiosInstance, 
  AxiosRequestConfig, 
  AxiosResponse, 
  InternalAxiosRequestConfig,
  AxiosError
} from 'axios';
import { getAuthToken, clearTokens } from '@/lib/auth';

console.log('🚀 client.ts module loaded!');

// Create axios instance with base configuration
export const createApiClient = () => {
  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
  try {
    const parsed = new URL(baseURL);
    const port = parsed.port || (parsed.protocol === 'http:' ? '80' : '443');
    if (port !== '5001') {
      throw new Error(`Strict port rule violated: NEXT_PUBLIC_API_URL must use port 5001. Current: ${baseURL}`);
    }
  } catch (e) {
    console.error('Invalid NEXT_PUBLIC_API_URL or port rule violation:', e);
    throw e;
  }
  
  console.log('🔧 Creating API client with baseURL:', baseURL);
  console.log('🔧 NEXT_PUBLIC_API_URL env var:', process.env.NEXT_PUBLIC_API_URL);
  console.log('🔧 All env vars starting with NEXT_PUBLIC:', Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC')));
  
  const client = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });
  


  // Note: NextAuth routes are handled separately by Next.js, not through this axios client

  // Request interceptor for logging only (auth token will be added manually when needed)
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      // Log request for debugging
      console.log('🚀 API Request:', config.method?.toUpperCase(), config.url);
      console.log('🚀 Full URL will be:', (config.baseURL || '') + config.url);
      console.log('🚀 Config baseURL:', config.baseURL);
      
      // Note: Auth token is now added manually in specific API calls to avoid circular dependency
      // with NextAuth session fetching
      
      return config;
    },
    (error) => {
      console.error('API Request Error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor for error normalization and retry logic
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      console.log('API Response:', response.status, response.config.url);
      return response;
    },
    async (error: AxiosError) => {
      const url = error.config?.url || '';
      const status = error.response?.status;
      
      // List of endpoints that are expected to return 404 (not yet implemented)
      const expectedMissingEndpoints: string[] = [
        // TCS and TDS endpoints are now implemented
        // '/api/v1/admin/taxes/tcs',
        // '/api/v1/admin/taxes/tds',
        // Analytics endpoints are now implemented
        // '/api/v1/admin/analytics/revenue-metrics',
        // '/api/v1/admin/analytics/revenue-breakdown'
      ];
      
      // Check if this is an expected 404 for missing endpoints
      const isExpected404 = status === 404 && expectedMissingEndpoints.some(endpoint => url.includes(endpoint));
      
      if (!isExpected404) {
        console.error('API Response Error:', error.response?.status, error.response?.data || error.message);
      } else {
        // Silently handle expected 404s - just log at debug level
        console.debug('Expected API endpoint not available:', url);
      }
      
      // Handle authentication errors and role-based access separately
      if (error.response?.status === 401) {
        // Only redirect to login when there is no valid token
        const token = await getAuthToken();
        const hasToken = Boolean(token);

        if (!hasToken) {
          console.error('🔒 Authentication Error (401) - No token, redirecting to login');
          
          // Clear expired tokens (does not remove valid tokens)
          clearTokens();
          
          // Redirect to login page if we're in the browser
          if (typeof window !== 'undefined') {
            const { pathname } = window.location;
            if (!pathname.includes('/login') && !pathname.includes('/auth')) {
              console.log('🔄 Redirecting to login page...');
              window.location.href = '/auth/login';
            }
          }
        } else {
          // If a token exists, do not force redirect; let calling code handle the error
          console.warn('🔒 Authentication Error (401) - Token present, not redirecting');
        }
      }

      if (error.response?.status === 403) {
        console.warn('🚫 Authorization Error (403) - Insufficient permissions');
        // Do NOT redirect to login or clear tokens on 403.
        // Optionally, navigate to an unauthorized page to inform the user.
        if (typeof window !== 'undefined') {
          const { pathname } = window.location;
          if (!pathname.includes('/unauthorized')) {
            console.log('➡️ Redirecting to unauthorized page...');
            window.location.href = '/unauthorized';
          }
        }
      }
      
      // Log detailed validation errors for 422 responses
      if (error.response?.status === 422 && error.response?.data) {
        const errorData = error.response.data as any;
        if (errorData.details && Array.isArray(errorData.details)) {
          console.error('Validation Error Details:', errorData.details);
          errorData.details.forEach((detail: any, index: number) => {
            console.error(`Validation Error ${index + 1}:`, detail);
          });
        }
      }
      
      // Handle different error scenarios (but not for expected 404s)
      if (!isExpected404) {
        if (error.response?.status === 401) {
          console.warn('API: Authentication required for this endpoint');
        } else if (error.response?.status === 403) {
          console.warn('API: Forbidden access - insufficient permissions');
        } else if (error.code === 'ECONNREFUSED' || error.code === 'NETWORK_ERROR' || !error.response) {
          console.warn('API: Network connectivity issue - backend server may be down');
        } else if (error.response?.status >= 500) {
          console.error('API: Server error occurred');
        }
      }
      
      return Promise.reject(error);
    }
  );

  return client;
};

// Export configured axios instance
export const apiClient = createApiClient();

// Helper function to handle API responses
export const handleApiResponse = <T>(response: AxiosResponse<T>): T => {
  return response.data;
};

// Helper function to add auth token to request config
export const addAuthToken = async (config: any) => {
  console.log('🔍 addAuthToken: Getting token for request to:', config.url)
  const token = await getAuthToken()
  if (token) {
    console.log('✅ addAuthToken: Token found, adding to request headers')
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    }
  } else {
    console.log('❌ addAuthToken: No token found for request')
  }
  return config
}

// Generic API request wrapper with better error handling
export const apiRequest = async <T = any>(config: {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
}, requiresAuth: boolean = true): Promise<T> => {
  console.log('🔥 apiRequest called with config:', config);
  console.log('🔥 requiresAuth:', requiresAuth);
  try {
    console.log('API Request config:', config);
    
    // Convert to AxiosRequestConfig format
    let axiosConfig: AxiosRequestConfig = {
      url: config.url,
      method: config.method,
      data: config.data,
      params: config.params,
      headers: config.headers
    };
    
    console.log('🔧 Before auth token - axiosConfig:', axiosConfig);
    
    // Add auth token if required
    if (requiresAuth) {
      axiosConfig = await addAuthToken(axiosConfig);
    }
    
    // Ensure absolute URL by combining with configured baseURL
    const base = apiClient.defaults.baseURL || '';
    if (axiosConfig.url && axiosConfig.url.startsWith('/')) {
      axiosConfig.url = `${base}${axiosConfig.url}`;
    }
    
    console.log('🔧 After auth token - axiosConfig:', axiosConfig);
    console.log('🚀 Making request to:', axiosConfig.url);
    
    const response = await apiClient.request<T>(axiosConfig);
    console.log('✅ API Response received:', response.status, response.data);
    return handleApiResponse(response);
  } catch (error) {
    // Enhanced error handling
    if (axios.isAxiosError(error)) {
      const url = error.config?.url || '';
      const status = error.response?.status;
      
      // List of endpoints that are expected to return 404 (not yet implemented)
      const expectedMissingEndpoints: string[] = [
        // TCS and TDS endpoints are now implemented
        // '/api/v1/admin/taxes/tcs',
        // '/api/v1/admin/taxes/tds',
        '/api/v1/admin/analytics/revenue-metrics',
        '/api/v1/admin/analytics/revenue-breakdown'
      ];
      
      // Check if this is an expected 404 for missing endpoints
      const isExpected404 = status === 404 && expectedMissingEndpoints.some(endpoint => url.includes(endpoint));
      
      if (!isExpected404) {
        console.error('❌ API Request failed:', error);
        console.error('❌ Axios error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
          method: error.config?.method
        });
      } else {
        console.debug('Expected API endpoint not available, using fallback data:', url);
      }
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'An error occurred while processing your request'
      );
    }
    console.error('❌ API Request failed:', error);
    throw error;
  }
};