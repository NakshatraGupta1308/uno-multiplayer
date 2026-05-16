package com.uno.service;

import com.uno.model.*;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class GameService {

    private final Map<String, GameState> gameStates = new HashMap<>();

    public GameState startGame(GameRoom room) {
        GameState state = new GameState();
        state.setRoomId(room.getId());
        state.setPlayers(new ArrayList<>(room.getPlayers()));

        List<Card> deck = buildDeck();
        Collections.shuffle(deck);

        // deal 7 cards to each player
        for (Player player : state.getPlayers()) {
            for (int i = 0; i < 7; i++) {
                player.getHand().add(deck.remove(0));
            }
        }

        // flip first card
        Card first = deck.remove(0);
        state.getDiscardPile().add(first);
        state.setCurrentColor(first.getColor());
        state.setDeck(deck);

        gameStates.put(room.getId(), state);
        return state;
    }

    public GameState getState(String roomId) {
        return gameStates.get(roomId);
    }

    public boolean isValidPlay(GameState state, Card card) {
        Card top = state.getTopCard();
        return card.getColor().equals("WILD")
                || card.getColor().equals(state.getCurrentColor())
                || card.getType().equals(top.getType())
                || (card.getType().equals("NUMBER") && card.getNumber() == top.getNumber());
    }

    public GameState playCard(String roomId, String playerId, String cardId, String chosenColor) {
        GameState state = gameStates.get(roomId);
        Player player = getCurrentPlayer(state, playerId);

        Card card = player.getHand().stream()
                .filter(c -> c.getId().equals(cardId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Card not found"));

        if (!isValidPlay(state, card)) throw new RuntimeException("Invalid play");

        player.getHand().remove(card);
        state.getDiscardPile().add(card);

        if (card.getColor().equals("WILD") && chosenColor != null) {
            state.setCurrentColor(chosenColor);
        } else {
            state.setCurrentColor(card.getColor());
        }

        if (player.getHand().isEmpty()) {
            state.setGameOver(true);
            state.setWinnerId(playerId);
            return state;
        }

        applyCardEffect(state, card);
        return state;
    }

    public GameState drawCard(String roomId, String playerId) {
        GameState state = gameStates.get(roomId);
        getCurrentPlayer(state, playerId);

        if (state.getDeck().isEmpty()) reshuffleDeck(state);
        Card drawn = state.getDeck().remove(0);

        state.getPlayers().stream()
                .filter(p -> p.getId().equals(playerId))
                .findFirst()
                .ifPresent(p -> p.getHand().add(drawn));

        advanceTurn(state, 1);
        return state;
    }

    private void applyCardEffect(GameState state, Card card) {
        switch (card.getType()) {
            case "SKIP" -> advanceTurn(state, 2);
            case "REVERSE" -> {
                state.setClockwise(!state.isClockwise());
                advanceTurn(state, 1);
            }
            case "DRAW_TWO" -> {
                int next = getNextIndex(state, 1);
                Player nextPlayer = state.getPlayers().get(next);
                for (int i = 0; i < 2; i++) nextPlayer.getHand().add(state.getDeck().remove(0));
                advanceTurn(state, 2);
            }
            case "WILD_DRAW_FOUR" -> {
                int next = getNextIndex(state, 1);
                Player nextPlayer = state.getPlayers().get(next);
                for (int i = 0; i < 4; i++) nextPlayer.getHand().add(state.getDeck().remove(0));
                advanceTurn(state, 2);
            }
            default -> advanceTurn(state, 1);
        }
    }

    private Player getCurrentPlayer(GameState state, String playerId) {
        Player current = state.getCurrentPlayer();
        if (!current.getId().equals(playerId)) throw new RuntimeException("Not your turn");
        return current;
    }

    private int getNextIndex(GameState state, int steps) {
        int size = state.getPlayers().size();
        int dir = state.isClockwise() ? 1 : -1;
        return (state.getCurrentPlayerIndex() + dir * steps % size + size) % size;
    }

    private void advanceTurn(GameState state, int steps) {
        state.setCurrentPlayerIndex(getNextIndex(state, steps));
    }

    private void reshuffleDeck(GameState state) {
        Card top = state.getTopCard();
        List<Card> newDeck = new ArrayList<>(state.getDiscardPile());
        newDeck.remove(top);
        Collections.shuffle(newDeck);
        state.setDeck(newDeck);
        state.getDiscardPile().clear();
        state.getDiscardPile().add(top);
    }

    private List<Card> buildDeck() {
        List<Card> deck = new ArrayList<>();
        String[] colors = {"RED", "GREEN", "BLUE", "YELLOW"};
        String[] actions = {"SKIP", "REVERSE", "DRAW_TWO"};
        int id = 0;

        for (String color : colors) {
            deck.add(new Card(String.valueOf(id++), color, "NUMBER", 0));
            for (int n = 1; n <= 9; n++) {
                deck.add(new Card(String.valueOf(id++), color, "NUMBER", n));
                deck.add(new Card(String.valueOf(id++), color, "NUMBER", n));
            }
            for (String action : actions) {
                deck.add(new Card(String.valueOf(id++), color, action, -1));
                deck.add(new Card(String.valueOf(id++), color, action, -1));
            }
        }

        for (int i = 0; i < 4; i++) {
            deck.add(new Card(String.valueOf(id++), "WILD", "WILD", -1));
            deck.add(new Card(String.valueOf(id++), "WILD", "WILD_DRAW_FOUR", -1));
        }

        return deck;
    }
}