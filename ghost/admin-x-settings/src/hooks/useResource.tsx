import {useRef, useState} from 'react';

export default function useResource<Data>(defaultValue: Data, fetch: () => Promise<Data>) {
    const [data, setData] = useState<Data>(defaultValue);
    const fetched = useRef(false);

    const getValue = (): Data => {
        if (!fetched.current) {
            fetch().then(setData);
            fetched.current = true;
        }

        return data;
    };

    return [getValue, setData] as const;
}
