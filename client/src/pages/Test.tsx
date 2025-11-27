import React from 'react';

const Test: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          🧪 Tailwind CSS Test Page
        </h1>

        {/* Buttons Test */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-all">
              Primary Button
            </button>
            <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-all">
              Success Button
            </button>
            <button className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-all">
              Danger Button
            </button>
            <button className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-all">
              Outline Button
            </button>
          </div>
        </div>

        {/* Colors Test */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Colors</h2>
          <div className="grid grid-cols-5 gap-4">
            <div className="h-20 bg-blue-500 rounded-lg"></div>
            <div className="h-20 bg-green-500 rounded-lg"></div>
            <div className="h-20 bg-red-500 rounded-lg"></div>
            <div className="h-20 bg-yellow-500 rounded-lg"></div>
            <div className="h-20 bg-purple-500 rounded-lg"></div>
          </div>
        </div>

        {/* Typography Test */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Typography</h2>
          <div className="space-y-2">
            <p className="text-4xl font-bold">Heading 1 - Bold</p>
            <p className="text-3xl font-semibold">Heading 2 - Semibold</p>
            <p className="text-2xl font-medium">Heading 3 - Medium</p>
            <p className="text-xl">Heading 4 - Regular</p>
            <p className="text-base text-gray-600">Body text - Gray 600</p>
            <p className="text-sm text-gray-500">Small text - Gray 500</p>
          </div>
        </div>

        {/* Layout Test */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="text-4xl mb-2">🚗</div>
            <h3 className="text-xl font-bold mb-2">Card 1</h3>
            <p className="text-blue-100">This is a test card with gradient</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="text-4xl mb-2">✅</div>
            <h3 className="text-xl font-bold mb-2">Card 2</h3>
            <p className="text-green-100">This is a test card with gradient</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="text-4xl mb-2">📊</div>
            <h3 className="text-xl font-bold mb-2">Card 3</h3>
            <p className="text-purple-100">This is a test card with gradient</p>
          </div>
        </div>

        {/* Form Elements */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Form Elements</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Input Field
              </label>
              <input
                type="text"
                placeholder="Enter something..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Dropdown
              </label>
              <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>Option 1</option>
                <option>Option 2</option>
                <option>Option 3</option>
              </select>
            </div>
          </div>
        </div>

        {/* Badges & Pills */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Badges & Pills</h2>
          <div className="flex flex-wrap gap-3">
            <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              Blue Badge
            </span>
            <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              Green Badge
            </span>
            <span className="px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-medium">
              Red Badge
            </span>
            <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
              Yellow Badge
            </span>
          </div>
        </div>

        {/* Animation Test */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Animations</h2>
          <div className="flex gap-4">
            <div className="w-20 h-20 bg-blue-500 rounded-lg animate-pulse"></div>
            <div className="w-20 h-20 bg-green-500 rounded-lg animate-bounce"></div>
            <div className="w-20 h-20 bg-red-500 rounded-lg animate-spin"></div>
          </div>
        </div>

        {/* Success Message */}
        <div className="bg-green-50 border-l-4 border-green-600 rounded-lg p-6">
          <div className="flex items-start">
            <span className="text-3xl mr-4">✅</span>
            <div>
              <h3 className="text-lg font-bold text-green-900 mb-1">
                Tailwind CSS is Working!
              </h3>
              <p className="text-green-800">
                If you can see all the styles above properly, Tailwind CSS is configured correctly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Test;
