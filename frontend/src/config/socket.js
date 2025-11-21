import { io } from 'socket.io-client';

const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001', {
  path: process.env.REACT_APP_SOCKET_PATH || '/socket.io',
  withCredentials: true,
});

export default socket;