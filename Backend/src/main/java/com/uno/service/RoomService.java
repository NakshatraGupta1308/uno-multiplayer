package com.uno.service;

import com.uno.model.GameRoom;
import com.uno.model.Player;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class RoomService {

    private final Map<String, GameRoom> rooms = new HashMap<>();

    public GameRoom createRoom(String roomName, String playerId, String playerName) {
        String roomId = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        GameRoom room = new GameRoom(roomId, roomName);
        room.getPlayers().add(new Player(playerId, playerName));
        rooms.put(roomId, room);
        return room;
    }

    public GameRoom joinRoom(String roomId, String playerId, String playerName) {
        GameRoom room = rooms.get(roomId);
        if (room == null) throw new RuntimeException("Room not found");
        if (room.isFull()) throw new RuntimeException("Room is full");
        if (room.isGameStarted()) throw new RuntimeException("Game already started");
        room.getPlayers().add(new Player(playerId, playerName));
        return room;
    }

    public GameRoom getRoom(String roomId) {
        return rooms.get(roomId);
    }

    public List<GameRoom> getAvailableRooms() {
        return rooms.values().stream()
                .filter(r -> !r.isGameStarted() && !r.isFull())
                .toList();
    }

    public void removePlayer(String roomId, String playerId) {
        GameRoom room = rooms.get(roomId);
        if (room != null) {
            room.getPlayers().removeIf(p -> p.getId().equals(playerId));
            if (room.getPlayers().isEmpty()) rooms.remove(roomId);
        }
    }
}