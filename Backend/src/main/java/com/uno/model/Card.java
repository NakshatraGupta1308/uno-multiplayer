package com.uno.model;

public class Card {
    private String id;
    private String color;
    private String type;
    private int number;

    public Card(String id, String color, String type, int number) {
        this.id = id;
        this.color = color;
        this.type = type;
        this.number = number;
    }

    public String getId() { return id; }
    public String getColor() { return color; }
    public String getType() { return type; }
    public int getNumber() { return number; }
    public void setColor(String color) { this.color = color; }
}