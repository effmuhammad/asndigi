import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import type { JWT } from "next-auth/jwt"
import type { Session } from "next-auth"

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
          const user = await prisma.user.findUnique({
            where: {
              nip: credentials.nip as string
            }
          })

          if (!user) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          )

          if (!isPasswordValid) {
            return null
          }

          return {
            id: user.id,
            nip: user.nip,
            name: user.name,
            role: user.role,
            work_unit: user.work_unit,
            position: user.position,
            email: user.email,
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt" as const
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: any }) {
      if (user) {
        token.id = user.id  // Store the actual database user ID
        token.role = user.role
        token.work_unit = user.work_unit
        token.position = user.position
      }
      return token
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token) {
        session.user.id = token.id as string  // Use the stored database user ID
        session.user.role = token.role as string
        session.user.work_unit = token.work_unit as string
        session.user.position = token.position as string
      }
      return session
    }
  },
  pages: {
    signIn: '/',
  },
})