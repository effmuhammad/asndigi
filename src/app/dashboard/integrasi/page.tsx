"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy, Key, RefreshCw, Share2, Download, Upload, Settings, CheckCircle, AlertCircle, Users, Calendar, Clock, ClipboardCheck } from "lucide-react"

export default function IntegrasiPage() {
  const [token, setToken] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [apiEndpoint, setApiEndpoint] = useState("https://api-siap.asn.go.id/v1")
  const [clientId, setClientId] = useState("")
  const [clientSecret, setClientSecret] = useState("")
  const [showToken, setShowToken] = useState(false)
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null)

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const generateToken = async () => {
    if (!clientId || !clientSecret) {
      showNotification('error', 'Client ID dan Client Secret harus diisi')
      return
    }

    setIsGenerating(true)
    
    try {
      const response = await fetch('/api/integration/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          clientSecret,
          apiEndpoint,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setToken(data.token)
        setShowToken(true)
        showNotification('success', 'Token berhasil digenerate')
      } else {
        throw new Error(data.error || 'Gagal generate token')
      }
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'Gagal generate token')
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToken = () => {
    navigator.clipboard.writeText(token)
    showNotification('success', 'Token telah disalin ke clipboard')
  }

  const copyEndpoint = () => {
    navigator.clipboard.writeText(apiEndpoint)
    showNotification('success', 'API Endpoint telah disalin ke clipboard')
  }

  return (
    <div className="space-y-6">
      {notification && (
        <Alert className={notification.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
          <AlertCircle className={`h-4 w-4 ${notification.type === 'error' ? 'text-red-600' : 'text-green-600'}`} />
          <AlertDescription className={notification.type === 'error' ? 'text-red-800' : 'text-green-800'}>
            {notification.message}
          </AlertDescription>
        </Alert>
      )}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Integrasi Sistem Kepegawaian</h1>
        <p className="text-gray-600">Berbagi dan menerima data dengan sistem kepegawaian external</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Token Generation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Gateway Token
            </CardTitle>
            <CardDescription>
              Generate token untuk akses API sistem kepegawaian external
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-endpoint">API Endpoint</Label>
              <div className="flex gap-2">
                <Input
                  id="api-endpoint"
                  value={apiEndpoint}
                  onChange={(e) => setApiEndpoint(e.target.value)}
                  placeholder="https://api-siap.asn.go.id/v1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyEndpoint}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="client-id">Client ID</Label>
              <Input
                id="client-id"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Masukkan Client ID"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="client-secret">Client Secret</Label>
              <Input
                id="client-secret"
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="Masukkan Client Secret"
              />
            </div>
            
            <Button 
              onClick={generateToken} 
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Key className="mr-2 h-4 w-4" />
                  Generate Token
                </>
              )}
            </Button>
            
            {token && (
              <div className="space-y-2">
                <Label>Generated Token</Label>
                <div className="flex gap-2">
                  <Textarea
                    value={showToken ? token : '••••••••••••••••'}
                    readOnly
                    className="font-mono text-sm"
                    rows={3}
                  />
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowToken(!showToken)}
                    >
                      {showToken ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyToken}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Data Sharing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Berbagi Data
            </CardTitle>
            <CardDescription>
              Bagikan data kepegawaian ke sistem external
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tipe Data</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm">
                  <Users className="mr-2 h-4 w-4" />
                  Data ASN
                </Button>
                <Button variant="outline" size="sm">
                  <Calendar className="mr-2 h-4 w-4" />
                  SKP Bulanan
                </Button>
                <Button variant="outline" size="sm">
                  <Clock className="mr-2 h-4 w-4" />
                  Presensi
                </Button>
                <Button variant="outline" size="sm">
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  Laporan Kinerja
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Periode Data</Label>
              <Input
                type="month"
                defaultValue={new Date().toISOString().slice(0, 7)}
              />
            </div>
            
            <Button className="w-full">
              <Upload className="mr-2 h-4 w-4" />
              Bagikan Data
            </Button>
          </CardContent>
        </Card>

        {/* Data Reception */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Terima Data
            </CardTitle>
            <CardDescription>
              Terima data dari sistem kepegawaian external
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Sumber Data</Label>
              <select className="w-full p-2 border rounded-md">
                <option value="">Pilih Sumber Data</option>
                <option value="siap">SIAP ASN</option>
                <option value="simpeg">SIMPEG</option>
                <option value="mypertamina">MyPertamina</option>
                <option value="custom">Custom API</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label>Tipe Data</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm">
                  <Users className="mr-2 h-4 w-4" />
                  Master ASN
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="mr-2 h-4 w-4" />
                  Struktur Organisasi
                </Button>
              </div>
            </div>
            
            <Button className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Terima Data
            </Button>
          </CardContent>
        </Card>

        {/* Status Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Status Integrasi
            </CardTitle>
            <CardDescription>
              Monitoring status koneksi dengan sistem external
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Koneksi ke SIAP ASN: <strong>Aktif</strong>
              </AlertDescription>
            </Alert>
            
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Koneksi ke SIMPEG: <strong>Perlu Perhatian</strong>
              </AlertDescription>
            </Alert>
            
            <div className="text-sm text-gray-600">
              <p><strong>Terakhir Sinkronisasi:</strong> 2 jam yang lalu</p>
              <p><strong>Total Data Tersinkronisasi:</strong> 1,234 data</p>
              <p><strong>Status Token:</strong> Akan kedaluwarsa dalam 3 hari</p>
            </div>
            
            <Button variant="outline" className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Perbarui Status
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}