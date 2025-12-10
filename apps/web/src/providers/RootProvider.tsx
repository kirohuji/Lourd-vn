import { SnackbarProvider } from 'notistack';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './AuthProvider';
import MyThemeProvider from './ThemeProvider';

export default function RootProvider({ children }: { children: React.ReactNode }) {
    return (
        <BrowserRouter>
            <MyThemeProvider>
                <SnackbarProvider
                    anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'left',
                    }}
                >
                    <AuthProvider>{children}</AuthProvider>
                </SnackbarProvider>
            </MyThemeProvider>
        </BrowserRouter>
    );
}
