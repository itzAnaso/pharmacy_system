
// This hook is no longer needed with local authentication
// Kept for backward compatibility
import { useUser } from "@/lib/auth";

export const useSupabaseAuth = () => {
  const { user, isLoaded } = useUser();
  return { user, isLoaded };
};
