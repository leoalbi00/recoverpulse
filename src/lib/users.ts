import bcrypt from "bcryptjs";

export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
};

declare global {
  var __recoverpulseUsers: Map<string, User> | undefined;
}

// In-memory demo store — sopravvive ai reload del dev server grazie a `globalThis`,
// ma va sostituito con un database vero (es. Prisma + Postgres) prima della produzione.
const users = globalThis.__recoverpulseUsers ?? new Map<string, User>();
if (process.env.NODE_ENV !== "production") {
  globalThis.__recoverpulseUsers = users;
}

if (!users.has("demo@recoverpulse.app")) {
  users.set("demo@recoverpulse.app", {
    id: "demo-user",
    name: "Admin Demo",
    email: "demo@recoverpulse.app",
    passwordHash: bcrypt.hashSync("demo1234", 10),
  });
}

export function findUserByEmail(email: string) {
  return users.get(email.toLowerCase());
}

export async function createUser({
  name,
  email,
  password,
}: {
  name: string;
  email: string;
  password: string;
}) {
  const normalizedEmail = email.toLowerCase();
  if (users.has(normalizedEmail)) {
    throw new Error("Un utente con questa email esiste già.");
  }
  const user: User = {
    id: crypto.randomUUID(),
    name,
    email: normalizedEmail,
    passwordHash: await bcrypt.hash(password, 10),
  };
  users.set(normalizedEmail, user);
  return user;
}

export function verifyPassword(user: User, password: string) {
  return bcrypt.compare(password, user.passwordHash);
}
