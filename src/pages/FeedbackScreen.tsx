import { useNavigate } from "react-router-dom";
import FeedbackForm from "@/components/FeedbackForm";

const FeedbackScreen = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen pb-24 max-w-lg mx-auto px-6 py-8">
      <FeedbackForm onClose={() => navigate("/profile")} />
    </div>
  );
};

export default FeedbackScreen;
