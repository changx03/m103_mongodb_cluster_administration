db.createUser({
  user: 'm103-admin',
  pwd: 'm103-pass',
  roles: [{ role: 'root', db: 'admin' }]
})

use admin
db.auth('m103-admin', 'm103-pass')
