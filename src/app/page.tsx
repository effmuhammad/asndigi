"use client"

import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function Home() {
  const { data: session, status } = useSession();
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-purple-600 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-400/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-purple-400/20 rounded-full blur-lg animate-pulse delay-1000"></div>
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-blue-300/10 rounded-full blur-2xl animate-pulse delay-500"></div>
        <div className="absolute bottom-20 right-1/3 w-28 h-28 bg-purple-300/15 rounded-full blur-xl animate-pulse delay-700"></div>
        
        {/* Additional circular decorative elements */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-300"></div>
        <div className="absolute top-1/4 right-1/4 w-20 h-20 bg-blue-200/20 rounded-full blur-md animate-pulse delay-200"></div>
        <div className="absolute bottom-1/4 left-1/4 w-16 h-16 bg-purple-200/25 rounded-full blur-lg animate-pulse delay-800"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Logo and Brand */}
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <Image
                  src="/logo.png"
                  alt="PRIMA ASN Logo"
                  width={80}
                  height={80}
                  className="drop-shadow-lg"
                />
              </div>
              <div className="ml-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight">
                  PRIMA ASN
                </h1>
              </div>
            </div>
          </div>

          {/* Main heading */}
          <div className="mb-8 animate-slide-up">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">
              AI-BASED<br />
              PERFORMANCE<br />
              EVALUATION<br />
              SYSTEM FOR ASN
            </h2>
          </div>



          {/* Call to action */}
          <div className="animate-slide-up delay-300">
            {status === "loading" ? (
              <div className="inline-flex items-center justify-center px-8 py-4 bg-white/20 backdrop-blur-sm text-white rounded-full font-medium text-lg border border-white/30">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Memuat...
              </div>
            ) : session ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 rounded-full font-semibold text-lg hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Buka Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 rounded-full font-semibold text-lg hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Masuk ke Sistem
              </Link>
            )}
          </div>

          {/* Additional info */}
          <div className="mt-16 animate-fade-in delay-500">
            <p className="text-blue-100/80 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Performance Review and Intelligent Merit Assessment<br />
              untuk Aparatur Sipil Negara
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
        }

        .animate-slide-up {
          animation: slide-up 0.8s ease-out forwards;
        }

        .delay-200 {
          animation-delay: 0.2s;
        }

        .delay-300 {
          animation-delay: 0.3s;
        }

        .delay-500 {
          animation-delay: 0.5s;
        }

        .delay-700 {
          animation-delay: 0.7s;
        }

        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
}
