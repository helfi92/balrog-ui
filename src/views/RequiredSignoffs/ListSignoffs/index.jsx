import React, { Fragment, useEffect, useState } from 'react';
import { titleCase } from 'change-case';
import classNames from 'classnames';
import { clone, view, lensPath } from 'ramda';
import Spinner from '@mozilla-frontend-infra/components/Spinner';
import { makeStyles } from '@material-ui/styles';
import Fab from '@material-ui/core/Fab';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import MenuItem from '@material-ui/core/MenuItem';
import TextField from '@material-ui/core/TextField';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import PlusIcon from 'mdi-react/PlusIcon';
import Dashboard from '../../../components/Dashboard';
import DialogAction from '../../../components/DialogAction';
import SignoffCard from '../../../components/SignoffCard';
import ErrorPanel from '../../../components/ErrorPanel';
import SignoffCardEntry from '../../../components/SignoffCardEntry';
import {
  signoffRequiredSignoff,
  revokeRequiredSignoff,
} from '../../../services/requiredSignoffs';
import { getUserInfo } from '../../../services/users';
import Link from '../../../utils/Link';
import getRequiredSignoffs from '../utils/getRequiredSignoffs';
import useAction from '../../../hooks/useAction';
import {
  DIALOG_ACTION_INITIAL_STATE,
  OBJECT_NAMES,
} from '../../../utils/constants';
import { withUser } from '../../../utils/AuthContext';

const getPermissionChangesLens = product => lensPath([product, 'permissions']);
const getRulesOrReleasesChangesLens = product =>
  lensPath([product, 'channels']);
const useStyles = makeStyles(theme => ({
  fab: {
    ...theme.mixins.fab,
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdown: {
    minWidth: 200,
  },
  dropdownDiv: {
    marginBottom: theme.spacing(2),
    display: 'flex',
    flex: 1,
    justifyContent: 'flex-end',
  },
  card: {
    marginBottom: theme.spacing(2),
  },
  lastDivider: {
    display: 'none',
  },
}));

function ListSignoffs({ user }) {
  const username = user.email;
  const classes = useStyles();
  const [requiredSignoffs, setRequiredSignoffs] = useState(null);
  const [product, setProduct] = useState('Firefox');
  const [roles, setRoles] = useState([]);
  const [signoffRole, setSignoffRole] = useState('');
  const [dialogState, setDialogState] = useState(DIALOG_ACTION_INITIAL_STATE);
  const [getRSAction, getRS] = useAction(getRequiredSignoffs);
  const [signoffAction, signoff] = useAction(signoffRequiredSignoff);
  const [revokeAction, revoke] = useAction(revokeRequiredSignoff);
  const [rolesAction, getRoles] = useAction(getUserInfo);
  const loading = getRSAction.loading || rolesAction.loading;
  const error =
    getRSAction.error ||
    revokeAction.error ||
    rolesAction.error ||
    (roles.length === 1 && signoffAction.error);
  const handleFilterChange = ({ target: { value } }) => setProduct(value);
  const handleSignoffRoleChange = ({ target: { value } }) =>
    setSignoffRole(value);
  const permissionChanges = view(
    getPermissionChangesLens(product),
    requiredSignoffs
  );
  const rulesOrReleasesChanges = view(
    getRulesOrReleasesChangesLens(product),
    requiredSignoffs
  );
  const dialogBody = (
    <FormControl component="fieldset">
      <RadioGroup
        aria-label="Role"
        name="role"
        value={signoffRole}
        onChange={handleSignoffRoleChange}>
        {roles.map(r => (
          <FormControlLabel key={r} value={r} label={r} control={<Radio />} />
        ))}
      </RadioGroup>
    </FormControl>
  );

  // Fetch view data
  useEffect(() => {
    Promise.all([getRS(), getRoles(username)]).then(([rs, userInfo]) => {
      setRequiredSignoffs(rs.data);
      setRoles(Object.keys(userInfo.data.data.roles));

      // todo: y u no work
      if (roles.length > 0) {
        setSignoffRole(roles[0]);
      }
    });
  }, []);

  const updateSignoffs = ({ signoffRole, type, roleName, product, channelName }) => {
    const result = clone(requiredSignoffs);

    if (type === OBJECT_NAMES.PRODUCT_REQUIRED_SIGNOFF) {
      result[product].channels[channelName][roleName].sc.signoffs[
        username
      ] = signoffRole;
    } else {
      result[product].permissions[roleName].sc.signoffs[
        username
      ] = signoffRole;
    }

    setRequiredSignoffs(result);
  };

  const doSignoff = async (
    signoffRole,
    type,
    entry,
    roleName,
    product,
    channelName
  ) => {
    const { error } = await signoff({
      type,
      scId: entry.sc.sc_id,
      role: signoffRole,
    });

    return { error, result: { signoffRole, type, roleName, product, channelName } };
  };

  const handleSignoff = async (...props) => {
    if (roles.length === 1) {
      const { error, result } = await doSignoff(roles[0], ...props);

      if (!error) {
        updateSignoffs(result);
      }
    } else {
      setDialogState({
        ...dialogState,
        open: true,
        title: 'Signoff as…',
        confirmText: 'Sign off',
        item: props,
      });
    }
  };

  const handleRevoke = async (type, entry, roleName, product, channelName) => {
    const { error } = await revoke({ type, scId: entry.sc.sc_id });

    if (!error) {
      const result = clone(requiredSignoffs);

      if (type === OBJECT_NAMES.PRODUCT_REQUIRED_SIGNOFF) {
        delete result[product].channels[channelName][roleName].sc.signoffs[
          username
        ];
      } else {
        delete result[product].permissions[roleName].sc.signoffs[username];
      }

      setRequiredSignoffs(result);
    }
  };

  // todo: this is actually unused i think?
  const handleDialogError = error => {
    setDialogState({ ...dialogState, error });
  };

  const handleDialogClose = () => {
    setDialogState(DIALOG_ACTION_INITIAL_STATE);
  };

  const handleDialogSubmit = async () => {
    const { error, result } = await doSignoff(signoffRole, ...dialogState.item);

    if (error) {
      throw error;
    }

    return result;
  };

  const handleDialogActionComplete = result => {
    updateSignoffs(result);
    handleDialogClose();
  };

  return (
    <Dashboard title="Required Signoffs">
      {error && <ErrorPanel fixed error={error} />}
      {loading && <Spinner loading />}
      {requiredSignoffs && (
        <Fragment>
          <div className={classes.toolbar}>
            {permissionChanges && (
              <Typography gutterBottom variant="h5">
                Changes to Permissions
              </Typography>
            )}
            {!permissionChanges && rulesOrReleasesChanges && (
              <Typography gutterBottom variant="h5">
                Changes to Rules / Releases
              </Typography>
            )}
            <div className={classes.dropdownDiv}>
              <TextField
                className={classes.dropdown}
                select
                label="Product"
                value={product}
                onChange={handleFilterChange}>
                {Object.keys(requiredSignoffs).map(product => (
                  <MenuItem key={product} value={product}>
                    {product}
                  </MenuItem>
                ))}
              </TextField>
            </div>
          </div>
          {permissionChanges && (
            <SignoffCard
              className={classes.card}
              title={titleCase(product)}
              to={`/required-signoffs/${product}`}>
              {Object.entries(permissionChanges).map(
                ([name, role], index, arr) => {
                  const key = `${name}-${index}`;

                  return (
                    <Fragment key={key}>
                      <SignoffCardEntry
                        key={name}
                        name={name}
                        entry={role}
                        onSignoff={() =>
                          handleSignoff(
                            OBJECT_NAMES.PERMISSIONS_REQUIRED_SIGNOFF,
                            role,
                            name,
                            product
                          )
                        }
                        onRevoke={() =>
                          handleRevoke(
                            OBJECT_NAMES.PERMISSIONS_REQUIRED_SIGNOFF,
                            role,
                            name,
                            product
                          )
                        }
                      />
                      <Divider
                        className={classNames({
                          [classes.lastDivider]: arr.length - 1 === index,
                        })}
                      />
                    </Fragment>
                  );
                }
              )}
            </SignoffCard>
          )}
          <div>
            {rulesOrReleasesChanges && (
              <Fragment>
                {permissionChanges && (
                  <Fragment>
                    <br />
                    <Typography gutterBottom variant="h5">
                      Changes to Rules / Releases
                    </Typography>
                    <br />
                  </Fragment>
                )}
                {Object.entries(rulesOrReleasesChanges).map(
                  ([channelName, roles]) => (
                    <SignoffCard
                      key={`${product}-${channelName}`}
                      className={classes.card}
                      title={titleCase(`${product} ${channelName} Channel`)}
                      to={`/required-signoffs/${product}/${channelName}`}>
                      {Object.entries(roles).map(
                        ([roleName, role], index, arr) => {
                          const key = `${roleName}-${index}`;

                          return (
                            <Fragment key={key}>
                              <SignoffCardEntry
                                key={roleName}
                                name={roleName}
                                entry={role}
                                onSignoff={() =>
                                  handleSignoff(
                                    OBJECT_NAMES.PRODUCT_REQUIRED_SIGNOFF,
                                    role,
                                    roleName,
                                    product,
                                    channelName
                                  )
                                }
                                onRevoke={() =>
                                  handleRevoke(
                                    OBJECT_NAMES.PRODUCT_REQUIRED_SIGNOFF,
                                    role,
                                    roleName,
                                    product,
                                    channelName
                                  )
                                }
                              />
                              <Divider
                                className={classNames({
                                  [classes.lastDivider]:
                                    arr.length - 1 === index,
                                })}
                              />
                            </Fragment>
                          );
                        }
                      )}
                    </SignoffCard>
                  )
                )}
              </Fragment>
            )}
            {!permissionChanges && !rulesOrReleasesChanges && (
              <Typography>No required signoffs for {product}</Typography>
            )}
          </div>
          <Link to="/required-signoffs/create">
            <Tooltip title="Enable Signoff for a New Product">
              <Fab
                color="primary"
                className={classes.fab}
                classes={{ root: classes.fab }}>
                <PlusIcon />
              </Fab>
            </Tooltip>
          </Link>
        </Fragment>
      )}
      <DialogAction
        open={dialogState.open}
        title={dialogState.title}
        body={dialogBody}
        confirmText={dialogState.confirmText}
        onSubmit={handleDialogSubmit}
        onError={handleDialogError}
        error={dialogState.error}
        onComplete={handleDialogActionComplete}
        onClose={handleDialogClose}
      />
    </Dashboard>
  );
}

export default withUser(ListSignoffs);
