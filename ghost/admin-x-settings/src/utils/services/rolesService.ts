import useResource from '../../hooks/useResource';
import {APIService} from '../api';
import {UserRole} from '../../types/api';

export interface RolesService {
    roles: UserRole[]
    assignableRoles: UserRole[]
    getRoleId: (roleName: string, roles: UserRole[]) => string;
}

function getRoleId(roleName: string, roles: UserRole[]): string {
    const role = roles.find((r) => {
        return r.name.toLowerCase() === roleName?.toLowerCase();
    });

    return role?.id || '';
}

export default function useRolesService(api: APIService): RolesService {
    const [roles] = useResource<UserRole[]>([], async () => {
        try {
            const rolesData = await api.roles.browse();
            return rolesData.roles;
        } catch (error) {
            // TODO: error handling
            return [];
        }
    });
    const [assignableRoles] = useResource<UserRole[]>([], async () => {
        const assignableRolesData = await api.roles.browse({
            queryParams: {
                permissions: 'assign'
            }
        });
        return assignableRolesData.roles;
    });

    return {
        get roles() {
            return roles();
        },
        get assignableRoles() {
            return assignableRoles();
        },
        getRoleId
    };
}
