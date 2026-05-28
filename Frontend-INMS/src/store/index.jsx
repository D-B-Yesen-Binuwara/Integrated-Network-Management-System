import { createContext, useMemo, useState } from 'react';

const AppStoreContext = createContext(null);

export const AppStoreProvider = ({ children }) => {
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);

  const value = useMemo(
    () => ({ selectedDeviceId, setSelectedDeviceId }),
    [selectedDeviceId]
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
};
