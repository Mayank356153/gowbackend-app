package com.groceryonwheel.plugins;

import android.bluetooth.BluetoothAdapter;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.PluginListenerHandle;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.JSObject;

@CapacitorPlugin(name = "BluetoothStatus")
public class BluetoothStatus extends Plugin {

    private BluetoothAdapter bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
    private BroadcastReceiver receiver;

    @PluginMethod
    public void isBluetoothOn(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("enabled", bluetoothAdapter != null && bluetoothAdapter.isEnabled());
        call.resolve(ret);
    }

    @Override
    public void load() {
        IntentFilter filter = new IntentFilter(BluetoothAdapter.ACTION_STATE_CHANGED);
        receiver = new BroadcastReceiver() {
            public void onReceive(Context context, Intent intent) {
                int state = intent.getIntExtra(BluetoothAdapter.EXTRA_STATE, BluetoothAdapter.ERROR);
                JSObject ret = new JSObject();
                ret.put("enabled", state == BluetoothAdapter.STATE_ON);
                notifyListeners("bluetoothStatusChange", ret);
            }
        };
        getActivity().registerReceiver(receiver, filter);
    }

    @Override
    protected void handleOnDestroy() {
        if (receiver != null) {
            getActivity().unregisterReceiver(receiver);
        }
    }
}
