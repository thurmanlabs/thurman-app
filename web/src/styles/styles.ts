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
    },
    formContainer: {
        padding: "2em 2em 3em 2em",
        margin: "2em 0 2em 0",
        borderRadius: "1.25em",
    },
    pageContainer: {
        py: 4
    },
    sectionHeader: {
        mb: 4
    },
    flexCenter: {
        display: "flex",
        alignItems: "center"
    },
    flexBetween: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
    },
    flexColumn: {
        display: "flex",
        flexDirection: "column"
    },
    textCenter: {
        textAlign: "center"
    },
    cardContainer: {
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch"
    },
    cardContent: {
        flexGrow: 1,
        display: "flex",
        flexDirection: "column"
    },
    gridContainer: {
        flexGrow: 1
    },
    iconContainer: {
        display: "flex",
        alignItems: "center",
        gap: 1,
        mb: 1
    },
    iconSmall: {
        fontSize: 16,
        color: "text.secondary"
    },
    iconMedium: {
        fontSize: 20,
        color: "primary.main"
    },
    iconLarge: {
        fontSize: 48,
        color: "text.secondary",
        mb: 2
    },
    iconExtraLarge: {
        fontSize: 64,
        color: "primary.main",
        mb: 3
    },
    skeletonContainer: {
        mb: 2
    },
    skeletonText: {
        mb: 1
    },
    skeletonLarge: {
        mb: 2
    },
    divider: {
        my: 2
    },
    alert: {
        mb: 4
    },
    alertRounded: {
        mb: 2,
        borderRadius: "1.25em"
    },
    tableContainer: {
        borderRadius: "1.25em",
        overflow: "hidden"
    },
    tableHeader: {
        backgroundColor: "#f8f9fa"
    },
    emptyState: {
        textAlign: "center",
        py: 8
    },
    loadingState: {
        textAlign: "center",
        py: 4
    },
    errorState: {
        textAlign: "center",
        py: 4
    },
    infoBox: {
        mb: 3,
        p: 2,
        backgroundColor: "#f8f9fa",
        borderRadius: "0.75em"
    },
    successBox: {
        mt: 1,
        p: 1,
        backgroundColor: "#e8f5e8",
        borderRadius: 1
    },
    filterContainer: {
        p: 2,
        borderBottom: "1px solid #e0e0e0"
    },
    filterChips: {
        display: "flex",
        gap: 1,
        flexWrap: "wrap"
    },
    progressContainer: {
        width: "100%"
    },
    progressBar: {
        height: 8,
        borderRadius: 4,
        backgroundColor: "#f0f0f0",
        mb: 1
    },
    progressMessage: {
        display: "block",
        mb: 1
    },
    stepContainer: {
        mt: 1
    },
    stepItem: {
        display: "flex",
        alignItems: "center",
        mb: 0.5
    },
    stepDot: {
        width: 8,
        height: 8,
        borderRadius: "50%",
        mr: 1
    },
    stepText: {
        fontSize: "0.7rem",
        fontWeight: 400
    },
    stepTextSuccess: {
        fontSize: "0.7rem",
        fontWeight: 600
    },
    stepTxId: {
        ml: 1,
        fontSize: "0.65rem",
        color: "#666",
        fontFamily: "monospace"
    },
    retryContainer: {
        mt: 1
    },
    retryButtons: {
        display: "flex",
        gap: 1,
        flexWrap: "wrap"
    },
    retryButton: {
        fontSize: "0.75rem"
    },
    actionButtons: {
        display: "flex",
        gap: 1
    },
    dialogTitle: {
        color: "#29262a"
    },
    dialogContent: {
        mt: 2
    },
    dialogGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 2,
        mb: 3
    },
    dialogField: {
        mt: 2,
        "& .MuiOutlinedInput-root": {
            borderRadius: "1.25em"
        }
    },
    formHelperText: {
        mt: 1,
        ml: 1
    },
    formHelperTextWarning: {
        mt: 1,
        ml: 1,
        color: "#ed6c02"
    },
    circularProgress: {
        mr: 1,
        color: "#FFFFFE"
    },
    circularProgressLarge: {
        color: "#725aa2",
        mb: 2
    },
    backButton: {
        mr: 2
    },
    chipContainer: {
        mt: 2,
        display: "flex",
        gap: 2,
        flexWrap: "wrap"
    },
    refreshIcon: {
        transform: "none",
        transition: "transform 0.5s"
    },
    refreshIconSpinning: {
        transform: "rotate(360deg)",
        transition: "transform 0.5s"
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
    navLinksContainer: {
        display: "flex",
        gap: "2rem",
        marginLeft: "2rem"
    },
    navLink: {
        color: "#725aa2",
        textDecoration: "none",
        fontWeight: 500,
        "&:hover": {
            color: "#29262a"
        }
    },
    pageTitle: {
        mb: 4,
        color: "#29262a"
    },
    sectionTitle: {
        mb: 2,
        color: "#29262a"
    },
    cardTitle: {
        fontWeight: 600,
        color: "#29262a"
    },
    tableHeader: {
        fontWeight: 600,
        color: "#29262a"
    },
    tableCell: {
        color: "#29262a"
    },
    emptyTitle: {
        fontWeight: 600,
        color: "#29262a",
        mb: 2
    },
    emptySubtitle: {
        mb: 3,
        color: "text.secondary"
    },
    emptyDescription: {
        mb: 4,
        maxWidth: 600,
        mx: "auto"
    }
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
        borderColor: "#D3D3D3",
        borderRadius: "1.25em",
        justifyContent: "flex-start",
        textAlign: "left",
        textTransform: "none",
        color: "#29262a",
        fontWeight: 500,
        padding: "0.9em 1em 0.9em 1em", 
        margin: "0em 0 0.75em 0",
        "&:hover": {
            borderColor: "#D3D3D3",
            backgroundColor: "#F2F1F0"
        }
    },
    iconButton: {
        color: "#725aa2"
    },
    iconButtonSuccess: {
        color: "success.main"
    },
    iconButtonError: {
        color: "error.main"
    },
    retryButton: {
        fontSize: "0.75rem"
    },
    rejectButton: {
        background: "linear-gradient(90deg, #d32f2f 0%, #b71c1c 100%)"
    },
    large: {
        background: "linear-gradient(90deg, #725aa2 0%, #29262a 100%)",
        color: "#FFFFFE",
        borderRadius: "1.25em",
        textTransform: "none",
        fontWeight: 700,
        padding: "0.75em 3em",
        "&:hover": {
            background: "linear-gradient(90deg, #725aa2 20%, #29262a 100%)",
            transform: "translateY(-1px)",
            boxShadow: "0 4px 12px rgba(114, 90, 162, 0.3)",
        },
        "&:disabled": {
            background: "#E0E0E0",
            color: "#A0A0A0",
            transform: "none",
            boxShadow: "none"
        },
        transition: "all 0.2s ease-in-out"
    },
    outlined: {
        background: "transparent",
        color: "#725aa2",
        borderRadius: "1.25em",
        textTransform: "none",
        fontWeight: 700,
        padding: "0.325em 2.5em",
        border: "2px solid #725aa2",
        "&:hover": {
            background: "rgba(114, 90, 162, 0.1)",
            transform: "translateY(-1px)",
            boxShadow: "0 4px 12px rgba(114, 90, 162, 0.3)",
        },
        "&:disabled": {
            background: "#E0E0E0",
            color: "#A0A0A0",
            transform: "none",
            boxShadow: "none"
        },
        transition: "all 0.2s ease-in-out"
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
        "&:hover": {
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
    },
    button: {
        display: "flex",
        alignItems: "center",
        gap: 1,
        textTransform: "none",
        color: "white",
        "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.1)"
        }
    },
    userAvatar: {
        width: 32,
        height: 32,
        bgcolor: "primary.main",
        fontSize: "0.875rem"
    },
    menu: {
        mt: 1,
        minWidth: 200,
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        borderRadius: 2
    },
    menuItem: {
        py: 1.5
    },
    logoutIcon: {
        mr: 2,
        fontSize: 20
    }
}

const typography: StyleSet = {
    bodyText: {
        color: "#666"
    },
    bodyTextSecondary: {
        color: "text.secondary"
    },
    bodyTextBold: {
        fontWeight: 500
    },
    bodyTextBoldLarge: {
        fontWeight: 600
    },
    captionText: {
        color: "#666"
    },
    captionTextError: {
        color: "error.main"
    },
    captionTextSuccess: {
        color: "success.main",
        fontWeight: 600
    },
    captionTextSmall: {
        fontSize: "0.7rem"
    },
    captionTextMonospace: {
        fontSize: "0.65rem",
        color: "#666",
        fontFamily: "monospace"
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
    typography,
    colors: {
        primary: "#725aa2",
        secondary: "#29262a",
        background: "#eff6fd",
        white: "#FFFFFE",
        success: "#4caf50",
        warning: "#ff9800",
        error: "#f44336"
    },
    table: {
        container: {
            borderRadius: "1.25em",
            backgroundColor: "#FFFFFE",
            boxShadow: "0 0.125em 0.25em rgba(0, 0, 0, 0.08)",
            overflow: "hidden"
        },
        header: {
            backgroundColor: "#f8f9fa",
            "& .MuiTableCell-head": {
                fontWeight: 600,
                color: "#29262a",
                borderBottom: "2px solid #e9ecef"
            }
        },
        row: {
            "&:hover": {
                backgroundColor: "#f8f9fa"
            },
            "& .MuiTableCell-body": {
                borderBottom: "1px solid #e9ecef",
                padding: "1rem"
            }
        },
        cell: {
            padding: "1rem",
            borderBottom: "1px solid #e9ecef"
        },
        statusChip: {
            borderRadius: "0.5em",
            fontWeight: 500,
            fontSize: "0.75rem"
        }
    },
    metrics: {
        card: {
            padding: "1.5rem",
            borderRadius: "1.25em",
            backgroundColor: "#FFFFFE",
            boxShadow: "0 0.125em 0.25em rgba(0, 0, 0, 0.08)",
            height: "100%",
            transition: "transform 0.2s ease-in-out",
            "&:hover": {
                transform: "translateY(-2px)"
            }
        },
        value: {
            color: "#725aa2",
            fontWeight: 700,
            marginTop: "0.5em"
        },
        label: {
            color: "#29262a",
            fontWeight: 500
        }
    },
    pools: {
        section: {
            marginTop: "2em"
        },
        card: {
            padding: "1.5rem",
            borderRadius: "1.25em",
            backgroundColor: "#FFFFFE",
            boxShadow: "0 0.125em 0.25em rgba(0, 0, 0, 0.08)",
            marginBottom: "1em",
            transition: "transform 0.2s ease-in-out",
            "&:hover": {
                transform: "translateY(-2px)"
            }
        }
    }
}