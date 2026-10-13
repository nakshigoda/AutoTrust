import { createContext, useContext, useState, useEffect } from 'react';
import { getContract } from '../lib/ethereum';

export const ROLES = {
  PUBLIC:    'public',
  ADMIN:     'admin',
  SERVICE:   'service',
  INSURANCE: 'insurance',
  OWNER:     'owner',
};

const ROLE_LABELS = {
  [ROLES.PUBLIC]:    'Public Viewer',
  [ROLES.ADMIN]:     'Admin',
  [ROLES.SERVICE]:   'Service Center',
  [ROLES.INSURANCE]: 'Insurance Company',
  [ROLES.OWNER]:     'Vehicle Owner',
};

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState({ role: ROLES.PUBLIC });
  const [loading, setLoading] = useState(true);

  const checkWalletRole = async (walletAddress) => {
    try {
      const contract = await getContract();
      
      const adminAddr = await contract.admin();
      if (adminAddr.toLowerCase() === walletAddress.toLowerCase()) {
        return { name: 'System Admin', wallet: walletAddress, role: ROLES.ADMIN };
      }
      
      const isSvc = await contract.isServiceCenter(walletAddress);
      if (isSvc) {
        return { name: 'Authorized Service Center', wallet: walletAddress, role: ROLES.SERVICE };
      }
      
      const isIns = await contract.isInsuranceCompany(walletAddress);
      if (isIns) {
        return { name: 'Authorized Insurance Company', wallet: walletAddress, role: ROLES.INSURANCE };
      }
      
      // If none of the above, just a public viewer (who might be an owner of specific vehicles, but we handle that per-vehicle in owner dashboard)
      return { name: 'Wallet User', wallet: walletAddress, role: ROLES.OWNER };
      
    } catch (e) {
      console.error("Error determining wallet role:", e);
      return { role: ROLES.PUBLIC };
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask to use AutoTrust features.");
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        const u = await checkWalletRole(accounts[0]);
        setUser(u);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loginAs = async (roleKey) => {
    // We override the manual login mechanism to trigger MetaMask connection
    if (roleKey === ROLES.PUBLIC) {
      setUser({ role: ROLES.PUBLIC });
    } else {
      await connectWallet();
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', async (accounts) => {
        if (accounts.length > 0) {
          const u = await checkWalletRole(accounts[0]);
          setUser(u);
        } else {
          setUser({ role: ROLES.PUBLIC });
        }
      });
      window.ethereum.on('chainChanged', () => window.location.reload());
      
      // Check if already connected
      window.ethereum.request({ method: 'eth_accounts' }).then(async accounts => {
        if (accounts.length > 0) {
          const u = await checkWalletRole(accounts[0]);
          setUser(u);
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      currentRole: user.role,
      disconnect: () => loginAs(ROLES.PUBLIC),
      loginAs, 
      ROLES,
      ROLE_LABELS,
      isLoading: loading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
