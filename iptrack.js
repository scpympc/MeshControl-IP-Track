function plugin(parent) {
    var obj = {};
    console.log('iptrack plugin: loading...');

    obj.server_startup = function () {
        console.log('iptrack plugin: server_startup');
    };

    obj.onDeviceRefreshEnd = function() {
        console.log('iptrack plugin: onDeviceRefreshEnd');
        pluginHandler.registerPluginTab({ tabId: 'iptrack-map', tabTitle: 'Map' });
        const tabContent = document.getElementById('iptrack-map');
        if (tabContent) {
            tabContent.innerHTML = '<h1>Map Tab Content</h1>';
        }
    };

    obj.exports = ['onDeviceRefreshEnd'];

    console.log('iptrack plugin: loaded.');
    return obj;
}

module.exports = {
    'iptrack': plugin
};