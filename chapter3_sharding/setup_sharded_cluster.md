# Lecture: Setting Up a Sharded Cluster

we're using the same key file for confg server and node

```bash
sudo mkdir -p /var/mongodb/pki
sudo chown vagrant:vagrant -R /var/mongodb

openssl rand -base64 741 > /var/mongodb/pki/m103-keyfile
# set key file to readonly
chmod 600 /var/mongodb/pki/m103-keyfile
```

creating copy of config files

```bash
cp csrs_1.cfg csrs_2.cfg
```

starting config server with 3 replica set

```bash
mongod -f csrs_1.cfg
mongod -f csrs_2.cfg
mongod -f csrs_3.cfg
```

creating folder and changing owner

```bash
sudo mkdir -p /var/mongodb/db/csrs{1,2,3}

sudo chown vagrant:vagrant -R /var/mongodb/db
```

connecting

```bash
mongo --port 26001
```

initiating the CSRS

```javascript
rs.initiate()
```

creating root user

```javascript
use admin

db.createUser({
  user: "m103-admin",
  pwd: "m103-pass",
  roles: [
    {role: "root", db: "admin"}
  ]
})

db.auth("m103-admin", "m103-pass")
```

adding replica set to CSRS

```javascript
rs.add("192.168.103.100:26002")
rs.add("192.168.103.100:26003")
```

starting mongos

```bash
mongos -f mongos.cfg
```

connecting to mongos with the user which created in CSRS

```bash
mongo --port 26000 -u "m103-admin" -p "m103-pass" --authenticationDatabase admin
```

checking sharding status

```javascript
sh.status()
```

starting mongod

```bash
mongod -f node1.cfg
mongod -f node2.cfg
mongod -f node3.cfg
```

to update config file on running replica set:

* update the secondary node first
* step down the primary
* update the primary

connecting to secondary node

```bash
mongo --port 27002 -u "m103-admin" -p "m103-pass" --authenticationDatabase admin
```

shutting down node

```bash
use admin

db.shutdownServer()
```

stepping down primary

```javascript
rs.stepDown()
```

adding new shard from **mongos**

```bash
mongo --port 26000 -u "m103-admin" -p "m103-pass" --authenticationDatabase admin
```

we specify the replica set name, so we only need to add one node

```javascript
sh.addShard("m103-repl/192.168.103.100:27001")
```

checking mongos, config server and node
```bash
mongo --port 26000 -u "m103-admin" -p "m103-pass" --authenticationDatabase admin

mongo --host m103-csrs/192.168.103.100:26001 -u "m103-admin" -p "m103-pass" --authenticationDatabase admin

mongo --host m103-repl/192.168.103.100:27001 -u "m103-admin" -p "m103-pass" --authenticationDatabase admin
```

mongo --port 27001 -u "m103-admin" -p "m103-pass" --authenticationDatabase admin
rs.add("192.168.103.100:27002")
