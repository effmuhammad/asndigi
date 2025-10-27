"use client"

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Home() {
  const { data: session, status } = useSession();
  const [showPassword, setShowPassword] = useState(false);
  const [nip, setNip] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        nip,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("NIP atau password salah. Silakan coba lagi.");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };
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
      <div className="relative z-10 min-h-screen px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="w-full max-w-4xl mx-auto">
          {status === "loading" ? (
            <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0 animate-fade-in delay-700">
              <CardContent className="p-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Memuat...</p>
                </div>
              </CardContent>
            </Card>
          ) : status === "authenticated" ? (
             <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0 animate-fade-in delay-700">
               <CardContent className="p-8 sm:p-12">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                   {/* Left side - Brand and Info */}
                   <div className="text-center lg:text-left">
                     {/* Logo and Brand */}
                     <div className="mb-6 animate-fade-in">
                       <div className="flex items-center justify-center lg:justify-start mb-4">
                         <div className="relative">
                           <Image
                             src="/logo.png"
                             alt="PRIMA ASN Logo"
                             width={60}
                             height={60}
                             className="drop-shadow-lg"
                           />
                         </div>
                         <div className="ml-4">
                           <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight">
                             PRIMA ASN
                           </h1>
                         </div>
                       </div>
                     </div>

                     {/* Main heading */}
                     <div className="mb-6 animate-slide-up">
                       <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 leading-tight">
                         AI-BASED<br />
                         PERFORMANCE<br />
                         EVALUATION<br />
                         SYSTEM FOR ASN
                       </h2>
                     </div>

                     {/* Additional info */}
                     <div className="animate-fade-in delay-500">
                       <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                         Performance Review and Intelligent Merit Assessment<br />
                         untuk Aparatur Sipil Negara
                       </p>
                     </div>
                   </div>

                   {/* Right side - Welcome Message */}
                   <div className="w-full">
                     <div className="space-y-6 text-center">
                       <div>
                         <h3 className="text-2xl font-bold text-gray-800 mb-2">
                           Selamat Datang
                         </h3>
                         <p className="text-lg text-gray-600 mb-6">{session?.user?.name || session?.user?.email}</p>
                       </div>
                       
                       <div className="space-y-3">
                         <Link
                           href="/dashboard"
                           className="inline-flex items-center justify-center w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                         >
                           Buka Dashboard
                         </Link>
                         
                         <Button
                           onClick={() => signOut()}
                           variant="outline"
                           className="w-full px-6 py-3 font-medium border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                         >
                           Keluar
                         </Button>
                         
                         <div className="text-xs text-gray-500 mt-4">
                           Sistem Evaluasi Kinerja ASN Berbasis AI
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>
               </CardContent>
             </Card>
          ) : (
            <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0 animate-fade-in delay-700">
              <CardContent className="p-8 sm:p-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                  {/* Left side - Brand and Info */}
                  <div className="text-center lg:text-left">
                    {/* Logo and Brand */}
                    <div className="mb-6 animate-fade-in">
                      <div className="flex items-center justify-center lg:justify-start mb-4">
                        <div className="relative">
                          <Image
                            src="/logo.png"
                            alt="PRIMA ASN Logo"
                            width={60}
                            height={60}
                            className="drop-shadow-lg"
                          />
                        </div>
                        <div className="ml-4">
                          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight">
                            PRIMA ASN
                          </h1>
                        </div>
                      </div>
                    </div>

                    {/* Main heading */}
                    <div className="mb-6 animate-slide-up">
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 leading-tight">
                        AI-BASED<br />
                        PERFORMANCE<br />
                        EVALUATION<br />
                        SYSTEM FOR ASN
                      </h2>
                    </div>

                    {/* Additional info */}
                    <div className="animate-fade-in delay-500">
                      <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                        Performance Review and Intelligent Merit Assessment<br />
                        untuk Aparatur Sipil Negara
                      </p>
                    </div>
                  </div>

                  {/* Right side - Login Form */}
                  <div className="w-full">
                    <div className="space-y-6">
                      <div className="text-center">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                          Login ASN
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Masukkan NIP dan password untuk mengakses sistem
                        </p>
                      </div>

                      {error && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}
                      
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="nip">NIP (Nomor Induk Pegawai)</Label>
                          <Input
                            id="nip"
                            type="text"
                            placeholder="Masukkan NIP Anda"
                            value={nip}
                            onChange={(e) => setNip(e.target.value)}
                            required
                            disabled={isLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <div className="relative">
                            <Input
                              id="password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Masukkan password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                              disabled={isLoading}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                              disabled={isLoading}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                          {isLoading ? "Memproses..." : "Masuk"}
                        </Button>
                      </form>
                      
                      <div className="text-xs text-center text-muted-foreground">
                        Lupa password? Hubungi administrator sistem
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
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
