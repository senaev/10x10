export type PlayGamaBridgeVisibilityStates = {
    visible: void;
    hidden: void;
};

export type PlayGamaBridgeVisibilityState = keyof PlayGamaBridgeVisibilityStates;

export type PlayGamaBridgeEventNames = {
    banner_state_changed: PlayGamaBridgeVisibilityStates;
    interstitial_state_changed: unknown;
    rewarded_state_changed: unknown;
    visibility_state_changed: PlayGamaBridgeVisibilityStates;
};

export type PlayGamaBridgeEventName = keyof PlayGamaBridgeEventNames;
