interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-gray-600">{label}</label>}
      <input
        {...props}
        className={`w-full px-3 py-2 text-sm bg-gray-100 border border-gray-200 rounded-lg focus:bg-white focus:border-gray-400 transition-colors ${className}`}
      />
    </div>
  );
}
