# bunyan-azure-httpcollector
bunyan streamer for Azure Log Analytics HTTP Data Collector API

# history
if you been using Bunyan and ELK stack to log your application events, Azure has a way to move your logs into cloud using HTTP Collector and I have created a stream to log events then stream them to Azure cloud using your existing code by just adding few more additional line as shown below

# usage
## Bunyan Logging
following is the code used to create a bunyan logging 

    var bunyan = require('bunyan');
    var log = bunyan.createLogger({name: "myapp"});
    log.info("hi");

## to log your events to Azure HTTP collector following declaration method is used

    var log = bunyan.createLogger(
    {
        name: 'my-log',
        },
        streams: [{
            level: 'info',
            stream: new httpCollector({
                    sharedKey: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx,
                    workspaceId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
                    url: 'https://%s.ods.opinsights.azure.com/api/logs?api-version=%s',
                    apiVersion: '2016-04-01',
                    retries: 3, //maximum retry options
                    maxBatchCount: 3 //batch size of the log events
            })
        ]
    });
## or if you want to add stream based on a condition following method can be used

    var log = bunyan.createLogger(
    {
        name: 'my-log',
        level: 'info'
    });

    if (myconditionistrue) {
        log.addStream(new httpCollector({
                    sharedKey: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx,
                    workspaceId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
                    url: 'https://%s.ods.opinsights.azure.com/api/logs?api-version=%s',
                    apiVersion: '2016-04-01',
                    retries: 3, //maximum retry options
                    maxBatchCount: 3 //batch size of the log events
            }), 'info');
    }
