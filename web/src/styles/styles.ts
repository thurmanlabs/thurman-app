import { SxProps, Theme } from "@mui/material";

type StyleSet = Record<string, SxProps<Theme>>;

const containers: StyleSet = {
    backgroundContainer: {
        backgroundColor: "#eff6fd",
        minHeight: "100vh",
        padding: "2em 0 2em 0",
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
        margin: "0 6.25em 0 6.25em",
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
    }
}

export const styles = {
    containers,
    header,
    button,
}
