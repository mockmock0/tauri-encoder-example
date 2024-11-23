import "../css/App.css";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { InitPage } from "./init";
import { AlertDialog, PresetDialog } from "./dialog";

const Main = () => {
  const theme = createTheme({
    palette: {
      mode: "dark",
    },
  });

  return (
    <>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <InitPage />
        <AlertDialog />
        <PresetDialog />
      </ThemeProvider>
    </>
  );
};

export { Main };
