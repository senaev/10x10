type PlayGamaBridge = {
  initialize: () => Promise<void>;
};

declare const bridge: PlayGamaBridge;

export function initPlayGamaBridge() {
  bridge
    .initialize()
    .then(() => {
      console.log("PlayGamaBridge initialized");
    })
    .catch((error) => {
      console.error("PlayGamaBridge initialization failed", error);
    });
}
