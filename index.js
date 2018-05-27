#created by Satish Arasegowda

var request = require('request'),
    crypto = require('crypto'),
    util = require("util"),
    async = require('async');
    safeJsonStringify = require('safe-json-stringify'),
    jsonStringify = safeJsonStringify ? safeJsonStringify : JSON.stringify;

module.exports = createHttpLogger;

function createHttpLogger(opts){
    return {
        type: 'raw',
        stream : new httpLogger(opts)
    };
}

function httpLogger(opts) {
    if (!opts)
        throw new Error('Azure Log Analytics HTTP Collector options are required');

    this.opts = opts;
    this.opts.maxBatchCount = this.opts.maxBatchCount || 0;
    this.type = 'stream';
    this.batches = [];
}

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}
httpLogger.prototype.write = function(data) {
    if (data.msg) {
        data.Message = data.msg;
        delete data.msg;
    }
    this.batches.push(data);
    var batchOverSize = this.batches.length >= this.opts.maxBatchCount;
    if (batchOverSize) {
        this.flush(function (error) {
            if (err) {
                console.log('Azure log analytics HTPP Collector batch error :', error);
            }
        })
    }
};

httpLogger.prototype.flush = function(callback) {
    // Send all queued events
    var queue = this.batches.slice();
    //var data = queue.join("").replace('\n', '');
    this.batches = [];
    var context = {
        message: queue
    }
    this.sendEvents(context, callback);
};

httpLogger.prototype.sendEvents = function(context, callback) {
    callback = callback || function(){};
    var message = JSON.stringify(context.message);
    var contentLength = Buffer.byteLength(message, 'utf8');
    var processingDate = new Date().toUTCString();
    var stringToSign = 'POST\n' + contentLength + '\napplication/json\nx-ms-date:' + processingDate + '\n/api/logs';
    var signature = crypto.createHmac('sha256', new Buffer(this.opts.sharedKey, 'base64')).update(stringToSign, 'utf-8').digest('base64');
    var authorization = 'SharedKey ' + this.opts.workspaceId + ':' + signature;
    var headers = {
        "content-type": "application/json",
        "Authorization": authorization,
        "Log-Type": 'WebMonitorTest',
        "x-ms-date": processingDate
    };
    var url = util.format(this.opts.url, this.opts.workspaceId, this.opts.apiVersion);
    // try calling apiMethod # times, waiting 200 ms between each retry
    async.retry({times: this.opts.retries},
        function (cb) {
            request.post({url: url, headers: headers, body: message}, function (error, response, body) {
                //console.log('sent ', error, body);
                var err = null;
                if (error !== null || (response && response.statusCode != 200)) {
                    err = util.format('Azure log analytics HTPP Collector error: %s, , %s, %s', error, (response && response.statusCode ? response.statusCode : 'no response codes'), body);
                }
                cb(err)
            });
        }
        , function(err, result) {
            if (err) {
                console.error(err, result);
            }
    });
};
