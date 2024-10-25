import { useContext } from 'react';
import { AnnotatorContext}  from '../context/AnnotatorContext';

// Custom hook to use the AnnotatorContext
export const useAnnotator = () => {
  const context = useContext(AnnotatorContext);

  if (!context) {
    throw new Error('useAnnotator must be used within an AnnotatorProvider');
  }

  return context;
};
