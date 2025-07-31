import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';

import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

import { FaTachometerAlt, FaBluetooth, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { Preferences } from '@capacitor/preferences';
import { Device } from '@capacitor/device';



const storeToken = async (name,token) => {
  await Preferences.set({
    key: name,
    value: token,
  });
};


const PrinterSettings = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    
    // --- Bluetooth State ---
    const [platform, setPlatform] = useState('web');
    const [btError, setBtError] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [devices, setDevices] = useState([]);
    const [connectedDeviceAddress, setConnectedDeviceAddress] = useState(null);
    const [connectedDeviceAddressName, setConnectedDeviceAddressName] = useState(null);

    // --- Initial Setup Effect ---
    useEffect(() => {
        const initialize = async () => {
            setIsLoading(true);
            try {
                const info = await Device.getInfo();
                setPlatform(info.platform);
                if (info.platform === 'android') {
                    // Check if a device is already connected
                    window.bluetoothSerial.isConnected(
                        () => {
                            // To get the address, we unfortunately have to rely on what we saved
                            const savedAddress = localStorage.getItem('printerAddress');
                            
                            setConnectedDeviceAddress(savedAddress);
                        },
                        () => {
                            setConnectedDeviceAddress(null);
                        }
                    );
                }
            } catch (e) {
                console.error("Error getting device info", e);
                setBtError("Could not determine the platform.");
            } finally {
                setIsLoading(false);
            }
        };

        initialize();
        if (window.innerWidth < 768) setSidebarOpen(false);
    }, []);
   useEffect(()=>{
    const savedAddress = localStorage.getItem('printerAddress');
    const savedAddressName = localStorage.getItem('printerAddressName');
    if (savedAddress) {
        setConnectedDeviceAddress(savedAddress);
    }
    if (savedAddressName) {
        setConnectedDeviceAddressName(savedAddressName);
    }
   },[]);



    // --- Bluetooth Functions ---

    const findDevices = () => {
        if (platform !== 'android') {
            setBtError('This feature is only available on the native Android app.');
            return;
        }
        if (typeof window.bluetoothSerial === 'undefined') {
            setBtError('Bluetooth plugin not found. Run on a real device.');
            return;
        }

        setIsScanning(true);
        setBtError('');
        setDevices([]);

        window.bluetoothSerial.list(
            (foundDevices) => {
                if (foundDevices.length === 0) {
                    setBtError('No paired Bluetooth devices found. Please pair a printer in your Android Bluetooth settings first.');
                }
                setDevices(foundDevices);
                setIsScanning(false);
            },
            (failure) => {
                setBtError(`Error scanning for devices: ${failure}`);
                setIsScanning(false);
            }
        );
    };



    const connectToDevice = (device) => {
        
          
        setIsScanning(true); // Use same loading state for connecting
        setBtError('');
        window.bluetoothSerial.connect(
            device.address,
            async() => {
                alert(`Successfully connected to ${device.name}`);
                setConnectedDeviceAddress(device.address);
                setConnectedDeviceAddressName(device.name);
                await storeToken('printerAddressName', device.name);
                await storeToken('printerAddress', device.address);
                localStorage.setItem('printerAddress', device.address); // Save for auto-connect
                localStorage.setItem('printerAddressName', device.name); // Save for auto-connect
                setDevices([]); // Clear the list
                setIsScanning(false);
            },
            (failure) => {
                setBtError(`Failed to connect to ${device.name}: ${failure}`);
                setIsScanning(false);
            }
        );
    };

    const disconnectDevice = () => {
        setIsScanning(true);
        window.bluetoothSerial.disconnect(
            async () => {
                alert('Disconnected from printer.');
                setConnectedDeviceAddress(null);
                localStorage.removeItem('printerAddress');
                await storeToken('printerAddress', null);
                setIsScanning(false);
            },
            (failure) => {
                setBtError(`Failed to disconnect: ${failure}`);
                setIsScanning(false);
            }
        );
    };

    return (
        <div className="flex flex-col ">
            <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
            <div className="box-border flex min-h-screen">
                <div className='w-auto'>
                    <Sidebar isSidebarOpen={isSidebarOpen} />
                </div>
                
                <div className="flex flex-col w-full p-2 mx-auto overflow-x-auto transition-all duration-300">
                    <header className="flex flex-col items-center justify-start px-2 py-2 mb-2 bg-gray-100 rounded-md shadow md:justify-between md:flex-row">
                        <div className="flex items-baseline gap-2 sm:text-left">
                            <h1 className="text-lg font-semibold">Bluetooth Settings</h1>
                            <span className="text-xs text-gray-600">Manage Printer Connection</span>
                        </div>
                        <nav className="flex gap-2 text-xs text-gray-500">
                            <NavLink to="/dashboard" className="flex items-center text-gray-500 no-underline hover:text-gray-800">
                                <FaTachometerAlt /> Home
                            </NavLink>
                            <span className="text-gray-500">&gt;</span>
                            <span className="text-gray-500">Bluetooth Settings</span>
                        </nav>
                    </header>

                    <div className="p-4 bg-white border rounded-lg shadow-md">
                        <header className="flex items-center justify-between pb-4 mb-4 border-b">
                            <h2 className="text-xl font-semibold">Printer Connection</h2>
                            <button 
                                onClick={findDevices}
                                disabled={isScanning || platform !== 'android'}
                                className="flex items-center gap-2 px-4 py-2 text-white rounded bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-400"
                            >
                                <FaBluetooth />
                                {isScanning ? 'Scanning...' : 'Find Paired Devices'}
                            </button>
                        </header>

                        {platform !== 'android' && (
                             <div className="p-4 my-4 text-center bg-yellow-100 border-l-4 border-yellow-500 rounded-md">
                                <p className="font-semibold text-yellow-800">Feature Not Available</p>
                                <p className="text-yellow-700">Bluetooth management is only available on the native Android app.</p>
                             </div>
                        )}

                        {btError && (
                            <div className="p-4 my-4 text-center bg-red-100 border-l-4 border-red-500 rounded-md">
                                <p className="font-bold text-red-800">Error</p>
                                <p className="text-red-700">{btError}</p>
                            </div>
                        )}

                        {/* --- Connection Status --- */}
                        {platform === 'android' && (
                            <div className="p-4 mb-4 rounded-lg bg-gray-50">
                                <h3 className="mb-2 text-lg font-semibold">Connection Status</h3>
                                {connectedDeviceAddress ? (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-green-600">
                                            <FaCheckCircle size={20} />
                                            <div>
                                                <p className="font-bold">Connected</p>
                                                <p className="font-bold">{connectedDeviceAddressName}</p>
                                                <p className="font-mono text-sm">{connectedDeviceAddress}</p>
                                            </div>
                                        </div>
                                        <button onClick={disconnectDevice} className="px-3 py-1 text-sm text-white bg-red-500 rounded hover:bg-red-600">
                                            Disconnect
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-red-600">
                                        <FaTimesCircle size={20} />
                                        <p className="font-bold">Not Connected</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* --- Device List --- */}
                        {devices.length > 0 && (
                            <div className="mt-4">
                                <h3 className="text-lg font-semibold">Found Devices:</h3>
                                <div className="mt-2 space-y-2">
                                    {devices.map((device) => (
                                        <div key={device.id} className="flex items-center justify-between p-3 bg-gray-100 border border-gray-200 rounded-md">
                                            <div>
                                                <p className="font-bold text-gray-900">{device.name || 'Unnamed Device'}</p>
                                                <p className="font-mono text-sm text-gray-600">{device.address}</p>
                                            </div>
                                            <button 
                                                onClick={() => connectToDevice(device)}
                                                disabled={isScanning}
                                                className="px-4 py-1 text-sm font-semibold text-white bg-green-500 rounded-md hover:bg-green-600 disabled:bg-gray-400"
                                            >
                                                Connect
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrinterSettings;
