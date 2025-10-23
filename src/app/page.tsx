"use client"

import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function Home() {
  const { data: session, status } = useSession();
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <h1 className="text-4xl font-bold text-center">
          Selamat Datang di ASNDigi
        </h1>
        <p className="text-lg text-center text-muted-foreground max-w-2xl">
          Platform digital untuk ASN yang modern dan efisien
        </p>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          {status === "loading" ? (
            <div className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Memuat...
            </div>
          ) : session ? (
            <Link
              className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
              href="/dashboard"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
              href="/login"
            >
              Masuk ke Akun
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
