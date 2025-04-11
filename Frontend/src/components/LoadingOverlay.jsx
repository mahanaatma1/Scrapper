import React from 'react';

const LoadingOverlay = ({ message = 'Processing...' }) => {
  // Extract the progress percentage if present in the message
  let progressPercentage = null;
  let messageText = '';
  
  // Check if message is a React element or a string
  const isReactElement = React.isValidElement(message);
  
  if (!isReactElement) {
    messageText = message;
    const progressMatch = message.match(/Progress: (\d+)%/);
    if (progressMatch && progressMatch[1]) {
      progressPercentage = parseInt(progressMatch[1]);
    }
  }

  // Parse the phase from the message
  let phase = "";
  if (isReactElement || !messageText) {
    // Don't try to parse phase from React elements
  } else if (messageText.includes('Phase 1:')) {
    phase = 'Finding Listings';
  } else if (messageText.includes('Phase 2: Cleaning')) {
    phase = 'Processing Listings';
  } else if (messageText.includes('Phase 2: Scraping details')) {
    phase = 'Extracting Details';
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-8 flex flex-col items-center shadow-xl max-w-md w-full border border-gray-700">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-teal-500 mb-6"></div>
        
        {/* Status message */}
        <div className="text-white font-medium text-lg mb-4 text-center">
          {isReactElement ? message : messageText}
        </div>
        
        {/* Progress bar if we have percentage */}
        {progressPercentage !== null && (
          <div className="w-full bg-gray-700 rounded-full h-4 mb-4">
            <div 
              className="bg-teal-500 h-4 rounded-full transition-all duration-500 ease-in-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        )}
        
        {/* Phase indicator */}
        {phase && (
          <div className="text-sm text-teal-400 mt-2 font-medium">
            {phase}
          </div>
        )}
        
        {/* Note for user */}
        <p className="text-gray-400 text-sm mt-4 text-center">
          {(isReactElement || messageText.includes('timeout') || messageText.includes('taking longer')) ? 
            "The server is still processing your request. This may take several minutes." :
            "Please wait while we process your request."}
        </p>
      </div>
    </div>
  );
};

export default LoadingOverlay; 