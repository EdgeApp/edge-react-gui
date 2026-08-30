export interface NativeMoneroAddon {
    callMonero: (method: string, args: string[]) => Promise<string>;
    methodNames: () => string[];
    setEventListener: (cb: (walletId: string, eventName: string, data: string) => void) => void;
}
export declare function loadNativeAddon(): NativeMoneroAddon;
