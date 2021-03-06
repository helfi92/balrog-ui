import { createMuiTheme } from '@material-ui/core/styles';

const SPACING = {
  UNIT: 8,
  DOUBLE: 16,
  TRIPLE: 24,
  QUAD: 32,
};

export default createMuiTheme({
  typography: {
    useNextVariants: true,
  },
  mixins: {
    fab: {
      position: 'fixed',
      bottom: SPACING.DOUBLE,
      right: SPACING.TRIPLE,
    },
  },
});
