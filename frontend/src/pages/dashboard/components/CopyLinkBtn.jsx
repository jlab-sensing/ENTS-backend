import { Box, Button, Tooltip } from '@mui/material';
import { PropTypes } from 'prop-types';
import { React } from 'react';
import share from '../../../assets/share.svg';

export default function CopyLinkBtn({ startDate, endDate, selectedCells, manualDateSelection }) {
  const copyLink = () => {
    let text = `${window.location.origin}/dashboard?cell_id=${selectedCells.map((cell) => cell.id).join(',')}`;

    // Only add date parameters if user manually selected them
    if (manualDateSelection) {
      text += `&startDate=${startDate.toISO()}&endDate=${endDate.toISO()}`;
    }

    navigator.clipboard.writeText(text);
  };

  return (
    <Tooltip
      title='Copy Link'
      placement='bottom'
      disableInteractive
      slotProps={{
        popper: {
          modifiers: [
            {
              name: 'offset',
              options: {
                offset: [0, -11],
              },
            },
          ],
        },
      }}
    >
      <Button variant='outlined' onClick={copyLink}>
        <Box component='img' src={share} />
      </Button>
    </Tooltip>
  );
}

CopyLinkBtn.propTypes = {
  startDate: PropTypes.object.isRequired,
  endDate: PropTypes.object.isRequired,
  selectedCells: PropTypes.array.isRequired,
  manualDateSelection: PropTypes.bool.isRequired,
};
