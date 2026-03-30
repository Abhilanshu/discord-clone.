import { useEffect, useState } from "react";

export const useOrigin = () => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    let origin = typeof window !== "undefined" && window.location.origin ? window.location.origin : "";

    if (process.env.NEXT_PUBLIC_SITE_URL) {
        origin = process.env.NEXT_PUBLIC_SITE_URL;
    }

    if (!mounted) {
        return "";
    }

    return origin;
};
