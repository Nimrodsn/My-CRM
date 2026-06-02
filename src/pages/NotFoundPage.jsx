import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-center">
      <h1 className="text-4xl font-bold text-[#0073ea]">404</h1>
      <p className="text-gray-500">העמוד לא נמצא.</p>
      <Link to="/" className="text-[#0073ea] hover:underline">
        חזרה לעמוד הראשי
      </Link>
    </div>
  )
}
