export interface NativeZanoAddon {
    callZano: (method: string, args: string[]) => Promise<string>;
    methodNames: () => string[];
}
export declare function loadNativeAddon(): NativeZanoAddon;
