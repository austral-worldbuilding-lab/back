/**
 * Test Analytics Event - Firebase Console Validation
 *
 * Este script genera un evento de analytics simple que será visible
 * en Firebase Console Analytics Dashboard en 5-15 minutos.
 *
 * Para ejecutar: npm run ts-node test-analytics-event.ts
 */

import * as admin from 'firebase-admin';

const app = admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

async function sendTestAnalyticsEvent() {
  console.log('Sending test analytics event...');

  try {
    const firestore = app.firestore();
    const eventsCollection = firestore.collection('analytics_events');

    const testEvent = {
      event_name: 'firebase_metrics_test',
      event_params: {
        user_id: `test-user-${Date.now()}`,
        project_id: `test-project-${Date.now()}`,
        test_type: 'firebase_console_validation',
        success: true,
        timestamp: Date.now(),
        message: 'Firebase metrics system working correctly',
      },
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Save to Firestore
    const docRef = await eventsCollection.add(testEvent);
    console.log('✅ Test event saved to Firestore:', docRef.id);

    const database = app.database();
    const testRef = database.ref('analytics_test');

    const realtimeEvent = {
      event_name: 'realtime_test',
      timestamp: Date.now(),
      test_success: true,
      user_id: `test-user-${Date.now()}`,
    };

    await testRef.push(realtimeEvent);
    console.log('✅ Test event saved to Realtime Database');
  } catch (error) {
    console.error('❌ Failed to send test event:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

sendTestAnalyticsEvent().catch((error) => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});
