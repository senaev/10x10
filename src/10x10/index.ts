import 'jquery.transit';
import { MILLISECONDS_IN_MINUTE, MILLISECONDS_IN_SECOND } from 'senaev-utils/src/types/Time/const';
import { promiseTimeout } from 'senaev-utils/src/utils/timers/promiseTimeout/promiseTimeout';

import { initPlayGamaBridge, PlayGamaBridge } from '../PlayGama/initPlayGamaBridge';
import { GlobalThis } from '../types/GlobalThis';
import { hintWebpackBuildTime } from '../utils/hintWebpackBuildTime';

import { STORAGE_KEY } from './const/STORAGE_KEY';
import { TenOnTen } from './js/TenOnTen';
import './main.css';
import {
    encryptTenOnTenState, loadSavedTenOnTenInitialState,
} from './utils/loadSavedTenOnTenInitialState';

hintWebpackBuildTime();

const container = document.getElementById('app-container');

if (!container) {
    throw new Error('Container not found');
}

let lastShownInterstitialTime = 0;
const MIN_TIME_BETWEEN_ADS = MILLISECONDS_IN_MINUTE;
function showInterstitial(playGamaBridge: PlayGamaBridge) {
    const now = Date.now();
    const timeSinceAd = now - lastShownInterstitialTime;
    if (timeSinceAd < MIN_TIME_BETWEEN_ADS) {
        // eslint-disable-next-line no-console
        console.log(`Do not show interstitial because of timeSinceAd=[${timeSinceAd}] < MIN_TIME_BETWEEN_ADS=[${MIN_TIME_BETWEEN_ADS}]`);
        return;
    }

    lastShownInterstitialTime = now;

    const isMockEnv = playGamaBridge.platform.id === 'mock';
    if (isMockEnv) {
        alert('showInterstitial');
        return;
    }

    playGamaBridge.advertisement.showInterstitial();
}

(async () => {
    const playGamaBridge = await initPlayGamaBridge();

    const isMockEnv = playGamaBridge.platform.id === 'mock';

    const initialState = await loadSavedTenOnTenInitialState({ playGamaBridge });

    const tenOnTen = new TenOnTen({
        container,
        initialState,
    });

    (window as GlobalThis & {
        tenOnTen: TenOnTen;
    }).tenOnTen = tenOnTen;

    const saveState = async () => {
        const encryptedStateNext: string = await encryptTenOnTenState(tenOnTen.getState());
        playGamaBridge.storage.set([STORAGE_KEY], [encryptedStateNext]);

    };

    tenOnTen.on('onAfterMove', saveState);
    tenOnTen.on('onAfterUndo', saveState);
    tenOnTen.on('onAfterNextLevelRefresh', saveState);
    tenOnTen.on('onAfterNewGameStarted', async () => {
        saveState();

        // eslint-disable-next-line no-console
        console.log('show ad onAfterNewGameStarted');
        await promiseTimeout(MILLISECONDS_IN_SECOND);
        showInterstitial(playGamaBridge);
    });
    tenOnTen.on('onAfterOpenMenu', async () => {
        // eslint-disable-next-line no-console
        console.log('show ad onAfterOpenMenu');
        await promiseTimeout(MILLISECONDS_IN_SECOND);
        showInterstitial(playGamaBridge);
    });
    tenOnTen.on('onAfterNextLevel', async () => {
        saveState();

        // eslint-disable-next-line no-console
        console.log('show ad onAfterNextLevel');
        await promiseTimeout(MILLISECONDS_IN_SECOND);
        showInterstitial(playGamaBridge);
    });

    if (!isMockEnv) {
        playGamaBridge.game.on(playGamaBridge.EVENT_NAME.VISIBILITY_STATE_CHANGED, (nextState) => {
            // eslint-disable-next-line no-console
            console.log('Visibility state:', nextState);
        });

        // To track interstitial ad state changes, subscribe to the event
        playGamaBridge.advertisement.on(
            playGamaBridge.EVENT_NAME.INTERSTITIAL_STATE_CHANGED,
            (state) => {
                // eslint-disable-next-line no-console
                console.log('Interstitial state: ', state);
            }
        );
    }

    // eslint-disable-next-line no-console
    console.log('App is ready', tenOnTen);
    playGamaBridge.platform.sendMessage('game_ready');
})()
    .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('App initialization failed', error);

        throw error;
    });
