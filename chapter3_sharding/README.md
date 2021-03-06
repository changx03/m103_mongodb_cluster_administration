# Chapter 3: Sharding

## Lecture: Setting Up a Sharded Cluster

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

## Lecture: Config DB

* Never need to write anything
* Readonly

Documents are stored by shard key values.

Each shard holds certain range of shard key values.

```bash
mongo --port 26000 -u "m103-admin" -p "m103-pass" --authenticationDatabase admin
```

from mongos

```javascript
sh.status()

use config

db.databases.find().pretty()
db.collections.find().pretty()
db.shards.find().pretty()
db.chunks.find().pretty()
db.mongos.find().pretty()
```

## Lecture: Shard keys

### Chunks: `{ x: 1 }` => (x<3), (3<=x<6), (6<=x)

* Each shard contains a given chunk.
When insert a new document,
mongos checks which shard contains the appropriate chunk for that document's shard key value.
* Shard key **must** be present in every document.
* Ideally, shard key should support the majority of query, so the read operation can be targeted to the single shard.

### Shard key

* Shard key **must be indexed**. Create index and then select shard key
* Shard key are **immutable**. CANNOT change/ update
* CANNOT unshard

### How to shard

```javascript
sh.enableSharding("<db>")

db.<coll>.createIndex({ "<index>": 1 })

// shard_key is an index
sh.shardCollection("<db>.<coll>", { "<shard_key>": 1 })

sh.status()
```

> compound index can be used as shard key!

## Lecture: Picking shard key

Not all collection need to be sharded.

Good write value

* Cardinality - high cardinality = many possible unique values (e.g. city > week_of_day > boolean)
* Frequency - low frequency = low repetition of a given unique value (e.g. majority of users are in Auckland )
* Monotonic Change - avoid monotonically changing (e.g. `insert_date` field is monotonically increasing. `_id` is not suitable for shard key)

1. High cardinality
1. Low frequency
1. Non-Monotonically changing

Try testing shard key in a staging environment first before production.
Using `mongodump` and `mongorestore` utilities.

## Lecture: Hashed shard key

Chunk `{ x: 1 }` -> Hashing function -> shard

* Data remains unhashed when saved
* More even distributed when using a monotonically-changing shard key
* Data are stored scattered. Range query will read from multiple shards
* Cannot support geographically isolated read operations
* Only on single non-array field
* Lose index sorting

```javascript
sh.enableSHarding("<db>")
db.<coll>.createIndex({ "<index>": "hashed" })
sh.shardCollection("<db>.<coll>", { "<shard_key>": "hashed" })
```

## Lab 2 - Shard a Collection

```bash
mkdir /var/mongodb/db/{4,5,6}

# copy chang update config
cp node1.cfg node4.cfg

cp node4.cfg node5.cfg
cp node4.cfg node6.cfg

# start mongod
mongod -f node4.cfg
mongod -f node5.cfg
mongod -f node6.cfg

# login to node4
mongo --port 27004
```

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

rs.add("192.168.103.100:27005")
rs.add("192.168.103.100:27006")
rs.isMaster()
```

```bash
mongo --port 26000 -u "m103-admin" -p "m103-pass" --authenticationDatabase admin
```

```javascript
sh.addShard("m103-repl-2/192.168.103.100:27004")
sh.status()
```

`products.json` is saved in Vagrant box `/dataset/` directory

```bash
mongoimport --drop /dataset/products.json --port 26000 -u "m103-admin" \
-p "m103-pass" --authenticationDatabase "admin" \
--db m103 --collection products
```

from `mongos`

```javascript
show dbs
sh.enableSharding("m103")

use m103
db.products.count()
db.products.find().limit(1).pretty()

db.products.createIndex({ "sku": "hashed" })
// db.adminCommand({ shardCollection: "m103.products", key: { "sku": 1 }})
sh.shardCollection("m103.products", { "sku": "hashed" })

sh.status()
```

## Lecture: Chunks

from `mongos`

```javascript
use config
show collections
db.chunks.findOne()
```

inclusive minimum and exclusive maximum

ChunkSize = 64MB

1MB <= ChunkSize <= 1024MB

Change chunk size to 2MB

```javascript
use config
db.settings.save({_id: "chunksize", value: 2})
```

### Jumbo chunks can be **very damaging**

* larger than defined chunk size
* cannot move

increasing chunk size can help eliminate jumbo chunks

## Lab 3 - Documents in Chunks

```bash
mongoimport --drop /dataset/products.json --port 26000 -u "m103-admin" \
-p "m103-pass" --authenticationDatabase "admin" \
--db m103 --collection products
```

from `mongos`

```bash
mongo --port 26000 -u "m103-admin" -p "m103-pass" --authenticationDatabase admin
```

```javascript
use m103
db.products.createIndex({"sku":1})

sh.enableSharding("m103")
db.adminCommand({shardCollection: "m103.products", key: {sku: 1}})

db.getSiblingDB("m103").products.find({"sku" : 21572585 })

use config
db.chunks.find().pretty()
```

```bash
validate_lab_document_chunks "m103.products-sku_21570757"
```

## Lecture: Balancing

`Balancer` runs on primary node of config server replica set

Balancer round: `floor(n / 2)` where `n` is # of shards (e.g. 3 shards can migrate 1 at a time, 4 has 2)

```javascript
sh.startBalancer(<timeout>, <interval>)
sh.stopBalancer(<timeout>, <interval>)
sh.setBalancerState(<boolean>)
```

## Lecture: Queries in a shard cluster

```javascript
db.products.find({ name: 'How To Mongo' })
```

1. determine which shard (all, or a subset)
1. if query predicate includes the shard key, `mongos` can target to the shards which contain the values - very efficient
1. if not include, or range query, `mongos` will target all shards - very slow
1. Each shard has a cursor, `mongos` receives a set of response and merge them

### `sort()`

`mongos` pushes `sort` on each shard and merge-sorts the results

### `limit()`

`mongos` pushes `limit` to targeted shards and re-applies the limit to merged the results

### `skip()`

`mongos` performs `skip` against the merged results

## Lecture: Routed queries VS Scatter gather

```javascript
use m103
// check products collection
show collections

// contains 2 shards
sh.status()

// routed query:
// "SINGLE_SHARD" <- "FETCH" <- "SHARDING_FILTER" <- "IXSCAN"
db.products.find({"sku" : 1000000749 }).explain()

// scatter gather query:
// "SHARD_MERGE" <- "SHARDING_FILTER" <- "COLLSCAN"
db.products.find( { name: "Gods And Heroes: Rome Rising - Windows [Digital Download]" }).explain()
```

"SINGLE_SHARD": doesn't need merge in `mongos`

Both queries return same result. Because we use `sku` as shard key, 1st query is faster.

If we run the query frequently, it's better to use `name` as shard key!

## Lab 4: Detect Scatter Gather Queries

```javascript
var exp = db.products.explain("executionStats")
exp.find({"sku": 23153496})
exp.find({"shippingWeight": 1.00})
```
