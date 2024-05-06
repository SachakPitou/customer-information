// Custom hook to handle router initialization
import { useRouter } from 'next/router';

export const useRouterWithCheck = () => {
    const router = useRouter();

    if (!router) {
        throw new Error('NextRouter not mounted.');
    }

    return router;
};
