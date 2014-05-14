var common     = exports;
var crypto     = require('crypto');
var fs         = require('fs');
var path       = require('path');
var tls        = require('tls');
var _          = require('underscore');
var FakeServer = require('./FakeServer');

common.lib      = path.join(__dirname, '../lib');
common.fixtures = path.join(__dirname, 'fixtures');

// Useful for triggering ECONNREFUSED errors on connect()
common.bogusPort     = 47378;
// Useful for triggering ER_ACCESS_DENIED_ERROR errors on connect()
common.bogusPassword = 'INVALID PASSWORD';

// Used for simulating a fake mysql server
common.fakeServerPort = 32893;
// Used for simulating a fake mysql server
common.fakeServerSocket = __dirname + '/fake_server.sock';

common.testDatabase = process.env.MYSQL_DATABASE;

var Mysql = require('../');

common.isTravis = function() {
  return Boolean(process.env.CI);
};

common.createConnection = function(config) {
  config = mergeTestConfig(config);
  return Mysql.createConnection(config);
};

common.createPool = function(config) {
  config = mergeTestConfig(config);
  config.connectionConfig = mergeTestConfig(config.connectionConfig);
  return Mysql.createPool(config);
};

common.createPoolCluster = function(config) {
  config = mergeTestConfig(config);
  config.createConnection = common.createConnection;
  return Mysql.createPoolCluster(config);
};

common.createFakeServer = function(options) {
  return new FakeServer(_.extend({}, options));
};

common.createSecurePair = function() {
  var credentials = crypto.createCredentials(common.getSSLConfig());

  return tls.createSecurePair(credentials, true);
};

common.useTestDb = function(connection) {
  var query = connection.query('CREATE DATABASE ' + common.testDatabase, function(err) {
    if (err && err.code !== 'ER_DB_CREATE_EXISTS') throw err;
  });

  connection.query('USE ' + common.testDatabase);
};

common.getTestConfig = function(config) {
  return mergeTestConfig(config);
};

common.getSSLConfig = function() {
  return {
    cert : fs.readFileSync(path.join(common.fixtures, 'server.crt'), 'ascii'),
    key  : fs.readFileSync(path.join(common.fixtures, 'server.key'), 'ascii')
  };
};

function mergeTestConfig(config) {
  if (common.isTravis()) {
    // see: http://about.travis-ci.org/docs/user/database-setup/
    config = _.extend({
      user: 'root'
    }, config);
  } else {
    config = _.extend({
      host     : process.env.MYSQL_HOST,
      port     : process.env.MYSQL_PORT,
      user     : process.env.MYSQL_USER,
      password : process.env.MYSQL_PASSWORD
    }, config);
  }
  return config;
}
