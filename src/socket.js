import { io } from 'socket.io-client';

// En el futuro cambiar por IP o URL
const socket = io('http://localhost:3002');

export default socket;
