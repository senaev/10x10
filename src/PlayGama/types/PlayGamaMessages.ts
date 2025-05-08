export type PlayGamaMessages = {
    /**
     * The game has loaded, all loading screens have passed, the player can interact with the game.
     */
    game_ready: void;
    /**
     * Any loading within the game has started. For example, when a level is loading.
     */
    in_game_loading_started: void;
    /**
     * In-game loading has finished.
     */
    in_game_loading_stopped: void;
    /**
     * Gameplay has started. For example, the player has entered a level from the main menu.
     */
    gameplay_started: void;
    /**
     * Gameplay has ended/paused. For example, when exiting a level to the main menu, opening the pause menu, etc.
     */
    gameplay_stopped: void;
    /**
     * The player reached a significant moment. For example, defeating a boss, setting a record, etc.
     */
    player_got_achievement: void;
};

export type PlayGamaMessage = keyof PlayGamaMessages;
