import {POSProvider} from "./POSContext"


export const AppProviders = ({ children }) => {
  return (
    <POSProvider>
      {children}
    </POSProvider>
  );
}