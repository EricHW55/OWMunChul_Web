// src/app/layout.tsx
import './globals.css';

export const metadata = {
    title: '옵문철',
    description: 'Overwatch scoreboard 분석기',
    icons: {
        icon: "/icon.png",
    },
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ko">
        <body>{children}</body>
        </html>
    );
}
