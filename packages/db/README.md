# Database package

Run `npm run db:push` with `DATABASE_URL` set to synchronize PostgreSQL and regenerate Prisma Client.

This time-boxed build intentionally uses `prisma db push`, which creates no migration history. Before production or shared staged deployments, switch to checked-in, versioned Prisma migrations so schema changes can be reviewed, replicated, and rolled forward safely.
