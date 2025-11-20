import React, { createContext, useContext, useEffect, useState } from "react";


type Session = {
locationId: string | null;
technicianId: string | null;
technicianName: string | null;
};


type SessionContextType = {
session: Session;
setSession: (s: Session) => void;
clearTechnician: () => void;
clearAll: () => void;
};


const defaultSession: Session = {
locationId: null,
technicianId: null,
technicianName: null,
};


const SessionContext = createContext<SessionContextType | undefined>(undefined);


export const UserSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
const [session, setSessionState] = useState<Session>(defaultSession);


useEffect(() => {
const stored = localStorage.getItem("userSession");
if (stored) setSessionState(JSON.parse(stored));
}, []);


const setSession = (s: Session) => {
localStorage.setItem("userSession", JSON.stringify(s));
setSessionState(s);
};


const clearTechnician = () => {
const updated = { ...session, technicianId: null, technicianName: null };
localStorage.setItem("userSession", JSON.stringify(updated));
setSessionState(updated);
};


const clearAll = () => {
localStorage.removeItem("userSession");
setSessionState(defaultSession);
};


return (
<SessionContext.Provider value={{ session, setSession, clearTechnician, clearAll }}>
{children}
</SessionContext.Provider>
);
};


export const useUserSession = () => {
const ctx = useContext(SessionContext);
if (!ctx) throw new Error("useUserSession must be used within UserSessionProvider");
return ctx;
};