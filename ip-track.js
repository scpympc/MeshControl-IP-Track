const http = require('http');

function plugin(parent) {
    var obj = {};
    obj.parent = parent;
    obj.meshServer = parent.parent;
    obj.db = null;
    var map = null; // Variable to hold the map instance

    obj.exports = ['onDeviceRefreshEnd'];

    // Called when the server is starting
    obj.server_startup = function () {
        try {
            obj.db = require(__dirname + '/db.js').CreateDB(obj.meshServer);
        } catch (e) {
            console.error('Error loading ip-track plugin:', e);
        }
    };

    // Called to setup custom API endpoints
    obj.setupHttpHandlers = function (app) {
        app.get('/plugin/ip-track/locations', (req, res) => {
            if (!req.query.nodeid) {
                res.status(400).send('Missing nodeid');
                return;
            }
            obj.db.getLocationHistory(req.query.nodeid)
                .then(locations => {
                    res.json(locations);
                })
                .catch(err => {
                    res.status(500).send(err);
                });
        });
    };

    obj.onDeviceRefreshEnd = function() {
        pluginHandler.registerPluginTab({ tabId: 'ip-track-map', tabTitle: 'Map' });
        const tabContent = document.getElementById('ip-track-map');
        if (tabContent) {
            tabContent.innerHTML = `
                <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
                <div id="ip-track-map-container" style="height: 100%; width: 100%;"></div>
            `;
            loadMap(currentNode._id);
        }
    };

    function loadMap(nodeid) {
        const mapContainer = document.getElementById('ip-track-map-container');
        if (!mapContainer) return;

        fetch(`/plugin/ip-track/locations?nodeid=${nodeid}`)
            .then(response => response.json())
            .then(locations => {
                if (locations && locations.length > 0) {
                    map = L.map('ip-track-map-container').setView([locations[0].geo.lat, locations[0].geo.lon], 13);
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                    }).addTo(map);

                    const markers = [];
                    locations.forEach(loc => {
                        if (loc.geo && loc.geo.lat && loc.geo.lon) {
                            const marker = L.marker([loc.geo.lat, loc.geo.lon])
                                .addTo(map)
                                .bindPopup(`<b>IP:</b> ${loc.ip}<br><b>Time:</b> ${new Date(loc.timestamp).toLocaleString()}`);
                            markers.push(marker);
                        }
                    });

                    if (markers.length > 0) {
                        const group = new L.featureGroup(markers);
                        map.fitBounds(group.getBounds().pad(0.1));
                    }
                } else {
                    mapContainer.innerHTML = '<div style="padding: 20px;">No location data available for this device.</div>';
                }
            })
            .catch(err => {
                console.error('[IP-Track] Error loading location data:', err);
                mapContainer.innerHTML = '<div style="padding: 20px; color: red;">Error loading location data.</div>';
            });
    }

    // Called when an agent connects
    obj.onAgentConnect = function (agent) {
        if (agent.ip && agent.dbNodeKey) {
            getGeoLocation(agent.ip, (err, geoData) => {
                if (err || geoData.status !== 'success') {
                    // console.log(`[IP-Track] Could not get geolocation for ${agent.ip}.`);
                    return;
                }
                obj.db.addLocationHistory(agent.dbNodeKey, agent.ip, geoData)
                    .then(() => { /* console.log(`[IP-Track] Saved location for ${agent.name}`); */ })
                    .catch((e) => { console.log(`[IP-Track] Error saving location for ${agent.name}:`, e); });
            });
        }
    };

    function getGeoLocation(ip, callback) {
        // Ignore private IPs
        const ipParts = ip.split('.').map(p => parseInt(p, 10));
        if (ipParts[0] === 10 || (ipParts[0] === 172 && ipParts[1] >= 16 && ipParts[1] <= 31) || (ipParts[0] === 192 && ipParts[1] === 168)) {
            return;
        }

        const url = `http://ip-api.com/json/${ip}`;
        http.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(data);
                    callback(null, parsedData);
                } catch (e) {
                    callback(e, null);
                }
            });
        }).on('error', (err) => {
            callback(err, null);
        });
    }

    return obj;
}

module.exports = {
    'ip-track': plugin
};