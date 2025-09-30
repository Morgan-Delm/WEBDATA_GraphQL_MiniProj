import db from '../db/db.js'
import jwt from 'jsonwebtoken';

const SECRET = "MON_SECRET";

const resolvers = {
  Query: {
    me: (_, __, { user }) => {
      if (!user) throw new Error("Not authenticated");
      return db.data.users.find(u => u.id === user.userId);
    },
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
    login: async (_, { name }) => {
      await db.read();
      const user = db.data.users.find(u => u.name === name);
      if (!user) throw new Error("Utilisateur inconnu !");
      return jwt.sign(
        { userId: user.id, name: user.name },
        SECRET,
        { expiresIn: "1h" }
      );
    },
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
    createEvent: async (_, { title, start, end }, {user}) => {
      if (!user) throw new Error("Not authenticated");

      await db.read();

      const organizer = db.data.users.find(u => u.id === user.userId);
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
        organizerId: organizer.id,
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
    },
    updateUser: async (_, { id, name }, {authUser}) => {
      if (!authUser) throw new Error("Not authenticated");
      await db.read();
      const user = db.data.users.find(u => u.id === id);
      if (!user) {
        throw new Error("User not found");
      }
      user.name = name;
      await db.write();
      return user;
    },
    updateEvent: async (_, { id, title, start, end }, {user}) => {
      if (!user) throw new Error("Not authenticated");
      await db.read();
      const event = db.data.events.find(e => e.id === id);
      if (!event) {
        throw new Error("Event not found");
      }
      if (title !== undefined) event.title = title;
      if (start !== undefined) event.dateRange.start = start;
      if (end !== undefined) event.dateRange.end = end;
      await db.write();
      return {
        ...event,
        organizer: db.data.users.find(u => u.id === event.organizerId),
        participants: db.data.users.filter(u => event.participantsIds.includes(u.id)),
      };
    },
    deleteUser: async (_, { id },{user}) => {
      if (!user) throw new Error("Not authenticated");
      await db.read();
      const userIndex = db.data.users.findIndex(u => u.id === id);
      if (userIndex === -1) {
        return false; // User not found
      }
      db.data.users.splice(userIndex, 1);
      // Also remove events organized by this user
      db.data.events = db.data.events.filter(event => event.organizerId !== id);
      await db.write();
      return true;
    },
    deleteEvent: async (_, { id }, {user}) => {
      if (!user) throw new Error("Not authenticated");
      await db.read();
      const eventIndex = db.data.events.findIndex(e => e.id === id);
      if (eventIndex === -1) {
        return false; // Event not found
      }
      db.data.events.splice(eventIndex, 1);
      await db.write();
      return true;
    }
  }
};

export default resolvers