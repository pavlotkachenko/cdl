// ============================================
// Angular Environment - Development
// ============================================
// Configuration for local development

export const environment = {
  production: false,
  
  // API Endpoints
  apiUrl: 'http://localhost:3000/api',
  
  // Supabase Configuration
  supabase: {
    url: 'https://ahecrufmxtriyivaaeng.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoZWNydWZteHRyaXlpdmFhZW5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NjY1NzgsImV4cCI6MjA4NTE0MjU3OH0.UevqwXpq3LZ23IxHbKWiDTPQlS0axHsiooGUNb2Jg_s'
  },
  
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
 */
