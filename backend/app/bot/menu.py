"""Main menu keyboard and constants for the KalaSetu Telegram Bot."""

from telegram import KeyboardButton, ReplyKeyboardMarkup

MENU_BROWSE    = "🔍 Browse Crafts"
MENU_SELL      = "🎨 Sell Your Work"
MENU_CART      = "🛒 My Cart"
MENU_ORDERS    = "📦 My Orders"
MENU_DASHBOARD = "📊 Dashboard"

MENU_COMMANDS = {MENU_BROWSE, MENU_SELL, MENU_CART, MENU_ORDERS, MENU_DASHBOARD}


def main_menu_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        [
            [KeyboardButton(MENU_BROWSE), KeyboardButton(MENU_SELL)],
            [KeyboardButton(MENU_CART),   KeyboardButton(MENU_ORDERS)],
            [KeyboardButton(MENU_DASHBOARD)],
        ],
        resize_keyboard=True,
        is_persistent=True,
    )
