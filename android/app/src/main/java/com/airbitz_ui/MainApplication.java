package com.airbitz_ui;

import android.app.Application;
import android.util.Log;

import com.facebook.react.ReactApplication;
import com.joshblour.reactnativepermissions.ReactNativePermissionsPackage;
import com.github.yamill.orientation.OrientationPackage;
import com.github.xinthink.rnmk.ReactMaterialKitPackage;
import com.bitgo.randombytes.RandomBytesPackage;
import com.oblador.vectoricons.VectorIconsPackage;
import com.BV.LinearGradient.LinearGradientPackage;
import com.rnfs.RNFSPackage;
import com.learnium.RNDeviceInfo.RNDeviceInfo;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;

import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    protected boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
          new MainReactPackage(),
            new ReactNativePermissionsPackage(),
            new OrientationPackage(),
            new ReactMaterialKitPackage(),
            new RandomBytesPackage(),
            new VectorIconsPackage(),
            new LinearGradientPackage(),
            new RNFSPackage(),
            new RNDeviceInfo()
      );
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
  }
}
