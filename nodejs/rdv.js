'use strict'

const dgram = require('dgram')

const port = process.argv[2] || 4653
const sockfd = dgram.createSocket('udp4')

let connections = {}

let poolqueue = {}

sockfd.on('message', (buf, rinfo) => {
  const msg = buf.toString('utf8')

  if (msg === 'ok') {
    const pool = connections[`${rinfo.address}:${rinfo.port}`]
    console.log(`request received for pool: ${pool}`)
    if (poolqueue[pool]) {
      const a = {address: poolqueue[pool].address, port: poolqueue[pool].port}
      const b = {address: rinfo.address, port: rinfo.port}

      sockfd.send(Buffer.from(JSON.stringify(a)), b.port, b.address, (err) => {
        if (err) {
          console.error(`error sending '${JSON.stringify(a)}' to ${b.address}:${b.port}`)
        } else {
          console.log(`ok sending '${JSON.stringify(a)}' to ${b.address}:${b.port}`)
        }
      })

      sockfd.send(Buffer.from(JSON.stringify(b)), a.port, a.address, (err) => {
        if (err) {
          console.error(`error sending '${JSON.stringify(b)}' to ${a.address}:${a.port}`)
        } else {
          console.error(`ok sending '${JSON.stringify(a)}' to ${b.address}:${b.port}`)
        }
      })

      console.log(`linked ${pool}`)
      delete poolqueue[pool]
    } else {
      poolqueue[pool] = rinfo
      delete connections[`${rinfo.address}:${rinfo.port}`]
    }
  } else {
    console.log(`connection from ${rinfo.address}:${rinfo.port}`)

    const pool = msg.replace(/ /g, '').replace(/\s/g, '')

    sockfd.send(Buffer.from(`ok ${pool}`), rinfo.port, rinfo.address, (err) => {
      if (err) {
        console.error(`error sending 'ok ${pool}' to ${rinfo.address}:${rinfo.port}`)
      } else {
        console.log(`ok sending 'ok ${pool}' to ${rinfo.address}:${rinfo.port}`)
        connections[`${rinfo.address}:${rinfo.port}`] = pool
      }
    })
  }
})

sockfd.bind(port, () => {
  console.log(`listening on *:${port} (udp)`)
})
