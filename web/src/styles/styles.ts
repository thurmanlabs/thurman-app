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
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    borderRadius: "0.625rem"
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
        backgroundColor: "#FAFAFA",
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
    authCard: {
        padding: "3rem 2.5rem",
        borderRadius: "0.625rem",
        border: "1px solid #E9ECEF",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
    },
    authFormHeader: {
        textAlign: "center",
        mb: 3
    },
    authTitle: {
        fontSize: "1.5rem",
        fontWeight: 600,
        color: "#29262a",
        mb: 1,
        lineHeight: 1.3
    },
    authSubtitle: {
        fontSize: "0.9375rem",
        color: "#666",
        fontWeight: 400,
        lineHeight: 1.5
    },
    authLink: {
        fontSize: "0.9375rem",
        fontWeight: 500,
        color: "#725aa2",
        textDecoration: "none",
        "&:hover": {
            textDecoration: "underline"
        }
    },
    authFooterText: {
        fontSize: "0.9375rem",
        color: "#666",
        fontWeight: 400
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
            borderRadius: "0.625rem"
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
        borderBottom: "1px solid #E9ECEF",
    },
    toolbar: {
        display: "flex",
        justifyContent: "space-between",
        minHeight: "64px",
        padding: "0 1rem",
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
        gap: 1.5,
    },
    navLinksContainer: {
        display: "flex",
        alignItems: "center",
        gap: 2,
        marginLeft: 0,
    },
    navLink: {
        color: "#29262a",
        textDecoration: "none",
        fontWeight: 500,
        fontSize: "0.9375rem",
        padding: "0.5rem 0.75rem",
        borderRadius: "0.625rem",
        transition: "all 0.15s ease-in-out",
        "&:hover": {
            color: "#725aa2",
            backgroundColor: "rgba(114, 90, 162, 0.08)",
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
        width: "2.5em",
        height: "2.5em",
        cursor: "pointer",
        transition: "all 0.15s ease-in-out",
        marginRight: "1rem",
        "&:hover": {
            opacity: 0.8,
            transform: "scale(1.05)"
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
            borderRadius: "0.625rem", 
        }
    },
}

const button: StyleSet = {
    primary: {
        backgroundColor: "#29262a",
        color: "#FFFFFE",
        borderRadius: "0.625rem",
        textTransform: "none",
        fontWeight: 600,
        padding: "0.75rem 1.5rem",
        minHeight: "44px",
        "&:hover": {
            backgroundColor: "#1a181b",
        },
        "&:disabled": {
            backgroundColor: "#E0E0E0",
            color: "#A0A0A0"
        },
        transition: "background-color 0.15s ease-in-out"
    },
    text: {
        color: "#29262a",
        textTransform: "none",
        fontWeight: 500,
        fontSize: "0.9375rem",
        padding: "0.5rem 0.75rem",
        borderRadius: "0.625rem",
        transition: "all 0.15s ease-in-out",
        "&:hover": {
            color: "#725aa2",
            backgroundColor: "rgba(114, 90, 162, 0.08)",
        }
    },
    compact: {
        backgroundColor: "#29262a",
        color: "#FFFFFE",
        borderRadius: "0.625rem",
        textTransform: "none",
        fontWeight: 600,
        padding: "0.5rem 2rem",
        minHeight: "36px",
        fontSize: "0.9375rem",
        "&:hover": {
            backgroundColor: "#1a181b",
        },
        "&:disabled": {
            backgroundColor: "#E0E0E0",
            color: "#A0A0A0"
        },
        transition: "background-color 0.15s ease-in-out"
    },
    authOption: {
        backgroundColor: "#FFFFFE",
        borderColor: "#D3D3D3",
        borderRadius: "0.625rem",
        justifyContent: "flex-start",
        textAlign: "left",
        textTransform: "none",
        color: "#29262a",
        fontWeight: 500,
        padding: "0.9em 1em 0.9em 1em", 
        margin: "0em 0 0.75em 0",
        minHeight: "44px",
        "&:hover": {
            borderColor: "#29262a",
            backgroundColor: "#F8F8F8"
        },
        transition: "all 0.15s ease-in-out"
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
        backgroundColor: "#d32f2f",
        color: "#FFFFFE",
        borderRadius: "0.625rem",
        textTransform: "none",
        fontWeight: 600,
        padding: "0.75rem 1.5rem",
        minHeight: "44px",
        "&:hover": {
            backgroundColor: "#b71c1c",
        },
        "&:disabled": {
            backgroundColor: "#E0E0E0",
            color: "#A0A0A0"
        },
        transition: "background-color 0.15s ease-in-out"
    },
    large: {
        backgroundColor: "#29262a",
        color: "#FFFFFE",
        borderRadius: "0.625rem",
        textTransform: "none",
        fontWeight: 600,
        padding: "1rem 2rem",
        minHeight: "48px",
        fontSize: "1rem",
        "&:hover": {
            backgroundColor: "#1a181b",
        },
        "&:disabled": {
            backgroundColor: "#E0E0E0",
            color: "#A0A0A0"
        },
        transition: "background-color 0.15s ease-in-out"
    },
    outlined: {
        backgroundColor: "transparent",
        color: "#29262a",
        borderRadius: "0.625rem",
        textTransform: "none",
        fontWeight: 600,
        padding: "0.75rem 1.5rem",
        minHeight: "44px",
        border: "1.5px solid #29262a",
        "&:hover": {
            backgroundColor: "rgba(41, 38, 42, 0.08)",
            borderColor: "#29262a",
        },
        "&:disabled": {
            backgroundColor: "transparent",
            borderColor: "#E0E0E0",
            color: "#A0A0A0"
        },
        transition: "background-color 0.15s ease-in-out"
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
        background: "#FAFAFA",
        white: "#FFFFFE",
        success: "#4caf50",
        warning: "#ff9800",
        error: "#f44336"
    },
    table: {
        container: {
            borderRadius: "0.625rem",
            backgroundColor: "#FFFFFE",
            border: "1px solid #E9ECEF",
            boxShadow: "none",
            overflow: "hidden"
        },
        header: {
            backgroundColor: "#F8F9FA",
            "& .MuiTableCell-head": {
                fontWeight: 600,
                color: "#29262a",
                fontSize: "0.875rem",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                borderBottom: "2px solid #E9ECEF",
                padding: "1rem 1.25rem"
            }
        },
        row: {
            "&:hover": {
                backgroundColor: "#F8F9FA"
            },
            "& .MuiTableCell-body": {
                borderBottom: "1px solid #E9ECEF",
                padding: "1rem 1.25rem",
                fontSize: "0.9375rem"
            }
        },
        cell: {
            padding: "1rem 1.25rem",
            borderBottom: "1px solid #E9ECEF",
            fontSize: "0.9375rem"
        },
        statusChip: {
            borderRadius: "0.5rem",
            fontWeight: 500,
            fontSize: "0.8125rem"
        }
    },
    metrics: {
        card: {
            padding: "1.5rem",
            borderRadius: "0.625rem",
            backgroundColor: "#FFFFFE",
            border: "1px solid #E9ECEF",
            boxShadow: "none",
            height: "100%",
            transition: "none"
        },
        reviewCard: {
            padding: 0,
            borderRadius: "0.625rem",
            backgroundColor: "#F8F9FA",
            border: "1px solid #E9ECEF",
            boxShadow: "none",
            transition: "border-color 0.15s ease-in-out",
            "&:hover": {
                borderColor: "#D3D3D3"
            }
        },
        value: {
            color: "#29262a",
            fontWeight: 600,
            fontSize: "1.5rem",
            lineHeight: 1.2,
            marginTop: "0.5rem"
        },
        label: {
            color: "#666",
            fontWeight: 500,
            fontSize: "0.875rem",
            textTransform: "uppercase",
            letterSpacing: "0.5px"
        },
        icon: {
            fontSize: 20,
            color: "#666",
            mb: 0.5
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