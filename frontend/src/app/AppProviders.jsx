import { Toaster } from "react-hot-toast";
import AuthProvider from "../context/AuthContext";

export default function AppProviders({ children }) {
  return (
    <AuthProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: "#111827",
            color: "#f8fafc",
            border: "1px solid rgba(255,255,255,0.08)",
          },
        }}
      />
    </AuthProvider>
  );
}
