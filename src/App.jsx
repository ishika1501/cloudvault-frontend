
import { useState, useEffect, useRef } from "react";
import "./App.css";
import { apiRequest } from "./services/api";
import Dashboard from "./Dashboard";

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [googleLoading, setGoogleLoading] = useState(
      window.location.pathname === "/oauth/callback"
  );
  const [googleMessage, setGoogleMessage] = useState("");
  const callbackStarted = useRef(false);

  const [isAuthenticated, setIsAuthenticated] = useState(
      !!localStorage.getItem("token")
  );

  useEffect(() => {
    if (window.location.pathname !== "/oauth/callback") return;
    if (callbackStarted.current) return;

    callbackStarted.current = true;

    async function exchangeCode() {
      const code = new URLSearchParams(window.location.search).get("code");

      if (!code) {
        setGoogleMessage("Google login failed: authorization code missing.");
        setGoogleLoading(false);
        return;
      }

      try {
        const data = await apiRequest("/auth/google/exchange", {
          method: "POST",
          body: JSON.stringify({ code }),
        });

        localStorage.setItem("token", data.token);
        setIsAuthenticated(true);
        window.history.replaceState({}, "", "/");
      } catch (error) {
        setGoogleMessage(error.message);
      } finally {
        setGoogleLoading(false);
      }
    }

    exchangeCode();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      if (isLogin) {
        const data = await apiRequest("/users/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });

        localStorage.setItem("token", data.token);
        setIsAuthenticated(true);
      } else {
        await apiRequest("/users", {
          method: "POST",
          body: JSON.stringify({
            displayName: name,
            email,
            password,
          }),
        });

        setMessage("Registration successful! Please sign in.");
        setIsLogin(true);
        setPassword("");
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  if (googleLoading) {
    return <div className="page">Completing Google login...</div>;
  }

  if (isAuthenticated) {
    return <Dashboard />;
  }

  return (
      <div className="page">
        <div className="auth-card">
          <div className="logo">☁ CloudVault</div>

          <h1>{isLogin ? "Welcome back" : "Create your account"}</h1>

          <p className="subtitle">
            {isLogin
                ? "Sign in to access your files"
                : "Get started with your secure cloud storage"}
          </p>

          <form onSubmit={handleSubmit}>
            {!isLogin && (
                <input
                    type="text"
                    placeholder="Full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
            )}

            <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />

            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />

            <button className="primary-btn" type="submit" disabled={loading}>
              {loading
                  ? "Please wait..."
                  : isLogin
                      ? "Sign in"
                      : "Create account"}
            </button>
          </form>

          {message && <p className="message">{message}</p>}
          {googleMessage && <p className="message">{googleMessage}</p>}

          <div className="separator">
            <span>OR</span>
          </div>

          <button
              className="google-btn"
              onClick={() => {
                window.location.href = "/oauth2/authorization/google";
              }}
          >
            <span>G</span> Continue with Google
          </button>

          <p className="switch-text">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setMessage("");
                }}
            >
              {isLogin ? " Sign up" : " Sign in"}
            </button>
          </p>
        </div>
      </div>
  );
}

export default App;
