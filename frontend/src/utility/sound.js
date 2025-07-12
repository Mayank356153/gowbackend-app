const playSound = (src) => {
  const audio = new Audio(src);
  audio.play().catch((e) => console.warn("Sound playback error", e));
};
 export default playSound