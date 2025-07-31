import React, { useState,useEffect } from 'react';
import { FaTimes, FaBluetooth, FaSync, FaSpinner, FaExclamationCircle } from 'react-icons/fa';
import { Device } from '@capacitor/device';
import { Preferences } from '@capacitor/preferences';
const storeToken = async (name,token) => {
  await Preferences.set({
    key: name,
    value: token,
  });
};

const BluetoothConnector = ({
    setDevice
}) => {
    // State for the modal visibility
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);

    // State for the device list and loading status
    const [devices, setDevices] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(()=>{

        const list= async () => {
 const info = await Device.getInfo();
         const platform=info.platform;
         if (platform !== 'android') {
            console.log('This feature is only available on the native Android app.');
            return;
        }
        if (typeof window.bluetoothSerial === 'undefined') {
            alert('Bluetooth plugin not found. Run on a real device.');
            return;
        }

        setIsLoading(true);
        window.bluetoothSerial.list(
            (foundDevices) => {
                if (foundDevices.length === 0) {
                    alert('No paired Bluetooth devices found. Please pair a printer in your Android Bluetooth settings first.');
                }
                setDevices(foundDevices);
                setIsLoading(false);
            },
            (failure) => {
                console.log(`Error scanning for devices: ${failure}`);
                setIsLoading(false);
            }
        );
        }
        list();
    },[])

    // This function handles what happens when a user clicks "Connect"
    const handleConnect = (device) => {
          // Use same loading state for connecting
          setIsConnecting(true);
        window.bluetoothSerial.connect(
            device.address,
            async() => {
                alert(`Successfully connected to ${device.name}`);
                await storeToken('printerAddressName', device.name);
                await storeToken('printerAddress', device.address);
                localStorage.setItem('printerAddress', device.address); // Save for auto-connect
                localStorage.setItem('printerAddressName', device.name); // Save for auto-connect
                setDevice(false)
                setIsConnecting(false);
                setDevices([]); // Clear the list  
            },
            (failure) => {
                alert(`Failed to connect to ${device.name}: ${failure}`);
                setDevice(false)
                setIsConnecting(false);
            }
        );
    };

   
  



    // --- UI ---
    // The component renders both the button and the modal itself
    return (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-60 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white shadow-xl rounded-2xl">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-800">Bluetooth Devices</h2>
                            <button onClick={()=>setDevice(false)} className="p-2 text-gray-400 rounded-full hover:bg-gray-100" aria-label="Close">
                                <FaTimes size={20} />
                            </button>
                        </div>

                        {/* Modal Body: Shows loading, empty, or list state */}
                        <div className="p-4 my-2 overflow-y-auto max-h-80">
                            {isLoading || isConnecting ? (
                                <div className="flex flex-col items-center justify-center h-64 text-center">
        <FaSpinner className="mb-4 text-4xl animate-spin text-cyan-600" />
        <p className="font-semibold text-gray-700">
            {isLoading ? 'Scanning for Devices...' : 'Connecting to Device...'}
        </p>
    </div>
                            ) : devices.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-center">
                                    <FaExclamationCircle className="mb-4 text-5xl text-gray-400" />
                                    <p className="font-semibold text-gray-800">No Devices Found</p>
                                    <p className="text-sm text-gray-500">Click "Scan Again" to search.</p>
                                </div>
                            ) : (
                                <ul className="space-y-3">
                                    {devices.map((device) => (
                                        <li key={device.id} className="flex items-center gap-4 px-2 transition-colors bg-gray-50 rounded-xl hover:bg-gray-100" onClick={() => handleConnect(device)}>
                                           
                                            <div className="flex-grow min-w-0">
                                                <p className="font-semibold text-gray-900 truncate">{device.name}</p>
                                                <p className="font-mono text-sm text-gray-500 truncate">{device.address}</p>
                                            </div>
                                            
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                       
                    </div>
                </div>
            
        
    );
};

export default BluetoothConnector;