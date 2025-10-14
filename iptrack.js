const http = require('http');

function plugin(parent) {
    var obj = {};
    var db = null;
    console.log('iptrack plugin: loading...');

    obj.server_startup = function () {
        console.log('iptrack plugin: server_startup');
        db = require(__dirname + '/db.js').CreateDB(parent);

        parent.meshserver.on('deviceConnectivityChanged', function(mesh, device) {
            if (!device || !device.lastaddr || !device._id) { return; }
            const ip = device.lastaddr;
            const nodeId = device._id;
            db.getLocationHistory(nodeId).then(function(history) {
                if (history && history.length > 0 && history[0].ip === ip) { return; }
                http.get(`http://ip-api.com/json/${ip}`, (res) => {
                    let data = '';
                    res.on('data', (chunk) => { data += chunk; });
                    res.on('end', () => {
                        try {
                            const geo = JSON.parse(data);
                            if (geo.status === 'success') {
                                db.addLocationHistory(nodeId, ip, geo);
                            }
                        } catch (e) { console.error('iptrack plugin: error parsing geolocation data', e); }
                    });
                }).on('error', (err) => { console.error('iptrack plugin: error getting geolocation', err); });
            }).catch(function(err) { console.error('iptrack plugin: error getting location history', err); });
        });

        // API endpoint to get location history
        parent.app.get('/plugins/iptrack/locations/:nodeid', function(req, res) {
            const nodeId = req.params.nodeid;
            db.getLocationHistory(nodeId).then(function(history) {
                res.json(history);
            }).catch(function(err) {
                res.status(500).send('Error getting location history');
                console.error('iptrack plugin: error getting location history for API', err);
            });
        });
    };

    obj.onDeviceRefreshEnd = function() {
        console.log('--- EXECUTING IPTRAK PLUGIN SCRIPT v2.1.0 ---');
        try {
            console.log('iptrack plugin: onDeviceRefreshEnd');

            let nodeId = null;
            if (typeof mesh !== 'undefined' && mesh.currentNode) {
                if (typeof mesh.currentNode === 'object' && mesh.currentNode._id) {
                    nodeId = mesh.currentNode._id;
                    console.log('iptrack plugin: got nodeId from mesh.currentNode object');
                } else if (typeof mesh.currentNode === 'string') {
                    nodeId = mesh.currentNode;
                    console.log('iptrack plugin: got nodeId from mesh.currentNode string');
                }
            }

            if (!nodeId) {
                const urlParams = new URLSearchParams(window.location.search);
                nodeId = urlParams.get('gotonode');
                if (nodeId) {
                    console.log('iptrack plugin: got nodeId from URL');
                }
            }

            if (!nodeId) {
                console.log('iptrack plugin: nodeId not available from mesh.currentNode or URL');
                return;
            }

            pluginHandler.registerPluginTab({ tabId: 'iptrackmap', tabTitle: 'IP Map' });
            
            const iframe = `<iframe id="pluginIframeIptrack" scrolling="yes" frameBorder=0 src="/plugins/iptrack/public/map.html" />`;
            QA('iptrackmap', iframe);

            const iframeElement = document.getElementById('pluginIframeIptrack');
            if (iframeElement) {
                iframeElement.onload = function() {
                    if (iframeElement.contentWindow) {
                        iframeElement.contentWindow.postMessage({ nodeid: nodeId }, '*');
                    }
                };
            }
        } catch (e) {
            console.error('iptrack plugin: caught error in onDeviceRefreshEnd', e);
        }
    };

    obj.exports = ['onDeviceRefreshEnd'];

    console.log('iptrack plugin: loaded.');
    return obj;
}

module.exports = {
    'iptrack': plugin
};