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
    authOptionHeader: {
        margin: "1.5em 0 1em 0",
        textAlign: "center"
    },
    backgroundContainer: {
        backgroundColor: "#eff6fd",
        minHeight: "100vh",
        padding: "2em 0 2em 0",
    },
    content: {
        padding: "0 2em 0 2em",
    },
    form: {
        padding: "2em 2em 3em 2em",     // top right bottom left
        margin: "2em 0 2em 0",          // top right bottom left
        borderRadius: "1.25em",
    }
}

const header: StyleSet = {
    appBar: {
        backgroundColor: "#FFFFFE",
        boxShadow: "none",
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
        width: "1em",
        height: "1em",
        borderRadius: "0.25em",
    },
    header: {
        width: "2em",
        height: "2em",
        cursor: "pointer",
        transition: "opacity 0.2s ease-in-out",
        "&:hover": {
            opacity: 0.9
        }
    },
    large: {
        width: "3em",
        height: "3em"
    },
}

const forms: StyleSet = {
    textField: {
        margin: "0.5em 0",
        "& .MuiOutlinedInput-root": {
            borderRadius: "1.25em", 
        }
    },
}

const button: StyleSet = {
    primary: {
        background: "linear-gradient(90deg, #725aa2 0%, #29262a 100%)",
        color: "#FFFFFE",
        borderRadius: "1.25em",
        textTransform: "none",
        fontWeight: 700,
        padding: "0.325em 2.5em 0.325em 2.5em",
        "&:hover": {
            background: "linear-gradient(90deg, #725aa2 20%, #29262a 100%)", // Slight shift on hover
        },
        "&:disabled": {
            background: "#E0E0E0",
            color: "#A0A0A0"
        }
    },
    text: {
        color: "#725aa2",
        textTransform: "none",
        fontWeight: 700,
    },
    authOption: {
        backgroundColor: "#FFFFFE",
        borderColor: "#C5C5C5",
        borderRadius: "1.25em",
        justifyContent: "flex-start",
        textAlign: "left",
        textTransform: "none",
        color: "#29262a",
        fontWeight: 500,
        padding: "0.9em 1em 0.9em 1em", 
        margin: "0em 0 0.75em 0",
        "&:hover": {
            borderColor: "#29262a",
            backgroundColor: "#F2F1F0"
        }
    }
}

const accountDropdown: StyleSet = {
    avatar: {
        width: "2em",
        height: "2em",
        backgroundColor: "#725aa2"
    },
    walletIcon: {
        fontSize: 20
    },
    popper: {
        zIndex: 1300
    },
    paper: {
        mt: 1,
        minWidth: 240,
        borderRadius: 2,
        overflow: "hidden",
        backgroundColor: "#FFFFFE",
        boxShadow: "0 0.125em 0.25em rgba(0, 0, 0, 0.08)"
    },
    contentBox: {
        p: 2
    },
    addressText: {
        mt: 0.5
    },
    disconnectBox: {
        p: 1,
        '&:hover': {
            bgcolor: "error.lighter",
            cursor: "pointer"
        }
    },
    disconnectText: {
        color: "error.main",
        display: "flex",
        alignItems: "center",
        p: 1
    },
    disconnectIcon: {
        mr: 1,
        fontSize: 20
    }
}

export const styles = {
    containers,
    header,
    avatar,
    button,
    theme,
    accountDropdown,
    forms,
}