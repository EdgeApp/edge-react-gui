package com.airbitz;

import android.app.Application;
import com.facebook.react.ReactApplication;
import com.lynxit.contactswrapper.ContactsWrapperPackage;
import cl.json.RNSharePackage;
import com.lwansbrough.RCTCamera.RCTCameraPackage;
import com.imagepicker.ImagePickerPackage;
import com.github.xinthink.rnmk.ReactMaterialKitPackage;
import com.tradle.react.UdpSocketsModule;
import com.peel.react.TcpSocketsModule;
import com.bitgo.randombytes.RandomBytesPackage;
import com.joshblour.reactnativepermissions.ReactNativePermissionsPackage;
import com.bitgo.randombytes.RandomBytesPackage;
import com.oblador.vectoricons.VectorIconsPackage;
import com.BV.LinearGradient.LinearGradientPackage;
import com.rnfs.RNFSPackage;
import com.learnium.RNDeviceInfo.RNDeviceInfo;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;
import com.rt2zz.reactnativecontacts.ReactNativeContacts;

import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
          new MainReactPackage(),
            new ContactsWrapperPackage(),
            new RNSharePackage(),
            new ImagePickerPackage(),
            new RCTCameraPackage(),
            new ReactMaterialKitPackage(),
            new UdpSocketsModule(),
            new TcpSocketsModule(),
            new ReactNativePermissionsPackage(),
            new RandomBytesPackage(),
            new VectorIconsPackage(),
            new LinearGradientPackage(),
            new RNFSPackage(),
            new RNDeviceInfo(),
            new ReactNativeContacts()
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
