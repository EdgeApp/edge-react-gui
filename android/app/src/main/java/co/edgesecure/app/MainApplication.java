package co.edgesecure.app;

import android.app.Application;

import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;

import com.bugsnag.BugsnagReactNative;
import com.transistorsoft.rnbackgroundfetch.RNBackgroundFetchPackage;
import org.reactnative.camera.RNCameraPackage;
import io.invertase.firebase.RNFirebasePackage;
import io.invertase.firebase.analytics.RNFirebaseAnalyticsPackage;
import io.invertase.firebase.database.RNFirebaseDatabasePackage;
import com.dieam.reactnativepushnotification.ReactNativePushNotificationPackage;
import com.chirag.RNMail.RNMail;
import com.reactnativecomponent.splashscreen.RCTSplashScreenPackage;
import com.beefe.picker.PickerViewPackage;
import co.airbitz.AbcCoreJsUi.AbcCoreJsUiPackage;
import com.zmxv.RNSound.RNSoundPackage;
import cl.json.RNSharePackage;
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
import io.fixd.rctlocale.RCTLocalePackage;
import com.oblongmana.webviewfileuploadandroid.AndroidWebViewPackage;

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
            new RNBackgroundFetchPackage(),
            BugsnagReactNative.getPackage(),
            new RNFirebasePackage(),
            new RNFirebaseAnalyticsPackage(),
            new RNFirebaseDatabasePackage(),
            new ReactNativePushNotificationPackage(),
            new RNMail(),
            new RCTSplashScreenPackage(),
            new PickerViewPackage(),
            new AbcCoreJsUiPackage(),
            new RNSoundPackage(),
            new RNSharePackage(),
            new RandomBytesPackage(),
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
            new RNCameraPackage(),
            new RCTLocalePackage(),
            new AndroidWebViewPackage()
      );
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    BugsnagReactNative.start(this);
    SoLoader.init(this, /* native exopackage */ false);
  }
}
