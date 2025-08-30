/**
 * Jest Polyfills for testing environment
 * These polyfills ensure compatibility between Node.js test environment and browser APIs
 */

// Polyfill for TextEncoder/TextDecoder
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Polyfill for AbortController
import { AbortController } from 'node-abort-controller';
global.AbortController = AbortController as any;

// Polyfill for structuredClone
if (!global.structuredClone) {
  global.structuredClone = (obj: any) => {
    return JSON.parse(JSON.stringify(obj));
  };
}

// Polyfill for queueMicrotask
if (!global.queueMicrotask) {
  global.queueMicrotask = (callback: () => void) => {
    Promise.resolve().then(callback);
  };
}

// Polyfill for MessageChannel
if (!global.MessageChannel) {
  global.MessageChannel = class MessageChannel {
    port1: MessagePort;
    port2: MessagePort;

    constructor() {
      this.port1 = new MessagePort();
      this.port2 = new MessagePort();
    }
  } as any;
}

// Polyfill for MessagePort
if (!global.MessagePort) {
  global.MessagePort = class MessagePort {
    onmessage: ((event: MessageEvent) => void) | null = null;
    onmessageerror: ((event: MessageEvent) => void) | null = null;

    postMessage(message: any, transfer?: any[]) {
      // Mock implementation
    }

    start() {
      // Mock implementation
    }

    close() {
      // Mock implementation
    }

    addEventListener(type: string, listener: any) {
      // Mock implementation
    }

    removeEventListener(type: string, listener: any) {
      // Mock implementation
    }

    dispatchEvent(event: Event) {
      return true;
    }
  } as any;
}

// Polyfill for CustomEvent
if (!global.CustomEvent) {
  global.CustomEvent = class CustomEvent extends Event {
    detail: any;

    constructor(event: string, params?: { bubbles?: boolean; cancelable?: boolean; detail?: any }) {
      super(event, params);
      this.detail = params?.detail;
    }
  } as any;
}

// Polyfill for DOMParser
if (!global.DOMParser) {
  global.DOMParser = class DOMParser {
    parseFromString(str: string, type: string) {
      // Mock implementation - returns a simple object
      return {
        documentElement: {
          textContent: str,
          querySelector: () => null,
          querySelectorAll: () => [],
        },
        querySelector: () => null,
        querySelectorAll: () => [],
      };
    }
  } as any;
}

// Polyfill for XMLSerializer
if (!global.XMLSerializer) {
  global.XMLSerializer = class XMLSerializer {
    serializeToString(node: any) {
      return node.toString();
    }
  } as any;
}

// Polyfill for Request/Response for fetch API
if (!global.Request) {
  global.Request = class Request {
    url: string;
    method: string;
    headers: Headers;
    body: any;

    constructor(input: string | Request, init?: RequestInit) {
      this.url = typeof input === 'string' ? input : input.url;
      this.method = init?.method || 'GET';
      this.headers = new Headers(init?.headers);
      this.body = init?.body;
    }
  } as any;
}

if (!global.Response) {
  global.Response = class Response {
    ok: boolean = true;
    status: number = 200;
    statusText: string = 'OK';
    headers: Headers;
    body: any;

    constructor(body?: any, init?: ResponseInit) {
      this.body = body;
      this.status = init?.status || 200;
      this.statusText = init?.statusText || 'OK';
      this.ok = this.status >= 200 && this.status < 300;
      this.headers = new Headers(init?.headers);
    }

    async json() {
      return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
    }

    async text() {
      return typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
    }

    async blob() {
      return new Blob([this.body]);
    }

    async arrayBuffer() {
      return new ArrayBuffer(0);
    }

    clone() {
      return new Response(this.body, {
        status: this.status,
        statusText: this.statusText,
        headers: this.headers,
      });
    }
  } as any;
}

if (!global.Headers) {
  global.Headers = class Headers {
    private map = new Map<string, string>();

    constructor(init?: HeadersInit) {
      if (init) {
        if (Array.isArray(init)) {
          init.forEach(([key, value]) => {
            this.set(key, value);
          });
        } else if (init instanceof Headers) {
          init.forEach((value, key) => {
            this.set(key, value);
          });
        } else {
          Object.entries(init).forEach(([key, value]) => {
            this.set(key, value);
          });
        }
      }
    }

    append(name: string, value: string) {
      const existing = this.map.get(name.toLowerCase());
      this.map.set(name.toLowerCase(), existing ? `${existing}, ${value}` : value);
    }

    delete(name: string) {
      this.map.delete(name.toLowerCase());
    }

    get(name: string) {
      return this.map.get(name.toLowerCase()) || null;
    }

    has(name: string) {
      return this.map.has(name.toLowerCase());
    }

    set(name: string, value: string) {
      this.map.set(name.toLowerCase(), value);
    }

    forEach(callback: (value: string, key: string, parent: Headers) => void) {
      this.map.forEach((value, key) => {
        callback(value, key, this);
      });
    }

    keys() {
      return this.map.keys();
    }

    values() {
      return this.map.values();
    }

    entries() {
      return this.map.entries();
    }

    [Symbol.iterator]() {
      return this.map.entries();
    }
  } as any;
}

// Polyfill for FormData
if (!global.FormData) {
  global.FormData = class FormData {
    private data = new Map<string, any>();

    append(name: string, value: any, filename?: string) {
      if (this.data.has(name)) {
        const existing = this.data.get(name);
        this.data.set(name, Array.isArray(existing) ? [...existing, value] : [existing, value]);
      } else {
        this.data.set(name, value);
      }
    }

    delete(name: string) {
      this.data.delete(name);
    }

    get(name: string) {
      const value = this.data.get(name);
      return Array.isArray(value) ? value[0] : value;
    }

    getAll(name: string) {
      const value = this.data.get(name);
      return Array.isArray(value) ? value : [value];
    }

    has(name: string) {
      return this.data.has(name);
    }

    set(name: string, value: any, filename?: string) {
      this.data.set(name, value);
    }

    forEach(callback: (value: any, key: string, parent: FormData) => void) {
      this.data.forEach((value, key) => {
        callback(value, key, this);
      });
    }

    keys() {
      return this.data.keys();
    }

    values() {
      return this.data.values();
    }

    entries() {
      return this.data.entries();
    }

    [Symbol.iterator]() {
      return this.data.entries();
    }
  } as any;
}

console.log('✅ Jest polyfills loaded successfully');