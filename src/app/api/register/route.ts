import { NextResponse } from "next/server";
import { z } from "zod";

import { createUser, DuplicateEmailError } from "@/lib/users";

const registerSchema = z.object({
  name: z.string().min(2, "Il nome deve avere almeno 2 caratteri."),
  email: z.string().email("Email non valida."),
  password: z.string().min(6, "La password deve avere almeno 6 caratteri."),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dati non validi." },
      { status: 400 }
    );
  }

  try {
    const user = await createUser(parsed.data);
    return NextResponse.json({ id: user.id, email: user.email });
  } catch (error) {
    if (error instanceof DuplicateEmailError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    console.error("Errore durante la registrazione:", error);
    return NextResponse.json(
      { error: "Errore durante la registrazione. Riprova più tardi." },
      { status: 500 }
    );
  }
}
