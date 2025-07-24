// 서비스 워커 비활성화
self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// 모든 fetch 요청을 그대로 통과시킴
self.addEventListener('fetch', function(event) {
  // 아무것도 하지 않음 - 네트워크 요청을 그대로 통과
});