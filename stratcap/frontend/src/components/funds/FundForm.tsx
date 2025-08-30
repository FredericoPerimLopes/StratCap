import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Alert,
} from '@mui/material';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import { Card } from '../shared';

export const FundForm = () => {
  const navigate = useNavigate();

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/funds')}
          sx={{ mr: 2 }}
        >
          Back to Funds
        </Button>
        <Typography variant="h4">
          Fund Form
        </Typography>
      </Box>

      <Card>
        <Box p={3}>
          <Alert severity="info">
            Fund form will be implemented in the next phase.
          </Alert>
        </Box>
      </Card>
    </Box>
  );
};

export default FundForm;