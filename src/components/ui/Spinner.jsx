export default function Spinner({ className = '' }) {
  return (
    <div className={`flex items-center justify-center p-6 ${className}`}>
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-[#0073ea]" />
    </div>
  )
}
