// create folder
// $ mkdir -p /var/mongodb/pki

// generate base64 private key
// $ openssl rand -base64 741 > /var/mongodb/pki/m103-keyfile

// clear current terminal line
// ctrl + U

// give read right
// $ chmod 600 /var/mongodb/pki/m103-keyfile

// create folder for db and log file
// $ mkdir -p /var/mongodb/db/node1
// $ sudo mkdir -p /var/mongodb/log/node1
// $ sudo touch /var/mongodb/log/node1/mongo.log
// $ sudo chown vagrant:vagrant  /var/mongodb/log/node1/mongo.log

// copy node1.cfg
// $ cp node1.cfg node2.cfg

// init replica set
rs.initiate()

// create admin user and then exit mongodb, include the name of replica set into the host name
// $ mongo --host "m103-example/192.168.103.100:27001" -u m103-admin -p m103-pass --authenticationDatabase admin

// show replica set status
rs.status()

// add replica set
rs.add('192.168.103.100:27002')
rs.add('192.168.103.100:27003')

// force current primary node to step down
rs.stepDown()

// verify which one is primary
rs.isMaster() 

/**
 * Read & write from Replica set
 */
// login to primary node
// $ mongo --host "m103-example/192.168.103.100:27001" -u "m103-admin" -p "m103-pass" --authenticationDatabase "admin"
rs.isMaster()

// create newDB.new_collection from primary
use newDB
db.new_collection.insert( { "student": "Matt Javaly", "grade": "A+" } )

// exit primary node, login to a secondary node
// Do NOT include replica set name, otherwise it will login to primary automatically
// $ mongo --host "192.168.103.100:27002" -u "m103-admin" -p "m103-pass" --authenticationDatabase "admin"

// can't
show dbs

// enable read commands on secondary node
rs.slaveOk()

use newDB
db.new_collection.find()

/**
 * Election, configure node priority 
 */
var cfg = rs.conf()
cfg.members[2].priority = 0
rs.reconfig(cfg)
rs.isMaster()
// "hosts" : [
//     "192.168.103.100:27001",
//     "192.168.103.100:27002"
// ],
// "passives" : [
//     "192.168.103.100:27003"
// ],
rs.stepDown()
rs.isMaster()

/**
 * Change write concern
 */
cfg = rs.conf()
cfg.settings.getLastErrorDefaults = { w: "majority", wtimeout: 0 }
rs.reconfig(cfg)

db.new_data.insert({"m103": "very fun"}, { writeConcern: { w: 3 }})

// shutdown the current primary node
use admin
db.shutdownServer()

// wait until the election completed.
rs.status()

use testDatabase
db.new_data.insert({"m103": "very fun"}, { writeConcern: { w: 3, wtimeout: 1000 }})
// return write concern error

db.new_data.insert({"m103": "very fun"}, { writeConcern: { w: 'majority', wtimeout: 1000 }})
// no error

/**
 * Lab - Read Concern and Read Preferences
 */
// $ mongoimport --drop --host m103-example/192.168.103.100:27001,192.168.103.100:27002,192.168.103.100:27003 -u "m103-admin" -p "m103-pass" --authenticationDatabase "admin" --db applicationData --collection products /dataset/products.json

use applicationData
db.products.count()

// shutdown 2 node
// $ mongo --host 192.168.103.100:27001 -u m103-admin -p m103-pass --authenticationDatabase admin
use admin
db.shutdownServer()

// You can't shutdown the primary node when the rest of nodes can't election
// $ mongo --host 192.168.103.100:27002 -u m103-admin -p m103-pass --authenticationDatabase admin

// force step down primary node
db.adminCommand({ replSetStepDown: 86400, force: 1 })
db.shutdownServer()

// login to last node
// $ mongo --host m103-example/192.168.103.100:27003 -u m103-admin -p m103-pass --authenticationDatabase admin

// don't need this
// rs.slaveOk()
db.products.find().count()

use applicationData
db.products.find().readPref('secondary')
db.products.find().readPref('primaryPreferred')
db.products.find().readPref('secondaryPreferred')
db.products.find().readPref('nearest')

// can't read
db.products.find().readPref('primary')

