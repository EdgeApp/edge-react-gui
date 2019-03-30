package co.edgesecure.app;

import android.content.pm.ActivityInfo;
import android.os.Bundle;

import com.facebook.react.ReactActivity;
import com.reactnativecomponent.splashscreen.RCTSplashScreen;

public class MainActivity extends ReactActivity {
    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "edge";
    }

    protected void onCreate(Bundle savedInstanceState) {
        RCTSplashScreen.openSplashScreen(this);
        super.onCreate(savedInstanceState);
        if (getResources().getBoolean(R.bool.portrait_only)) {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
        }
    }

    @Override
    public void invokeDefaultOnBackPressed() {
        moveTaskToBack(true);
    }
}
