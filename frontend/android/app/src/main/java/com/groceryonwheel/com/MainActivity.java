package com.groceryonwheel.com;
import android.graphics.Color; // ✅ This is required

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import android.view.WindowManager;
import android.view.Window; // ✅ Required for 'Window window = getWindow();'
import android.view.WindowManager;
public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // No manual plugin registration needed
    Window window = getWindow();
    window.clearFlags(WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS);
    window.setStatusBarColor(Color.parseColor("#000000")); // black background
  }
}
