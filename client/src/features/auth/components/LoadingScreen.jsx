export default function LoadingScreen({ message = 'Verificando sesión...' }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-slate-100 p-4">
      <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
      <p className="text-sm font-medium text-slate-400">{message}</p>
    </div>
  );
}
