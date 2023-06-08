import useResource from '../../hooks/useResource';
import {APIService} from '../api';
import {Setting, SiteData} from '../../types/api';
import {useCallback} from 'react';

export interface SettingsService {
    settings: Setting[] | null;
    saveSettings: (updatedSettings: Setting[]) => Promise<void>;
    siteData: SiteData | null;
}

function serialiseSettingsData(settings: Setting[]): Setting[] {
    return settings.map((setting) => {
        if (setting.key === 'facebook' && setting.value) {
            const value = setting.value as string;
            let [, user] = value.match(/(\S+)/) || [];

            return {
                key: setting.key,
                value: `https://www.facebook.com/${user}`
            };
        }
        if (setting.key === 'twitter' && setting.value) {
            const value = setting.value as string;
            let [, user] = value.match(/@?([^/]*)/) || [];

            return {
                key: setting.key,
                value: `https://twitter.com/${user}`
            };
        }

        return {
            key: setting.key,
            value: setting.value
        };
    });
}

function deserializeSettings(settings: Setting[]): Setting[] {
    return settings.map((setting) => {
        if (setting.key === 'facebook' && setting.value) {
            const deserialized = setting.value as string;
            let [, user] = deserialized.match(/(?:https:\/\/)(?:www\.)(?:facebook\.com)\/(?:#!\/)?(\w+\/?\S+)/mi) || [];

            return {
                key: setting.key,
                value: user
            };
        }

        if (setting.key === 'twitter' && setting.value) {
            const deserialized = setting.value as string;
            let [, user] = deserialized.match(/(?:https:\/\/)(?:twitter\.com)\/(?:#!\/)?@?([^/]*)/) || [];

            return {
                key: setting.key,
                value: `@${user}`
            };
        }

        return {
            key: setting.key,
            value: setting.value
        };
    });
}

export default function useSettingsService(api: APIService): SettingsService {
    const [settings, setSettings] = useResource<Setting[] | null>(null, async () => {
        try {
            const data = await api.settings.browse();
            return serialiseSettingsData(data.settings);
        } catch (error) {
            // TODO: error handling
            return null;
        }
    });

    const [siteData] = useResource<SiteData | null>(null, async () => {
        try {
            const siteDataRes = await api.site.browse();
            return siteDataRes.site;
        } catch (error) {
            // TODO: error handling
            return null;
        }
    });

    const saveSettings = useCallback(async (updatedSettings: Setting[]): Promise<void> => {
        try {
            // handle transformation for settings before save
            updatedSettings = deserializeSettings(updatedSettings);
            // Make an API call to save the updated settings
            const data = await api.settings.edit(updatedSettings);

            setSettings(serialiseSettingsData(data.settings));
        } catch (error) {
            // Log error in settings API
        }
    }, [api, setSettings]);

    return {
        get settings() {
            return settings();
        },
        get siteData() {
            return siteData();
        },
        saveSettings
    };
}
