import { Input } from "@/components/ui/input";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchBar = ({ 
  value, 
  onChange, 
  placeholder = "Search..." 
}: SearchBarProps) => {
  return (
    <Input
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 w-full"
    />
  );
};

export default SearchBar;