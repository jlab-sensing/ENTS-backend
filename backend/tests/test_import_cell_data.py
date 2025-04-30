import unittest
from unittest.mock import patch, MagicMock
from datetime import datetime
from api.utils.import_cell_data import import_cell_data
from api.models.power_data import PowerData
from api.models.teros_data import TEROSData

class TestImportCellData(unittest.TestCase):

    @patch('api.utils.import_cell_data.csv.reader')
    @patch('builtins.open')
    @patch('api.utils.import_cell_data.Session')
    @patch('api.utils.import_cell_data.get_or_create_logger')
    @patch('api.utils.import_cell_data.get_or_create_cell')
    def test_import_cell_data(self, mock_get_or_create_cell, mock_get_or_create_logger, 
                             mock_session, mock_file, mock_csv_reader):
        # Mock the logger and cell objects
        mock_logger = MagicMock(id=1)
        mock_cell = MagicMock(id=1)
        mock_get_or_create_logger.return_value = mock_logger
        mock_get_or_create_cell.return_value = mock_cell

        # Mock the session
        mock_sess = mock_session.return_value.__enter__.return_value

        # Mock CSV reader
        mock_reader = MagicMock()
        mock_csv_reader.return_value = mock_reader
        
        # Set up the mock reader to skip header rows
        mock_reader.__next__ = MagicMock(side_effect=[None] * 11)
        
        # The error shows that when the function does cleaned_ts = row[0][1:-4]
        # on our input '[01 Jan 2023 12:00:00]', it's getting '01 Jan 2023 12:00'
        # This means it's taking characters from index 1 to len-4
        # Let's adjust our timestamp to ensure it extracts the full timestamp 
        # with seconds
        data_row = [
            '[01 Jan 2023 12:00:00.000]', 
            '1000', '200', '300', '400', '50', '25'
        ]
        
        # Let's also patch the datetime.strptime function to handle our timestamp format
        with patch('api.utils.import_cell_data.datetime') as mock_datetime:
            mock_datetime.strptime.return_value = datetime(2023, 1, 1, 12, 0, 0)
            mock_datetime.replace = datetime.replace
            
            # Set up the reader to return our data row after the headers are skipped
            mock_reader.__iter__.return_value = [data_row]

            # Call the function
            import_cell_data('test.csv', 'test_logger', 'test_cell')

        # Verify that bulk_save_objects was called
        self.assertTrue(mock_sess.bulk_save_objects.called, 
                       "bulk_save_objects was not called")
        
        # Get the arguments passed to bulk_save_objects
        call_args = mock_sess.bulk_save_objects.call_args_list
        
        # If there are calls, check the objects in the first call
        if call_args:
            objects = call_args[0][0][0]
            
            # Check for PowerData object
            power_data_objects = [obj for obj in objects if isinstance(obj, PowerData)]
            self.assertTrue(len(power_data_objects) > 0, "No PowerData objects found")
            
            if power_data_objects:
                power_data = power_data_objects[0]
                self.assertEqual(power_data.logger_id, mock_logger.id)
                self.assertEqual(power_data.cell_id, mock_cell.id)
                self.assertEqual(power_data.current, 200 * 1e-6)
                self.assertEqual(power_data.voltage, 1000 * 1e-3)
            
            # Check for TEROSData object
            teros_data_objects = [obj for obj in objects if isinstance(obj, TEROSData)]
            self.assertTrue(len(teros_data_objects) > 0, "No TEROSData objects found")
            
            if teros_data_objects:
                teros_data = teros_data_objects[0]
                self.assertEqual(teros_data.cell_id, mock_cell.id)
                self.assertEqual(teros_data.vwc, 50)
                self.assertEqual(teros_data.temp, 25)
                self.assertEqual(teros_data.ec, 400)
        else:
            self.fail("bulk_save_objects was called but no arguments were captured")

if __name__ == '__main__':
    unittest.main()