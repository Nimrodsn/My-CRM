export default function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0073ea] focus:ring-1 focus:ring-[#0073ea] ${className}`}
      {...props}
    />
  )
}
