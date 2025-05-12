import { Alert as MuiAlert, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { motion, AnimatePresence } from 'framer-motion';

export const Alert = ({ alerts, setAlerts, ...props }) => {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
            }}
            {...props}
        >
            <AnimatePresence mode="popLayout">
                {alerts.map((alert) => (
                    <motion.div
                        key={alert.id}
                        layout // Enables smooth layout transitions when items are added or removed
                        initial={{ opacity: 0.5, y: 50, scale: 0.5 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.5 }}
                        transition={{ duration: 0.3 }}
                    >
                        <MuiAlert
                            severity={alert.type}
                            sx={{
                                fontSize: '1.5rem',
                                backgroundColor:
                                    alert.type === "success" ? "rgb(12, 19, 13)" :
                                    alert.type === "info" ? "rgb(7, 19, 24)" :
                                    alert.type === "warning" ? "rgb(25, 18, 7)" :
                                    "rgb(22, 11, 11)",
                                borderRadius: '1em',
                            }}
                            action={
                                <IconButton
                                    size="small"
                                    aria-label="close"
                                    color="inherit"
                                    onClick={() =>
                                        setAlerts(prev => prev.filter(a => a.id !== alert.id))
                                    }
                                >
                                    <CloseIcon fontSize="large" />
                                </IconButton>
                            }
                        >
                            {alert.message}
                        </MuiAlert>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};
