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
    "android development", "game development", "unity", "unreal engine",
    "c++", "c#", "java", "ruby", "ruby on rails", "go", "golang",
    "kotlin", "rust", "scala", "svelte", "figma", "adobe xd",
    "photoshop", "illustrator", "indesign", "after effects", "premiere pro",
    "3d modeling", "blender", "maya", "zbrush", "content creation",
    "video editing", "animation", "docker", "kubernetes", "terraform",
    "jenkins", "gitlab ci", "github actions", "ci/cd", "microservices",
    "serverless", "lambda", "firebase", "azure", "gcp", "google cloud",
    "twilio", "stripe", "payment integration", "api development", "rest api",
    "graphql", "web scraping", "data mining", "data analysis", "excel",
    "power bi", "tableau", "r programming", "statistics", "big data",
    "hadoop", "spark", "kafka", "data engineering", "etl",
    "natural language processing", "nlp", "computer vision", "opencv",
    "tensorflow", "pytorch", "deep learning", "reinforcement learning",
    "chatbot", "web3", "defi", "smart contract", "cryptocurrency",
    "backend", "frontend", "ui developer", "ux researcher", "user research",
    "prototyping", "wireframing", "responsive design", "mobile first",
    "cross platform", "pwa", "progressive web app", "web components",
    "cms", "drupal", "joomla", "magento", "opencart", "prestashop",
    "squarespace", "database design", "data modeling", "redis", "elasticsearch",
    "cassandra", "dynamodb", "mariadb", "mysql", "sqlite", "oracle",
    "security audit", "penetration testing", "ethical hacking",
    "vulnerability assessment", "ciso", "it support", "helpdesk",
    "technical support", "system engineer", "network engineer", "cisco",
    "juniper", "virtualization", "vmware", "hyper-v", "windows server",
    "linux admin", "bash scripting", "powershell", "automation script",
    "cron job", "email marketing", "content marketing", "social media management",
    "ppc", "google ads", "facebook ads", "marketing automation", "analytics",
    "google analytics", "conversion optimization", "a/b testing", "user testing",
    "accessibility", "wcag", "seo optimization", "technical seo", "local seo"
  ]
  
  // Initialize selectedKeywords with default keywords
  const [selectedKeywords, setSelectedKeywords] = useState([...defaultKeywords])

  // Keyword categories for organization
  const keywordCategories = {
    "Web Development": ["website development", "wordpress", "php", "laravel", "mern", "mean", "next.js", "react", "node.js", "full stack", "javascript", "typescript", "vue.js", "angular", "frontend", "backend", "responsive design", "web components", "pwa", "progressive web app"],
    "Mobile Development": ["mobile app", "flutter", "swift", "ios development", "android development", "react native", "cross platform", "mobile first"],
    "Design": ["ui/ux", "web design", "graphic design", "figma", "adobe xd", "photoshop", "illustrator", "indesign", "wireframing", "prototyping", "user research", "ux researcher", "ui developer"],
    "Data & AI": ["data science", "machine learning", "ai", "data mining", "data analysis", "big data", "hadoop", "spark", "data engineering", "etl", "natural language processing", "nlp", "computer vision", "opencv", "tensorflow", "pytorch", "deep learning", "reinforcement learning"],
    "Blockchain": ["blockchain", "ethereum", "solidity", "nft", "web3", "defi", "smart contract", "cryptocurrency"],
    "DevOps & Cloud": ["devops", "aws", "cloud", "docker", "kubernetes", "terraform", "jenkins", "gitlab ci", "github actions", "ci/cd", "microservices", "serverless", "lambda", "firebase", "azure", "gcp", "google cloud"],
    "Databases": ["database", "sql", "nosql", "mongodb", "postgresql", "database design", "data modeling", "redis", "elasticsearch", "cassandra", "dynamodb", "mariadb", "mysql", "sqlite", "oracle"],
    "Marketing": ["digital marketing", "seo", "social media", "email marketing", "content marketing", "social media management", "ppc", "google ads", "facebook ads", "marketing automation", "analytics", "google analytics", "conversion optimization", "a/b testing", "seo optimization", "technical seo", "local seo"],
    "3D & Animation": ["3d artist", "3d modeling", "blender", "maya", "zbrush", "game development", "unity", "unreal engine", "animation", "video editing", "after effects", "premiere pro"],
    "Programming Languages": ["python", "django", "c++", "c#", "java", "ruby", "ruby on rails", "go", "golang", "kotlin", "rust", "scala", "svelte"],
    "System & Security": ["system admin", "network", "cyber security", "security audit", "penetration testing", "ethical hacking", "vulnerability assessment", "ciso", "it support", "helpdesk", "technical support", "system engineer", "network engineer", "cisco", "juniper", "virtualization", "vmware", "hyper-v", "windows server"],
    "Scripting & Automation": ["bash scripting", "powershell", "automation script", "cron job", "automation"],
    "API & Integration": ["api development", "rest api", "graphql", "web scraping", "twilio", "stripe", "payment integration"],
    "E-commerce": ["e-commerce", "shopify", "wix", "magento", "opencart", "prestashop", "squarespace"],
    "Other": ["cms", "drupal", "joomla", "content creation", "user testing", "accessibility", "wcag", "qa testing", "software testing"]
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
        batch_size: 10,
        max_retries: 3
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
      const estimatedTimeoutMs = Math.max(numberOfCities * 30000, 180000);
      
      setLoadingMessage(`Starting scraping process for ${numberOfCities} cities (may take several minutes)...`);
      
      try {
        // Log that we're making the request
        console.log(`Making start-scraping request with timeout: ${estimatedTimeoutMs}ms`);
        
        // Make a single attempt to start scraping
        const response = await scraperService.startScraping({
          numberOfCities: numberOfCities,
          timeout: estimatedTimeoutMs
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setIsLoading(true);
    setLoadingMessage('Initializing process...');

    try {
      // Calculate maximum attempts based on number of cities
      // Formula: baseAttemptsPerCity * numberOfCities, but at least minAttempts and at most maxAttempts
      const numberOfCities = selectedCities.length;
      const baseAttemptsPerCity = 20; // 20 attempts per city (about 3.3 minutes per city at 10-second intervals)
      const minAttemptsLimit = 60; // At least 10 minutes (60 attempts * 10 seconds)
      const maxAttemptsLimit = 360; // At most 1 hour (360 attempts * 10 seconds)
      
      const calculatedMaxAttempts = Math.min(
        Math.max(numberOfCities * baseAttemptsPerCity, minAttemptsLimit),
        maxAttemptsLimit
      );
      
      console.log(`Calculated ${calculatedMaxAttempts} max attempts for ${numberOfCities} cities`);
      
      // Display estimated maximum wait time
      const estimatedMaxMinutes = Math.ceil((calculatedMaxAttempts * 10) / 60);
      console.log(`Maximum wait time: approximately ${estimatedMaxMinutes} minutes`);

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
      let scrapingResult = { success: false };
      try {
        setLoadingMessage(`Starting scraping process for ${numberOfCities} cities (est. max: ${estimatedMaxMinutes} min)...`);
        scrapingResult = await startScraping();
        
        if (!scrapingResult.success && !scrapingResult.timedOut) {
          setIsLoading(false);
          return;
        }
        
        // If we had a timeout, update the message but continue
        if (scrapingResult.timedOut) {
          toast.warning(`Scraping request is taking longer than expected. We'll monitor progress...`);
          setLoadingMessage(`Waiting for scraping status...`);
        } else {
          // Successful start
          setLoadingMessage(`Scraping started successfully. Monitoring progress...`);
        }
      } catch (error) {
        // Even if start scraping completely fails, we'll still try to check status
        console.error('Complete failure in start scraping, but will try status check:', error);
        scrapingResult = { timedOut: true };
        setLoadingMessage(`Verifying if scraping started...`);
      }

      // Step 4: Monitor scraping status
      let attempts = 0;
      let hasDownloaded = false;
      let lastStatus = null;
      const maxAttempts = calculatedMaxAttempts;
      let consecutiveErrorCount = 0; // Track consecutive errors
      let statusCheckDelay = 10000; // Start with 10 seconds
      const maxStatusCheckDelay = 30000; // Maximum 30 seconds between checks
      
      // Function to perform status check that will be used in the interval
      const performStatusCheck = async () => {
        attempts++;
        
        try {
          const status = await checkScrapingStatus();
          
          if (status) {
            // Reset error counter and back-off delay on successful status check
            if (consecutiveErrorCount > 0) {
              consecutiveErrorCount = 0;
              statusCheckDelay = 10000; // Reset to default on success after errors
            }
            
            console.log(`Current scraping status (attempt ${attempts}/${maxAttempts}):`, status);
            
            // Only update if status has changed
            if (JSON.stringify(status) !== JSON.stringify(lastStatus)) {
              lastStatus = status;
              
              // Handle different status cases
              if (status.is_running) {
                // Calculate remaining time estimate based on progress
                const progressPercent = status.progress || 0;
                const estimatedTotalAttempts = progressPercent > 0 ? 
                  Math.min(Math.ceil(attempts / (progressPercent / 100)), maxAttempts) : 
                  maxAttempts;
                const remainingAttempts = estimatedTotalAttempts - attempts;
                const remainingMinutes = Math.ceil((remainingAttempts * statusCheckDelay / 1000) / 60);
                
                // Format the message based on the current phase
                const phaseMessage = status.current_phase || 'Scraping in progress';
                const progressMessage = `Progress: ${progressPercent}%`;
                const timeMessage = progressPercent > 0 ? `, Est. remaining: ~${remainingMinutes} min` : '';
                
                setLoadingMessage(`${phaseMessage} (${progressMessage}${timeMessage})`);
              } else if (status.completed) {
                clearInterval(statusInterval);
                setLoadingMessage('Scraping completed! Getting results...');
                
                const downloaded = await downloadResults();
                if (downloaded) {
                  hasDownloaded = true;
                  setIsLoading(false);
                  toast.success('Data found and ready to use!');
                  navigate('/generate');
                }
              } else if (status.no_results || (status.current_phase === null && status.last_completed === null)) {
                clearInterval(statusInterval);
                setIsLoading(false);
                toast.warning('No results found for the specified criteria');
              } else if (status.error) {
                clearInterval(statusInterval);
                setIsLoading(false);
                toast.error(`Scraping error: ${status.last_completed || 'Unknown error'}`);
              }
            } else {
              // Status hasn't changed, but update the message periodically
              if (attempts % 5 === 0 && status.is_running) {
                // Update the time estimate without changing the whole message
                const progressPercent = status.progress || 0;
                const estimatedTotalAttempts = progressPercent > 0 ? 
                  Math.min(Math.ceil(attempts / (progressPercent / 100)), maxAttempts) : 
                  maxAttempts;
                const remainingAttempts = estimatedTotalAttempts - attempts;
                const remainingMinutes = Math.ceil((remainingAttempts * statusCheckDelay / 1000) / 60);
                
                // Keep the same phase but update the progress and time
                const phaseMessage = status.current_phase || 'Scraping in progress';
                const progressMessage = `Progress: ${progressPercent}%`;
                const timeMessage = progressPercent > 0 ? `, Est. remaining: ~${remainingMinutes} min` : '';
                
                setLoadingMessage(`${phaseMessage} (${progressMessage}${timeMessage})`);
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
                clearInterval(statusInterval);
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
              clearInterval(statusInterval);
              downloadIntervalRef.current = setInterval(performStatusCheck, statusCheckDelay);
            }
            
            setLoadingMessage(`Retrying status check... Server may be busy (Attempt ${attempts})`);
          }
        }
        
        // Check for timeout regardless of status checks
        if (attempts >= maxAttempts) {
          clearInterval(statusInterval);
          setIsLoading(false);
          toast.error(`Scraping process timed out after ${Math.round(maxAttempts * statusCheckDelay / 1000 / 60)} minutes`);
        }
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
      const statusInterval = setInterval(performStatusCheck, statusCheckDelay);
      downloadIntervalRef.current = statusInterval;

    } catch (error) {
      console.error('Error in scraping process:', error);
      toast.error('An unexpected error occurred during the scraping process');
      setIsLoading(false);
    }
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (downloadIntervalRef.current) {
        clearInterval(downloadIntervalRef.current);
      }
      if (scrapingTimeoutRef.current) {
        clearTimeout(scrapingTimeoutRef.current);
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
      {isLoading && <LoadingOverlay message={loadingMessage} />}
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