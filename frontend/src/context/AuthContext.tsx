import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'fan' | 'organizer' | 'admin';
  fanDetails?: {
    username: string;
    preferredGenre: string;
    phoneNumber: string;
    referralCode: string;
    referralPoints: number;
  };
  organizerDetails?: {
    organizationName: string;
    contactInfo: string;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Migration function to convert API response to frontend format
const migrateUserData = (userData: any): User | null => {
  if (!userData) return null;

  const migratedUser: User = {
    id: userData.id || userData.userId || userData.user_id,
    email: userData.email,
    firstName: userData.firstName || userData.first_name || '',
    lastName: userData.lastName || userData.last_name || '',
    userType: userData.userType || userData.user_type || 'fan',
  };

  // Migrate fan details if they exist
  if (userData.fanDetails) {
    migratedUser.fanDetails = {
      username: userData.fanDetails.username || '',
      preferredGenre: userData.fanDetails.preferredGenre || userData.fanDetails.preferred_genre || '',
      phoneNumber: userData.fanDetails.phoneNumber || userData.fanDetails.phone_number || '',
      referralCode: userData.fanDetails.referralCode || userData.fanDetails.referral_code || '',
      referralPoints: userData.fanDetails.referralPoints || userData.fanDetails.referral_points || 0,
    };
  } else if (userData.fan_details) {
    // Old format - convert to new format
    migratedUser.fanDetails = {
      username: userData.fan_details.username || '',
      preferredGenre: userData.fan_details.preferred_genre || '',
      phoneNumber: userData.fan_details.phone_number || '',
      referralCode: userData.fan_details.referral_code || '',
      referralPoints: userData.fan_details.referral_points || 0,
    };
  }

  return migratedUser;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        const migratedUser = migrateUserData(parsedUser);
        if (migratedUser) {
          // Update localStorage with migrated data
          localStorage.setItem('user', JSON.stringify(migratedUser));
          return migratedUser;
        }
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('user');
      }
    }
    return null;
  });
  
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token');
  });

  const login = (newToken: string, newUser: any) => {
    const migratedUser = migrateUserData(newUser);
    if (migratedUser) {
      setToken(newToken);
      setUser(migratedUser);
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(migratedUser));
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // Check token expiration
  useEffect(() => {
    if (token) {
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = tokenData.exp * 1000; // Convert to milliseconds
      
      if (Date.now() >= expirationTime) {
        logout();
      } else {
        // Set timeout to logout when token expires
        const timeoutId = setTimeout(logout, expirationTime - Date.now());
        return () => clearTimeout(timeoutId);
      }
    }
  }, [token]);

  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!token && !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 