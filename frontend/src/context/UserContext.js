import React, { createContext, useState, useEffect, useRef } from "react";

export const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [showIdlePopup, setShowIdlePopup] = useState(false);
  const [loading, setLoading] = useState(true);
  const idleTimer = useRef(null);
  const idleTimeLimit = 5 * 60 * 1000; // 5 minutes

  // ✅ Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
    setLoading(false);
    startIdleTimer();
  }, []);

  // ✅ Login function
  const loginUser = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", userData.access_token);
    setUser(userData);
    resetIdleTimer();
  };

  // ✅ Logout function
  const logoutUser = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setShowIdlePopup(false);
    clearTimeout(idleTimer.current);
  };

  // ✅ Start idle timer
  const startIdleTimer = () => {
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      // only show popup if user is logged in
      if (user) setShowIdlePopup(true);
    }, idleTimeLimit);
  };

  // ✅ Reset idle timer only if popup is not open
  const resetIdleTimer = () => {
    if (showIdlePopup) return; // 
    startIdleTimer();
  };

  // ✅ Detect user activity
  useEffect(() => {
    const handleActivity = () => resetIdleTimer();

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keypress", handleActivity);
    window.addEventListener("scroll", handleActivity);
    window.addEventListener("click", handleActivity);

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keypress", handleActivity);
      window.removeEventListener("scroll", handleActivity);
      window.removeEventListener("click", handleActivity);
    };
  }, [showIdlePopup]); // depend on popup state

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        loginUser,
        logoutUser,
        showIdlePopup,
        setShowIdlePopup,
        resetIdleTimer,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
