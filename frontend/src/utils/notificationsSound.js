const audio = new Audio('notification.mp3');
audio.volume = 0.4;

export const playNotificationSound = () => {
  audio.currentTime = 0;
  audio.play().catch((err) => console.error(err.message));
};
