import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import lodashId from 'lodash-id'
import pkg from 'lodash';
const { chain } = pkg;

// 1. Adapter pour le fichier JSON
const adapter = new JSONFile('db/db.json')
const db = new Low(adapter, { users: [], events: [] })

// 2. Lecture initiale
await db.read()

// 3. Initialiser les données si elles n'existent pas
db.data ||= { users: [], events: [] }

// 4. Ajouter lodash-id et créer la chain
db.chain = chain(db.data)
db.chain = db.chain.mixin(lodashId)

export default db