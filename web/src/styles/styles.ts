import { SxProps, Theme, createTheme, responsiveFontSizes } from "@mui/material";

type StyleSet = Record<string, SxProps<Theme>>;

let theme: Theme = createTheme({
    typography: {
        fontFamily: [
            "Libre Franklin",
            "sans-serif",
        ].join(","),
    },
    components: {
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundColor: "#FFFFFE",
                }
            }
        }
    },
});

theme = responsiveFontSizes(theme);

const containers: StyleSet = {
    backgroundContainer: {
        backgroundColor: "#eff6fd",
        minHeight: "100vh",
        padding: "2em 0 2em 0",
    },
    content: {
        padding: "0 2em 0 2em",
    },
    form: {
        padding: "2em 2em 2em 2em",     // top right bottom left
        margin: "2em 0 2em 0",          // top right bottom left
        borderRadius: "1.25em",
    }
}

const header: StyleSet = {
    appBar: {
        backgroundColor: "#FFFFFE",
        boxShadow: "none",
        borderBottom: "1px solid #AEAEAE",
    },
    toolbar: {
        display: "flex",
        justifyContent: "space-between",
    },
    logo: {
        color: "#29262a",
        fontWeight: "bold",
        fontSize: "1.5rem",
        cursor: "pointer",
    },
    authSection: {
        display: "flex",
        alignItems: "center",
        gap: 1,
    },
}

const avatar: StyleSet = {
    small: {
        width: "1.25em",
        height: "1.25em",
        borderRadius: "0.25em",
    }
}

const button: StyleSet = {
    primary: {
        background: "linear-gradient(90deg, #725aa2 0%, #29262a 100%)",
        color: "white",
        borderRadius: "1.25em",
        textTransform: "none",
        fontWeight: 700,
        padding: "0.325em 2.5em 0.325em 2.5em",
        "&:hover": {
            background: "linear-gradient(90deg, #725aa2 20%, #29262a 100%)", // Slight shift on hover
        },
    },
    text: {
        color: "#725aa2",
        textTransform: "none",
        fontWeight: 700,
    },
    authOption: {
        backgroundColor: "#eff6fd",
        borderColor: "#725aa2",
        borderRadius: "1.25em",
        justifyContent: "flex-start",
        textAlign: "left",
        textTransform: "none",
        color: "#29262a",
        fontWeight: 600,
        padding: "0.9em 1em 0.9em 1em", 
        margin: "0em 0 1em 0",
        "&:hover": {
            borderColor: "#725aa2",
            backgroundColor: "#e1e8ef"
        }
    }
}

export const styles = {
    containers,
    header,
    avatar,
    button,
    theme,
}
