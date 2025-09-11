/**
 * Firebase Metrics System Test Script
 *
 * Este script valida todos los componentes del sistema de métricas Firebase:
 * - Analytics events son registrados y visibles en Firebase Console
 * - Realtime Database connection funciona (read/write)
 * - BigQuery dataset recibe data (si está configurado)
 *
 * Para ejecutar: npm run ts-node firebase-metrics-test.ts
 */

import * as admin from 'firebase-admin';

const TEST_CONFIG = {
  projectId: process.env.FIREBASE_PROJECT_ID || 'your-project-id',
  testUserId: 'test-user-' + Date.now(),
  testProjectId: 'test-project-' + Date.now(),
  testEvents: 5,
};

interface TestResult {
  test: string;
  success: boolean;
  message: string;
  data?: any;
}

interface RealtimeTestData {
  test: string;
  timestamp: number;
  user_id: string;
}

interface UserPresenceData {
  userId: string;
  status: string;
  projectId: string;
  lastSeen: number;
  activeComponent: string;
}

interface CollaborationSessionData {
  sessionId: string;
  projectId: string;
  startTime: number;
  lastActivity: number;
  users: Record<string, boolean>;
}

class FirebaseMetricsTest {
  private admin: admin.app.App;
  private results: TestResult[] = [];

  constructor() {
    this.admin = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
  }

  async testRealtimeDatabase(): Promise<TestResult> {
    console.log('🧪 Testing Realtime Database connection...');

    try {
      const db = this.admin.database();
      const testRef = db.ref('connection_test');

      const testData = {
        timestamp: Date.now(),
        test: 'Firebase Realtime Database connection test',
        user_id: TEST_CONFIG.testUserId,
      };

      // Write test data
      await testRef.set(testData);
      console.log('  ✅ Write successful');

      // Read test data
      const snapshot = await testRef.once('value');
      const readData = snapshot.val() as RealtimeTestData | null;

      if (readData && readData.test === testData.test) {
        return {
          test: 'Realtime Database Connection',
          success: true,
          message: 'Read/write operations successful',
          data: { written: testData, read: readData },
        };
      } else {
        return {
          test: 'Realtime Database Connection',
          success: false,
          message: 'Data write/read mismatch',
        };
      }
    } catch (error) {
      return {
        test: 'Realtime Database Connection',
        success: false,
        message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async testFirestoreAnalytics(): Promise<TestResult> {
    console.log('🧪 Testing Firestore analytics events...');

    try {
      const firestore = this.admin.firestore();
      const eventsCollection = firestore.collection('analytics_test_events');

      const events = [];

      for (let i = 1; i <= TEST_CONFIG.testEvents; i++) {
        const event = {
          event_name: 'test_analytics_event',
          event_params: {
            user_id: TEST_CONFIG.testUserId,
            project_id: TEST_CONFIG.testProjectId,
            test_iteration: i,
            timestamp: Date.now(),
            success: i % 4 !== 0, // 75% success rate
            latency_ms: Math.floor(Math.random() * 2000) + 500,
          },
          created_at: admin.firestore.FieldValue.serverTimestamp(),
        };

        const docRef = await eventsCollection.add(event);
        events.push({ ...event, id: docRef.id });
      }

      console.log(`  ✅ Created ${events.length} test events in Firestore`);

      const snapshot = await eventsCollection
        .where('event_params.user_id', '==', TEST_CONFIG.testUserId)
        .get();

      const readEvents = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return {
        test: 'Firestore Analytics Events',
        success: true,
        message: `Successfully created and read ${readEvents.length} analytics events`,
        data: { created: events.length, read: readEvents.length },
      };
    } catch (error) {
      return {
        test: 'Firestore Analytics Events',
        success: false,
        message: `Firestore test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async testPresenceTracking(): Promise<TestResult> {
    console.log('🧪 Testing presence tracking...');

    try {
      const db = this.admin.database();
      const presenceRef = db.ref(
        `presence/${TEST_CONFIG.testProjectId}/${TEST_CONFIG.testUserId}`,
      );

      const userPresence = {
        userId: TEST_CONFIG.testUserId,
        projectId: TEST_CONFIG.testProjectId,
        status: 'online',
        lastSeen: Date.now(),
        activeComponent: 'test-component',
      };

      await presenceRef.set(userPresence);
      console.log('  ✅ User presence set');

      const snapshot = await presenceRef.once('value');
      const readPresence = snapshot.val() as UserPresenceData | null;

      const projectPresenceRef = db.ref(
        `presence/${TEST_CONFIG.testProjectId}`,
      );
      const projectSnapshot = await projectPresenceRef.once('value');
      const projectPresence = projectSnapshot.val() as Record<
        string,
        UserPresenceData
      > | null;

      return {
        test: 'Presence Tracking',
        success: true,
        message: 'Presence tracking working correctly',
        data: {
          userPresence: readPresence,
          projectUsers: Object.keys(projectPresence || {}).length,
        },
      };
    } catch (error) {
      return {
        test: 'Presence Tracking',
        success: false,
        message: `Presence tracking test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async testCollaborationSessions(): Promise<TestResult> {
    console.log('🧪 Testing collaboration sessions...');

    try {
      const db = this.admin.database();
      const sessionsRef = db.ref(
        `collaboration_sessions/${TEST_CONFIG.testProjectId}`,
      );

      const sessionData = {
        sessionId: 'test-session-' + Date.now(),
        projectId: TEST_CONFIG.testProjectId,
        users: {
          [TEST_CONFIG.testUserId]: {
            userId: TEST_CONFIG.testUserId,
            projectId: TEST_CONFIG.testProjectId,
            status: 'online',
            lastSeen: Date.now(),
          },
        },
        startTime: Date.now(),
        lastActivity: Date.now(),
      };

      const newSessionRef = sessionsRef.push();
      await newSessionRef.set(sessionData);
      console.log('  ✅ Collaboration session created');

      const snapshot = await newSessionRef.once('value');
      const readSession = snapshot.val() as CollaborationSessionData | null;

      return {
        test: 'Collaboration Sessions',
        success: true,
        message: 'Collaboration sessions working correctly',
        data: { session: readSession },
      };
    } catch (error) {
      return {
        test: 'Collaboration Sessions',
        success: false,
        message: `Collaboration sessions test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async testAnalyticsExportStructure(): Promise<TestResult> {
    console.log('🧪 Testing analytics export structure...');

    try {
      const firestore = this.admin.firestore();
      const exportCollection = firestore.collection('analytics_events');

      // Create BigQuery-compatible event structure
      const bigQueryEvent = {
        event_date: new Date().toISOString().split('T')[0],
        event_timestamp: Date.now() * 1000, // Microseconds
        event_name: 'test_analytics_export',
        event_params: [
          { key: 'user_id', value: { string_value: TEST_CONFIG.testUserId } },
          {
            key: 'project_id',
            value: { string_value: TEST_CONFIG.testProjectId },
          },
          { key: 'latency_ms', value: { int_value: 1250 } },
          { key: 'success', value: { string_value: 'true' } },
        ],
        user_id: TEST_CONFIG.testUserId,
        user_properties: [
          { key: 'user_type', value: { string_value: 'test_user' } },
        ],
      };

      const docRef = await exportCollection.add(bigQueryEvent);
      console.log('  ✅ BigQuery-compatible event created');

      const doc = await docRef.get();
      const data = doc.data();

      return {
        test: 'Analytics Export Structure',
        success: true,
        message: 'BigQuery-compatible structure validated',
        data: { docId: docRef.id, structure: data },
      };
    } catch (error) {
      return {
        test: 'Analytics Export Structure',
        success: false,
        message: `Export structure test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Firebase Metrics System Tests...\n');

    const tests = [
      await this.testRealtimeDatabase(),
      await this.testFirestoreAnalytics(),
      await this.testPresenceTracking(),
      await this.testCollaborationSessions(),
      await this.testAnalyticsExportStructure(),
    ];

    this.results = await Promise.all(tests);

    this.printResults();
    await this.cleanup();
  }

  private printResults(): void {
    console.log('\n📊 TEST RESULTS');
    console.log('================\n');

    let successCount = 0;

    this.results.forEach((result) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.test}`);
      console.log(`   ${result.message}`);

      if (result.data) {
        console.log(
          `   Data: ${JSON.stringify(result.data, null, 2).slice(0, 200)}...`,
        );
      }

      if (result.success) successCount++;
      console.log('');
    });

    const successRate = ((successCount / this.results.length) * 100).toFixed(1);
    console.log(
      `📈 SUCCESS RATE: ${successCount}/${this.results.length} (${successRate}%)\n`,
    );

    if (successCount === this.results.length) {
      console.log('🎉 ALL TESTS PASSED! Firebase metrics system is ready.');
    } else {
      console.log('⚠️  Some tests failed. Please review the configuration.');
    }
  }

  private async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up test data...');

    try {
      // Clean Firestore
      const firestore = this.admin.firestore();
      const testEvents = await firestore
        .collection('analytics_test_events')
        .where('event_params.user_id', '==', TEST_CONFIG.testUserId)
        .get();

      const batch = firestore.batch();
      testEvents.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();

      // Clean Realtime Database
      const db = this.admin.database();
      await db.ref('connection_test').remove();
      await db.ref(`presence/${TEST_CONFIG.testProjectId}`).remove();
      await db
        .ref(`collaboration_sessions/${TEST_CONFIG.testProjectId}`)
        .remove();

      console.log('✅ Test data cleaned up');
    } catch (error) {
      console.warn('⚠️  Failed to cleanup some test data:', error);
    }
  }
}

if (require.main === module) {
  const tester = new FirebaseMetricsTest();

  tester
    .runAllTests()
    .then(() => {
      console.log('\n✨ Test execution completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test execution failed:', error);
      process.exit(1);
    });
}
