package co.edgesecure.app;

import android.app.Application;
import android.content.Context;
import android.webkit.WebView;
import ca.jaysoo.extradimensions.ExtraDimensionsPackage;
import cl.json.RNSharePackage;
import co.airbitz.AbcCoreJsUi.AbcCoreJsUiPackage;
import co.airbitz.fastcrypto.RNFastCryptoPackage;
import com.BV.LinearGradient.LinearGradientPackage;
import com.beefe.picker.PickerViewPackage;
import com.bitgo.randombytes.RandomBytesPackage;
import com.bugsnag.BugsnagReactNative;
import com.chirag.RNMail.RNMail;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.modules.i18nmanager.I18nUtil;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;
import com.github.xinthink.rnmk.ReactMaterialKitPackage;
import com.imagepicker.ImagePickerPackage;
import com.krazylabs.OpenAppSettingsPackage;
import com.learnium.RNDeviceInfo.RNDeviceInfo;
import com.lynxit.contactswrapper.ContactsWrapperPackage;
import com.oblador.vectoricons.VectorIconsPackage;
import com.peel.react.TcpSocketsModule;
import com.psykar.cookiemanager.CookieManagerPackage;
import com.reactlibrary.DiskletPackage;
import com.reactnativecommunity.netinfo.NetInfoPackage;
import com.reactnativecommunity.art.ARTPackage;
import com.reactnativecommunity.asyncstorage.AsyncStoragePackage;
import com.reactnativecommunity.webview.RNCWebViewPackage;
import com.reactnativecomponent.splashscreen.RCTSplashScreenPackage;
import com.rnfs.RNFSPackage;
import com.rt2zz.reactnativecontacts.ReactNativeContacts;
import com.zmxv.RNSound.RNSoundPackage;
import io.fixd.rctlocale.RCTLocalePackage;
import io.invertase.firebase.RNFirebasePackage;
import io.invertase.firebase.analytics.RNFirebaseAnalyticsPackage;
import io.invertase.firebase.database.RNFirebaseDatabasePackage;
import java.util.Arrays;
import java.util.List;
import org.reactnative.camera.RNCameraPackage;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost =
      new ReactNativeHost(this) {
        @Override
        public boolean getUseDeveloperSupport() {
          return BuildConfig.DEBUG;
        }

        @Override
        protected List<ReactPackage> getPackages() {
          return Arrays.<ReactPackage>asList(
              new MainReactPackage(),
              new NetInfoPackage(),
              new ARTPackage(),
              new AsyncStoragePackage(),
              new DiskletPackage(),
              new RNCWebViewPackage(),
              new CookieManagerPackage(),
              new OpenAppSettingsPackage(),
              BugsnagReactNative.getPackage(),
              new RNFirebasePackage(),
              new RNFirebaseAnalyticsPackage(),
              new RNFirebaseDatabasePackage(),
              new RNMail(),
              new RCTSplashScreenPackage(),
              new PickerViewPackage(),
              new AbcCoreJsUiPackage(),
              new RNSoundPackage(),
              new RNSharePackage(),
              new RandomBytesPackage(),
              new RNFastCryptoPackage(),
              new VectorIconsPackage(),
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
              new ExtraDimensionsPackage());
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
    Context context = getApplicationContext();

    // Disable RTL
    I18nUtil sharedI18nUtilInstance = I18nUtil.getInstance();
    sharedI18nUtilInstance.allowRTL(context, false);

    BugsnagReactNative.start(this);
    SoLoader.init(this, /* native exopackage */ false);

    WebView.setWebContentsDebuggingEnabled(true);

    // Background task:
    MessagesWorker.ensureScheduled(context);
    // MessagesWorker.testRun(context);
  }
}
