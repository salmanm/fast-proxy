/* global describe, it */
'use strict'
const request = require('supertest')
const bodyParser = require('body-parser')
const { promisify } = require('util')
const { expect } = require('chai')

const sleep = promisify(setTimeout)

let gateway, service, close, proxy, gHttpServer

describe('undici', () => {
  it('init', async () => {
    const fastProxy = require('../index')({
      base: 'http://127.0.0.1:3000',
      undici: {
        pipelining: 10,
        requestTimeout: 100
      }
    })
    close = fastProxy.close
    proxy = fastProxy.proxy

    expect(proxy instanceof Function).to.equal(true)
    expect(close instanceof Function).to.equal(true)
  })

  it('init & start gateway', async () => {
    // init gateway
    gateway = require('restana')()
    gateway.use(bodyParser.json())
    gateway.all('/service/*', function (req, res) {
      proxy(req, res, req.url, {
        rewriteRequestHeaders (req, headers) {
          delete headers.connection

          return headers
        }
      })
    })

    gHttpServer = await gateway.start(8080)
  })

  it('init & start remote service', (done) => {
    // init remote service
    service = require('restana')({})
    service.use(bodyParser.json())

    service.get('/service/get', (req, res) => res.send('Hello World!'))
    service.post('/service/post', (req, res) => {
      res.send(req.body)
    })
    service.get('/service/headers', (req, res) => {
      res.setHeader('x-agent', 'fast-proxy')
      res.send(req.headers)
    })
    service.get('/service/timeout', async (req, res) => {
      await sleep(200)
      res.send()
    })

    service.start(3000).then(() => done())
  })

  it('should 200 on GET to valid remote endpoint', async () => {
    await request(gHttpServer)
      .get('/service/get')
      .expect(200)
  })

  it('should 200 on POST to valid remote endpoint', async () => {
    await request(gHttpServer)
      .post('/service/post')
      .set('Content-Type', 'application/json')
      .send({ name: 'john' })
      .expect(200)
      .then((res) => {
        expect(res.body.name).to.equal('john')
      })
  })

  it('should 200 on GET /service/headers', async () => {
    await request(gHttpServer)
      .get('/service/headers')
      .expect(200)
      .set('content-length', '10')
      .then((response) => {
        expect(response.headers['x-agent']).to.equal('fast-proxy')
        expect(response.body['content-length']).to.equal(undefined) // content-length is stripped for GET / HEAD requests
        expect(response.body.host).to.equal('127.0.0.1:3000')
      })
  })

  it('should 504 on GET /service/timeout', async () => {
    await request(gHttpServer)
      .get('/service/timeout')
      .expect(504)
  })

  it('close all', async () => {
    close()
    await gateway.close()
    await service.close()
  })
})
