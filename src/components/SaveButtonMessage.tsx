import { Heart } from "lucide-react";

const SaveButtonMessage = () => (
  <p className="text-[10px] text-muted-foreground/70 text-center mt-2 flex items-center justify-center gap-1">
    <Heart className="h-2.5 w-2.5" />
    Every record you add makes ComingHomeIQ more accurate for your neighborhood — and for the next family who calls this home.
  </p>
);

export default SaveButtonMessage;
