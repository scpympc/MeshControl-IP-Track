function plugin(parent) {
    var obj = {};
    console.log('iptrack plugin: loading...');

    obj.server_startup = function () {
        console.log('iptrack plugin: server_startup');
    };

    obj.onDeviceRefreshEnd = function() {
        console.log('iptrack plugin: onDeviceRefreshEnd');
        pluginHandler.registerPluginTab({ tabId: 'iptrackmap', tabTitle: 'Map' });
        QA('iptrackmap', '<iframe id="pluginIframeIptrack" style="width: 100%; height: 700px; overflow: auto" scrolling="yes" frameBorder=0 src="/pluginadmin.ashx?pin=iptrackk&user=1" />');
    };

    obj.exports = ['onDeviceRefreshEnd'];

    console.log('iptrack plugin: loaded.');
    return obj;
}

module.exports = {
    'iptrack': plugin
};