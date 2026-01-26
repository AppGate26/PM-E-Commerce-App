package com.appGate.settings.enums;

public enum CurrencyEnum {
    NGN("Naira", "₦"),
    BHD("Dinar", "د.ب"),
    GBP("Pound", "£"),
    CHF("Franc", "CHF"),
    EUR("Euro", "€"),
    USD("Dollar", "$"),
    XOF("CFA Franc", "CFA"),
    RUB("Rouble", "₽");

    private final String displayName;
    private final String symbol;

    CurrencyEnum(String displayName, String symbol) {
        this.displayName = displayName;
        this.symbol = symbol;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getSymbol() {
        return symbol;
    }
}
