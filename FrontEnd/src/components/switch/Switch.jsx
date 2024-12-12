import Switch from '@mui/material/Switch';
import { styled } from '@mui/material/styles';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';

const IOSSwitch = styled((props) => (<Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />))(({ theme }) => ({
    width: 38,
    height: 22,
    padding: 0,
    '& .MuiSwitch-switchBase': {
        padding: 1,
        margin: 2,
        transitionDuration: '300ms',
        '&.Mui-checked': {
            transform: 'translateX(16px)',
            color: '#fff',
            '& + .MuiSwitch-track': {
                backgroundColor: '#3b82f680',
                opacity: 1,
                border: 0,
                ...theme.applyStyles('dark', {
                    backgroundColor: '#2ECA45',
                }),
            },
            '&.Mui-disabled + .MuiSwitch-track': {
                opacity: 0.5,
            },
        },
        '&.Mui-focusVisible .MuiSwitch-thumb': {
            color: '#33cf4d',
            border: '6px solid #fff',
        },
        '&.Mui-disabled .MuiSwitch-thumb': {
            color: theme.palette.grey[100],
            ...theme.applyStyles('dark', {
                color: theme.palette.grey[600],
            }),
        },
        '&.Mui-disabled + .MuiSwitch-track': {
            opacity: 0.7,
            ...theme.applyStyles('dark', {
                opacity: 0.3,
            }),
        },
    },
    '& .MuiSwitch-thumb': {
        boxSizing: 'border-box',
        width: 16,
        height: 16,
    },
    '& .MuiSwitch-track': {
        borderRadius: 26 / 2,
        backgroundColor: 'var(--background-ternary)',
        opacity: 1,
        transition: theme.transitions.create(['background-color'], {
            duration: 500,
        }),
        ...theme.applyStyles('dark', {
            backgroundColor: '#39393D',
        }),
    },
}));

export const SwitchButton = ({ checked, setChecked }) => {

    const handleSwitchChange = (event) => {
        setChecked(event.target.checked);
    };

    return (
        <FormControlLabel
            control={<IOSSwitch sx={{ m: 1 }} checked={checked} onChange={handleSwitchChange} />}
            sx={{ m: 0 }}
        />
    )
}