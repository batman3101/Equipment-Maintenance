// Service Worker for CNC 설비 고장 관리 앱
const CACHE_VERSION = 'v1';
const STATIC_CACHE_NAME = `cnc-maintenance-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `cnc-maintenance-dynamic-${CACHE_VERSION}`;
const API_CACHE_NAME = `cnc-maintenance-api-${CACHE_VERSION}`;

// 캐시할 정적 자원들
const STATIC_ASSETS = [
  '/',
  '/login',
  '/breakdowns',
  '/equipment',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// API 엔드포인트 패턴
const API_PATTERNS = [
  /\/api\//,
  /supabase\.co/
];

// 설치 이벤트 - 정적 자원 캐시
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker 설치 중...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] 정적 자원 캐싱 중...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] 정적 자원 캐싱 완료');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] 정적 자원 캐싱 실패:', error);
      })
  );
});

// 활성화 이벤트 - 이전 캐시 정리
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker 활성화 중...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME && 
                cacheName !== API_CACHE_NAME) {
              console.log('[SW] 이전 캐시 삭제:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker 활성화 완료');
        return self.clients.claim();
      })
  );
});

// Fetch 이벤트 - 네트워크 요청 인터셉트
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // API 요청 처리
  if (isApiRequest(request)) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // 정적 자원 요청 처리
  if (request.method === 'GET') {
    event.respondWith(handleStaticRequest(request));
    return;
  }
});

// API 요청 확인
function isApiRequest(request) {
  return API_PATTERNS.some(pattern => pattern.test(request.url));
}

// API 요청 처리 - Network First 전략
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE_NAME);
  
  try {
    // 네트워크 우선 시도
    const networkResponse = await fetch(request);
    
    // 성공적인 응답만 캐시 (GET 요청만)
    if (request.method === 'GET' && networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] 네트워크 요청 실패, 캐시에서 조회:', request.url);
    
    // 네트워크 실패 시 캐시에서 조회
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // 캐시에도 없으면 오프라인 응답 반환
    return new Response(
      JSON.stringify({ 
        error: '오프라인 상태입니다. 네트워크 연결을 확인해주세요.',
        offline: true 
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// 정적 자원 요청 처리 - Cache First 전략
async function handleStaticRequest(request) {
  // 캐시 우선 조회
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    // 캐시에 없으면 네트워크에서 가져오기
    const networkResponse = await fetch(request);
    
    // 동적 캐시에 저장
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] 정적 자원 요청 실패:', request.url);
    
    // 오프라인 페이지 반환 (HTML 요청인 경우)
    if (request.headers.get('accept')?.includes('text/html')) {
      return caches.match('/') || new Response('오프라인 상태입니다.', {
        status: 503,
        statusText: 'Service Unavailable'
      });
    }
    
    throw error;
  }
}

// 백그라운드 동기화 이벤트
self.addEventListener('sync', (event) => {
  console.log('[SW] 백그라운드 동기화 이벤트:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

// 주기적 동기화 이벤트 (옵션)
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] 주기적 동기화 이벤트:', event.tag);
  
  if (event.tag === 'periodic-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

// 백그라운드 동기화 처리
async function handleBackgroundSync() {
  console.log('[SW] 백그라운드 동기화 실행 중...');
  
  try {
    // 동기화 대기열에서 데이터 조회
    const syncQueue = await getSyncQueue();
    console.log('[SW] 동기화 대기열 항목 수:', syncQueue.length);
    
    let syncedCount = 0;
    let failedCount = 0;
    
    for (const item of syncQueue) {
      try {
        await processSyncItem(item);
        await removeFromSyncQueue(item.id);
        syncedCount++;
        console.log('[SW] 동기화 성공:', item.id);
      } catch (error) {
        console.error('[SW] 동기화 실패:', item.id, error);
        failedCount++;
        
        // 재시도 횟수 증가
        await incrementRetryCount(item.id);
        
        // 최대 재시도 횟수 초과 시 대기열에서 제거
        if (item.retryCount >= item.maxRetries) {
          await removeFromSyncQueue(item.id);
          console.log('[SW] 최대 재시도 횟수 초과로 대기열에서 제거:', item.id);
        }
      }
    }
    
    // 오프라인 데이터 동기화
    const unsyncedData = await getUnsyncedOfflineData();
    console.log('[SW] 동기화되지 않은 데이터 수:', unsyncedData.length);
    
    for (const data of unsyncedData) {
      try {
        await syncOfflineDataToServer(data);
        await markOfflineDataAsSynced(data.id);
        syncedCount++;
        console.log('[SW] 오프라인 데이터 동기화 성공:', data.id);
      } catch (error) {
        console.error('[SW] 오프라인 데이터 동기화 실패:', data.id, error);
        failedCount++;
      }
    }
    
    // 클라이언트에 동기화 결과 알림
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        data: {
          syncedCount,
          failedCount,
          timestamp: Date.now()
        }
      });
    });
    
    console.log('[SW] 백그라운드 동기화 완료 - 성공:', syncedCount, '실패:', failedCount);
    
  } catch (error) {
    console.error('[SW] 백그라운드 동기화 오류:', error);
    
    // 클라이언트에 오류 알림
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_ERROR',
        data: {
          error: error.message,
          timestamp: Date.now()
        }
      });
    });
  }
}
// 동기화 대기열 조회
async function getSyncQueue() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('cnc-maintenance-offline', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['sync-queue'], 'readonly');
      const store = transaction.objectStore('sync-queue');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result || []);
      };
      
      getAllRequest.onerror = () => {
        reject(getAllRequest.error);
      };
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}

// 동기화 항목 처리
async function processSyncItem(item) {
  const response = await fetch(item.url, {
    method: item.method,
    headers: item.headers,
    body: item.body
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

// 동기화 대기열에서 제거
async function removeFromSyncQueue(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('cnc-maintenance-offline', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['sync-queue'], 'readwrite');
      const store = transaction.objectStore('sync-queue');
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => {
        resolve();
      };
      
      deleteRequest.onerror = () => {
        reject(deleteRequest.error);
      };
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}

// 재시도 횟수 증가
async function incrementRetryCount(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('cnc-maintenance-offline', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['sync-queue'], 'readwrite');
      const store = transaction.objectStore('sync-queue');
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          item.retryCount += 1;
          const putRequest = store.put(item);
          
          putRequest.onsuccess = () => {
            resolve();
          };
          
          putRequest.onerror = () => {
            reject(putRequest.error);
          };
        } else {
          reject(new Error('동기화 항목을 찾을 수 없습니다'));
        }
      };

      getRequest.onerror = () => {
        reject(getRequest.error);
      };
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}

// 동기화되지 않은 오프라인 데이터 조회
async function getUnsyncedOfflineData() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('cnc-maintenance-offline', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['offline-data'], 'readonly');
      const store = transaction.objectStore('offline-data');
      const index = store.index('synced');
      
      const unsyncedData = [];
      const cursorRequest = index.openCursor();
      
      cursorRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const data = cursor.value;
          if (!data.synced) {
            unsyncedData.push(data);
          }
          cursor.continue();
        } else {
          resolve(unsyncedData);
        }
      };
      
      cursorRequest.onerror = () => {
        reject(cursorRequest.error);
      };
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}

// 오프라인 데이터를 서버로 동기화
async function syncOfflineDataToServer(data) {
  let url, method, body;

  // 데이터 타입과 액션에 따라 API 엔드포인트 결정
  switch (data.type) {
    case 'breakdown':
      url = data.action === 'create' ? '/api/breakdowns' : `/api/breakdowns/${data.data.id}`;
      method = data.action === 'create' ? 'POST' : data.action === 'update' ? 'PUT' : 'DELETE';
      body = data.action !== 'delete' ? JSON.stringify(data.data) : undefined;
      break;

    case 'repair':
      url = data.action === 'create' ? '/api/repairs' : `/api/repairs/${data.data.id}`;
      method = data.action === 'create' ? 'POST' : data.action === 'update' ? 'PUT' : 'DELETE';
      body = data.action !== 'delete' ? JSON.stringify(data.data) : undefined;
      break;

    case 'equipment':
      url = data.action === 'create' ? '/api/equipment' : `/api/equipment/${data.data.id}`;
      method = data.action === 'create' ? 'POST' : data.action === 'update' ? 'PUT' : 'DELETE';
      body = data.action !== 'delete' ? JSON.stringify(data.data) : undefined;
      break;

    default:
      throw new Error(`지원하지 않는 데이터 타입: ${data.type}`);
  }

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    body
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// 오프라인 데이터를 동기화 완료로 표시
async function markOfflineDataAsSynced(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('cnc-maintenance-offline', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['offline-data'], 'readwrite');
      const store = transaction.objectStore('offline-data');
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const data = getRequest.result;
        if (data) {
          data.synced = true;
          const putRequest = store.put(data);
          
          putRequest.onsuccess = () => {
            resolve();
          };
          
          putRequest.onerror = () => {
            reject(putRequest.error);
          };
        } else {
          reject(new Error('오프라인 데이터를 찾을 수 없습니다'));
        }
      };

      getRequest.onerror = () => {
        reject(getRequest.error);
      };
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}

// 푸시 알림 이벤트
self.addEventListener('push', (event) => {
  console.log('[SW] 푸시 알림 수신:', event);
  
  const options = {
    body: event.data ? event.data.text() : '새로운 알림이 있습니다.',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '확인',
        icon: '/icon-192x192.png'
      },
      {
        action: 'close',
        title: '닫기',
        icon: '/icon-192x192.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('CNC 설비 관리', options)
  );
});

// 알림 클릭 이벤트
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] 알림 클릭:', event);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// 메시지 이벤트 - 클라이언트와 통신
self.addEventListener('message', (event) => {
  console.log('[SW] 메시지 수신:', event.data);
  
  if (!event.data || !event.data.type) return;
  
  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'SYNC_NOW':
      // 즉시 동기화 요청
      handleBackgroundSync().then(() => {
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: true });
        }
      }).catch((error) => {
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: false, error: error.message });
        }
      });
      break;
      
    case 'SYNC_START':
      // 동기화 시작 알림
      notifyClients({
        type: 'SYNC_START',
        data: event.data.data || { timestamp: Date.now() }
      });
      break;
      
    case 'SYNC_PROGRESS':
      // 동기화 진행 상황 알림
      notifyClients({
        type: 'SYNC_PROGRESS',
        data: event.data.data
      });
      break;
      
    case 'SYNC_COMPLETE':
      // 동기화 완료 알림
      notifyClients({
        type: 'SYNC_COMPLETE',
        data: event.data.data
      });
      break;
      
    case 'SYNC_ITEM_FAILED':
      // 개별 항목 동기화 실패 알림
      notifyClients({
        type: 'SYNC_ITEM_FAILED',
        data: event.data.data
      });
      break;
      
    case 'CHECK_PENDING_SYNC':
      // 대기 중인 동기화 항목 확인 요청
      checkPendingSyncItems().then(result => {
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage(result);
        }
      }).catch(error => {
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ error: error.message });
        }
      });
      break;
  }
});

// 모든 클라이언트에 메시지 전송
async function notifyClients(message) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage(message);
  });
}

// 대기 중인 동기화 항목 확인
async function checkPendingSyncItems() {
  try {
    const [syncQueue, unsyncedData] = await Promise.all([
      getSyncQueue(),
      getUnsyncedOfflineData()
    ]);
    
    return {
      pendingCount: syncQueue.length + unsyncedData.length,
      syncQueueCount: syncQueue.length,
      unsyncedDataCount: unsyncedData.length
    };
  } catch (error) {
    console.error('[SW] 대기 중인 동기화 항목 확인 실패:', error);
    throw error;
  }
}