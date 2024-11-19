import React, { useState } from "react";
import useAccount from "../hooks/useAccount";
import { 
    Avatar,
    Popper,
    Paper,
    ClickAwayListener,
    Typography,
    Divider,
    IconButton,
    Box,
    Fade
} from "@mui/material";
import LogoutIcon from '@mui/icons-material/Logout';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { styles } from "../styles/styles";

function shortenAddress(address: string, chars = 4): string {
    if (!address) return "";
    const start = address.substring(0, chars + 2);
    const end = address.substring(address.length - chars);
    return `${start}...${end}`;
}

export default function AccountDropdown() {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const { userAccount, connectionType, logout } = useAccount();
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(anchorEl ? null : event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleDisconnect = async () => {
        if (connectionType) {
            await logout(connectionType);
            handleClose();
        }
    };

    return (
        <>
            {userAccount && (
                <ClickAwayListener onClickAway={handleClose}>
                    <div>
                        <IconButton
                            onClick={handleClick}
                            size="small"
                            aria-describedby={open ? "account-popper" : undefined}
                        >
                            <Avatar sx={styles.accountDropdown.avatar}>
                                <AccountBalanceWalletIcon sx={styles.accountDropdown.walletIcon} />
                            </Avatar>
                        </IconButton>

                        <Popper
                            id="account-popper"
                            open={open}
                            anchorEl={anchorEl}
                            placement="bottom-end"
                            transition
                            sx={styles.accountDropdown.popper}
                        >
                            {({ TransitionProps }) => (
                                <Fade {...TransitionProps} timeout={200}>
                                    <Paper sx={styles.accountDropdown.paper}>
                                        <Box sx={styles.accountDropdown.contentBox}>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                Connected with {connectionType}
                                            </Typography>
                                            <Typography variant="body2" sx={styles.accountDropdown.addressText}>
                                                {shortenAddress(userAccount)}
                                            </Typography>
                                        </Box>

                                        <Divider />

                                        <Box
                                            sx={styles.accountDropdown.disconnectBox}
                                            onClick={handleDisconnect}
                                        >
                                            <Typography 
                                                variant="body2" 
                                                sx={styles.accountDropdown.disconnectText}
                                            >
                                                <LogoutIcon sx={styles.accountDropdown.disconnectIcon} />
                                                Disconnect
                                            </Typography>
                                        </Box>
                                    </Paper>
                                </Fade>
                            )}
                        </Popper>
                    </div>
                </ClickAwayListener>
            )}
        </>
    );
}