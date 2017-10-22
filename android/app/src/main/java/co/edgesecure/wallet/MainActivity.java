package co.edgesecure.wallet;

import android.os.Bundle;

import com.facebook.react.ReactActivity;
//import com.cboy.rn.splashscreen.SplashScreen;

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
//        SplashScreen.show(this);  // here
        super.onCreate(savedInstanceState);
    }
}
