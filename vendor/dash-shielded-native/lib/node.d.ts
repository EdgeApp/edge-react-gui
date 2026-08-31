import { NativeDashAddon } from './load-addon';
import { Addresses, CreateTransferOpts, InitializerConfig, Network, ProposalSuccess, ProposeTransferOpts, SpendFailure, SpendSuccess, SynchronizerCallbacks, ViewingKeySet } from './types';
export * from './types';
export interface MakeNodeDashShieldedOpts {
    documentDirectory: string;
}
export declare const Tools: {
    deriveViewingKey: (mnemonicSeed: string, network: Network) => Promise<ViewingKeySet>;
    deriveShieldedAddress: (mnemonicSeed: string, network: Network, account?: number) => Promise<string>;
    isValidAddress: (address: string, network?: Network) => Promise<boolean>;
    warmUpProver: () => Promise<void>;
    isProverReady: () => Promise<boolean>;
};
export declare class Synchronizer {
    alias: string;
    network: Network;
    private readonly addon;
    private timer?;
    private callbacks?;
    private lastStatus?;
    constructor(alias: string, network: Network, addon: NativeDashAddon);
    stop(): Promise<string>;
    initialize(config: InitializerConfig): Promise<void>;
    startSync(): Promise<void>;
    stopSync(): Promise<void>;
    deriveShieldedAddress(): Promise<Addresses>;
    getBalance(): Promise<{
        availableCredits: string;
        totalCredits: string;
    }>;
    getTransactions(): Promise<Array<{
        txid: string;
        blockTimeInSeconds: number;
        minedHeight: number;
        value: string;
        fee?: string;
        toAddress?: string;
        memos: string[];
    }>>;
    proposeTransfer(opts: ProposeTransferOpts): Promise<ProposalSuccess>;
    createTransfer(opts: CreateTransferOpts): Promise<SpendSuccess | SpendFailure>;
    subscribe(callbacks: SynchronizerCallbacks): void;
    unsubscribe(): void;
    private pump;
}
export declare const makeSynchronizer: (config: InitializerConfig) => Promise<Synchronizer>;
export declare function makeNodeDashShieldedModule(opts: MakeNodeDashShieldedOpts): {
    Tools: typeof Tools;
    makeSynchronizer: typeof makeSynchronizer;
};
