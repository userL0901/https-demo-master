var VERSION = 'v1';

// 缓存
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(VERSION).then(function(cache) {
      return cache.addAll([
        './start.html',
        './static/jquery.min.js',
        './static/mm1.jpg'
      ]);
    })
  );
});

// 缓存更新
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          // 如果当前版本和缓存版本不一致
          if (cacheName !== VERSION) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 捕获请求并返回缓存数据
// self.addEventListener('fetch', function(event) {
//     event.respondWith(caches.match(event.request).catch(function() {
//         return fetch(event.request);
//     }).then(function(response) {
//         caches.open(VERSION).then(function(cache) {
//             cache.put(event.request, response);
//         });
//         return response.clone();
//     }).catch(function() {
//         return caches.match('./static/mm1.jpg');
//     }));
// });
self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                // 缓存命中
                if (response) {
                    return response;
                }

                // 注意，这里必须使用clone方法克隆这个请求
                // 原因是response是一个Stream，为了让浏览器跟缓存都使用这个response
                // 必须克隆这个response，一份到浏览器，一份到缓存中缓存。
                // 只能被消费一次，想要再次消费，必须clone一次
                var fetchRequest = event.request.clone();

                return fetch(fetchRequest).then(
                    function(response) {
                        // 必须是有效请求，必须是同源响应，第三方的请求，因为不可控，最好不要缓存
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // 消费过一次，又需要再克隆一次
                        var responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(function(cache) {
                                cache.put(event.request, responseToCache);
                            });
                        return response;
                    }
                );
            })
    );
});