import { EventEmitter } from 'events';
import type { NativeMoneroLwsfModule } from './CppBridge';
export type { WalletEventData } from './types';
export interface MakeNodeMoneroModuleOpts {
    documentDirectory: string;
}
export type NodeMoneroModule = NativeMoneroLwsfModule & EventEmitter;
/**
 * Node N-API implementation of the native Monero module.
 * Same `callMonero` contract as `NativeModules.MoneroLwsfModule`.
 */
export declare function makeNodeMoneroModule(opts: MakeNodeMoneroModuleOpts): NodeMoneroModule;
