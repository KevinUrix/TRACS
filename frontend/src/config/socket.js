import { io } from 'socket.io-client';

// En el futuro cambiar por IP o URL
const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:3001');

export default socket;