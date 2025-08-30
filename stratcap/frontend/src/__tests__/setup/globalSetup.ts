import { GlobalConfig } from '@jest/types';
import path from 'path';

export default async function globalSetup(globalConfig: GlobalConfig): Promise<void> {
  console.log('🚀 Starting test environment setup...\n');

  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.REACT_APP_API_URL = 'http://localhost:3001/api';
  process.env.REACT_APP_ENV = 'test';
  
  // Mock crypto for Node.js environment
  const { webcrypto } = await import('crypto');
  if (!global.crypto) {
    global.crypto = webcrypto as any;
  }

  // Setup performance timing mock
  if (!global.performance) {
    global.performance = {
      now: () => Date.now(),
      mark: () => {},
      measure: () => {},
      getEntriesByName: () => [],
      getEntriesByType: () => [],
      clearMarks: () => {},
      clearMeasures: () => {},
    } as any;
  }

  // Setup IndexedDB mock for browser storage testing
  const FDBFactory = require('fake-indexeddb/lib/FDBFactory');
  const FDBKeyRange = require('fake-indexeddb/lib/FDBKeyRange');
  
  global.indexedDB = new FDBFactory();
  global.IDBKeyRange = FDBKeyRange;

  // Setup Canvas mock for chart testing
  const createCanvas = () => ({
    getContext: () => ({
      fillRect: () => {},
      clearRect: () => {},
      getImageData: (x: number, y: number, w: number, h: number) => ({
        data: new Uint8ClampedArray(w * h * 4)
      }),
      putImageData: () => {},
      createImageData: () => [],
      setTransform: () => {},
      drawImage: () => {},
      save: () => {},
      fillText: () => {},
      restore: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      stroke: () => {},
      translate: () => {},
      scale: () => {},
      rotate: () => {},
      arc: () => {},
      fill: () => {},
      measureText: () => ({ width: 0 }),
      transform: () => {},
      rect: () => {},
      clip: () => {},
    }),
    toDataURL: () => '',
    addEventListener: () => {},
  });

  global.HTMLCanvasElement.prototype.getContext = createCanvas().getContext as any;
  global.HTMLCanvasElement.prototype.toDataURL = createCanvas().toDataURL as any;

  // Setup File and FileReader mocks
  global.File = class MockFile {
    name: string;
    type: string;
    size: number;
    lastModified: number;

    constructor(bits: any[], filename: string, options: any = {}) {
      this.name = filename;
      this.type = options.type || '';
      this.size = bits.reduce((acc, bit) => acc + (bit.length || 0), 0);
      this.lastModified = Date.now();
    }
  } as any;

  global.FileReader = class MockFileReader {
    result: any = null;
    error: any = null;
    readyState: number = 0;
    onload: any = null;
    onerror: any = null;
    onloadend: any = null;

    readAsDataURL(file: any) {
      this.readyState = 2;
      this.result = 'data:text/plain;base64,dGVzdA==';
      if (this.onload) this.onload();
      if (this.onloadend) this.onloadend();
    }

    readAsText(file: any) {
      this.readyState = 2;
      this.result = 'test content';
      if (this.onload) this.onload();
      if (this.onloadend) this.onloadend();
    }

    addEventListener(event: string, handler: any) {
      if (event === 'load') this.onload = handler;
      if (event === 'error') this.onerror = handler;
      if (event === 'loadend') this.onloadend = handler;
    }
  } as any;

  // Setup Blob mock
  global.Blob = class MockBlob {
    size: number;
    type: string;

    constructor(parts: any[] = [], options: any = {}) {
      this.size = parts.reduce((acc, part) => acc + (part.length || 0), 0);
      this.type = options.type || '';
    }
  } as any;

  // Setup URL mock for file handling
  global.URL = {
    createObjectURL: () => 'mock-url',
    revokeObjectURL: () => {},
  } as any;

  // Setup clipboard API mock
  global.navigator.clipboard = {
    writeText: jest.fn().mockResolvedValue(undefined),
    readText: jest.fn().mockResolvedValue(''),
    write: jest.fn().mockResolvedValue(undefined),
    read: jest.fn().mockResolvedValue([]),
  } as any;

  // Setup geolocation API mock
  global.navigator.geolocation = {
    getCurrentPosition: jest.fn(),
    watchPosition: jest.fn(),
    clearWatch: jest.fn(),
  };

  // Setup notification API mock
  global.Notification = class MockNotification {
    static permission = 'granted';
    static requestPermission = jest.fn().mockResolvedValue('granted');
    
    constructor(title: string, options?: any) {}
    
    close = jest.fn();
  } as any;

  console.log('✅ Global test setup completed successfully\n');
}