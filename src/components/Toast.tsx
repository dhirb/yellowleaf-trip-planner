/** Transient bottom-centred toast inside the phone surface. */
export function Toast({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div
      role="status"
      className="absolute bottom-10 left-1/2 z-[90] max-w-[84%] -translate-x-1/2 rounded-md bg-ink px-5 py-[13px] text-center text-[14.5px] font-semibold text-app-bg shadow-[0_10px_30px_rgba(0,0,0,0.3)] animate-toast-in"
    >
      {message}
    </div>
  );
}
