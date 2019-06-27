import React, { useState, useEffect, Fragment } from 'react';
import { bool } from 'prop-types';
import Spinner from '@mozilla-frontend-infra/components/Spinner';
import { makeStyles } from '@material-ui/styles';
import TextField from '@material-ui/core/TextField';
import Tooltip from '@material-ui/core/Tooltip';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Fab from '@material-ui/core/Fab';
import Grid from '@material-ui/core/Grid';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Typography from '@material-ui/core/Typography';
import SpeedDialAction from '@material-ui/lab/SpeedDialAction';
import NumberFormat from 'react-number-format';
import ContentSaveIcon from 'mdi-react/ContentSaveIcon';
import PlusIcon from 'mdi-react/PlusIcon';
import DeleteIcon from 'mdi-react/DeleteIcon';
import Dashboard from '../../../components/Dashboard';
import SpeedDial from '../../../components/SpeedDial';
import ErrorPanel from '../../../components/ErrorPanel';
import AutoCompleteText from '../../../components/AutoCompleteText';
import { getChannels, getProducts } from '../../../utils/Rules';
import getRequiredSignoffs from '../utils/getRequiredSignoffs';
import updateRequiredSignoffs from '../utils/updateRequiredSignoffs';
import getRolesFromRequiredSignoffs from '../utils/getRolesFromRequiredSignoffs';
import useAction from '../../../hooks/useAction';

let additionalRoleId = 0;
const useStyles = makeStyles(theme => ({
  iconButtonGrid: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  iconButton: {
    marginTop: theme.spacing(1),
  },
  fab: {
    ...theme.mixins.fab,
    right: theme.spacing(12),
  },
  gridWithIcon: {
    marginTop: theme.spacing(3),
  },
  addRoleButton: {
    width: '100%',
  },
  addRoleGrid: {
    marginTop: theme.spacing(5),
  },
  paper: {
    position: 'absolute',
    zIndex: 1,
    marginTop: theme.spacing(1),
    left: 0,
    right: 0,
  },
}));

function ViewSignoff({ isNewSignoff, ...props }) {
  const getEmptyRole = (id = 0) => ({
    name: '',
    signoffs_required: null,
    data_version: null,
    sc: null,
    metadata: {
      isAdditionalRole: true,
      id,
    },
  });
  const { product, channel } = props.match.params;
  const classes = useStyles();
  const [channelTextValue, setChannelTextValue] = useState(channel || '');
  const [productTextValue, setProductTextValue] = useState(product || '');
  const [type, setType] = useState(channel ? 'channel' : 'permission');
  const [roles, setRoles] = useState([]);
  const [originalRoles, setOriginalRoles] = useState([]);
  const [additionalRoles, setAdditionalRoles] = useState(
    isNewSignoff ? [getEmptyRole()] : []
  );
  const [requiredSignoffs, getRS] = useAction(getRequiredSignoffs);
  const [products, fetchProducts] = useAction(getProducts);
  const [channels, fetchChannels] = useAction(getChannels);
  const [saveAction, saveRS] = useAction(updateRequiredSignoffs);
  const isLoading =
    requiredSignoffs.loading || products.loading || channels.loading;
  const error = requiredSignoffs.error || products.error || saveAction.error;
  const handleTypeChange = ({ target: { value } }) => setType(value);
  const handleChannelChange = value => setChannelTextValue(value);
  const handleProductChange = value => setProductTextValue(value);
  const handleRoleValueChange = role => ({ floatValue: value }) => {
    const setRole = entry => {
      if (entry.name !== role.name) {
        return entry;
      }

      const result = entry;

      if (result.sc) {
        result.sc.signoffs_required = value;
      } else {
        result.signoffs_required = value;
      }

      return result;
    };

    return role.metadata.isAdditionalRole
      ? setAdditionalRoles(additionalRoles.map(setRole))
      : setRoles(roles.map(setRole));
  };

  const handleRoleNameChange = (role, index) => ({ target: { value } }) => {
    const setRole = additionalRoles.map((entry, i) => {
      if (i !== index) {
        return entry;
      }

      const result = entry;

      result.name = value;

      return result;
    });

    setAdditionalRoles(setRole);
  };

  const handleRoleAdd = () => {
    additionalRoleId += 1;
    const role = getEmptyRole(additionalRoleId);

    setAdditionalRoles(additionalRoles.concat([role]));
  };

  const handleRoleDelete = (role, index) => () => {
    const excludeRole = (entry, i) => !(i === index);

    return role.metadata.isAdditionalRole
      ? setAdditionalRoles(additionalRoles.filter(excludeRole))
      : setRoles(roles.filter(excludeRole));
  };

  const handleSignoffSave = async () => {
    const { error } = await saveRS({
      product: productTextValue,
      channel: channelTextValue,
      roles,
      originalRoles,
      additionalRoles,
      isNewSignoff,
    });

    if (!error) {
      props.history.push('/required-signoffs');
    }
  };

  // TODO: Add delete logic
  const handleSignoffDelete = () => {};

  useEffect(() => {
    if (isNewSignoff) {
      Promise.all([fetchProducts(), fetchChannels()]);
    } else {
      Promise.all([fetchProducts(), fetchChannels(), getRS()]).then(
        // eslint-disable-next-line no-unused-vars
        ([prods, chs, rs]) => {
          const roles = getRolesFromRequiredSignoffs(rs.data, product, channel);

          setRoles(roles);
          setOriginalRoles(JSON.parse(JSON.stringify(roles)));
        }
      );
    }
  }, [product, channel]);

  const renderRole = (role, index) => (
    <Grid
      key={role.metadata.id}
      className={classes.gridWithIcon}
      container
      spacing={2}>
      <Grid item xs>
        <TextField
          required
          disabled={role.metadata.isAdditionalRole ? false : !isNewSignoff}
          onChange={handleRoleNameChange(role, index)}
          fullWidth
          label="Role"
          value={role.name}
        />
      </Grid>
      <Grid item xs>
        <NumberFormat
          allowNegative={false}
          required
          label="Signoffs Required"
          fullWidth
          value={role.sc ? role.sc.signoffs_required : role.signoffs_required}
          customInput={TextField}
          onValueChange={handleRoleValueChange(role, index)}
          decimalScale={0}
        />
      </Grid>
      <Grid className={classes.iconButtonGrid} item xs={1}>
        <IconButton
          onClick={handleRoleDelete(role, index)}
          className={classes.iconButton}>
          <DeleteIcon />
        </IconButton>
      </Grid>
    </Grid>
  );
  const getSuggestions = suggestions => value => {
    const inputValue = value.trim().toLowerCase();
    const inputLength = inputValue.length;
    let count = 0;

    return inputLength === 0
      ? []
      : suggestions.filter(suggestion => {
          const keep =
            count < 5 &&
            suggestion.slice(0, inputLength).toLowerCase() === inputValue;

          if (keep) {
            count += 1;
          }

          return keep;
        });
  };

  return (
    <Dashboard title="Required Signoff">
      {error && <ErrorPanel fixed error={error} />}
      {isLoading && <Spinner loading />}
      {!isLoading && (
        <Fragment>
          <form autoComplete="off">
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <AutoCompleteText
                  inputValue={productTextValue}
                  onInputValueChange={handleProductChange}
                  getSuggestions={
                    products.data && getSuggestions(products.data.data.product)
                  }
                  label="Product"
                  required
                  inputProps={{
                    autoFocus: true,
                    fullWidth: true,
                    disabled: !isNewSignoff,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl margin="normal" component="fieldset">
                  <FormLabel component="legend">Type</FormLabel>
                  <RadioGroup
                    aria-label="Type"
                    name="type"
                    value={type}
                    onChange={handleTypeChange}>
                    <FormControlLabel
                      disabled={!isNewSignoff}
                      value="channel"
                      control={<Radio />}
                      label="Channel"
                    />
                    <FormControlLabel
                      disabled={!isNewSignoff}
                      value="permission"
                      control={<Radio />}
                      label="Permission"
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>
              {type === 'channel' && (
                <Grid item xs={12}>
                  <AutoCompleteText
                    inputValue={channelTextValue}
                    onInputValueChange={handleChannelChange}
                    getSuggestions={
                      channels.data &&
                      getSuggestions(channels.data.data.channel)
                    }
                    label="Channel"
                    required
                    inputProps={{
                      fullWidth: true,
                      disabled: !isNewSignoff,
                    }}
                  />
                </Grid>
              )}
            </Grid>
            <br />
            <br />
            <br />
            <Typography variant="h5">Roles</Typography>
            {roles.map(renderRole)}
            {additionalRoles.map(renderRole)}
            <Grid className={classes.addRoleGrid} container>
              <Grid item xs={11}>
                <Button
                  onClick={handleRoleAdd}
                  className={classes.addRoleButton}
                  variant="outlined">
                  <PlusIcon />
                </Button>
              </Grid>
            </Grid>
          </form>
          <Tooltip title="Save Signoff">
            <Fab
              disabled={saveAction.loading}
              onClick={handleSignoffSave}
              color="primary"
              className={classes.fab}>
              <ContentSaveIcon />
            </Fab>
          </Tooltip>
          {!isNewSignoff && (
            <SpeedDial ariaLabel="Secondary Actions">
              <SpeedDialAction
                disabled={saveAction.loading}
                icon={<DeleteIcon />}
                tooltipOpen
                tooltipTitle="Delete Signoff"
                onClick={handleSignoffDelete}
              />
            </SpeedDial>
          )}
        </Fragment>
      )}
    </Dashboard>
  );
}

ViewSignoff.propTypes = {
  // Set to true if user is not updating an existing signoff.
  isNewSignoff: bool,
};

ViewSignoff.defaultProps = {
  isNewSignoff: false,
};

export default ViewSignoff;
