import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        nip: { label: "NIP", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.nip || !credentials?.password) {
          return null
        }

        try {
          // Query user from database using Prisma
          const user = await prisma.user.findUnique({
            where: {
              nip: credentials.nip as string
            }
          })

          if (!user) {
            return null
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(credentials.password as string, user.password)
          
          if (!isPasswordValid) {
            return null
          }

          return {
            id: user.id,
            nip: user.nip,
            name: user.name,
            email: user.email,
            role: user.role,
            unit_kerja: user.unit_kerja || ""
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.nip = user.nip
        token.role = user.role
        token.unit_kerja = user.unit_kerja
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub || ""
        session.user.nip = token.nip as string
        session.user.role = token.role as string
        session.user.unit_kerja = token.unit_kerja as string
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
  },
})