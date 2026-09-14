// server/index.js
// ES Module entry point for Docker / Portainer / Node environments
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const distServer = path.resolve(__dirname, '../dist/server.cjs');

if (fs.existsSync(distServer)) {
  // Built production bundle exists, execute bundled server
  require(distServer);
} else {
  // Standalone fallback: start Express + WebSocket server directly
  const PORT = 3000;
  const app = express();
  app.use(express.json());

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  const rooms = new Map();
  rooms.set('room_beach_fun', {
    id: 'room_beach_fun',
    name: 'Päikeseranna Karikas 🏆',
    trackId: 'sunny_beach',
    laps: 3,
    maxPlayers: 6,
    players: [],
    state: 'waiting',
  });
  rooms.set('room_spooky_derby', {
    id: 'room_spooky_derby',
    name: 'Kummituslossi Ralli 👻',
    trackId: 'spooky_castle',
    laps: 3,
    maxPlayers: 6,
    players: [],
    state: 'waiting',
  });

  app.get('/api/rooms', (req, res) => {
    const list = Array.from(rooms.values()).map(r => ({
      id: r.id,
      name: r.name,
      trackId: r.trackId,
      laps: r.laps,
      maxPlayers: r.maxPlayers,
      state: r.state,
      playerCount: r.players.length,
    }));
    res.json(list);
  });

  app.post('/api/rooms', (req, res) => {
    const { name, trackId, laps, maxPlayers } = req.body;
    const id = `room_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newRoom = {
      id,
      name: name || 'Uus Võidusõit',
      trackId: trackId || 'sunny_beach',
      laps: laps || 3,
      maxPlayers: maxPlayers || 6,
      players: [],
      state: 'waiting',
    };
    rooms.set(id, newRoom);
    res.json(newRoom);
  });

  function broadcastToRoom(roomId, message, excludeWs) {
    const room = rooms.get(roomId);
    if (!room) return;
    const data = JSON.stringify(message);
    room.players.forEach(p => {
      if (p.ws && p.ws !== excludeWs && p.ws.readyState === WebSocket.OPEN) {
        p.ws.send(data);
      }
    });
  }

  wss.on('connection', (ws) => {
    let currentRoomId = null;
    let currentPlayerId = null;

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'join_room') {
          const { roomId, player } = msg;
          const room = rooms.get(roomId);
          if (!room) {
            ws.send(JSON.stringify({ type: 'error', message: 'Tuba ei leitud!' }));
            return;
          }
          if (room.players.length >= room.maxPlayers) {
            ws.send(JSON.stringify({ type: 'error', message: 'Tuba on täis!' }));
            return;
          }
          currentRoomId = roomId;
          currentPlayerId = player.id;
          const isHost = room.players.length === 0;
          const newPlayer = {
            id: player.id,
            name: player.name,
            carId: player.carId,
            color: player.color,
            isReady: isHost,
            isHost,
            ws,
          };
          room.players = room.players.filter(p => p.id !== player.id);
          room.players.push(newPlayer);
          ws.send(JSON.stringify({
            type: 'room_joined',
            room: {
              id: room.id,
              name: room.name,
              trackId: room.trackId,
              laps: room.laps,
              maxPlayers: room.maxPlayers,
              state: room.state,
              players: room.players.map(p => ({
                id: p.id,
                name: p.name,
                carId: p.carId,
                color: p.color,
                isReady: p.isReady,
                isHost: p.isHost,
              })),
            },
            yourId: player.id,
          }));
          broadcastToRoom(roomId, {
            type: 'player_joined',
            player: {
              id: newPlayer.id,
              name: newPlayer.name,
              carId: newPlayer.carId,
              color: newPlayer.color,
              isReady: newPlayer.isReady,
              isHost: newPlayer.isHost,
            },
          }, ws);
        } else if (msg.type === 'toggle_ready') {
          if (!currentRoomId) return;
          const room = rooms.get(currentRoomId);
          if (!room) return;
          const p = room.players.find(x => x.id === currentPlayerId);
          if (p) {
            p.isReady = !p.isReady;
            broadcastToRoom(currentRoomId, {
              type: 'player_ready_changed',
              playerId: p.id,
              isReady: p.isReady,
            });
          }
        } else if (msg.type === 'change_car') {
          if (!currentRoomId) return;
          const room = rooms.get(currentRoomId);
          if (!room) return;
          const p = room.players.find(x => x.id === currentPlayerId);
          if (p) {
            p.carId = msg.carId;
            p.color = msg.color;
            broadcastToRoom(currentRoomId, {
              type: 'player_car_changed',
              playerId: p.id,
              carId: msg.carId,
              color: msg.color,
            });
          }
        } else if (msg.type === 'start_race') {
          if (!currentRoomId) return;
          const room = rooms.get(currentRoomId);
          if (!room) return;
          const host = room.players.find(x => x.id === currentPlayerId && x.isHost);
          if (host) {
            room.state = 'racing';
            broadcastToRoom(currentRoomId, {
              type: 'race_started',
              trackId: room.trackId,
              laps: room.laps,
              players: room.players.map(p => ({
                id: p.id,
                name: p.name,
                carId: p.carId,
                color: p.color,
                isAI: false,
              })),
            });
          }
        } else if (msg.type === 'racer_sync') {
          if (currentRoomId) {
            broadcastToRoom(currentRoomId, { type: 'racer_sync', state: msg.state }, ws);
          }
        } else if (msg.type === 'fire_powerup') {
          if (currentRoomId) {
            broadcastToRoom(currentRoomId, {
              type: 'fire_powerup',
              powerup: msg.powerup,
              racerId: currentPlayerId,
            }, ws);
          }
        } else if (msg.type === 'chat_message') {
          if (currentRoomId) {
            broadcastToRoom(currentRoomId, {
              type: 'chat_message',
              sender: msg.sender,
              text: msg.text,
            });
          }
        }
      } catch (err) {
        console.error('WS error:', err);
      }
    });

    ws.on('close', () => {
      if (currentRoomId && currentPlayerId) {
        const room = rooms.get(currentRoomId);
        if (room) {
          room.players = room.players.filter(p => p.id !== currentPlayerId);
          if (room.players.length === 0) {
            room.state = 'waiting';
          } else {
            if (!room.players.some(p => p.isHost)) {
              room.players[0].isHost = true;
            }
            broadcastToRoom(currentRoomId, {
              type: 'player_left',
              playerId: currentPlayerId,
              newHostId: room.players[0]?.id,
            });
          }
        }
      }
    });
  });

  const distPath = path.resolve(__dirname, '../dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🏁 Toon Car Racing Server running on http://0.0.0.0:${PORT}`);
  });
}
