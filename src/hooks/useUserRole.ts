import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export type UserRole = "coordenador" | "visualizador" | null;

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;
        setRole(data?.role as UserRole || null);
      } catch (error) {
        console.error("Error fetching user role:", error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  return { 
    role, 
    loading, 
    isCoordenador: role === "coordenador",
    isVisualizador: role === "visualizador"
  };
};
