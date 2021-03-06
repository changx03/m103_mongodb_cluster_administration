db.createUser({
  user: 'm103-admin',
  pwd: 'm103-pass',
  roles: [{ role: 'root', db: 'admin' }]
})

// use admin
db.auth('m103-admin', 'm103-pass')

// Logging basics
db.getLogComponents()
db.adminCommand({ getLog: 'global' })
db.setLogLevel(0, 'index')

// set global verbosity
db.setLogLevel(1)

/**
 * profiler
 */
db.getProfilingLevel()
db.setProfilingLevel(1)

// show collections
// system.profile

// example: set Level 1 `slow ms` to 0, and then insert a doc to a new collection.
db.setProfilingLevel(1, { slowms: 0 })
db.col.insert({ msg: 'Hello world' })
db.system.profile.find().pretty()
db.col.find()
db.system.profile.find().pretty()
// planSummary: 'COLLSCAN'

/**
 * Basic security
 */
// use admin
db.createUser({
  user: 'root',
  pwd: 'root',
  roles: ['root']
})

// auth user and then run
db.stats()

db.createUser({
  user: 'security_officer',
  pwd: 'security',
  roles: [{ db: 'admin', role: 'userAdmin' }]
})

db.createUser({
  user: 'db_user',
  pwd: 'db_pass',
  roles: [{ db: 'newDB', role: 'dbAdmin' }, { db: 'newDB', role: 'readWrite' }]
})

db.grantRolesToUser('db_user', [{ db: 'example', role: 'dbOwner' }])

// show current user
db.runCommand({ connectionStatus: 1 })

// show role's privileges
db.runCommand({ rolesInfo: { role: 'dbOwner', db: 'newDB' }, showPrivileges: true })


db.createUser({
  user: 'm103-application-user',
  pwd: 'm103-application-pass',
  roles: [{ db: 'applicationData', role: 'readWrite' }]
})
