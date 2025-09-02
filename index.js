import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import db from './db.js'

/// Le #graphql est un commentaire principalement la pour aider les editeurs a colorer le code correctement

const typeDefs = `#graphql
    type User {
        id: ID!
        name: String!
    }

    type Event {
        id: ID!
        title: String!
        date: String
        organizer: User!
    }

    type Query {
        users: [User!]!
        events: [Event!]!
    }

    type Mutation {
        createUser(name: String!): User!
    }
`;

/// Données de tests

//const users = [
//  { id: "1", name: "Alice" },
//  { id: "2", name: "Bob" }
//];

//const events = [
//  { id: "101", title: "Soirée étudiante", date: "2025-09-15", organizer: users[0] },
//  { id: "102", title: "Hackathon", date: "2025-10-01", organizer: users[1] }
//];

/// Resolver

/// users(1) renvoie a la Query definie dans le schema
/// users(2) represente la data (ici les variables des mocks) 

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
    }
  }

};

// 4. Créer le serveur
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// 5. Démarrer
const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`🚀 Server ready at ${url}`);