/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var EX, cpExecFile = require('child_process').execFile,
  through2 = require('through2'),
  async = require('async'),
  fs = require('fs');

function thr0w(err) { throw err; }
function fail(why, cb) { return (cb || thr0w)(new Error(why)); }
function just1arg(f) { return function (a1) { return f(a1); }; }
function ifFun(x, d) { return ((typeof x) === 'function' ? x : d); }

function expectFunc(cb, descr) {
  if (ifFun(cb)) { return cb; }
  throw new Error('Expected ' + (descr || 'callback') + ' to be a function');
}


EX = function easydlWget(url, dest, opts, whenDownloaded) {
  if ((!whenDownloaded) && ifFun(opts)) {
    whenDownloaded = opts;
    opts = null;
  }
  function job(cb) { return job.cb(cb); }
  var readers = [], lurkers = [], dlCmd;
  if (whenDownloaded) { lurkers.push(whenDownloaded); }
  whenDownloaded = null;

  Object.assign(job, { url: url, dest: dest, cb: lurkers.add,
    }, EX.defaults, opts);
  if (!job.partFn) { job.partFn = job.dest + (job.partSuffix || ''); }
  if (job.DnsTimeout === '=connect') { job.DnsTimeout = job.ConnectTimeout; }
  if (!job.encoding) { job.encoding = (job.enc || null); }

  job.done = false;
  job.failed = false;
  job.soon = function (cb) {
    var args = [job].concat(Array.prototype.slice.call(arguments, 1));
    setImmediate(Function.bind.apply(cb, args));
  };
  job.cb = EX.addLurkerAdder(job, lurkers);
  lurkers.now = function (cb) { job.soon(cb, job.failed, job); };
  lurkers.ifNone = new Error('No observers for download errors!');
  job.read = EX.addLurkerAdder(job, readers);
  readers.now = function (cb) { job.soon(cb, job.failed, job.data); };
  job.readAsStream = EX.readAsStream.bind(null, job);

  job.tasks = [
    function checkJob(next) {
      if (!(lurkers.length || readers.length)) { throw lurkers.ifNone; }
      lurkers.ifNone = null;
      if (!job.url) { fail('No URL given', next); }
      if (!job.dest) { fail('No destination filename given', next); }
      delete job.OutputDocument;
      dlCmd = [].concat(job.baseCmd).concat(EX.camel2opt(job),
        '--output-document=' + job.partFn, '--', String(job.url));
      return next();
    },
    function checkExists(next) {
      fs.access(dest, fs.constants.R_OK, function (err) {
        if (!err) {
          // target file exists and is readable
          dlCmd = null;
          return next();
        }
        //if (err.code === 'ENOENT') {
        // not readable => download it
        cpExecFile(dlCmd[0], dlCmd.slice(1), dlCmd.opt, just1arg(next));
      });
    },
    function renamePartFile(next) {
      if (!dlCmd) { return next(); }
      if (job.partFn === job.dest) { return next(); }
      return fs.rename(job.partFn, job.dest, next);
    },
    function maybeRead(next) {
      if ((!readers.length) && (!job.readFile)) { return next(); }
      var enc = job.encoding;
      if (enc === 'buffer') { enc = null; }
      fs.readFile(job.dest, enc, function (readErr, data) {
        job.data = data;
        return next(readErr);
      });
    },
  ];
  setImmediate(async.waterfall, job.tasks, function notifyLurkers(dlFail) {
    job.done = true;
    dlFail = (dlFail || false);
    job.failed = dlFail;
    [lurkers, readers].forEach(function (l) { l.forEach(l.now); });
  });
  return job;
};


EX.defaults = {
  baseCmd: 'wget',
  ConnectTimeout: 20,
  Continue: true,
  DnsTimeout: '=connect',
  encoding: null,
  partSuffix: '.part',
  Quiet: true,
  readFile: false,
  Tries: 2,
};


EX.camel2opt = function (k, v) {
  if (!k) { return; }
  if (typeof k !== 'string') {
    return Object.keys(k).map(function (e) { return EX.camel2opt(e, k[e]); }
      ).filter(Boolean);
  }
  if (v === false) { return; }
  if (v === undefined) { return; }
  if (v === null) { return; }
  if (!k.match(/^[A-Z]/)) { return; }
  var o = '-' + k.replace(/([A-Z])/g, '-$1').toLowerCase();
  if (v === true) { return o; }
  return o + '=' + String(v);
};


EX.addLurkerAdder = function (job, list) {
  function add(cb) {
    expectFunc(cb);
    if (job.done) { list.now(cb); } else { list.push(cb); }
  }
  list.add = add;
  return add;
};


EX.readAsStream = function (job) {
  var st = through2();
  job.read(function (err, data) {
    if (err) { st.emit('error', err); } else { st.write(data); }
    st.end();
  });
  return st;
};




















module.exports = EX;
