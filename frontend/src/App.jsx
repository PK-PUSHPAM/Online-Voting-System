import { BrowserRouter } from "react-router-dom";
import AppProviders from "./app/AppProviders";
import AppRouter from "./app/AppRouter";
import "./styles/dashboard.css";
import "./styles/voter.css";

export default function App() {
  return (
    <BrowserRouter>
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </BrowserRouter>
  );
}
