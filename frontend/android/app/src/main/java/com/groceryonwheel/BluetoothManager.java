package com.groceryonwheel;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.JSObject;

import java.util.Set;
import org.json.JSONArray;
import org.json.JSONException;

@CapacitorPlugin(name = "BluetoothManager")
public class BluetoothManager extends Plugin {

    @PluginMethod
    public void listBondedDevices(PluginCall call) {
        BluetoothAdapter bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();

        if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled()) {
            call.reject("Bluetooth not enabled or not available");
            return;
        }

        Set<BluetoothDevice> pairedDevices = bluetoothAdapter.getBondedDevices();
        JSONArray deviceArray = new JSONArray();

        for (BluetoothDevice device : pairedDevices) {
            JSObject dev = new JSObject();
            dev.put("name", device.getName());
            dev.put("address", device.getAddress());
            deviceArray.put(dev);
        }

        JSObject result = new JSObject();
        result.put("devices", deviceArray);
        call.resolve(result);
    }
}
