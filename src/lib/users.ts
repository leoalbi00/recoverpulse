import bcrypt from "bcryptjs";

import { supabaseAdmin } from "@/lib/supabase-admin";

export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
};

export class DuplicateEmailError extends Error {
  constructor() {
    super("Un utente con questa email esiste già.");
    this.name = "DuplicateEmailError";
  }
}

function fromRow(row: UserRow): User {
  return { id: row.id, name: row.name, email: row.email, passwordHash: row.password_hash };
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, name, email, password_hash")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (error) {
    throw new Error(`Errore nel recupero dell'utente da Supabase: ${error.message}`);
  }

  return data ? fromRow(data) : null;
}

export async function findUserById(id: string): Promise<User | null> {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, name, email, password_hash")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Errore nel recupero dell'utente da Supabase: ${error.message}`);
  }

  return data ? fromRow(data) : null;
}

export async function createUser({
  name,
  email,
  password,
}: {
  name: string;
  email: string;
  password: string;
}): Promise<User> {
  const normalizedEmail = email.toLowerCase();
  const passwordHash = await bcrypt.hash(password, 10);

  const { data, error } = await supabaseAdmin
    .from("users")
    .insert({ name, email: normalizedEmail, password_hash: passwordHash })
    .select("id, name, email, password_hash")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new DuplicateEmailError();
    }
    throw new Error(`Errore durante la creazione dell'utente su Supabase: ${error.message}`);
  }

  return fromRow(data);
}

export function verifyPassword(user: User, password: string) {
  return bcrypt.compare(password, user.passwordHash);
}

export async function updatePasswordHash(userId: string, newPasswordHash: string): Promise<void> {
  const { error } = await supabaseAdmin.from("users").update({ password_hash: newPasswordHash }).eq("id", userId);

  if (error) {
    throw new Error(`Errore nell'aggiornamento della password su Supabase: ${error.message}`);
  }
}
