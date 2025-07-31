import {CapacitorThermalPrinter} from 'capacitor-thermal-printer';


const scanAndConnect = async () => {
  await CapacitorThermalPrinter.startScan();
  CapacitorThermalPrinter.addListener('discoverDevices', (devices) => {
    console.log('Found:', devices);


    // Let user pick a device from UI
    const chosen = devices[0];

    CapacitorThermalPrinter.connect({ address: chosen.address });
    localStorage.setItem('printer_address', chosen.address);
  });
};

export default scanAndConnect;
