export default function Button({ variant = 'primary', className = '', children, ...props }) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-[#0073ea] text-white hover:bg-[#0060c0]',
    secondary: 'bg-white text-[#323338] border border-gray-300 hover:bg-gray-50',
    ghost: 'bg-transparent text-[#323338] hover:bg-gray-100',
    danger: 'bg-[#e2445c] text-white hover:bg-[#c33449]',
  }
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}
