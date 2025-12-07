import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Globe } from 'lucide-react';
import { SUPPORTED_LANGUAGES, getPreferredLanguage, saveLanguagePreference, type LanguageOption } from '@/lib/language-config';

interface LanguageSelectorProps {
  selectedLanguage?: LanguageOption;
  onLanguageChange?: (language: LanguageOption) => void;
  className?: string;
}

export function LanguageSelector({ selectedLanguage, onLanguageChange, className }: LanguageSelectorProps) {
  const [currentLanguage, setCurrentLanguage] = useState<LanguageOption>(
    selectedLanguage || getPreferredLanguage()
  );

  const handleLanguageChange = (language: LanguageOption) => {
    setCurrentLanguage(language);
    saveLanguagePreference(language.code);
    onLanguageChange?.(language);
  };

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between bg-background hover:bg-muted/50 border-border"
          >
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-lg">{currentLanguage.flag}</span>
              <span className="font-medium">{currentLanguage.name}</span>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-full min-w-[200px]" align="start">
          {SUPPORTED_LANGUAGES.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language)}
              className={`flex items-center gap-3 cursor-pointer ${
                currentLanguage.code === language.code 
                  ? 'bg-primary/10 text-primary font-medium' 
                  : ''
              }`}
            >
              <span className="text-lg">{language.flag}</span>
              <div className="flex flex-col">
                <span className="font-medium">{language.name}</span>
                <span className="text-xs text-muted-foreground">{language.speechCode}</span>
              </div>
              {currentLanguage.code === language.code && (
                <div className="ml-auto w-2 h-2 bg-primary rounded-full" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}