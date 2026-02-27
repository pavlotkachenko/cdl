// ============================================
// Angular Environment - Production
// ============================================
// Configuration for production deployment

export const environment = {
  production: true,
  
  // Backend API Configuration
  apiUrl: 'https://api.cdlticket.com/api',
  wsUrl: 'wss://api.cdlticket.com',
  
  // Feature Flags
  useMockData: false,
  
  // Supabase Configuration
  supabase: {
    url: 'https://ahecrufmxtriyivaaeng.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoZWNydWZteHRyaXlpdmFhZW5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NjY1NzgsImV4cCI6MjA4NTE0MjU3OH0.UevqwXpq3LZ23IxHbKWiDTPQlS0axHsiooGUNb2Jg_s'
  },
  
  // VAPID Public Key for Push Notifications (use production key in real deployment)
  vapidPublicKey: 'BCEfkgIFSR4CVy9YxQ_xapLVJaBL7opN6Pw8lQJIKuASAYAMyDj60IVvuMtAcigABNLYaSNinhQT86AHJfwE9JY',
  
  // Feature Flags
  features: {
    enableAutoAssignment: true,
    enableNotifications: true,
    enableFileUpload: true
  },
  
  // App Configuration
  app: {
    name: 'CDL Ticket Management',
    version: '1.0.0'
  }
};

/*
 * PRODUCTION NOTES:
 * 1. Update apiUrl with your production backend URL
 * 2. Use production Supabase credentials
 * 3. Generate separate production VAPID keys
 * 4. Enable SSL/TLS for all endpoints
 * 5. Configure proper CORS settings
 */
