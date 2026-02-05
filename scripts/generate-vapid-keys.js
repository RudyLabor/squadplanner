#!/usr/bin/env node
/**
 * Script to generate VAPID keys for Web Push notifications
 *
 * Usage:
 *   npx web-push generate-vapid-keys
 *
 * Or run this script directly:
 *   node scripts/generate-vapid-keys.js
 *
 * Then add the keys to:
 * - .env (VITE_VAPID_PUBLIC_KEY)
 * - Supabase Edge Function secrets (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
 */

const crypto = require('crypto');

// Generate a new ECDSA key pair using P-256 curve
function generateVapidKeys() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
    publicKeyEncoding: {
      type: 'spki',
      format: 'der'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'der'
    }
  });

  // Extract the raw public key (65 bytes, uncompressed)
  // SPKI format has a header, we need to remove it
  // The public key starts at byte 26 for P-256
  const rawPublicKey = publicKey.slice(26);

  // Convert to URL-safe base64 for VAPID
  const publicKeyBase64 = rawPublicKey.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  // Private key in base64 (for Edge Functions)
  const privateKeyBase64 = privateKey.toString('base64');

  return {
    publicKey: publicKeyBase64,
    privateKey: privateKeyBase64
  };
}

// Main
console.log('\n🔑 Generating VAPID Keys for Web Push Notifications\n');
console.log('═'.repeat(60));

const keys = generateVapidKeys();

console.log('\n📋 Add these to your .env file:\n');
console.log(`VITE_VAPID_PUBLIC_KEY=${keys.publicKey}`);

console.log('\n📋 Add these to Supabase Edge Function secrets:\n');
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:contact@squadplanner.app`);

console.log('\n' + '═'.repeat(60));
console.log('\n⚠️  Keep the private key SECRET! Never commit it to git.\n');
console.log('To set Supabase secrets, run:');
console.log('  supabase secrets set VAPID_PUBLIC_KEY="..."');
console.log('  supabase secrets set VAPID_PRIVATE_KEY="..."');
console.log('  supabase secrets set VAPID_SUBJECT="mailto:contact@squadplanner.app"');
console.log('');
