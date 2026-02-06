type LoadingStateProps = {
  message?: string
  className?: string
}

export function LoadingState({ message = 'Učitavanje...', className = '' }: LoadingStateProps) {
  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <div className="animate-pulse text-zinc-500">{message}</div>
    </div>
  )
}
