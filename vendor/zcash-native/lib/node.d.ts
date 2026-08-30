import { NativeZcashAddon } from './load-addon';
import { Addresses, CreateTransferOpts, ImmediateMigrationProposal, InitializerConfig, Network, ProposalSuccess, ProposeTransferOpts, ShieldFundsInfo, SpendFailure, SpendSuccess, SynchronizerCallbacks } from './types';
export * from './types';
export interface MakeNodeZcashOpts {
    documentDirectory: string;
}
export declare const Tools: {
    deriveViewingKey: (seedBytesHex: string, network: Network) => Promise<string>;
    getBirthdayHeight: (host: string, port: number) => Promise<number>;
    isValidAddress: (address: string, network?: Network) => Promise<boolean>;
    getIronwoodActivationHeight: (network?: Network) => Promise<number | null>;
};
export declare class Synchronizer {
    alias: string;
    network: Network;
    private readonly addon;
    private timer?;
    private callbacks?;
    private lastStatus?;
    constructor(alias: string, network: Network, addon: NativeZcashAddon);
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
    subscribe(callbacks: SynchronizerCallbacks): void;
    unsubscribe(): void;
    private pump;
}
export declare const makeSynchronizer: (initializerConfig: InitializerConfig) => Promise<Synchronizer>;
export declare function makeNodeZcashModule(opts: MakeNodeZcashOpts): {
    Tools: typeof Tools;
    makeSynchronizer: typeof makeSynchronizer;
};
