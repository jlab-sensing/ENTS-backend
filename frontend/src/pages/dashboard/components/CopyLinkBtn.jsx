import { React } from 'react';
import { Button, Box, Tooltip} from '@mui/material';
import copy from '../../../assets/copy.svg';
import { PropTypes } from 'prop-types';

export default function CopyLinkBtn({ startDate, endDate, selectedCells }) {
    const copyLink = () => {
        const text = `dirtviz.jlab.ucsc.edu/dashboard?cell_id=${
            selectedCells.map((cell) => cell.id).join(",")}
            &startDate=${startDate.toISO()}&endDate=${endDate.toISO()}`;
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
        <Button variant="outlined" onClick={copyLink}>
            <Box component="img" src={copy} />
        </Button>
        </Tooltip>
    );
}

CopyLinkBtn.propTypes = {
    startDate: PropTypes.object.isRequired,
    endDate: PropTypes.object.isRequired,
    selectedCells: PropTypes.array.isRequired,
};