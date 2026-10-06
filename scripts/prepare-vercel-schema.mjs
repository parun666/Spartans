import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const sourcePath = resolve("prisma/schema.prisma");
const targetPath = resolve("prisma/vercel/schema.prisma");
const source = await readFile(sourcePath, "utf8");
const sqliteDatasource = /datasource db \{\s*provider\s*=\s*"sqlite"\s*url\s*=\s*env\("DATABASE_URL"\)\s*\}/;

if (!sqliteDatasource.test(source)) {
  throw new Error("Expected the local Prisma schema to use a SQLite DATABASE_URL datasource");
}

const postgresDatasource = `datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}`;
await mkdir(dirname(targetPath), { recursive: true });
await writeFile(targetPath, source.replace(sqliteDatasource, postgresDatasource), "utf8");
