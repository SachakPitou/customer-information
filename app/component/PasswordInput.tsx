'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordInput() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <input
        className="rounded-md px-4 py-2 bg-inherit border mb-6 w-full pr-10"
        type={showPassword ? 'text' : 'password'}
        name="password"
        placeholder="••••••••"
        required
        id="password"
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-2 top-3 text-gray-500 hover:text-gray-700"
      >
        {showPassword ? (
          <EyeOff size={20} />
        ) : (
          <Eye size={20} />
        )}
      </button>
    </div>
  );
}