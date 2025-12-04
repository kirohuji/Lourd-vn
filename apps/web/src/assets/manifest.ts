import { AssetsManifest } from '@drincs/pixi-vn';
import { MAIN_MENU_ROUTE } from '../constans';

/**
 * Manifest for the assets used in the game.
 * You can read more about the manifest here: https://pixijs.com/8.x/guides/components/assets#loading-multiple-assets
 */
const manifest: AssetsManifest = {
    bundles: [
        // screens
        {
            name: MAIN_MENU_ROUTE,
            assets: [
                {
                    alias: 'background_main_menu',
                    src: 'https://firebasestorage.googleapis.com/v0/b/pixi-vn.appspot.com/o/public%2Fmain-menu.webp?alt=media',
                },
            ],
        },
        // labels
        // characters
        // 注意：地图、地点、房间相关的资源现已从后端 manifest（/manifest）生成，
        // 这里只保留少量 UI 资源示例，其余由后端资源管理控制。
        // alice
        {
            name: 'alice',
            assets: [
                {
                    alias: 'alice_terrace0A',
                    src: 'https://raw.githubusercontent.com/DRincs-Productions/NQTR-System/main/game/images/Alice/terrace0A.webp',
                },
                {
                    alias: 'alice_terrace0At',
                    src: 'https://raw.githubusercontent.com/DRincs-Productions/NQTR-System/main/game/images/Alice/terrace0At.webp',
                },
                {
                    alias: 'alice_roomsleep0A',
                    src: 'https://raw.githubusercontent.com/DRincs-Productions/NQTR-System/main/game/images/Alice/roomsleep0A.webp',
                },
            ],
        },
        // navigation icons
        {
            name: 'navigation_icons',
            assets: [
                {
                    alias: 'arrow_left',
                    src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDYwIDYwIj48cGF0aCBkPSJNNDAgMTAgTDEwIDMwIEw0MCA1MCBNMTAgMzAgTDUwIDMwIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjQiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==',
                },
                {
                    alias: 'arrow_right',
                    src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDYwIDYwIj48cGF0aCBkPSJNMjAgMTAgTDUwIDMwIEwyMCA1MCBNNTAgMzAgTDEwIDMwIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjQiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==',
                },
                {
                    alias: 'arrow_up',
                    src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDYwIDYwIj48cGF0aCBkPSJNMzAgNTAgTDMwIDEwIE0xMCAzMCBMMzAgMTAgTDUwIDMwIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjQiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==',
                },
                {
                    alias: 'arrow_down',
                    src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDYwIDYwIj48cGF0aCBkPSJNMzAgMTAgTDMwIDUwIE0xMCAzMCBMMzAgNTAgTDUwIDMwIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjQiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==',
                },
                {
                    alias: 'hand_pointer',
                    src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDYwIDYwIj48cGF0aCBkPSJNMzUgMTIgQzM1IDkgMzcgNyA0MCA3IEM0MyA3IDQ1IDkgNDUgMTIgTDQ1IDI3IEM0NSAzMCA0MyAzMiA0MCAzMiBDMzcgMzIgMzUgMzAgMzUgMjcgTDM1IDEyIFoiIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuNyIvPjxwYXRoIGQ9Ik0yNSAyNyBDMjUgMjQgMjcgMjIgMzAgMjIgTDMwIDMyIEMyNyAzMiAyNSAzMCAyNSAyNyBaIiBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjciLz48cGF0aCBkPSJNMTggMzMgQzE4IDMwIDIwIDI4IDIzIDI4IEwyMyAzOCBDMjAgMzggMTggMzYgMTggMzMgWiIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC43Ii8+PHBhdGggZD0iTTEyIDM5IEMxMiAzNiAxNCAzNCAxNyAzNCBMMTcgNDQgQzE0IDQ0IDEyIDQyIDEyIDM5IFoiIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuNyIvPjwvc3ZnPg==',
                },
            ],
        },
    ],
};
export default manifest;
