import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';

/**
 * Hook personalizado para manejar conexiones WebSocket STOMP nativas y ultrarrápidas.
 * @param {string} topic - Tópico al cual suscribirse (ej: '/topic/asamblea/1/preguntas' o '/topic/quorum')
 * @param {function} onMessageReceived - Callback que se ejecuta al recibir un mensaje
 * @param {boolean} enabled - Permite activar/desactivar la conexión condicionalmente
 */
export function useWebSocket(topic, onMessageReceived, enabled = true) {
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef(null);

  useEffect(() => {
    if (!enabled || !topic) return;

    // Conexión WebSocket Nativa
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const wsUrl = `${protocol}//${host}:8080/ws-ph-raw`;

    const client = new Client({
      brokerURL: wsUrl,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        setIsConnected(true);

        client.subscribe(topic, (message) => {
          try {
            const body = JSON.parse(message.body);
            if (onMessageReceived) {
              onMessageReceived(body);
            }
          } catch (e) {
            // Ignorar errores de parseo silenciosamente
          }
        });
      },
      onDisconnect: () => {
        setIsConnected(false);
      }
    });

    client.activate();
    clientRef.current = client;

    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
      }
    };
  }, [topic, enabled]);

  return { isConnected };
}
