import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useEffect, useState } from 'react';
import { deleteFeed } from '../../utils/deleteFeed';
import { followUser } from '../../utils/follow';

export const DrawerButton = ({ drawerInfo }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const [isFollower, setIsFollower] = useState(false);

    useEffect(() => {
        if (!drawerInfo) return;
        setIsFollower(drawerInfo["follow"]?.isFollower || false);
    }, [drawerInfo])

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleFeedDelete = async (feedId, feedType) => {
        await deleteFeed({
            feedId,
            feedType
        });
    }

    const handleFollow = async (userName) => {
        await followUser(userName);
        setIsFollower(!isFollower);
    }

    return (
        <div>
            <MoreVertIcon
                fontSize="large"
                style={{ color: 'var(--text-primary-70)' }}
                id="basic-button"
                aria-controls={open ? 'basic-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
            />

            <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': 'basic-button',
                }}
                sx={{
                    '& .MuiPaper-root': {
                        backgroundColor: 'var(--background-secondary)',
                        color: 'var(--text-primary-50)',
                        borderRadius: '10px',
                    },
                }}
            >
                { drawerInfo && (
                    Object.keys(drawerInfo).map((key) => (
                        key === "delete" ? (
                            <MenuItem 
                                key={key} 
                                onClick={() => { handleClose(); handleFeedDelete(drawerInfo[key].feedId, drawerInfo[key].feedType); }} 
                                sx={{
                                    fontSize: '1.3em',
                                    '&:hover': {
                                        backgroundColor: 'var(--background-ternary)',
                                    },
                                }}
                            >
                                Delete
                            </MenuItem>
                        ) : 
                        key === "follow" ? (
                            <MenuItem 
                                key={key} 
                                onClick={() => { handleClose(); handleFollow(drawerInfo[key].userName); }} 
                                sx={{
                                    fontSize: '1.3em',
                                    '&:hover': {
                                        backgroundColor: 'var(--background-ternary)',
                                    },
                                }}
                            >
                                { isFollower ? "Unfollow" : "Follow" }
                            </MenuItem>
                        ) : 
                        <MenuItem 
                            key={key} 
                            onClick={() => { handleClose(); drawerInfo[key](); }} 
                            sx={{
                                fontSize: '1.3em',
                                '&:hover': {
                                    backgroundColor: 'var(--background-ternary)',
                                },
                            }}
                        >
                            { key }
                        </MenuItem>
                    ))
                )}

            </Menu>
        </div>
    );
};
