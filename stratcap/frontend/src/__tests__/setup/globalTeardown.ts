import { GlobalConfig } from '@jest/types';

export default async function globalTeardown(globalConfig: GlobalConfig): Promise<void> {
  console.log('\n🧹 Starting test environment cleanup...');

  // Clean up any global test artifacts
  if (global.indexedDB) {
    // Clear any test databases
    try {
      const databases = await global.indexedDB.databases?.();
      if (databases) {
        for (const db of databases) {
          if (db.name?.startsWith('test-')) {
            global.indexedDB.deleteDatabase(db.name);
          }
        }
      }
    } catch (error) {
      console.warn('Warning: Could not clean up IndexedDB test databases:', error);
    }
  }

  // Clean up localStorage and sessionStorage
  if (global.localStorage) {
    global.localStorage.clear();
  }
  
  if (global.sessionStorage) {
    global.sessionStorage.clear();
  }

  // Clean up any remaining timers
  jest.clearAllTimers();
  jest.clearAllMocks();

  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }

  // Clean up environment variables
  delete process.env.REACT_APP_API_URL;
  delete process.env.REACT_APP_ENV;

  console.log('✅ Test environment cleanup completed successfully\n');
}