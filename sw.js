/* 校园导览 Service Worker - 离线缓存 */
var CACHE = 'upc-guide-v1.19';
var ASSETS = [
  './',
  './index.html',
  './中国石油大学华东校园导览.html',
  './lib/leaflet.css',
  './lib/leaflet.js',
  './lib/images/layers.png',
  './lib/images/layers-2x.png',
  './lib/images/marker-icon.png',
  './lib/images/marker-icon-2x.png',
  './lib/images/marker-shadow.png',
  './images/emblem.png',
  './images/icon-180.png',
  './images/icon-192.png',
  './images/icon-512.png',
  './images/icon-maskable-512.png',
  './images/chuangzao.jpg',
  './images/gz-aerial.jpg',
  './images/gz-gym.jpg',
  './images/gz-hospital.jpg',
  './images/gz-library.jpg',
  './images/gz-news-1.jpg',
  './images/gz-news-2.jpg',
  './images/gz-news-3.jpg',
  './images/gz-teaching.jpg',
  './images/gz-weizhen-weishi.jpg'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  // 外部资源（地图瓦片/高德API）不缓存
  if (url.origin !== location.origin) return;
  if (req.mode === 'navigate') {
    // 网络优先：每次打开都拉取最新页面，离线时才回退缓存
    e.respondWith(
      fetch(req, { cache: 'no-store' }).then(function (res) {
        if (res && res.status === 200) {
          var cp = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, cp); });
        }
        return res;
      }).catch(function () {
        return caches.match(req).then(function (r) { return r || caches.match('./index.html'); });
      })
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(function (r) {
      return r || fetch(req).then(function (res) {
        if (res && res.status === 200) {
          var cp = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, cp); });
        }
        return res;
      }).catch(function () { return caches.match('./index.html'); });
    })
  );
});
