import { CircularProgress } from '@mui/material';

export default function LoadingSpinner({ fullPage = false }) {
  return (
    <div className={`spinner-container ${fullPage ? 'full-page' : ''}`}>
      <CircularProgress size={60} />
    </div>
  );
}