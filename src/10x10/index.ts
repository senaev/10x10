import {
    base64url,
    EncryptJWT,
    jwtDecrypt,
    JWTPayload,
} from 'jose';
import 'jquery.transit';
import { isPositiveInteger } from 'senaev-utils/src/utils/Number/PositiveInteger';
import { isObject } from 'senaev-utils/src/utils/Object/isObject/isObject';
import { isNonEmptyString } from 'senaev-utils/src/utils/String/NonEmptyString/NonEmptyString';

import { initPlayGamaBridge, PlayGamaBridge } from '../PlayGama/initPlayGamaBridge';
import { GlobalThis } from '../types/GlobalThis';
import { hintWebpackBuildTime } from '../utils/hintWebpackBuildTime';

import { TenOnTen, TenOnTenState } from './js/TenOnTen';

import './main.css';

hintWebpackBuildTime();

const container = document.getElementById('app');

if (!container) {
    throw new Error('Container not found');
}

type StateObject = {
    state: string;
};

const STORAGE_KEY = 's_t_y';
const SESSION_ENCRYPTION_SECRET = base64url.decode('111some111local111random111secret1123456789');
const encryptState = (state: TenOnTenState): Promise<string> => {
    const protectedHeader = {
        alg: 'dir',
        enc: 'A128CBC-HS256',
    };
    const stateString = JSON.stringify(state);
    const jwtPayload: StateObject = {
        state: stateString,
    } satisfies JWTPayload;

    return new EncryptJWT(jwtPayload)
        .setProtectedHeader(protectedHeader)
        .encrypt(SESSION_ENCRYPTION_SECRET);
};
const decryptState = async (stateString: string): Promise<StateObject | undefined> => {
    const { payload } = await jwtDecrypt(stateString, SESSION_ENCRYPTION_SECRET);

    if (!isObject(payload)) {
        return undefined;
    }

    const state = payload.state;
    if (!isNonEmptyString(state)) {
        return undefined;
    }

    return {
        state,
    };
};

function showAdAfterLevelComplete(bridge: PlayGamaBridge) {
    bridge.advertisement.showInterstitial();
}

function isValidTenOnTenState(state: unknown): state is TenOnTenState {
    return isObject(state) && isPositiveInteger(state.level) && isObject(state.current);
}

(async () => {
    const playGamaBridge = await initPlayGamaBridge();

    const encryptedState = await playGamaBridge.storage.get(STORAGE_KEY);

    let initialState: TenOnTenState | undefined;
    if (isNonEmptyString(encryptedState)) {
        const decryptedState = await decryptState(encryptedState);

        if (isObject(decryptedState)) {
            const state = decryptedState.state;
            if (isNonEmptyString(state)) {
                const stateObject = JSON.parse(state);

                if (isValidTenOnTenState(stateObject)) {
                    initialState = stateObject;
                }
            }
        }
    }

    // eslint-disable-next-line no-console
    console.log('initialState', initialState);

    const tenOnTen = new TenOnTen({
        container,
        initialState,
    });

    (window as GlobalThis & {
        tenOnTen: TenOnTen;
    }).tenOnTen = tenOnTen;

    const saveState = async () => {
        const encryptedStateNext: string = await encryptState(tenOnTen.getState());
        playGamaBridge.storage.set(STORAGE_KEY, encryptedStateNext);
    };

    tenOnTen.on('onAfterMove', saveState);
    tenOnTen.on('onAfterUndo', saveState);
    tenOnTen.on('onAfterNextLevelRefresh', saveState);
    tenOnTen.on('onAfterNextLevel', () => {
        saveState();

        // eslint-disable-next-line no-console
        console.log('showAdAfterLevelComplete');

        showAdAfterLevelComplete(playGamaBridge);
    });

    // playGamaBridge.game.on(playGamaBridge.EVENT_NAME.VISIBILITY_STATE_CHANGED, (nextState) => {
    //     // eslint-disable-next-line no-console
    //     console.log('Visibility state:', nextState);
    // });

    // // To track interstitial ad state changes, subscribe to the event
    // playGamaBridge.advertisement.on(
    //     playGamaBridge.EVENT_NAME.INTERSTITIAL_STATE_CHANGED,
    //     (state) => {
    //         // eslint-disable-next-line no-console
    //         console.log('Interstitial state: ', state);
    //     }
    // );

    // eslint-disable-next-line no-console
    console.log('App is ready', tenOnTen);
    playGamaBridge.platform.sendMessage('game_ready');
})()
    .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('App initialization failed', error);

        throw error;
    });
