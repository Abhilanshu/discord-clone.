import fs from "fs";
import path from "path";

const LOG_FILE = path.join(process.cwd(), "debug.log");

export function logToDebug(message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] ${message} ${data ? JSON.stringify(data) : ""}\n`;
    fs.appendFileSync(LOG_FILE, formattedMessage);
}
