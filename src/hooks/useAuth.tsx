import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import axios from "axios";
import { useRouter } from "next/router";
import toast from "react-hot-toast";

interface User {
  _id: string;
  name: string;
  email: string;
  addresses: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    isDefault: boolean;
  }[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string,rememberMe?:boolean) => Promise<void>;
  register: (name: string, email: string, password: string,confirmPassword: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  
  useEffect(() => {
    const checkUser = async () => {
      try {
        
        const token = localStorage.getItem("auth_token");

        if (token) {
          
          const response = await axios.get("/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          });

          setUser(response.data.user);
        }
      } catch (err) {
        console.error("Error checking authentication status:", err);
        localStorage.removeItem("auth_token")
        setError("Session Ended.");
        router.push("/signin")
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  const login = async (email: string, password: string,rememberMe:boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post("/api/auth/login", { email, password });

      if (rememberMe) {
        localStorage.setItem("userEmail", email);

        localStorage.setItem("userPassword", password);
      }

      sessionStorage.setItem("isLoggedIn", "true");
      sessionStorage.setItem("userEmail", email);

      toast.success("Sign in successful");

      const redirectPath = (router.query.redirectTo as string) || "/";
      router.push(redirectPath);
      
      localStorage.setItem("auth_token", response.data.token);

      setUser(response.data.user);
      router.push("/");
    } catch (error: unknown) {
      setError("Invalid credentials. Please try again.");
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string,confirmPassword:string) => {
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const response = await axios.post("/api/auth/register", {
        name,
        email,
        password,
      });
      
      localStorage.setItem("auth_token", response.data.token);

      setUser(response.data.user);
      router.push("/signin");
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        switch (error.response.status) {
          case 409:
            setError("Email already exists.");
            break;
          case 400:
            setError(error.response.data?.message || "Invalid Data.");
            break;
          default:
            setError("Registration failed. Please try again.");
            console.error("Registration error:", error);
            break;
        }
      } else {
        setError("Something went wrong. Please try again.");
        console.error("Unexpected error:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    
    localStorage.removeItem("auth_token");
    setUser(null);
    router.push("/signin");
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
