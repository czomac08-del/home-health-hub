interface EditorialNoteProps {
  note: string;
}

const EditorialNote = ({ note }: EditorialNoteProps) => (
  <div className="rounded-xl border-l-[3px] border-primary bg-primary/5 p-4">
    <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1.5">🏠 ComingHomeIQ Note</p>
    <p className="text-xs text-foreground/80 leading-relaxed">{note}</p>
    <p className="text-[10px] text-muted-foreground/50 mt-3">
      This is ComingHomeIQ's assessment based on available data — not legal or professional advice.
    </p>
  </div>
);

export default EditorialNote;
