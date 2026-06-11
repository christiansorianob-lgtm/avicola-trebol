import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Usuario", type: "text", placeholder: "admin" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        // En producción las variables vienen del entorno de Vercel (Neon/GitHub)
        const adminUser = process.env.ADMIN_USER || "admin";
        const adminPassword = process.env.ADMIN_PASSWORD || "password123";

        if (
          credentials?.username === adminUser &&
          credentials?.password === adminPassword
        ) {
          return { id: "1", name: "Administrador" };
        }
        return null;
      }
    })
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 horas requeridas
  },
  callbacks: {
    async session({ session, token }) {
      return session;
    },
    async jwt({ token, user }) {
      return token;
    }
  }
};
