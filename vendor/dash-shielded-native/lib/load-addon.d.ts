export interface NativeDashAddon {
    setDocumentDirectory: (path: string) => void;
    initialize: (mnemonicSeed: string, account: number, alias: string, networkName: string, defaultHost: string, defaultPort: number) => Promise<void>;
    stop: (alias: string) => Promise<string>;
    startSync: (alias: string) => Promise<void>;
    stopSync: (alias: string) => Promise<void>;
    deriveShieldedAddress: (alias: string) => Promise<{
        shieldedAddress: string;
    }>;
    isValidAddress: (address: string, network: string) => boolean;
    deriveViewingKey: (mnemonicSeed: string, network: string) => string;
    warmUpProver: () => Promise<void>;
    isProverReady: () => boolean;
    poll: (alias: string) => Promise<{
        alias: string;
        status: string;
        scanProgress: number;
        networkBlockHeight: number;
        availableCredits: string;
        totalCredits: string;
        transactions: Array<{
            txid: string;
            blockTimeInSeconds: number;
            minedHeight: number;
            value: string;
            fee?: string;
            toAddress?: string;
            memos: string[];
        }>;
    }>;
    proposeTransfer: (alias: string, amountCredits: string, toAddress: string, memo?: string) => Promise<string>;
    createTransfer: (alias: string, proposalId: string, mnemonicSeed: string) => Promise<string>;
}
export declare function loadNativeAddon(): NativeDashAddon;
