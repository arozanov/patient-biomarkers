import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import { appRouter } from './router.js';
import { prisma } from './db.js';

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });

await app.register(fastifyTRPCPlugin, {
  prefix: '/trpc',
  trpcOptions: {
    router: appRouter,
    createContext: () => ({}),
  },
});

if (process.env.NODE_ENV === 'production') {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const clientDist = path.resolve(here, '..', '..', 'client', 'dist');

  await app.register(fastifyStatic, {
    root: clientDist,
    wildcard: false,
  });

  app.setNotFoundHandler((req, reply) => {
    if (req.url.startsWith('/trpc')) {
      reply.code(404).send({ error: 'Not found' });
      return;
    }
    reply.sendFile('index.html');
  });
}

const port = Number(process.env.PORT) || 3001;

await app.listen({ port, host: '0.0.0.0' });

const shutdown = async () => {
  await app.close();
  await prisma.$disconnect();
  process.exit(0);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
