import { Spinner } from './Spinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export function Button({ loading, children, className = '', disabled, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={loading || disabled}
      className={`flex items-center justify-center gap-2 px-4 py-2 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-blue-600 disabled:opacity-40 transition-colors ${className}`}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
