import { Spinner } from "./spinner"

interface LoadingProps {
  text?: string
  className?: string
}

function Loading({ text = "Memuat...", className }: LoadingProps) {
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm ${className || ""}`}>
      <div className="flex flex-col items-center space-y-4 rounded-lg bg-white p-8 shadow-lg">
        <Spinner className="size-8 text-blue-600" />
        <p className="text-sm font-medium text-gray-700">{text}</p>
      </div>
    </div>
  )
}

export { Loading }