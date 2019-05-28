# fast-proxy
Node.js framework agnostic library that enables you to forward an http request to another HTTP server. 
Supported protocols: HTTP, HTTPS, HTTP2

> This library forked from `fastify-reply-from`: https://github.com/fastify/fastify-reply-from

`req-proxy` powers: https://www.npmjs.com/package/fast-gateway 🚀 
## Install
```
npm i fast-proxy
```

## Usage
The following examples describe how to use `fast-proxy` with `restana`:

Gateway:
```js
const { proxy, close } = require('fast-proxy')({
  base: 'http://127.0.0.1:3000'
  // options
})
const gateway = require('restana')()

gateway.all('/service/*', function (req, res) {
  proxy(req, res, req.url, {})
})

gateway.start(8080)
```

Remote service:
```js
const service = require('restana')()
service.get('/service/hi', (req, res) => res.send('Hello World!'))

service.start(3000)
```
## Benchmarks
Benchmark scripts can be found in `benchmark` folder.
> `fast-proxy` is fast with F
```bash
wrk -t8 -c50 -d20s http://127.0.0.1:8080/service/hi
```
- **fast-proxy-undici/0http**: Requests/sec **19014.13** (HTTP pipelining = 10)
- **fast-proxy/0http**: Requests/sec **17791.10**
- **fast-proxy/restana**: Requests/sec **17013.53**
- **fast-proxy-undici/0http**: Requests/sec 15320.76 (HTTP pipelining = 1)
- **fastify-reply-from**: Requests/sec 12056.81
- **http-proxy**: Requests/sec 408.97

## API

### Options
#### `base`
Set the base URL for all the forwarded requests. Will be required if `http2` is set to `true`
Note that _path will be discarded_.

#### http2
Set to `true` if target server is `http2` enabled.

#### undici
Set to `true` to use [undici](https://github.com/mcollina/undici)
instead of `require('http')`. Enabling this flag should guarantee
20-50% more throughput.

This flag could controls the settings of the undici client, like so:

```js
...
  base: 'http://localhost:3001/',
  undici: {
    connections: 100,
    pipelining: 10
  }
...
```

#### cacheURLs
The number of parsed URLs that will be cached. Default: 100.

#### keepAliveMsecs
Defaults to 1 minute, passed down to [`http.Agent`][http-agent] and
[`https.Agent`][https-agent] instances.

#### maxSockets
Defaults to 2048 sockets, passed down to [`http.Agent`][http-agent] and
[`https.Agent`][https-agent] instances.

#### rejectUnauthorized
Defaults to `true`, passed down to [`https.Agent`][https-agent] instances.
This needs to be set to `false` to reply from https servers with
self-signed certificates.

---

### close
Optional _"on `close` resource release"_ strategy. You can link this to your application shutdown hook as an example.

### proxy(originReq, originRes, source, [opts])
Enables you to forward an http request to another HTTP server.
```js
proxy(
  originReq,                          // http.IncomingMessage 
  originRes,                          // http.ServerResponse
  req.url,                            // String -> remote URL + path or path if base was set
  {}                                  // Options described below
)
```
#### opts
##### onResponse(req, res, stream)
Called when an http response is received from the source.
The default behavior is `pump(stream, res)`, which will be disabled if the
option is specified.

##### rewriteHeaders(headers)
Called to rewrite the headers of the response, before them being copied
over to the outer response.
It must return the new headers object.

##### queryString
Replaces the original querystring of the request with what is specified.
This will get passed to
[`querystring.stringify`](https://nodejs.org/api/querystring.html#querystring_querystring_stringify_obj_sep_eq_options).

## Related topics
- http-agent: https://nodejs.org/api/http.html#http_new_agent_options
- https-agent: https://nodejs.org/api/https.html#https_class_https_agent

## Contributions 
Special thanks to `fastify-reply-from` developers for creating a production ready library that we could initially fork.

## License
MIT