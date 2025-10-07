import db from '../db/db.js'
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const SECRET = "MON_SECRET";

const resolvers = {
  Query: {
    me: (_, __, { auth }) => {
      if (!auth) throw new Error("Not authenticated");
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
    login: async (_, { name, password }) => {
      await db.read();

      const user = db.data.users.find(u => u.name === name);
      if (!user) throw new Error("Utilisateur inconnu !");

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) throw new Error("Mot de passe incorrect !");

      return jwt.sign(
        { userId: user.id, name: user.name },
        SECRET,
        { expiresIn: "1h" }
      );
    },
    createUser: async (_, { name, password }) => {
      await db.read()
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = {
        id: Date.now().toString(),
        name: name,
        password: hashedPassword,
      };
      db.data.users.push(newUser);
      await db.write()
      return { id: newUser.id, name: newUser.name };
    }, 
    createEvent: async (_, { title, start, end }, {auth}) => {
      if (!auth) throw new Error("Not authenticated");

      await db.read();

      const organizer = db.data.users.find(u => u.id === auth.userId);
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
    updateUser: async (_, { id, name }, {auth}) => {
      if (!auth) throw new Error("Not authenticated");
      await db.read();
      const user = db.data.users.find(u => u.id === id);
      if (!user) {
        throw new Error("User not found");
      }
      user.name = name;
      await db.write();
      return user;
    },
    updateEvent: async (_, { id, title, start, end }, {auth}) => {
      if (!auth) throw new Error("Not authenticated");
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
    deleteUser: async (_, { id },{auth}) => {
      if (!auth) throw new Error("Not authenticated");
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
    deleteEvent: async (_, { id }, {auth}) => {
      if (!auth) throw new Error("Not authenticated");
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