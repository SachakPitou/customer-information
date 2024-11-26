import React from 'react';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = () => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-red-50 to-white">
      {/* Main content container with subtle entrance animation */}
      <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-md shadow-xl 
                      flex flex-col items-center transform transition-all duration-700 
                      hover:shadow-2xl hover:scale-105 animate-fade-in">
        {/* Logo container with pulse effect */}
        <div className="relative w-40 h-40 mb-8 animate-pulse">
          <div className="absolute inset-0 bg-red-100 rounded-full scale-90 blur-xl"></div>
          <Image
            src="/img/matinternet.png"
            alt="Loading"
            fill
            sizes="160px"
            priority
            className="object-contain relative z-10"
          />
        </div>
        
        {/* Spinner with custom color gradient */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-red-600 blur-lg opacity-50"></div>
          <Loader2 className="w-12 h-12 animate-spin text-red-600 relative z-10 mb-6" />
        </div>
        
        {/* Text content with animations */}
        <div className="space-y-3 text-center">
          <p className="text-lg text-gray-800 font-medium animate-pulse">Loading...</p>
          <p className="text-gray-600 animate-fade-in">Please wait patiently...</p>
          <p className="text-gray-600 font-kh-battambang animate-fade-in">សូមរង់ចាំ...</p>
        </div>
      </div>
      
      {/* Enhanced background decorative elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {/* Top right blob */}
        <div className="absolute -top-20 -right-20 w-96 h-96 
                      bg-gradient-to-br from-red-100/60 to-red-200/60 
                      rounded-full blur-3xl animate-blob"></div>
        
        {/* Bottom left blob */}
        <div className="absolute -bottom-20 -left-20 w-96 h-96 
                      bg-gradient-to-tr from-red-50/60 to-red-100/60 
                      rounded-full blur-3xl animate-blob delay-1000"></div>
        
        {/* Center blob */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                      w-96 h-96 bg-red-50/30 rounded-full blur-3xl 
                      animate-pulse-slow"></div>
      </div>

      {/* Optional loading progress dots */}
      <div className="absolute bottom-10 flex space-x-2">
        <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce delay-100"></div>
        <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce delay-200"></div>
      </div>
    </div>
  );
};

export default LoadingSpinner;