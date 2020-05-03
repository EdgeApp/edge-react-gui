package com.reactlibrary;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableNativeArray;
import com.zcoin.sigma.CoinDenomination;
import com.zcoin.sigma.Sigma;
import com.zcoin.sigma.Util;

public class RNZcoinSigmaModule extends ReactContextBaseJavaModule {

	private static final char[] HEX_ARRAY = "0123456789ABCDEF".toCharArray();

	private final ReactApplicationContext reactContext;

	static {
		System.loadLibrary("sigma");
	}

	public RNZcoinSigmaModule(ReactApplicationContext reactContext) {
		super(reactContext);
		this.reactContext = reactContext;
	}

	@Override
	public String getName() {
		return "RNZcoinSigma";
	}

	@ReactMethod
	public void getMintCommitment(Float denomination, String privateKey, int index, Callback callback) {
		String commitment = Sigma.createMintCommitment(CoinDenomination.integerToDenomination((long) (denomination * Util.COIN)),
				privateKey, index);
		String serialNumber = Sigma.getSerialNumber(CoinDenomination.integerToDenomination((long) (denomination * Util.COIN)),
				privateKey, index);
		callback.invoke(commitment, serialNumber);
	}

	@ReactMethod
	public void getSpendProof(Float denomination, String privateKey, int index, ReadableArray anonymitySet,
							  int groupId, String blockHash, String txHash, Callback callback) {
		String[] anonymitySetArray = new String[anonymitySet.size()];
		for (int i = 0; i < anonymitySet.size(); i++) {
			anonymitySetArray[i] = anonymitySet.getString(i);
		}
		String spendProof = Sigma.createSpendProof(CoinDenomination.integerToDenomination((long) (denomination * Util.COIN)),
				privateKey, index, anonymitySetArray, groupId, blockHash, txHash);
		callback.invoke(spendProof);
	}

	private static WritableArray byteArrayToWritableArray(byte[] byteArray) {
		WritableArray writableArray = new WritableNativeArray();
		for (byte b : byteArray) {
			writableArray.pushInt(b);
		}
		return writableArray;
	}

	private static byte[] readableArrayToByteArray(ReadableArray readableArray) {
		byte[] byteArray = new byte[readableArray.size()];
		for (int i = 0; i < readableArray.size(); i++) {
			byteArray[i] = (byte) readableArray.getInt(i);
		}
		return byteArray;
	}

	private static byte[] hexStringToByteArray(String s) {
		int len = s.length();
		byte[] data = new byte[len / 2];
		for (int i = 0; i < len; i += 2) {
			data[i / 2] = (byte) ((Character.digit(s.charAt(i), 16) << 4)
					+ Character.digit(s.charAt(i + 1), 16));
		}
		return data;
	}

	public static String byteArrayToHexString(byte[] bytes) {
		char[] hexChars = new char[bytes.length * 2];
		for (int j = 0; j < bytes.length; j++) {
			int v = bytes[j] & 0xFF;
			hexChars[j * 2] = HEX_ARRAY[v >>> 4];
			hexChars[j * 2 + 1] = HEX_ARRAY[v & 0x0F];
		}
		return new String(hexChars);
	}
}