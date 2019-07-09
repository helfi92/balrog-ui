import React from 'react';
import { arrayOf, string, bool, object, func } from 'prop-types';
import classNames from 'classnames';
import Downshift from 'downshift';
import { equals } from 'ramda';
import { makeStyles } from '@material-ui/styles';
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import Paper from '@material-ui/core/Paper';
import ChipList from './ChipList';

const useStyles = makeStyles(theme => ({
  paper: {
    position: 'absolute',
    zIndex: 1,
    marginTop: theme.spacing(1),
    left: 0,
    right: 0,
  },
  paperWrapper: {
    position: 'relative',
  },
  selectedText: {
    fontWeight: theme.typography.fontWeightMedium,
  },
}));

/**
 * A wrapper component around downshift-js to render a material-ui TextField
 * with auto complete capabilities.
 */
function AutoCompleteText({
  onValueChange,
  value,
  label,
  required,
  getSuggestions,
  inputProps,
  selectedItems,
  onSelectedItemsChange,
  multi,
  ...props
}) {
  const classes = useStyles();
  const handleChipDelete = item => {
    const chips = selectedItems.filter(selectedItem => selectedItem !== item);

    if (onSelectedItemsChange) {
      onSelectedItemsChange(chips);
    }
  };

  const handleChipAdd = item => {
    const chips = new Set([...selectedItems, item]);
    const updatedChips = Array.from(chips);

    // Avoid duplicate chips
    if (!equals(updatedChips, selectedItems)) {
      if (onSelectedItemsChange) {
        onSelectedItemsChange(updatedChips);
      }
    }

    // Clear input value to give space for more selections
    onValueChange('');
  };

  const handleStateChange = changes => {
    if ('selectedItem' in changes) {
      onValueChange(changes.selectedItem);

      if (multi) {
        handleChipAdd(changes.selectedItem);
      }
    } else if ('inputValue' in changes) {
      onValueChange(changes.inputValue);
    }
  };

  function renderSuggestion({
    suggestion,
    index,
    itemProps,
    highlightedIndex,
    selectedItem,
  }) {
    const isHighlighted = highlightedIndex === index;
    const isSelected = (selectedItem || '').indexOf(suggestion) > -1;

    return (
      <MenuItem
        {...itemProps}
        key={suggestion}
        selected={isHighlighted}
        component="div"
        className={classNames({ [classes.selectedText]: isSelected })}>
        {suggestion}
      </MenuItem>
    );
  }

  return (
    <Downshift
      {...props}
      selectedItem={value || ''}
      onStateChange={handleStateChange}>
      {({
        getInputProps,
        getItemProps,
        getMenuProps,
        highlightedIndex,
        inputValue,
        isOpen,
        selectedItem,
      }) => (
        <div className={classNames({ [classes.multiWrapper]: multi })}>
          <TextField
            label={label}
            required={required}
            fullWidth
            InputProps={{
              ...getInputProps({
                onKeyDown(event) {
                  if (event.key === 'Backspace' && !inputValue) {
                    handleChipDelete(selectedItems[selectedItems.length - 1]);
                  }

                  if (event.key === 'Enter') {
                    event.preventDefault();

                    if (multi && selectedItem && highlightedIndex === null) {
                      handleChipAdd(selectedItem);
                    }
                  }
                },
              }),
              startAdornment: multi ? (
                <ChipList
                  selectedItems={selectedItems}
                  onItemDelete={handleChipDelete}
                />
              ) : (
                undefined
              ),
            }}
          />
          {getSuggestions && (
            <div className={classes.paperWrapper} {...getMenuProps()}>
              {Boolean(isOpen) && (
                <Paper className={classes.paper} square>
                  {getSuggestions(inputValue).map((suggestion, index) =>
                    renderSuggestion({
                      suggestion,
                      index,
                      itemProps: getItemProps({ item: suggestion }),
                      highlightedIndex,
                      selectedItem,
                    })
                  )}
                </Paper>
              )}
            </div>
          )}
        </div>
      )}
    </Downshift>
  );
}

AutoCompleteText.propTypes = {
  // Callback triggered when the value of the text field is changed.
  onValueChange: func.isRequired,
  value: string.isRequired,
  getSuggestions: func,
  inputProps: object,
  label: string,
  required: bool,
  // Selected items for when `multi` is set to `true`.
  selectedItems: arrayOf(string),
  // Callback triggered when the list of chips change.
  onSelectedItemsChange: func,
  // If true, the text field will allow multi text selection
  multi: bool,
};

AutoCompleteText.defaultProps = {
  getSuggestions: null,
  selectedItems: [],
  onSelectedItemsChange: null,
  inputProps: {},
  label: '',
  required: false,
  multi: false,
};

export default AutoCompleteText;
