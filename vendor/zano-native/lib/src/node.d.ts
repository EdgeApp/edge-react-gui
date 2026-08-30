import type { NativeZanoModule } from './CppBridge';
export type { NativeZanoModule } from './CppBridge';
export interface MakeNodeZanoModuleOpts {
    documentDirectory: string;
}
export type NodeZanoModule = NativeZanoModule;
/**
 * Node N-API implementation of the native Zano module.
 * Same `callZano` contract as `NativeModules.ZanoModule`.
 */
export declare function makeNodeZanoModule(opts: MakeNodeZanoModuleOpts): NodeZanoModule;
