import db from '../db/db.js'

const resolvers = {
  Query: {
    users: async () => {
      await db.read()
      return db.data.users
    },
    events: async () => {
      await db.read()
      return db.data.events.map(event => ({
        ...event,
        organizer: db.data.users.find(u => u.id === event.organizerId)
      }))
    },
  },
  Mutation: {
    createUser: async (_, { name }) => {
      await db.read()
      const newUser = {
        id: Date.now().toString(),
        name: name
      };
      db.data.users.push(newUser);
      await db.write()
      return newUser
    }, 
    createEvent: async (_, { title, start, end, organizerId }) => {
      await db.read();

      const organizer = db.data.users.find(u => u.id === organizerId);
      if (!organizer) {
        throw new Error("Organizer not found");
      }
      const newEvent = {
        id: Date.now().toString(),
        title,
        dateRange: {
          start,
          end,
        },
        organizerId,
        participantsIds: [],
      };

      db.data.events.push(newEvent);
      await db.write();

      // On renvoie l’event avec l’organisateur résolu
      return {
        ...newEvent,
        organizer,
        participants: [],
      };
    }
  }
};

export default resolvers