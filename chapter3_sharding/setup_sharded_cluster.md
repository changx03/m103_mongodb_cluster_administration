# Lecture: Setting Up a Sharded Cluster

start config server with 3 replica set

```bash
mongod -f csrs_1.conf
mongod -f csrs_2.conf
mongod -f csrs_3.conf
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
mongo --port 26000 --username m103-admin --password m103-pass --authenticationDatabase admin
```

checking sharding status

```javascript
sh.status()
```

starting mongod

```bash
mongod -f node1.conf
mongod -f node2.conf
mongod -f node3.conf
```

to update config file on running replica set:

* update the secondary node first
* step down the primary
* update the primary

connecting to secondary node

```bash
mongo --port 27012 -u "m103-admin" -p "m103-pass" --authenticationDatabase "admin"
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
mongo --port 26000 -u "m103-admin" -p "m103-pass" --authenticationDatabase "admin"
```

we specify the replica set name, so we only need to add one node

```javascript
sh.addShard("m103-repl/192.168.103.100:27012")
```
