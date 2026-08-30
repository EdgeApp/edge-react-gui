import { EventSubscription, NativeEventEmitter } from 'react-native';
import { Addresses, CreateTransferOpts, ImmediateMigrationProposal, InitializerConfig, Network, ProposalSuccess, ProposeTransferOpts, ShieldFundsInfo, SpendFailure, SpendSuccess, SynchronizerCallbacks } from './types';
export * from './types';
export declare const Tools: {
    deriveViewingKey: (seedBytesHex: string, network: Network) => Promise<string>;
    getBirthdayHeight: (host: string, port: number) => Promise<number>;
    isValidAddress: (address: string, network?: Network) => Promise<boolean>;
    getIronwoodActivationHeight: (network?: Network) => Promise<number | null>;
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
    initialize(initializerConfig: InitializerConfig): Promise<void>;
    deriveUnifiedAddress(): Promise<Addresses>;
    getLatestNetworkHeight(alias: string): Promise<number>;
    rescan(): Promise<void>;
    proposeOrchardToIronwoodMigration(): Promise<ImmediateMigrationProposal>;
    proposeTransfer(opts: ProposeTransferOpts): Promise<ProposalSuccess>;
    proposeFulfillingPaymentURI(paymentUri: string): Promise<ProposalSuccess>;
    createTransfer(opts: CreateTransferOpts): Promise<SpendSuccess | SpendFailure>;
    broadcastTransfer(txid: string): Promise<string>;
    shieldFunds(shieldFundsInfo: ShieldFundsInfo): Promise<string>;
    subscribe({ onBalanceChanged, onStatusChanged, onTransactionsChanged, onUpdate, onError }: SynchronizerCallbacks): void;
    unsubscribe(): void;
    private pump;
}
export declare const makeSynchronizer: (initializerConfig: InitializerConfig) => Promise<Synchronizer>;
