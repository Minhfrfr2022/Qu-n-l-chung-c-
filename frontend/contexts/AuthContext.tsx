"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthContextType, AuthState, LoginCredentials, User, UserRole } from "@/types/auth";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      
      // Set a timeout for the profile fetch (reduced to 3 seconds)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Profile fetch timeout'));
        }, 3000);
      });
      
      const fetchPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single(); // Use single() instead of limit(1) for better error handling
      
      // Race between fetch and timeout
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (error) {
        console.error('Error fetching profile:', error.message || error);
        
        // If it's just missing profile, create a minimal user object
        // Get the email from Supabase auth
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (authUser) {
          console.log('Auth user metadata:', authUser.user_metadata);
          console.log('Auth user email:', authUser.email);
          
          // Try to determine role from email or metadata
          let role = UserRole.USER; // Default role
          if (authUser.user_metadata?.role) {
            role = authUser.user_metadata.role as UserRole;
          } else if (authUser.email?.includes('admin')) {
            role = UserRole.ADMIN;
          } else if (authUser.email?.includes('manager')) {
            role = UserRole.MANAGER;
          }
          
          // Create a minimal user object to keep them logged in
          const user: User = {
            id: userId,
            username: authUser.email?.split('@')[0] || 'user',
            email: authUser.email || '',
            role: role,
            fullName: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
            apartmentNumber: authUser.user_metadata?.apartment_number,
          };

          console.log('Created user from auth data with role:', role);
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
          
          console.warn('Profile not found in database, using auth data. Please create profile in database.');
          return;
        }
        
        // If we can't get auth user either, then logout
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return;
      }

      if (data) {
        const user: User = {
          id: data.id,
          username: data.username,
          email: data.email,
          role: data.role as UserRole,
          fullName: data.full_name,
          apartmentNumber: data.apartment_number,
        };

        console.log('Profile loaded successfully:', user.username);
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        // No profile found, use auth data as fallback
        console.warn('No profile data returned, using auth fallback');
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (authUser) {
          // Try to determine role from email or metadata
          let role = UserRole.USER;
          if (authUser.user_metadata?.role) {
            role = authUser.user_metadata.role as UserRole;
          } else if (authUser.email?.includes('admin')) {
            role = UserRole.ADMIN;
          } else if (authUser.email?.includes('manager')) {
            role = UserRole.MANAGER;
          }
          
          const user: User = {
            id: userId,
            username: authUser.email?.split('@')[0] || 'user',
            email: authUser.email || '',
            role: role,
            fullName: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
            apartmentNumber: authUser.user_metadata?.apartment_number,
          };

          console.log('Using auth fallback with role:', role);
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
          console.warn('Using auth data as fallback. Please create profile in database.');
        } else {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      }
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      
      // Even on error, try to keep user logged in with auth data
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        // Try to determine role from email or metadata
        let role = UserRole.USER;
        if (authUser.user_metadata?.role) {
          role = authUser.user_metadata.role as UserRole;
        } else if (authUser.email?.includes('admin')) {
          role = UserRole.ADMIN;
        } else if (authUser.email?.includes('manager')) {
          role = UserRole.MANAGER;
        }
        
        const user: User = {
          id: authUser.id,
          username: authUser.email?.split('@')[0] || 'user',
          email: authUser.email || '',
          role: role,
          fullName: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
          apartmentNumber: authUser.user_metadata?.apartment_number,
        };

        console.log('Error recovery: using auth data with role:', role);
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    let mounted = true;
    
    // Check current session from Supabase
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (session?.user) {
          console.log('Session found, fetching profile');
          // Store the token for backend API calls
          if (session.access_token) {
            localStorage.setItem("token", session.access_token);
          }
          await fetchUserProfile(session.user.id);
        } else {
          console.log('No session found');
          localStorage.removeItem("token");
          setAuthState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setAuthState((prev) => ({ ...prev, isLoading: false }));
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (!mounted) return;
      
      // Only handle SIGNED_OUT event here
      // SIGNED_IN is handled by login function
      // INITIAL_SESSION is handled by initializeAuth
      if (event === 'SIGNED_OUT' || (!session && event !== 'INITIAL_SESSION')) {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
      // Ignore TOKEN_REFRESHED and other events to prevent unnecessary refetches
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      console.log('Attempting login...');
      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.username, // Use email directly
        password: credentials.password,
      });

      if (error) {
        console.error('Auth error:', error);
        throw error;
      }

      console.log('Auth successful');

      if (data.user && data.session) {
        // Store the access token in localStorage for backend API calls
        localStorage.setItem("token", data.session.access_token);
        
        // Fetch profile (already has timeout built-in)
        await fetchUserProfile(data.user.id);
        console.log('Profile fetch completed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Tên đăng nhập hoặc mật khẩu không đúng');
    }
  };

  const logout = async () => {
    try {
      console.log('Logging out...');
      // Remove token from localStorage
      localStorage.removeItem("token");
      
      // Set state immediately to prevent race conditions
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      // Then sign out from Supabase
      await supabase.auth.signOut();
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
      // Ensure state is cleared even on error
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const hasPermission = (allowedRoles: UserRole[]): boolean => {
    if (!authState.user) return false;
    return allowedRoles.includes(authState.user.role);
  };

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
