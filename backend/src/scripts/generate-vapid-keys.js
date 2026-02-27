/**
 * Generate VAPID Keys Script
 * Generates public and private VAPID keys for web push notifications
 * Location: backend/src/scripts/generate-vapid-keys.js
 * 
 * Usage: node backend/src/scripts/generate-vapid-keys.js
 * 
 * Add the generated keys to your .env file:
 * VAPID_PUBLIC_KEY=...
 * VAPID_PRIVATE_KEY=...
 */

const webpush = require('web-push');

try {
  console.log('Generating VAPID keys...\n');
  
  const vapidKeys = webpush.generateVAPIDKeys();
  
  console.log('VAPID keys generated successfully!\n');
  console.log('Add these to your .env file:\n');
  console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
  console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
  console.log('\nVAPID_SUBJECT=mailto:admin@cdlticket.com');
  console.log('\nKeep the private key secure and never expose it in client-side code!');
} catch (error) {
  console.error('Error generating VAPID keys:', error);
  process.exit(1);
}
