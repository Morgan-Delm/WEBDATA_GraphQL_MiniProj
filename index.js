import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { readFileSync } from "node:fs";
import resolvers from "./resolvers/resolvers.js";
import jwt from 'jsonwebtoken';

const typeDefs = readFileSync("./schema/schema.graphql", "utf-8");
const SECRET = "MON_SECRET";

// 4. Créer le serveur
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// 5. Démarrer
const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
  context: async ({ req }) => {
    const auth = req.headers.authorization || "";
    if (auth.startsWith("Bearer ")) {
      const token = auth.slice(7);
      try {
        const decoded = jwt.verify(token, SECRET);
        return { user: decoded };
      } catch (err) {
        console.error("❌ Token invalide:", err.message);
        console.log(token)
      }
    }
    return {};
  },
});

console.log(`🚀 Server ready at ${url}`);