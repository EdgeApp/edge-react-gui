package co.edgesecure.wallet;

import android.app.Application;

import com.facebook.react.ReactApplication;
import com.reactnativecomponent.splashscreen.RCTSplashScreenPackage;
import co.airbitz.AbcCoreJsUi.AbcCoreJsUiPackage;
import com.zmxv.RNSound.RNSoundPackage;
import cl.json.RNSharePackage;
import com.cmcewen.blurview.BlurViewPackage;
import com.slowpath.hockeyapp.RNHockeyAppModule;
import com.slowpath.hockeyapp.RNHockeyAppPackage;
import co.airbitz.fastcrypto.RNFastCryptoPackage;
import com.oblador.vectoricons.VectorIconsPackage;
import com.tradle.react.UdpSocketsModule;
import com.peel.react.TcpSocketsModule;
import com.bitgo.randombytes.RandomBytesPackage;
import com.github.xinthink.rnmk.ReactMaterialKitPackage;
import com.BV.LinearGradient.LinearGradientPackage;
import com.imagepicker.ImagePickerPackage;
import com.rnfs.RNFSPackage;
import com.learnium.RNDeviceInfo.RNDeviceInfo;
import com.lynxit.contactswrapper.ContactsWrapperPackage;
import com.rt2zz.reactnativecontacts.ReactNativeContacts;
import com.lwansbrough.RCTCamera.RCTCameraPackage;
import io.fixd.rctlocale.RCTLocalePackage;

import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;

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
            new RCTSplashScreenPackage(),
            new AbcCoreJsUiPackage(),
            new RNSoundPackage(),
            new RNSharePackage(),
            new RandomBytesPackage(),
            new BlurViewPackage(),
            new RNHockeyAppPackage(MainApplication.this),
            new RNFastCryptoPackage(),
            new VectorIconsPackage(),
            new UdpSocketsModule(),
            new TcpSocketsModule(),
            new ReactMaterialKitPackage(),
            new LinearGradientPackage(),
            new ImagePickerPackage(),
            new RNFSPackage(),
            new RNDeviceInfo(),
            new ContactsWrapperPackage(),
            new ReactNativeContacts(),
            new RCTCameraPackage(),
            new RCTLocalePackage()
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
