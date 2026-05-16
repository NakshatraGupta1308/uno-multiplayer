package com.uno.model;

import java.util.ArrayList;
import java.util.List;

public class GameRoom {
    private String id;
    private String name;
    private List<Player> players = new ArrayList<>();
    private boolean gameStarted = false;
    private int maxPlayers = 4;

    public GameRoom(String id, String name) {
        this.id = id;
        this.name = name;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public List<Player> getPlayers() { return players; }
    public boolean isGameStarted() { return gameStarted; }
    public void setGameStarted(boolean gameStarted) { this.gameStarted = gameStarted; }
    public boolean isFull() { return players.size() >= maxPlayers; }
}