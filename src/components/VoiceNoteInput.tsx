import { useState, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface VoiceNoteInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// Check browser support - use any for cross-browser compatibility
const SpeechRecognition = typeof window !== 'undefined' 
  ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
  : null;

export function VoiceNoteInput({ 
  value, 
  onChange, 
  placeholder = "Scrivi o detta le note...",
  className 
}: VoiceNoteInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.lang = 'it-IT';
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      
      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onChange(value ? `${value} ${transcript}` : transcript);
      };
      
      recognitionInstance.onerror = (event: any) => {
        console.error('[VoiceNoteInput] Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
    }
  }, []);

  // Update onresult handler when value changes
  useEffect(() => {
    if (recognition) {
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onChange(value ? `${value} ${transcript}` : transcript);
      };
    }
  }, [value, recognition, onChange]);

  const toggleListening = () => {
    if (!recognition) return;
    
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-12 min-h-[100px] resize-none"
      />
      
      {isSupported && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggleListening}
          className={cn(
            "absolute right-2 bottom-2 h-8 w-8",
            isListening && "text-red-500 animate-pulse"
          )}
          title={isListening ? "Ferma registrazione" : "Dettatura vocale"}
        >
          {isListening ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </Button>
      )}
    </div>
  );
}
