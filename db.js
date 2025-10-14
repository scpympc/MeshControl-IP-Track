"use strict";
var Datastore = null;
var formatId = null;

module.exports.CreateDB = function(meshserver) {
    var obj = {};
    var NEMongo = require(__dirname + '/nemongo.js');


    obj.initFunctions = function () {
        obj.addLocationHistory = function(nodeid, ip, geo) {
            return obj.db.insertOne({ type: 'location', nodeid: nodeid, ip: ip, geo: geo, timestamp: new Date() });
        };

        obj.getLocationHistory = function(nodeid) {
            return obj.db.find({ type: 'location', nodeid: nodeid }).sort({ timestamp: -1 }).toArray();
        };
    };

    if (meshserver.args && meshserver.args.mongodb) {
        // MongoDB support can be added here if needed
    } else {
        try { Datastore = require('@seald-io/nedb'); } catch (ex) { } 
        if (Datastore == null) {
            try { Datastore = require('@yetzt/nedb'); } catch (ex) { } 
            if (Datastore == null) { Datastore = require('nedb'); } 
        }
        if (obj.dbx == null) {
            obj.dbx = new Datastore({ filename: meshserver.getConfigFilePath('plugin-ip-track.db'), autoload: true });
            obj.dbx.persistence.setAutocompactionInterval(40000);
            obj.dbx.ensureIndex({ fieldName: 'nodeid' });
        }
        obj.db = new NEMongo(obj.dbx);
        formatId = function(id) { return id; };
        obj.initFunctions();
    }

    return obj;
}