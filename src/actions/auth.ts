"use server";

import { prisma } from "@/lib/prisma";
import {
  verifyPassword,
  createToken,
  setSessionCookie,
  clearSessionCookie,
} from "@/lib/auth";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Email and password required" };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { error: "Invalid credentials" };

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return { error: "Invalid credentials" };

  const token = await createToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
  await setSessionCookie(token);

  if (user.role === "ADMIN") {
    redirect("/admin");
  }
  redirect("/");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
