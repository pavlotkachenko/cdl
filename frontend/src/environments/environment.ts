// ============================================
// Angular Environment - Development
// ============================================
// Configuration for local development

export const environment = {
  production: false,
  
  // Backend API Configuration
  // Uses relative /api path so ng serve proxy can forward to the real backend
  // regardless of whether running on host or inside Docker Cypress containers.
  apiUrl: '/api',
  wsUrl: 'http://localhost:3000',
  
  // Feature Flags
  useMockData: false, // Set to false to use real backend APIs
  
  // Supabase Configuration
  supabase: {
    url: 'https://ahecrufmxtriyivaaeng.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoZWNydWZteHRyaXlpdmFhZW5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NjY1NzgsImV4cCI6MjA4NTE0MjU3OH0.UevqwXpq3LZ23IxHbKWiDTPQlS0axHsiooGUNb2Jg_s'
  },
  
  // VAPID Public Key for Push Notifications
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
 * INSTRUCTIONS:
 * 1. Copy this file to src/environments/environment.ts
 * 2. Replace Supabase URL and key with your actual values
 * 3. Never commit the file with real credentials to Git!
 * 4. For production, use environment.prod.ts with production URLs
 */
