import ChatbotModal from './ChatbotModal';

const AIAssistantWrapper = ({ isVisible, onClose }) => {
    return (
        <ChatbotModal
            isVisible={isVisible}
            onClose={onClose}
        />
    );
};

export default AIAssistantWrapper;
