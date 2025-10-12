package com.embolo.cart;

import android.os.Bundle;
import android.view.View;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Set transparent window before super.onCreate to prevent splash
        getWindow().setBackgroundDrawableResource(android.R.color.transparent);
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE | 
            View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
        );
        
        super.onCreate(savedInstanceState);
    }
}
