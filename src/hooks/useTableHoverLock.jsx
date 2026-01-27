import { createContext, useContext, useState } from 'react';

const TableHoverLockContext = createContext(null);

export function TableHoverLockProvider({ children }) {
    const [isLocked, setIsLocked] = useState(false);

    const lock = () => setIsLocked(true);
    const unlock = () => setIsLocked(false);

    return (
        <TableHoverLockContext.Provider value={{ isLocked, lock, unlock }}>
            {children}
        </TableHoverLockContext.Provider>
    );
}

export function useTableHoverLock() {
    const context = useContext(TableHoverLockContext);
    if (!context) {
        throw new Error('useTableHoverLock must be used within TableHoverLockProvider');
    }
    return context;
}
