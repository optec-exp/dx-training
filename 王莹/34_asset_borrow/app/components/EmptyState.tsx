export function EmptyState({ message }: { message: string }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <div className="text-6xl mb-4 opacity-40">📭</div>
      <p className="text-slate-500">{message}</p>
    </div>
  );
}
