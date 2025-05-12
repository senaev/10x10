import { UnixTimeMs } from 'senaev-utils/src/types/Time/UnixTimeMs';

import { PlayGamaBridgeEventName, PlayGamaBridgeEventNames } from './types/PlayGamaBridgeEventNames';
import { PlayGamaBridgePlatform } from './types/PlayGamaBridgePlatforms';
import { PlayGamaBridgeStorage, PlayGamaBridgeStorageType } from './types/PlayGamaBridgeStorage';
import { PlayGamaGame } from './types/PlayGamaGame';
import { PlayGamaMessage } from './types/PlayGamaMessages';

export type PlayGamaBridge = {
    initialize: () => Promise<void>;
    platform: {
        id: PlayGamaBridgePlatform;
        sdk: null;
        language: 'en' | 'ru';
        payload: null;
        tld: null;
        isGetAllGamesSupported: boolean;
        isGetGameByIdSupported: boolean;
        getAllGames: () => Promise<PlayGamaGame[]>;
        getGameById: (options: {
            gameId: string;
        }) => Promise<PlayGamaGame>;
        sendMessage: (message: PlayGamaMessage) => void;
        getServerTime: () => Promise<UnixTimeMs>;
    };
    game: {
        visibilityState: 'visible' | 'hidden';
        on: <T extends PlayGamaBridgeEventName>(event: T, callback: (state: PlayGamaBridgeEventNames[T]) => void) => void;
    };
    EVENT_NAME: {
        VISIBILITY_STATE_CHANGED: 'visibility_state_changed';
    };
    STORAGE_TYPE: Record<string, PlayGamaBridgeStorageType>;
    storage: PlayGamaBridgeStorage;
    advertisement: {
        isBannerSupported: boolean;
        showBanner: (options: unknown) => void;
        checkAdBlock: () => boolean;
    };
    device: {
        type: 'mobile' | 'tablet' | 'desktop' | 'tv';
    };
    player: {
        isAuthorizationSupported: boolean;
        isAuthorized: boolean;
        id: string | null;
        name: string | null;
        photos: unknown[];
        authorize: () => Promise<void>;
    };
};

declare const bridge: PlayGamaBridge;

export async function initPlayGamaBridge(): Promise<PlayGamaBridge> {
    await bridge.initialize();

    // eslint-disable-next-line no-console
    console.log('PlayGamaBridge initialized', bridge);

    return bridge;
}
