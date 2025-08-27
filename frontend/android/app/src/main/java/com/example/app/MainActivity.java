package com.example.app;

import android.os.Bundle;
import android.view.Window;
import android.view.WindowManager;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Make status bar opaque with a specific color
        Window window = getWindow();
        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);

        // Example: Use a predefined color
        window.setStatusBarColor(ContextCompat.getColor(this, R.color.status_bar_color));
        // You can replace android.R.color.black with your custom color from res/values/colors.xml
    }
}
