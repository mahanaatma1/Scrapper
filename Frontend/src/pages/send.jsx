import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import InfoCard from '../components/InfoCard'
import { toast } from 'react-hot-toast'
import { mailerService } from '../api/MailerApi'

function Send() {
  const location = useLocation();
  const navigate = useNavigate();
  const [generatedMails, setGeneratedMails] = useState([]);
  const [selectedCards, setSelectedCards] = useState(new Set());
  const [isSending, setIsSending] = useState(false);
  const [sendingStatus, setSendingStatus] = useState({});
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    failed: 0
  });

  useEffect(() => {
    if (!location.state?.generatedMails) {
      toast.error('Please generate mail templates first');
      navigate('/generate');
      return;
    }
    setGeneratedMails(location.state.generatedMails);
    setStats(prev => ({ ...prev, total: location.state.generatedMails.length }));
  }, [location, navigate]);

  const handleSelectAll = () => {
    if (selectedCards.size === generatedMails.length) {
      setSelectedCards(new Set());
    } else {
      const allIds = generatedMails.map(mail => mail.id);
      setSelectedCards(new Set(allIds));
    }
  };

  const sendSingleMail = async (mail) => {
    try {
      setSendingStatus(prev => ({ ...prev, [mail.id]: { isSending: true } }));
      
      await mailerService.sendMail({
        email: mail.email,
        subject: mail.subject,
        mail_body: mail.MailTemplate
      });

      setSendingStatus(prev => ({ ...prev, [mail.id]: { isSending: false, isSent: true } }));
      setStats(prev => ({ ...prev, sent: prev.sent + 1 }));
      toast.success(`Mail sent successfully to ${mail.email}`);
    } catch (error) {
      console.error('Error sending mail:', error);
      setSendingStatus(prev => ({ ...prev, [mail.id]: { isSending: false, isSent: false } }));
      setStats(prev => ({ ...prev, failed: prev.failed + 1 }));
      toast.error(`Failed to send mail to ${mail.email}`);
    }
  };

  const handleSendMail = async () => {
    if (selectedCards.size === 0) {
      toast.warning('Please select at least one mail to send');
      return;
    }

    setIsSending(true);
    const selectedMails = generatedMails.filter(mail => selectedCards.has(mail.id));
    
    for (const mail of selectedMails) {
      await sendSingleMail(mail);
      // Wait for 3 seconds before sending the next mail
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    setIsSending(false);
  };

  const handleTemplateUpdate = (updatedTemplate) => {
    setGeneratedMails(prevMails => 
      prevMails.map(mail => {
        if (mail.id === updatedTemplate.id) {
          return {
            ...mail,
            MailTemplate: updatedTemplate.description
          };
        }
        return mail;
      })
    );
    toast.success('Template updated successfully');
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 min-h-[90vh] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-purple-200 text-xl sm:text-2xl font-bold">Send</h1>
          <div className="text-sm text-gray-400 mt-1">
            Progress: {stats.sent} sent, {stats.failed} failed out of {stats.total} total
          </div>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleSendMail}
            disabled={isSending || selectedCards.size === 0}
            className={`px-4 py-2 rounded-lg transition-colors ${
              isSending || selectedCards.size === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isSending ? 'Sending...' : 'Send Mail'}
          </button>
          <button
            onClick={handleSelectAll}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {selectedCards.size === generatedMails.length ? 'Unselect All' : 'Select All'}
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {generatedMails.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-white text-lg sm:text-xl">No mail templates found</p>
              <p className="text-gray-400 text-sm mt-2">Please complete the generate process first</p>
            </div>
          </div>
        ) : (
          generatedMails.map((mail, index) => (
            <InfoCard
              key={mail.id || index}
              data={{
                id: mail.id || index,
                city: mail.City,
                title: mail.Title,
                description: mail.Description,
                email: mail.email,
                date: mail.date,
                selectedTemplate: mail.MailTemplate,
                subject: mail.subject
              }}
              isSelected={selectedCards.has(mail.id || index)}
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
              showMailTemplate={true}
              mailTemplates={[{
                id: mail.id || index,
                name: mail.Title,
                description: mail.MailTemplate,
                subject: mail.subject
              }]}
              onMailTemplateSelect={(template) => {
                console.log('Selected template:', template);
              }}
              onTemplateUpdate={handleTemplateUpdate}
              isSending={sendingStatus[mail.id]?.isSending}
              isSent={sendingStatus[mail.id]?.isSent}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default Send
