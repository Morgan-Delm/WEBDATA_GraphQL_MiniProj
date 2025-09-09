import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { readFileSync } from "node:fs";
import resolvers from "./resolvers/resolvers.js";

const typeDefs = readFileSync("./schema/schema.graphql", "utf-8");

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