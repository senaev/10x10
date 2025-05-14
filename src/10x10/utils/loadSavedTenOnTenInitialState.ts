import { decryptString, encryptString } from 'senaev-utils/src/utils/encryptDecryptString/encryptDecryptString';
import { isPositiveInteger } from 'senaev-utils/src/utils/Number/PositiveInteger';
import { isObject } from 'senaev-utils/src/utils/Object/isObject/isObject';
import { isNonEmptyString } from 'senaev-utils/src/utils/String/NonEmptyString/NonEmptyString';

import { PlayGamaBridge } from '../../PlayGama/initPlayGamaBridge';
import { SESSION_ENCRYPTION_SECRET } from '../const/SESSION_ENCRYPTION_SECRET';
import { STORAGE_KEY } from '../const/STORAGE_KEY';
import { TenOnTenState } from '../js/TenOnTen';

export const encryptTenOnTenState = (state: TenOnTenState): Promise<string> => {
    const stateString = JSON.stringify(state);

    return encryptString({
        string: stateString,
        secret: SESSION_ENCRYPTION_SECRET,
    });
};

export const decryptTenOnTenState = async (string: string): Promise<string> => decryptString({
    string,
    secret: SESSION_ENCRYPTION_SECRET,
});

export function isValidTenOnTenState(state: unknown): state is TenOnTenState {
    if (!isObject(state)) {
        return false;
    }

    if (!isPositiveInteger(state.level)) {
        return false;
    }

    if (!isObject(state.current)) {
        return false;
    }

    return true;
}

const PERSIST_STATE_FOR_DEV_KEY = 'persist_state_for_dev';

export async function loadSavedTenOnTenInitialState({
    playGamaBridge,
}: {
    playGamaBridge: PlayGamaBridge;
}): Promise<TenOnTenState | undefined> {
    const isMockEnv = playGamaBridge.platform.id === 'mock';

    const localStorageState = localStorage.getItem(PERSIST_STATE_FOR_DEV_KEY);

    if (isMockEnv && isNonEmptyString(localStorageState)) {
        const stateObject = JSON.parse(localStorageState);

        if (!isValidTenOnTenState(stateObject)) {
            throw new Error(`Invalid state from localStorage[${PERSIST_STATE_FOR_DEV_KEY}]`);
        }

        // eslint-disable-next-line no-console
        console.warn(`loadSavedTenOnTenInitialState: using mock state from localStorage[${PERSIST_STATE_FOR_DEV_KEY}]`);

        return stateObject;
    }

    const [encryptedState] = await playGamaBridge.storage.get([STORAGE_KEY]);

    let initialState: TenOnTenState | undefined;
    if (isNonEmptyString(encryptedState)) {
        const decryptedState = await decryptTenOnTenState(encryptedState);

        if (isNonEmptyString(decryptedState)) {
            const stateObject = JSON.parse(decryptedState);

            if (isValidTenOnTenState(stateObject)) {
                initialState = stateObject;
            }
        }
    }

    // eslint-disable-next-line no-console
    console.log('initialState', isMockEnv ? initialState : Boolean(initialState));

    return initialState;
}
