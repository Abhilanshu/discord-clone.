"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    useRef,
} from "react";
import { io as ClientIO, Socket } from "socket.io-client";

import { useAuth } from "@clerk/nextjs";

type SocketContextType = {
    socket: Socket | null;
    isConnected: boolean;
    onlineUsers: string[];
    activeVoiceChannels: Map<string, any[]>;
};

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
    onlineUsers: [],
    activeVoiceChannels: new Map(),
});

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
    const [activeVoiceChannels, setActiveVoiceChannels] = useState<Map<string, any[]>>(new Map());
    const { userId } = useAuth();
    const userIdRef = useRef(userId);

    // Keep ref in sync
    useEffect(() => {
        userIdRef.current = userId;
    }, [userId]);

    useEffect(() => {
        const socketInstance = ClientIO(window.location.origin, {
            path: "/api/socket/io",
            addTrailingSlash: false,
            // Use polling first, then upgrade — more reliable through tunnels/proxies
            transports: ["polling", "websocket"],
            upgrade: true,
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
        });

        socketInstance.on("connect", () => {
            console.log("[SOCKET_CLIENT] Connected:", socketInstance.id);
            setIsConnected(true);
            // Immediately emit userConnected if userId is already available
            if (userIdRef.current) {
                console.log("[SOCKET_CLIENT] Emitting userConnected:", userIdRef.current);
                socketInstance.emit("userConnected", userIdRef.current);
            }
        });

        socketInstance.on("disconnect", () => {
            console.log("[SOCKET_CLIENT] Disconnected");
            setIsConnected(false);
        });

        socketInstance.on("reconnect", () => {
            console.log("[SOCKET_CLIENT] Reconnected:", socketInstance.id);
            if (userIdRef.current) {
                socketInstance.emit("userConnected", userIdRef.current);
            }
        });

        socketInstance.on("onlineUsers", (users: string[]) => {
            setOnlineUsers(users);
        });

        socketInstance.on("voice:state", (data: [string, any[]][]) => {
            if (data && Array.isArray(data)) {
                setActiveVoiceChannels(new Map(data));
            }
        });

        socketInstance.on("voice:update", (data: [string, any[]][]) => {
            if (data && Array.isArray(data)) {
                setActiveVoiceChannels(new Map(data));
            }
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    // Re-emit userConnected whenever userId becomes available or socket reconnects
    useEffect(() => {
        if (socket && isConnected && userId) {
            console.log("[SOCKET_CLIENT] (effect) Emitting userConnected:", userId);
            socket.emit("userConnected", userId);
        }
    }, [socket, isConnected, userId]);

    return (
        <SocketContext.Provider value={{ socket, isConnected, onlineUsers, activeVoiceChannels }}>
            {children}
        </SocketContext.Provider>
    );
};
