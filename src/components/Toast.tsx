/** Transient bottom-centred toast inside the phone surface. */
export function Toast({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div
      role="status"
      style={{
        position: "absolute",
        bottom: 40,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 90,
        background: "#1F1B16",
        color: "#fff",
        fontSize: 14.5,
        fontWeight: 600,
        padding: "13px 20px",
        borderRadius: 14,
        boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
        maxWidth: "84%",
        textAlign: "center",
        animation: "toastIn .25s ease",
      }}
    >
      {message}
    </div>
  );
}
