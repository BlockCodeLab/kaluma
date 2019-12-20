var EventEmitter = require('events').EventEmitter;
var stream = require('stream');

if (!global.__netdev) {
  throw new Error('Network device not found');
}

/**
 * Socket class
 */
class Socket extends stream.Duplex {
  constructor () {
    super();
    this.localAddress = null;
    this.localPort = null;
    this.remoteAddress = null;
    this.remotePort = null;    
    this._dev = global.__netdev;
    this._fd = -1;
  }
  
  _socket (fd) {
    this._fd = fd;
    var sck = this._dev.get(this._fd);
    if (sck) {
      this.localAddress = sck.laddr;
      this.localPort = sck.lport;
      this.remoteAddress = sck.raddr;
      this.remotePort = sck.rport;      
      sck.connect_cb = () => {
        this.localAddress = sck.laddr;
        this.localPort = sck.lport;
        this.remoteAddress = sck.raddr;
        this.remotePort = sck.rport;
        this.emit('connect');
        this.emit('ready');        
      }
      sck.close_cb = () => { this._afterDestroy() }
      sck.read_cb = (data) => { this.push(data) }
      sck.shutdown_cb = () => { this._afterEnd() }
    }
  }

  /**
   * Initiates a connection
   * @param {object} options
   *   .host {string}
   *   .port {number}
   * @param {function} connectListener
   * @return {Socket}
   */
  connect (options, connectListener) {
    var fd = this._dev.socket(null, 'STREAM');    
    if (connectListener) {
      this.on('connect', connectListener);
    }
    if (fd > -1) {
      this._socket(fd);
      this._dev.connect(this._fd, options.host, options.port, (err) => {
        if (err) {
          this.emit('error', new SystemError(this._dev.errno));
        }
      });
    }
    return this;
  }

  /**
   * @override
   * Destroy the connection
   * @param {function} cb
   */
  _doDestroy(cb) {
    this._dev.close(this._fd, (err) => {
      if (err) {
        if (cb) cb(new SystemError(this._dev.errno));
      } else {
        if (cb) cb();
      }
    })
  }
  
  /**
   * @override
   * Write data to the stream
   * 
   * @param {string} chunk
   * @param {function} cb
   */
  _doWrite (chunk, cb) {
    this._dev.write(this._fd, chunk, (err) => {
      if (err) {
        if (cb) cb(new SystemError(this._dev.errno)); // eslint-disable-line
      } else {
        if (cb) cb();
      }
    });
  }

  /**
   * @override
   * Signal finish to write data
   * 
   * @param {function} cb
   */
  _doFinish (cb) {
    this._dev.shutdown(this._fd, 1, (err) => {
      if (err) {
        if (cb) cb(new SystemError(this._dev.errno)); // eslint-disable-line
      } else {
        if (cb) cb();
      }
    })
  }
}

/**
 * Server class
 */
class Server extends EventEmitter {
  constructor (options, connectionListener) {
    super();
    if (typeof options === 'function') {
      connectionListener = options;
      options = undefined;
    }
    if (connectionListener) {
      this.on('connection', connectionListener);
    }    
    this._dev = global.__netdev;
    this._fd = -1;
  }
  
  /**
   * Listen incoming connections
   * @param {number} port
   * @param {function} callback
   * @return {this}
   */
  listen (port, callback) {
    this._fd = this._dev.socket(null, 'STREAM');
    if (this._fd < 0) {
      this.emit('error', new SystemError(this._dev.errno));
      return;
    } else {
      var sck = this._dev.get(this._fd);
      sck.accept_cb = (fd) => {
        var client = new Socket();
        client._socket(fd);
        this.emit('connection', client);
      }
    }
    this._dev.bind(this._fd, '127.0.0.1', port, (err) => {
      if (err) {
        this.emit('error', new SystemError(this._dev.errno));
      } else {
        this._dev.listen(this._fd, (err) => {
          if (err) {
            this.emit('error', new SystemError(this._dev.errno));
          } else {
            if (callback) this.on('listening', callback);
            this.emit('listening');
          }
        })
      }
    });
    return this;
  }

  /**
   * Close server
   * @param {function} callback
   * @return {this}
   */
  close (callback) {
    this._dev.close(this._fd, (err) => {
      if (err) {
        this.emit('error', new SystemError(this._dev.errno))
      } else {
        this.emit('close');
        if (callback) callback();
      }
    });
    return this;
  }
}

exports.Socket = Socket;
exports.Server = Server;

/**
 * Create a socket and initiate connection
 * @param {object} options
 * @param {function} connectListener
 */
exports.createConnection = function (options, connectListener) {
  var client = new Socket();
  if (connectListener) {
    client.connect(options, connectListener);
  }
  return client;
}

exports.connect = exports.createConnection;

/**
 * Create a server
 * @param {object} options
 * @param {function} connectionListener
 */
exports.createServer = function (options, connectionListener) {
  var server = new Server(options, connectionListener);
  return server;
}