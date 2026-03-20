import { io } from "socket.io-client";

// Connect to the same host that served the page, but on port 3000
const URL = `http://${window.location.hostname}:3000`;
export const socket = io(URL);
