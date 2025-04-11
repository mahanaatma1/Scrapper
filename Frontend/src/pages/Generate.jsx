import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import InfoCard from '../components/InfoCard';
import { toast } from 'react-hot-toast';
import { formatDate } from '../utils/formatDate';
import { extractEmailFromGmailUrl } from '../utils/formatEmail';
import { gptMailService } from '../api/GPTmailApi';
import { scraperService } from '../api/scrapperApi';
import { useNavigate } from 'react-router-dom';

function Generate() {
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [selectedCards, setSelectedCards] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMails, setGeneratedMails] = useState([]);

  useEffect(() => {
    const processCSVData = async () => {
      try {
        setIsLoading(true);
        console.log('=== STARTING CSV PROCESSING ===');
        console.log('1. Fetching CSV file...');

        // First check if the file exists using the API
        try {
          const fileCheck = await scraperService.checkResultsFileExists();
          if (!fileCheck.exists) {
            console.warn('Results file not found via API check - will try direct fetch');
          } else {
            console.log('Results file confirmed to exist:', fileCheck.fileInfo);
          }
        } catch (error) {
          console.warn('Error checking file existence via API:', error);
        }

        // Attempt to fetch the file
        const response =  await fetch('/output/results.csv')
        
        if (!response.ok) {
          // Try alternative filename just in case
          const alternativeResponse = await fetch('/output/scraped_results.csv');
          if (!alternativeResponse.ok) {
            throw new Error(`Failed to fetch CSV file: ${response.status} ${response.statusText}`);
          }
          console.log('Using alternative filename: scraped_results.csv');
          return await processCSVResponse(alternativeResponse);
        }
        
        return await processCSVResponse(response);
      } catch (error) {
        console.error('CSV Processing Error:', error);
        toast.error('Failed to load job listings');
      } finally {
        setIsLoading(false);
      }
    };

    // Helper function to process CSV response
    const processCSVResponse = async (response) => {
      try {
        const csvText = await response.text();
        console.log('2. CSV File Content:', csvText);
        
        return new Promise((resolve, reject) => {
          Papa.parse(csvText, {
            complete: (result) => {
              console.log('3. Parsed CSV Result:', result);
              
              // Get column names from first row
              const columnNames = result.data[0];
              console.log('4. Column Names:', columnNames);
  
              // Get data rows (excluding header)
              const dataRows = result.data.slice(1);
              console.log('5. Data Rows:', dataRows);
  
              const processedCards = dataRows
                .filter(row => {
                  console.log('6. Filtering Row:', row);
                  return row && row.length >= columnNames.length;
                })
                .map((row, index) => {
                  try {
                    console.log(`7. Processing Row ${index + 1}:`, row);
  
                    // Create an object using column names as keys
                    const rowData = {};
                    columnNames.forEach((name, index) => {
                      rowData[name] = row[index];
                    });
  
                    console.log('8. Row Data Object:', rowData);
  
                    // Format date
                    console.log('9. Sending date to formatDate utility:', rowData['Post Date']);
                    let formattedDate = '';
                    try {
                      formattedDate = formatDate(rowData['Post Date']);
                      console.log('10. Formatted Date Result:', formattedDate);
                    } catch (error) {
                      console.warn('Date formatting error:', error);
                      formattedDate = rowData['Post Date'];
                    }
  
                    // Extract email
                    console.log('11. Processing Email:', {
                      originalEmail: rowData['Email'],
                      gmailUrl: rowData['Gmail']
                    });
                    
                    let extractedEmail = rowData['Email'].replace(/\n/g, '');
                    if (!extractedEmail && rowData['Gmail']) {
                      console.log('12. Attempting to extract email from Gmail URL');
                      extractedEmail = extractEmailFromGmailUrl(rowData['Gmail']);
                      console.log('13. Extracted Email Result:', extractedEmail);
                    }
  
                    // Create card object
                    const card = {
                      id: Math.random().toString(36).substr(2, 9),
                      city: rowData['City'],
                      title: rowData['Title'],
                      date: formattedDate,
                      email: extractedEmail,
                      description: rowData['Description'].replace(/\\n/g, '\n'),
                      link: rowData['Link']
                    };
  
                    console.log('14. Created Card Object:', card);
                    return card;
                  } catch (error) {
                    console.warn('Error processing row:', error);
                    return null;
                  }
                })
                .filter(card => {
                  const isValid = card !== null && card.title && card.email;
                  console.log('15. Card Validation:', { card, isValid });
                  return isValid;
                });
  
              console.log('16. Final Processed Cards:', processedCards);
              setCards(processedCards);
              
              if (processedCards.length > 0) {
                console.log('17. Success: Cards loaded into state');
                toast.success(`Loaded ${processedCards.length} job listings`);
                resolve(processedCards);
              } else {
                console.log('18. Warning: No valid cards found');
                toast.warning('No valid job listings found in the CSV file');
                resolve([]);
              }
            },
            header: false,
            skipEmptyLines: true,
            error: (error) => {
              console.error('Papa Parse Error:', error);
              toast.error('Error parsing CSV file');
              reject(error);
            }
          });
        });
      } catch (error) {
        console.error('Error processing CSV response:', error);
        throw error;
      }
    };

    processCSVData();
  }, []);

  // Log when cards state changes
  useEffect(() => {
    console.log('19. Cards State Updated:', cards);
  }, [cards]);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      console.log('Starting generate process...');

      // Get selected cards data
      const selectedCardsData = cards.filter(card => selectedCards.has(card.id));
      console.log('Selected cards for generation:', selectedCardsData);

      if (selectedCardsData.length === 0) {
        toast.warning('Please select at least one job listing');
        return;
      }

      const processedMails = [];
      
      // Process each card with a delay
      for (const card of selectedCardsData) {
        try {
          console.log('Generating mail for:', card.title);
          
          // Format the date to YYYY-MM-DD
          const dateParts = card.date.split('-');
          const formattedDate = `20${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;

          // Generate mail using gptMailService
          const response = await gptMailService.generateMail({
            title: card.title,
            description: card.description,
            date: formattedDate,
            link: card.link,
            city: card.city,
            persona: "Abj"
          });

          // Parse the response
          const { subject, content } = gptMailService.parseMailResponse(response);

          // Store the processed mail with proper separation
          processedMails.push({
            id: card.id,
            Title: card.title,
            City: card.city,
            Description: card.description, // Original job description
            Content: card.description, // Original content/description
            subject: subject,
            MailTemplate: content, // Generated mail template from GPT
            email: card.email // Add the email address
          });

          // Wait for 5 seconds before processing the next card
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          console.log('Successfully generated mail for:', card.title);
        } catch (error) {
          console.error('Error generating mail for card:', card.title, error);
          toast.error(`Failed to generate mail for ${card.title}`);
        }
      }

      if (processedMails.length > 0) {
        setGeneratedMails(processedMails);
        toast.success(`Successfully generated ${processedMails.length} mail templates`);
        navigate('/send', { state: { generatedMails: processedMails } });
      } else {
        toast.error('Failed to generate any mail templates');
      }
    } catch (error) {
      console.error('Error in generate process:', error);
      toast.error('An error occurred during mail generation');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[90vh]">
        <div className="text-white text-xl">Loading job listings...</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 min-h-[90vh] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-purple-200 text-xl sm:text-2xl font-bold">Generate</h1>
        <div className="flex gap-4">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || selectedCards.size === 0}
            className={`px-4 py-2 rounded-lg transition-colors ${
              isGenerating || selectedCards.size === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isGenerating ? 'Generating...' : 'Generate Templates'}
          </button>
          <button
            onClick={() => {
              const newSelection = new Set(cards.map(card => card.id));
              setSelectedCards(newSelection);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Select All
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {cards.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-white text-lg sm:text-xl">No job listings found</p>
              <p className="text-gray-400 text-sm mt-2">Please check the console for more details</p>
            </div>
          </div>
        ) : (
          cards.map(card => {
            console.log('20. Rendering Card:', card);
            return (
              <InfoCard
                key={card.id}
                data={card}
                isSelected={selectedCards.has(card.id)}
                onSelect={(cardId) => {
                  setSelectedCards(prev => {
                    const newSelection = new Set(prev);
                    if (newSelection.has(cardId)) {
                      newSelection.delete(cardId);
                    } else {
                      newSelection.add(cardId);
                    }
                    return newSelection;
                  });
                }}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

export default Generate;
