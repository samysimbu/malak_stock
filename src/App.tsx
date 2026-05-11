/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import { Search, Loader2, Package, Hash, Text, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StockItem } from './types';

const CSV_URL = 'https://docs.google.com/spreadsheets/d/1k4_Bd8rRT91sTtpE8EgWQbQoKBPwXS0d/export?format=csv';

export default function App() {
  const [stock, setStock] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<StockItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchStockData();
    
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchStockData = async () => {
    try {
      setLoading(true);
      const response = await fetch(CSV_URL);
      if (!response.ok) throw new Error('Failed to fetch stock data');
      const csvText = await response.text();
      
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const mappedData: StockItem[] = results.data.map((row: any) => ({
            code: row['Item code']?.trim() || '',
            description: row['Item Description']?.trim() || '',
            quantity: parseFloat(row['Stock Quantity']) || 0,
            unit: row['unit']?.trim() || '',
          })).filter(item => item.code || item.description);
          
          setStock(mappedData);
          setLoading(false);
        },
        error: (err: Error) => {
          setError(err.message);
          setLoading(false);
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = stock.filter(item => 
      item.code.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 10); // Limit suggestions for performance

    setSuggestions(filtered);
    setShowSuggestions(true);
  };

  const selectItem = (item: StockItem) => {
    setSelectedItem(item);
    setSearchQuery(item.code);
    setShowSuggestions(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedItem(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="w-12 h-12 text-dracula-purple animate-spin mb-4" />
        <p className="text-dracula-comment font-medium">Reading Stock Database...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <AlertCircle className="w-16 h-16 text-dracula-red mb-4" />
        <h2 className="text-xl font-bold mb-2">Connection Error</h2>
        <p className="text-dracula-comment mb-6">{error}</p>
        <button 
          onClick={fetchStockData}
          className="px-6 py-2 bg-dracula-purple text-dracula-bg rounded-lg font-bold hover:opacity-90 transition-opacity"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-lg mx-auto p-4 flex flex-col pt-8 sm:pt-12">
      {/* Header */}
      <header className="mb-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-3 mb-2"
        >
          <div className="p-3 bg-dracula-purple/20 rounded-2xl">
            <Package className="w-8 h-8 text-dracula-purple" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-dracula-fg">
            STOCK<span className="text-dracula-purple">LOG</span>
          </h1>
        </motion.div>
        <p className="text-dracula-comment text-sm">Inventory Manager & Search</p>
      </header>

      {/* Search Section */}
      <div className="relative mb-6" ref={searchRef}>
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-dracula-comment group-focus-within:text-dracula-cyan transition-colors" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
            placeholder="Search by Code or Description..."
            className="w-full bg-dracula-selection text-dracula-fg py-4 pl-12 pr-12 rounded-2xl border-2 border-transparent focus:border-dracula-purple transition-all shadow-xl"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-4 flex items-center text-dracula-comment hover:text-dracula-red transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Suggestions Dropdown */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-dracula-selection rounded-2xl shadow-2xl border border-dracula-comment/30 overflow-hidden z-50 max-h-72 overflow-y-auto backdrop-blur-md"
            >
              {suggestions.map((item, index) => (
                <button
                  key={`${item.code}-${index}`}
                  onClick={() => selectItem(item)}
                  className="w-full p-4 flex flex-col items-start gap-1 hover:bg-dracula-purple/20 transition-colors border-b border-dracula-comment/10 last:border-0"
                >
                  <span className="text-dracula-cyan text-xs font-mono font-bold uppercase tracking-wider">{item.code}</span>
                  <span className="text-dracula-fg text-sm text-left line-clamp-1">{item.description}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Content Area */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          {selectedItem ? (
            <motion.div
              key={selectedItem.code}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-dracula-selection/50 border border-dracula-comment/20 rounded-3xl p-6 shadow-xl relative overflow-hidden"
            >
              {/* Dracula Accent Glow */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-dracula-purple/10 rounded-full blur-3xl -z-10" />
              
              <div className="flex flex-col gap-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Hash className="w-4 h-4 text-dracula-comment" />
                      <span className="text-xs font-bold text-dracula-comment uppercase tracking-widest">Item Code</span>
                    </div>
                    <span className="text-2xl font-mono font-bold text-dracula-cyan">{selectedItem.code}</span>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-dracula-purple/20 text-dracula-purple text-[10px] font-black uppercase rounded-full tracking-tighter">
                      Verified Stock
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-dracula-bg p-4 rounded-2xl flex flex-col justify-center items-center gap-1 border border-dracula-comment/10">
                    <span className="text-[10px] uppercase font-bold text-dracula-comment tracking-widest">Quantity</span>
                    <span className={`text-4xl font-black ${selectedItem.quantity > 0 ? 'text-dracula-green' : 'text-dracula-red'}`}>
                      {selectedItem.quantity}
                    </span>
                  </div>
                  <div className="bg-dracula-bg p-4 rounded-2xl flex flex-col justify-center items-center gap-1 border border-dracula-comment/10">
                    <span className="text-[10px] uppercase font-bold text-dracula-comment tracking-widest">Unit</span>
                    <span className="text-2xl font-black text-dracula-orange">
                      {selectedItem.unit || 'N/A'}
                    </span>
                  </div>
                </div>
                
                {/* Description at the bottom of the card */}
                <div className="pt-4 border-t border-dracula-comment/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Text className="w-4 h-4 text-dracula-comment" />
                    <span className="text-xs font-bold text-dracula-comment uppercase tracking-widest">Full Description</span>
                  </div>
                  <p className="text-dracula-fg leading-relaxed text-sm p-4 bg-dracula-bg rounded-xl italic">
                    "{selectedItem.description}"
                  </p>
                </div>
              </div>
            </motion.div>
          ) : !searchQuery && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center p-12 text-center opacity-50"
            >
              <Package className="w-16 h-16 text-dracula-comment mb-4 stroke-1" />
              <p className="text-dracula-comment">Enter a code or description to lookup stock levels.</p>
            </motion.div>
          )}

          {searchQuery && !selectedItem && suggestions.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center p-12 text-center"
            >
              <AlertCircle className="w-12 h-12 text-dracula-red/50 mb-4" />
              <p className="text-dracula-comment italic">No items found matching "{searchQuery}"</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-8 py-6 text-center text-[10px] text-dracula-comment uppercase tracking-[0.2em] font-bold opacity-30">
        Inventory Database v1.0.0
      </footer>
    </div>
  );
}
