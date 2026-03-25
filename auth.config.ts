import { defineConfig } from "auth-astro";
import Credentials from "@auth/core/providers/credentials";
import { prisma } from "./src/lib/prisma";
import bcrypt from "bcryptjs";

export default defineConfig({
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user?.passwordHash) return null;
        const valid = await bcrypt.compare(
          credentials.password as string,
          (user as any).passwordHash
        );
        if (!valid) return null;
        return { id: user.id, email: user.email, name: user.name, role: (user as any).role };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }: any) {
      if (user) { token.role = user.role; token.id = user.id; }
      return token;
    },
    session({ session, token }: any) {
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.sub;
      }
      return session;
    },
  },
  pages: { signIn: "/en/login" },
});
