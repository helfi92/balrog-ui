import React, { useState, Fragment } from 'react';
import { makeStyles } from '@material-ui/styles';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import IconButton from '@material-ui/core/IconButton';
import SettingsOutlineIcon from 'mdi-react/SettingsOutlineIcon';
import Link from '../../utils/Link';
import menuItems from './menuItems';

const useStyles = makeStyles(theme => ({
  settings: {
    height: theme.spacing(6),
    width: theme.spacing(6),
    padding: 0,
    margin: `0 ${theme.spacing(1)}px`,
  },
  settingsIcon: {
    fill: '#fff',
  },
  link: {
    textDecoration: 'none',
    color: 'unset',
  },
}));

export default function SettingsMenu() {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = useState(null);
  const handleMenuOpen = e => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  return (
    <Fragment>
      <IconButton
        className={classes.settings}
        aria-haspopup="true"
        aria-controls="user-menu"
        aria-label="user menu"
        onClick={handleMenuOpen}>
        <SettingsOutlineIcon size={24} className={classes.settingsIcon} />
      </IconButton>
      <Menu
        id="user-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        getContentAnchorEl={null}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        onClose={handleMenuClose}>
        {menuItems.settings.map(navItem => (
          <Link key={navItem.value} className={classes.link} to={navItem.path}>
            <MenuItem title={navItem.value}>{navItem.value}</MenuItem>
          </Link>
        ))}
      </Menu>
    </Fragment>
  );
}
