'use strict'

const dgram = require('dgram')

if (!process.argv[2] || !process.argv[3] || !process.argv[4]) {
  console.log(`usage: node ${process.argv[1]} <host> <port> <pool>`)
  process.exit(65)
}

const master = {}
master.address = process.argv[2]
master.port = Number.parseInt(process.argv[3])

const pool = process.argv[4].replace(/ /g, '').replace(/\s/g, '')

const sockfd = dgram.createSocket('udp4')

let okPool = false

let target = null

sockfd.on('message', (buf, rinfo) => {
  const msg = buf.toString('utf8')

  if (msg === `ok ${pool}`) {
    okPool = true
    sockfd.send(Buffer.from('ok'), master.port, master.address, (err) => {
      if (err) {
        console.error(`error sending 'ok' to ${master.address}:${master.port}`)
        process.exit(1)
      } else {
        console.log(`request sent, waiting for another peer to join pool '${pool}'...`)
      }
    })
  } else if (msg !== `ok ${pool}` && !okPool) {
    console.error('unable to request!')
  } else if (!target) {
    // RECEIVING ADDRESS
    target = JSON.parse(msg)
    console.log(`connected to ${target.address}:${target.port} (udp)`)

    process.stdin.on('data', (chunk) => {
      sockfd.send(chunk, target.port, target.address)
    })
  } else {
    console.log(`msg from peer ${rinfo.address}:${rinfo.port} - ${msg}`)

    // HACK FOR SYMMETRIC NAT - ONLY WORKS IF ONE NAT IS SYMMETRIC AND ONE IS ASYMMETRIC
    if (rinfo.port !== target.port) {
      console.log('Symmetric NAT detected, updating target.port')
      target.port = rinfo.port
    }
  }
})

sockfd.send(Buffer.from(pool), master.port, master.address, (err) => {
  if (err) {
    console.error(`error sending '${pool}' to ${master.address}:${master.port}`)
    process.exit(1)
  }
})
