import React from 'react';
import { makeStyles } from '@material-ui/styles';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import CardHeader from '@material-ui/core/CardHeader';
import Chip from '@material-ui/core/Chip';
import Grid from '@material-ui/core/Grid';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import HistoryIcon from 'mdi-react/HistoryIcon';
import LinkIcon from 'mdi-react/LinkIcon';
import Link from '../../utils/Link';
import { release } from '../../utils/prop-types';

const useStyles = makeStyles(theme => ({
  cardHeader: {
    paddingBottom: 0,
  },
  cardHeaderContent: {
    ...theme.mixins.textEllipsis,
  },
  ruleName: {
    ...theme.mixins.textEllipsis,
  },
  listItem: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  cardContentRoot: {
    padding: theme.spacing(0, 1),
  },
  cardContentChip: {
    paddingLeft: theme.spacing(4),
    paddingRight: theme.spacing(4),
  },
  chip: {
    cursor: 'pointer',
    marginRight: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  badge: {
    padding: theme.spacing(0, 2, 0, 0),
  },
  cardActions: {
    justifyContent: 'flex-end',
  },
}));

function ReleaseCard(props) {
  const { release, ...rest } = props;
  const classes = useStyles();
  const hasRulesPointingAtRevision = release.rule_ids.length > 0;
  // eslint-disable-next-line no-unused-vars
  const onReleaseDelete = release => {};

  return (
    <Card {...rest}>
      <CardHeader
        className={classes.cardHeader}
        classes={{ content: classes.cardHeaderContent }}
        title={release.name}
        titleTypographyProps={{
          className: classes.ruleName,
          title: release.name,
        }}
        subheader={release.product}
        action={
          <Tooltip title="History">
            <IconButton>
              <HistoryIcon />
            </IconButton>
          </Tooltip>
        }
      />
      <CardContent classes={{ root: classes.cardContentRoot }}>
        <List>
          <Grid container>
            <Grid item xs={6}>
              <ListItem className={classes.listItem}>
                <ListItemText
                  primary="Data Version"
                  secondary={release.data_version}
                />
              </ListItem>
            </Grid>
            <Grid item xs={6}>
              <ListItem className={classes.listItem}>
                <ListItemText
                  primary="Read Only"
                  secondary={String(release.read_only)}
                />
              </ListItem>
            </Grid>
            <Grid item>
              <ListItem className={classes.listItem}>
                <ListItemText
                  primary="Used By"
                  secondaryTypographyProps={{ component: 'div' }}
                  secondary={
                    hasRulesPointingAtRevision ? (
                      release.rule_ids.map(ruleId => (
                        <Link key={ruleId} to={`/rules/${ruleId}`}>
                          <Chip
                            clickable
                            size="small"
                            icon={<LinkIcon />}
                            label={ruleId}
                            className={classes.chip}
                          />
                        </Link>
                      ))
                    ) : (
                      <em>n/a</em>
                    )
                  }
                />
              </ListItem>
            </Grid>
          </Grid>
        </List>
      </CardContent>
      <CardActions className={classes.cardActions}>
        <Link to={`/releases/${release.name}`}>
          <Button color="secondary">Update</Button>
        </Link>
        <Button color="secondary" onClick={() => onReleaseDelete(release)}>
          Delete
        </Button>
      </CardActions>
    </Card>
  );
}

ReleaseCard.propTypes = {
  release,
};

export default ReleaseCard;
