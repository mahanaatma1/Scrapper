import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'react-hot-toast'
import { FiInfo } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import LoadingOverlay from '../components/LoadingOverlay'
import { base64ToCSV } from '../utils/base64ToCSV'
import { scraperService } from '../api/scrapperApi'

// Add retry logic
const retryRequest = async (fn, retries = 3, delay = 2000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryRequest(fn, retries - 1, delay);
  }
};

function Create() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    city: '',
    jobs: ''
  })
  const [usaData, setUsaData] = useState([])
  const [canadaData, setCanadaData] = useState([])
  const [showStates, setShowStates] = useState(false)
  const [selectedState, setSelectedState] = useState(null)
  const [showCities, setShowCities] = useState(false)
  const [selectedCities, setSelectedCities] = useState([])
  const [showKeywordsTooltip, setShowKeywordsTooltip] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState('USA')
  const dropdownRef = useRef(null)
  const keywordsRef = useRef(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [scrapingStatus, setScrapingStatus] = useState(null)
  const scrapingTimeoutRef = useRef(null)
  const downloadIntervalRef = useRef(null)
  const [scrapingStartTime, setScrapingStartTime] = useState(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const timerIntervalRef = useRef(null)
  const [currentCity, setCurrentCity] = useState(null)

  // Default keywords array
  const defaultKeywords = [
    "website development", "wordpress", "mobile app", "php", "laravel",
    "mern", "mean", "next.js", "react", "node.js", "full stack",
    "devops", "blockchain", "ethereum", "solidity", "nft", "3d artist",
    "digital marketing", "seo", "social media", "shopify", "wix", "e-commerce",
    "python", "django", "javascript", "typescript", "vue.js", "angular",
    "aws", "cloud", "database", "sql", "nosql", "mongodb", "postgresql",
    "ui/ux", "web design", "graphic design", "data science", "machine learning",
    "ai", "automation", "qa testing", "software testing", "system admin",
    "network", "cyber security", "flutter", "swift", "ios development",
    "android development", "game development"
  ]
  
  // Initialize selectedKeywords with default keywords
  const [selectedKeywords, setSelectedKeywords] = useState([...defaultKeywords])

  // Keyword categories for organization
  const keywordCategories = {
    "Web Development": ["website development", "wordpress", "php", "laravel", "mern", "mean", "next.js", "react", "node.js", "full stack", "javascript", "typescript", "vue.js", "angular"],
    "Mobile Development": ["mobile app", "flutter", "swift", "ios development", "android development"],
    "Design": ["ui/ux", "web design", "graphic design"],
    "Data & AI": ["data science", "machine learning", "ai", "database", "sql", "nosql", "mongodb", "postgresql"],
    "Blockchain": ["blockchain", "ethereum", "solidity", "nft"],
    "DevOps & Cloud": ["devops", "aws", "cloud"],
    "Digital Marketing": ["digital marketing", "seo", "social media", "e-commerce", "shopify", "wix"],
    "Other": ["3d artist", "automation", "qa testing", "software testing", "system admin", "network", "cyber security", "python", "django", "game development"]
  }
  
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchKeyword, setSearchKeyword] = useState('')

  const filteredKeywords = selectedCategory === 'All' 
    ? defaultKeywords 
    : keywordCategories[selectedCategory] || []

  const displayKeywords = searchKeyword
    ? filteredKeywords.filter(keyword => keyword.toLowerCase().includes(searchKeyword.toLowerCase()))
    : filteredKeywords

  useEffect(() => {
    // Load USA and Canada cities data
    fetch('/cities/usa_cities_by_state.json')
      .then(response => response.json())
      .then(data => {
        setUsaData(data.USA)
        setCanadaData(data.Canada)
      })
      .catch(error => {
        console.error('Error loading cities data:', error)
      })
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowStates(false)
        setShowCities(false)
      }

      if (keywordsRef.current && !keywordsRef.current.contains(event.target)) {
        setShowKeywordsTooltip(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Set initial jobs field value with default keywords on component mount
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      jobs: defaultKeywords.join(', ')
    }));
  }, []);

  useEffect(() => {
    // Update city input field when cities are selected
    setFormData(prev => ({
      ...prev,
      city: selectedCities.join(', ')
    }))
  }, [selectedCities])

  useEffect(() => {
    // Update jobs input field when keywords are selected
    setFormData(prev => ({
      ...prev,
      jobs: selectedKeywords.join(', ')
    }))
  }, [selectedKeywords])

  const handleChange = (e) => {
    const { name, value } = e.target
    
    if (name === 'city') {
      // Handle city field specifically to manage whole cities
      const previousLength = formData.city.length;
      const newLength = value.length;
      const wasDeleting = newLength < previousLength;
      
      if (wasDeleting) {
        const cities = value.split(',').map(c => c.trim()).filter(c => c);
        if (cities.length < selectedCities.length) {
          setSelectedCities(cities);
          setFormData(prev => ({
            ...prev,
            [name]: cities.join(', ')
          }));
          return;
        } else if (value.endsWith(', ') || value.endsWith(',')) {
          setFormData(prev => ({
            ...prev,
            [name]: value
          }));
          return;
        } else {
          const lastCommaIndex = value.lastIndexOf(',');
          if (lastCommaIndex >= 0) {
            const citiesExceptLast = value.substring(0, lastCommaIndex).split(',')
              .map(c => c.trim()).filter(c => c);
            
            setSelectedCities(citiesExceptLast);
            setFormData(prev => ({
              ...prev,
              [name]: value
            }));
          } else {
            setSelectedCities([]);
            setFormData(prev => ({
              ...prev,
              [name]: value
            }));
          }
          return;
        }
      } else {
        if (value.endsWith(', ') || value.endsWith(',')) {
          const cities = value.split(',').map(c => c.trim()).filter(c => c);
          setSelectedCities(cities);
        }
        
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
        return;
      }
    } else if (name === 'jobs') {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));

      const inputKeywords = value.split(',').map(k => k.trim()).filter(k => k);
      const uniqueKeywords = inputKeywords.filter(keyword => 
        !defaultKeywords.includes(keyword)
      );
      
      setSelectedKeywords([...defaultKeywords, ...uniqueKeywords]);
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const updateConfig = async () => {
    try {
      setLoadingMessage('Updating configuration...');
      const configData = {
        cities: selectedCities,
        keywords: selectedKeywords,
        use_headless: false,
        batch_size: Math.min(5, Math.max(1, Math.ceil(selectedCities.length / 5))), // Dynamic batch size: 1-5 cities per batch
        max_retries: 3,
        timeout_per_city: 0, // 0 means no timeout - let each city take as long as needed
        save_partial_results: true, // Save results even if process is interrupted
        infinite_mode: true // New flag to indicate there should be no timeout
      };

      await scraperService.updateConfig(configData);
      return true;
    } catch (error) {
      console.error('Error updating config:', error);
      if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
        toast.error('Cannot connect to server. Please check if the server is running.');
      } else {
        toast.error('Failed to update configuration: ' + (error.response?.data?.message || error.message));
      }
      return false;
    }
  };

  const startScraping = async () => {
    try {
      const numberOfCities = selectedCities.length;
      // Maximum possible timeout - essentially infinite (24 hours)
      const estimatedTimeoutMs = 86400000; // 24 hours in milliseconds
      
      setLoadingMessage(`Starting scraping process for ${numberOfCities} cities (may take a long time)...`);
      
      try {
        // Log that we're making the request
        console.log(`Making start-scraping request with unlimited timeout`);
        
        // First check if there's an existing scraping job
        const status = await checkScrapingStatus();
        if (status && status.is_running) {
          console.log('A scraping job is already running:', status);
          setLoadingMessage(`Resuming existing scraping job (${status.progress || 0}% complete)...`);
          return { success: true, data: status, resumed: true };
        }
        
        // Make a single attempt to start scraping
        const response = await scraperService.startScraping({
          numberOfCities: numberOfCities,
          timeout: estimatedTimeoutMs,
          resume: true, // Add flag to tell backend to resume from where it left off if possible
          infinite_mode: true // Tell backend not to time out
        });
        
        // If we reach here, the scraping process was successfully started
        console.log('Scraping started successfully. Server response:', response);
        
        // Update the loading message to indicate success
        setLoadingMessage(`Scraping started successfully! Monitoring progress...`);
        
        return { success: true, data: response };
      } catch (error) {
        console.error('Error starting scraping:', error);
        
        // Handle timeout errors - continue with status checking
        if (error.code === 'ECONNABORTED') {
          console.error('Timeout error when starting scraping - this is normal for multiple cities');
          console.error('The server is likely still processing the request, continuing with status monitoring');
          
          // Update message to indicate timeout but continued processing
          setLoadingMessage(`Timeout reached while starting scraper. Continuing with monitoring...`);
          
          return { success: true, timedOut: true }; // Continue with status monitoring even with timeout
        }
        
        // For other errors that aren't network-related, we should still check status
        if (error.code === 'ERR_NETWORK') {
          toast.error('Cannot connect to server. Please check if the server is running.');
          return { success: false, error };
        }
        
        // For any other error, assume scraping might have started and continue with status checks
        console.warn('Error in start scraping call, but continuing with status checks:', error.message);
        setLoadingMessage(`Error starting scraper, but checking if processing started anyway...`);
        return { success: true, timedOut: true, error };
      }
    } catch (error) {
      console.error('Unhandled error in startScraping:', error);
      toast.error('An unexpected error occurred when starting the scraping process');
      return { success: false, error };
    }
  };

  const checkScrapingStatus = async () => {
    try {
      const status = await retryRequest(async () => {
        return await scraperService.checkScrapingStatus();
      }, 3, 2000);
      
      setScrapingStatus(status);
      return status;
    } catch (error) {
      console.error('Error checking scraping status:', error);
      // Don't show a toast on every status check error, just log it
      if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
        console.warn('Network error when checking status - will retry next cycle');
      }
      return null;
    }
  };

  const downloadResults = async () => {
    try {
      setLoadingMessage('Preparing results file...');
      
      // Step 1: Check if results file already exists in public directory
      const fileCheck = await scraperService.checkResultsFileExists();
      
      if (fileCheck.exists) {
        console.log('Results file already exists in frontend directory:', fileCheck.fileInfo);
        toast.success('Results file is ready to use!');
        return true;
      }
      
      // Step 2: If file doesn't exist, save it to frontend using the enhanced API
      console.log('Results file not found, requesting server to save it...');
      
      try {
        const resultsData = await scraperService.getResults();
        console.log('Server response for file save:', resultsData);
        
        if (resultsData.success) {
          // File was successfully saved to frontend directory
          toast.success('Results file has been saved successfully!');
          return true;
        } else if (resultsData.content) {
          // Fallback for older server versions - handle base64 content
          console.log('Server returned base64 content instead of saving file directly');
          const filename = resultsData.filename || 'results.csv';
          const success = base64ToCSV(resultsData.content, filename);
          
          if (success) {
            toast.success(`Results downloaded as ${filename}`);
            return true;
          } else {
            toast.error('Failed to process the downloaded file');
            return false;
          }
        } else {
          toast.error('Failed to save or download results file');
          return false;
        }
      } catch (error) {
        console.error('Error getting results:', error);
        
        // Final attempt: Check again if the file exists (it might have been saved despite the error)
        const finalCheck = await scraperService.checkResultsFileExists();
        if (finalCheck.exists) {
          console.log('Results file found after error:', finalCheck.fileInfo);
          toast.success('Results file is available despite errors!');
          return true;
        }
        
        toast.error('Failed to save or download results');
        return false;
      }
    } catch (error) {
      console.error('Error in download process:', error);
      toast.error('Failed to process results');
      return false;
    }
  };

  // Timer function to track elapsed time
  const startScrapingTimer = () => {
    setScrapingStartTime(Date.now())
    setElapsedTime(0)
    
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
    }
    
    timerIntervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - scrapingStartTime) / 1000)
      setElapsedTime(elapsed)
    }, 1000)
  }
  
  const stopScrapingTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
  }
  
  // Format elapsed time in HH:MM:SS format
  const formatElapsedTime = (seconds) => {
    if (!seconds) return '00:00:00'
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Pass current city info to loading overlay
  const getLoadingOverlayMessage = () => {
    if (currentCity) {
      return (
        <div>
          {loadingMessage}
          <div className="mt-2 text-teal-300 font-medium">
            Currently processing: <span className="text-white">{currentCity}</span>
          </div>
        </div>
      )
    }
    return loadingMessage
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset any existing state from previous scraping jobs
    if (downloadIntervalRef.current) {
      clearInterval(downloadIntervalRef.current);
      downloadIntervalRef.current = null;
    }
    if (scrapingTimeoutRef.current) {
      clearTimeout(scrapingTimeoutRef.current);
      scrapingTimeoutRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setScrapingStatus(null);
    setCurrentCity(null);
    
    setIsLoading(true);
    setLoadingMessage('Initializing process...');
    
    // Force cleanup before starting a new scraping job to ensure fresh state
    try {
      setLoadingMessage('Resetting previous scraping sessions...');
      await scraperService.resetScraper();
    } catch (error) {
      console.warn('Error during pre-scraping reset:', error);
      // Continue anyway as this is just a precaution
    }
    
    // Start the timer
    startScrapingTimer();
    
    // Recovery variables
    let retryCount = 0;
    const maxRetries = 3;
    let recoveryMode = false;
    
    // Status check settings
    const initialStatusCheckDelay = 10000; // 10 seconds initially

    try {
      // Calculate monitoring attempts - but don't use this as a hard timeout
      // We'll just use this to determine how often to check for status changes
      const numberOfCities = selectedCities.length;
      
      // We still calculate this for status update frequency, but we won't enforce it as a timeout
      const baseAttemptsPerCity = 40;
      const minAttemptsLimit = 120;
      const calculatedMaxAttempts = Math.max(numberOfCities * baseAttemptsPerCity, minAttemptsLimit);
      
      console.log(`Status will be checked approximately every ${initialStatusCheckDelay/1000} seconds`);
      console.log(`Will check more frequently after ${calculatedMaxAttempts} checks`);
      
      // STEP 0: Clean frontend output directory first
      try {
        setLoadingMessage('Cleaning frontend output files...');
        const frontendCleanup = await scraperService.cleanFrontendFiles();
        console.log('Frontend output cleanup completed:', frontendCleanup);
        if (!frontendCleanup.success) {
          console.warn('Frontend cleanup may not have completed successfully:', frontendCleanup);
          // Continue anyway, as this is not critical
        } else {
          console.log(`Deleted ${frontendCleanup.deleted_count} files from frontend output directory`);
        }
      } catch (error) {
        console.error('Error cleaning frontend output files:', error);
        // Continue with the process, this error is not critical
      }

      // Step 1: Backend cleanup
      try {
        setLoadingMessage('Cleaning up server files...');
        const cleanupSuccess = await scraperService.cleanup();
        if (!cleanupSuccess) {
          throw new Error('Failed to clean up server files');
        }
        console.log('Server cleanup completed successfully');
      } catch (error) {
        console.error('Server cleanup error:', error);
        toast.error('Failed to clean up server files. Process stopped.');
        setIsLoading(false);
        return;
      }

      // Step 2: Update config
      setLoadingMessage('Updating configuration...');
      const configUpdated = await updateConfig();
      if (!configUpdated) {
        setIsLoading(false);
        return;
      }

      // Step 3: Start scraping
      const startScrapingWithRetries = async () => {
        let scrapingResult = { success: false };
        
        try {
          setLoadingMessage(`${recoveryMode ? 'Restarting' : 'Starting'} scraping process for ${numberOfCities} cities (est. max: ${formatElapsedTime(elapsedTime)})...`);
          scrapingResult = await startScraping();
          
          if (!scrapingResult.success && !scrapingResult.timedOut) {
            // If we've tried before, see if we can recover
            if (retryCount < maxRetries) {
              retryCount++;
              recoveryMode = true;
              toast.warning(`Scraping failed. Attempting recovery (Try ${retryCount}/${maxRetries})...`);
              
              // Wait 10 seconds before retrying
              await new Promise(resolve => setTimeout(resolve, 10000));
              return await startScrapingWithRetries();
            } else {
              setIsLoading(false);
              stopScrapingTimer();
              toast.error('Failed to start scraping after multiple attempts');
              return { success: false };
            }
          }
          
          // If we had a timeout, update the message but continue
          if (scrapingResult.timedOut) {
            toast.warning(`Scraping request is taking longer than expected. We'll monitor progress...`);
            setLoadingMessage(`Waiting for scraping status...`);
          } else {
            // Successful start
            setLoadingMessage(`Scraping started successfully. Monitoring progress...`);
          }
          
          return scrapingResult;
        } catch (error) {
          // Even if start scraping completely fails, we'll still try to check status
          console.error('Complete failure in start scraping, but will try status check:', error);
          
          // If we've tried before, see if we can recover
          if (retryCount < maxRetries) {
            retryCount++;
            recoveryMode = true;
            toast.warning(`Scraping failed. Attempting recovery (Try ${retryCount}/${maxRetries})...`);
            
            // Wait 10 seconds before retrying
            await new Promise(resolve => setTimeout(resolve, 10000));
            return await startScrapingWithRetries();
          }
          
          return { timedOut: true, error };
        }
      };
      
      const scrapingResult = await startScrapingWithRetries();
      
      if (!scrapingResult.success && !scrapingResult.timedOut && !recoveryMode) {
        setIsLoading(false);
        stopScrapingTimer();
        return;
      }

      // Custom function to update loading message with elapsed time
      const updateLoadingMessageWithTime = (msg) => {
        setLoadingMessage(`${msg} (Running: ${formatElapsedTime(elapsedTime)})`);
      }
      
      // Step 4: Monitor scraping status - no fixed timeout
      let attempts = 0;
      let hasDownloaded = false;
      let lastStatus = null;
      let consecutiveErrorCount = 0;
      let statusCheckDelay = initialStatusCheckDelay; // Start with 10 seconds
      const maxStatusCheckDelay = 30000; // Maximum 30 seconds between checks
      
      // After this many checks, we'll reduce the check frequency to avoid overloading the server
      const frequencyReductionThreshold = calculatedMaxAttempts;
      let hasReducedFrequency = false;
      
      // Function to perform status check
      const performStatusCheck = async () => {
        attempts++;
        
        try {
          const status = await checkScrapingStatus();
          
          if (status) {
            // Reset error counter and back-off delay on successful status check
            if (consecutiveErrorCount > 0) {
              consecutiveErrorCount = 0;
              // Only reset delay if we haven't passed the frequency reduction threshold
              if (!hasReducedFrequency) {
                statusCheckDelay = 10000;
              }
            }
            
            // After many attempts, reduce the frequency of status checks to avoid server load
            if (attempts >= frequencyReductionThreshold && !hasReducedFrequency) {
              console.log(`Reducing status check frequency after ${attempts} checks`);
              clearInterval(downloadIntervalRef.current);
              statusCheckDelay = 30000; // Check every 30 seconds after the threshold
              downloadIntervalRef.current = setInterval(performStatusCheck, statusCheckDelay);
              hasReducedFrequency = true;
              
              // Notify the user that we're still working but checking less frequently
              toast.info("Scraping is taking longer than usual. Status will now update less frequently.");
            }
            
            // Log status every 10 attempts to avoid console spam
            if (attempts % 10 === 0) {
              console.log(`Current scraping status (check #${attempts}):`, status);
            }
            
            // Only update if status has changed
            if (JSON.stringify(status) !== JSON.stringify(lastStatus)) {
              lastStatus = status;
              
              // Handle different status cases
              if (status.is_running) {
                // Format the message based on the current phase
                const progressPercent = status.progress || 0;
                const phaseMessage = status.current_phase || 'Scraping in progress';
                const progressMessage = `Progress: ${progressPercent}%`;
                
                // Update current city if available
                if (status.current_city) {
                  setCurrentCity(status.current_city);
                }
                
                updateLoadingMessageWithTime(`${phaseMessage} (${progressMessage})`);
                
                // If progress is 0% for a long time, provide reassurance
                if (progressPercent === 0 && attempts > 30) {
                  toast.info("Scraping is taking longer than usual to start. This is normal for many cities.");
                }
              } else if (status.completed) {
                clearInterval(downloadIntervalRef.current);
                stopScrapingTimer();
                setCurrentCity(null);
                setLoadingMessage('Scraping completed! Getting results...');
                
                const downloaded = await downloadResults();
                if (downloaded) {
                  hasDownloaded = true;
                  setIsLoading(false);
                  toast.success('Data found and ready to use!');
                  navigate('/generate');
                }
              } else if (status.no_results || (status.current_phase === null && status.last_completed === null)) {
                clearInterval(downloadIntervalRef.current);
                stopScrapingTimer();
                setIsLoading(false);
                toast.warning('No results found for the specified criteria');
              } else if (status.error) {
                clearInterval(downloadIntervalRef.current);
                stopScrapingTimer();
                setIsLoading(false);
                toast.error(`Scraping error: ${status.last_completed || 'Unknown error'}`);
              }
            } else {
              // Status hasn't changed, but update the message periodically
              if (attempts % 5 === 0 && status.is_running) {
                // Update the progress without changing the whole message
                const progressPercent = status.progress || 0;
                const phaseMessage = status.current_phase || 'Scraping in progress';
                const progressMessage = `Progress: ${progressPercent}%`;
                
                // Update current city if available
                if (status.current_city && status.current_city !== currentCity) {
                  setCurrentCity(status.current_city);
                }
                
                updateLoadingMessageWithTime(`${phaseMessage} (${progressMessage})`);
              }
            }
          } else {
            // No status received, implement backoff strategy
            consecutiveErrorCount++;
            console.warn(`No status received (attempt ${attempts}, error #${consecutiveErrorCount})`);
            
            // Increase delay between checks (exponential backoff)
            if (consecutiveErrorCount >= 3) {
              // Modify interval timing only after repeated failures
              const oldDelay = statusCheckDelay;
              statusCheckDelay = Math.min(statusCheckDelay * 1.5, maxStatusCheckDelay);
              
              if (oldDelay !== statusCheckDelay) {
                console.log(`Increasing status check delay to ${statusCheckDelay}ms`);
                
                // Reset interval with new delay
                clearInterval(downloadIntervalRef.current);
                downloadIntervalRef.current = setInterval(performStatusCheck, statusCheckDelay);
              }
              
              setLoadingMessage(`Waiting for status update... Server may be busy (Attempt ${attempts})`);
            }
          }
        } catch (error) {
          // Error in status check
          consecutiveErrorCount++;
          console.error(`Error checking status (attempt ${attempts}, error #${consecutiveErrorCount}):`, error);
          
          // Increase delay between checks (exponential backoff)
          if (consecutiveErrorCount >= 3) {
            const oldDelay = statusCheckDelay;
            statusCheckDelay = Math.min(statusCheckDelay * 1.5, maxStatusCheckDelay);
            
            if (oldDelay !== statusCheckDelay) {
              console.log(`Increasing status check delay to ${statusCheckDelay}ms`);
              
              // Reset interval with new delay
              clearInterval(downloadIntervalRef.current);
              downloadIntervalRef.current = setInterval(performStatusCheck, statusCheckDelay);
            }
            
            setLoadingMessage(`Retrying status check... Server may be busy (Attempt ${attempts})`);
          }
        }
        
        // We no longer check for timeout
        // The process will continue indefinitely until completion or error
      };
      
      console.log('Beginning status monitoring...');
      
      // Initial delay if needed
      if (scrapingResult?.timedOut) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
      // Check status immediately to see if scraping is running
      try {
        console.log('Making initial status check...');
        const initialStatus = await checkScrapingStatus();
        console.log('Initial status check result:', initialStatus);
        
        if (initialStatus) {
          lastStatus = initialStatus;
          
          if (initialStatus.error) {
            setIsLoading(false);
            toast.error(`Scraping error: ${initialStatus.last_completed || 'Unknown error'}`);
            return;
          } else if (initialStatus.no_results) {
            setIsLoading(false);
            toast.warning('No results found for the specified criteria');
            return;
          } else if (initialStatus.completed) {
            // If already completed, download results immediately
            setLoadingMessage('Scraping already completed! Getting results...');
            const downloaded = await downloadResults();
            if (downloaded) {
              setIsLoading(false);
              toast.success('Data found and ready to use!');
              navigate('/generate');
              return;
            }
          } else if (initialStatus.is_running) {
            // Scraping is running, update message with current phase
            const progressPercent = initialStatus.progress || 0;
            const phaseMessage = initialStatus.current_phase || 'Scraping in progress';
            setLoadingMessage(`${phaseMessage} (Progress: ${progressPercent}%)`);
            
            console.log(`Scraping already in progress: ${phaseMessage}, ${progressPercent}%`);
          } else {
            // Status exists but doesn't indicate running or completion - keep monitoring
            setLoadingMessage('Waiting for scraping to begin...');
          }
        } else {
          // No status available yet, keep monitoring
          setLoadingMessage('Waiting for status update...');
        }
      } catch (error) {
        console.warn('Error on initial status check, will retry:', error);
        setLoadingMessage('Unable to get initial status, will continue monitoring...');
      }
      
      // Begin regular status polling
      const downloadInterval = setInterval(performStatusCheck, statusCheckDelay);
      downloadIntervalRef.current = downloadInterval;

    } catch (error) {
      console.error('Error in scraping process:', error);
      toast.error('An unexpected error occurred during the scraping process');
      setIsLoading(false);
    }
  };

  // Cleanup on component unmount and reset of state
  useEffect(() => {
    // Function to reset states when returning to the page
    const resetStates = async () => {
      if (downloadIntervalRef.current) {
        clearInterval(downloadIntervalRef.current);
        downloadIntervalRef.current = null;
      }
      if (scrapingTimeoutRef.current) {
        clearTimeout(scrapingTimeoutRef.current);
        scrapingTimeoutRef.current = null;
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setIsLoading(false);
      setLoadingMessage('');
      setCurrentCity(null);
      setScrapingStatus(null);

      // Reset the backend scraper to ensure fresh state
      try {
        await scraperService.resetScraper();
      } catch (error) {
        console.warn('Failed to reset scraper:', error);
      }
    };

    // Add event listener for when the page becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        resetStates();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Reset when component mounts
    resetStates();

    // Cleanup on unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (downloadIntervalRef.current) {
        clearInterval(downloadIntervalRef.current);
      }
      if (scrapingTimeoutRef.current) {
        clearTimeout(scrapingTimeoutRef.current);
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  const handleStateClick = (state) => {
    setSelectedState(state)
    setShowStates(false)
    setShowCities(true)
  }

  const handleCityClick = (city) => {
    setSelectedCities(prev => {
      if (prev.includes(city)) {
        return prev.filter(c => c !== city)
      }
      return [...prev, city]
    })
  }

  const removeCity = (cityToRemove) => {
    setSelectedCities(prev => prev.filter(city => city !== cityToRemove));
  }

  const removeKeyword = (keywordToRemove) => {
    setSelectedKeywords(prev => prev.filter(keyword => keyword !== keywordToRemove));
  }

  const addDefaultKeyword = (keyword) => {
    if (!selectedKeywords.includes(keyword)) {
      setSelectedKeywords(prev => [...prev, keyword]);
    }
    setShowKeywordsTooltip(false);
  }

  const isFormValid = formData.city.trim() !== '' && formData.jobs.trim() !== ''

  const toggleCountry = (country) => {
    setSelectedCountry(country)
    setSelectedState(null)
    setShowCities(false)
  }

  return (
    <div className="min-h-[calc(100vh-76px)] bg-gradient-to-br from-gray-900 to-purple-900 p-4 sm:p-6 lg:p-8">
      {isLoading && <LoadingOverlay message={getLoadingOverlayMessage()} />}
      <h1 className="text-purple-200 text-2xl sm:text-3xl font-bold mb-6 md:mb-8 text-center">Create New Scraping Request</h1>
      
      <div className="flex items-center justify-center">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 sm:gap-8 w-full max-w-4xl bg-gray-800/50 backdrop-blur-sm p-6 sm:p-8 rounded-xl shadow-2xl border border-gray-700">
          <div className="flex flex-col gap-3">
            <label htmlFor="city" className="text-purple-200 font-medium text-lg">Cities</label>
            <div className="flex gap-2 relative" ref={dropdownRef}>
              <div className="relative flex-grow">
                <input 
                  type="text" 
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Enter cities to search (comma separated)" 
                  className="px-4 py-3 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent w-full shadow-inner"
                />
              </div>
              <button 
                type="button"
                onClick={() => {
                  setShowStates(!showStates)
                  setShowCities(false)
                }}
                className="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors shadow-md font-medium whitespace-nowrap flex-shrink-0"
              >
                Select
              </button>
              
              {/* States dropdown */}
              {showStates && (
                <div className="absolute top-full left-0 mt-2 w-full bg-gray-800 shadow-2xl rounded-lg z-10 max-h-[300px] overflow-y-auto border border-gray-700 scrollbar-thin-hover">
                  <div className="p-3 sticky top-0 bg-gray-700 font-medium text-base flex justify-between items-center border-b border-gray-600">
                    <span className="text-white">Select a location</span>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => toggleCountry('USA')}
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${selectedCountry === 'USA' ? 'bg-purple-600 text-white' : 'bg-gray-600 text-gray-200 hover:bg-gray-500'}`}
                      >
                        USA
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleCountry('Canada')}
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${selectedCountry === 'Canada' ? 'bg-purple-600 text-white' : 'bg-gray-600 text-gray-200 hover:bg-gray-500'}`}
                      >
                        Canada
                      </button>
                    </div>
                  </div>
                  <div className="p-1">
                    {(selectedCountry === 'USA' ? usaData : canadaData).map((item, index) => (
                      <div 
                        key={index} 
                        onClick={() => handleStateClick(item)}
                        className="p-3 hover:bg-gray-700 cursor-pointer text-gray-300 hover:text-white rounded-md m-1 transition-colors"
                      >
                        {item.state}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Cities dropdown */}
              {showCities && selectedState && (
                <div className="absolute top-full left-0 mt-2 w-full bg-gray-800 shadow-2xl rounded-lg z-10 max-h-[300px] overflow-y-auto border border-gray-700 scrollbar-thin-hover">
                  <div className="p-3 sticky top-0 bg-gray-700 font-medium flex justify-between items-center text-base border-b border-gray-600">
                    <span className="text-white">Cities in {selectedState.state} ({selectedCountry})</span>
                    <button 
                      type="button" 
                      className="text-xs text-purple-300 hover:text-purple-200 transition-colors"
                      onClick={() => {
                        setShowCities(false)
                        setShowStates(true)
                      }}
                    >
                      Back to {selectedCountry === 'USA' ? 'states' : 'provinces'}
                    </button>
                  </div>
                  
                  {/* Select All button */}
                  <div className="px-3 py-2 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedCities(prev => {
                          // If all cities are already selected, deselect all
                          if (selectedState.cities.every(city => prev.includes(city))) {
                            return prev.filter(city => !selectedState.cities.includes(city));
                          }
                          // Otherwise, add all cities that aren't already selected
                          const newCities = selectedState.cities.filter(city => !prev.includes(city));
                          return [...prev, ...newCities];
                        })}
                        className="bg-purple-700 hover:bg-purple-600 text-white text-xs px-3 py-1 rounded transition-colors"
                      >
                        {selectedState.cities.every(city => selectedCities.includes(city)) 
                          ? 'Deselect All' 
                          : 'Select All'}
                      </button>
                      
                      <div className="text-gray-400 text-xs">
                        <span className="text-purple-300">{selectedState.cities.filter(city => selectedCities.includes(city)).length}</span>
                        <span> of </span>
                        <span className="text-purple-300">{selectedState.cities.length}</span>
                        <span> selected</span>
                      </div>
                    </div>
                    
                    {selectedState.cities.some(city => selectedCities.includes(city)) && (
                      <button
                        type="button"
                        onClick={() => setSelectedCities(prev => 
                          prev.filter(city => !selectedState.cities.includes(city))
                        )}
                        className="text-red-400 hover:text-red-300 text-xs transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  
                  <div className="p-1">
                    {selectedState.cities.map((city, index) => (
                      <div 
                        key={index} 
                        onClick={() => handleCityClick(city)}
                        className={`p-3 hover:bg-gray-700 cursor-pointer flex items-center rounded-md m-1 transition-colors ${
                          selectedCities.includes(city) ? 'bg-gray-700 text-white' : 'text-gray-300'
                        }`}
                      >
                        <input 
                          type="checkbox" 
                          checked={selectedCities.includes(city)}
                          readOnly
                          className="mr-3 h-4 w-4 accent-purple-500"
                        />
                        {city}
                      </div>
                    ))}
                  </div>
                  <div className="p-2 sticky bottom-0 bg-gray-700 font-medium flex justify-end border-t border-gray-600">
                    <button 
                      type="button" 
                      className="text-sm text-white bg-purple-600 px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                      onClick={() => setShowCities(false)}
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Display selected cities as tags */}
          {selectedCities.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedCities.map((city, idx) => (
                <div key={idx} className="bg-purple-900/50 text-purple-200 rounded-full px-3 py-1.5 text-sm flex items-center border border-purple-700/50 shadow-sm">
                  {city}
                  <button 
                    type="button" 
                    className="ml-2 text-purple-300 hover:text-white transition-colors"
                    onClick={() => removeCity(city)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex flex-col gap-2 mt-2 sm:mt-4">
            <label htmlFor="jobs" className="text-purple-200 font-medium text-lg">Job Keywords</label>
            <div className="flex gap-2 relative" ref={keywordsRef}>
              <div className="relative flex-grow">
                <input 
                  type="text" 
                  id="jobs"
                  name="jobs"
                  value={formData.jobs}
                  onChange={handleChange}
                  placeholder="Enter relevant job keywords (comma separated)" 
                  className="px-4 py-3 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent w-full shadow-inner"
                />
              </div>
              <button 
                type="button"
                onClick={() => setShowKeywordsTooltip(!showKeywordsTooltip)}
                className="bg-purple-600 text-white w-12 flex items-center justify-center rounded-lg hover:bg-purple-700 transition-colors shadow-md flex-shrink-0"
              >
                <FiInfo size={20} />
              </button>
              
              {/* Keywords tooltip */}
              {showKeywordsTooltip && (
                <div className="absolute top-full right-0 mt-2 w-[350px] sm:w-[420px] bg-gray-800 shadow-2xl rounded-lg z-10 p-4 border border-gray-700">
                  <h4 className="font-medium mb-3 text-purple-200">Available keywords:</h4>
                  
                  {/* Category selector */}
                  <div className="mb-3">
                    <select 
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      <option value="All">All Categories</option>
                      {Object.keys(keywordCategories).map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Search bar for keywords */}
                  <div className="mb-3">
                    <input
                      type="text"
                      placeholder="Search keywords..."
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                  </div>
                  
                  <div className="max-h-[300px] overflow-y-auto pr-2 scrollbar-thin-hover">
                    {displayKeywords.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {displayKeywords.map((keyword, idx) => (
                          <div 
                            key={idx}
                            onClick={() => addDefaultKeyword(keyword)}
                            className="keyword-item bg-gray-700 text-gray-300 rounded-full px-3 py-1.5 text-sm hover:bg-gray-600 hover:text-white transition-colors cursor-pointer"
                          >
                            {keyword}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm py-2">No keywords found matching your search</p>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-gray-700">
                    <div className="flex justify-between items-center">
                      <p className="text-gray-400 text-xs">Click on any keyword to add it to your selection</p>
                      <p className="text-purple-400 text-xs">
                        {selectedCategory === 'All' 
                          ? `${defaultKeywords.length} keywords total` 
                          : `${displayKeywords.length} of ${defaultKeywords.length} keywords`}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Display selected keywords as tags - improved version */}
          {selectedKeywords.length > 0 && (
            <div className="flex flex-col gap-3 mt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-teal-300 font-medium">Selected Keywords:</span>
                  <span className="bg-teal-900/60 text-teal-200 text-xs rounded-full px-2 py-0.5">{selectedKeywords.length}</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setSelectedKeywords([])}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Clear All
                </button>
              </div>
              
              <div className="bg-gray-800/80 rounded-lg border border-gray-700 p-3 max-h-[150px] overflow-y-auto scrollbar-thin-hover">
                {/* Display keyword categories with counts */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(keywordCategories).map(([category, keywords]) => {
                    const selectedCount = keywords.filter(k => selectedKeywords.includes(k)).length;
                    if (selectedCount === 0) return null;
                    
                    return (
                      <div key={category} className="bg-gray-700/60 rounded p-2 hover:bg-gray-700 transition-colors">
                        <div className="flex justify-between items-center">
                          <span className="text-teal-300 text-xs font-medium">{category}</span>
                          <span className="bg-teal-900/60 text-teal-200 text-xs rounded-full px-1.5 py-0.5">{selectedCount}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Show 5 sample keywords with a "View All" button */}
                <div className="mt-3 flex flex-wrap gap-1.5 items-center">
                  {selectedKeywords.slice(0, 5).map((keyword, idx) => (
                    <div key={idx} className="bg-teal-900/40 text-teal-200 rounded-full px-2 py-1 text-xs">
                      {keyword}
                    </div>
                  ))}
                  
                  {selectedKeywords.length > 5 && (
                    <button
                      type="button"
                      onClick={() => {
                        const modal = document.getElementById('keywordsModal');
                        if (modal) modal.style.display = 'flex';
                      }}
                      className="bg-teal-800/50 text-teal-300 rounded-full px-2 py-1 text-xs hover:bg-teal-800 transition-colors"
                    >
                      +{selectedKeywords.length - 5} more
                    </button>
                  )}
                </div>
              </div>
              
              {/* Keywords Modal */}
              <div 
                id="keywordsModal" 
                className="fixed inset-0 bg-black/70 z-50 justify-center items-center p-4 hidden"
                onClick={(e) => {
                  if (e.target.id === 'keywordsModal') {
                    e.target.style.display = 'none';
                  }
                }}
              >
                <div className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                  <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h3 className="text-white text-lg font-medium">All Selected Keywords ({selectedKeywords.length})</h3>
                    <button 
                      type="button"
                      onClick={() => {
                        const modal = document.getElementById('keywordsModal');
                        if (modal) modal.style.display = 'none';
                      }}
                      className="text-gray-400 hover:text-white text-xl font-bold"
                    >
                      ×
                    </button>
                  </div>
                  <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)] scrollbar-thin-hover">
                    {/* Category tabs */}
                    <div className="mb-4 flex flex-wrap gap-2">
                      {Object.entries(keywordCategories).map(([category, keywords]) => {
                        const count = keywords.filter(k => selectedKeywords.includes(k)).length;
                        if (count === 0) return null;
                        
                        return (
                          <div key={category} className="bg-gray-700 rounded px-3 py-1.5 text-sm flex items-center">
                            <span className="text-teal-300">{category}</span>
                            <span className="ml-2 bg-teal-900/60 text-teal-200 text-xs rounded-full px-1.5 py-0.5">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Keywords list with remove button */}
                    <div className="flex flex-wrap gap-2">
                      {selectedKeywords.map((keyword, idx) => (
                        <div key={idx} className="bg-teal-900/40 text-teal-200 rounded-full px-3 py-1.5 text-sm flex items-center border border-teal-700/50">
                          {keyword}
                          <button 
                            type="button" 
                            className="ml-2 text-teal-300 hover:text-white transition-colors"
                            onClick={() => removeKeyword(keyword)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 border-t border-gray-700 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        const modal = document.getElementById('keywordsModal');
                        if (modal) modal.style.display = 'none';
                      }}
                      className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-6">
            <button 
              type="submit" 
              disabled={!isFormValid}
              className={`py-3 px-6 rounded-lg font-medium text-white text-base ${
                isFormValid 
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 cursor-pointer shadow-lg' 
                  : 'bg-gray-600 cursor-not-allowed'
              } transition-all duration-300 w-full transform hover:scale-[1.02] active:scale-[0.98]`}
            >
              Submit Request
            </button>
            <p className="text-gray-400 text-sm mt-3 text-center">Please input multiple values separated by commas</p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Create