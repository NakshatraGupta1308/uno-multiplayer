package com.uno.controller;

import com.uno.model.*;
import com.uno.service.GameService;
import com.uno.service.RoomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.Map;

@Controller
public class GameController {

    @Autowired
    private SimpMessagingTemplate messaging;

    @Autowired
    private RoomService roomService;

    @Autowired
    private GameService gameService;

    @MessageMapping("/lobby.getRooms")
    public void getRooms(@Payload Map<String, String> payload) {
        List<GameRoom> rooms = roomService.getAvailableRooms();
        messaging.convertAndSend("/topic/lobby", rooms);
    }

    @MessageMapping("/lobby.createRoom")
    public void createRoom(@Payload Map<String, String> payload) {
        GameRoom room = roomService.createRoom(
                payload.get("roomName"),
                payload.get("playerId"),
                payload.get("playerName")
        );
        messaging.convertAndSend("/topic/lobby", roomService.getAvailableRooms());
        messaging.convertAndSend("/topic/room/" + room.getId(), room);
    }

    @MessageMapping("/lobby.joinRoom")
    public void joinRoom(@Payload Map<String, String> payload) {
        GameRoom room = roomService.joinRoom(
                payload.get("roomId"),
                payload.get("playerId"),
                payload.get("playerName")
        );
        messaging.convertAndSend("/topic/room/" + room.getId(), room);
        messaging.convertAndSend("/topic/lobby", roomService.getAvailableRooms());
    }

    @MessageMapping("/game.start")
    public void startGame(@Payload Map<String, String> payload) {
        String roomId = payload.get("roomId");
        GameRoom room = roomService.getRoom(roomId);
        room.setGameStarted(true);
        GameState state = gameService.startGame(room);
        messaging.convertAndSend("/topic/game/" + roomId, state);
    }

    @MessageMapping("/game.playCard")
    public void playCard(@Payload Map<String, String> payload) {
        GameState state = gameService.playCard(
                payload.get("roomId"),
                payload.get("playerId"),
                payload.get("cardId"),
                payload.get("chosenColor")
        );
        messaging.convertAndSend("/topic/game/" + payload.get("roomId"), state);
    }

    @MessageMapping("/game.drawCard")
    public void drawCard(@Payload Map<String, String> payload) {
        GameState state = gameService.drawCard(
                payload.get("roomId"),
                payload.get("playerId")
        );
        messaging.convertAndSend("/topic/game/" + payload.get("roomId"), state);
    }
}