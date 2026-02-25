export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const cls = { sm: 'w-4 h-4', md: 'w-7 h-7', lg: 'w-10 h-10' }[size];
  return (
    <div
      className={`${cls} border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin`}
    />
  );
}
