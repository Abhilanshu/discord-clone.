import { Server as NetServer } from "http";
import { NextApiRequest } from "next";
import { Server as ServerIO } from "socket.io";
import { NextApiResponseServerIo } from "@/types";

export const config = {
    api: {
        bodyParser: false,
    },
};

// Use a global to persist the socket.io instance across HMR and module reloads
const globalForIO = globalThis as unknown as {
    _socketIO?: ServerIO;
    _onlineUsers?: Map<string, string>;
    _activeVoiceChannels?: Map<string, any[]>;
};

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIo) => {
    if (!res.socket.server.io) {
        const path = "/api/socket/io";
        console.log("[SOCKET_INIT] Setting up NEW socket.io server instance");
        const httpServer: NetServer = res.socket.server as any;

        // Close any existing socket.io server to prevent stale instances
        if (globalForIO._socketIO) {
            console.log("[SOCKET_INIT] Closing previous socket.io instance");
            globalForIO._socketIO.close();
        }

        const io = new ServerIO(httpServer, {
            path: path,
            addTrailingSlash: false,
            cors: {
                origin: "*",
                methods: ["GET", "POST"],
                credentials: true,
            },
            transports: ["polling", "websocket"],
            allowEIO3: true,
            pingTimeout: 60000,
            pingInterval: 25000,
        });

        // Use global maps so they survive hot-reloads
        const onlineUsers = globalForIO._onlineUsers || new Map<string, string>();
        const activeVoiceChannels = globalForIO._activeVoiceChannels || new Map<string, any[]>();

        globalForIO._socketIO = io;
        globalForIO._onlineUsers = onlineUsers;
        globalForIO._activeVoiceChannels = activeVoiceChannels;

        io.on("connection", (socket) => {
            console.log(`[SOCKET] ✅ New connection: ${socket.id}`);

            socket.on("userConnected", (userId: string) => {
                console.log(`[SOCKET_AUTH] ✅ Socket ${socket.id} → userId: ${userId}`);
                onlineUsers.set(socket.id, userId);
                const uniqueUsers = Array.from(new Set(onlineUsers.values()));
                console.log(`[SOCKET_AUTH] Online users (${uniqueUsers.length}): ${JSON.stringify(uniqueUsers)}`);
                io.emit("onlineUsers", uniqueUsers);
                const voiceMapData = Array.from(activeVoiceChannels.entries());
                socket.emit("voice:state", voiceMapData);
            });

            socket.on("typing", (data) => {
                socket.broadcast.emit(`typing:${data.room}`, data);
            });
            socket.on("stopTyping", (data) => {
                socket.broadcast.emit(`stopTyping:${data.room}`, data);
            });

            socket.on("disconnect", () => {
                const userId = onlineUsers.get(socket.id);
                console.log(`[SOCKET] ❌ Disconnected: ${socket.id} (userId: ${userId})`);
                onlineUsers.delete(socket.id);
                io.emit("onlineUsers", Array.from(new Set(onlineUsers.values())));

                let changedUrl = null;
                for (const [channelId, users] of activeVoiceChannels.entries()) {
                    const filtered = users.filter((u: any) => u.socketId !== socket.id);
                    if (filtered.length !== users.length) {
                        if (filtered.length === 0) {
                            activeVoiceChannels.delete(channelId);
                        } else {
                            activeVoiceChannels.set(channelId, filtered);
                        }
                        changedUrl = channelId;
                        break;
                    }
                }

                if (changedUrl) {
                    io.emit("voice:update", Array.from(activeVoiceChannels.entries()));
                }
            });

            // Voice Channel Tracking
            socket.on("voice:join", (data: { channelId: string, profile: any }) => {
                const channelId = data.channelId;
                const existingUsers = activeVoiceChannels.get(channelId) || [];
                if (!existingUsers.find((u: any) => u.id === data.profile.id)) {
                    const newUserConf = { ...data.profile, socketId: socket.id };
                    activeVoiceChannels.set(channelId, [...existingUsers, newUserConf]);
                    io.emit("voice:update", Array.from(activeVoiceChannels.entries()));
                }
            });

            socket.on("voice:leave", (data: { channelId: string, profileId: string }) => {
                const channelId = data.channelId;
                const existingUsers = activeVoiceChannels.get(channelId) || [];
                const filtered = existingUsers.filter((u: any) => u.id !== data.profileId);
                if (filtered.length === 0) {
                    activeVoiceChannels.delete(channelId);
                } else {
                    activeVoiceChannels.set(channelId, filtered);
                }
                io.emit("voice:update", Array.from(activeVoiceChannels.entries()));
            });

            // =========== CALL ORCHESTRATION ===========
            socket.on("call:initiate", (data: { targetUserId: string, callInfo: any }) => {
                console.log(`[CALL] ========================================`);
                console.log(`[CALL] 📞 CALL INITIATED from socket ${socket.id}`);
                console.log(`[CALL] Target userId: ${data.targetUserId}`);
                console.log(`[CALL] All online sockets: ${JSON.stringify(Array.from(onlineUsers.entries()))}`);

                let found = false;
                for (const [sId, userId] of onlineUsers.entries()) {
                    if (userId === data.targetUserId) {
                        console.log(`[CALL] ✅ MATCH FOUND! Sending call:incoming to socket ${sId}`);
                        io.to(sId).emit("call:incoming", data.callInfo);
                        found = true;
                    }
                }

                if (!found) {
                    console.log(`[CALL] ❌ TARGET NOT FOUND in online users!`);
                    console.log(`[CALL] Available userIds: ${JSON.stringify(Array.from(new Set(onlineUsers.values())))}`);
                }
                console.log(`[CALL] ========================================`);
            });

            socket.on("call:accept", (data: { targetUserId: string, callInfo: any }) => {
                for (const [sId, userId] of onlineUsers.entries()) {
                    if (userId === data.targetUserId) {
                        io.to(sId).emit("call:accepted", data.callInfo);
                    }
                }
            });

            socket.on("call:decline", (data: { targetUserId: string }) => {
                for (const [sId, userId] of onlineUsers.entries()) {
                    if (userId === data.targetUserId) {
                        io.to(sId).emit("call:declined");
                    }
                }
            });

            socket.on("call:cancel", (data: { targetUserId: string }) => {
                for (const [sId, userId] of onlineUsers.entries()) {
                    if (userId === data.targetUserId) {
                        io.to(sId).emit("call:cancelled");
                    }
                }
            });
        });

        res.socket.server.io = io;
    } else {
        console.log("[SOCKET_INIT] Socket.io server already running, reusing existing instance");
    }
    res.end();
};

export default ioHandler;
