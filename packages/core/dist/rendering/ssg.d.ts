export declare function setStaticPage(pathname: string, html: string, revalidateSeconds?: number): void;
export declare function getStaticPage(pathname: string): {
    html: string;
    isStale: boolean;
} | null;
