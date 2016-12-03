#!/usr/bin/env python

# RDV Server

import socket
import struct
import sys

def addr2bytes( addr ):
    """Convert an address pair to a hash."""
    host, port = addr
    try:
        host = socket.gethostbyname( host )
    except (socket.gaierror, socket.error):
        raise ValueError, 'invalid host'
    try:
        port = int(port)
    except ValueError:
        raise ValueError, 'invalid port'
    bytes  = socket.inet_aton( host )
    bytes += struct.pack( 'H', port )
    return bytes

def main():
    port = 4653
    try:
        port = int(sys.argv[1])
    except (IndexError, ValueError):
        pass

    sockfd = socket.socket( socket.AF_INET, socket.SOCK_DGRAM )
    sockfd.bind( ('', port) )
    print 'listening on *:%d (udp)' % port

    poolqueue = {}
    while True:
        data, addr = sockfd.recvfrom(32)
        print 'connection from %s:%d' % addr

        pool = data.strip()
        sockfd.sendto( 'ok '+pool, addr )
        data, addr = sockfd.recvfrom(2)
        if data != 'ok':
            continue

        print 'request received for pool:', pool

        try:
            a, b = poolqueue[pool], addr
            sockfd.sendto( addr2bytes(a), b )
            sockfd.sendto( addr2bytes(b), a )
            print 'linked', pool
            del poolqueue[pool]
        except KeyError:
            poolqueue[pool] = addr

if __name__ == '__main__':
    main()

# vim: expandtab shiftwidth=4 softtabstop=4 textwidth=79:
