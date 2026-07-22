import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 1000, display: "flex", flexDirection: "column", gap: "8px" }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              fontSize: "0.9rem",
              fontWeight: 600,
              color: toast.type === "error" ? "#a82f2f" : "#1f7a4d",
              backgroundColor: toast.type === "error" ? "#fbe9e9" : "#e6f4ec",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              minWidth: "220px",
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
