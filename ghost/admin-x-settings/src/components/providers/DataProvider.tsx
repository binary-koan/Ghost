import React from 'react';
import {UsersProvider} from './UsersProvider';

type DataProviderProps = {
    children: React.ReactNode;
};

const DataProvider: React.FC<DataProviderProps> = ({children}) => {
    return (
        // <SettingsProvider>
        <UsersProvider>
            {/* <RolesProvider> */}
            {children}
            {/* </RolesProvider> */}
        </UsersProvider>
        // </SettingsProvider>
    );
};

export default DataProvider;
