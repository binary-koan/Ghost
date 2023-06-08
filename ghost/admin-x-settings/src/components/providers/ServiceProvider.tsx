import React, {createContext, useContext, useMemo} from 'react';
import setupGhostApi from '../../utils/api';
import useRolesService, {RolesService} from '../../utils/services/rolesService';
import useSettingsService, {SettingsService} from '../../utils/services/settingsService';

export interface FileService {
    uploadImage: (file: File) => Promise<string>;
}
interface ServicesContextProps {
    api: ReturnType<typeof setupGhostApi>;
    fileService: FileService
    settingsService: SettingsService
    rolesService: RolesService
}

interface ServicesProviderProps {
    children: React.ReactNode;
    ghostVersion: string;
}

// TODO: Don't export this and use useServices() and friends
export const ServicesContext = createContext<ServicesContextProps | null>(null);

export const ServicesProvider: React.FC<ServicesProviderProps> = ({children, ghostVersion}) => {
    const apiService = useMemo(() => setupGhostApi({ghostVersion}), [ghostVersion]);
    const fileService = useMemo(() => ({
        uploadImage: async (file: File): Promise<string> => {
            const response = await apiService.images.upload({file});
            return response.images[0].url;
        }
    }), [apiService]);

    const settingsService = useSettingsService(apiService);
    const rolesService = useRolesService(apiService);

    return (
        <ServicesContext.Provider value={{
            api: apiService,
            fileService,
            settingsService,
            rolesService
        }}>
            {children}
        </ServicesContext.Provider>
    );
};

export const useServices = () => useContext(ServicesContext)!;

export const useApi = () => useServices().api;
export const useFileService = () => useServices().fileService;
export const useSettings = () => useServices().settingsService;
export const useRoles = () => useServices().rolesService;
