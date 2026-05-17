
export const speak = (text: string, lang: string = 'fr-FR') => {
  if (!window.speechSynthesis) {
    console.error("Browser does not support SpeechSynthesis");
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  // Try to find a better voice if available
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(v => v.lang.startsWith(lang) && v.name.includes('Google')) || 
                    voices.find(v => v.lang.startsWith(lang)) ||
                    voices[0];
  
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  window.speechSynthesis.speak(utterance);
};

export const stopSpeaking = () => {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};
