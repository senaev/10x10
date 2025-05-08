export type PlayGamaBridgeStorageTypes = {
    local_storage: void;
    platform_internal: void;
};

export type PlayGamaBridgeStorageType = keyof PlayGamaBridgeStorageTypes;

export interface PlayGamaBridgeStorageGetFunction {
    (keys: string[], storageType?: PlayGamaBridgeStorageType): Promise<unknown>;
    (key: string, storageType?: PlayGamaBridgeStorageType): Promise<unknown>;
};

export interface PlayGamaBridgeStorageSetFunction {
    (keys: string[], values: string[], storageType?: PlayGamaBridgeStorageType): Promise<unknown>;
    (key: string, value: string, storageType?: PlayGamaBridgeStorageType): Promise<unknown>;
};

export interface PlayGamaBridgeStorageDeleteFunction {
    (keys: string[], storageType?: PlayGamaBridgeStorageType): Promise<unknown>;
    (key: string, storageType?: PlayGamaBridgeStorageType): Promise<unknown>;
};

export type PlayGamaBridgeStorage = {
    readonly set: PlayGamaBridgeStorageSetFunction;
    readonly get: PlayGamaBridgeStorageGetFunction;
    readonly delete: PlayGamaBridgeStorageDeleteFunction;
    readonly defaultType: PlayGamaBridgeStorageType;
    /**
     * Verify if the specified storage type is supported on the platform to ensure compatibility.
     */
    readonly isSupported: (storageType: PlayGamaBridgeStorageType) => boolean;
    /**
     * Check if the specified storage type is currently available for use to manage data storage effectively.
     */
    readonly isAvailable: (storageType: PlayGamaBridgeStorageType) => boolean;
};
