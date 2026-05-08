import { Component } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import "../../styles/app-final-polish.css";

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("App crashed:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main className="app-error-fallback">
        <div className="app-error-fallback__grid" />

        <section className="app-error-card">
          <div className="app-error-card__icon">
            <AlertTriangle size={34} />
          </div>

          <span className="app-error-card__badge">Runtime Error</span>

          <h1>Something broke</h1>

          <p>
            The page failed to render. Reload once. If it repeats, check the
            latest code change.
          </p>

          <div className="app-error-card__actions">
            <button type="button" onClick={this.handleReload}>
              <RefreshCw size={17} />
              Reload
            </button>

            <Link to="/">
              <Home size={17} />
              Home
            </Link>
          </div>

          {import.meta.env.DEV && this.state.error?.message ? (
            <pre className="app-error-card__debug">
              {this.state.error.message}
            </pre>
          ) : null}
        </section>
      </main>
    );
  }
}
