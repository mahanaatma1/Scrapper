import React from 'react';

const LoadingOverlay = ({ message = 'Processing...' }) => {
  // Extract the progress percentage if present in the message
  let progressPercentage = null;
  let progressMatch = message.match(/Progress: (\d+)%/);
  if (progressMatch && progressMatch[1]) {
    progressPercentage = parseInt(progressMatch[1]);
  }

  // Parse the phase from the message
  let phase = "";
  if (message.includes('Phase 1:')) {
    phase = 'Finding Listings';
  } else if (message.includes('Phase 2: Cleaning')) {
    phase = 'Processing Listings';
  } else if (message.includes('Phase 2: Scraping details')) {
    phase = 'Extracting Details';
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 flex flex-col items-center shadow-xl max-w-md w-full">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-6"></div>
        
        {/* Status message */}
        <p className="text-gray-800 font-medium text-lg mb-4 text-center">{message}</p>
        
        {/* Progress bar if we have percentage */}
        {progressPercentage !== null && (
          <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
            <div 
              className="bg-blue-600 h-4 rounded-full transition-all duration-500 ease-in-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        )}
        
        {/* Phase indicator */}
        {phase && (
          <div className="text-sm text-gray-500 mt-2">
            {phase}
          </div>
        )}
        
        {/* Note for user */}
        <p className="text-gray-500 text-sm mt-4 text-center">
          {message.includes('timeout') || message.includes('taking longer') ? 
            "The server is still processing your request. This may take several minutes." :
            "Please wait while we process your request."}
        </p>
      </div>
    </div>
  );
};

export default LoadingOverlay; 