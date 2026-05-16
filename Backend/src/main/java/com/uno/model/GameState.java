package com.uno.model;

import java.util.ArrayList;
import java.util.List;

public class GameState {
    private String roomId;
    private List<Player> players = new ArrayList<>();
    private List<Card> deck = new ArrayList<>();
    private List<Card> discardPile = new ArrayList<>();
    private int currentPlayerIndex = 0;
    private boolean clockwise = true;
    private String currentColor;
    private boolean gameOver = false;
    private String winnerId;

    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }
    public List<Player> getPlayers() { return players; }
    public void setPlayers(List<Player> players) { this.players = players; }
    public List<Card> getDeck() { return deck; }
    public void setDeck(List<Card> deck) { this.deck = deck; }
    public List<Card> getDiscardPile() { return discardPile; }
    public int getCurrentPlayerIndex() { return currentPlayerIndex; }
    public void setCurrentPlayerIndex(int i) { this.currentPlayerIndex = i; }
    public boolean isClockwise() { return clockwise; }
    public void setClockwise(boolean clockwise) { this.clockwise = clockwise; }
    public String getCurrentColor() { return currentColor; }
    public void setCurrentColor(String currentColor) { this.currentColor = currentColor; }
    public boolean isGameOver() { return gameOver; }
    public void setGameOver(boolean gameOver) { this.gameOver = gameOver; }
    public String getWinnerId() { return winnerId; }
    public void setWinnerId(String winnerId) { this.winnerId = winnerId; }

    public Player getCurrentPlayer() { return players.get(currentPlayerIndex); }
    public Card getTopCard() { return discardPile.get(discardPile.size() - 1); }
}