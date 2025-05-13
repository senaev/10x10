export type PlayGamaBridgeStorageTypes = {
    local_storage: void;
    platform_internal: void;
};

export type PlayGamaBridgeStorageType = keyof PlayGamaBridgeStorageTypes;

export type PlayGamaBridgeStorage = {
    readonly set: (keys: string[], values: unknown[], storageType?: PlayGamaBridgeStorageType) => Promise<unknown[]>;
    readonly get: (keys: string[], storageType?: PlayGamaBridgeStorageType) => Promise<unknown[]>;
    readonly delete: (keys: string[], storageType?: PlayGamaBridgeStorageType) => Promise<void>;
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
