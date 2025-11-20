// Local Authentication Context
// Replaces Clerk authentication

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName: string, lastName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  isSignedIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkSession = () => {
      try {
        const storedUser = localStorage.getItem('pharmacy_user');
        const storedSession = localStorage.getItem('pharmacy_session');
        
        if (storedUser && storedSession) {
          const sessionData = JSON.parse(storedSession);
          // Check if session is still valid (24 hours)
          const now = Date.now();
          if (sessionData.expiresAt > now) {
            setUser(JSON.parse(storedUser));
          } else {
            // Session expired
            localStorage.removeItem('pharmacy_user');
            localStorage.removeItem('pharmacy_session');
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
      localStorage.removeItem('pharmacy_user');
        localStorage.removeItem('pharmacy_session');
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      // Get users from localStorage
      const usersData = localStorage.getItem('pharmacy_users');
      if (!usersData) {
        throw new Error('No account found with this email');
      }

      const users = JSON.parse(usersData);
      const userData = users.find((u: any) => u.email === email);

      if (!userData) {
        throw new Error('No account found with this email');
      }

      // Simple password check (in production, use proper hashing)
      if (userData.password !== password) {
        throw new Error('Incorrect password');
      }

      // Create session
      const session = {
        userId: userData.id,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      };

      localStorage.setItem('pharmacy_session', JSON.stringify(session));
      localStorage.setItem('pharmacy_user', JSON.stringify({
        id: userData.id,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        createdAt: userData.createdAt,
      }));

      setUser({
        id: userData.id,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        createdAt: userData.createdAt,
      });
    } catch (error) {
      throw error;
    }
  };

  const signUp = async (
    email: string,
    password: string,
    firstName: string,
    lastName?: string
  ): Promise<void> => {
    try {
      // Check if user already exists
      const usersData = localStorage.getItem('pharmacy_users');
      const users = usersData ? JSON.parse(usersData) : [];

      if (users.find((u: any) => u.email === email)) {
        throw new Error('An account with this email already exists');
      }

      // Create new user
      const newUser = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email,
        password, // In production, hash this
        firstName,
        lastName,
        createdAt: new Date().toISOString(),
      };

      users.push(newUser);
      localStorage.setItem('pharmacy_users', JSON.stringify(users));

      // Auto sign in
      await signIn(email, password);
    } catch (error) {
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    localStorage.removeItem('pharmacy_user');
    localStorage.removeItem('pharmacy_session');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signUp,
        signOut,
        isSignedIn: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Hook to get current user (similar to Clerk's useUser)
export const useUser = () => {
  const { user, isLoading } = useAuth();
  return { user, isLoaded: !isLoading };
};

