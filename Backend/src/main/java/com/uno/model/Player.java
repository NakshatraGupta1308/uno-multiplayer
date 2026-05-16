package com.uno.model;

import java.util.ArrayList;
import java.util.List;

public class Player {
    private String id;
    private String name;
    private List<Card> hand = new ArrayList<>();
    private boolean saidUno = false;

    public Player(String id, String name) {
        this.id = id;
        this.name = name;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public List<Card> getHand() { return hand; }
    public boolean isSaidUno() { return saidUno; }
    public void setSaidUno(boolean saidUno) { this.saidUno = saidUno; }
}