import { useState, useEffect, useCallback } from 'react';

export const useSSE = (url) => {
  const [messages, setMessages] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const connect = useCallback((body) => {
    setIsConnecting(true);
    setError(null);

    // Mocking SSE for the frontend demo since we don't have a real backend yet
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'agent', content: 'Merhaba! Ben VoiceCore AI asistanınızım. Size nasıl yardımcı olabilirim?' }]);
      setIsConnecting(false);
    }, 1000);
    
    /* Real implementation would look like:
    const eventSource = new EventSource(`${url}?prompt=${encodeURIComponent(body.prompt)}`);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages(prev => [...prev, data]);
    };
    
    eventSource.onerror = (err) => {
      setError('Connection lost');
      eventSource.close();
    };
    
    return () => eventSource.close();
    */
  }, [url]);

  const sendMessage = (msg) => {
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    
    // Mock response stream
    setIsConnecting(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'agent', content: 'Anladım, bu komutu işleme alıyorum...' }]);
      setIsConnecting(false);
    }, 1500);
  };

  return { messages, isConnecting, error, connect, sendMessage, setMessages };
};
