import { EventSubscription, NativeEventEmitter } from 'react-native';
import { Addresses, CreateTransferOpts, InitializerConfig, Network, ProposalSuccess, ProposeTransferOpts, SpendFailure, SpendSuccess, SynchronizerCallbacks, ViewingKeySet } from './types';
export * from './types';
export declare const Tools: {
    deriveViewingKey: (mnemonicSeed: string, network: Network) => Promise<ViewingKeySet>;
    deriveShieldedAddress: (mnemonicSeed: string, network: Network, account?: number) => Promise<string>;
    isValidAddress: (address: string, network?: Network) => Promise<boolean>;
    warmUpProver: () => Promise<void>;
    isProverReady: () => Promise<boolean>;
};
export declare class Synchronizer {
    eventEmitter: NativeEventEmitter;
    subscriptions: EventSubscription[];
    alias: string;
    network: Network;
    private timer?;
    private callbacks?;
    private lastStatus?;
    constructor(alias: string, network: Network);
    stop(): Promise<string>;
    initialize(config: InitializerConfig): Promise<void>;
    startSync(): Promise<void>;
    stopSync(): Promise<void>;
    deriveShieldedAddress(): Promise<Addresses>;
    proposeTransfer(opts: ProposeTransferOpts): Promise<ProposalSuccess>;
    createTransfer(opts: CreateTransferOpts): Promise<SpendSuccess | SpendFailure>;
    subscribe(callbacks: SynchronizerCallbacks): void;
    unsubscribe(): void;
    private pump;
}
export declare const makeSynchronizer: (config: InitializerConfig) => Promise<Synchronizer>;
