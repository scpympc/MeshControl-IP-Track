function plugin(parent) {
    var obj = {};
    console.log('ip-track plugin: loading...');

    obj.server_startup = function () {
        console.log('ip-track plugin: server_startup');
    };

    obj.setupHttpHandlers = function (app) {
        console.log('ip-track plugin: setupHttpHandlers');
    };

    obj.onAgentConnect = function (agent) {
        console.log('ip-track plugin: onAgentConnect');
    };

    obj.onWebUIStartupEnd = function() {
        console.log('ip-track plugin: onWebUIStartupEnd');
        pluginHandler.registerPluginTab({ tabId: 'ip-track-map', tabTitle: 'Map' });
        const tabContent = document.getElementById('ip-track-map');
        if (tabContent) {
            tabContent.innerHTML = '<h1>Map Tab Content</h1>';
        }
    };

    obj.onDeviceRefreshEnd = function() {
        console.log('ip-track plugin: onDeviceRefreshEnd');
    };

    obj.exports = ['onDeviceRefreshEnd'];

    console.log('ip-track plugin: loaded.');
    return obj;
}

module.exports = {
    'ip-track': plugin
};