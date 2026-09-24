import React from 'react';
import { useOffline } from '../../hooks/useOffline';

const OfflineBanner: React.FC = () => {
  const { isOffline } = useOffline();
  if (!isOffline) return null;
  return (
    <div className="offline-banner">
      📵 You're offline — some features may be unavailable. Cached content is still accessible.
    </div>
  );
};

export default OfflineBanner;
