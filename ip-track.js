function plugin(parent) {
    var obj = {};
    console.log('ip-track plugin: loading...');

    obj.server_startup = function () {
        console.log('ip-track plugin: server_startup');
    };

    obj.onWebUIStartupEnd = function() {
        console.log('ip-track plugin: onWebUIStartupEnd');
        pluginHandler.registerPluginTab({ tabId: 'ip-track-map', tabTitle: 'Map' });
        const tabContent = document.getElementById('ip-track-map');
        if (tabContent) {
            tabContent.innerHTML = '<h1>Map Tab Content</h1>';
        }
    };

    console.log('ip-track plugin: loaded.');
    return obj;
}

module.exports = {
    'ip-track': plugin
};