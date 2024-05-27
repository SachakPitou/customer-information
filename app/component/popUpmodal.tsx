import React from 'react';

const PopUpModal = ({ isOpen, onClose, title, content }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center border-b mb-4">
          <h3 className="text-xl font-semibold">{title}</h3>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>
            &times;
          </button>
        </div>
        <div>{content}</div>
      </div>
    </div>
  );
};

export default PopUpModal;