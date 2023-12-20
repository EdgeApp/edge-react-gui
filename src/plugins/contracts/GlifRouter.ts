/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  Overrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import type {
  FunctionFragment,
  Result,
  EventFragment,
} from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
} from "./common";

export type AccountStruct = {
  startEpoch: BigNumberish;
  principal: BigNumberish;
  epochsPaid: BigNumberish;
  defaulted: boolean;
};

export type AccountStructOutput = [BigNumber, BigNumber, BigNumber, boolean] & {
  startEpoch: BigNumber;
  principal: BigNumber;
  epochsPaid: BigNumber;
  defaulted: boolean;
};

export interface GlifRouterInterface extends utils.Interface {
  functions: {
    "acceptOwnership()": FunctionFragment;
    "createAccountKey(uint256,uint256)": FunctionFragment;
    "getAccount(uint256,uint256)": FunctionFragment;
    "getRoute(bytes4)": FunctionFragment;
    "getRoute(string)": FunctionFragment;
    "owner()": FunctionFragment;
    "pendingOwner()": FunctionFragment;
    "pushRoute(string,address)": FunctionFragment;
    "pushRoute(bytes4,address)": FunctionFragment;
    "pushRoutes(string[],address[])": FunctionFragment;
    "pushRoutes(bytes4[],address[])": FunctionFragment;
    "route(bytes4)": FunctionFragment;
    "setAccount(uint256,uint256,(uint256,uint256,uint256,bool))": FunctionFragment;
    "transferOwnership(address)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "acceptOwnership"
      | "createAccountKey"
      | "getAccount"
      | "getRoute(bytes4)"
      | "getRoute(string)"
      | "owner"
      | "pendingOwner"
      | "pushRoute(string,address)"
      | "pushRoute(bytes4,address)"
      | "pushRoutes(string[],address[])"
      | "pushRoutes(bytes4[],address[])"
      | "route"
      | "setAccount"
      | "transferOwnership"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "acceptOwnership",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "createAccountKey",
    values: [BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "getAccount",
    values: [BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "getRoute(bytes4)",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "getRoute(string)",
    values: [string]
  ): string;
  encodeFunctionData(functionFragment: "owner", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "pendingOwner",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "pushRoute(string,address)",
    values: [string, string]
  ): string;
  encodeFunctionData(
    functionFragment: "pushRoute(bytes4,address)",
    values: [BytesLike, string]
  ): string;
  encodeFunctionData(
    functionFragment: "pushRoutes(string[],address[])",
    values: [string[], string[]]
  ): string;
  encodeFunctionData(
    functionFragment: "pushRoutes(bytes4[],address[])",
    values: [BytesLike[], string[]]
  ): string;
  encodeFunctionData(functionFragment: "route", values: [BytesLike]): string;
  encodeFunctionData(
    functionFragment: "setAccount",
    values: [BigNumberish, BigNumberish, AccountStruct]
  ): string;
  encodeFunctionData(
    functionFragment: "transferOwnership",
    values: [string]
  ): string;

  decodeFunctionResult(
    functionFragment: "acceptOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "createAccountKey",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "getAccount", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "getRoute(bytes4)",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getRoute(string)",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "pendingOwner",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "pushRoute(string,address)",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "pushRoute(bytes4,address)",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "pushRoutes(string[],address[])",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "pushRoutes(bytes4[],address[])",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "route", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "setAccount", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "transferOwnership",
    data: BytesLike
  ): Result;

  events: {
    "PushRoute(address,bytes4)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "PushRoute"): EventFragment;
}

export interface PushRouteEventObject {
  newRoute: string;
  id: string;
}
export type PushRouteEvent = TypedEvent<[string, string], PushRouteEventObject>;

export type PushRouteEventFilter = TypedEventFilter<PushRouteEvent>;

export interface GlifRouter extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: GlifRouterInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    acceptOwnership(
      overrides?: Overrides & { from?: string }
    ): Promise<ContractTransaction>;

    createAccountKey(
      agentID: BigNumberish,
      poolID: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[string]>;

    getAccount(
      agentID: BigNumberish,
      poolID: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[AccountStructOutput]>;

    "getRoute(bytes4)"(
      id: BytesLike,
      overrides?: CallOverrides
    ): Promise<[string]>;

    "getRoute(string)"(
      id: string,
      overrides?: CallOverrides
    ): Promise<[string]>;

    owner(overrides?: CallOverrides): Promise<[string]>;

    pendingOwner(overrides?: CallOverrides): Promise<[string]>;

    "pushRoute(string,address)"(
      id: string,
      newRoute: string,
      overrides?: Overrides & { from?: string }
    ): Promise<ContractTransaction>;

    "pushRoute(bytes4,address)"(
      id: BytesLike,
      newRoute: string,
      overrides?: Overrides & { from?: string }
    ): Promise<ContractTransaction>;

    "pushRoutes(string[],address[])"(
      ids: string[],
      newRoutes: string[],
      overrides?: Overrides & { from?: string }
    ): Promise<ContractTransaction>;

    "pushRoutes(bytes4[],address[])"(
      ids: BytesLike[],
      newRoutes: string[],
      overrides?: Overrides & { from?: string }
    ): Promise<ContractTransaction>;

    route(arg0: BytesLike, overrides?: CallOverrides): Promise<[string]>;

    setAccount(
      agentID: BigNumberish,
      poolID: BigNumberish,
      account: AccountStruct,
      overrides?: Overrides & { from?: string }
    ): Promise<ContractTransaction>;

    transferOwnership(
      newOwner: string,
      overrides?: Overrides & { from?: string }
    ): Promise<ContractTransaction>;
  };

  acceptOwnership(
    overrides?: Overrides & { from?: string }
  ): Promise<ContractTransaction>;

  createAccountKey(
    agentID: BigNumberish,
    poolID: BigNumberish,
    overrides?: CallOverrides
  ): Promise<string>;

  getAccount(
    agentID: BigNumberish,
    poolID: BigNumberish,
    overrides?: CallOverrides
  ): Promise<AccountStructOutput>;

  "getRoute(bytes4)"(id: BytesLike, overrides?: CallOverrides): Promise<string>;

  "getRoute(string)"(id: string, overrides?: CallOverrides): Promise<string>;

  owner(overrides?: CallOverrides): Promise<string>;

  pendingOwner(overrides?: CallOverrides): Promise<string>;

  "pushRoute(string,address)"(
    id: string,
    newRoute: string,
    overrides?: Overrides & { from?: string }
  ): Promise<ContractTransaction>;

  "pushRoute(bytes4,address)"(
    id: BytesLike,
    newRoute: string,
    overrides?: Overrides & { from?: string }
  ): Promise<ContractTransaction>;

  "pushRoutes(string[],address[])"(
    ids: string[],
    newRoutes: string[],
    overrides?: Overrides & { from?: string }
  ): Promise<ContractTransaction>;

  "pushRoutes(bytes4[],address[])"(
    ids: BytesLike[],
    newRoutes: string[],
    overrides?: Overrides & { from?: string }
  ): Promise<ContractTransaction>;

  route(arg0: BytesLike, overrides?: CallOverrides): Promise<string>;

  setAccount(
    agentID: BigNumberish,
    poolID: BigNumberish,
    account: AccountStruct,
    overrides?: Overrides & { from?: string }
  ): Promise<ContractTransaction>;

  transferOwnership(
    newOwner: string,
    overrides?: Overrides & { from?: string }
  ): Promise<ContractTransaction>;

  callStatic: {
    acceptOwnership(overrides?: CallOverrides): Promise<void>;

    createAccountKey(
      agentID: BigNumberish,
      poolID: BigNumberish,
      overrides?: CallOverrides
    ): Promise<string>;

    getAccount(
      agentID: BigNumberish,
      poolID: BigNumberish,
      overrides?: CallOverrides
    ): Promise<AccountStructOutput>;

    "getRoute(bytes4)"(
      id: BytesLike,
      overrides?: CallOverrides
    ): Promise<string>;

    "getRoute(string)"(id: string, overrides?: CallOverrides): Promise<string>;

    owner(overrides?: CallOverrides): Promise<string>;

    pendingOwner(overrides?: CallOverrides): Promise<string>;

    "pushRoute(string,address)"(
      id: string,
      newRoute: string,
      overrides?: CallOverrides
    ): Promise<void>;

    "pushRoute(bytes4,address)"(
      id: BytesLike,
      newRoute: string,
      overrides?: CallOverrides
    ): Promise<void>;

    "pushRoutes(string[],address[])"(
      ids: string[],
      newRoutes: string[],
      overrides?: CallOverrides
    ): Promise<void>;

    "pushRoutes(bytes4[],address[])"(
      ids: BytesLike[],
      newRoutes: string[],
      overrides?: CallOverrides
    ): Promise<void>;

    route(arg0: BytesLike, overrides?: CallOverrides): Promise<string>;

    setAccount(
      agentID: BigNumberish,
      poolID: BigNumberish,
      account: AccountStruct,
      overrides?: CallOverrides
    ): Promise<void>;

    transferOwnership(
      newOwner: string,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    "PushRoute(address,bytes4)"(
      newRoute?: null,
      id?: null
    ): PushRouteEventFilter;
    PushRoute(newRoute?: null, id?: null): PushRouteEventFilter;
  };

  estimateGas: {
    acceptOwnership(
      overrides?: Overrides & { from?: string }
    ): Promise<BigNumber>;

    createAccountKey(
      agentID: BigNumberish,
      poolID: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getAccount(
      agentID: BigNumberish,
      poolID: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "getRoute(bytes4)"(
      id: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "getRoute(string)"(
      id: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    owner(overrides?: CallOverrides): Promise<BigNumber>;

    pendingOwner(overrides?: CallOverrides): Promise<BigNumber>;

    "pushRoute(string,address)"(
      id: string,
      newRoute: string,
      overrides?: Overrides & { from?: string }
    ): Promise<BigNumber>;

    "pushRoute(bytes4,address)"(
      id: BytesLike,
      newRoute: string,
      overrides?: Overrides & { from?: string }
    ): Promise<BigNumber>;

    "pushRoutes(string[],address[])"(
      ids: string[],
      newRoutes: string[],
      overrides?: Overrides & { from?: string }
    ): Promise<BigNumber>;

    "pushRoutes(bytes4[],address[])"(
      ids: BytesLike[],
      newRoutes: string[],
      overrides?: Overrides & { from?: string }
    ): Promise<BigNumber>;

    route(arg0: BytesLike, overrides?: CallOverrides): Promise<BigNumber>;

    setAccount(
      agentID: BigNumberish,
      poolID: BigNumberish,
      account: AccountStruct,
      overrides?: Overrides & { from?: string }
    ): Promise<BigNumber>;

    transferOwnership(
      newOwner: string,
      overrides?: Overrides & { from?: string }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    acceptOwnership(
      overrides?: Overrides & { from?: string }
    ): Promise<PopulatedTransaction>;

    createAccountKey(
      agentID: BigNumberish,
      poolID: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getAccount(
      agentID: BigNumberish,
      poolID: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "getRoute(bytes4)"(
      id: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "getRoute(string)"(
      id: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    owner(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    pendingOwner(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "pushRoute(string,address)"(
      id: string,
      newRoute: string,
      overrides?: Overrides & { from?: string }
    ): Promise<PopulatedTransaction>;

    "pushRoute(bytes4,address)"(
      id: BytesLike,
      newRoute: string,
      overrides?: Overrides & { from?: string }
    ): Promise<PopulatedTransaction>;

    "pushRoutes(string[],address[])"(
      ids: string[],
      newRoutes: string[],
      overrides?: Overrides & { from?: string }
    ): Promise<PopulatedTransaction>;

    "pushRoutes(bytes4[],address[])"(
      ids: BytesLike[],
      newRoutes: string[],
      overrides?: Overrides & { from?: string }
    ): Promise<PopulatedTransaction>;

    route(
      arg0: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    setAccount(
      agentID: BigNumberish,
      poolID: BigNumberish,
      account: AccountStruct,
      overrides?: Overrides & { from?: string }
    ): Promise<PopulatedTransaction>;

    transferOwnership(
      newOwner: string,
      overrides?: Overrides & { from?: string }
    ): Promise<PopulatedTransaction>;
  };
}
